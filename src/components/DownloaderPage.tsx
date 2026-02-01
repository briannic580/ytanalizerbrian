import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { IconDownload, IconTV } from '../constants/icons';

const DownloaderPage: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Load iframe-resizer library dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.9/iframeResizer.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).iFrameResize && iframeRef.current) {
        (window as any).iFrameResize({ log: false }, iframeRef.current);
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
          <IconDownload className="w-6 h-6 text-primary" />
          YouTube Video Downloader
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Download YouTube videos in various formats: MP4, MP3, WAV, and more
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-3">
            <span className="text-lg">🎬</span>
          </div>
          <p className="text-sm font-bold text-foreground">MP4 Video</p>
          <p className="text-xs text-muted-foreground mt-1">720p, 1080p, 4K</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-3">
            <span className="text-lg">🎵</span>
          </div>
          <p className="text-sm font-bold text-foreground">MP3 Audio</p>
          <p className="text-xs text-muted-foreground mt-1">High quality audio</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mb-3">
            <span className="text-lg">🎼</span>
          </div>
          <p className="text-sm font-bold text-foreground">WAV Audio</p>
          <p className="text-xs text-muted-foreground mt-1">Lossless quality</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center mb-3">
            <span className="text-lg">📱</span>
          </div>
          <p className="text-sm font-bold text-foreground">Playlist</p>
          <p className="text-xs text-muted-foreground mt-1">Download full playlists</p>
        </motion.div>
      </div>

      {/* Main Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <IconTV className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Paste YouTube URL</h3>
              <p className="text-xs text-muted-foreground">Enter any YouTube video or playlist URL to download</p>
            </div>
          </div>
        </div>

        <div className="p-4" style={{ minHeight: '500px' }}>
          <iframe
            ref={iframeRef}
            id="widgetApiIframe"
            src="https://p.savenow.to/api/widget"
            className="w-full border-none rounded-xl"
            style={{ minHeight: '500px' }}
            scrolling="no"
            allowFullScreen
            title="YouTube Downloader Widget"
          />
        </div>
      </motion.div>

      {/* Supported Platforms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Supported Platforms
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            { name: 'YouTube', icon: '📺' },
            { name: 'YouTube Shorts', icon: '📱' },
            { name: 'YouTube Playlist', icon: '📋' },
            { name: 'TikTok', icon: '🎵' },
            { name: 'Instagram Reels', icon: '📸' },
            { name: 'Instagram Video', icon: '🎥' },
          ].map((platform) => (
            <div
              key={platform.name}
              className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl"
            >
              <span>{platform.icon}</span>
              <span className="text-sm font-medium text-foreground">{platform.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Disclaimer */}
      <div className="p-4 bg-secondary/50 rounded-xl text-center">
        <p className="text-xs text-muted-foreground">
          ⚠️ This tool is for personal use only. Please respect copyright laws and content creators' rights.
          <br />
          Powered by y2down.cc API
        </p>
      </div>
    </div>
  );
};

export default DownloaderPage;
