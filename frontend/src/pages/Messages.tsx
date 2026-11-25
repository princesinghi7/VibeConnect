import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Avatar from '../components/Avatar';
import { getThreads, getMessages, sendMessage } from '../api/services';
import type { ChatThread, ChatMessage } from '../api/types';
import './Messages.css';

type ThreadFilter = 'all' | 'unread';

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function Messages() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ThreadFilter>('all');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    setError('');
    try {
      const result = await getThreads();
      setThreads(result);
      setActiveId((current) => current && result.some((thread) => thread.id === current) ? current : result[0]?.id ?? null);
    } catch {
      setError('Your conversations could not be loaded. Please try again.');
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => { void loadThreads(); }, [loadThreads]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    let cancelled = false;
    setLoadingMessages(true);
    setError('');
    getMessages(activeId)
      .then((result) => { if (!cancelled) setMessages(result); })
      .catch(() => { if (!cancelled) setError('Messages could not be loaded. Please retry.'); })
      .finally(() => { if (!cancelled) setLoadingMessages(false); });
    return () => { cancelled = true; };
  }, [activeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, activeId]);

  const active = threads.find((thread) => thread.id === activeId);
  const unreadCount = threads.filter((thread) => thread.unread > 0).length;
  const visibleThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return threads
      .filter((thread) => filter === 'all' || thread.unread > 0)
      .filter((thread) => !query || `${thread.participant.name} ${thread.participant.handle} ${thread.lastMessage}`.toLowerCase().includes(query))
      .slice().sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [threads, search, filter]);

  function selectThread(id: string) {
    setActiveId(id);
    setMobileChatOpen(true);
  }

  async function onSend(event: FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !activeId || sending) return;
    setSending(true);
    setError('');
    try {
      const sent = await sendMessage(activeId, content);
      setMessages((previous) => [...previous, sent]);
      setDraft('');
      setThreads((previous) => previous.map((thread) => thread.id === activeId
        ? { ...thread, lastMessage: content, lastMessageAt: sent.createdAt, unread: 0 }
        : thread));
    } catch {
      setError('Your message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className={`messages-page${mobileChatOpen ? ' mobile-chat-open' : ''}`}>
      <aside className="messages-sidebar">
        <div className="messages-sidebar-head">
          <div><span className="messages-eyebrow">YOUR WORKSPACE</span><h1>Messages</h1><p>Keep every collaboration moving.</p></div>
          <span className="messages-total">{threads.length}</span>
        </div>
        <label className="messages-search"><span aria-hidden="true">⌕</span><input aria-label="Search conversations" placeholder="Search conversations..." value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}</label>
        <div className="messages-filter-row" role="group" aria-label="Conversation filter">
          <button type="button" className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>All <span>{threads.length}</span></button>
          <button type="button" className={filter === 'unread' ? 'selected' : ''} onClick={() => setFilter('unread')}>Unread <span>{unreadCount}</span></button>
        </div>
        <div className="messages-list-label">RECENT CONVERSATIONS</div>
        <div className="thread-list">
          {loadingThreads ? <div className="messages-loading-list">{[1, 2, 3].map((item) => <div className="message-thread-skeleton" key={item}><i/><span><b/><b/></span></div>)}</div> : visibleThreads.length ? visibleThreads.map((thread) => (
            <button type="button" key={thread.id} className={`thread-row${thread.id === activeId ? ' active' : ''}`} onClick={() => selectThread(thread.id)} aria-pressed={thread.id === activeId}>
              <span className="thread-avatar"><Avatar src={thread.participant.avatarUrl} name={thread.participant.name} size={46} status={thread.participant.status} /></span>
              <span className="thread-row-text"><span className="thread-row-top"><strong>{thread.participant.name}</strong><time>{formatTime(thread.lastMessageAt)}</time></span><span className="thread-row-bottom"><span>{thread.lastMessage || 'Start a conversation'}</span>{thread.unread > 0 && <b className="thread-badge">{thread.unread}</b>}</span></span>
            </button>
          )) : <div className="messages-list-empty"><span>⌕</span><strong>{search ? 'No results found' : filter === 'unread' ? 'All caught up' : 'No conversations yet'}</strong><p>{search ? 'Try another name or keyword.' : 'Your conversations will appear here.'}</p></div>}
        </div>
        <div className="messages-sidebar-foot"><span className="messages-secure-icon">✦</span><span><strong>Build better partnerships</strong><small>Keep your campaign conversations in one place.</small></span></div>
      </aside>

      <section className="chat-panel" aria-label="Chat conversation">
        {active ? <>
          <header className="chat-head">
            <button type="button" className="messages-back" onClick={() => setMobileChatOpen(false)} aria-label="Back to conversations">←</button>
            <Avatar src={active.participant.avatarUrl} name={active.participant.name} size={42} status={active.participant.status} />
            <div className="chat-contact"><strong>{active.participant.name}</strong><span><i className={active.participant.status === 'online' ? 'is-online' : ''}/>{active.participant.status === 'online' ? 'Online' : 'VibeConnect member'} <em>· {active.participant.handle}</em></span></div>
            <div className="chat-head-label">DIRECT MESSAGE</div>
          </header>
          <div className="chat-body">
            <div className="chat-intro"><span className="chat-intro-avatar"><Avatar src={active.participant.avatarUrl} name={active.participant.name} size={54}/></span><strong>{active.participant.name}</strong><span>{active.participant.handle}</span><small>This is the beginning of your conversation.</small></div>
            {loadingMessages ? <div className="chat-loading"><i/><i/><i/></div> : messages.map((message, index) => {
              const previous = messages[index - 1];
              const showDate = !previous || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
              return <div className="chat-message-group" key={message.id}>{showDate && <div className="chat-date-divider"><span>{dateLabel(message.createdAt)}</span></div>}<div className={`bubble-row${message.fromMe ? ' me' : ''}`}><div className="bubble-wrap"><div className="bubble">{message.content}</div><time className="bubble-time">{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div></div></div>;
            })}
            {error && <div className="messages-inline-error" role="alert">{error} <button type="button" onClick={() => activeId && getMessages(activeId).then(setMessages).catch(() => setError('Still unable to load messages.'))}>Retry</button></div>}
            <div ref={endRef}/>
          </div>
          <form className="chat-input-row" onSubmit={onSend}>
            <div className="chat-compose"><textarea rows={1} aria-label="Write a message" placeholder="Write a message..." value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><span>Enter to send · Shift + Enter for a new line</span></div>
            <button className="messages-send" type="submit" disabled={!draft.trim() || sending} aria-label="Send message">{sending ? '...' : '➤'}</button>
          </form>
        </> : <div className="chat-empty"><span className="chat-empty-icon">✉</span><h2>Your conversations, together</h2><p>Select a conversation to continue a discussion or coordinate your next collaboration.</p></div>}
      </section>
    </main>
  );
}
