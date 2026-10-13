import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const isDark = theme !== 'gold';

  const toggleTheme = () => {
    setTheme(isDark ? 'gold' : 'obsidian');
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="icon-btn flex items-center justify-center rounded-xl p-2 text-mute hover:text-ink hover:bg-[color-mix(in_srgb,var(--text-1)_8%,transparent)] transition-all cursor-pointer"
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.7, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Sun size={18} className="text-amber-400" />
        ) : (
          <Moon size={18} className="text-slate-700" />
        )}
      </motion.div>
    </button>
  );
}