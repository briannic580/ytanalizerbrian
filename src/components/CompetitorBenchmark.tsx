import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChannelStats, VideoItem } from '../types';
import { fetchChannelInfo } from '../services/youtubeService';
import { IconChart, IconLoader, IconTrending } from '../constants/icons';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface BenchmarkProps {
  apiKey: string;
}

interface ChannelData {
  stats: ChannelStats;
  videos: VideoItem[];
  uploadFrequency: number;
  avgEngagementRate: number;
  topTags: string[];
}

interface ComparisonResult {
  ch1: ChannelData;
  ch2: ChannelData;
  tagOverlap: string[];
  uniqueTags1: string[];
  uniqueTags2: string[];
}

const fetchChannelVideos = async (apiKey: string, channelId: string): Promise<VideoItem[]> => {
  // Fetch channel's uploads playlist
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
  );
  const channelData = await channelRes.json();
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  
  if (!uploadsPlaylistId) return [];

  // Fetch recent videos from uploads playlist
  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=10&key=${apiKey}`
  );
  const playlistData = await playlistRes.json();
  const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId) || [];
  
  if (videoIds.length === 0) return [];

  // Fetch video details
  const videosRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`
  );
  const videosData = await videosRes.json();

  return videosData.items?.map((v: any) => {
    const views = Number(v.statistics.viewCount || 0);
    const likes = Number(v.statistics.likeCount || 0);
    const comments = Number(v.statistics.commentCount || 0);
    const er = views > 0 ? ((likes + comments) / views) * 100 : 0;

    return {
      id: v.id,
      title: v.snippet.title,
      tags: v.snippet.tags || [],
      viewCountRaw: views,
      likeCountRaw: likes,
      commentCountRaw: comments,
      engagementRate: parseFloat(er.toFixed(2)),
      publishedAt: v.snippet.publishedAt,
    } as VideoItem;
  }) || [];
};

const resolveChannelId = async (apiKey: string, input: string): Promise<string | null> => {
  const cleaned = input.trim().replace(/.*youtube\.com\//g, '').replace(/^@/, '');
  
  // If already looks like a channel ID
  if (cleaned.startsWith('UC') && cleaned.length === 24) {
    return cleaned;
  }

  // Try to resolve handle
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(cleaned)}&key=${apiKey}`
    );
    const data = await res.json();
    if (data.items?.[0]?.id) return data.items[0].id;
  } catch {}

  // Fallback to search
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(cleaned)}&maxResults=1&key=${apiKey}`
    );
    const data = await res.json();
    if (data.items?.[0]) {
      return data.items[0].id.channelId || data.items[0].snippet.channelId;
    }
  } catch {}

  return null;
};

const CompetitorBenchmark: React.FC<BenchmarkProps> = ({ apiKey }) => {
  const [ch1Query, setCh1Query] = useState('');
  const [ch2Query, setCh2Query] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!apiKey) {
      setError('API Key diperlukan. Silakan masukkan di Settings.');
      return;
    }
    if (!ch1Query.trim() || !ch2Query.trim()) {
      setError('Masukkan kedua Channel ID atau Handle');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Resolve channel IDs
      const [id1, id2] = await Promise.all([
        resolveChannelId(apiKey, ch1Query),
        resolveChannelId(apiKey, ch2Query)
      ]);

      if (!id1 || !id2) {
        throw new Error('Channel tidak ditemukan. Pastikan ID atau handle benar.');
      }

      // Fetch channel stats and videos in parallel
      const [stats1, stats2, videos1, videos2] = await Promise.all([
        fetchChannelInfo(apiKey, id1),
        fetchChannelInfo(apiKey, id2),
        fetchChannelVideos(apiKey, id1),
        fetchChannelVideos(apiKey, id2)
      ]);

      if (!stats1 || !stats2) {
        throw new Error('Gagal mengambil statistik channel.');
      }

      // Calculate metrics
      const calculateMetrics = (videos: VideoItem[]): { freq: number; avgER: number; tags: string[] } => {
        if (videos.length < 2) return { freq: 0, avgER: 0, tags: [] };
        
        const dates = videos.map(v => new Date(v.publishedAt).getTime()).sort((a, b) => b - a);
        const weeksDiff = (dates[0] - dates[dates.length - 1]) / (1000 * 60 * 60 * 24 * 7);
        const freq = weeksDiff > 0 ? videos.length / weeksDiff : 0;
        
        const avgER = videos.reduce((sum, v) => sum + v.engagementRate, 0) / videos.length;
        
        const allTags = videos.flatMap(v => v.tags || []);
        const tagCounts = new Map<string, number>();
        allTags.forEach(tag => tagCounts.set(tag.toLowerCase(), (tagCounts.get(tag.toLowerCase()) || 0) + 1));
        const topTags = Array.from(tagCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([tag]) => tag);
        
        return { freq, avgER, tags: topTags };
      };

      const metrics1 = calculateMetrics(videos1);
      const metrics2 = calculateMetrics(videos2);

      // Calculate tag overlap
      const set1 = new Set(metrics1.tags);
      const set2 = new Set(metrics2.tags);
      const overlap = metrics1.tags.filter(t => set2.has(t));
      const unique1 = metrics1.tags.filter(t => !set2.has(t));
      const unique2 = metrics2.tags.filter(t => !set1.has(t));

      setResult({
        ch1: {
          stats: stats1,
          videos: videos1,
          uploadFrequency: metrics1.freq,
          avgEngagementRate: metrics1.avgER,
          topTags: metrics1.tags
        },
        ch2: {
          stats: stats2,
          videos: videos2,
          uploadFrequency: metrics2.freq,
          avgEngagementRate: metrics2.avgER,
          topTags: metrics2.tags
        },
        tagOverlap: overlap,
        uniqueTags1: unique1,
        uniqueTags2: unique2
      });
    } catch (err: any) {
      setError(err.message || 'Gagal membandingkan channel');
    } finally {
      setLoading(false);
    }
  };

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!result) return [];
    
    const normalize = (v1: number, v2: number) => {
      const max = Math.max(v1, v2, 1);
      return { n1: (v1 / max) * 100, n2: (v2 / max) * 100 };
    };

    const subs = normalize(result.ch1.stats.subCountRaw, result.ch2.stats.subCountRaw);
    const views = normalize(
      parseInt(result.ch1.stats.viewCount.replace(/[^0-9]/g, '')),
      parseInt(result.ch2.stats.viewCount.replace(/[^0-9]/g, ''))
    );
    const vids = normalize(
      parseInt(result.ch1.stats.videoCount.replace(/[^0-9]/g, '')),
      parseInt(result.ch2.stats.videoCount.replace(/[^0-9]/g, ''))
    );
    const freq = normalize(result.ch1.uploadFrequency, result.ch2.uploadFrequency);
    const er = normalize(result.ch1.avgEngagementRate, result.ch2.avgEngagementRate);

    return [
      { metric: 'Subscribers', ch1: subs.n1, ch2: subs.n2 },
      { metric: 'Total Views', ch1: views.n1, ch2: views.n2 },
      { metric: 'Video Count', ch1: vids.n1, ch2: vids.n2 },
      { metric: 'Upload Freq', ch1: freq.n1, ch2: freq.n2 },
      { metric: 'Avg ER%', ch1: er.n1, ch2: er.n2 },
    ];
  }, [result]);

  // Bar chart data for engagement comparison
  const engagementBarData = useMemo(() => {
    if (!result) return [];
    return [
      { name: 'Channel A', value: result.ch1.avgEngagementRate, fill: 'hsl(var(--primary))' },
      { name: 'Channel B', value: result.ch2.avgEngagementRate, fill: 'hsl(var(--destructive))' },
    ];
  }, [result]);

  const MetricRow = ({ label, v1, v2, unit = '', higherIsBetter = true }: { 
    label: string; v1: number | string; v2: number | string; unit?: string; higherIsBetter?: boolean 
  }) => {
    const num1 = typeof v1 === 'number' ? v1 : parseFloat(String(v1).replace(/[^0-9.]/g, ''));
    const num2 = typeof v2 === 'number' ? v2 : parseFloat(String(v2).replace(/[^0-9.]/g, ''));
    const isV1Better = higherIsBetter ? num1 > num2 : num1 < num2;
    const isTie = num1 === num2;
    
    return (
      <div className="grid grid-cols-3 py-4 border-b border-border">
        <div className={`text-center font-bold text-lg transition-colors duration-300 ${
          isTie ? 'text-foreground' : isV1Better ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {typeof v1 === 'number' ? v1.toLocaleString() : v1}{unit}
          {!isTie && isV1Better && <span className="ml-1 text-xs">👑</span>}
        </div>
        <div className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {label}
        </div>
        <div className={`text-center font-bold text-lg transition-colors duration-300 ${
          isTie ? 'text-foreground' : !isV1Better ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {typeof v2 === 'number' ? v2.toLocaleString() : v2}{unit}
          {!isTie && !isV1Better && <span className="ml-1 text-xs">👑</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in">
      {/* Input Section */}
      <div className="flex flex-col md:flex-row gap-4">
        <input 
          value={ch1Query} 
          onChange={e => setCh1Query(e.target.value)} 
          placeholder="Channel 1 (ID, @handle, or URL)" 
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 ring-primary/20 outline-none transition-all duration-300" 
        />
        <div className="flex items-center justify-center font-black text-muted-foreground">VS</div>
        <input 
          value={ch2Query} 
          onChange={e => setCh2Query(e.target.value)} 
          placeholder="Channel 2 (ID, @handle, or URL)" 
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 ring-primary/20 outline-none transition-all duration-300" 
        />
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCompare} 
          disabled={loading}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all duration-300 active:scale-95 disabled:opacity-50"
        >
          {loading ? <IconLoader className="w-4 h-4" /> : <IconChart className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Compare'}
        </motion.button>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Channel Headers */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-premium">
              <div className="grid grid-cols-3 mb-10">
                <div className="flex flex-col items-center gap-3">
                  <img src={result.ch1.stats.avatar} className="w-20 h-20 rounded-full border-4 border-primary/20 object-cover" alt="Channel A" />
                  <span className="font-black text-foreground text-center">Channel A</span>
                  {result.ch1.avgEngagementRate > result.ch2.avgEngagementRate && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                      Higher ER 🔥
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <div className="px-4 py-1 bg-secondary rounded-full text-[10px] font-black text-muted-foreground">
                    BENCHMARK
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <img src={result.ch2.stats.avatar} className="w-20 h-20 rounded-full border-4 border-destructive/20 object-cover" alt="Channel B" />
                  <span className="font-black text-foreground text-center">Channel B</span>
                  {result.ch2.avgEngagementRate > result.ch1.avgEngagementRate && (
                    <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-[10px] font-bold rounded-full">
                      Higher ER 🔥
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics Comparison */}
              <MetricRow label="Subscribers" v1={result.ch1.stats.subCountRaw} v2={result.ch2.stats.subCountRaw} />
              <MetricRow label="Total Views" v1={result.ch1.stats.viewCount} v2={result.ch2.stats.viewCount} />
              <MetricRow label="Video Count" v1={result.ch1.stats.videoCount} v2={result.ch2.stats.videoCount} />
              <MetricRow 
                label="Upload/Week" 
                v1={result.ch1.uploadFrequency.toFixed(1)} 
                v2={result.ch2.uploadFrequency.toFixed(1)} 
              />
              <MetricRow 
                label="Avg ER%" 
                v1={result.ch1.avgEngagementRate.toFixed(2)} 
                v2={result.ch2.avgEngagementRate.toFixed(2)} 
                unit="%" 
              />
            </div>

            {/* Radar Chart */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-premium">
              <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
                <IconChart className="w-5 h-5 text-primary" />
                Performance Comparison
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Radar 
                      name="Channel A" 
                      dataKey="ch1" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3} 
                    />
                    <Radar 
                      name="Channel B" 
                      dataKey="ch2" 
                      stroke="hsl(var(--destructive))" 
                      fill="hsl(var(--destructive))" 
                      fillOpacity={0.3} 
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Engagement Bar Chart */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-premium">
              <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
                <IconTrending className="w-5 h-5 text-primary" />
                Engagement Rate Comparison
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementBarData} layout="vertical">
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={100} />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Engagement Rate']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tag Analysis */}
            <div className="bg-card rounded-3xl p-8 border border-border shadow-premium">
              <h3 className="text-lg font-black text-foreground mb-6">Tag Overlap Analysis</h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* Overlap Tags */}
                <div>
                  <h4 className="text-sm font-bold text-primary mb-3">
                    Shared Tags ({result.tagOverlap.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.tagOverlap.slice(0, 10).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg">
                        {tag}
                      </span>
                    ))}
                    {result.tagOverlap.length === 0 && (
                      <span className="text-muted-foreground text-sm italic">No overlap</span>
                    )}
                  </div>
                </div>

                {/* Channel A Unique */}
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-3">
                    Channel A Only ({result.uniqueTags1.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.uniqueTags1.slice(0, 8).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-secondary text-foreground text-xs font-medium rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Channel B Unique */}
                <div>
                  <h4 className="text-sm font-bold text-destructive mb-3">
                    Channel B Only ({result.uniqueTags2.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.uniqueTags2.slice(0, 8).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!result && !loading && !error && (
        <div className="text-center py-20 text-muted-foreground font-medium italic">
          Masukkan Channel ID atau @handle untuk membandingkan performa
        </div>
      )}
    </div>
  );
};

export default CompetitorBenchmark;