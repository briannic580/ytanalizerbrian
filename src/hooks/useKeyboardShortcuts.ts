import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onSearch?: () => void;
  onEscape?: () => void;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  onSave?: () => void;
  onToggleTheme?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions) => {
  const {
    onSearch,
    onEscape,
    onNextVideo,
    onPrevVideo,
    onSave,
    onToggleTheme,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Only handle Escape in inputs
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        (target as HTMLInputElement).blur();
        onEscape();
      }
      return;
    }

    // Cmd/Ctrl + K - Search
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      onSearch?.();
      return;
    }

    // Escape - Close modals
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape?.();
      return;
    }

    // Arrow Right - Next video
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onNextVideo?.();
      return;
    }

    // Arrow Left - Previous video
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onPrevVideo?.();
      return;
    }

    // S - Save current video
    if (event.key === 's' || event.key === 'S') {
      event.preventDefault();
      onSave?.();
      return;
    }

    // D - Toggle dark mode
    if (event.key === 'd' || event.key === 'D') {
      event.preventDefault();
      onToggleTheme?.();
      return;
    }
  }, [enabled, onSearch, onEscape, onNextVideo, onPrevVideo, onSave, onToggleTheme]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
