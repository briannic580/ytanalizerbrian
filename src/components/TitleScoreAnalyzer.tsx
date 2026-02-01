import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoItem } from '../types';
import { IconSparkles, IconChart, IconImage } from '../constants/icons';
import { 
  calculateAllVideoScores, 
  getAverageScores, 
  getGradeDistribution,
  VideoWithScores,
  PerformanceScore
} from '../services/performanceScoreService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface TitleScoreAnalyzerProps {
  videos: VideoItem[];
}

const TitleScoreAnalyzer: React.FC<TitleScoreAnalyzerProps> = ({ videos }) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoWithScores | null>(null);
  const [activeTab, setActiveTab] = useState<'title' | 'thumbnail'>('title');

  // Calculate all scores
  const scoredVideos = useMemo(() => {
    return calculateAllVideoScores(videos);
  }, [videos]);

  // Sort by current tab's score
  const sortedVideos = useMemo(() => {
    return [...scoredVideos].sort((a, b) => {
      if (activeTab === 'title') {
        return b.titleScore.totalScore - a.titleScore.totalScore;
      }
      return b.thumbnailScore.totalScore - a.thumbnailScore.totalScore;
    });
  }, [scoredVideos, activeTab]);

  // Overall stats
  const { avgTitleScore, avgThumbnailScore } = useMemo(() => {
    return getAverageScores(videos);
  }, [videos]);

  const titleDistribution = useMemo(() => {
    return getGradeDistribution(scoredVideos.map(v => v.titleScore));
  }, [scoredVideos]);

  const thumbnailDistribution = useMemo(() => {
    return getGradeDistribution(scoredVideos.map(v => v.thumbnailScore));
  }, [scoredVideos]);

  const handleSelectVideo = (video: VideoWithScores) => {
    setSelectedVideo(video);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30';
      case 'B': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      case 'C': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
      case 'D': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30';
      default: return 'text-red-500 bg-red-100 dark:bg-red-900/30';
    }
  };

  const getScoreBarColor = (score: number, max: number) => {
    const percentage = max > 0 ? (score / max) * 100 : 0;
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getCurrentScore = (video: VideoWithScores): PerformanceScore => {
    return activeTab === 'title' ? video.titleScore : video.thumbnailScore;
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <IconSparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Analyze a channel to score video titles & thumbnails</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
          <IconSparkles className="w-6 h-6 text-primary" />
          Title & Thumbnail Performance
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Scores based on actual video performance (views, likes, engagement)
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'title' | 'thumbnail')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="title" className="flex items-center gap-2">
            <IconChart className="w-4 h-4" />
            Title Score
          </TabsTrigger>
          <TabsTrigger value="thumbnail" className="flex items-center gap-2">
            <IconImage className="w-4 h-4" />
            Thumbnail Score
          </TabsTrigger>
        </TabsList>

        <TabsContent value="title" className="mt-6">
          {/* Title Score Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Title Score</p>
              <p className="text-3xl font-black text-foreground mt-1">{avgTitleScore}</p>
              <p className="text-xs text-muted-foreground">out of 100</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Grade Distribution</p>
              <div className="flex gap-1 mt-2">
                {Object.entries(titleDistribution).map(([grade, count]) => (
                  <div key={grade} className="flex-1 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getGradeColor(grade)}`}>
                      {grade}
                    </span>
                    <p className="text-sm font-bold text-foreground mt-1">{count}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scoring Formula</p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Views</span><span className="font-bold text-foreground">35%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Likes</span><span className="font-bold text-foreground">25%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">ER%</span><span className="font-bold text-foreground">20%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Text</span><span className="font-bold text-foreground">20%</span></div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Best Title</p>
              {sortedVideos[0] && (
                <>
                  <p className="text-sm font-bold text-foreground mt-1 line-clamp-2">{sortedVideos[0].title}</p>
                  <p className="text-xs text-primary mt-1">Score: {sortedVideos[0].titleScore.totalScore}/100</p>
                </>
              )}
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="thumbnail" className="mt-6">
          {/* Thumbnail Score Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Thumbnail Score</p>
              <p className="text-3xl font-black text-foreground mt-1">{avgThumbnailScore}</p>
              <p className="text-xs text-muted-foreground">out of 100</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Grade Distribution</p>
              <div className="flex gap-1 mt-2">
                {Object.entries(thumbnailDistribution).map(([grade, count]) => (
                  <div key={grade} className="flex-1 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getGradeColor(grade)}`}>
                      {grade}
                    </span>
                    <p className="text-sm font-bold text-foreground mt-1">{count}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scoring Formula</p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Views (CTR)</span><span className="font-bold text-foreground">40%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Engagement</span><span className="font-bold text-foreground">30%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Recency</span><span className="font-bold text-foreground">30%</span></div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Best Thumbnail</p>
              {sortedVideos[0] && (
                <div className="mt-2">
                  <img 
                    src={sortedVideos[0].thumbnail} 
                    alt={sortedVideos[0].title}
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <p className="text-xs text-primary mt-1">Score: {sortedVideos[0].thumbnailScore.totalScore}/100</p>
                </div>
              )}
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
            {activeTab === 'title' ? 'Titles' : 'Thumbnails'} Ranked by Performance
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {sortedVideos.map((video, i) => {
              const score = getCurrentScore(video);
              return (
                <motion.button
                  key={video.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.02 }}
                  onClick={() => handleSelectVideo(video)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedVideo?.id === video.id
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-secondary/50 hover:bg-secondary border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {activeTab === 'thumbnail' && (
                      <img 
                        src={video.thumbnail} 
                        alt="" 
                        className="w-16 h-9 object-cover rounded-lg shrink-0"
                      />
                    )}
                    <span className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${getGradeColor(score.grade)}`}>
                      {score.grade}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-sm line-clamp-2">{video.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{score.totalScore}/100</span>
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getScoreBarColor(score.totalScore, 100)}`}
                            style={{ width: `${score.totalScore}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>{video.views}</span>
                        <span>•</span>
                        <span>{video.engagementRate}% ER</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Score Detail */}
        <AnimatePresence mode="wait">
          {selectedVideo ? (
            <motion.div
              key={selectedVideo.id + activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
                Performance Breakdown
              </h3>

              {/* Thumbnail Preview for Thumbnail tab */}
              {activeTab === 'thumbnail' && (
                <div className="mb-4">
                  <img 
                    src={selectedVideo.thumbnail} 
                    alt={selectedVideo.title}
                    className="w-full aspect-video object-cover rounded-xl"
                  />
                </div>
              )}

              {/* Title/Video Preview */}
              <div className="p-4 bg-secondary/50 rounded-xl mb-6">
                <p className="text-sm font-bold text-foreground">{selectedVideo.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-lg font-black ${getGradeColor(getCurrentScore(selectedVideo).grade)}`}>
                    {getCurrentScore(selectedVideo).grade}
                  </span>
                  <span className="text-2xl font-black text-foreground">{getCurrentScore(selectedVideo).totalScore}/100</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{selectedVideo.views}</span>
                  <span>•</span>
                  <span>{selectedVideo.likes} likes</span>
                  <span>•</span>
                  <span>{selectedVideo.engagementRate}% ER</span>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="space-y-4">
                {Object.entries(getCurrentScore(selectedVideo).breakdown)
                  .filter(([_, data]) => data.max > 0)
                  .map(([key, data]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-foreground capitalize">{key}</span>
                      <span className="text-muted-foreground">{data.score}/{data.max}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: data.max > 0 ? `${(data.score / data.max) * 100}%` : '0%' }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={getScoreBarColor(data.score, data.max)}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{data.label}</p>
                  </div>
                ))}
              </div>

              {/* Comparison with average */}
              <div className="mt-6 pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  📊 Comparison with Channel Average
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <span className="text-sm text-foreground">This {activeTab === 'title' ? 'Title' : 'Thumbnail'}</span>
                    <span className="text-sm font-bold text-foreground">{getCurrentScore(selectedVideo).totalScore}/100</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                    <span className="text-sm text-foreground">Channel Average</span>
                    <span className="text-sm font-bold text-muted-foreground">
                      {activeTab === 'title' ? avgTitleScore : avgThumbnailScore}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{
                    backgroundColor: getCurrentScore(selectedVideo).totalScore > (activeTab === 'title' ? avgTitleScore : avgThumbnailScore) 
                      ? 'rgb(16 185 129 / 0.1)' 
                      : 'rgb(239 68 68 / 0.1)'
                  }}>
                    <span className="text-sm text-foreground">Difference</span>
                    <span className={`text-sm font-bold ${
                      getCurrentScore(selectedVideo).totalScore > (activeTab === 'title' ? avgTitleScore : avgThumbnailScore)
                        ? 'text-emerald-500'
                        : 'text-red-500'
                    }`}>
                      {getCurrentScore(selectedVideo).totalScore > (activeTab === 'title' ? avgTitleScore : avgThumbnailScore) ? '+' : ''}
                      {getCurrentScore(selectedVideo).totalScore - (activeTab === 'title' ? avgTitleScore : avgThumbnailScore)} points
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center"
            >
              <div className="text-center text-muted-foreground">
                <IconChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Select a {activeTab === 'title' ? 'title' : 'thumbnail'} to see detailed analysis</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TitleScoreAnalyzer;
