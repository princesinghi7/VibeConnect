export type AccountType = 'creator' | 'brand';

export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  facebook?: string;
  twitter?: string;
}

export interface User {
  id: string;
  accountType: AccountType;
  name: string;
  handle: string;
  avatarUrl: string;
  coverUrl: string;
  role: string;
  location: string;
  bio: string;
  stats: { connections: number; projects: number; posts: number };
  skills: string[];
  status: 'online' | 'building' | 'offline';
  email: string;
  password: string;

  // creator-specific
  niche?: string;
  followers?: number;
  engagementRate?: number;
  socials?: SocialLinks;

  // brand-specific
  companyName?: string;
  industry?: string;
  budgetRange?: string;
  website?: string;
  targetNiches?: string[];
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  tag?: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  comments: { id: string; authorId: string; content: string; createdAt: string }[];
}

export interface Connection {
  userId: string;
  targetId: string;
  status: 'connected' | 'pending' | 'suggested';
}

export interface ChatMessage {
  id: string;
  threadId: string;
  fromUserId: string;
  content: string;
  createdAt: string;
}

export interface CampaignApplicant {
  creatorId: string;
  appliedAt: string;
  status: 'applied' | 'shortlisted' | 'accepted' | 'rejected';
}

export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  description: string;
  niche: string;
  budget: string;
  deliverables: string;
  platform: string;
  deadline: string;
  status: 'open' | 'closed';
  applicants: CampaignApplicant[];
}

export interface RateCardItem {
  id: string;
  platform: string;
  format: string;
  price: number;
  currency: string;
  notes?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  brand: string;
  imageUrl: string;
  metric: string;
  link?: string;
}

const avatar = (seed: string) => `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;
const photo = (id: number) => `https://picsum.photos/seed/${id}/640/360`;

export const users: User[] = [
  {
    id: 'me', accountType: 'creator', name: 'Prince Singh', handle: '@princesinghofficial',
    avatarUrl: '/prince-singh.jpg', coverUrl: '/prince-singh.jpg',
    role: 'Content Creator · Relatable Content', location: 'Vadodara, Gujarat, IN',
    bio: 'Creating relatable content people actually see themselves in. Building my creator business in public — reels, stories, and real conversations with my audience.',
    stats: { connections: 248, projects: 16, posts: 92 },
    skills: ['Reels', 'Storytelling', 'Brand Collabs', 'Editing'],
    status: 'building', email: 'demo@vibeconnect.dev', password: 'demo1234',
    niche: 'Relatable Content', followers: 184000, engagementRate: 7.2,
    socials: {
      instagram: 'https://instagram.com/princesinghofficial',
      youtube: 'https://youtube.com/@epicprince',
      facebook: 'https://facebook.com/PrinceSingh',
    },
  },
  {
    id: 'u1', accountType: 'creator', name: 'Priya Nair', handle: '@priya.builds', avatarUrl: avatar('priya-nair'),
    coverUrl: photo(102), role: 'Lifestyle Creator', location: 'Bengaluru, IN',
    bio: 'Design systems nerd turned lifestyle creator.', stats: { connections: 512, projects: 8, posts: 140 },
    skills: ['Reels', 'Aesthetic Content'], status: 'online', email: 'priya@example.com', password: 'x',
    niche: 'Lifestyle', followers: 96000, engagementRate: 5.4, socials: { instagram: 'https://instagram.com/priya.builds' },
  },
  {
    id: 'u2', accountType: 'creator', name: 'Rohan Verma', handle: '@rohan.ships', avatarUrl: avatar('rohan-verma'),
    coverUrl: photo(103), role: 'Tech Creator', location: 'Pune, IN',
    bio: 'Breaking down tech, one reel at a time.', stats: { connections: 320, projects: 22, posts: 64 },
    skills: ['Tech Reviews', 'Scripting'], status: 'building', email: 'rohan@example.com', password: 'x',
    niche: 'Tech', followers: 210000, engagementRate: 6.1, socials: { youtube: 'https://youtube.com/@rohanships' },
  },
  {
    id: 'u3', accountType: 'creator', name: 'Saanvi Iyer', handle: '@saanvi.ai', avatarUrl: avatar('saanvi-iyer'),
    coverUrl: photo(104), role: 'Comedy Creator', location: 'Hyderabad, IN',
    bio: 'Training models, breaking biases, and making people laugh.', stats: { connections: 410, projects: 12, posts: 88 },
    skills: ['Sketches', 'Editing'], status: 'offline', email: 'saanvi@example.com', password: 'x',
    niche: 'Comedy', followers: 340000, engagementRate: 8.9, socials: { instagram: 'https://instagram.com/saanvi.ai' },
  },
  {
    id: 'u4', accountType: 'creator', name: 'Karthik Reddy', handle: '@karthik.dev', avatarUrl: avatar('karthik-reddy'),
    coverUrl: photo(105), role: 'Fitness Creator', location: 'Chennai, IN',
    bio: 'Automating workouts, not excuses.', stats: { connections: 275, projects: 19, posts: 51 },
    skills: ['Fitness Reels', 'Coaching'], status: 'online', email: 'karthik@example.com', password: 'x',
    niche: 'Fitness', followers: 128000, engagementRate: 6.7, socials: { instagram: 'https://instagram.com/karthik.dev' },
  },
  {
    id: 'b1', accountType: 'brand', name: 'Mamaearth', handle: '@mamaearth', avatarUrl: avatar('mamaearth'),
    coverUrl: photo(301), role: 'Personal Care & Beauty Brand', location: 'Gurugram, IN',
    bio: 'Toxin-free, natural personal care products for everyday Indian households.', stats: { connections: 60, projects: 14, posts: 30 },
    skills: [], status: 'online', email: 'partnerships@mamaearth.example.com', password: 'x',
    companyName: 'Mamaearth', industry: 'Beauty & Personal Care',
    budgetRange: '₹20,000 – ₹80,000 / campaign', targetNiches: ['Lifestyle', 'Beauty', 'Relatable Content'],
    website: 'https://mamaearth.in',
  },
  {
    id: 'b2', accountType: 'brand', name: 'boAt', handle: '@boat', avatarUrl: avatar('boat-lifestyle'),
    coverUrl: photo(302), role: 'Audio & Wearables Brand', location: 'Mumbai, IN',
    bio: 'India\u2019s homegrown audio and wearables brand, built for the young and the restless.', stats: { connections: 40, projects: 9, posts: 22 },
    skills: [], status: 'online', email: 'partnerships@boat.example.com', password: 'x',
    companyName: 'boAt', industry: 'Consumer Electronics',
    budgetRange: '₹15,000 – ₹60,000 / campaign', targetNiches: ['Tech', 'Fitness', 'Relatable Content'],
    website: 'https://www.boat-lifestyle.com',
  },
  {
    id: 'b3', accountType: 'brand', name: 'Zomato', handle: '@zomato', avatarUrl: avatar('zomato'),
    coverUrl: photo(303), role: 'Food Delivery & Dining', location: 'Gurugram, IN',
    bio: 'Discovering and delivering great food, one order at a time.', stats: { connections: 28, projects: 5, posts: 16 },
    skills: [], status: 'building', email: 'partnerships@zomato.example.com', password: 'x',
    companyName: 'Zomato', industry: 'Food & Beverage',
    budgetRange: '₹10,000 – ₹45,000 / campaign', targetNiches: ['Relatable Content', 'Comedy', 'Lifestyle'],
    website: 'https://www.zomato.com',
  },
  {
    id: 'b4', accountType: 'brand', name: 'Swiggy', handle: '@swiggy', avatarUrl: avatar('swiggy'),
    coverUrl: photo(304), role: 'Food & Quick Commerce', location: 'Bengaluru, IN',
    bio: 'On-demand food delivery and quick commerce, powering everyday convenience.', stats: { connections: 35, projects: 11, posts: 19 },
    skills: [], status: 'online', email: 'partnerships@swiggy.example.com', password: 'x',
    companyName: 'Swiggy', industry: 'Food & Quick Commerce',
    budgetRange: '₹12,000 – ₹50,000 / campaign', targetNiches: ['Relatable Content', 'Comedy', 'Tech'],
    website: 'https://www.swiggy.com',
  },
];

export const posts: Post[] = [
  {
    id: 'p1', authorId: 'u1',
    content: 'Shipped a new GRWM reel today — soft glam, zero filters. Restraint is underrated.',
    imageUrl: photo(201), tag: 'lifestyle', createdAt: '2026-06-19T14:20:00Z', likes: 142, likedBy: ['me'],
    comments: [{ id: 'c1', authorId: 'u2', content: 'This is clean!', createdAt: '2026-06-19T15:00:00Z' }],
  },
  {
    id: 'p2', authorId: 'u2',
    content: 'New reel breaking down why everyone\u2019s phone feels slower after 2 years. 1.2M views in 3 days.',
    tag: 'tech', createdAt: '2026-06-19T09:05:00Z', likes: 89, likedBy: [], comments: [],
  },
  {
    id: 'p3', authorId: 'u3',
    content: 'POV skit about Indian parents discovering WiFi passwords just hit 2M. Comedy niche is undefeated.',
    imageUrl: photo(202), tag: 'comedy', createdAt: '2026-06-18T19:40:00Z', likes: 210, likedBy: ['me'], comments: [],
  },
  {
    id: 'p4', authorId: 'me',
    content: 'New relatable reel about Monday mornings just crossed 500K views. Building this creator journey in public, one reel at a time.',
    imageUrl: photo(203), tag: 'relatablecontent', createdAt: '2026-06-18T08:10:00Z', likes: 56, likedBy: [], comments: [],
  },
];

export const connections: Connection[] = [
  { userId: 'me', targetId: 'u1', status: 'connected' },
  { userId: 'me', targetId: 'u2', status: 'connected' },
  { userId: 'me', targetId: 'u3', status: 'pending' },
  { userId: 'me', targetId: 'u4', status: 'suggested' },
];

export const threadParticipants: Record<string, string> = {
  t1: 'u1',
  t2: 'b1',
};

export const messages: ChatMessage[] = [
  { id: 'm1', threadId: 't1', fromUserId: 'u1', content: 'Hey! Loved your latest reel.', createdAt: '2026-06-19T15:50:00Z' },
  { id: 'm2', threadId: 't1', fromUserId: 'me', content: 'Thank you! Still tuning the format.', createdAt: '2026-06-19T15:55:00Z' },
  { id: 'm3', threadId: 't1', fromUserId: 'u1', content: 'Sent over the collab brief, take a look!', createdAt: '2026-06-19T16:02:00Z' },
  { id: 'm4', threadId: 't2', fromUserId: 'b1', content: 'Loved your last reel, want to collab?', createdAt: '2026-06-19T11:30:00Z' },
];

export const campaigns: Campaign[] = [
  {
    id: 'cm1', brandId: 'b1',
    title: 'Get-Ready-With-Me featuring Mamaearth Glow Serum',
    description: 'Looking for relatable / lifestyle creators to feature our new Glow Serum in a GRWM-style reel.',
    niche: 'Relatable Content', budget: '₹35,000', deliverables: '1 Instagram Reel + 2 Stories', platform: 'Instagram',
    deadline: '2026-07-10', status: 'open',
    applicants: [{ creatorId: 'u1', appliedAt: '2026-06-18T10:00:00Z', status: 'applied' }],
  },
  {
    id: 'cm2', brandId: 'b2',
    title: 'Honest review: new boAt earbuds',
    description: 'Tech/fitness creators to do an honest unboxing + performance review of our newest earbuds.',
    niche: 'Tech', budget: '₹20,000', deliverables: '1 YouTube Short + 1 Instagram Reel', platform: 'Multi-platform',
    deadline: '2026-07-05', status: 'open', applicants: [],
  },
  {
    id: 'cm3', brandId: 'b3',
    title: 'Relatable skit: "When the food is 2 hours late"',
    description: 'Comedy/relatable creators to make a skit weaving in the Zomato app naturally.',
    niche: 'Relatable Content', budget: '₹18,000', deliverables: '1 Instagram Reel', platform: 'Instagram',
    deadline: '2026-06-30', status: 'open',
    applicants: [{ creatorId: 'me', appliedAt: '2026-06-19T09:00:00Z', status: 'shortlisted' }],
  },
  {
    id: 'cm4', brandId: 'b4',
    title: '10-minute delivery, real reactions',
    description: 'Relatable/comedy creators to react in real time to how fast their order shows up.',
    niche: 'Relatable Content', budget: '₹16,000', deliverables: '1 Instagram Reel', platform: 'Instagram',
    deadline: '2026-07-08', status: 'open', applicants: [],
  },
];

export const rateCards: Record<string, RateCardItem[]> = {
  me: [
    { id: 'r1', platform: 'Instagram', format: 'Reel (15-30s)', price: 18000, currency: 'INR', notes: 'Includes 1 round of revisions' },
    { id: 'r2', platform: 'Instagram', format: 'Story set (3 frames)', price: 6000, currency: 'INR' },
    { id: 'r3', platform: 'YouTube', format: 'Short', price: 12000, currency: 'INR' },
    { id: 'r4', platform: 'YouTube', format: 'Dedicated video (3-5 min)', price: 45000, currency: 'INR', notes: 'Brief required 7 days in advance' },
  ],
};

export const portfolios: Record<string, PortfolioItem[]> = {
  me: [
    { id: 'pf1', title: 'Monday Mornings skit', brand: 'Personal', imageUrl: photo(401), metric: '512K views · 41K likes' },
    { id: 'pf2', title: 'Looped App integration', brand: 'Looped', imageUrl: photo(402), metric: '298K views · 4.2% CTR' },
    { id: 'pf3', title: 'GRWM ft. relatable chaos', brand: 'Personal', imageUrl: photo(403), metric: '870K views · 62K likes' },
  ],
};

export const analytics: Record<string, { month: string; followers: number; engagementRate: number }[]> = {
  me: [
    { month: 'Jan', followers: 142000, engagementRate: 5.8 },
    { month: 'Feb', followers: 151000, engagementRate: 6.0 },
    { month: 'Mar', followers: 159000, engagementRate: 6.3 },
    { month: 'Apr', followers: 167000, engagementRate: 6.6 },
    { month: 'May', followers: 176000, engagementRate: 6.9 },
    { month: 'Jun', followers: 184000, engagementRate: 7.2 },
  ],
};

export function publicUser(u: User) {
  const { password, email, ...rest } = u;
  return rest;
}
