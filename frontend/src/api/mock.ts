import type {
  User, Post, Connection, ChatThread, ChatMessage,
  CreatorCard, BrandCard, Campaign, RateCardItem, PortfolioItem,
} from './types';

const avatar = (seed: string) => `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;
const photo = (id: number) => `https://picsum.photos/seed/${id}/640/360`;

export const mockMe: User = {
  id: 'me',
  accountType: 'creator',
  name: 'Prince Singh',
  handle: '@princesinghofficial',
  avatarUrl: '/prince-singh.jpg',
  coverUrl: photo(101),
  role: 'Content Creator · Relatable Content',
  location: 'Vadodara, Gujarat, IN',
  bio: 'Creating relatable content people actually see themselves in. Building my creator business in public — reels, stories, and real conversations with my audience.',
  stats: { connections: 248, projects: 16, posts: 92 },
  skills: ['Reels', 'Storytelling', 'Brand Collabs', 'Editing'],
  status: 'building',
  niche: 'Relatable Content',
  followers: 184000,
  engagementRate: 7.2,
  socials: {
    instagram: 'https://instagram.com/princesinghofficial',
    youtube: 'https://youtube.com/@epicprince',
    facebook: 'https://facebook.com/PrinceSingh',
  },
};

export const mockUsers: User[] = [
  {
    id: 'u1', accountType: 'creator', name: 'Priya Nair', handle: '@priya.builds', avatarUrl: avatar('priya-nair'),
    coverUrl: photo(102), role: 'Lifestyle Creator', location: 'Bengaluru, IN',
    bio: 'Design systems nerd turned lifestyle creator.', stats: { connections: 512, projects: 8, posts: 140 },
    skills: ['Reels', 'Aesthetic Content'], status: 'online', niche: 'Lifestyle', followers: 96000, engagementRate: 5.4,
    socials: { instagram: 'https://instagram.com/priya.builds' },
  },
  {
    id: 'u2', accountType: 'creator', name: 'Rohan Verma', handle: '@rohan.ships', avatarUrl: avatar('rohan-verma'),
    coverUrl: photo(103), role: 'Tech Creator', location: 'Pune, IN',
    bio: 'Breaking down tech, one reel at a time.', stats: { connections: 320, projects: 22, posts: 64 },
    skills: ['Tech Reviews', 'Scripting'], status: 'building', niche: 'Tech', followers: 210000, engagementRate: 6.1,
    socials: { youtube: 'https://youtube.com/@rohanships' },
  },
  {
    id: 'u3', accountType: 'creator', name: 'Saanvi Iyer', handle: '@saanvi.ai', avatarUrl: avatar('saanvi-iyer'),
    coverUrl: photo(104), role: 'Comedy Creator', location: 'Hyderabad, IN',
    bio: 'Training models, breaking biases, and making people laugh.', stats: { connections: 410, projects: 12, posts: 88 },
    skills: ['Sketches', 'Editing'], status: 'offline', niche: 'Comedy', followers: 340000, engagementRate: 8.9,
    socials: { instagram: 'https://instagram.com/saanvi.ai' },
  },
  {
    id: 'u4', accountType: 'creator', name: 'Karthik Reddy', handle: '@karthik.dev', avatarUrl: avatar('karthik-reddy'),
    coverUrl: photo(105), role: 'Fitness Creator', location: 'Chennai, IN',
    bio: 'Automating workouts, not excuses.', stats: { connections: 275, projects: 19, posts: 51 },
    skills: ['Fitness Reels', 'Coaching'], status: 'online', niche: 'Fitness', followers: 128000, engagementRate: 6.7,
    socials: { instagram: 'https://instagram.com/karthik.dev' },
  },
];

export const mockBrands: User[] = [
  {
    id: 'b1', accountType: 'brand', name: 'Nova Skincare', handle: '@nova.skincare', avatarUrl: avatar('nova-skincare'),
    coverUrl: photo(301), role: 'Skincare & Beauty Brand', location: 'Mumbai, IN',
    bio: 'Clean, dermat-backed skincare for everyday Indian skin.', stats: { connections: 60, projects: 14, posts: 30 },
    skills: [], status: 'online', companyName: 'Nova Skincare', industry: 'Beauty & Skincare',
    budgetRange: '₹20,000 – ₹80,000 / campaign', targetNiches: ['Lifestyle', 'Beauty', 'Relatable Content'],
    website: 'https://novaskincare.example.com',
  },
  {
    id: 'b2', accountType: 'brand', name: 'Flux Energy', handle: '@flux.energy', avatarUrl: avatar('flux-energy'),
    coverUrl: photo(302), role: 'Sports Nutrition Brand', location: 'Bengaluru, IN',
    bio: 'Performance drinks for people who actually train.', stats: { connections: 40, projects: 9, posts: 22 },
    skills: [], status: 'online', companyName: 'Flux Energy', industry: 'Sports Nutrition',
    budgetRange: '₹15,000 – ₹50,000 / campaign', targetNiches: ['Fitness', 'Tech'],
  },
  {
    id: 'b3', accountType: 'brand', name: 'Looped App', handle: '@looped.app', avatarUrl: avatar('looped-app'),
    coverUrl: photo(303), role: 'Consumer Tech Startup', location: 'Gurugram, IN',
    bio: 'A social app for people who hate small talk.', stats: { connections: 28, projects: 5, posts: 16 },
    skills: [], status: 'building', companyName: 'Looped', industry: 'Consumer Tech',
    budgetRange: '₹10,000 – ₹40,000 / campaign', targetNiches: ['Tech', 'Relatable Content', 'Comedy'],
  },
];

export const mockPosts: Post[] = [
  {
    id: 'p1',
    author: { id: 'u1', name: 'Priya Nair', handle: '@priya.builds', avatarUrl: avatar('priya-nair'), role: 'Lifestyle Creator' },
    content: 'Shipped a new dark mode token system today — glass surfaces, one accent, zero gradients-for-the-sake-of-it. Restraint is underrated.',
    imageUrl: photo(201), tag: 'lifestyle',
    createdAt: '2026-06-19T14:20:00Z', likes: 142, liked: true,
    comments: [{ id: 'c1', author: { name: 'Rohan Verma', avatarUrl: avatar('rohan-verma') }, content: 'This is clean!', createdAt: '2026-06-19T15:00:00Z' }],
  },
  {
    id: 'p2',
    author: { id: 'u2', name: 'Rohan Verma', handle: '@rohan.ships', avatarUrl: avatar('rohan-verma'), role: 'Tech Creator' },
    content: 'New reel breaking down why everyone\u2019s phone feels slower after 2 years. 1.2M views in 3 days.',
    tag: 'tech',
    createdAt: '2026-06-19T09:05:00Z', likes: 89, liked: false, comments: [],
  },
  {
    id: 'p3',
    author: { id: 'u3', name: 'Saanvi Iyer', handle: '@saanvi.ai', avatarUrl: avatar('saanvi-iyer'), role: 'Comedy Creator' },
    content: 'POV skit about Indian parents discovering WiFi passwords just hit 2M. Comedy nichee is undefeated.',
    imageUrl: photo(202), tag: 'comedy',
    createdAt: '2026-06-18T19:40:00Z', likes: 210, liked: true, comments: [],
  },
  {
    id: 'p4',
    author: { id: 'me', name: 'Prince Singh', handle: '@princesinghofficial', avatarUrl: '/prince-singh.jpg', role: 'Content Creator' },
    content: 'New relatable reel about Monday mornings just crossed 500K views. Building this creator journey in public, one reel at a time.',
    imageUrl: photo(203), tag: 'relatablecontent',
    createdAt: '2026-06-18T08:10:00Z', likes: 56, liked: false, comments: [],
  },
];

export const mockConnections: Connection[] = [
  { id: 'u1', name: 'Priya Nair', handle: '@priya.builds', avatarUrl: avatar('priya-nair'), role: 'Lifestyle Creator', mutuals: 12, status: 'connected', skills: ['Reels'] },
  { id: 'u2', name: 'Rohan Verma', handle: '@rohan.ships', avatarUrl: avatar('rohan-verma'), role: 'Tech Creator', mutuals: 7, status: 'connected', skills: ['Tech Reviews'] },
  { id: 'u3', name: 'Saanvi Iyer', handle: '@saanvi.ai', avatarUrl: avatar('saanvi-iyer'), role: 'Comedy Creator', mutuals: 3, status: 'pending', skills: ['Sketches'] },
  { id: 'u4', name: 'Karthik Reddy', handle: '@karthik.dev', avatarUrl: avatar('karthik-reddy'), role: 'Fitness Creator', mutuals: 5, status: 'suggested', skills: ['Fitness Reels'] },
];

export const mockThreads: ChatThread[] = [
  { id: 't1', participant: { name: 'Priya Nair', avatarUrl: avatar('priya-nair'), handle: '@priya.builds', status: 'online' }, lastMessage: 'Sent over the collab brief, take a look!', lastMessageAt: '2026-06-19T16:02:00Z', unread: 2 },
  { id: 't2', participant: { name: 'Nova Skincare', avatarUrl: avatar('nova-skincare'), handle: '@nova.skincare', status: 'online' }, lastMessage: 'Loved your last reel, want to collab?', lastMessageAt: '2026-06-19T11:30:00Z', unread: 1 },
];

export const mockMessages: Record<string, ChatMessage[]> = {
  t1: [
    { id: 'm1', threadId: 't1', fromMe: false, content: 'Hey! Loved your latest reel.', createdAt: '2026-06-19T15:50:00Z' },
    { id: 'm2', threadId: 't1', fromMe: true, content: 'Thank you! Still tuning the format.', createdAt: '2026-06-19T15:55:00Z' },
    { id: 'm3', threadId: 't1', fromMe: false, content: 'Sent over the collab brief, take a look!', createdAt: '2026-06-19T16:02:00Z' },
  ],
  t2: [
    { id: 'm4', threadId: 't2', fromMe: false, content: 'Loved your last reel, want to collab?', createdAt: '2026-06-19T11:30:00Z' },
  ],
};

// ---- Brand / Creator discovery ----
export const mockCreatorCards: CreatorCard[] = mockUsers.concat(mockMe).map((u) => ({
  id: u.id, name: u.name, handle: u.handle, avatarUrl: u.avatarUrl,
  niche: u.niche ?? 'General', followers: u.followers ?? 0, engagementRate: u.engagementRate ?? 0,
  location: u.location, socials: u.socials ?? {}, bio: u.bio, skills: u.skills,
}));

export const mockBrandCards: BrandCard[] = mockBrands.map((b) => ({
  id: b.id, companyName: b.companyName ?? b.name, avatarUrl: b.avatarUrl, industry: b.industry ?? '',
  budgetRange: b.budgetRange ?? '', targetNiches: b.targetNiches ?? [], website: b.website, bio: b.bio,
}));

export const mockCampaigns: Campaign[] = [
  {
    id: 'cm1', brandId: 'b1', brandName: 'Nova Skincare', brandLogo: avatar('nova-skincare'),
    title: 'Get-Ready-With-Me featuring Nova Glow Serum', description: 'Looking for relatable / lifestyle creators to feature our new Glow Serum in a GRWM-style reel.',
    niche: 'Relatable Content', budget: '₹35,000', deliverables: '1 Instagram Reel + 2 Stories', platform: 'Instagram',
    deadline: '2026-07-10', status: 'open',
    applicants: [{ creatorId: 'u1', creatorName: 'Priya Nair', creatorAvatar: avatar('priya-nair'), appliedAt: '2026-06-18T10:00:00Z', status: 'applied' }],
  },
  {
    id: 'cm2', brandId: 'b2', brandName: 'Flux Energy', brandLogo: avatar('flux-energy'),
    title: 'Pre-workout honest review', description: 'Fitness creators to do an honest taste + performance review of our new pre-workout mix.',
    niche: 'Fitness', budget: '₹20,000', deliverables: '1 YouTube Short + 1 Instagram Reel', platform: 'Multi-platform',
    deadline: '2026-07-05', status: 'open', applicants: [],
  },
  {
    id: 'cm3', brandId: 'b3', brandName: 'Looped', brandLogo: avatar('looped-app'),
    title: 'Relatable skit: \u201cWhen group chats go silent\u201d', description: 'Comedy/relatable creators to make a skit weaving in the Looped app naturally.',
    niche: 'Relatable Content', budget: '₹18,000', deliverables: '1 Instagram Reel', platform: 'Instagram',
    deadline: '2026-06-30', status: 'open',
    applicants: [{ creatorId: 'me', creatorName: 'Prince Singh', creatorAvatar: '/prince-singh.jpg', appliedAt: '2026-06-19T09:00:00Z', status: 'shortlisted' }],
  },
];

export const mockRateCard: RateCardItem[] = [
  { id: 'r1', platform: 'Instagram', format: 'Reel (15-30s)', price: 18000, currency: 'INR', notes: 'Includes 1 round of revisions' },
  { id: 'r2', platform: 'Instagram', format: 'Story set (3 frames)', price: 6000, currency: 'INR' },
  { id: 'r3', platform: 'YouTube', format: 'Short', price: 12000, currency: 'INR' },
  { id: 'r4', platform: 'YouTube', format: 'Dedicated video (3-5 min)', price: 45000, currency: 'INR', notes: 'Brief required 7 days in advance' },
];

export const mockPortfolio: PortfolioItem[] = [
  { id: 'pf1', title: 'Monday Mornings skit', brand: 'Personal', imageUrl: photo(401), metric: '512K views · 41K likes' },
  { id: 'pf2', title: 'Looped App integration', brand: 'Looped', imageUrl: photo(402), metric: '298K views · 4.2% CTR' },
  { id: 'pf3', title: 'GRWM ft. relatable chaos', brand: 'Personal', imageUrl: photo(403), metric: '870K views · 62K likes' },
];
