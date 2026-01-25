import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonCardProps {
  index?: number;
  isShort?: boolean;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ index = 0, isShort = false }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.03 }}
    className="flex flex-col gap-4 w-full"
  >
    <div 
      className={`${isShort ? 'aspect-[9/16]' : 'aspect-video'} bg-muted rounded-2xl w-full overflow-hidden`}
    >
      <motion.div
        className="w-full h-full"
        animate={{
          background: [
            'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--background)) 50%, hsl(var(--muted)) 100%)',
            'linear-gradient(90deg, hsl(var(--muted)) 100%, hsl(var(--background)) 150%, hsl(var(--muted)) 200%)',
          ],
          backgroundPosition: ['-200% 0', '200% 0'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ backgroundSize: '200% 100%' }}
      />
    </div>
    <div className="flex gap-3">
      <motion.div 
        className="w-10 h-10 bg-muted rounded-full shrink-0"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <div className="flex flex-col gap-2 w-full">
        <motion.div 
          className="h-4 bg-muted rounded-lg w-[90%]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        />
        <motion.div 
          className="h-3 bg-muted rounded-lg w-[60%]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
      </div>
    </div>
  </motion.div>
);

export default SkeletonCard;
