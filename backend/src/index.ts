import 'dotenv/config';
import express, { type Request } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import {
  users, posts, connections, threadParticipants, messages,
  campaigns, rateCards, portfolios, analytics, publicUser,
  type AccountType, type RateCardItem, type PortfolioItem,
} from './data';
import { makeToken, requireAuth } from './auth';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

type AuthedRequest = Request & { userId: string };

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// ---------- Auth ----------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: makeToken(user.id), user: publicUser(user) });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, accountType } = req.body ?? {};
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  if (users.some((u) => u.email === email)) return res.status(409).json({ message: 'Email already in use' });

  const type: AccountType = accountType === 'brand' ? 'brand' : 'creator';
  const id = `${type === 'brand' ? 'b' : 'u'}${Date.now()}`;
  const handle = `@${String(name).toLowerCase().replace(/\s+/g, '.')}`;
  const avatarUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(handle)}`;

  const base = {
    id, accountType: type, name, handle, avatarUrl,
    coverUrl: 'https://picsum.photos/seed/300/640/360',
    location: '', stats: { connections: 0, projects: 0, posts: 0 },
    skills: [] as string[], status: 'online' as const, email, password,
  };

  const newUser = type === 'brand'
    ? { ...base, role: 'New brand on VibeConnect', bio: 'Just joined VibeConnect — looking for the right creators.', companyName: name, industry: '', budgetRange: '', targetNiches: [] as string[] }
    : { ...base, role: 'New creator on VibeConnect', bio: 'Just joined VibeConnect.', niche: '', followers: 0, engagementRate: 0, socials: {} };

  users.push(newUser);
  res.status(201).json({ token: makeToken(id), user: publicUser(newUser) });
});

app.post('/api/auth/google', async (req, res) => {
  const { idToken, accountType } = req.body ?? {};
  if (!idToken) return res.status(400).json({ message: 'idToken is required' });

  // Handle Offline/Demo Mock Google Tokens
  if (idToken.startsWith('google-demo:')) {
    const parts = idToken.split(':');
    const email = parts[1];
    const name = parts[2] || email.split('@')[0];

    let user = users.find((u) => u.email === email);

    if (!user) {
      const type: AccountType = accountType === 'brand' ? 'brand' : 'creator';
      const id = `${type === 'brand' ? 'b' : 'u'}${Date.now()}`;
      const handle = `@${name.toLowerCase().replace(/\s+/g, '.')}`;
      const avatarUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(handle)}`;

      const base = {
        id, accountType: type, name, handle, avatarUrl,
        coverUrl: 'https://picsum.photos/seed/300/640/360',
        location: '', stats: { connections: 0, projects: 0, posts: 0 },
        skills: [] as string[], status: 'online' as const, email, password: '',
      };

      user = type === 'brand'
        ? { ...base, role: 'New brand on VibeConnect', bio: 'Just joined VibeConnect — looking for the right creators.', companyName: name, industry: '', budgetRange: '', targetNiches: [] as string[] }
        : { ...base, role: 'New creator on VibeConnect', bio: 'Just joined VibeConnect.', niche: '', followers: 0, engagementRate: 0, socials: {} };

      users.push(user);
    }

    return res.json({ token: makeToken(user.id), user: publicUser(user) });
  }

  if (!googleClient) {
    return res.status(503).json({ message: 'Google Sign-In is not configured on this server (missing GOOGLE_CLIENT_ID).' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(401).json({ message: 'Could not verify Google account' });

    let user = users.find((u) => u.email === payload.email);

    if (!user) {
      const type: AccountType = accountType === 'brand' ? 'brand' : 'creator';
      const name = payload.name ?? payload.email.split('@')[0];
      const id = `${type === 'brand' ? 'b' : 'u'}${Date.now()}`;
      const handle = `@${name.toLowerCase().replace(/\s+/g, '.')}`;
      const avatarUrl = payload.picture ?? `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(handle)}`;

      const base = {
        id, accountType: type, name, handle, avatarUrl,
        coverUrl: 'https://picsum.photos/seed/300/640/360',
        location: '', stats: { connections: 0, projects: 0, posts: 0 },
        skills: [] as string[], status: 'online' as const, email: payload.email, password: '',
      };

      user = type === 'brand'
        ? { ...base, role: 'New brand on VibeConnect', bio: 'Just joined VibeConnect — looking for the right creators.', companyName: name, industry: '', budgetRange: '', targetNiches: [] as string[] }
        : { ...base, role: 'New creator on VibeConnect', bio: 'Just joined VibeConnect.', niche: '', followers: 0, engagementRate: 0, socials: {} };

      users.push(user);
    }

    res.json({ token: makeToken(user.id), user: publicUser(user) });
  } catch (err) {
    console.error('Google sign-in error:', err);
    res.status(401).json({ message: 'Could not verify Google account. Try again.' });
  }
});

// ---------- Users / Profile ----------
app.get('/api/users/me', requireAuth, (req, res) => {
  const user = users.find((u) => u.id === (req as AuthedRequest).userId)!;
  res.json(publicUser(user));
});

app.patch('/api/users/me', requireAuth, (req, res) => {
  const user = users.find((u) => u.id === (req as AuthedRequest).userId)!;
  Object.assign(user, req.body);
  res.json(publicUser(user));
});

app.post('/api/upload', requireAuth, express.raw({ type: 'image/*', limit: '10mb' }), (req, res) => {
  try {
    const fileType = req.headers['content-type'] || 'image/jpeg';
    const ext = fileType === 'image/png' ? '.png' : fileType === 'image/gif' ? '.gif' : '.jpg';
    const filename = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const uploadDir = path.join(__dirname, '../uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, req.body);

    res.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

app.get('/api/users/:id', requireAuth, (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(publicUser(user));
});

// ---------- Posts / Feed ----------
function serializePost(p: (typeof posts)[number], viewerId: string) {
  const author = users.find((u) => u.id === p.authorId)!;
  return {
    id: p.id,
    author: { id: author.id, name: author.name, handle: author.handle, avatarUrl: author.avatarUrl, role: author.role },
    content: p.content,
    imageUrl: p.imageUrl,
    tag: p.tag,
    createdAt: p.createdAt,
    likes: p.likes,
    liked: p.likedBy.includes(viewerId),
    comments: p.comments.map((c) => {
      const cAuthor = users.find((u) => u.id === c.authorId)!;
      return { id: c.id, author: { name: cAuthor.name, avatarUrl: cAuthor.avatarUrl }, content: c.content, createdAt: c.createdAt };
    }),
  };
}

app.get('/api/posts', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const sorted = [...posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  res.json(sorted.map((p) => serializePost(p, viewerId)));
});

app.post('/api/posts', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const { content, tag, imageUrl } = req.body ?? {};
  if (!content) return res.status(400).json({ message: 'Post content is required' });

  const post = {
    id: `p${Date.now()}`, authorId: viewerId, content, tag, imageUrl,
    createdAt: new Date().toISOString(), likes: 0, likedBy: [] as string[], comments: [],
  };
  posts.unshift(post);
  res.status(201).json(serializePost(post, viewerId));
});

app.post('/api/posts/:id/like', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const { liked } = req.body ?? {};
  const already = post.likedBy.includes(viewerId);
  if (liked && !already) { post.likedBy.push(viewerId); post.likes += 1; }
  if (!liked && already) { post.likedBy = post.likedBy.filter((id) => id !== viewerId); post.likes -= 1; }

  res.json({ liked: post.likedBy.includes(viewerId), likes: post.likes });
});

// ---------- Connections ----------
app.get('/api/connections', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const mine = connections.filter((c) => c.userId === viewerId);
  res.json(mine.map((c) => {
    const target = users.find((u) => u.id === c.targetId)!;
    return {
      id: target.id, name: target.name, handle: target.handle, avatarUrl: target.avatarUrl,
      role: target.role, mutuals: Math.floor(Math.random() * 12) + 1, status: c.status, skills: target.skills,
    };
  }));
});

app.post('/api/connections/:id', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const { status } = req.body ?? {};
  let conn = connections.find((c) => c.userId === viewerId && c.targetId === req.params.id);
  if (!conn) {
    conn = { userId: viewerId, targetId: req.params.id, status };
    connections.push(conn);
  } else {
    conn.status = status;
  }
  res.json({ id: req.params.id, status: conn.status });
});

// ---------- Messages ----------
app.get('/api/messages/threads', requireAuth, (req, res) => {
  res.json(Object.entries(threadParticipants).map(([threadId, userId]) => {
    const participant = users.find((u) => u.id === userId)!;
    const threadMsgs = messages.filter((m) => m.threadId === threadId);
    const last = threadMsgs[threadMsgs.length - 1];
    return {
      id: threadId,
      participant: { name: participant.name, avatarUrl: participant.avatarUrl, handle: participant.handle, status: participant.status },
      lastMessage: last?.content ?? '',
      lastMessageAt: last?.createdAt ?? new Date().toISOString(),
      unread: 0,
    };
  }));
});

app.get('/api/messages/threads/:id', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const threadMsgs = messages.filter((m) => m.threadId === req.params.id);
  res.json(threadMsgs.map((m) => ({
    id: m.id, threadId: m.threadId, fromMe: m.fromUserId === viewerId, content: m.content, createdAt: m.createdAt,
  })));
});

app.post('/api/messages/threads/:id', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const { content } = req.body ?? {};
  if (!content) return res.status(400).json({ message: 'Message content is required' });

  const msg = { id: `m${Date.now()}`, threadId: req.params.id, fromUserId: viewerId, content, createdAt: new Date().toISOString() };
  messages.push(msg);
  res.status(201).json({ id: msg.id, threadId: msg.threadId, fromMe: true, content: msg.content, createdAt: msg.createdAt });
});

// ---------- Discovery: creators (for brands) / brands (for creators) ----------
app.get('/api/creators', requireAuth, (req, res) => {
  const { niche } = req.query;
  let list = users.filter((u) => u.accountType === 'creator');
  if (niche && typeof niche === 'string' && niche !== 'all') {
    list = list.filter((u) => u.niche === niche);
  }
  res.json(list.map((u) => ({
    id: u.id, name: u.name, handle: u.handle, avatarUrl: u.avatarUrl,
    niche: u.niche ?? 'General', followers: u.followers ?? 0, engagementRate: u.engagementRate ?? 0,
    location: u.location, socials: u.socials ?? {}, bio: u.bio, skills: u.skills,
  })));
});

app.get('/api/brands', requireAuth, (req, res) => {
  const list = users.filter((u) => u.accountType === 'brand');
  res.json(list.map((b) => ({
    id: b.id, companyName: b.companyName ?? b.name, avatarUrl: b.avatarUrl, industry: b.industry ?? '',
    budgetRange: b.budgetRange ?? '', targetNiches: b.targetNiches ?? [], website: b.website, bio: b.bio,
  })));
});

// ---------- Campaigns ----------
function serializeCampaign(c: (typeof campaigns)[number]) {
  const brand = users.find((u) => u.id === c.brandId)!;
  return {
    ...c,
    brandName: brand.companyName ?? brand.name,
    brandLogo: brand.avatarUrl,
    applicants: c.applicants.map((a) => {
      const creator = users.find((u) => u.id === a.creatorId)!;
      return { ...a, creatorName: creator.name, creatorAvatar: creator.avatarUrl };
    }),
  };
}

app.get('/api/campaigns', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const viewer = users.find((u) => u.id === viewerId)!;
  const list = viewer.accountType === 'brand' ? campaigns.filter((c) => c.brandId === viewerId) : campaigns;
  res.json(list.map(serializeCampaign));
});

app.post('/api/campaigns', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const viewer = users.find((u) => u.id === viewerId)!;
  if (viewer.accountType !== 'brand') return res.status(403).json({ message: 'Only brands can create campaigns' });

  const { title, description, niche, budget, deliverables, platform, deadline } = req.body ?? {};
  if (!title || !description) return res.status(400).json({ message: 'Title and description are required' });

  const campaign = {
    id: `cm${Date.now()}`, brandId: viewerId, title, description,
    niche: niche ?? 'General', budget: budget ?? '', deliverables: deliverables ?? '',
    platform: platform ?? 'Instagram', deadline: deadline ?? '', status: 'open' as const, applicants: [],
  };
  campaigns.push(campaign);
  res.status(201).json(serializeCampaign(campaign));
});

app.post('/api/campaigns/:id/apply', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const campaign = campaigns.find((c) => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
  if (campaign.applicants.some((a) => a.creatorId === viewerId)) {
    return res.status(409).json({ message: 'Already applied' });
  }
  campaign.applicants.push({ creatorId: viewerId, appliedAt: new Date().toISOString(), status: 'applied' });
  res.status(201).json(serializeCampaign(campaign));
});

app.post('/api/campaigns/:id/applicants/:creatorId', requireAuth, (req, res) => {
  const campaign = campaigns.find((c) => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
  const applicant = campaign.applicants.find((a) => a.creatorId === req.params.creatorId);
  if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
  const { status } = req.body ?? {};
  applicant.status = status;
  res.json(serializeCampaign(campaign));
});

// ---------- Rate card ----------
app.get('/api/users/me/ratecard', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  res.json(rateCards[viewerId] ?? []);
});

app.put('/api/users/me/ratecard', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const items = (req.body?.items ?? []) as RateCardItem[];
  rateCards[viewerId] = items;
  res.json(items);
});

// ---------- Portfolio / media kit ----------
app.get('/api/users/me/portfolio', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  res.json(portfolios[viewerId] ?? []);
});

app.post('/api/users/me/portfolio', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  const item: PortfolioItem = { id: `pf${Date.now()}`, ...req.body };
  portfolios[viewerId] = [...(portfolios[viewerId] ?? []), item];
  res.status(201).json(item);
});

// ---------- Analytics ----------
app.get('/api/users/me/analytics', requireAuth, (req, res) => {
  const viewerId = (req as AuthedRequest).userId;
  res.json(analytics[viewerId] ?? []);
});

// ---------- AI Assistant (Claude + Grok) ----------
const AI_SYSTEM_PROMPT =
  'You are the VibeConnect AI Assistant, built into a creator-brand collaboration platform. Help creators with profile tips, content ideas, negotiating rates, and brand-collab etiquette. Help brands with campaign briefs and creator-matching advice. Be concise, practical, and friendly.';

app.post('/api/ai/chat', requireAuth, async (req, res) => {
  const { messages: chatMessages, provider, stream } = req.body ?? {};
  if (!Array.isArray(chatMessages) || chatMessages.length === 0) {
    return res.status(400).json({ message: 'messages array is required' });
  }

  const useGrok = provider === 'grok';
  const apiKey = useGrok ? process.env.XAI_API_KEY : process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.json({
      role: 'assistant',
      content: useGrok
        ? "I'm not connected to Grok yet — the server is missing an XAI_API_KEY. Add one to backend/.env and restart the server to enable real Grok replies."
        : "I'm not connected to Claude yet — the server is missing an ANTHROPIC_API_KEY. Add one to backend/.env and restart the server to enable real Claude replies.",
    });
  }

  const isStreaming = stream === true;

  try {
    if (useGrok) {
      const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [{ role: 'system', content: AI_SYSTEM_PROMPT }, ...chatMessages],
          max_tokens: 1000,
          stream: isStreaming,
        }),
      });

      if (!grokRes.ok) {
        const errBody = await grokRes.text();
        console.error('Grok API error:', grokRes.status, errBody);
        return res.status(grokRes.status).json({ message: `Grok API error: ${grokRes.statusText}` });
      }

      if (isStreaming) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        const decoder = new TextDecoder();
        let buffer = '';

        for await (const chunk of grokRes.body as any) {
          const text = decoder.decode(chunk, { stream: true });
          buffer += text;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            if (cleanLine === 'data: [DONE]') {
              res.write('data: [DONE]\n\n');
              continue;
            }
            if (cleanLine.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(cleanLine.slice(6));
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
                }
              } catch {
                // Ignore parse errors on partial lines
              }
            }
          }
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      } else {
        const data = await grokRes.json();
        const text = data.choices?.[0]?.message?.content ?? '';
        return res.json({ role: 'assistant', content: text || "I couldn't generate a response." });
      }
    } else {
      // Claude
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 1000,
          system: AI_SYSTEM_PROMPT,
          messages: chatMessages,
          stream: isStreaming,
        }),
      });

      if (!anthropicRes.ok) {
        const errBody = await anthropicRes.text();
        console.error('Anthropic API error:', anthropicRes.status, errBody);
        return res.status(anthropicRes.status).json({ message: `Claude API error: ${anthropicRes.statusText}` });
      }

      if (isStreaming) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        const decoder = new TextDecoder();
        let buffer = '';

        for await (const chunk of anthropicRes.body as any) {
          const text = decoder.decode(chunk, { stream: true });
          buffer += text;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            if (cleanLine.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(cleanLine.slice(6));
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  res.write(`data: ${JSON.stringify({ content: parsed.delta.text })}\n\n`);
                }
              } catch {
                // Ignore
              }
            }
          }
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      } else {
        const data = await anthropicRes.json();
        const text = (data.content ?? [])
          .map((block: { type: string; text?: string }) => (block.type === 'text' ? block.text : ''))
          .filter(Boolean)
          .join('\n');
        return res.json({ role: 'assistant', content: text || "I couldn't generate a response." });
      }
    }
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(502).json({ message: `Could not reach the ${useGrok ? 'Grok' : 'Claude'} API. Check your connection/keys and try again.` });
  }
});

// ---------- Social: real YouTube channel stats (public Data API, no OAuth needed) ----------
app.get('/api/social/youtube', requireAuth, async (req, res) => {
  const handle = String(req.query.handle ?? '').replace(/^@/, '');
  if (!handle) return res.status(400).json({ message: 'handle query param is required' });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.json({ connected: false, message: 'YOUTUBE_API_KEY not set on the server — showing link only.' });
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(`@${handle}`)}&key=${apiKey}`;
    const ytRes = await fetch(url);
    if (!ytRes.ok) {
      const errBody = await ytRes.text();
      console.error('YouTube API error:', ytRes.status, errBody);
      return res.status(502).json({ connected: false, message: 'Could not reach the YouTube API.' });
    }
    const data = await ytRes.json();
    const channel = data.items?.[0];
    if (!channel) return res.json({ connected: false, message: `No public channel found for @${handle}.` });

    res.json({
      connected: true,
      title: channel.snippet?.title,
      thumbnail: channel.snippet?.thumbnails?.default?.url,
      subscriberCount: Number(channel.statistics?.subscriberCount ?? 0),
      videoCount: Number(channel.statistics?.videoCount ?? 0),
      viewCount: Number(channel.statistics?.viewCount ?? 0),
    });
  } catch (err) {
    console.error('YouTube fetch error:', err);
    res.status(502).json({ connected: false, message: 'Could not reach the YouTube API.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`VibeConnect API listening on http://localhost:${PORT}`);
  console.log('Demo login -> email: demo@vibeconnect.dev  password: demo1234');
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('Note: ANTHROPIC_API_KEY not set — Claude replies will be a placeholder.');
  }
  if (!process.env.XAI_API_KEY) {
    console.log('Note: XAI_API_KEY not set — Grok replies will be a placeholder.');
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.log('Note: GOOGLE_CLIENT_ID not set — "Continue with Google" will show a setup message instead of signing in.');
  }
  if (!process.env.YOUTUBE_API_KEY) {
    console.log('Note: YOUTUBE_API_KEY not set — live YouTube stats on the profile will be skipped.');
  }
});
