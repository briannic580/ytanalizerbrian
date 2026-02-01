import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconDownload } from '../constants/icons';

interface VideoDownloaderProps {
  videoUrl: string;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoDownloader: React.FC<VideoDownloaderProps> = ({
  videoUrl,
  videoTitle,
  isOpen,
  onClose
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Encode URL for the API
  const encodedUrl = encodeURIComponent(videoUrl);
  const iframeSrc = `https://p.savenow.to/api/card2/?url=${encodedUrl}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[350] flex items-center justify-center p-4 md:p-8"
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
            className="relative w-full max-w-xl bg-card rounded-3xl overflow-hidden shadow-2xl border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <IconDownload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Download Video</h2>
                  <p className="text-xs text-muted-foreground">Choose format and quality</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-xl transition-colors"
              >
                <IconX className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Video Title */}
            <div className="px-4 py-3 bg-secondary/30">
              <p className="text-sm font-medium text-foreground line-clamp-2">{videoTitle}</p>
            </div>

            {/* y2down.cc Card API iframe */}
            <div className="relative" style={{ minHeight: '400px' }}>
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                className="w-full border-none"
                style={{ height: '400px' }}
                scrolling="no"
                allowFullScreen
                title="Video Downloader"
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-secondary/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Powered by y2down.cc API</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    MP4
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    MP3
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    WAV
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoDownloader;
