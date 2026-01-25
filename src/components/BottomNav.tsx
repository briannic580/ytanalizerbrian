import React from 'react';
import { motion } from 'framer-motion';
import { IconHome, IconTrending, IconChart, IconBookmark } from '../constants/icons';
import { AnalysisMode } from '../types';

interface BottomNavProps {
  currentMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  onFetchTrending: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
      active 
        ? 'text-primary' 
        : 'text-muted-foreground'
    }`}
  >
    <motion.div
      animate={{ scale: active ? 1.1 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="w-5 h-5"
    >
      {icon}
    </motion.div>
    <span className="text-[10px] font-bold">{label}</span>
    {active && (
      <motion.div
        layoutId="bottomNavIndicator"
        className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    )}
  </motion.button>
);

const BottomNav: React.FC<BottomNavProps> = ({ currentMode, onModeChange, onFetchTrending }) => {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-[150] bg-card/95 backdrop-blur-xl border-t border-border px-2 pb-safe"
    >
      <div className="flex items-center justify-around py-2">
        <NavItem
          icon={<IconHome filled={currentMode === 'dashboard'} />}
          label="Home"
          active={currentMode === 'dashboard'}
          onClick={() => onModeChange('dashboard')}
        />
        <NavItem
          icon={<IconTrending />}
          label="Trending"
          active={currentMode === 'trending'}
          onClick={onFetchTrending}
        />
        <NavItem
          icon={<IconChart />}
          label="Stats"
          active={currentMode === 'insights'}
          onClick={() => onModeChange('insights')}
        />
        <NavItem
          icon={<IconBookmark filled={currentMode === 'saved'} />}
          label="Saved"
          active={currentMode === 'saved'}
          onClick={() => onModeChange('saved')}
        />
      </div>
    </motion.nav>
  );
};

export default BottomNav;
