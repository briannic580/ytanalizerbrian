import React, { useState } from 'react';
import { VideoItem, ToastType } from '../types';
import { IconCopy, IconDownload, IconBookmark, IconSparkles, IconDescription } from '../constants/icons';

interface VideoCardProps {
  video: VideoItem;
  index: number;
  onToast: (msg: string, type: ToastType) => void;
  onSaveToggle?: (video: VideoItem) => void;
  isSaved?: boolean;
}

export const SkeletonVideoCard: React.FC = () => (
  <div className="flex flex-col gap-4 w-full animate-pulse">
    <div className="aspect-video bg-muted rounded-2xl w-full animate-shimmer" />
    <div className="flex gap-3">
      <div className="w-10 h-10 bg-muted rounded-full shrink-0" />
      <div className="flex flex-col gap-2 w-full">
        <div className="h-4 bg-muted rounded-lg w-[90%]" />
        <div className="h-3 bg-muted rounded-lg w-[60%]" />
      </div>
    </div>
  </div>
);

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  return colors[Math.abs(hash) % colors.length];
};

const VideoCard: React.FC<VideoCardProps> = ({ video, index, onToast, onSaveToggle, isSaved }) => {
  const [isHovered, setIsHovered] = useState(false);

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.id}`).then(() => {
      onToast("Link tersalin", "success");
    });
  };

  const downloadThumb = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onToast("Mengunduh thumbnail...", "loading");
    try {
      const res = await fetch(video.thumbnail);
      const blob = await res.blob();
      if (window.saveAs) {
        const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 100);
        window.saveAs(blob, `${index + 1}. ${safeTitle}.jpg`);
        onToast("Thumbnail berhasil diunduh", "success");
      }
    } catch (err) {
      onToast("Gagal mengunduh gambar", "error");
    }
  };

  const getERStyles = (er: number) => {
    if (er >= 5) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';
    if (er >= 2) return 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  const avatarColor = stringToColor(video.channelTitle || 'YouTube');

  return (
    <div 
      className={`flex flex-col gap-3 group bg-card rounded-2xl p-2 transition-all duration-500 hover:shadow-premium-lg border border-transparent hover:border-border ${video.isShort ? 'row-span-2' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animation: `fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
        animationDelay: `${index * 50}ms`,
        opacity: 0
      }}
    >
      <div
        className={`relative rounded-xl overflow-hidden bg-muted cursor-pointer ${video.isShort ? 'aspect-[9/16]' : 'aspect-video'}`}
        onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
      >
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
          loading="lazy" 
        />

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
          {video.durationFormatted}
        </div>

        {/* Outlier Badge */}
        {video.isOutlier && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg animate-pulse-soft flex items-center gap-1">
            <span>🔥</span> OUTLIER
          </div>
        )}

        {/* ER Badge */}
        <div className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm shadow-sm ${getERStyles(video.engagementRate)}`}>
          {video.engagementRate}% ER
        </div>

        {/* Save Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); onSaveToggle?.(video); }} 
          className={`absolute top-2 right-2 p-2 rounded-xl backdrop-blur-md shadow-sm transition-all duration-300 ${
            isSaved 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-white/80 dark:bg-black/60 text-muted-foreground hover:bg-white dark:hover:bg-black/80 hover:text-primary'
          }`}
        >
          <IconBookmark filled={!!isSaved} className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-3 px-1 pt-1">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-sm border-2 border-background" 
          style={{ backgroundColor: avatarColor }}
        >
          {video.channelTitle?.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col w-full min-w-0">
          <h3 
            className="text-foreground font-bold text-[13px] leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors duration-300 cursor-pointer" 
            onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
          >
            {video.title}
          </h3>
          <div className="text-muted-foreground text-[10px] font-medium flex items-center gap-1.5 flex-wrap">
            <span className="truncate max-w-[80px]">{video.channelTitle}</span>
            <span className="opacity-30">•</span>
            <span>{video.views}</span>
            <span className="opacity-30">•</span>
            <span>{video.publishedTimeAgo}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 mt-3">
            <button 
              onClick={downloadThumb} 
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-all duration-300"
            >
              <IconDownload className="w-3 h-3" />
              <span>Download</span>
            </button>
            <button 
              onClick={copyLink} 
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-secondary text-foreground border border-border rounded-lg text-[10px] font-bold hover:bg-accent transition-all duration-300"
            >
              <IconCopy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
