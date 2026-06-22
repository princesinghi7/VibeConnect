import { useEffect, useState, type FormEvent } from 'react';
import Avatar from '../components/Avatar';
import { getThreads, getMessages, sendMessage } from '../api/services';
import type { ChatThread, ChatMessage } from '../api/types';
import './Messages.css';

export default function Messages() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getThreads().then((t) => {
      setThreads(t);
      setActiveId(t[0]?.id ?? null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    getMessages(activeId).then(setMessages);
  }, [activeId]);

  const active = threads.find((t) => t.id === activeId);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    const text = draft.trim();
    setDraft('');
    const msg = await sendMessage(activeId, text);
    setMessages((prev) => [...prev, msg]);
  }

  return (
    <div className="messages-page">
      <div className="thread-list glass">
        <div className="thread-list-head">
          <h2>Messages</h2>
        </div>
        {loading ? (
          <div style={{ padding: 16 }}><div className="skeleton" style={{ height: 60, marginBottom: 10 }} /><div className="skeleton" style={{ height: 60 }} /></div>
        ) : (
          threads.map((t) => (
            <button
              key={t.id}
              className={`thread-row${t.id === activeId ? ' active' : ''}`}
              onClick={() => setActiveId(t.id)}
            >
              <Avatar src={t.participant.avatarUrl} name={t.participant.name} size={42} status={t.participant.status} />
              <div className="thread-row-text">
                <strong>{t.participant.name}</strong>
                <span>{t.lastMessage}</span>
              </div>
              {t.unread > 0 && <span className="thread-badge">{t.unread}</span>}
            </button>
          ))
        )}
      </div>

      <div className="chat-panel glass">
        {active ? (
          <>
            <div className="chat-head">
              <Avatar src={active.participant.avatarUrl} name={active.participant.name} size={36} status={active.participant.status} />
              <div>
                <strong>{active.participant.name}</strong>
                <span className="eyebrow">{active.participant.handle}</span>
              </div>
            </div>

            <div className="chat-body">
              {messages.map((m) => (
                <div key={m.id} className={`bubble-row${m.fromMe ? ' me' : ''}`}>
                  <div className="bubble">{m.content}</div>
                </div>
              ))}
            </div>

            <form className="chat-input-row" onSubmit={onSend}>
              <input
                placeholder="Write a message…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className="btn btn-primary" disabled={!draft.trim()}>Send</button>
            </form>
          </>
        ) : (
          <div className="chat-empty eyebrow">Select a conversation</div>
        )}
      </div>
    </div>
  );
}
