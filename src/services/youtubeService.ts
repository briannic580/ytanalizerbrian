import { VideoItem, AnalyzedData, FetchLimit, ChannelStats } from '../types';

// --- QUOTA & CACHE MANAGER ---
const QUOTA_KEY = 'yt_quota_usage_v1';
const DATE_KEY = 'yt_quota_date_v1';
const CACHE_PREFIX = 'yt_cache_';

export const getQuotaUsage = (): number => {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem(DATE_KEY);
  if (savedDate !== today) {
    localStorage.setItem(DATE_KEY, today);
    localStorage.setItem(QUOTA_KEY, '0');
    return 0;
  }
  return parseInt(localStorage.getItem(QUOTA_KEY) || '0', 10);
};

const trackQuota = (cost: number) => {
  const current = getQuotaUsage();
  const newest = current + cost;
  localStorage.setItem(QUOTA_KEY, newest.toString());
  window.dispatchEvent(new Event('quotaUpdated'));
};

const getCache = (key: string) => {
  const data = localStorage.getItem(CACHE_PREFIX + key);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    const now = new Date().getTime();
    // Cache expires after 1 hour
    if (now - parsed.timestamp > 3600000) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
};

const setCache = (key: string, value: any) => {
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
    value,
    timestamp: new Date().getTime()
  }));
};

// --- HELPERS ---
const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  return (hours * 3600) + (minutes * 60) + seconds;
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatNumber = (numStr: string | number): string => {
  const num = Number(numStr);
  if (isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const timeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " tahun lalu";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " bulan lalu";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " hari lalu";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " jam lalu";
  return "Baru saja";
};

// --- CORE LOGIC ---
const fetchVideoDetails = async (apiKey: string, videoIds: string[], subCount?: number): Promise<VideoItem[]> => {
  if (!videoIds.length) return [];
  const chunkSize = 50;
  let allItems: any[] = [];

  for (let i = 0; i < videoIds.length; i += chunkSize) {
    const chunk = videoIds.slice(i, i + chunkSize);
    const idsString = chunk.join(',');
    trackQuota(1);
    const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${idsString}&key=${apiKey}`);
    const vData = await vRes.json();
    if (vData.items) allItems = [...allItems, ...vData.items];
  }

  return allItems.map((v: any) => {
    const dur = parseDuration(v.contentDetails.duration);
    const thumbnails = v.snippet.thumbnails;
    const thumbObj = thumbnails.maxres || thumbnails.high || thumbnails.medium || thumbnails.default;
    const views = Number(v.statistics.viewCount || 0);
    const likes = Number(v.statistics.likeCount || 0);
    const comments = Number(v.statistics.commentCount || 0);
    let er = views > 0 ? ((likes + comments) / views) * 100 : 0;

    // Detect Shorts: Duration <= 60 seconds
    const isShort = dur <= 60;

    return {
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description || "",
      thumbnail: thumbObj?.url || "",
      views: formatNumber(views),
      viewCountRaw: views,
      likes: formatNumber(likes),
      likeCountRaw: likes,
      comments: formatNumber(comments),
      commentCountRaw: comments,
      engagementRate: parseFloat(er.toFixed(2)),
      tags: v.snippet.tags || [],
      publishedAt: v.snippet.publishedAt,
      publishedAtDate: new Date(v.snippet.publishedAt),
      publishedTimeAgo: timeAgo(v.snippet.publishedAt),
      durationSec: dur,
      durationFormatted: formatDuration(dur),
      channelTitle: v.snippet.channelTitle,
      channelId: v.snippet.channelId,
      isShort: isShort,
      isOutlier: subCount ? (views > subCount * 1.5) : (er > 12)
    };
  });
};

export const fetchTrendingVideos = async (apiKey: string, limit: number = 50, regionCode: string = 'ID'): Promise<AnalyzedData> => {
  let videoIds: string[] = [];
  let pageToken = "";

  while (videoIds.length < limit) {
    trackQuota(1);
    const maxResults = Math.min(limit - videoIds.length, 50);
    const chartUrl = `https://www.googleapis.com/youtube/v3/videos?part=id&chart=mostPopular&maxResults=${maxResults}&regionCode=${regionCode}${pageToken ? `&pageToken=${pageToken}` : ''}&key=${apiKey}`;

    const res = await fetch(chartUrl);
    const data = await res.json();

    if (!data.items?.length) break;

    const ids = data.items.map((i: any) => i.id);
    videoIds = [...videoIds, ...ids];
    pageToken = data.nextPageToken;

    if (!pageToken) break;
  }

  const videos = await fetchVideoDetails(apiKey, videoIds);

  return {
    videos: videos,
    channelTitle: `Trending Topics (${regionCode})`,
    totalFound: videos.length
  };
};

// Helper to resolve channel handle/username to channel ID
const resolveChannelId = async (apiKey: string, handle: string): Promise<{ channelId: string; channelTitle: string } | null> => {
  // Clean handle - remove @ if present
  const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
  
  // Try using channels endpoint with forHandle (newer API)
  trackQuota(1);
  try {
    const handleRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`);
    const handleData = await handleRes.json();
    
    if (handleData.items?.[0]) {
      return {
        channelId: handleData.items[0].id,
        channelTitle: handleData.items[0].snippet.title
      };
    }
  } catch (e) {
    console.log('Handle lookup failed, trying search...');
  }

  // Fallback to search API
  trackQuota(100);
  const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleanHandle)}&maxResults=1&key=${apiKey}`);
  const searchData = await searchRes.json();
  
  if (searchData.items?.[0]) {
    return {
      channelId: searchData.items[0].id.channelId || searchData.items[0].snippet.channelId,
      channelTitle: searchData.items[0].snippet.title
    };
  }
  
  return null;
};

// Helper to fetch all videos from a channel
const fetchChannelVideos = async (apiKey: string, channelId: string, limit: number): Promise<string[]> => {
  let videoIds: string[] = [];
  let pageToken = "";

  // First, try to get the uploads playlist for the channel (more reliable)
  trackQuota(1);
  const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`);
  const channelData = await channelRes.json();
  
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  
  if (uploadsPlaylistId) {
    // Use playlist items - more reliable and cheaper quota
    while (videoIds.length < limit) {
      trackQuota(1);
      const maxResults = Math.min(limit - videoIds.length, 50);
      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}${pageToken ? `&pageToken=${pageToken}` : ''}&key=${apiKey}`);
      const data = await res.json();
      
      if (!data.items?.length) break;
      
      const ids = data.items.map((i: any) => i.contentDetails.videoId).filter(Boolean);
      videoIds = [...videoIds, ...ids];
      pageToken = data.nextPageToken || "";
      
      if (!pageToken) break;
    }
  } else {
    // Fallback to search API
    while (videoIds.length < limit) {
      trackQuota(100);
      const maxResults = Math.min(limit - videoIds.length, 50);
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video${pageToken ? `&pageToken=${pageToken}` : ''}&key=${apiKey}`);
      const data = await res.json();
      
      if (!data.items?.length) break;
      
      videoIds = [...videoIds, ...data.items.map((i: any) => i.id.videoId).filter(Boolean)];
      pageToken = data.nextPageToken || "";
      
      if (!pageToken) break;
    }
  }

  return videoIds;
};

// Detect if query is a channel handle or username
const isChannelHandle = (query: string): boolean => {
  const trimmed = query.trim();
  // Matches @username pattern (direct handle input)
  if (/^@[\w.-]+$/.test(trimmed)) return true;
  // Matches YouTube channel URL patterns
  if (trimmed.includes('youtube.com/@')) return true;
  if (trimmed.includes('youtube.com/channel/')) return true;
  if (trimmed.includes('youtube.com/c/')) return true;
  if (trimmed.includes('youtube.com/user/')) return true;
  return false;
};

// Extract handle from query
const extractHandle = (query: string): string => {
  const trimmed = query.trim();
  
  // Direct @handle input
  if (/^@[\w.-]+$/.test(trimmed)) {
    return trimmed;
  }
  
  // From URL: youtube.com/@handle
  if (trimmed.includes('/@')) {
    const match = trimmed.match(/@([\w.-]+)/);
    return match ? `@${match[1]}` : trimmed;
  }
  
  // From URL: youtube.com/channel/UCxxxx
  if (trimmed.includes('/channel/')) {
    return trimmed.split('/channel/')[1].split(/[?&/]/)[0];
  }
  
  // From URL: youtube.com/c/ChannelName or youtube.com/user/username
  if (trimmed.includes('/c/') || trimmed.includes('/user/')) {
    const parts = trimmed.split('/');
    return parts[parts.length - 1].split(/[?&]/)[0];
  }
  
  return trimmed;
};

export const fetchYouTubeData = async (apiKey: string, query: string, limit: FetchLimit): Promise<AnalyzedData> => {
  const cleanQuery = query.trim();
  const cacheKey = `analysis_${cleanQuery}_${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let videoIds: string[] = [];
  let pageToken = "";
  let channelTitle = "Pencarian";
  let channelId = "";

  // Detect Playlist URL
  const playlistMatch = cleanQuery.match(/[&?]list=([^&]+)/);

  if (playlistMatch) {
    // --- PLAYLIST MODE ---
    const playlistId = playlistMatch[1];
    while (videoIds.length < limit) {
      trackQuota(1);
      const maxResults = Math.min(limit - videoIds.length, 50);
      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=${maxResults}${pageToken ? `&pageToken=${pageToken}` : ''}&key=${apiKey}`);
      const data = await res.json();
      if (!data.items?.length) break;
      videoIds = [...videoIds, ...data.items.map((i: any) => i.contentDetails.videoId)];
      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }
    channelTitle = "Playlist Content";
  }
  else if (isChannelHandle(cleanQuery)) {
    // --- CHANNEL MODE (Handle, URL, or @username) ---
    const handle = extractHandle(cleanQuery);
    
    // Check if it's already a channel ID (starts with UC)
    if (handle.startsWith('UC') && handle.length === 24) {
      channelId = handle;
    } else {
      // Resolve handle to channel ID
      const resolved = await resolveChannelId(apiKey, handle);
      if (resolved) {
        channelId = resolved.channelId;
        channelTitle = resolved.channelTitle;
      }
    }

    if (channelId) {
      videoIds = await fetchChannelVideos(apiKey, channelId, limit);
    }

    if (!channelId || !videoIds.length) {
      throw new Error(`Channel "${handle}" tidak ditemukan. Pastikan nama channel benar.`);
    }
  }
  else {
    // --- SEARCH MODE (General keyword search) ---
    while (videoIds.length < limit) {
      trackQuota(100);
      const maxResults = Math.min(limit - videoIds.length, 50);
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&q=${encodeURIComponent(cleanQuery)}&maxResults=${maxResults}&type=video${pageToken ? `&pageToken=${pageToken}` : ''}&key=${apiKey}`);
      const data = await res.json();
      if (!data.items?.length) break;
      videoIds = [...videoIds, ...data.items.map((i: any) => i.id.videoId)];
      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }
  }

  if (!videoIds.length) throw new Error("Tidak ada video yang ditemukan.");

  let stats;
  if (channelId) stats = await fetchChannelInfo(apiKey, channelId);

  const resultVideos = await fetchVideoDetails(apiKey, videoIds, stats?.subCountRaw);
  
  // Update channel title from video data if not set
  if (channelTitle === "Pencarian" && resultVideos.length > 0 && channelId) {
    channelTitle = resultVideos[0].channelTitle;
  }

  const finalResult: AnalyzedData = {
    videos: resultVideos,
    channelTitle,
    channelId,
    channelStats: stats,
    totalFound: resultVideos.length
  };

  setCache(cacheKey, finalResult);
  return finalResult;
};

export const fetchChannelInfo = async (apiKey: string, channelId: string): Promise<ChannelStats | undefined> => {
  trackQuota(1);
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`);
  const data = await res.json();
  if (data.items?.[0]) {
    const ch = data.items[0];
    return {
      subscriberCount: formatNumber(ch.statistics.subscriberCount),
      subCountRaw: Number(ch.statistics.subscriberCount),
      viewCount: formatNumber(ch.statistics.viewCount),
      videoCount: formatNumber(ch.statistics.videoCount),
      customUrl: ch.snippet.customUrl || "",
      description: ch.snippet.description || "",
      avatar: ch.snippet.thumbnails.high?.url || "",
      banner: ch.brandingSettings?.image?.bannerExternalUrl || ""
    };
  }
  return undefined;
};
