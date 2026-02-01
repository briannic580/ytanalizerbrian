import React from 'react';
import { IconHome, IconSubs, IconUser, IconHistory, IconTrending, IconChart, IconSparkles, IconDownload } from '../constants/icons';
import { AnalysisMode } from '../types';

interface RowProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const Row: React.FC<RowProps> = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-4 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 group ${
      active 
        ? 'bg-primary/10 text-primary font-bold' 
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`}
  >
    <div className={`w-5 h-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
      active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
    }`}>
      {icon}
    </div>
    <span className="text-[13px] font-medium tracking-tight">
      {label}
    </span>
  </div>
);

interface SidebarProps {
  currentMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  onFetchTrending: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMode, onModeChange, onFetchTrending }) => {
  return (
    <div className="hidden md:flex flex-col w-[240px] h-[calc(100vh-56px)] overflow-y-auto fixed top-14 left-0 px-4 bg-background border-r border-border py-6 transition-colors duration-500 z-40">
      <div className="space-y-1">
        <Row 
          icon={<IconHome filled={currentMode === 'dashboard'} />} 
          label="Dashboard" 
          active={currentMode === 'dashboard'} 
          onClick={() => onModeChange('dashboard')} 
        />
        <Row 
          icon={<IconTrending />} 
          label="Trending Topics" 
          active={currentMode === 'trending'} 
          onClick={onFetchTrending} 
        />
      </div>

      <div className="my-6 border-t border-border/50" />

      <div className="space-y-1">
        <div className="px-4 mb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          Analysis
        </div>
        <Row 
          icon={<IconChart />} 
          label="Channel Stats" 
          active={currentMode === 'insights'} 
          onClick={() => onModeChange('insights')} 
        />
        <Row 
          icon={<IconSubs />} 
          label="Benchmark" 
          active={currentMode === 'benchmark'} 
          onClick={() => onModeChange('benchmark')} 
        />
        <Row 
          icon={<IconSparkles />} 
          label="Content Gap" 
          active={currentMode === 'content_gap'} 
          onClick={() => onModeChange('content_gap')} 
        />
        <Row 
          icon={<IconHistory />} 
          label="Upload Schedule" 
          active={currentMode === 'schedule'} 
          onClick={() => onModeChange('schedule')} 
        />
        <Row 
          icon={<IconChart />} 
          label="Title & Thumbnail Score" 
          active={currentMode === 'title_score'} 
          onClick={() => onModeChange('title_score')} 
        />
      </div>

      <div className="my-6 border-t border-border/50" />

      <div className="space-y-1">
        <div className="px-4 mb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          Tools
        </div>
        <Row 
          icon={<IconDownload />} 
          label="Video Downloader" 
          active={currentMode === 'downloader'} 
          onClick={() => onModeChange('downloader')} 
        />
      </div>

      <div className="my-6 border-t border-border/50" />

      <div className="space-y-1">
        <div className="px-4 mb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          Library
        </div>
        <Row 
          icon={<IconUser />} 
          label="Saved Content" 
          active={currentMode === 'saved'} 
          onClick={() => onModeChange('saved')} 
        />
        <Row 
          icon={<IconHistory />} 
          label="Search History" 
          active={currentMode === 'history'} 
          onClick={() => onModeChange('history')} 
        />
      </div>

      <div className="mt-auto pt-8 px-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-loose">
        <p>© 2024 YT ANALYZER PRO</p>
      </div>
    </div>
  );
};

export default Sidebar;
