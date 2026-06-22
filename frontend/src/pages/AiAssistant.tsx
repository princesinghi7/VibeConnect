import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { sendAiMessage } from '../api/services';
import type { AiChatMessage } from '../api/types';
import './AiAssistant.css';

const SUGGESTIONS = [
  'How should I price a sponsored Instagram reel?',
  'Write a campaign brief for a skincare brand collab',
  'What should I add to my media kit?',
  'How do I pitch myself to brands cold?',
];

export default function AiAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: 'assistant',
      content: `Hey ${user?.name?.split(' ')[0] ?? 'there'}! I'm your VibeConnect AI Assistant, powered by Claude. Ask me about pricing, pitching brands, campaign briefs, or anything about growing your creator-brand collabs.`,
    },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next = [...messages, { role: 'user' as const, content: text.trim() }];
    setMessages(next);
    setDraft('');
    setBusy(true);
    try {
      const reply = await sendAiMessage(next);
      setMessages((prev) => [...prev, reply]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }

  return (
    <div className="ai-page">
      <div className="ai-head">
        <div>
          <h1>AI Assistant</h1>
          <p className="eyebrow">Powered by Claude · for creator & brand questions</p>
        </div>
        <span className="status-pill"><span className="pulse-dot" /> online</span>
      </div>

      <div className="ai-panel glass">
        <div className="ai-messages">
          {messages.map((m, i) => (
            <div key={i} className={`ai-bubble-row${m.role === 'user' ? ' me' : ''}`}>
              <div className="ai-bubble">{m.content}</div>
            </div>
          ))}
          {busy && (
            <div className="ai-bubble-row">
              <div className="ai-bubble ai-typing"><span /><span /><span /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="ai-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="btn btn-ghost ai-suggestion" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}

        <form className="ai-input-row" onSubmit={onSubmit}>
          <input
            placeholder="Ask the AI Assistant anything…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn btn-primary" disabled={!draft.trim() || busy}>Send</button>
        </form>
      </div>
    </div>
  );
}
