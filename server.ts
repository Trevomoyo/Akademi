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

// ── PayNow config ────────────────────────────────────────────
const PAYNOW_INTEGRATION_ID  = process.env.PAYNOW_INTEGRATION_ID;
const PAYNOW_INTEGRATION_KEY  = process.env.PAYNOW_INTEGRATION_KEY;
const PAYNOW_RESULT_URL       = process.env.PAYNOW_RESULT_URL  ?? 'http://localhost:3001/api/webhooks/paynow';
const PAYNOW_RETURN_URL       = process.env.PAYNOW_RETURN_URL  ?? 'http://localhost:5173/subscribe';
const PAYNOW_ENABLED          = !!(PAYNOW_INTEGRATION_ID && PAYNOW_INTEGRATION_KEY);

const PRICE_USD = 1;    // $1/month
const PRICE_ZIG = 36;   // ZiG equivalent
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
  const { essay, prompt, rubric, topicTitle, topicId } = req.body;

  if (!essay || !prompt) {
    res.status(400).json({ error: 'essay and prompt are required' });
    return;
  }

  try {
    const rubricText = Array.isArray(rubric) && rubric.length
      ? `\nAward marks for each of these criteria:\n${rubric.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}`
      : '';

    const userPrompt = `Topic: ${topicTitle ?? 'Unknown'}
Essay question: ${prompt}${rubricText}

Student's answer:
${essay}

Respond ONLY with valid JSON (no markdown, no backticks, no preamble):
{"score": <0-100>, "grade": "<A/B/C/D/E/U>", "feedback": "<2-3 sentences of specific constructive feedback>", "strengths": ["<point>", "<point>"], "improvements": ["<point>", "<point>"]}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: `You are an experienced ZIMSEC examiner marking O-Level and A-Level essays.
Be fair, specific, and constructive. Use the ZIMSEC grading scale:
A (75-100%), B (65-74%), C (55-64%), D (45-54%), E (40-44%), U (below 40%).
Always reference the student's actual words in your feedback.
Return ONLY a valid JSON object — no markdown, no extra text.`,
      },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    });

    const raw = response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!raw.trim()) {
      console.error('Grade essay: empty response from Gemini');
      res.status(500).json({ error: 'AI grading failed. Please try again.' });
      return;
    }

    const clean = raw.replace(/```json|```/g, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error('Grade essay: invalid JSON from Gemini:', raw.slice(0, 200));
      res.status(500).json({ error: 'AI returned an invalid response. Please try again.' });
      return;
    }

    // Persist essay score to topic_progress
    if (topicId) {
      await supabaseAdmin
        .from('topic_progress')
        .upsert(
          { user_id: req.user.id, topic_id: topicId, essay_score: parsed.score, read_complete: true, mcq_score: 0 },
          { onConflict: 'user_id,topic_id' }
        );
    }

    res.json(parsed);
  } catch (err: any) {
    console.error('Grade essay error:', err?.message ?? err);
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
    // Build alternating user/model history Gemini requires strict alternation
    const conversationHistory = (history ?? []).map((h: { role: string; content: string }) => ({
      role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));
    conversationHistory.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction: `You are an expert ZIMSEC tutor helping a Zimbabwean secondary school student.
Current topic: ${topicTitle ?? 'General study'}
Subject: ${subjectName ?? 'Unknown'}
- Keep answers focused (3-6 sentences unless asked to elaborate)
- Use Zimbabwe-specific examples (Zambezi, Hwange, sadza, EcoCash)
- Use numbered steps for processes, bullet points for lists
- Relate answers to what ZIMSEC examiners expect
- Give the textbook definition first then explain it simply`,
      },
      contents: conversationHistory,
    });

    const reply =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      (response as any)?.text ??
      '';

    if (!reply.trim()) {
      console.error('AI chat: empty response', JSON.stringify(response).slice(0, 300));
      res.status(500).json({ error: 'Empty response from AI. Please try again.' });
      return;
    }

    res.json({ reply });
  } catch (err: any) {
    console.error('AI chat error:', err?.message ?? err);
    res.status(500).json({ error: 'Tutor is unavailable right now. Please try again.' });
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

  const amount = currency === 'usd' ? PRICE_USD : PRICE_ZIG;
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

  let paynowRedirectUrl = `https://www.paynow.co.zw/payment/initiate?ref=${paynowRef}`;

  if (PAYNOW_ENABLED) {
    // Real PayNow API call — initiate the payment
    try {
      // PayNow expects a URL-encoded POST to their initiate endpoint
      const params = new URLSearchParams({
        id: PAYNOW_INTEGRATION_ID!,
        reference: paynowRef,
        amount: amount.toFixed(2),
        additionalinfo: 'Akademi monthly subscription',
        returnurl: PAYNOW_RETURN_URL,
        resulturl: PAYNOW_RESULT_URL,
        status: 'Message',
        hash: '',  // TODO: compute HMAC-SHA512 hash using PAYNOW_INTEGRATION_KEY
      });
      // Uncomment when hash computation is implemented:
      // const pnRes = await fetch('https://www.paynow.co.zw/interface/remotetransaction', { method: 'POST', body: params });
      // const pnText = await pnRes.text();
      // parse pnText for browserurl or redirecturl
    } catch (e) {
      console.error('PayNow initiate error:', e);
    }
  }

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
