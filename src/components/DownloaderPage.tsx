import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IconDownload, IconTV } from '../constants/icons';

// External downloader services
const DOWNLOADER_SERVICES = [
  {
    id: 'cobalt',
    name: 'Cobalt',
    description: 'Clean & no ads',
    emoji: '🌐',
    recommended: true,
    getUrl: (videoUrl: string) => `https://cobalt.tools/?url=${encodeURIComponent(videoUrl)}`,
  },
  {
    id: 'y2mate',
    name: 'Y2Mate',
    description: 'Many quality options',
    emoji: '🎬',
    recommended: false,
    getUrl: (videoUrl: string) => {
      const videoId = videoUrl.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/)?.[1] || '';
      return videoId ? `https://www.y2mate.com/youtube/${videoId}` : 'https://www.y2mate.com';
    },
  },
  {
    id: 'savefrom',
    name: 'SaveFrom',
    description: 'Multiple formats',
    emoji: '📥',
    recommended: false,
    getUrl: (videoUrl: string) => `https://en.savefrom.net/1-${encodeURIComponent(videoUrl)}`,
  },
  {
    id: 'ssyoutube',
    name: 'SSYouTube',
    description: 'Fast & simple',
    emoji: '⚡',
    recommended: false,
    getUrl: (videoUrl: string) => {
      const videoId = videoUrl.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/)?.[1] || '';
      return videoId ? `https://ssyoutube.com/watch?v=${videoId}` : 'https://ssyoutube.com';
    },
  },
];

const SUPPORTED_PLATFORMS = [
  { name: 'YouTube', icon: '📺' },
  { name: 'YouTube Shorts', icon: '📱' },
  { name: 'YouTube Playlist', icon: '📋' },
  { name: 'TikTok', icon: '🎵' },
  { name: 'Instagram Reels', icon: '📸' },
  { name: 'Twitter/X', icon: '🐦' },
];

const DownloaderPage: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedService, setSelectedService] = useState('cobalt');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setVideoUrl(text);
    } catch (err) {
      console.error('Failed to read clipboard');
    }
  };

  const handleDownload = () => {
    if (!videoUrl.trim()) return;
    const service = DOWNLOADER_SERVICES.find(s => s.id === selectedService);
    if (service) {
      const url = service.getUrl(videoUrl);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const openService = (serviceId: string) => {
    const service = DOWNLOADER_SERVICES.find(s => s.id === serviceId);
    if (service && videoUrl.trim()) {
      const url = service.getUrl(videoUrl);
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (service) {
      // Open service homepage if no URL
      window.open(service.getUrl(''), '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
          <IconDownload className="w-6 h-6 text-primary" />
          Video Downloader
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Download video dari YouTube, TikTok, Instagram, dan lainnya
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

      {/* Main Input Section */}
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
              <h3 className="text-sm font-bold text-foreground">Paste Video URL</h3>
              <p className="text-xs text-muted-foreground">Masukkan URL video yang ingin didownload</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* URL Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePaste}
              className="px-4 py-3 bg-secondary hover:bg-accent border border-border rounded-xl text-sm font-bold text-foreground transition-colors"
            >
              📋 Paste
            </motion.button>
          </div>

          {/* Service Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DOWNLOADER_SERVICES.map((service) => (
              <motion.button
                key={service.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedService(service.id)}
                className={`p-3 rounded-xl border transition-all text-left ${
                  selectedService === service.id
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-secondary/50 border-border hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{service.emoji}</span>
                  <span className="text-sm font-bold text-foreground">{service.name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{service.description}</p>
                {service.recommended && (
                  <span className="inline-block mt-1 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    BEST
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Download Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleDownload}
            disabled={!videoUrl.trim()}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              videoUrl.trim()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <IconDownload className="w-5 h-5" />
              Download Video
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Access Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Buka Langsung ke Layanan
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DOWNLOADER_SERVICES.map((service) => (
            <motion.button
              key={service.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openService(service.id)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-accent rounded-xl transition-colors"
            >
              <span>{service.emoji}</span>
              <span className="text-sm font-bold text-foreground">{service.name}</span>
              <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Supported Platforms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Supported Platforms
        </h3>
        <div className="flex flex-wrap gap-3">
          {SUPPORTED_PLATFORMS.map((platform) => (
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
          ⚠️ Download hanya untuk penggunaan pribadi. Hormati hak cipta dan hak content creator.
          <br />
          Layanan download disediakan oleh pihak ketiga.
        </p>
      </div>
    </div>
  );
};

export default DownloaderPage;
