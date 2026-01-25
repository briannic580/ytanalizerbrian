import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoItem } from '../types';
import { analyzeTitleScore, analyzeVideoTitles, TitleScoreResult } from '../services/titleScoreService';
import { IconSparkles, IconChart } from '../constants/icons';

interface TitleScoreAnalyzerProps {
  videos: VideoItem[];
}

const TitleScoreAnalyzer: React.FC<TitleScoreAnalyzerProps> = ({ videos }) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [selectedResult, setSelectedResult] = useState<TitleScoreResult | null>(null);

  const overallStats = useMemo(() => {
    return analyzeVideoTitles(videos.map(v => v.title));
  }, [videos]);

  const videoScores = useMemo(() => {
    return videos.map(v => ({
      video: v,
      score: analyzeTitleScore(v.title)
    })).sort((a, b) => b.score.totalScore - a.score.totalScore);
  }, [videos]);

  const handleSelectVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    setSelectedResult(analyzeTitleScore(video.title));
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
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <IconSparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Analyze a channel to score video titles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
          <IconSparkles className="w-6 h-6 text-primary" />
          Title Score Analyzer
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optimize your video titles for maximum engagement
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Average Score</p>
          <p className="text-3xl font-black text-foreground mt-1">{overallStats.averageScore}</p>
          <p className="text-xs text-muted-foreground">out of 80</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Grade Distribution</p>
          <div className="flex gap-1 mt-2">
            {Object.entries(overallStats.distribution).map(([grade, count]) => (
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
          className="bg-card border border-border rounded-2xl p-4 md:col-span-2"
        >
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Best Title</p>
          {overallStats.bestTitle && (
            <>
              <p className="text-sm font-bold text-foreground mt-1 line-clamp-2">{overallStats.bestTitle.title}</p>
              <p className="text-xs text-primary mt-1">Score: {overallStats.bestTitle.score}/80</p>
            </>
          )}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
            All Titles Ranked
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {videoScores.map(({ video, score }, i) => (
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
                  <span className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg ${getGradeColor(score.grade)}`}>
                    {score.grade}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm line-clamp-2">{video.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{score.totalScore}/80</span>
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getScoreBarColor(score.totalScore, 80)}`}
                          style={{ width: `${(score.totalScore / 80) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Score Detail */}
        <AnimatePresence mode="wait">
          {selectedResult ? (
            <motion.div
              key={selectedVideo?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
                Score Breakdown
              </h3>

              {/* Title Preview */}
              <div className="p-4 bg-secondary/50 rounded-xl mb-6">
                <p className="text-sm font-bold text-foreground">{selectedVideo?.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-lg font-black ${getGradeColor(selectedResult.grade)}`}>
                    {selectedResult.grade}
                  </span>
                  <span className="text-2xl font-black text-foreground">{selectedResult.totalScore}/80</span>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="space-y-4">
                {Object.entries(selectedResult.breakdown).map(([key, data]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-muted-foreground">{data.score}/{data.max}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.score / data.max) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={getScoreBarColor(data.score, data.max)}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{data.feedback}</p>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              {selectedResult.suggestions.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    💡 Improvement Tips
                  </h4>
                  <ul className="space-y-2">
                    {selectedResult.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-primary mt-0.5">→</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center"
            >
              <div className="text-center text-muted-foreground">
                <IconChart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Select a title to see detailed analysis</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TitleScoreAnalyzer;
