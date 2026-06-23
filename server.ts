import 'dotenv/config';        // ← must be first — loads .env into process.env
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Supabase service-role client (never exposed to browser) ──
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Gemini ───────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

app.use(cors({ origin: process.env.APP_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── Auth middleware — verifies Supabase JWT from Authorization header ──
async function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
}

// ── Admin middleware — checks is_admin flag in profiles table ──
async function requireAdmin(req: any, res: any, next: any) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', req.user.id)
    .single();

  if (!data?.is_admin) return res.status(403).json({ error: 'Admin only' });
  next();
}

// ────────────────────────────────────────────────────────────
// HEALTH
// ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

// ────────────────────────────────────────────────────────────
// ESSAY GRADING
// ────────────────────────────────────────────────────────────
app.post('/api/grade-essay', requireAuth, async (req: any, res: any): Promise<void> => {
  const { essay, prompt, rubric, topicTitle } = req.body;

  if (!essay || !prompt) {
    res.status(400).json({ error: 'essay and prompt are required' });
    return;
  }

  try {
    const rubricText = Array.isArray(rubric) && rubric.length
      ? `\nRubric criteria (award marks for each):\n${rubric.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}`
      : '';

    const systemPrompt = `You are an experienced ZIMSEC examiner marking an O-Level or A-Level essay.
Topic: ${topicTitle ?? 'Unknown'}
Essay question: ${prompt}${rubricText}

Score the essay out of 100 based on:
- Accuracy of content (40%)
- Use of specific evidence and examples (30%)
- Clarity and structure of argument (20%)
- Command of English (10%)

Respond ONLY with valid JSON in this exact format (no markdown, no preamble):
{"score": <number 0-100>, "grade": "<A/B/C/D/E/U>", "feedback": "<2-3 sentences of specific, constructive feedback>", "strengths": ["<point>", "<point>"], "improvements": ["<point>", "<point>"]}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\nStudent essay:\n' + essay }] }],
    });

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Persist essay score to topic_progress
    if (req.body.topicId) {
      await supabaseAdmin
        .from('topic_progress')
        .upsert(
          { user_id: req.user.id, topic_id: req.body.topicId, essay_score: parsed.score, read_complete: true, mcq_score: 0 },
          { onConflict: 'user_id,topic_id' }
        );
    }

    res.json(parsed);
  } catch (err: any) {
    console.error('Grade essay error:', err);
    res.status(500).json({ error: 'Grading failed. Please try again.' });
  }
});

// ────────────────────────────────────────────────────────────
// AI CHAT (study tutor)
// ────────────────────────────────────────────────────────────
app.post('/api/ai-chat', requireAuth, async (req: any, res: any): Promise<void> => {
  const { message, history, topicTitle, subjectName } = req.body;

  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  try {
    const systemContext = `You are Akademì's AI study tutor helping a Zimbabwean secondary school student.
Current topic: ${topicTitle ?? 'General study'}
Subject: ${subjectName ?? 'Unknown'}
Keep answers concise, clear, and curriculum-relevant (ZIMSEC syllabus).
Use examples relevant to Zimbabwe where possible.`;

    const contents = [
      { role: 'user', parts: [{ text: systemContext }] },
      { role: 'model', parts: [{ text: 'Understood. I will help with ZIMSEC-aligned content.' }] },
      ...(history ?? []).map((h: { role: string; content: string }) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
    });

    const reply = response.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not generate a response.';
    res.json({ reply });
  } catch (err: any) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'Chat failed. Please try again.' });
  }
});

// ────────────────────────────────────────────────────────────
// SUBSCRIPTIONS — Initiate (server creates DB record + PayNow request)
// ────────────────────────────────────────────────────────────
app.post('/api/subscriptions/initiate', requireAuth, async (req: any, res: any): Promise<void> => {
  const { phone, method, currency } = req.body;

  if (!phone || !method || !currency) {
    res.status(400).json({ error: 'phone, method, and currency are required' });
    return;
  }

  const amount = currency === 'usd' ? 8 : 180;
  const pollToken = 'AKD_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const paynowRef = 'AKD-' + Date.now().toString().slice(-8);

  // Persist the pending transaction
  const { error: dbErr } = await supabaseAdmin.from('subscriptions').insert({
    user_id: req.user.id,
    poll_token: pollToken,
    paynow_ref: paynowRef,
    amount,
    currency,
    method,
    status: 'pending',
  });

  if (dbErr) {
    res.status(500).json({ error: 'Could not create subscription record' });
    return;
  }

  // TODO: call real PayNow API here when merchant account is ready
  // const paynowRedirectUrl = await callPaynowAPI({ phone, method, amount, currency, reference: paynowRef });
  const paynowRedirectUrl = `https://www.paynow.co.zw/payment/initiate?ref=${paynowRef}`;

  res.json({ pollToken, reference: paynowRef, paynowRedirectUrl });
});

// ────────────────────────────────────────────────────────────
// SUBSCRIPTIONS — Poll status
// ────────────────────────────────────────────────────────────
app.get('/api/subscriptions/status', requireAuth, async (req: any, res: any): Promise<void> => {
  const { token } = req.query;
  if (!token) {
    res.status(400).json({ error: 'token is required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('status, user_id')
    .eq('poll_token', token)
    .single();

  if (error || !data) {
    res.status(404).json({ error: 'Token not found' });
    return;
  }

  // Safety: only owner can poll
  if (data.user_id !== req.user.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  res.json({ status: data.status });
});

// ────────────────────────────────────────────────────────────
// SUBSCRIPTIONS — PayNow webhook (called by PayNow on payment)
// ────────────────────────────────────────────────────────────
app.post('/api/webhooks/paynow', async (req: any, res: any): Promise<void> => {
  // PayNow sends form-encoded data; parse the reference and status
  const { reference, status, paynowreference } = req.body;

  // TODO: verify PayNow hash signature here using your integration key
  // const valid = verifyPaynowHash(req.body, process.env.PAYNOW_INTEGRATION_KEY!);
  // if (!valid) { res.status(400).send('Invalid signature'); return; }

  const isPaid = status?.toLowerCase() === 'paid';

  if (isPaid && reference) {
    // Update subscription status
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('paynow_ref', reference)
      .select('user_id')
      .single();

    if (sub?.user_id) {
      // Activate the user's profile subscription
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', sub.user_id);
    }
  }

  res.send('OK');
});

// ────────────────────────────────────────────────────────────
// ADMIN — Add past paper
// ────────────────────────────────────────────────────────────
app.post('/api/admin/papers', requireAuth, requireAdmin, async (req: any, res: any): Promise<void> => {
  const { subjectId, year, paperNumber, level, fileUrl, title } = req.body;

  if (!subjectId || !year || !paperNumber || !level) {
    res.status(400).json({ error: 'subjectId, year, paperNumber, and level are required' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('past_papers')
    .insert({
      subject_id: subjectId,
      year: parseInt(year),
      paper_number: parseInt(paperNumber),
      level,
      file_url: fileUrl || null,
      title: title || null,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ paper: data });
});

// ────────────────────────────────────────────────────────────
// ADMIN — Grant admin role
// ────────────────────────────────────────────────────────────
app.post('/api/admin/grant', requireAuth, requireAdmin, async (req: any, res: any): Promise<void> => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true });
});

// ── Serve built frontend in production ───────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Akademì server running on port ${PORT}`);
});
