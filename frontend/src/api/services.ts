import { api, setToken } from './client';
import {
  mockMe, mockUsers, mockPosts, mockConnections, mockThreads, mockMessages,
  mockCreatorCards, mockBrandCards, mockCampaigns, mockRateCard, mockPortfolio,
} from './mock';
import type {
  User, Post, Connection, ChatThread, ChatMessage, AccountType,
  CreatorCard, BrandCard, Campaign, RateCardItem, PortfolioItem, AiChatMessage, AiProvider, YoutubeStats,
} from './types';

const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms));

// Lightweight per-browser cache so demo-mode edits (rate card, portfolio) survive
// page reloads even when there's no backend running to persist them.
const LS_PREFIX = 'vc_cache:';
function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function lsSet<T>(key: string, value: T) {
  try {
    localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Calls the real backend; on any failure (offline, 404, etc.) resolves with mock data instead,
 *  so the UI always has something real-looking to show during a demo. */
async function withFallback<T>(call: () => Promise<T>, fallback: T | (() => T)): Promise<T> {
  try {
    return await call();
  } catch {
    await delay();
    return typeof fallback === 'function' ? (fallback as () => T)() : fallback;
  }
}

// ---- Auth ----
export async function login(email: string, password: string) {
  return withFallback(
    async () => {
      const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      setToken(res.token);
      lsSet('profile', res.user);
      return res.user;
    },
    () => {
      setToken('demo-token');
      lsSet('profile', mockMe);
      return mockMe;
    },
  );
}

export async function signup(name: string, email: string, password: string, accountType: AccountType) {
  return withFallback(
    async () => {
      const res = await api.post<{ token: string; user: User }>('/auth/signup', { name, email, password, accountType });
      setToken(res.token);
      lsSet('profile', res.user);
      return res.user;
    },
    () => {
      setToken('demo-token');
      const handle = `@${name.toLowerCase().replace(/\s+/g, '.')}`;
      const user = accountType === 'brand'
        ? {
          ...mockMe, accountType, name, handle, companyName: name,
          role: 'New brand on VibeConnect', bio: 'Just joined VibeConnect — looking for the right creators.',
          industry: '', budgetRange: '', targetNiches: [], niche: undefined, followers: undefined,
          engagementRate: undefined, socials: undefined,
        } as User
        : { ...mockMe, name, handle, role: 'New creator on VibeConnect', bio: 'Just joined VibeConnect.' };
      lsSet('profile', user);
      return user;
    },
  );
}

export function logout() {
  setToken(null);
}

export async function loginWithGoogle(idToken: string, accountType: AccountType = 'creator'): Promise<User> {
  return withFallback(
    async () => {
      const res = await api.post<{ token: string; user: User }>('/auth/google', { idToken, accountType });
      setToken(res.token);
      lsSet('profile', res.user);
      return res.user;
    },
    () => {
      setToken('demo-token');
      lsSet('profile', mockMe);
      return mockMe;
    },
  );
}

// ---- Social: live YouTube stats ----
export async function getYoutubeStats(handle: string): Promise<YoutubeStats> {
  try {
    return await api.get<YoutubeStats>(`/social/youtube?handle=${encodeURIComponent(handle)}`);
  } catch {
    return { connected: false, message: 'Backend not reachable — start it to show live YouTube stats.' };
  }
}

// ---- Profile ----
export async function getProfile(userId = 'me'): Promise<User> {
  const cachedProfile = lsGet<User>('profile');
  if (userId === 'me' || userId === mockMe.id) {
    return withFallback(() => api.get<User>('/users/me'), cachedProfile ?? mockMe);
  }
  const found = mockUsers.find((u) => u.id === userId) ?? mockMe;
  return withFallback(() => api.get<User>(`/users/${userId}`), found);
}

export async function updateProfile(patch: Partial<User>): Promise<User> {
  return withFallback(
    async () => {
      const updated = await api.patch<User>('/users/me', patch);
      lsSet('profile', updated);
      return updated;
    },
    () => {
      const updated = { ...(lsGet<User>('profile') ?? mockMe), ...patch };
      lsSet('profile', updated);
      return updated;
    },
  );
}

// ---- Feed ----
export async function getFeed(): Promise<Post[]> {
  return withFallback(() => api.get<Post[]>('/posts'), mockPosts);
}

export async function createPost(content: string, tag?: string, imageUrl?: string): Promise<Post> {
  const optimistic: Post = {
    id: `p${Date.now()}`,
    author: { id: mockMe.id, name: mockMe.name, handle: mockMe.handle, avatarUrl: mockMe.avatarUrl, role: mockMe.role },
    content, tag, imageUrl, createdAt: new Date().toISOString(), likes: 0, liked: false, comments: [],
  };
  return withFallback(() => api.post<Post>('/posts', { content, tag, imageUrl }), optimistic);
}

export async function toggleLike(postId: string, liked: boolean): Promise<{ liked: boolean; likes: number }> {
  return withFallback(
    () => api.post<{ liked: boolean; likes: number }>(`/posts/${postId}/like`, { liked }),
    { liked, likes: liked ? 1 : 0 },
  );
}

// ---- Connections ----
export async function getConnections(): Promise<Connection[]> {
  return withFallback(() => api.get<Connection[]>('/connections'), mockConnections);
}

export async function setConnectionStatus(id: string, status: Connection['status']) {
  return withFallback(() => api.post(`/connections/${id}`, { status }), { id, status });
}

// ---- Messages ----
export async function getThreads(): Promise<ChatThread[]> {
  return withFallback(() => api.get<ChatThread[]>('/messages/threads'), mockThreads);
}

export async function getMessages(threadId: string): Promise<ChatMessage[]> {
  return withFallback(() => api.get<ChatMessage[]>(`/messages/threads/${threadId}`), mockMessages[threadId] ?? []);
}

export async function sendMessage(threadId: string, content: string): Promise<ChatMessage> {
  const optimistic: ChatMessage = { id: `m${Date.now()}`, threadId, fromMe: true, content, createdAt: new Date().toISOString() };
  return withFallback(() => api.post<ChatMessage>(`/messages/threads/${threadId}`, { content }), optimistic);
}

// ---- Discovery ----
export async function getCreators(niche = 'all'): Promise<CreatorCard[]> {
  return withFallback(
    () => api.get<CreatorCard[]>(`/creators?niche=${encodeURIComponent(niche)}`),
    niche === 'all' ? mockCreatorCards : mockCreatorCards.filter((c) => c.niche === niche),
  );
}

export async function getBrands(): Promise<BrandCard[]> {
  return withFallback(() => api.get<BrandCard[]>('/brands'), mockBrandCards);
}

// ---- Campaigns ----
export async function getCampaigns(): Promise<Campaign[]> {
  return withFallback(() => api.get<Campaign[]>('/campaigns'), mockCampaigns);
}

export async function createCampaign(payload: Partial<Campaign>): Promise<Campaign> {
  const optimistic: Campaign = {
    id: `cm${Date.now()}`, brandId: mockMe.id, brandName: mockMe.companyName ?? mockMe.name, brandLogo: mockMe.avatarUrl,
    title: payload.title ?? '', description: payload.description ?? '', niche: payload.niche ?? 'General',
    budget: payload.budget ?? '', deliverables: payload.deliverables ?? '', platform: payload.platform ?? 'Instagram',
    deadline: payload.deadline ?? '', status: 'open', applicants: [],
  };
  return withFallback(() => api.post<Campaign>('/campaigns', payload), optimistic);
}

export async function applyToCampaign(campaignId: string): Promise<Campaign> {
  return withFallback(
    () => api.post<Campaign>(`/campaigns/${campaignId}/apply`),
    () => {
      const c = mockCampaigns.find((x) => x.id === campaignId)!;
      return { ...c, applicants: [...c.applicants, { creatorId: mockMe.id, creatorName: mockMe.name, creatorAvatar: mockMe.avatarUrl, appliedAt: new Date().toISOString(), status: 'applied' }] };
    },
  );
}

export async function setApplicantStatus(campaignId: string, creatorId: string, status: string): Promise<Campaign> {
  return withFallback(
    () => api.post<Campaign>(`/campaigns/${campaignId}/applicants/${creatorId}`, { status }),
    () => mockCampaigns.find((x) => x.id === campaignId)!,
  );
}

// ---- Rate card ----
export async function getRateCard(): Promise<RateCardItem[]> {
  const cached = lsGet<RateCardItem[]>('ratecard');
  return withFallback(() => api.get<RateCardItem[]>('/users/me/ratecard'), () => cached ?? mockRateCard);
}

export async function saveRateCard(items: RateCardItem[]): Promise<RateCardItem[]> {
  lsSet('ratecard', items);
  return withFallback(() => api.put<RateCardItem[]>('/users/me/ratecard', { items }), items);
}

// ---- Portfolio / media kit ----
export async function getPortfolio(): Promise<PortfolioItem[]> {
  const cached = lsGet<PortfolioItem[]>('portfolio');
  return withFallback(() => api.get<PortfolioItem[]>('/users/me/portfolio'), () => cached ?? mockPortfolio);
}

export async function addPortfolioItem(item: Partial<PortfolioItem>): Promise<PortfolioItem> {
  const optimistic: PortfolioItem = {
    id: `pf${Date.now()}`, title: item.title ?? 'Untitled', brand: item.brand ?? 'Personal',
    imageUrl: item.imageUrl ?? 'https://picsum.photos/seed/500/640/360', metric: item.metric ?? '',
  };
  const result = await withFallback(() => api.post<PortfolioItem>('/users/me/portfolio', item), optimistic);
  const updatedList = [...(lsGet<PortfolioItem[]>('portfolio') ?? mockPortfolio), result];
  lsSet('portfolio', updatedList);
  return result;
}

// ---- Analytics ----
export async function getAnalytics() {
  return withFallback(() => api.get('/users/me/analytics'), [
    { month: 'Jan', followers: 142000, engagementRate: 5.8 },
    { month: 'Feb', followers: 151000, engagementRate: 6.0 },
    { month: 'Mar', followers: 159000, engagementRate: 6.3 },
    { month: 'Apr', followers: 167000, engagementRate: 6.6 },
    { month: 'May', followers: 176000, engagementRate: 6.9 },
    { month: 'Jun', followers: 184000, engagementRate: 7.2 },
  ]);
}

// ---- AI Assistant (Claude / Grok) ----
export async function sendAiMessage(history: AiChatMessage[], provider: AiProvider = 'claude'): Promise<AiChatMessage> {
  return withFallback(
    () => api.post<AiChatMessage>('/ai/chat', { messages: history, provider }),
    () => ({
      role: 'assistant' as const,
      content:
        provider === 'grok'
          ? "I'm running in demo mode right now (no backend connected), so I can't give a live Grok reply — once the backend is running with an XAI_API_KEY set, I'll answer for real."
          : "I'm running in demo mode right now (no backend connected), so I can't give a live Claude reply — once the backend is running with an ANTHROPIC_API_KEY set, I'll answer for real. In the meantime: for profile tips, lead with your niche and your best metric in the bio; for campaign briefs, always include deliverables, deadline, and budget upfront.",
    }),
  );
}
