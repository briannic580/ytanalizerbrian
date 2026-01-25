import React, { useMemo } from 'react';
import { VideoItem, ChannelStats } from '../types';

interface InsightsProps {
  videos: VideoItem[];
  stats?: ChannelStats;
}

const InsightsDashboard: React.FC<InsightsProps> = ({ videos, stats }) => {
  const tagCloud = useMemo(() => {
    const counts: Record<string, number> = {};
    videos.forEach(v => {
      v.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  }, [videos]);

  const statsData = useMemo(() => {
    const totalER = videos.reduce((acc, v) => acc + v.engagementRate, 0);
    const shortsCount = videos.filter(v => v.isShort).length;
    const avgER = totalER / (videos.length || 1);
    const outliers = videos.filter(v => v.isOutlier).length;

    return { avgER, shortsCount, longCount: videos.length - shortsCount, outliers };
  }, [videos]);

  return (
    <div className="space-y-8 animate-in">
      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-3xl border border-border shadow-premium hover-lift">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">
            Avg. Engagement
          </span>
          <span className="text-3xl font-black text-primary">{statsData.avgER.toFixed(2)}%</span>
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border shadow-premium hover-lift">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">
            Outliers Found
          </span>
          <span className="text-3xl font-black text-orange-500">{statsData.outliers}</span>
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border shadow-premium hover-lift">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">
            Video Distribution
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-lg font-bold text-foreground">{statsData.longCount} Long</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-lg font-bold text-foreground">{statsData.shortsCount} Shorts</span>
          </div>
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border shadow-premium hover-lift">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">
            Channel Strength
          </span>
          <span className="text-xl font-bold text-emerald-500">🔥 High Potential</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Keyword Intelligence */}
        <div className="bg-card p-8 rounded-3xl border border-border">
          <h3 className="text-lg font-black text-foreground mb-6 uppercase tracking-tight">
            SEO Keyword Intelligence
          </h3>
          <div className="flex flex-wrap gap-2">
            {tagCloud.map(([tag, count], i) => {
              const size = 12 + (count * 2);
              return (
                <span 
                  key={i} 
                  className="px-3 py-1 bg-secondary rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300 cursor-pointer" 
                  style={{ fontSize: `${Math.min(size, 24)}px` }}
                >
                  {tag} <span className="text-[10px] font-bold opacity-50">({count})</span>
                </span>
              );
            })}
            {tagCloud.length === 0 && (
              <span className="text-muted-foreground italic">No tags found in videos</span>
            )}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-card p-8 rounded-3xl border border-border">
          <h3 className="text-lg font-black text-foreground mb-6 uppercase tracking-tight">
            Performance Chart
          </h3>
          <div className="h-40 w-full flex items-end gap-1">
            {videos.slice(0, 30).map((v, i) => (
              <div
                key={i}
                className={`flex-1 min-w-[4px] rounded-t-sm transition-all duration-500 hover:opacity-100 opacity-60 ${v.isOutlier ? 'bg-orange-500' : 'bg-primary'}`}
                style={{ 
                  height: `${Math.min(v.engagementRate * 5, 100)}%`,
                  animationDelay: `${i * 30}ms`
                }}
                title={`${v.title}: ${v.engagementRate}% ER`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-muted-foreground">
            <span>LATEST CONTENT</span>
            <span>OLDER CONTENT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsDashboard;
