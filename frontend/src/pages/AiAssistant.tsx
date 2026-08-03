import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { AiChatMessage, AiProvider } from '../api/types';
import './AiAssistant.css';

const SUGGESTIONS = [
  'How should I price a sponsored Instagram reel?',
  'Write a campaign brief for a skincare brand collab',
  'What should I add to my media kit?',
  'How do I pitch myself to brands cold?',
];

// Helper to parse basic inline Markdown (bold, italic, inline code, lists)
function parseMarkdownInline(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Inline code: `code`
  html = html.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');

  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Split by lines to parse lists and line breaks
  const lines = html.split('\n');
  const formattedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return `<li class="md-li">${trimmed.slice(2)}</li>`;
    }
    return line;
  });

  return formattedLines.join('<br />');
}

// Monospace Code Block with syntax tag and Copy button
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-lang">{language || 'code'}</span>
        <button type="button" className="btn-copy-code" onClick={handleCopy}>
          {copied ? 'Copied ✓' : 'Copy code'}
        </button>
      </div>
      <pre className="code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Markdown Message Renderer
function MarkdownMessage({ content }: { content: string }) {
  // Split by triple-backtick code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="markdown-body">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : part.slice(3, -3);
          return <CodeBlock key={index} language={lang} code={code.trim()} />;
        }
        return (
          <div
            key={index}
            className="md-text-block"
            dangerouslySetInnerHTML={{ __html: parseMarkdownInline(part) }}
          />
        );
      })}
    </div>
  );
}

// Copy button for the assistant response bubble
function BubbleCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className="bubble-action-btn" onClick={copy} title="Copy reply">
      {copied ? 'Copied ✓' : '⧉'}
    </button>
  );
}

export default function AiAssistant() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<AiProvider>('claude');
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: 'assistant',
      content: `Hey ${user?.name?.split(' ')[0] ?? 'there'}! I'm your VibeConnect AI Assistant. Ask me about pricing, pitching brands, campaign briefs, or anything about growing your creator-brand collabs.`,
    },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window to bottom
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, busy]);

  async function triggerStream(history: AiChatMessage[]) {
    const controller = new AbortController();
    setAbortController(controller);
    setBusy(true);

    // Optimize tokens: Send only the last 10 messages of conversation history
    const optimizedHistory = history.slice(-10);

    try {
      const token = localStorage.getItem('vc_token');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: optimizedHistory,
          provider,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('API error');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Missing response body');
      }
      const decoder = new TextDecoder();

      // Append an empty assistant bubble that we stream content into
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          if (cleanLine === 'data: [DONE]') continue;
          if (cleanLine.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(cleanLine.slice(6)) as { content?: string };
              const textContent = parsed.content;
              if (textContent) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const previousText = updated[updated.length - 1]?.content ?? '';
                  updated[updated.length - 1] = { role: 'assistant', content: `${previousText}${textContent}` };
                  return updated;
                });
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        showStreamError('Generation stopped.');
      } else {
        console.error(err);
        showStreamError('Could not reach the AI server. Please make sure the backend is running and keys are set.');
      }
    } finally {
      setBusy(false);
      setAbortController(null);
    }
  }

  function showStreamError(errorText: string) {
    setMessages((prev) => {
      // If the last message was the incomplete streamed assistant reply, replace it
      const last = prev[prev.length - 1];
      if (last && last.role === 'assistant' && last.content === '') {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: `*Error: ${errorText}*` };
        return updated;
      }
      return [...prev, { role: 'assistant', content: `*Error: ${errorText}*` }];
    });
  }

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next = [...messages, { role: 'user' as const, content: text.trim() }];
    setMessages(next);
    setDraft('');
    await triggerStream(next);
  }

  function handleStop() {
    if (abortController) {
      abortController.abort();
    }
  }

  async function handleRegenerate() {
    if (messages.length < 2 || busy) return;

    // Find last user prompt
    const userIndex = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (userIndex === -1) return;

    const targetIdx = messages.length - 1 - userIndex;
    const truncatedHistory = messages.slice(0, targetIdx + 1);

    setMessages(truncatedHistory);
    await triggerStream(truncatedHistory);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }

  const showRegenerate = messages.length >= 2 && !busy;

  return (
    <div className="ai-page">
      <div className="ai-head">
        <div>
          <h1>AI Assistant</h1>
          <p className="eyebrow">For creator & brand questions</p>
        </div>
        <div className="ai-provider-toggle">
          <button
            type="button"
            className={`ai-provider-btn${provider === 'claude' ? ' active' : ''}`}
            onClick={() => setProvider('claude')}
            disabled={busy}
          >
            Claude
          </button>
          <button
            type="button"
            className={`ai-provider-btn${provider === 'grok' ? ' active' : ''}`}
            onClick={() => setProvider('grok')}
            disabled={busy}
          >
            Grok
          </button>
        </div>
      </div>

      <div className="ai-panel glass">
        <div className="ai-messages" ref={chatMessagesRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-bubble-row${m.role === 'user' ? ' me' : ''}`}>
              <div className="ai-bubble-wrapper">
                <div className="ai-bubble">
                  {m.role === 'user' ? m.content : <MarkdownMessage content={m.content} />}
                </div>
                {m.role === 'assistant' && m.content && (
                  <div className="bubble-actions">
                    <BubbleCopyButton text={m.content} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && messages[messages.length - 1]?.content === '' && (
            <div className="ai-bubble-row">
              <div className="ai-bubble ai-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="ai-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="btn btn-ghost ai-suggestion"
                onClick={() => send(s)}
                disabled={busy}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="ai-control-bar">
          {busy && (
            <button type="button" className="btn btn-danger btn-stop" onClick={handleStop}>
              ■ Stop generating
            </button>
          )}
          {showRegenerate && (
            <button type="button" className="btn btn-ghost btn-regenerate" onClick={handleRegenerate}>
              ⟳ Regenerate response
            </button>
          )}
        </div>

        <form className="ai-input-row" onSubmit={onSubmit}>
          <input
            placeholder={`Ask ${provider === 'grok' ? 'Grok' : 'Claude'} anything…`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
          />
          <button className="btn btn-primary" disabled={!draft.trim() || busy}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
