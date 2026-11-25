import type { Request, Response } from 'express';

export type AiProvider = 'grok' | 'claude';
type ChatMessage = { role: 'user' | 'assistant'; content: string };

type AuthedRequest = Request & { userId: string };
const SYSTEM_PROMPT = `You are VibeConnect AI, a thoughtful, capable conversational assistant inside VibeConnect, a creator-brand collaboration platform. Speak naturally like a helpful expert teammate, not like a scripted bot. You can discuss creator growth, brand partnerships, influencer marketing, campaign strategy, content planning, pricing, negotiation, media kits, analytics, social media, business, coding, and general questions. Match the user's language and tone: understand and reply naturally in English, Hindi, or Hinglish. If the user writes in Hinglish, reply in clear, friendly Hinglish. Give complete, practical answers with examples and step-by-step guidance when useful. Ask one focused follow-up only when necessary. Never claim to have accessed private account data or performed an action unless the app actually provides that capability. Be transparent when something is an estimate. Use Markdown for readable formatting. Keep the conversation context from the messages provided.`;

const requestWindows = new Map<string, number[]>();
function isRateLimited(userId: string) {
  const now = Date.now();
  const recent = (requestWindows.get(userId) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 20) return true;
  recent.push(now);
  requestWindows.set(userId, recent);
  return false;
}

function sendSse(res: Response, payload: Record<string, unknown>) {
  if (!res.writableEnded) res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function readError(response: globalThis.Response) {
  const raw = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string }; message?: string };
    return parsed.error?.message || parsed.message || response.statusText;
  } catch {
    return raw.slice(0, 500) || response.statusText;
  }
}

async function streamProvider(response: globalThis.Response, provider: AiProvider, res: Response) {
  if (!response.body) throw new Error('The AI provider returned an empty response stream.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let eventName = '';
  const processBlock = (block: string) => {
    let data = '';
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    if (!data || data === '[DONE]') return;
    try {
      const parsed = JSON.parse(data) as Record<string, any>;
      if (provider === 'grok') {
        if (parsed.type === 'response.output_text.delta' && typeof parsed.delta === 'string') sendSse(res, { content: parsed.delta });
        if (parsed.type === 'response.failed') sendSse(res, { error: parsed.response?.error?.message || 'Grok could not complete this response.' });
        if (parsed.type === 'error') sendSse(res, { error: parsed.error?.message || 'Grok returned an error.' });
      } else {
        if (parsed.type === 'content_block_delta' && typeof parsed.delta?.text === 'string') sendSse(res, { content: parsed.delta.text });
        if (parsed.type === 'error') sendSse(res, { error: parsed.error?.message || 'Claude returned an error.' });
      }
    } catch {
      if (eventName === 'error') sendSse(res, { error: 'The AI provider sent an unreadable event.' });
    } finally {
      eventName = '';
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? '';
      blocks.forEach(processBlock);
      if (done) break;
    }
    if (buffer.trim()) processBlock(buffer);
  } finally {
    reader.releaseLock();
  }
}

export function registerAiRoutes(app: import('express').Express, requireAuth: import('express').RequestHandler) {
  app.get('/api/ai/status', requireAuth, (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({
      providers: {
        grok: { configured: Boolean(process.env.XAI_API_KEY), model: process.env.XAI_MODEL || 'grok-4.7' },
        claude: { configured: Boolean(process.env.ANTHROPIC_API_KEY), model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6' },
      },
      defaultProvider: process.env.AI_DEFAULT_PROVIDER === 'claude' ? 'claude' : 'grok',
    });
  });

  app.post('/api/ai/chat', requireAuth, async (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const provider: AiProvider = req.body?.provider === 'claude' ? 'claude' : 'grok';
    const shouldStream = req.body?.stream !== false;
    const apiKey = provider === 'grok' ? process.env.XAI_API_KEY : process.env.ANTHROPIC_API_KEY;
    const model = provider === 'grok'
      ? (process.env.XAI_MODEL || 'grok-4.7')
      : (process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6');

    if (isRateLimited(userId)) return res.status(429).json({ message: 'You have sent several messages. Please wait a minute and try again.' });
    if (!apiKey) return res.status(503).json({ message: `${provider === 'grok' ? 'Grok' : 'Claude'} is not configured. Add ${provider === 'grok' ? 'XAI_API_KEY' : 'ANTHROPIC_API_KEY'} to backend/.env and restart the backend.` });

    const incoming = req.body?.messages;
    if (!Array.isArray(incoming) || incoming.length === 0) return res.status(400).json({ message: 'Please send at least one chat message.' });
    const messages: ChatMessage[] = incoming.slice(-30).map((item: any): ChatMessage => ({
      role: item?.role === 'assistant' ? 'assistant' : 'user',
      content: typeof item?.content === 'string' ? item.content.trim().slice(0, 12_000) : '',
    })).filter((item: ChatMessage) => item.content.length > 0);
    if (!messages.length || messages[messages.length - 1].role !== 'user') return res.status(400).json({ message: 'The latest message must be a user message.' });
    if (messages.reduce((total, item) => total + item.content.length, 0) > 45_000) return res.status(413).json({ message: 'This conversation is too long. Start a new chat or shorten the message history.' });

    const controller = new AbortController();
    res.on('close', () => { if (!res.writableEnded) controller.abort(); });

    try {
      const endpoint = provider === 'grok' ? 'https://api.x.ai/v1/responses' : 'https://api.anthropic.com/v1/messages';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let body: Record<string, unknown>;
      if (provider === 'grok') {
        headers.Authorization = `Bearer ${apiKey}`;
        body = { model, instructions: SYSTEM_PROMPT, input: messages, max_output_tokens: 4096, stream: shouldStream, store: false };
      } else {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = { model, system: SYSTEM_PROMPT, messages, max_tokens: 4096, stream: shouldStream };
      }

      const upstream = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
      if (!upstream.ok) {
        const detail = await readError(upstream);
        console.error(`[AI:${provider}] upstream ${upstream.status}: ${detail}`);
        return res.status(upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status).json({ message: `The ${provider === 'grok' ? 'Grok' : 'Claude'} service returned an error (${upstream.status}). ${upstream.status === 401 || upstream.status === 403 ? 'Check the API key in backend/.env.' : 'Please try again shortly.'}` });
      }

      if (!shouldStream) {
        const data = await upstream.json() as any;
        const content = provider === 'grok'
          ? (data.output ?? []).flatMap((item: any) => item.content ?? []).filter((block: any) => block.type === 'output_text').map((block: any) => block.text).join('\n')
          : (data.content ?? []).filter((block: any) => block.type === 'text').map((block: any) => block.text).join('\n');
        return res.json({ role: 'assistant', content: content || 'I could not generate a response. Please try again.' });
      }

      res.status(200).set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.flushHeaders();
      await streamProvider(upstream, provider, res);
      sendSse(res, { done: true });
      return res.end();
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(`[AI:${provider}] request failed:`, error);
      if (res.headersSent) {
        sendSse(res, { error: 'The AI service could not finish the response. Please try again.' });
        return res.end();
      }
      return res.status(502).json({ message: 'Unable to connect to the AI service. Check your backend connection and provider API key.' });
    }
  });
}
