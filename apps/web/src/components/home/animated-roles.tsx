'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '@kevincarmen/config';

export function AnimatedRoles() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % siteConfig.roles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 overflow-hidden sm:h-10">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="block text-lg font-medium text-accent sm:text-xl"
        >
          {siteConfig.roles[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
