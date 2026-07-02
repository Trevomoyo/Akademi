import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Gemini REST API ───────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function callGemini(systemInstruction: string, userMessage: string, history: { role: string; text: string }[] = []): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  // Build contents array with strict alternating user/model turns
  const contents: any[] = [];

  for (const h of history) {
    contents.push({
      role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text.trim()) {
    const reason = data?.candidates?.[0]?.finishReason ?? 'unknown';
    throw new Error(`Empty response from Gemini (finishReason: ${reason})`);
  }

  return text;
}

// ── Supabase service-role client ─────────────────────────────
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── PayNow config ────────────────────────────────────────────
const PAYNOW_INTEGRATION_ID  = process.env.PAYNOW_INTEGRATION_ID;
const PAYNOW_INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY;
const PAYNOW_RESULT_URL      = process.env.PAYNOW_RESULT_URL ?? 'http://localhost:3001/api/webhooks/paynow';
const PAYNOW_RETURN_URL      = process.env.PAYNOW_RETURN_URL ?? 'http://localhost:5173/subscribe';
const PAYNOW_ENABLED         = !!(PAYNOW_INTEGRATION_ID && PAYNOW_INTEGRATION_KEY);

const PRICE_USD = 1;
const PRICE_ZIG = 36;

// ── Rate limiters ─────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many chat requests. Please wait a moment.' },
});

const essayLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many grading requests. Please wait a moment.' },
});

// ── Middleware ────────────────────────────────────────────────
// ── CORS — allow the deployed frontend URL ────────────────────
const allowedOrigins = (process.env.APP_URL ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn('WARNING: APP_URL is not set. CORS will block all browser requests in production.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50kb' }));

// ── Auth middleware ───────────────────────────────────────────
async function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) { res.status(401).json({ error: 'Invalid token' }); return; }

  req.user = user;
  next();
}

// ── Admin middleware ──────────────────────────────────────────
async function requireAdmin(req: any, res: any, next: any) {
  const { data } = await supabaseAdmin
    .from('profiles').select('is_admin').eq('id', req.user.id).single();
  if (!data?.is_admin) { res.status(403).json({ error: 'Admin only' }); return; }
  next();
}

// ────────────────────────────────────────────────────────────
// HEALTH
// ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    ts: Date.now(),
    gemini: !!GEMINI_API_KEY,
    supabase: !!process.env.SUPABASE_URL,
    paynow: PAYNOW_ENABLED,
  });
});

// ────────────────────────────────────────────────────────────
// ESSAY GRADING
// ────────────────────────────────────────────────────────────
app.post('/api/grade-essay', requireAuth, essayLimiter, async (req: any, res: any): Promise<void> => {
  const { essay, prompt, rubric, topicTitle, topicId } = req.body;

  if (!essay?.trim() || !prompt?.trim()) {
    res.status(400).json({ error: 'essay and prompt are required' });
    return;
  }

  if (!GEMINI_API_KEY) {
    res.status(503).json({ error: 'AI grading is not configured on this server.' });
    return;
  }

  try {
    const rubricText = Array.isArray(rubric) && rubric.length
      ? `\nAward marks for each criterion:\n${rubric.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}`
      : '';

    const userPrompt =
`Topic: ${topicTitle ?? 'Unknown'}
Question: ${prompt}${rubricText}

Student answer:
${essay}

Respond ONLY with this exact JSON structure (no markdown, no extra text):
{"score": <integer 0-100>, "grade": "<A|B|C|D|E|U>", "feedback": "<2-3 sentences>", "strengths": ["<point>", "<point>"], "improvements": ["<point>", "<point>"]}`;

    const systemInstruction =
`You are an experienced ZIMSEC examiner marking O-Level and A-Level student work.
ZIMSEC grade boundaries: A=75-100, B=65-74, C=55-64, D=45-54, E=40-44, U=below 40.
Be specific — reference the student's actual words.
Return ONLY a valid JSON object. No markdown fences, no preamble, no explanation outside the JSON.`;

    const raw = await callGemini(systemInstruction, userPrompt);
    const clean = raw.replace(/```json|```/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error('Grade essay: invalid JSON:', clean.slice(0, 300));
      res.status(500).json({ error: 'AI returned an invalid response. Please try again.' });
      return;
    }

    // Persist to DB
    if (topicId) {
      await supabaseAdmin.from('topic_progress').upsert(
        { user_id: req.user.id, topic_id: topicId, essay_score: parsed.score, read_complete: true, mcq_score: 0 },
        { onConflict: 'user_id,topic_id' }
      );
    }

    res.json(parsed);
  } catch (err: any) {
    console.error('Grade essay error:', err.message);
    res.status(500).json({ error: 'Grading failed. Please try again.' });
  }
});

// ────────────────────────────────────────────────────────────
// AI CHAT (study tutor)
// ────────────────────────────────────────────────────────────
app.post('/api/ai-chat', requireAuth, chatLimiter, async (req: any, res: any): Promise<void> => {
  const { message, history, topicTitle, subjectName } = req.body;

  if (!message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  if (!GEMINI_API_KEY) {
    res.status(503).json({ error: 'AI tutor is not configured on this server.' });
    return;
  }

  try {
    const systemInstruction =
`You are an expert ZIMSEC tutor helping a Zimbabwean secondary school student.
Current topic: ${topicTitle ?? 'General study'}
Subject: ${subjectName ?? 'Unknown'}
Rules:
- Keep answers concise and focused (3-6 sentences unless asked to elaborate)
- Use Zimbabwe-specific examples where relevant (Zambezi, Hwange, sadza, EcoCash, Great Zimbabwe)
- Use numbered steps for processes, bullet points for lists
- Always relate back to what ZIMSEC examiners expect in Paper 1 or Paper 2
- Give the textbook definition first, then explain it in simple terms
- Never mention that you are an AI model or reference your training`;

    // Convert chat history to the format callGemini expects
    const historyForGemini = (history ?? []).map((h: { role: string; content: string }) => ({
      role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
      text: h.content,
    }));

    const reply = await callGemini(systemInstruction, message, historyForGemini);
    res.json({ reply });
  } catch (err: any) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ error: 'Tutor is unavailable right now. Please try again.' });
  }
});

// ────────────────────────────────────────────────────────────
// SUBSCRIPTIONS — Initiate
// ────────────────────────────────────────────────────────────
app.post('/api/subscriptions/initiate', requireAuth, async (req: any, res: any): Promise<void> => {
  const { phone, method, currency } = req.body;

  if (!phone || !method || !currency) {
    res.status(400).json({ error: 'phone, method, and currency are required' });
    return;
  }

  const amount     = currency === 'usd' ? PRICE_USD : PRICE_ZIG;
  const pollToken  = 'AKD_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const paynowRef  = 'AKD-' + Date.now().toString().slice(-8);

  const { error: dbErr } = await supabaseAdmin.from('subscriptions').insert({
    user_id: req.user.id, poll_token: pollToken, paynow_ref: paynowRef,
    amount, currency, method, status: 'pending',
  });

  if (dbErr) { res.status(500).json({ error: 'Could not create subscription record' }); return; }

  let paynowRedirectUrl = `https://www.paynow.co.zw/payment/initiate?ref=${paynowRef}`;

  if (PAYNOW_ENABLED) {
    // TODO: compute HMAC-SHA512 hash and call PayNow API
    // const hash = computePaynowHash(PAYNOW_INTEGRATION_KEY!, { id: PAYNOW_INTEGRATION_ID, reference: paynowRef, amount, ... });
    console.log('PayNow initiate:', { paynowRef, amount, currency, method });
  }

  res.json({ pollToken, reference: paynowRef, paynowRedirectUrl });
});

// ────────────────────────────────────────────────────────────
// SUBSCRIPTIONS — Poll status
// ────────────────────────────────────────────────────────────
app.get('/api/subscriptions/status', requireAuth, async (req: any, res: any): Promise<void> => {
  const { token } = req.query;
  if (!token) { res.status(400).json({ error: 'token is required' }); return; }

  const { data, error } = await supabaseAdmin
    .from('subscriptions').select('status, user_id').eq('poll_token', token).single();

  if (error || !data) { res.status(404).json({ error: 'Token not found' }); return; }
  if (data.user_id !== req.user.id) { res.status(403).json({ error: 'Forbidden' }); return; }

  res.json({ status: data.status });
});

// ────────────────────────────────────────────────────────────
// SUBSCRIPTIONS — PayNow webhook
// ────────────────────────────────────────────────────────────
app.post('/api/webhooks/paynow', async (req: any, res: any): Promise<void> => {
  const { reference, status } = req.body;
  // TODO: verify PayNow hash signature before trusting this

  if (status?.toLowerCase() === 'paid' && reference) {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('paynow_ref', reference)
      .select('user_id').single();

    if (sub?.user_id) {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await supabaseAdmin.from('profiles').update({
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
      }).eq('id', sub.user_id);
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

  const { data, error } = await supabaseAdmin.from('past_papers').insert({
    subject_id: subjectId, year: parseInt(year), paper_number: parseInt(paperNumber),
    level, file_url: fileUrl || null, title: title || null,
  }).select().single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ paper: data });
});

// ────────────────────────────────────────────────────────────
// ADMIN — Grant admin role
// ────────────────────────────────────────────────────────────
app.post('/api/admin/grant', requireAuth, requireAdmin, async (req: any, res: any): Promise<void> => {
  const { userId } = req.body;
  if (!userId) { res.status(400).json({ error: 'userId required' }); return; }

  const { error } = await supabaseAdmin.from('profiles').update({ is_admin: true }).eq('id', userId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

// ── Serve Vite build in production ───────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Gemini: ${GEMINI_API_KEY ? '✓ configured' : '✗ GEMINI_API_KEY missing'}`);
  console.log(`PayNow: ${PAYNOW_ENABLED ? '✓ configured' : '○ not configured (dev mode)'}`);
});
