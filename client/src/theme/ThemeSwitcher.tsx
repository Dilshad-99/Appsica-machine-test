import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { THEMES, useTheme } from './ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="icon-btn glow-ring"
        aria-label="Switch theme"
        title="Theme Palette"
      >
        <Palette size={17} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.22, 0.8, 0.32, 1] }}
            className="glass-panel absolute right-0 top-12 z-50 w-56 rounded-2xl p-1.5 shadow-2xl border border-edge bg-card text-ink"
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--text-1)_6%,transparent)]"
              >
                <span className="flex -space-x-1">
                  {t.swatch.map((c) => (
                    <span
                      key={c}
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: c, borderColor: 'var(--border-strong)' }}
                    />
                  ))}
                </span>
                <span className="flex-1 text-[13px] font-medium" style={{ color: 'var(--text-1)' }}>
                  {t.name}
                </span>
                {t.id === theme && (
                  <Check size={14} style={{ color: 'var(--accent)' }} />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}