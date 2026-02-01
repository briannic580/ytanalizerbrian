import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ToastState, 
  AnalyzedData, 
  AnalysisMode, 
  ContentTypeFilter, 
  SortOption, 
  FetchLimit, 
  VideoItem, 
  DurationRange, 
  MinViewsOption, 
  MinLikesOption,
  TrendingRegion 
} from '../types';
import { 
  IconCopy, 
  IconDownload, 
  IconTV, 
  IconDescription, 
  IconFilter, 
  IconMoon, 
  IconSun, 
  IconChart, 
  IconSettings,
  IconMenu,
  IconBookmark,
  IconClose
} from '../constants/icons';
import Toast from '../components/Toast';
import AnimatedVideoCard from '../components/AnimatedVideoCard';
import SkeletonCard from '../components/SkeletonCard';
import SearchBar from '../components/SearchBar';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import BottomNav from '../components/BottomNav';
import VideoPreviewModal from '../components/VideoPreviewModal';
import InsightsDashboard from '../components/InsightsDashboard';
import CompetitorBenchmark from '../components/CompetitorBenchmark';
import ContentGapAnalyzer from '../components/ContentGapAnalyzer';
import UploadScheduleAnalyzer from '../components/UploadScheduleAnalyzer';
import TitleScoreAnalyzer from '../components/TitleScoreAnalyzer';
import SearchHistoryPage from '../components/SearchHistoryPage';
import DownloaderPage from '../components/DownloaderPage';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { fetchYouTubeData, fetchTrendingVideos, getQuotaUsage } from '../services/youtubeService';
import { generateCSV, exportToExcel, generateFullAnalysisCSV } from '../services/exportService';
import { generateZip } from '../services/zipService';
import { generatePDFReport } from '../services/pdfService';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';

// Available Country Codes for Trending
const TRENDING_REGIONS: TrendingRegion[] = [
  { code: 'ID', name: 'Indonesia 🇮🇩' },
  { code: 'US', name: 'United States 🇺🇸' },
  { code: 'GB', name: 'United Kingdom 🇬🇧' },
  { code: 'IN', name: 'India 🇮🇳' },
  { code: 'BR', name: 'Brazil 🇧🇷' },
  { code: 'JP', name: 'Japan 🇯🇵' },
  { code: 'KR', name: 'South Korea 🇰🇷' },
  { code: 'CA', name: 'Canada 🇨🇦' },
  { code: 'DE', name: 'Germany 🇩🇪' },
  { code: 'AU', name: 'Australia 🇦🇺' },
  { code: 'RU', name: 'Russia 🇷🇺' },
  { code: 'FR', name: 'France 🇫🇷' },
];

const QUOTA_LIMIT = 10000;

// Date range filter type
type DateRangeFilter = 'all' | '7d' | '30d' | '90d' | '1y';

const YouTubeAnalyzer: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('yt_dark_mode') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('yt_api_key_v5') || '');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyzedData | null>(null);
  const [savedVideos, setSavedVideos] = useState<VideoItem[]>([]);
  const [zipProgress, setZipProgress] = useState(0);

  const [mode, setMode] = useState<AnalysisMode>('dashboard');
  const [contentType, setContentType] = useState<ContentTypeFilter>('all');

  const [fetchLimit, setFetchLimit] = useState<FetchLimit>(50);
  const [minViews, setMinViews] = useState<MinViewsOption>(0);
  const [minLikes, setMinLikes] = useState<MinLikesOption>(0);
  const [durationRange, setDurationRange] = useState<DurationRange>('all');
  const [sortOption, setSortOption] = useState<SortOption>('popular');

  const [trendingRegion, setTrendingRegion] = useState('ID');

  const [toast, setToast] = useState<ToastState | null>(null);
  const [quotaUsed, setQuotaUsed] = useState(getQuotaUsage());

  // Video Preview Modal State
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);

  // Batch Operations State
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Advanced Filtering State
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [minER, setMinER] = useState(0);
  const [titleKeyword, setTitleKeyword] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      searchInput?.focus();
    },
    onEscape: () => {
      setShowSettings(false);
      setShowFilters(false);
      setMobileNavOpen(false);
      setPreviewVideo(null);
    },
    onToggleTheme: () => setDarkMode(prev => !prev),
    enabled: !previewVideo,
  });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('yt_dark_mode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('yt_saved_videos');
    if (saved) try { setSavedVideos(JSON.parse(saved)); } catch (e) {}

    const updateQuota = () => setQuotaUsed(getQuotaUsage());
    window.addEventListener('quotaUpdated', updateQuota);
    window.addEventListener('storage', (e) => {
      if (e.key === 'yt_quota_usage_v1') updateQuota();
    });

    return () => {
      window.removeEventListener('quotaUpdated', updateQuota);
    };
  }, []);

  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
    if (type !== 'loading') setTimeout(() => setToast(null), 3000);
  };

  const handleTrending = async (regionOverride?: string) => {
    if (!apiKey) {
      setShowSettings(true);
      return showToast("Masukkan API Key terlebih dahulu", "error");
    }

    const regionToUse = typeof regionOverride === 'string' ? regionOverride : trendingRegion;

    setLoading(true);
    try {
      const result = await fetchTrendingVideos(apiKey, fetchLimit, regionToUse);
      setData(result);
      setMode('trending');
      setContentType('all');
      showToast(`Trending Topics (${regionToUse}) Dimuat`, "success");
    } catch (err: any) {
      showToast(err.message || "Gagal memuat trending", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (searchQuery: string) => {
    if (!apiKey) {
      setShowSettings(true);
      return showToast("Masukkan API Key terlebih dahulu", "error");
    }
    setLoading(true);
    try {
      const result = await fetchYouTubeData(apiKey, searchQuery, fetchLimit);
      setData(result);
      setMode('dashboard');
      setContentType('all');
      showToast(`Berhasil menganalisis ${result.videos.length} video`, "success");
    } catch (err: any) {
      showToast(err.message || "Gagal mengambil data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCopy = () => {
    if (filteredVideos.length === 0) return;
    const links = filteredVideos.map(v => `https://www.youtube.com/watch?v=${v.id}`).join('\n');
    navigator.clipboard.writeText(links).then(() => {
      showToast(`${filteredVideos.length} Link berhasil disalin!`, "success");
    }).catch(() => {
      showToast("Gagal menyalin link", "error");
    });
  };

  const handleBulkDownload = async () => {
    if (filteredVideos.length === 0) return;
    try {
      showToast(`Menyiapkan ${filteredVideos.length} thumbnail...`, "loading");
      await generateZip(filteredVideos, "Thumbnails", (p) => setZipProgress(p));
      showToast("Download ZIP dimulai", "success");
    } catch (e) {
      showToast("Gagal mendownload ZIP", "error");
    } finally {
      setZipProgress(0);
    }
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('yt_api_key_v5', key);
    setShowSettings(false);
    showToast("API Key tersimpan", "success");
  };

  const filteredVideos = useMemo(() => {
    let source = mode === 'saved' ? savedVideos : (data?.videos || []);

    let result = source.filter(v => {
      const matchViews = v.viewCountRaw >= minViews;
      const matchLikes = v.likeCountRaw >= minLikes;

      let matchDuration = true;
      if (durationRange === 'under_1') matchDuration = v.durationSec < 60;
      else if (durationRange === '1_5') matchDuration = v.durationSec >= 60 && v.durationSec <= 300;
      else if (durationRange === '5_20') matchDuration = v.durationSec > 300 && v.durationSec <= 1200;
      else if (durationRange === 'over_20') matchDuration = v.durationSec > 1200;

      let matchType = true;
      if (contentType === 'shorts') matchType = v.isShort;
      if (contentType === 'long') matchType = !v.isShort;

      // Advanced filters - Date Range
      let matchDate = true;
      if (dateRange !== 'all') {
        const now = new Date();
        const videoDate = new Date(v.publishedAt);
        const daysDiff = Math.floor((now.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dateRange === '7d') matchDate = daysDiff <= 7;
        else if (dateRange === '30d') matchDate = daysDiff <= 30;
        else if (dateRange === '90d') matchDate = daysDiff <= 90;
        else if (dateRange === '1y') matchDate = daysDiff <= 365;
      }

      // Advanced filters - Min ER
      const matchER = v.engagementRate >= minER;

      // Advanced filters - Title Keyword
      const matchKeyword = titleKeyword.trim() === '' || 
        v.title.toLowerCase().includes(titleKeyword.toLowerCase());

      return matchViews && matchLikes && matchDuration && matchType && matchDate && matchER && matchKeyword;
    });

    return [...result].sort((a, b) => {
      if (sortOption === 'popular') return b.viewCountRaw - a.viewCountRaw;
      if (sortOption === 'most_liked') return b.likeCountRaw - a.likeCountRaw;
      if (sortOption === 'highest_er') return b.engagementRate - a.engagementRate;
      if (sortOption === 'newest') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (sortOption === 'oldest') return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      return 0;
    });
  }, [data, savedVideos, mode, contentType, minViews, minLikes, durationRange, sortOption, dateRange, minER, titleKeyword]);

  // Batch selection handlers
  const handleSelectVideo = useCallback((videoId: string) => {
    setSelectedVideos(prev => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
    }
  }, [filteredVideos, selectedVideos.size]);

  const clearSelection = useCallback(() => {
    setSelectedVideos(new Set());
    setIsSelectMode(false);
  }, []);

  const handleBatchSave = useCallback(() => {
    const videosToSave = filteredVideos.filter(v => selectedVideos.has(v.id));
    const existing = new Set(savedVideos.map(sv => sv.id));
    const newVideos = videosToSave.filter(v => !existing.has(v.id));
    const updated = [...newVideos, ...savedVideos];
    setSavedVideos(updated);
    localStorage.setItem('yt_saved_videos', JSON.stringify(updated));
    showToast(`${newVideos.length} video berhasil disimpan`, "success");
    clearSelection();
  }, [filteredVideos, selectedVideos, savedVideos, clearSelection]);

  const handleBatchCopyLinks = useCallback(() => {
    const selectedList = filteredVideos.filter(v => selectedVideos.has(v.id));
    const links = selectedList.map(v => `https://www.youtube.com/watch?v=${v.id}`).join('\n');
    navigator.clipboard.writeText(links).then(() => {
      showToast(`${selectedList.length} link tersalin`, "success");
    });
  }, [filteredVideos, selectedVideos]);

  const handleBatchDownloadThumbnails = useCallback(async () => {
    const selectedList = filteredVideos.filter(v => selectedVideos.has(v.id));
    try {
      showToast(`Menyiapkan ${selectedList.length} thumbnail...`, "loading");
      await generateZip(selectedList, "Selected_Thumbnails", (p) => setZipProgress(p));
      showToast("Download ZIP dimulai", "success");
    } catch (e) {
      showToast("Gagal mendownload ZIP", "error");
    } finally {
      setZipProgress(0);
    }
  }, [filteredVideos, selectedVideos]);

  const handleBatchExportCSV = useCallback(() => {
    const selectedList = filteredVideos.filter(v => selectedVideos.has(v.id));
    generateCSV(selectedList, "Selected_Videos");
    showToast(`${selectedList.length} video diekspor ke CSV`, "success");
  }, [filteredVideos, selectedVideos]);

  // PDF Export handler
  const handleExportPDF = useCallback(async () => {
    if (!data) return;
    showToast("Membuat PDF report...", "loading");
    try {
      await generatePDFReport({
        channelTitle: data.channelTitle || 'YouTube Analysis',
        channelStats: data.channelStats,
        videos: data.videos,
        generatedAt: new Date()
      });
      showToast("PDF berhasil dibuat", "success");
    } catch (e) {
      showToast("Gagal membuat PDF", "error");
    }
  }, [data]);

  // Search History replay handler  
  const handleSearchFromHistory = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    handleAnalyze(searchQuery);
  }, []);

  // Video Preview handlers
  const handleVideoPreview = useCallback((video: VideoItem) => {
    const index = filteredVideos.findIndex(v => v.id === video.id);
    setPreviewIndex(index);
    setPreviewVideo(video);
  }, [filteredVideos]);

  const handleNextVideo = useCallback(() => {
    if (previewIndex < filteredVideos.length - 1) {
      const nextIndex = previewIndex + 1;
      setPreviewIndex(nextIndex);
      setPreviewVideo(filteredVideos[nextIndex]);
    }
  }, [previewIndex, filteredVideos]);

  const handlePrevVideo = useCallback(() => {
    if (previewIndex > 0) {
      const prevIndex = previewIndex - 1;
      setPreviewIndex(prevIndex);
      setPreviewVideo(filteredVideos[prevIndex]);
    }
  }, [previewIndex, filteredVideos]);

  const handleSaveToggle = useCallback((video: VideoItem) => {
    const exists = savedVideos.some(sv => sv.id === video.id);
    const next = exists ? savedVideos.filter(sv => sv.id !== video.id) : [video, ...savedVideos];
    setSavedVideos(next);
    localStorage.setItem('yt_saved_videos', JSON.stringify(next));
  }, [savedVideos]);

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      {toast && <Toast message={zipProgress > 0 ? `Processing ZIP: ${zipProgress}%` : toast.message} type={toast.type} />}

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        currentMode={mode}
        onModeChange={(m) => {
          setMode(m);
          if (m === 'dashboard') {
            setData(null);
            setQuery('');
            setContentType('all');
          }
        }}
        onFetchTrending={() => handleTrending()}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 glass-strong z-[150] border-b border-border flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden p-2 hover:bg-accent rounded-xl transition-colors"
          >
            <IconMenu className="w-5 h-5 text-foreground" />
          </motion.button>

          <IconTV className="w-7 h-7 text-destructive" />
          <span className="text-[15px] font-extrabold tracking-tighter text-foreground hidden sm:inline">
            YT ANALYZER <span className="text-primary">PRO</span>
          </span>
        </div>

        <div className="hidden md:flex flex-1 max-w-2xl mx-12">
          <SearchBar query={query} setQuery={setQuery} onSearch={handleAnalyze} />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)} 
            className="p-2 hover:bg-accent rounded-xl transition-all duration-300"
          >
            {darkMode ? <IconSun className="w-4 h-4 text-muted-foreground" /> : <IconMoon className="w-4 h-4 text-muted-foreground" />}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(true)} 
            className="p-2 hover:bg-accent rounded-xl transition-all duration-300"
          >
            <IconSettings className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <div className="hidden sm:block text-right ml-2">
            <span className="block text-[9px] font-black text-muted-foreground uppercase">Quota Usage</span>
            <div className="w-20 h-1.5 bg-secondary rounded-full mt-1 overflow-hidden border border-border">
              <motion.div 
                className="h-full bg-primary" 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((quotaUsed / QUOTA_LIMIT) * 100, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </header>

      <Sidebar
        currentMode={mode}
        onModeChange={(m) => {
          setMode(m);
          if (m === 'dashboard') {
            setData(null);
            setQuery('');
            setContentType('all');
          }
        }}
        onFetchTrending={() => handleTrending()}
      />

      {/* Main Content */}
      <main className="pt-14 pb-20 md:pb-0 md:pl-[240px]">
        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 py-3 border-b border-border">
          <SearchBar query={query} setQuery={setQuery} onSearch={handleAnalyze} />
        </div>

        {/* Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-14 glass-strong z-[90] border-b border-border px-4 md:px-8 py-3"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
              {/* Content Type Filter */}
              <div className="flex items-center gap-2 p-1 bg-secondary rounded-xl">
                {(['all', 'long', 'shorts'] as ContentTypeFilter[]).map((f) => (
                  <motion.button
                    key={f}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setContentType(f)}
                    className={`px-4 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                      contentType === f 
                        ? 'bg-card text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'long' ? 'Long' : 'Shorts'}
                  </motion.button>
                ))}
              </div>

              {/* Region Selector for Trending */}
              <AnimatePresence>
                {mode === 'trending' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:block">Region:</span>
                    <select
                      value={trendingRegion}
                      onChange={(e) => {
                        const newRegion = e.target.value;
                        setTrendingRegion(newRegion);
                        handleTrending(newRegion);
                      }}
                      className="bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:ring-2 ring-primary/20 outline-none cursor-pointer hover:bg-accent transition-colors"
                    >
                      {TRENDING_REGIONS.map((r) => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)} 
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 ${
                  showFilters 
                    ? 'bg-primary/10 border-primary/20 text-primary' 
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <IconFilter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters & Limit</span>
              </motion.button>

              {/* Action Buttons */}
              <AnimatePresence>
                {filteredVideos.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-1.5 border-l border-border pl-2 ml-2"
                  >
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => generateCSV(filteredVideos, "Report")} 
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400" 
                      title="Export CSV Report"
                    >
                      <IconDescription className="w-4 h-4" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportToExcel(filteredVideos, "Report")} 
                      className="p-2 bg-green-50 text-green-700 rounded-xl border border-green-200 hover:bg-green-100 transition-colors dark:bg-green-950/30 dark:border-green-800 dark:text-green-400" 
                      title="Export Excel Report"
                    >
                      <IconChart className="w-4 h-4" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBulkCopy} 
                      className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400" 
                      title="Copy All Links"
                    >
                      <IconCopy className="w-4 h-4" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBulkDownload} 
                      className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20 hover:bg-primary/20 transition-colors" 
                      title="Download All Thumbnails (ZIP)"
                    >
                      <IconDownload className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fetch Limit</label>
                    <select
                      value={fetchLimit}
                      onChange={(e) => setFetchLimit(Number(e.target.value) as FetchLimit)}
                      className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 ring-primary/20 outline-none"
                    >
                      <option value={10}>10 Video</option>
                      <option value={50}>50 Video</option>
                      <option value={100}>100 Video</option>
                      <option value={500}>500 Video</option>
                      <option value={1000}>1000 Video</option>
                      <option value={5000}>5000 Video (High Quota)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Min Views</label>
                    <select 
                      value={minViews} 
                      onChange={(e) => setMinViews(Number(e.target.value) as MinViewsOption)} 
                      className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value={0}>Semua Views</option>
                      <option value={1000000}>1M+ Views</option>
                      <option value={5000000}>5M+ Views</option>
                      <option value={10000000}>10M+ Views</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sort By</label>
                    <select 
                      value={sortOption} 
                      onChange={(e) => setSortOption(e.target.value as SortOption)} 
                      className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value="popular">Terpopuler</option>
                      <option value="highest_er">ER% Tertinggi</option>
                      <option value="newest">Terbaru</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Duration Range</label>
                    <select 
                      value={durationRange} 
                      onChange={(e) => setDurationRange(e.target.value as DurationRange)} 
                      className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value="all">Semua Durasi</option>
                      <option value="under_1">&lt; 1 Menit</option>
                      <option value="1_5">1 - 5 Menit</option>
                      <option value="5_20">5 - 20 Menit</option>
                      <option value="over_20">&gt; 20 Menit</option>
                    </select>
                  </div>
                  {/* Advanced Filter: Date Range */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date Range</label>
                    <select 
                      value={dateRange} 
                      onChange={(e) => setDateRange(e.target.value as DateRangeFilter)} 
                      className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value="all">Semua Waktu</option>
                      <option value="7d">7 Hari Terakhir</option>
                      <option value="30d">30 Hari Terakhir</option>
                      <option value="90d">90 Hari Terakhir</option>
                      <option value="1y">1 Tahun Terakhir</option>
                    </select>
                  </div>
                  {/* Advanced Filter: Min ER */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Min ER%: {minER}%</label>
                    <Slider 
                      value={[minER]} 
                      onValueChange={(val) => setMinER(val[0])} 
                      max={20} 
                      step={0.5}
                      className="mt-2"
                    />
                  </div>
                </div>
                {/* Advanced Filter: Title Keyword */}
                <div className="mt-4 flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Title Keyword</label>
                    <Input 
                      value={titleKeyword} 
                      onChange={(e) => setTitleKeyword(e.target.value)} 
                      placeholder="Filter berdasarkan kata di judul..."
                      className="bg-secondary border-border rounded-xl text-xs"
                    />
                  </div>
                  {/* Batch Select Toggle */}
                  <div className="flex items-end gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsSelectMode(!isSelectMode);
                        if (isSelectMode) setSelectedVideos(new Set());
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        isSelectMode 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isSelectMode ? 'Cancel Select' : 'Multi-Select'}
                    </motion.button>
                    {data && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExportPDF}
                        className="px-4 py-2 rounded-xl text-xs font-bold border bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20 transition-all"
                      >
                        Export PDF
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Content Area */}
        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} index={i} />)}
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {mode === 'benchmark' ? (
                  <CompetitorBenchmark apiKey={apiKey} />
                ) : mode === 'insights' ? (
                  data ? <InsightsDashboard videos={data.videos} stats={data.channelStats} /> : (
                    <div className="text-center py-20 text-muted-foreground font-medium italic">
                      Silakan analyze konten terlebih dahulu.
                    </div>
                  )
                ) : mode === 'content_gap' ? (
                  data?.videos?.length ? (
                    <ContentGapAnalyzer 
                      channelVideos={data.videos} 
                      apiKey={apiKey}
                      onToast={showToast}
                    />
                  ) : (
                    <div className="text-center py-20 text-muted-foreground font-medium italic">
                      Silakan analyze konten terlebih dahulu untuk Content Gap Analysis.
                    </div>
                  )
                ) : mode === 'schedule' ? (
                  data?.videos?.length ? <UploadScheduleAnalyzer videos={data.videos} /> : (
                    <div className="text-center py-20 text-muted-foreground font-medium italic">
                      Silakan analyze konten terlebih dahulu untuk Upload Schedule Analysis.
                    </div>
                  )
                ) : mode === 'title_score' ? (
                  data?.videos?.length ? <TitleScoreAnalyzer videos={data.videos} /> : (
                    <div className="text-center py-20 text-muted-foreground font-medium italic">
                      Silakan analyze konten terlebih dahulu untuk Title Score Analysis.
                    </div>
                  )
                ) : mode === 'history' ? (
                  <SearchHistoryPage onSearch={handleSearchFromHistory} onToast={showToast} />
                ) : mode === 'downloader' ? (
                  <DownloaderPage />
                ) : (
                  <>
                    {/* Select All Checkbox when in Select Mode */}
                    {isSelectMode && filteredVideos.length > 0 && (
                      <div className="flex items-center gap-3 mb-4 p-3 bg-secondary/50 rounded-xl">
                        <Checkbox 
                          checked={selectedVideos.size === filteredVideos.length}
                          onCheckedChange={handleSelectAll}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {selectedVideos.size === filteredVideos.length ? 'Deselect All' : 'Select All'} 
                          ({selectedVideos.size}/{filteredVideos.length})
                        </span>
                      </div>
                    )}

                    {filteredVideos.length === 0 && !loading && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 text-muted-foreground font-medium italic"
                      >
                        {mode === 'dashboard' && !data 
                          ? 'Masukkan link channel, playlist, atau kata kunci untuk mulai menganalisis.' 
                          : `Data tidak ditemukan untuk kategori "${contentType === 'all' ? 'Semua Konten' : contentType === 'long' ? 'Video Panjang' : 'Shorts'}".`
                        }
                      </motion.div>
                    )}
                    <div className={`grid gap-6 ${
                      contentType === 'shorts' 
                        ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    }`}>
                      {filteredVideos.map((v, i) => (
                        <AnimatedVideoCard
                          key={v.id}
                          video={v}
                          index={i}
                          onToast={showToast}
                          isSaved={savedVideos.some(sv => sv.id === v.id)}
                          onSaveToggle={handleSaveToggle}
                          onPreview={handleVideoPreview}
                          showCheckbox={isSelectMode}
                          isSelected={selectedVideos.has(v.id)}
                          onSelect={handleSelectVideo}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav 
        currentMode={mode}
        onModeChange={(m) => {
          setMode(m);
          if (m === 'dashboard') {
            setData(null);
            setQuery('');
            setContentType('all');
          }
        }}
        onFetchTrending={() => handleTrending()}
      />

      {/* Selection Toolbar - Fixed at bottom when selecting */}
      <AnimatePresence>
        {isSelectMode && selectedVideos.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-card border border-border rounded-2xl shadow-premium-lg p-4 flex items-center gap-4"
          >
            <div className="flex items-center gap-2 pr-4 border-r border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{selectedVideos.size}</span>
              </div>
              <span className="text-sm font-medium text-foreground">Selected</span>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBatchSave}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
              >
                <IconBookmark className="w-4 h-4" />
                Save All
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBatchExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl text-xs font-bold border border-border"
              >
                <IconDescription className="w-4 h-4" />
                CSV
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBatchCopyLinks}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl text-xs font-bold border border-border"
              >
                <IconCopy className="w-4 h-4" />
                Copy
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBatchDownloadThumbnails}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-xl text-xs font-bold border border-border"
              >
                <IconDownload className="w-4 h-4" />
                ZIP
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearSelection}
                className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent"
              >
                <IconClose className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        video={previewVideo}
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        onNext={handleNextVideo}
        onPrev={handlePrevVideo}
        onSaveToggle={handleSaveToggle}
        isSaved={previewVideo ? savedVideos.some(sv => sv.id === previewVideo.id) : false}
        onToast={showToast}
        hasNext={previewIndex < filteredVideos.length - 1}
        hasPrev={previewIndex > 0}
      />

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-card w-full max-w-md rounded-3xl p-8 shadow-premium-lg border border-border"
            >
              <h2 className="text-2xl font-black text-foreground mb-2 tracking-tight">Settings</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Masukkan YouTube API Key untuk menggunakan aplikasi ini.
              </p>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                className="w-full bg-secondary border border-border rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none text-foreground placeholder:text-muted-foreground transition-all duration-300" 
                placeholder="YouTube API Key" 
              />
              
              {/* Keyboard Shortcuts Info */}
              <div className="mt-6 p-4 bg-secondary/50 rounded-2xl">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-background rounded-lg border border-border font-mono">⌘K</kbd>
                    <span className="text-muted-foreground">Search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-background rounded-lg border border-border font-mono">D</kbd>
                    <span className="text-muted-foreground">Dark Mode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-background rounded-lg border border-border font-mono">ESC</kbd>
                    <span className="text-muted-foreground">Close</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-background rounded-lg border border-border font-mono">←→</kbd>
                    <span className="text-muted-foreground">Navigate</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSettings(false)} 
                  className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-accent transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => saveApiKey(apiKey)} 
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-300"
                >
                  Save Key
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default YouTubeAnalyzer;
