import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconDownload } from '../constants/icons';

interface VideoDownloaderProps {
  videoUrl: string;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

// External downloader services - all open in new tabs
const DOWNLOADER_SERVICES = [
  {
    id: 'cobalt',
    name: 'Cobalt Tools',
    description: 'Clean, no ads, various formats',
    emoji: '🌐',
    recommended: true,
    getUrl: (videoUrl: string) => `https://cobalt.tools/?url=${encodeURIComponent(videoUrl)}`,
  },
  {
    id: 'y2mate',
    name: 'Y2Mate',
    description: 'Popular, many quality options',
    emoji: '🎬',
    recommended: false,
    getUrl: (videoUrl: string) => {
      const videoId = videoUrl.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/)?.[1] || '';
      return `https://www.y2mate.com/youtube/${videoId}`;
    },
  },
  {
    id: 'savefrom',
    name: 'SaveFrom.net',
    description: 'Multiple formats available',
    emoji: '📥',
    recommended: false,
    getUrl: (videoUrl: string) => `https://en.savefrom.net/1-${encodeURIComponent(videoUrl)}`,
  },
  {
    id: 'ssyoutube',
    name: 'SSYouTube',
    description: 'Fast & simple downloads',
    emoji: '⚡',
    recommended: false,
    getUrl: (videoUrl: string) => {
      const videoId = videoUrl.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/)?.[1] || '';
      return `https://ssyoutube.com/watch?v=${videoId}`;
    },
  },
];

const VideoDownloader: React.FC<VideoDownloaderProps> = ({
  videoUrl,
  videoTitle,
  isOpen,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const openDownloader = (service: typeof DOWNLOADER_SERVICES[0]) => {
    const url = service.getUrl(videoUrl);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
            className="relative w-full max-w-md bg-card rounded-3xl overflow-hidden shadow-2xl border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <IconDownload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Download Video</h2>
                  <p className="text-xs text-muted-foreground">Choose a download service</p>
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

            {/* Downloader Services List */}
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground mb-3">
                Pilih salah satu layanan di bawah. Akan membuka di tab baru:
              </p>
              
              {DOWNLOADER_SERVICES.map((service) => (
                <motion.button
                  key={service.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openDownloader(service)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    service.recommended 
                      ? 'bg-primary/5 border-primary/30 hover:bg-primary/10' 
                      : 'bg-secondary/50 border-border hover:bg-secondary'
                  }`}
                >
                  <span className="text-2xl">{service.emoji}</span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{service.name}</span>
                      {service.recommended && (
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{service.description}</p>
                  </div>
                  <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-secondary/30">
              <p className="text-xs text-muted-foreground text-center">
                ⚠️ Download hanya untuk penggunaan pribadi. Hormati hak cipta.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoDownloader;
