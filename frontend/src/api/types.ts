export type AccountType = 'creator' | 'brand';

export interface SocialLinks {
  instagram?: string;
  instagramPostUrl?: string;
  youtube?: string;
  facebook?: string;
  twitter?: string;
}

export interface YoutubeStats {
  connected: boolean;
  message?: string;
  title?: string;
  thumbnail?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
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
  stats: {
    connections: number;
    projects: number;
    posts: number;
  };
  skills: string[];
  status: 'online' | 'building' | 'offline';

  // Creator-specific
  niche?: string;
  followers?: number;
  engagementRate?: number;
  socials?: SocialLinks;

  // Brand-specific
  companyName?: string;
  industry?: string;
  budgetRange?: string;
  website?: string;
  targetNiches?: string[];
}

export interface Post {
  id: string;
  author: Pick<User, 'id' | 'name' | 'handle' | 'avatarUrl' | 'role'>;
  content: string;
  imageUrl?: string;
  tag?: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: Pick<User, 'name' | 'avatarUrl'>;
  content: string;
  createdAt: string;
}

export interface Connection {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  role: string;
  mutuals: number;
  status: 'connected' | 'pending' | 'suggested';
  skills: string[];
}

export interface ChatThread {
  id: string;
  participant: Pick<User, 'name' | 'avatarUrl' | 'handle' | 'status'>;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  fromMe: boolean;
  content: string;
  createdAt: string;
}

// ---- Brand <-> Creator collab platform ----

export interface CreatorCard {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  niche: string;
  followers: number;
  engagementRate: number;
  location: string;
  socials: SocialLinks;
  bio: string;
  skills: string[];
}

export interface BrandCard {
  id: string;
  companyName: string;
  avatarUrl: string;
  industry: string;
  budgetRange: string;
  targetNiches: string[];
  website?: string;
  bio: string;
}

export interface Campaign {
  id: string;
  brandId: string;
  brandName: string;
  brandLogo: string;
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

export interface CampaignApplicant {
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  appliedAt: string;
  status: 'applied' | 'shortlisted' | 'accepted' | 'rejected';
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

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type AiProvider = 'claude' | 'grok';
