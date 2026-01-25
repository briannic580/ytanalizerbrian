export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  views: string;
  viewCountRaw: number;
  likes: string;
  likeCountRaw: number;
  comments: string;
  commentCountRaw: number;
  engagementRate: number;
  tags: string[];
  publishedAt: string;
  publishedAtDate: Date;
  publishedTimeAgo: string;
  durationSec: number;
  durationFormatted: string;
  channelTitle: string;
  channelId: string;
  isShort: boolean;
  isOutlier?: boolean;
}

export interface ChannelStats {
  subscriberCount: string;
  subCountRaw: number;
  viewCount: string;
  videoCount: string;
  customUrl: string;
  description: string;
  avatar: string;
  banner?: string;
}

export interface AIAnalysisResult {
  hookScore: number;
  sentiment: string;
  suggestions: string[];
  potentialViralFactor: string;
}

export interface ScriptOutline {
  hook: string;
  intro: string;
  corePoints: string[];
  retentionTricks: string[];
  cta: string;
}

export interface ContentGapResult {
  trendingTopics: string[];
  missedOpportunities: string[];
  suggestedFormat: string;
  explanation: string;
}

export interface AnalyzedData {
  videos: VideoItem[];
  channelTitle?: string;
  channelId?: string;
  channelStats?: ChannelStats;
  totalFound: number;
}

// Navigation Modes
export type AnalysisMode = 'dashboard' | 'trending' | 'insights' | 'benchmark' | 'saved' | 'content_gap' | 'history';

// Content Type Filter
export type ContentTypeFilter = 'all' | 'long' | 'shorts';

export type FetchLimit = 10 | 50 | 100 | 500 | 1000 | 5000;

export type SortOption = 'newest' | 'oldest' | 'popular' | 'most_liked' | 'highest_er';

export type DurationRange = 'all' | 'under_1' | '1_5' | '5_20' | 'over_20';

export type MinViewsOption = 0 | 1000 | 5000 | 10000 | 25000 | 50000 | 100000 | 250000 | 500000 | 1000000 | 5000000;

export type MinLikesOption = 0 | 100 | 500 | 1000 | 5000 | 10000 | 50000 | 100000;

export type ToastType = 'success' | 'error' | 'loading';

export interface ToastState {
  message: string;
  type: ToastType;
}

export interface TrendingRegion {
  code: string;
  name: string;
}

declare global {
  interface Window {
    JSZip: any;
    saveAs: any;
    XLSX: any;
  }
}
