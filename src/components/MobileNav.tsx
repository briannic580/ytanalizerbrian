import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconHome, IconTrending, IconChart, IconSubs, IconSparkles, IconUser, IconHistory, IconMenu, IconX } from '../constants/icons';
import { AnalysisMode } from '../types';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  onFetchTrending: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  delay?: number;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, type: 'spring', stiffness: 300, damping: 30 }}
    onClick={onClick}
    className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl cursor-pointer transition-all duration-300 ${
      active 
        ? 'bg-primary/10 text-primary font-bold' 
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`}
  >
    <div className={`w-5 h-5 flex items-center justify-center ${
      active ? 'text-primary' : 'text-muted-foreground'
    }`}>
      {icon}
    </div>
    <span className="text-sm font-medium tracking-tight">{label}</span>
  </motion.div>
);

const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  currentMode,
  onModeChange,
  onFetchTrending,
}) => {
  const handleNavClick = (mode: AnalysisMode) => {
    onModeChange(mode);
    onClose();
  };

  const handleTrendingClick = () => {
    onFetchTrending();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-[280px] bg-card border-r border-border z-[201] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <span className="text-lg font-extrabold tracking-tight text-foreground">
                YT ANALYZER <span className="text-primary">PRO</span>
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-xl transition-colors"
              >
                <IconX className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              <NavItem
                icon={<IconHome filled={currentMode === 'dashboard'} />}
                label="Dashboard"
                active={currentMode === 'dashboard'}
                onClick={() => handleNavClick('dashboard')}
                delay={0.05}
              />
              <NavItem
                icon={<IconTrending />}
                label="Trending Topics"
                active={currentMode === 'trending'}
                onClick={handleTrendingClick}
                delay={0.1}
              />

              <div className="my-4 border-t border-border/50 mx-2" />

              <div className="px-4 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Analysis
              </div>

              <NavItem
                icon={<IconChart />}
                label="Channel Stats"
                active={currentMode === 'insights'}
                onClick={() => handleNavClick('insights')}
                delay={0.15}
              />
              <NavItem
                icon={<IconSubs />}
                label="Benchmark"
                active={currentMode === 'benchmark'}
                onClick={() => handleNavClick('benchmark')}
                delay={0.2}
              />
              <NavItem
                icon={<IconSparkles />}
                label="Content Gap"
                active={currentMode === 'content_gap'}
                onClick={() => handleNavClick('content_gap')}
                delay={0.25}
              />
              <NavItem
                icon={<IconUser />}
                label="Saved Content"
                active={currentMode === 'saved'}
                onClick={() => handleNavClick('saved')}
                delay={0.3}
              />
              <NavItem
                icon={<IconHistory />}
                label="Search History"
                active={currentMode === 'history'}
                onClick={() => handleNavClick('history')}
                delay={0.35}
              />
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                © 2024 YT ANALYZER PRO
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileNav;
