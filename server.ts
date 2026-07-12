import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import multer from 'multer';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Gemini REST API ───────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function callGemini(
  systemInstruction: string,
  userMessage: string,
  history: { role: string; text: string }[] = [],
  useSearch = false
): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  const contents: any[] = [];
  for (const h of history) {
    contents.push({
      role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const body: any = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  // Google Search grounding — lets Gemini verify facts it is unsure about
  if (useSearch) {
    body.tools = [{ google_search: {} }];
  }

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();

  // Join all text parts — grounded responses can have multiple parts
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p: any) => p.text).map((p: any) => p.text).join('');

  if (!text.trim()) {
    const reason = data?.candidates?.[0]?.finishReason ?? 'unknown';
    console.error('Empty Gemini response. finishReason:', reason, JSON.stringify(data).slice(0, 400));
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
`You are Ruzivo, an AI study companion built specifically for Zimbabwean secondary school students preparing for ZIMSEC examinations.

PERSONALITY:
- You are warm, encouraging and conversational — like a knowledgeable older sibling or a favourite teacher
- You can chat naturally about stress, exam anxiety, study tips, or just general life — not just textbooks
- When a student seems frustrated or anxious, acknowledge it first before jumping into content
- Use light humour when appropriate. You can say things like "Okay let's break this down" or "Don't panic, this is actually simpler than it looks"
- Never sound robotic or overly formal

ZIMBABWE KNOWLEDGE (critical — you must know this):
- Education system: ECD → Primary (Grade 1-7) → Form 1-4 (O-Level) → Form 5-6 (A-Level) → Tertiary
- Examining body: ZIMSEC (Zimbabwe Schools Examinations Council), headquartered in Harare
- ZIMSEC O-Level grading: A(75-100), B(65-74), C(55-64), D(45-54), E(40-44), U(below 40)
- Common subjects: Maths (4028), English Language (1123), Combined Science (5129), Geography, History, Accounts (7110), Commerce, Heritage Studies
- ZIMSEC Paper structure: Paper 1 = MCQ, Paper 2 Section A = compulsory essays, Paper 2 Section B = case studies/data response, Paper 3 = practical
- School terms: Term 1 (Jan-Apr), Term 2 (May-Aug), Term 3 (Sep-Nov). Exams in Oct/Nov
- Notable schools: Prince Edward, St George's, Dominican Convent, Hartmann House, Arundel, Girls' High, Plumtree, Founders, Milton, Marist Brothers Dete
- Universities: UZ (University of Zimbabwe), NUST (Bulawayo), Chinhoyi, MSU (Mutare), ZOU (distance learning), Lupane State University
- Zimbabwe geography: 8 provinces + 2 metros (Harare, Bulawayo). Major cities: Harare, Bulawayo, Mutare, Gweru, Kwekwe, Masvingo, Chinhoyi
- Economy: mining (gold, diamonds, platinum — Zimplats, Mimosa), agriculture (tobacco, maize, cotton), tourism (Victoria Falls, Hwange, Great Zimbabwe)
- Companies students know: Econet Wireless, NetOne, Telecel, Delta Beverages, Innscor, OK Zimbabwe, TM Pick n Pay, Simbisa Brands (Chicken Inn), CBZ Bank, ZB Bank, FBC Bank
- Payment: EcoCash (dominant), InnBucks, OneMoney, ZiG (Zimbabwe Gold currency introduced 2024)
- Culture: sadza ne nyama/muriwo is the staple meal, braai/braii culture, soccer (ZIFA, Dynamos FC, Highlanders FC, CAPS United), music (Jah Prayzah, Winky D, Enzo Ishall, Selmor Mtukudzi)
- Heroes: Robert Mugabe (founding president), Joshua Nkomo (Father Zimbabwe), Simon Muzenda, Sally Mugabe, Mbuya Nehanda, Sekuru Kaguvi, Frederick Selous
- Current context: Zimbabwe uses ZiG currency, ZANU-PF governing party, President Emmerson Mnangagwa

CURRENT SESSION:
Topic: ${topicTitle ?? 'General study'}
Subject: ${subjectName ?? 'Unknown'}

ACADEMIC RULES:
- Use Zimbabwean examples in every explanation (Hwange Colliery for minerals, Delta Beverages for business, Zambezi for geography, etc.)
- When explaining concepts, relate them to things students see in daily life in Zimbabwe
- Always mention which paper and section a question type would appear in
- For worked examples, use realistic Zimbabwean figures and contexts
- Never just give answers — guide the student to understand

IMPORTANT: If you are not sure about something specific, say so honestly rather than making it up. You can search for current information when needed.

FORMATTING RULES (critical):
- For any mathematical expression, equation or formula use LaTeX notation: inline math with $...$ and display/block equations with $$...$$
- Examples: $x^2 + y^2 = r^2$, $E = mc^2$, $$\frac{-b \pm \sqrt{b^2-4ac}}{2a}$$
- For chemistry: use LaTeX for formulas — $H_2O$, $CO_2$, $H_2SO_4$, $\rightarrow$, $\rightleftharpoons$
- For physics: $F = ma$, $v = u + at$, $E_k = \frac{1}{2}mv^2$
- CRITICAL: every LaTeX command must include its leading backslash exactly as written — \frac, \sqrt, \int, \sum, \cdot, \infty, \rightarrow, \alpha, \pi etc. Never drop the backslash or the first letter of a command.
- For CS binary/hex: use fenced code blocks with language tag e.g. \`\`\`binary or \`\`\`vb.net or \`\`\`sql or \`\`\`python
- For ALL multi-line code: ALWAYS use triple backtick fenced blocks with the language name — NEVER paste code as plain text
- For tables: ALWAYS use proper markdown tables with | headers | and |---|---| separator rows — NEVER use ASCII art or pipe diagrams to draw UI mockups
- NEVER draw ASCII diagrams or UI mockups using pipes and dashes — describe them in words instead
- Use **bold** for key terms, *italic* for emphasis, ### for section headings within a response
- Use numbered lists for steps, bullet points for features or lists of items`;



    // Convert chat history to the format callGemini expects
    const historyForGemini = (history ?? []).map((h: { role: string; content: string }) => ({
      role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
      text: h.content,
    }));

    const reply = await callGemini(systemInstruction, message, historyForGemini, true);
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
// ADMIN — Custom topics (notes editor)
// ────────────────────────────────────────────────────────────
app.get('/api/custom-topics', async (_req, res): Promise<void> => {
  const { data, error } = await supabaseAdmin
    .from('custom_topics')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data ?? []);
});

app.post('/api/admin/topics', requireAuth, requireAdmin, async (req: any, res: any): Promise<void> => {
  const { subjectId, level, title, summary, contentMarkdown, mcqs, essayPrompt, essayRubric, readXp, isOverride, overrideTopicId } = req.body;
  if (!subjectId || !title || !contentMarkdown) {
    res.status(400).json({ error: 'subjectId, title and contentMarkdown are required' });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from('custom_topics')
    .insert({
      subject_id: subjectId, level: level ?? 'o', title, summary: summary ?? '',
      content_markdown: contentMarkdown, mcqs: mcqs ?? [], essay_prompt: essayPrompt ?? null,
      essay_rubric: essayRubric ?? [], read_xp: readXp ?? 10,
      is_override: isOverride ?? false, override_topic_id: overrideTopicId ?? null,
      created_by: req.user.id,
    })
    .select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ topic: data });
});

app.put('/api/admin/topics/:id', requireAuth, requireAdmin, async (req: any, res: any): Promise<void> => {
  const { id } = req.params;
  const { title, summary, contentMarkdown, mcqs, essayPrompt, essayRubric, readXp } = req.body;
  const { data, error } = await supabaseAdmin
    .from('custom_topics')
    .update({
      title, summary, content_markdown: contentMarkdown,
      mcqs: mcqs ?? [], essay_prompt: essayPrompt ?? null,
      essay_rubric: essayRubric ?? [], read_xp: readXp ?? 10,
    })
    .eq('id', id).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ topic: data });
});

app.delete('/api/admin/topics/:id', requireAuth, requireAdmin, async (req: any, res: any): Promise<void> => {
  const { error } = await supabaseAdmin.from('custom_topics').delete().eq('id', req.params.id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ success: true });
});

// ── File upload config ──────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed (PNG, JPG, WEBP, SVG, GIF)'));
  },
});

// ────────────────────────────────────────────────────────────
// ADMIN — AI-assisted note formatting / generation
// ────────────────────────────────────────────────────────────
app.post('/api/admin/format-notes', requireAuth, requireAdmin, essayLimiter, async (req: any, res: any): Promise<void> => {
  const { rawText, mode, subjectName, topicTitle, instructions } = req.body;
  // mode: 'format' (clean up existing text) or 'generate' (write from scratch)

  if (mode === 'format' && !rawText?.trim()) {
    res.status(400).json({ error: 'rawText is required for format mode' });
    return;
  }
  if (mode === 'generate' && !topicTitle?.trim()) {
    res.status(400).json({ error: 'topicTitle is required for generate mode' });
    return;
  }
  if (!GEMINI_API_KEY) {
    res.status(503).json({ error: 'AI formatting is not configured on this server.' });
    return;
  }

  try {
    const systemInstruction =
`You are a ZIMSEC curriculum content formatter. You convert lesson notes into clean, well-structured markdown that matches this EXACT formatting system:

HEADINGS:
- Use ## for major sections (e.g. "## Key Concepts")
- Use ### for subsections
- Never use # (single hash) — reserved for the topic title itself, not used in body content

MATH & SCIENCE NOTATION:
- Inline math: $x^2 + y^2$  |  Display/block equations: $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
- Always include the full backslash for every LaTeX command: \\frac, \\sqrt, \\int, \\sum, \\cdot, \\infty, \\alpha, \\rightarrow etc. Never drop a backslash or letter.
- Chemistry formulas in LaTeX: $H_2O$, $CO_2$, $\\rightarrow$, $\\rightleftharpoons$

KEY POINT CALLOUTS:
- Highlight the single most important takeaway of a section using EXACTLY this format on one line:
  > **Key point:** <the key point text>
- Use sparingly — one per major section at most

TABLES:
- Use proper markdown tables with | headers | and |---|---| separator rows for any comparison, classification, or structured data

LISTS:
- Numbered lists (1. 2. 3.) for sequential steps, exercises, or ranked items
- Bullet lists (- item) for unordered feature lists

CODE (for Computer Science topics only):
- Use fenced code blocks with language tag: \`\`\`python \`\`\`sql \`\`\`vb.net etc.

EXERCISES:
- End major topics with a "### Exercise" section containing 2-4 numbered practice questions in ZIMSEC style (command words: State, Explain, Calculate, Describe, Show that, Define)

ZIMBABWE CONTEXT:
- Use Zimbabwean examples where natural (Hwange Colliery, Delta Beverages, EcoCash, Great Zimbabwe, Zambezi River, local school names) — but do not force them if irrelevant to the topic

Subject: ${subjectName ?? 'Unknown'}
Topic: ${topicTitle ?? 'Unknown'}
${instructions ? `Additional instructions from the admin: ${instructions}` : ''}

Respond with ONLY the formatted markdown content. No preamble, no explanation, no "Here is your formatted content" — just the clean markdown ready to paste directly into the lesson.`;

    const userMessage = mode === 'generate'
      ? `Write complete, well-structured ZIMSEC-aligned lesson notes for the topic "${topicTitle}" in ${subjectName ?? 'this subject'}. Include an introduction, 2-4 key sections with explanations and worked examples where relevant, at least one Key Point callout, and end with an Exercise section.`
      : `Format and clean up the following rough notes into the required markdown structure. Preserve all factual content — do not remove information, only reformat, fix math notation, and improve structure/clarity:\n\n${rawText}`;

    const formatted = await callGemini(systemInstruction, userMessage, [], false);
    res.json({ markdown: formatted.trim() });
  } catch (err: any) {
    console.error('Format notes error:', err.message);
    res.status(500).json({ error: 'AI formatting failed. Please try again.' });
  }
});

// ────────────────────────────────────────────────────────────
// ADMIN — Upload diagram image to Supabase Storage
// ────────────────────────────────────────────────────────────
app.post('/api/admin/upload-image', requireAuth, requireAdmin, upload.single('image'), async (req: any, res: any): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  try {
    const ext = req.file.originalname.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `notes/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('diagrams')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '31536000', // 1 year — images are immutable once uploaded
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError.message);
      res.status(500).json({ error: 'Upload failed: ' + uploadError.message });
      return;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('diagrams')
      .getPublicUrl(filePath);

    res.json({ url: publicUrlData.publicUrl });
  } catch (err: any) {
    console.error('Image upload error:', err.message);
    res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
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
