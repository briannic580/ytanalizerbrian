import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { VideoItem } from '../types';
import { IconHistory, IconChart } from '../constants/icons';

interface UploadScheduleAnalyzerProps {
  videos: VideoItem[];
}

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
  totalViews: number;
  avgViews: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const UploadScheduleAnalyzer: React.FC<UploadScheduleAnalyzerProps> = ({ videos }) => {
  const { heatmapData, maxCount, bestSlots, worstSlots, stats } = useMemo(() => {
    const grid: HeatmapCell[][] = Array(7).fill(null).map((_, day) =>
      Array(24).fill(null).map((_, hour) => ({
        day,
        hour,
        count: 0,
        totalViews: 0,
        avgViews: 0
      }))
    );

    videos.forEach(v => {
      const date = new Date(v.publishedAt);
      const day = date.getDay();
      const hour = date.getHours();
      grid[day][hour].count++;
      grid[day][hour].totalViews += v.viewCountRaw;
    });

    // Calculate averages
    const allCells: HeatmapCell[] = [];
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.count > 0) {
          cell.avgViews = Math.round(cell.totalViews / cell.count);
        }
        allCells.push(cell);
      });
    });

    const maxCount = Math.max(...allCells.map(c => c.count), 1);
    
    // Find best and worst slots
    const cellsWithUploads = allCells.filter(c => c.count > 0);
    const sortedByViews = [...cellsWithUploads].sort((a, b) => b.avgViews - a.avgViews);
    const bestSlots = sortedByViews.slice(0, 3);
    const worstSlots = sortedByViews.slice(-3).reverse();

    // Stats
    const totalUploads = videos.length;
    const uploadsPerWeek = videos.length > 0 
      ? (videos.length / Math.max(1, Math.ceil((Date.now() - new Date(videos[videos.length - 1].publishedAt).getTime()) / (7 * 24 * 60 * 60 * 1000))))
      : 0;

    return {
      heatmapData: grid,
      maxCount,
      bestSlots,
      worstSlots,
      stats: {
        totalUploads,
        uploadsPerWeek: uploadsPerWeek.toFixed(1)
      }
    };
  }, [videos]);

  const getHeatColor = (count: number, avgViews: number) => {
    if (count === 0) return 'bg-secondary';
    const intensity = count / maxCount;
    if (intensity > 0.7) return 'bg-primary';
    if (intensity > 0.4) return 'bg-primary/70';
    if (intensity > 0.2) return 'bg-primary/40';
    return 'bg-primary/20';
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <IconHistory className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Analyze a channel to see upload schedule patterns</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
          <IconHistory className="w-6 h-6 text-primary" />
          Upload Schedule Analysis
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Discover optimal posting times based on performance
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Uploads</p>
          <p className="text-2xl font-black text-foreground mt-1">{stats.totalUploads}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Uploads/Week</p>
          <p className="text-2xl font-black text-foreground mt-1">{stats.uploadsPerWeek}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Best Day</p>
          <p className="text-2xl font-black text-foreground mt-1">
            {bestSlots[0] ? DAYS[bestSlots[0].day] : '-'}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Best Hour</p>
          <p className="text-2xl font-black text-foreground mt-1">
            {bestSlots[0] ? formatHour(bestSlots[0].hour) : '-'}
          </p>
        </motion.div>
      </div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-2xl p-6 overflow-x-auto"
      >
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Upload Heatmap
        </h3>
        
        <div className="min-w-[700px]">
          {/* Hour labels */}
          <div className="flex mb-2 ml-12">
            {HOURS.filter((_, i) => i % 3 === 0).map(hour => (
              <div key={hour} className="w-[36px] text-[10px] text-muted-foreground text-center">
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Grid */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center gap-2 mb-1">
              <span className="w-10 text-xs font-bold text-muted-foreground">{day}</span>
              <div className="flex gap-0.5">
                {HOURS.map(hour => {
                  const cell = heatmapData[dayIndex][hour];
                  return (
                    <motion.div
                      key={`${dayIndex}-${hour}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + (dayIndex * 24 + hour) * 0.002 }}
                      className={`w-[12px] h-[20px] rounded-sm cursor-pointer transition-all hover:scale-125 hover:z-10 ${getHeatColor(cell.count, cell.avgViews)}`}
                      title={`${day} ${formatHour(hour)}: ${cell.count} videos, ${formatViews(cell.avgViews)} avg views`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-secondary rounded-sm" />
              <div className="w-4 h-4 bg-primary/20 rounded-sm" />
              <div className="w-4 h-4 bg-primary/40 rounded-sm" />
              <div className="w-4 h-4 bg-primary/70 rounded-sm" />
              <div className="w-4 h-4 bg-primary rounded-sm" />
            </div>
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </motion.div>

      {/* Best & Worst Times */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Best Times */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="text-emerald-500">✓</span> Best Performing Times
          </h3>
          <div className="space-y-3">
            {bestSlots.map((slot, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-foreground">{DAYS[slot.day]} at {formatHour(slot.hour)}</p>
                    <p className="text-xs text-muted-foreground">{slot.count} uploads</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatViews(slot.avgViews)}</p>
                  <p className="text-[10px] text-muted-foreground">avg views</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Worst Times */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="text-orange-500">!</span> Lower Performing Times
          </h3>
          <div className="space-y-3">
            {worstSlots.map((slot, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-foreground">{DAYS[slot.day]} at {formatHour(slot.hour)}</p>
                    <p className="text-xs text-muted-foreground">{slot.count} uploads</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600 dark:text-orange-400">{formatViews(slot.avgViews)}</p>
                  <p className="text-[10px] text-muted-foreground">avg views</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6"
      >
        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">
          💡 Recommendation
        </h3>
        <p className="text-foreground">
          Based on your channel's performance data, the optimal upload time is{' '}
          <strong>{bestSlots[0] ? `${DAYS[bestSlots[0].day]} at ${formatHour(bestSlots[0].hour)}` : 'not enough data'}</strong>.
          Videos uploaded during this time window receive{' '}
          <strong>{bestSlots[0] ? formatViews(bestSlots[0].avgViews) : '0'}</strong> average views.
        </p>
      </motion.div>
    </div>
  );
};

export default UploadScheduleAnalyzer;
