import React, { useState, useEffect, useMemo } from 'react';
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
  IconSettings 
} from '../constants/icons';
import Toast from '../components/Toast';
import VideoCard, { SkeletonVideoCard } from '../components/VideoCard';
import SearchBar from '../components/SearchBar';
import Sidebar from '../components/Sidebar';
import InsightsDashboard from '../components/InsightsDashboard';
import CompetitorBenchmark from '../components/CompetitorBenchmark';
import { fetchYouTubeData, fetchTrendingVideos, getQuotaUsage } from '../services/youtubeService';
import { generateCSV, exportToExcel } from '../services/exportService';
import { generateZip } from '../services/zipService';

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

const YouTubeAnalyzer: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('yt_dark_mode') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

      return matchViews && matchLikes && matchDuration && matchType;
    });

    return [...result].sort((a, b) => {
      if (sortOption === 'popular') return b.viewCountRaw - a.viewCountRaw;
      if (sortOption === 'most_liked') return b.likeCountRaw - a.likeCountRaw;
      if (sortOption === 'highest_er') return b.engagementRate - a.engagementRate;
      if (sortOption === 'newest') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (sortOption === 'oldest') return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      return 0;
    });
  }, [data, savedVideos, mode, contentType, minViews, minLikes, durationRange, sortOption]);

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      {toast && <Toast message={zipProgress > 0 ? `Processing ZIP: ${zipProgress}%` : toast.message} type={toast.type} />}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 glass-strong z-[150] border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <IconTV className="w-7 h-7 text-destructive" />
          <span className="text-[15px] font-extrabold tracking-tighter text-foreground">
            YT ANALYZER <span className="text-primary">PRO</span>
          </span>
        </div>

        <div className="hidden md:flex flex-1 max-w-2xl mx-12">
          <SearchBar query={query} setQuery={setQuery} onSearch={handleAnalyze} />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="p-2 hover:bg-accent rounded-xl transition-all duration-300"
          >
            {darkMode ? <IconSun className="w-4 h-4 text-muted-foreground" /> : <IconMoon className="w-4 h-4 text-muted-foreground" />}
          </button>
          <button 
            onClick={() => setShowSettings(true)} 
            className="p-2 hover:bg-accent rounded-xl transition-all duration-300"
          >
            <IconSettings className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="hidden sm:block text-right ml-2">
            <span className="block text-[9px] font-black text-muted-foreground uppercase">Quota Usage</span>
            <div className="w-20 h-1.5 bg-secondary rounded-full mt-1 overflow-hidden border border-border">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${Math.min((quotaUsed / QUOTA_LIMIT) * 100, 100)}%` }}
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
      <main className="pt-14 md:pl-[240px]">
        {/* Filter Bar */}
        <div className="sticky top-14 glass-strong z-[90] border-b border-border px-8 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
              {/* Content Type Filter */}
              <div className="flex items-center gap-2 p-1 bg-secondary rounded-xl">
                {(['all', 'long', 'shorts'] as ContentTypeFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setContentType(f)}
                    className={`px-4 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                      contentType === f 
                        ? 'bg-card text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'long' ? 'Long' : 'Shorts'}
                  </button>
                ))}
              </div>

              {/* Region Selector for Trending */}
              {mode === 'trending' && (
                <div className="animate-fade-in flex items-center gap-2">
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
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 ${
                  showFilters 
                    ? 'bg-primary/10 border-primary/20 text-primary' 
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <IconFilter className="w-3.5 h-3.5" />
                Filters & Limit
              </button>

              {/* Action Buttons */}
              {filteredVideos.length > 0 && (
                <div className="flex items-center gap-1.5 border-l border-border pl-2 ml-2">
                  <button 
                    onClick={() => generateCSV(filteredVideos, "Report")} 
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400" 
                    title="Export CSV Report"
                  >
                    <IconDescription className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => exportToExcel(filteredVideos, "Report")} 
                    className="p-2 bg-green-50 text-green-700 rounded-xl border border-green-200 hover:bg-green-100 transition-colors dark:bg-green-950/30 dark:border-green-800 dark:text-green-400" 
                    title="Export Excel Report"
                  >
                    <IconChart className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleBulkCopy} 
                    className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400" 
                    title="Copy All Links"
                  >
                    <IconCopy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleBulkDownload} 
                    className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20 hover:bg-primary/20 transition-colors" 
                    title="Download All Thumbnails (ZIP)"
                  >
                    <IconDownload className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
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
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonVideoCard key={i} />)}
            </div>
          ) : (
            mode === 'benchmark' ? (
              <CompetitorBenchmark apiKey={apiKey} />
            ) : mode === 'insights' ? (
              data ? <InsightsDashboard videos={data.videos} stats={data.channelStats} /> : (
                <div className="text-center py-20 text-muted-foreground font-medium italic">
                  Silakan analyze konten terlebih dahulu.
                </div>
              )
            ) : (
              <>
                {filteredVideos.length === 0 && !loading && (
                  <div className="text-center py-20 text-muted-foreground font-medium italic animate-pulse-soft">
                    {mode === 'dashboard' && !data 
                      ? 'Masukkan link channel, playlist, atau kata kunci untuk mulai menganalisis.' 
                      : `Data tidak ditemukan untuk kategori "${contentType === 'all' ? 'Semua Konten' : contentType === 'long' ? 'Video Panjang' : 'Shorts'}".`
                    }
                  </div>
                )}
                <div className={`grid gap-6 ${
                  contentType === 'shorts' 
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}>
                  {filteredVideos.map((v, i) => (
                    <VideoCard
                      key={v.id}
                      video={v}
                      index={i}
                      onToast={showToast}
                      isSaved={savedVideos.some(sv => sv.id === v.id)}
                      onSaveToggle={(target) => {
                        const exists = savedVideos.some(sv => sv.id === target.id);
                        const next = exists ? savedVideos.filter(sv => sv.id !== target.id) : [target, ...savedVideos];
                        setSavedVideos(next);
                        localStorage.setItem('yt_saved_videos', JSON.stringify(next));
                      }}
                    />
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl p-8 shadow-premium-lg border border-border animate-scale-in">
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
            <div className="flex gap-3 pt-6">
              <button 
                onClick={() => setShowSettings(false)} 
                className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-accent transition-all duration-300"
              >
                Cancel
              </button>
              <button 
                onClick={() => saveApiKey(apiKey)} 
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-300"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeAnalyzer;
