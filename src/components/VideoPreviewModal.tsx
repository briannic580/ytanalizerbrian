import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoItem, ToastType } from '../types';
import { IconX, IconBookmark, IconCopy, IconDownload, IconPlay } from '../constants/icons';
import VideoDownloader from './VideoDownloader';

interface VideoPreviewModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSaveToggle?: (video: VideoItem) => void;
  isSaved?: boolean;
  onToast: (msg: string, type: ToastType) => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  video,
  isOpen,
  onClose,
  onNext,
  onPrev,
  onSaveToggle,
  isSaved,
  onToast,
  hasNext,
  hasPrev,
}) => {
  const [showDownloader, setShowDownloader] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || showDownloader) return;
    
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight' && hasNext) {
      onNext?.();
    } else if (e.key === 'ArrowLeft' && hasPrev) {
      onPrev?.();
    } else if (e.key === 's' || e.key === 'S') {
      if (video) onSaveToggle?.(video);
    }
  }, [isOpen, onClose, onNext, onPrev, hasNext, hasPrev, video, onSaveToggle, showDownloader]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const copyLink = () => {
    if (!video) return;
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.id}`).then(() => {
      onToast("Link tersalin", "success");
    });
  };

  const downloadThumb = async () => {
    if (!video) return;
    onToast("Mengunduh thumbnail...", "loading");
    try {
      const res = await fetch(video.thumbnail);
      const blob = await res.blob();
      if (window.saveAs) {
        const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 100);
        window.saveAs(blob, `${safeTitle}.jpg`);
        onToast("Thumbnail berhasil diunduh", "success");
      }
    } catch (err) {
      onToast("Gagal mengunduh gambar", "error");
    }
  };

  if (!video) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-5xl bg-card rounded-3xl overflow-hidden shadow-2xl border border-border"
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-xl transition-colors"
              >
                <IconX className="w-5 h-5 text-white" />
              </motion.button>

              {/* Navigation Arrows */}
              {hasPrev && (
                <motion.button
                  whileHover={{ scale: 1.1, x: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
              )}
              {hasNext && (
                <motion.button
                  whileHover={{ scale: 1.1, x: 2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              )}

              {/* Video Player */}
              <div className="aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Video Info */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-bold text-foreground line-clamp-2 mb-2">
                      {video.title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="font-medium">{video.channelTitle}</span>
                      <span className="opacity-30">•</span>
                      <span>{video.views}</span>
                      <span className="opacity-30">•</span>
                      <span>{video.publishedTimeAgo}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-center px-4 py-2 bg-secondary rounded-xl">
                      <p className="text-xs text-muted-foreground font-medium">Likes</p>
                      <p className="text-lg font-bold text-foreground">{video.likes}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-secondary rounded-xl">
                      <p className="text-xs text-muted-foreground font-medium">Comments</p>
                      <p className="text-lg font-bold text-foreground">{video.comments}</p>
                    </div>
                    <div className={`text-center px-4 py-2 rounded-xl ${
                      video.engagementRate >= 5 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30' 
                        : video.engagementRate >= 2 
                          ? 'bg-primary/10' 
                          : 'bg-secondary'
                    }`}>
                      <p className="text-xs text-muted-foreground font-medium">ER</p>
                      <p className={`text-lg font-bold ${
                        video.engagementRate >= 5 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : video.engagementRate >= 2 
                            ? 'text-primary' 
                            : 'text-foreground'
                      }`}>
                        {video.engagementRate}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSaveToggle?.(video)}
                    className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-colors ${
                      isSaved 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-foreground hover:bg-accent'
                    }`}
                  >
                    <IconBookmark filled={!!isSaved} className="w-4 h-4" />
                    {isSaved ? 'Saved' : 'Save'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={copyLink}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 bg-secondary text-foreground rounded-2xl font-bold text-sm hover:bg-accent transition-colors"
                  >
                    <IconCopy className="w-4 h-4" />
                    Copy Link
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={downloadThumb}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 bg-primary/10 text-primary rounded-2xl font-bold text-sm hover:bg-primary/20 transition-colors"
                  >
                    <IconDownload className="w-4 h-4" />
                    Thumbnail
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDownloader(true)}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 bg-destructive/10 text-destructive rounded-2xl font-bold text-sm hover:bg-destructive/20 transition-colors"
                  >
                    <IconPlay className="w-4 h-4" />
                    Download Video
                  </motion.button>
                </div>

                {/* Keyboard Hints */}
                <div className="hidden md:flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
                  <span>← → Navigate</span>
                  <span>S Save</span>
                  <span>ESC Close</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Downloader Modal */}
      <VideoDownloader
        videoUrl={`https://www.youtube.com/watch?v=${video?.id}`}
        videoTitle={video?.title || ''}
        isOpen={showDownloader}
        onClose={() => setShowDownloader(false)}
      />
    </>
  );
};

export default VideoPreviewModal;
