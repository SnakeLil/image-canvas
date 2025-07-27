'use client';

import { useState, useEffect } from 'react';

const INSTRUCTIONS_STORAGE_KEY = 'magic-eraser-instructions-seen';

export const useInstructions = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Just initialize, don't auto-show instructions
    setIsLoading(false);
  }, []);

  const hideInstructions = () => {
    setShowInstructions(false);
    localStorage.setItem(INSTRUCTIONS_STORAGE_KEY, 'true');
  };

  const showInstructionsAgain = () => {
    setShowInstructions(true);
  };

  const showInstructionsIfFirstTime = () => {
    const hasSeenInstructions = localStorage.getItem(INSTRUCTIONS_STORAGE_KEY);
    if (!hasSeenInstructions) {
      setShowInstructions(true);
    }
  };

  const resetInstructions = () => {
    localStorage.removeItem(INSTRUCTIONS_STORAGE_KEY);
    setShowInstructions(true);
  };

  return {
    showInstructions,
    hideInstructions,
    showInstructionsAgain,
    showInstructionsIfFirstTime,
    resetInstructions,
    isLoading
  };
};
