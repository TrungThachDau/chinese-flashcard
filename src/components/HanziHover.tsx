'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, Sparkles, Layers, PenTool, X } from 'lucide-react';
import { CharDetail } from '@/lib/types';
import { playChineseAudio } from '@/lib/tts';

const clientCharCache = new Map<string, CharDetail>();
let activeCloseHandler: (() => void) | null = null;

interface HanziHoverProps {
  char: string;
  className?: string;
  activeClassName?: string;
  showTooltip?: boolean;
}

export const HanziHover: React.FC<HanziHoverProps> = ({
  char,
  className = '',
  activeClassName = 'text-amber-600 dark:text-amber-400 font-bold cursor-pointer transition-colors hover:text-amber-500',
  showTooltip = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean; width: number }>({
    top: 50,
    left: 50,
    placeAbove: false,
    width: 310,
  });
  const [detail, setDetail] = useState<CharDetail | null>(() => clientCharCache.get(char) || null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isHanzi = /[\u4e00-\u9fa5]/.test(char);

  // Calculate safe, unclamped position without causing off-screen overflow or inner scrollbar
  const updatePosition = useCallback(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const rect = containerRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(310, window.innerWidth - 24);
    const estimatedHeight = 250; // Compact height of the full card

    // Center horizontally on character, strictly clamped within screen bounds
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    let top: number;
    let placeAbove = false;

    if (spaceAbove >= estimatedHeight + 16) {
      // Place ABOVE character
      top = rect.top - estimatedHeight - 8;
      placeAbove = true;
    } else if (spaceBelow >= estimatedHeight + 16) {
      // Place BELOW character
      top = rect.bottom + 8;
      placeAbove = false;
    } else {
      // If viewport is tight, place where there's more room and clamp within viewport
      if (spaceAbove >= spaceBelow) {
        top = Math.max(12, rect.top - estimatedHeight - 8);
        placeAbove = true;
      } else {
        top = Math.min(window.innerHeight - estimatedHeight - 12, rect.bottom + 8);
        placeAbove = false;
      }
    }

    // Strict boundary clamps
    top = Math.max(12, Math.min(top, window.innerHeight - estimatedHeight - 12));

    setCoords({ top, left, placeAbove, width: tooltipWidth });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  // Load character details from API if not in initial cache
  useEffect(() => {
    if (isHanzi && !detail && isOpen) {
      setLoading(true);
      fetch(`/api/characters/${encodeURIComponent(char)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.detail) {
            clientCharCache.set(char, data.detail);
            setDetail(data.detail);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [char, isHanzi, detail, isOpen]);

  // Close pinned popover if user clicks outside
  useEffect(() => {
    if (isPinned) {
      const handleGlobalClick = (e: MouseEvent) => {
        if (
          popoverRef.current &&
          !popoverRef.current.contains(e.target as Node) &&
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsPinned(false);
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleGlobalClick);
      return () => document.removeEventListener('mousedown', handleGlobalClick);
    }
  }, [isPinned]);

  const closeImmediate = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(false);
    setIsPinned(false);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      if (activeCloseHandler === closeImmediate) {
        activeCloseHandler = null;
      }
    };
  }, [closeImmediate]);

  if (!isHanzi || !showTooltip) {
    return <span className={className}>{char}</span>;
  }

  const handleMouseEnter = () => {
    // Immediately close any other open Hanzi popover when hovering a new character
    if (activeCloseHandler && activeCloseHandler !== closeImmediate) {
      activeCloseHandler();
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    updatePosition();
    setIsOpen(true);
    activeCloseHandler = closeImmediate;
  };

  const handleMouseLeave = () => {
    if (isPinned) return; // Stay open if user clicked/pinned
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      if (activeCloseHandler === closeImmediate) {
        activeCloseHandler = null;
      }
    }, 80);
  };

  const handlePopoverMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    if (isPinned) return;
    closeImmediate();
    if (activeCloseHandler === closeImmediate) {
      activeCloseHandler = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (!isOpen) {
      if (activeCloseHandler && activeCloseHandler !== closeImmediate) {
        activeCloseHandler();
      }
      updatePosition();
      setIsOpen(true);
      setIsPinned(true);
      activeCloseHandler = closeImmediate;
    } else {
      closeImmediate();
      if (activeCloseHandler === closeImmediate) {
        activeCloseHandler = null;
      }
    }
  };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playChineseAudio(char, { rate: 0.8 });
  };

  return (
    <>
      <span
        ref={containerRef}
        className={`relative inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <span
          className={`${activeClassName} border-b-2 border-dotted border-amber-400/80 pb-0.5 hover:border-amber-500 hover:text-amber-500`}
        >
          {char}
        </span>
      </span>

      {/* Render Portal directly to document.body */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={`Thông tin chữ ${char}`}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 999999,
            }}
            className={`p-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-indigo-950/30 border-2 border-amber-500 text-left animate-in fade-in zoom-in-95 duration-100 select-text ${
              coords.placeAbove
                ? 'before:content-[""] before:absolute before:-bottom-3 before:left-0 before:right-0 before:h-4'
                : 'before:content-[""] before:absolute before:-top-3 before:left-0 before:right-0 before:h-4'
            }`}
          >
            {/* Header: Hanzi, Pinyin, Sino-Vietnamese, Audio, Close */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl font-black text-amber-500 dark:text-amber-400 leading-none">
                  {char}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans">
                      {detail?.pinyin || ''}
                    </span>
                    <button
                      type="button"
                      onClick={handlePlayAudio}
                      className="p-1 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800/80 text-amber-600 dark:text-amber-400 transition-colors shadow-sm active:scale-95"
                      title="Nghe phát âm chữ này"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {detail?.sino_vietnamese && (
                    <span className="inline-block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Hán Việt: {detail.sino_vietnamese}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeImmediate();
                  if (activeCloseHandler === closeImmediate) {
                    activeCloseHandler = null;
                  }
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body: Compact layout, NO scrollbar */}
            <div className="mt-2.5 space-y-2 text-xs font-sans">
              {loading ? (
                <div className="py-2 text-center text-slate-400 text-xs">Đang tải thông tin...</div>
              ) : detail ? (
                <>
                  {/* Row 1: Radical & Strokes */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                      <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Bộ thủ</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px] truncate block">
                          {detail.radical} ({detail.radical_meaning.replace('Bộ ', '')})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                      <PenTool className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Số nét</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px] block">
                          {detail.stroke_count} nét
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Decomposition */}
                  {detail.decomposition && (
                    <div className="p-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/50">
                      <span className="font-bold text-[10px] block text-amber-700 dark:text-amber-300">
                        Cấu tạo chữ:
                      </span>
                      <p className="text-[11px] leading-snug mt-0.5">{detail.decomposition}</p>
                    </div>
                  )}

                  {/* Row 3: Mnemonic */}
                  {detail.explanation && (
                    <div className="p-1.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50">
                      <div className="flex items-center gap-1 font-bold text-[10px] text-indigo-700 dark:text-indigo-300">
                        <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>Mẹo nhớ & Ý nghĩa:</span>
                      </div>
                      <p className="text-[11px] leading-snug mt-0.5 text-slate-700 dark:text-slate-300">
                        {detail.explanation}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-1 text-slate-500 dark:text-slate-400 text-xs">
                  <span className="block font-medium">Chữ Hán: {char}</span>
                  <span className="text-[10px] text-slate-400">Bấm loa để nghe phát âm</span>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

interface HanziTextProps {
  text: string;
  className?: string;
  charClassName?: string;
  activeClassName?: string;
}

export const HanziText: React.FC<HanziTextProps> = ({
  text,
  className = '',
  charClassName = '',
  activeClassName,
}) => {
  if (!text) return null;

  const chars = Array.from(text);

  return (
    <span className={`inline-block ${className}`}>
      {chars.map((ch, idx) => (
        <HanziHover
          key={`${ch}-${idx}`}
          char={ch}
          className={charClassName}
          activeClassName={activeClassName}
        />
      ))}
    </span>
  );
};
