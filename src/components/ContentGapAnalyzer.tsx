import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VideoItem } from '../types';
import { analyzeContentGap, ContentGapResult, categorizeTopics } from '../services/contentGapService';
import { fetchTrendingVideos } from '../services/youtubeService';
import { IconSparkles, IconTrending, IconChart, IconLoader } from '../constants/icons';

interface ContentGapAnalyzerProps {
  channelVideos: VideoItem[];
  apiKey: string;
  onToast: (msg: string, type: 'success' | 'error' | 'loading') => void;
}

const ContentGapAnalyzer: React.FC<ContentGapAnalyzerProps> = ({ 
  channelVideos, 
  apiKey,
  onToast 
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContentGapResult | null>(null);
  const [selectedRegion, setSelectedRegion] = useState('ID');

  const regions = [
    { code: 'ID', name: 'Indonesia' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'UK' },
    { code: 'IN', name: 'India' },
  ];

  const runAnalysis = async () => {
    if (!apiKey) {
      onToast('API Key required', 'error');
      return;
    }

    if (channelVideos.length === 0) {
      onToast('Analyze a channel first', 'error');
      return;
    }

    setLoading(true);
    onToast('Analyzing content gaps...', 'loading');

    try {
      const trendingData = await fetchTrendingVideos(apiKey, 50, selectedRegion);
      const analysis = analyzeContentGap(channelVideos, trendingData.videos);
      setResult(analysis);
      onToast('Analysis complete!', 'success');
    } catch (err: any) {
      onToast(err.message || 'Failed to analyze', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
            <IconSparkles className="w-6 h-6 text-primary" />
            Content Gap Analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Discover untapped content opportunities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 ring-primary/20 outline-none"
          >
            {regions.map(r => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={runAnalysis}
            disabled={loading || channelVideos.length === 0}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <IconLoader className="w-4 h-4" />
                Analyzing...
              </>
            ) : (
              <>
                <IconChart className="w-4 h-4" />
                Analyze Gaps
              </>
            )}
          </motion.button>
        </div>
      </div>

      {channelVideos.length === 0 && !result && (
        <div className="text-center py-20 text-muted-foreground">
          <IconSparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Analyze a channel first to discover content gaps</p>
        </div>
      )}

      {result && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Overlap Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Topic Coverage
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-secondary"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${result.overlapPercentage * 2.51} 251`}
                    className="text-primary transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-foreground">
                  {result.overlapPercentage}%
                </span>
              </div>
              <div>
                <p className="text-foreground font-bold">Trend Coverage</p>
                <p className="text-sm text-muted-foreground">
                  Your channel covers {result.overlapPercentage}% of trending topics
                </p>
              </div>
            </div>
          </motion.div>

          {/* Missing Topics Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Opportunities Found
            </h3>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-black text-white">{result.missingTopics.length}</span>
              </div>
              <div>
                <p className="text-foreground font-bold">Untapped Topics</p>
                <p className="text-sm text-muted-foreground">
                  Trending topics not covered by your channel
                </p>
              </div>
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6 lg:col-span-2"
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <IconTrending className="w-4 h-4 text-primary" />
              Top Recommendations
            </h3>
            <div className="space-y-3">
              {result.recommendations.map((rec, i) => (
                <motion.div
                  key={rec.topic}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl"
                >
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground capitalize">{rec.topic}</p>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-bold">
                    {rec.potentialViews}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Missing Topics Tag Cloud */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-6 lg:col-span-2"
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Trending Topics You're Missing
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.missingTopics.slice(0, 20).map((topic, i) => (
                <motion.span
                  key={topic.topic}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.03 }}
                  className="px-3 py-1.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-sm font-medium capitalize"
                  style={{
                    fontSize: `${Math.max(12, Math.min(16, 10 + topic.trendScore / 10))}px`
                  }}
                >
                  {topic.topic}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Your Channel Topics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border rounded-2xl p-6 lg:col-span-2"
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Your Channel's Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.channelTopics.slice(0, 20).map((topic, i) => (
                <span
                  key={topic}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize ${
                    result.trendingTopics.includes(topic)
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {topic}
                  {result.trendingTopics.includes(topic) && ' ✓'}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ContentGapAnalyzer;
