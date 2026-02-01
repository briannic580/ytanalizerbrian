import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VideoItem, ToastType } from '../types';
import { IconCopy, IconDownload, IconBookmark, IconVideo } from '../constants/icons';
import { Checkbox } from './ui/checkbox';

interface AnimatedVideoCardProps {
  video: VideoItem;
  index: number;
  onToast: (msg: string, type: ToastType) => void;
  onSaveToggle?: (video: VideoItem) => void;
  isSaved?: boolean;
  onPreview?: (video: VideoItem) => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: (videoId: string) => void;
}

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  return colors[Math.abs(hash) % colors.length];
};

const AnimatedVideoCard: React.FC<AnimatedVideoCardProps> = ({ 
  video, 
  index, 
  onToast, 
  onSaveToggle, 
  isSaved,
  onPreview,
  showCheckbox = false,
  isSelected = false,
  onSelect
}) => {
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

  // Open external video downloader (Cobalt)
  const downloadVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
    const cobaltUrl = `https://cobalt.tools/?url=${encodeURIComponent(videoUrl)}`;
    window.open(cobaltUrl, '_blank', 'noopener,noreferrer');
  };

  const getERStyles = (er: number) => {
    if (er >= 5) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';
    if (er >= 2) return 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  const avatarColor = stringToColor(video.channelTitle || 'YouTube');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.03, 
        type: 'spring', 
        stiffness: 300, 
        damping: 30 
      }}
      whileHover={{ y: -4 }}
      className={`flex flex-col gap-3 group bg-card rounded-2xl p-2 border transition-all duration-300 ${
        isSelected 
          ? 'border-primary ring-2 ring-primary/20' 
          : 'border-transparent hover:border-border'
      } hover:shadow-premium-lg ${video.isShort ? 'row-span-2' : ''}`}
      style={{ willChange: 'transform' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className={`relative rounded-xl overflow-hidden bg-muted cursor-pointer ${video.isShort ? 'aspect-[9/16]' : 'aspect-video'}`}
        onClick={() => showCheckbox && onSelect ? onSelect(video.id) : onPreview?.(video)}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          loading="lazy" 
        />

        {/* Checkbox for multi-select */}
        {showCheckbox && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 left-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(video.id);
            }}
          >
            <Checkbox 
              checked={isSelected}
              className="w-5 h-5 bg-background/90 backdrop-blur-sm border-2 shadow-md"
            />
          </motion.div>
        )}
        <motion.img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          loading="lazy" 
        />

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
          {video.durationFormatted}
        </div>

        {/* Outlier Badge */}
        {video.isOutlier && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1"
          >
            <span>🔥</span> OUTLIER
          </motion.div>
        )}

        {/* ER Badge */}
        <div className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm shadow-sm ${getERStyles(video.engagementRate)}`}>
          {video.engagementRate}% ER
        </div>

        {/* Save Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); onSaveToggle?.(video); }} 
          className={`absolute top-2 right-2 p-2 rounded-xl backdrop-blur-md shadow-sm transition-colors ${
            isSaved 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-white/80 dark:bg-black/60 text-muted-foreground hover:bg-white dark:hover:bg-black/80 hover:text-primary'
          }`}
        >
          <IconBookmark filled={!!isSaved} className="w-3.5 h-3.5" />
        </motion.button>
      </motion.div>

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
            onClick={() => onPreview?.(video)}
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

          {/* Action Buttons - 3 buttons: Video | Thumb | Copy */}
          <div className="flex items-center gap-1 mt-3">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={downloadVideo} 
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 rounded-lg text-[10px] font-bold hover:bg-violet-500/20 transition-colors"
              title="Download Video (External)"
            >
              <IconVideo className="w-3 h-3" />
              <span>Video</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={downloadThumb} 
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-colors"
              title="Download Thumbnail"
            >
              <IconDownload className="w-3 h-3" />
              <span>Thumb</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyLink} 
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-secondary text-foreground border border-border rounded-lg text-[10px] font-bold hover:bg-accent transition-colors"
              title="Copy Link"
            >
              <IconCopy className="w-3 h-3" />
              <span>Copy</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedVideoCard;
