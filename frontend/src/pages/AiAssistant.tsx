import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getToken } from '../api/client';
import type { AiChatMessage, AiProvider } from '../api/types';
import './AiAssistant.css';

type Conversation = { id: string; title: string; updatedAt: number; messages: AiChatMessage[] };
type ProviderStatus = { configured: boolean; model: string };
type AiStatus = { providers: Record<AiProvider, ProviderStatus>; defaultProvider: AiProvider };
const STORAGE_KEY = 'vc_ai_conversations_v2';
const DEFAULT_STATUS: AiStatus = {
  providers: { grok: { configured: false, model: 'Grok' }, claude: { configured: false, model: 'Claude' } },
  defaultProvider: 'grok',
};
const SUGGESTIONS = [
  { icon: '✦', title: 'Grow my creator profile', prompt: 'Help me create a practical 30-day plan to grow my creator profile.' },
  { icon: '₹', title: 'Set my collaboration rates', prompt: 'Help me calculate fair rates for Instagram reels, stories and brand collaborations.' },
  { icon: '↗', title: 'Pitch a brand', prompt: 'Write a professional but natural brand collaboration pitch for me.' },
  { icon: '▤', title: 'Plan a campaign', prompt: 'Help me build a complete creator marketing campaign brief with goals and deliverables.' },
];

function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function readConversations(): Conversation[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Conversation[];
    return Array.isArray(value) ? value.filter((item) => item && typeof item.id === 'string' && Array.isArray(item.messages)) : [];
  } catch { return []; }
}
function safeMarkdown(source: string) {
  let html = source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/`([^`\n]+)`/g, '<code class="ai-inline-code">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return html.split('\n').map((line) => {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) return `<div class="ai-md-list-item"><span>•</span>${trimmed.slice(2)}</div>`;
    if (/^###?\s+/.test(trimmed)) return `<strong class="ai-md-heading">${trimmed.replace(/^#{1,2}\s+/, '')}</strong>`;
    return line || '<br />';
  }).join('<br />');
}
function MarkdownMessage({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return <div className="ai-markdown">{parts.map((part, index) => {
    if (part.startsWith('```')) {
      const match = part.match(/^```([^\n]*)\n?([\s\S]*?)```$/);
      return <CodeBlock key={index} language={match?.[1] || 'code'} code={(match?.[2] || part.slice(3, -3)).trim()} />;
    }
    return <div key={index} className="ai-markdown-text" dangerouslySetInnerHTML={{ __html: safeMarkdown(part) }} />;
  })}</div>;
}
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); }
  }
  return <div className="ai-code-block"><div className="ai-code-head"><span>{language || 'code'}</span><button type="button" onClick={copy}>{copied ? 'Copied ✓' : 'Copy code'}</button></div><pre><code>{code}</code></pre></div>;
}
function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(content); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); }
  }
  return <button type="button" className="ai-icon-action" onClick={copy} title="Copy response">{copied ? '✓ Copied' : '▢ Copy'}</button>;
}

export default function AiAssistant() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(readConversations);
  const [activeId, setActiveId] = useState<string>(() => readConversations()[0]?.id || '');
  const [provider, setProvider] = useState<AiProvider>('grok');
  const [status, setStatus] = useState<AiStatus>(DEFAULT_STATUS);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [statusAvailable, setStatusAvailable] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeConversation = conversations.find((item) => item.id === activeId);
  const messages = activeConversation?.messages ?? [];
  const firstName = user?.name?.split(' ')[0] || 'there';

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 30))); } catch { /* browser storage can be unavailable or full */ } }, [conversations]);
  useEffect(() => {
    let alive = true;
    const token = getToken();
    if (!token) { setStatusLoaded(true); return; }
    fetch('/api/ai/status', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => { if (!response.ok) throw new Error('AI status unavailable'); return response.json() as Promise<AiStatus>; })
      .then((data) => { if (alive) { setStatus(data); setProvider(data.defaultProvider || 'grok'); setStatusAvailable(true); } })
      .catch(() => { if (alive) setStatusAvailable(false); })
      .finally(() => { if (alive) setStatusLoaded(true); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    const node = messagesRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: busy ? 'auto' : 'smooth' });
  }, [messages, streamingText, busy, activeId]);

  const updateActiveMessages = useCallback((conversationId: string, next: AiChatMessage[]) => {
    setConversations((current) => {
      const found = current.some((item) => item.id === conversationId);
      if (!found) return current;
      return current.map((item) => item.id === conversationId ? {
        ...item, messages: next, updatedAt: Date.now(),
        title: item.title === 'New chat' ? (next.find((message) => message.role === 'user')?.content.slice(0, 42) || 'New chat') : item.title,
      } : item);
    });
  }, []);

  function createConversation() {
    if (busy) return;
    const item: Conversation = { id: makeId(), title: 'New chat', updatedAt: Date.now(), messages: [] };
    setConversations((current) => [item, ...current]);
    setActiveId(item.id);
    setDraft(''); setError(''); setSidebarOpen(false);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }
  function removeConversation(id: string) {
    if (busy) return;
    const remaining = conversations.filter((item) => item.id !== id);
    setConversations(remaining);
    if (activeId === id) setActiveId(remaining[0]?.id || '');
  }

  async function requestAssistant(history: AiChatMessage[], conversationId: string) {
    const token = getToken();
    if (!token) { setError('Your session has expired. Please sign in again.'); return; }
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true); setError(''); setStreamingText('');
    let partialAnswer = '';
    updateActiveMessages(conversationId, [...history, { role: 'assistant', content: '' }]);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: history.slice(-30), provider, stream: true }),
        signal: controller.signal,
      });
      if (!response.ok) {
        let message = `AI request failed (${response.status}).`;
        try { const payload = await response.json() as { message?: string }; message = payload.message || message; } catch { /* keep status fallback */ }
        throw new Error(message);
      }
      if (!response.body) throw new Error('The AI server did not return a response stream.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamError = '';
      const consume = (block: string) => {
        const data = block.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n');
        if (!data || data === '[DONE]') return;
        try {
          const event = JSON.parse(data) as { content?: string; error?: string; done?: boolean };
          if (event.content) { partialAnswer += event.content; setStreamingText(partialAnswer); }
          if (event.error) streamError = event.error;
        } catch { /* ignore incomplete or provider-specific events */ }
      };
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || '';
        blocks.forEach(consume);
        if (done) break;
      }
      if (buffer.trim()) consume(buffer);
      if (streamError) throw new Error(streamError);
      if (!partialAnswer.trim()) throw new Error('The AI returned an empty response. Please try again.');
      updateActiveMessages(conversationId, [...history, { role: 'assistant', content: partialAnswer }]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Something went wrong while generating the response.';
      if (caught instanceof Error && caught.name === 'AbortError') {
        if (partialAnswer.trim()) updateActiveMessages(conversationId, [...history, { role: 'assistant', content: `${partialAnswer}\n\n*Generation stopped.*` }]);
        else updateActiveMessages(conversationId, history);
      } else {
        updateActiveMessages(conversationId, history);
        setError(message);
      }
    } finally {
      abortRef.current = null; setBusy(false); setStreamingText('');
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    let conversationId = activeId;
    if (!conversationId || !conversations.some((item) => item.id === conversationId)) {
      conversationId = makeId();
      setConversations((current) => [{ id: conversationId, title: trimmed.slice(0, 42), updatedAt: Date.now(), messages: [] }, ...current]);
      setActiveId(conversationId);
    }
    const history = [...(conversations.find((item) => item.id === conversationId)?.messages ?? []), { role: 'user' as const, content: trimmed }];
    setConversations((current) => current.map((item) => item.id === conversationId ? { ...item, title: item.messages.length ? item.title : trimmed.slice(0, 42), messages: history, updatedAt: Date.now() } : item));
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await requestAssistant(history, conversationId);
  }
  function onSubmit(event: FormEvent) { event.preventDefault(); void send(draft); }
  function onDraftKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(draft); }
  }
  function stopGeneration() { abortRef.current?.abort(); }
  async function regenerate() {
    if (busy || messages.length < 2) return;
    const lastUserIndex = messages.map((item) => item.role).lastIndexOf('user');
    if (lastUserIndex < 0) return;
    const history = messages.slice(0, lastUserIndex + 1);
    updateActiveMessages(activeId, history);
    await requestAssistant(history, activeId);
  }
  const sortedConversations = useMemo(() => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt), [conversations]);
  const activeConfigured = status.providers[provider]?.configured;

  return (
    <main className="ai-workspace">
      <aside className={`ai-history ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="ai-history-top"><div className="ai-brand-mark">✦</div><div><strong>VibeConnect AI</strong><span>Your creator copilot</span></div><button type="button" className="ai-close-history" onClick={() => setSidebarOpen(false)} aria-label="Close history">×</button></div>
        <button type="button" className="ai-new-chat" onClick={createConversation} disabled={busy}><span>＋</span> New chat</button>
        <div className="ai-history-label">RECENT CONVERSATIONS</div>
        <div className="ai-history-list">
          {sortedConversations.length === 0 && <p className="ai-history-empty">Your conversations will appear here.</p>}
          {sortedConversations.map((item) => <div key={item.id} className={`ai-history-item ${item.id === activeId ? 'active' : ''}`}>
            <button type="button" className="ai-history-select" onClick={() => { if (!busy) { setActiveId(item.id); setError(''); setSidebarOpen(false); } }} disabled={busy}><span className="ai-history-chat-icon">▤</span><span>{item.title || 'New chat'}</span></button>
            <button type="button" className="ai-history-delete" title="Delete conversation" onClick={() => removeConversation(item.id)} disabled={busy}>×</button>
          </div>)}
        </div>
        <div className="ai-history-footer"><span className="ai-status-dot" /> Conversations saved on this device</div>
      </aside>
      {sidebarOpen && <button type="button" className="ai-sidebar-scrim" aria-label="Close conversation history" onClick={() => setSidebarOpen(false)} />}

      <section className="ai-main">
        <header className="ai-topbar">
          <div className="ai-topbar-left"><button type="button" className="ai-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open conversation history">☰</button><div><h1>AI Assistant</h1><p>Ask anything. Build something great.</p></div></div>
          <div className="ai-topbar-right">
            <label className="ai-model-label" htmlFor="ai-provider">MODEL</label>
            <select id="ai-provider" value={provider} onChange={(event) => setProvider(event.target.value as AiProvider)} disabled={busy}>
              <option value="grok">Grok · {status.providers.grok.model}</option><option value="claude">Claude · {status.providers.claude.model}</option>
            </select>
            <span className={`ai-provider-state ${statusLoaded && !activeConfigured ? 'not-ready' : ''}`} title={!statusLoaded ? 'Checking API configuration' : !statusAvailable ? 'Could not reach the backend status endpoint' : (activeConfigured ? 'Provider configured' : 'API key not configured')}><i />{!statusLoaded ? 'Checking' : !statusAvailable ? 'Unavailable' : (activeConfigured ? 'Ready' : 'Setup needed')}</span>
          </div>
        </header>

        <div className="ai-chat-stage" ref={messagesRef}>
          {messages.length === 0 ? <div className="ai-welcome">
            <div className="ai-welcome-orb"><span>✦</span></div>
            <div className="ai-welcome-kicker">YOUR CREATOR & BRAND COPILOT</div>
            <h2>Hey {firstName}, what are we<br className="ai-desktop-break" /> working on today?</h2>
            <p>From creator growth to brand deals, content ideas to everyday questions — just talk naturally. I’m here to help you think, plan and create.</p>
            <div className="ai-suggestion-grid">{SUGGESTIONS.map((item) => <button type="button" key={item.title} className="ai-suggestion-card" onClick={() => void send(item.prompt)} disabled={busy}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.prompt}</small><b>↗</b></button>)}</div>
            <div className="ai-welcome-note"><span>✦</span> You can chat in English, Hindi or Hinglish.</div>
          </div> : <div className="ai-message-list">
            {messages.map((message, index) => <article key={`${activeId}-${index}`} className={`ai-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}>
              {message.role === 'assistant' && <div className="ai-avatar">✦</div>}
              <div className="ai-message-content"><div className="ai-message-author">{message.role === 'user' ? 'You' : 'VibeConnect AI'}</div><div className="ai-message-bubble">{message.role === 'user' ? <p>{message.content}</p> : (message.content || (busy && index === messages.length - 1 && streamingText)) ? <MarkdownMessage content={message.content || streamingText} /> : <div className="ai-thinking"><span /><span /><span /> <small>Thinking…</small></div>}</div>
                {message.role === 'assistant' && message.content && <div className="ai-message-actions"><CopyButton content={message.content} />{index === messages.length - 1 && !busy && <button type="button" className="ai-icon-action" onClick={() => void regenerate()}>↻ Regenerate</button>}</div>}
              </div>
            </article>)}
          </div>}
        </div>

        {error && <div className="ai-error-banner" role="alert"><span>⚠</span><p>{error}</p><button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
        {statusLoaded && !statusAvailable && <div className="ai-config-hint">Could not verify AI settings. Make sure the VibeConnect backend is running.</div>}
        {statusLoaded && statusAvailable && !activeConfigured && <div className="ai-config-hint">{provider === 'grok' ? 'Grok API key missing. Add XAI_API_KEY to backend/.env.' : 'Claude API key missing. Add ANTHROPIC_API_KEY to backend/.env.'}</div>}
        <div className="ai-composer-wrap"><form className="ai-composer" onSubmit={onSubmit}>
          <textarea ref={textareaRef} rows={1} value={draft} onChange={(event) => { setDraft(event.target.value); event.target.style.height = 'auto'; event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`; }} onKeyDown={onDraftKeyDown} placeholder="Message VibeConnect AI…" disabled={busy} aria-label="Message VibeConnect AI" />
          <div className="ai-composer-bottom"><span><kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for new line</span>{busy ? <button type="button" className="ai-stop-button" onClick={stopGeneration}>■ Stop</button> : <button type="submit" className="ai-send-button" disabled={!draft.trim()} aria-label="Send message">↑</button>}</div>
        </form><p className="ai-disclaimer">AI can make mistakes. Review important information before acting on it.</p></div>
      </section>
    </main>
  );
}
