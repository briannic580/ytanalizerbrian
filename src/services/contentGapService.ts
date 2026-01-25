// Content Gap Analysis Service

import { VideoItem } from '../types';

export interface ContentGapResult {
  missingTopics: Array<{
    topic: string;
    frequency: number;
    trendScore: number;
  }>;
  channelTopics: string[];
  trendingTopics: string[];
  overlapPercentage: number;
  recommendations: Array<{
    topic: string;
    reason: string;
    potentialViews: string;
  }>;
}

// Extract topics from video tags and titles
const extractTopics = (videos: VideoItem[]): Map<string, number> => {
  const topicMap = new Map<string, number>();

  videos.forEach(video => {
    // Extract from tags
    video.tags.forEach(tag => {
      const normalizedTag = tag.toLowerCase().trim();
      if (normalizedTag.length > 2) {
        topicMap.set(normalizedTag, (topicMap.get(normalizedTag) || 0) + 1);
      }
    });

    // Extract key phrases from title (simple extraction)
    const titleWords = video.title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    // Extract 2-word phrases
    for (let i = 0; i < titleWords.length - 1; i++) {
      const phrase = `${titleWords[i]} ${titleWords[i + 1]}`;
      topicMap.set(phrase, (topicMap.get(phrase) || 0) + 1);
    }
  });

  return topicMap;
};

// Calculate average views for videos with a specific topic
const calculateTopicPotential = (topic: string, trendingVideos: VideoItem[]): number => {
  const matchingVideos = trendingVideos.filter(v => 
    v.tags.some(t => t.toLowerCase().includes(topic.toLowerCase())) ||
    v.title.toLowerCase().includes(topic.toLowerCase())
  );

  if (matchingVideos.length === 0) return 0;

  const avgViews = matchingVideos.reduce((sum, v) => sum + v.viewCountRaw, 0) / matchingVideos.length;
  return avgViews;
};

const formatPotentialViews = (views: number): string => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M+ potential views`;
  if (views >= 1000) return `${(views / 1000).toFixed(0)}K+ potential views`;
  return `${views} potential views`;
};

export const analyzeContentGap = (
  channelVideos: VideoItem[],
  trendingVideos: VideoItem[]
): ContentGapResult => {
  const channelTopicsMap = extractTopics(channelVideos);
  const trendingTopicsMap = extractTopics(trendingVideos);

  // Get top topics from each
  const channelTopics = Array.from(channelTopicsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([topic]) => topic);

  const trendingTopics = Array.from(trendingTopicsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([topic]) => topic);

  // Find gaps: trending topics NOT in channel
  const channelTopicsSet = new Set(channelTopics);
  const missingTopicsRaw = trendingTopics.filter(topic => !channelTopicsSet.has(topic));

  // Calculate overlap
  const overlapCount = trendingTopics.filter(t => channelTopicsSet.has(t)).length;
  const overlapPercentage = Math.round((overlapCount / trendingTopics.length) * 100);

  // Score missing topics by frequency and views
  const missingTopics = missingTopicsRaw
    .map(topic => {
      const frequency = trendingTopicsMap.get(topic) || 0;
      const potential = calculateTopicPotential(topic, trendingVideos);
      return {
        topic,
        frequency,
        trendScore: Math.round((frequency * 10) + (potential / 10000))
      };
    })
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 15);

  // Generate recommendations
  const recommendations = missingTopics.slice(0, 5).map(item => {
    const potential = calculateTopicPotential(item.topic, trendingVideos);
    return {
      topic: item.topic,
      reason: `Trending in ${item.frequency} videos but missing from your channel`,
      potentialViews: formatPotentialViews(potential)
    };
  });

  return {
    missingTopics,
    channelTopics,
    trendingTopics,
    overlapPercentage,
    recommendations
  };
};

// Categorize topics into content buckets
export const categorizeTopics = (topics: string[]): Map<string, string[]> => {
  const categories = new Map<string, string[]>();
  
  const categoryKeywords: Record<string, string[]> = {
    'Tutorial & How-to': ['tutorial', 'cara', 'how', 'guide', 'tips', 'belajar', 'learn'],
    'Entertainment': ['funny', 'lucu', 'comedy', 'prank', 'challenge', 'reaction'],
    'Gaming': ['game', 'gameplay', 'gaming', 'play', 'minecraft', 'mobile legends', 'ff'],
    'Lifestyle': ['life', 'vlog', 'daily', 'routine', 'day in', 'story'],
    'Technology': ['tech', 'review', 'unboxing', 'gadget', 'phone', 'laptop'],
    'Music': ['music', 'song', 'cover', 'lagu', 'karaoke', 'remix'],
    'Education': ['education', 'learn', 'study', 'school', 'science', 'math'],
    'News & Current': ['news', 'berita', 'update', 'breaking', 'terbaru']
  };

  topics.forEach(topic => {
    let assigned = false;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => topic.includes(kw))) {
        const existing = categories.get(category) || [];
        existing.push(topic);
        categories.set(category, existing);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      const existing = categories.get('Other') || [];
      existing.push(topic);
      categories.set('Other', existing);
    }
  });

  return categories;
};
