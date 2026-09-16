// [AI]
import React from 'react';

import './cursor-digits.scss';

type TDigitParticle = {
    id: number;
    x: number;
    y: number;
    value: number;
    colorVar: string;
    createdAt: number;
};

const COLOR_VARS = ['--brand-primary', '--brand-secondary', '--brand-tertiary', '--brand-success'];
const LIFETIME_MS = 900;
const SPAWN_INTERVAL_MS = 70;
const STORAGE_KEY = 'alphastream_cursor_digits_enabled';

/**
 * Decorative trading-themed cursor trail matching the one on the landing page:
 * small digits (0-9) tick and drift behind the pointer in brand colors.
 * Disabled by default on touch devices / prefers-reduced-motion, and toggleable
 * via the small pill button it renders (persisted to localStorage).
 */
const CursorDigits = () => {
    const [enabled, setEnabled] = React.useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored !== null) return stored === '1';
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
        return !prefersReducedMotion && !isTouchDevice;
    });

    const [particles, setParticles] = React.useState<TDigitParticle[]>([]);
    const lastSpawnRef = React.useRef(0);
    const nextIdRef = React.useRef(0);

    React.useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    }, [enabled]);

    React.useEffect(() => {
        if (!enabled) {
            setParticles([]);
            return undefined;
        }

        const handlePointerMove = (event: PointerEvent) => {
            const now = performance.now();
            if (now - lastSpawnRef.current < SPAWN_INTERVAL_MS) return;
            lastSpawnRef.current = now;

            const particle: TDigitParticle = {
                id: nextIdRef.current++,
                x: event.clientX,
                y: event.clientY,
                value: Math.floor(Math.random() * 10),
                colorVar: COLOR_VARS[Math.floor(Math.random() * COLOR_VARS.length)],
                createdAt: now,
            };

            setParticles(prev => [...prev.slice(-40), particle]);
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        return () => window.removeEventListener('pointermove', handlePointerMove);
    }, [enabled]);

    React.useEffect(() => {
        if (!enabled || particles.length === 0) return undefined;
        let frame: number;
        const prune = () => {
            const now = performance.now();
            setParticles(prev => prev.filter(p => now - p.createdAt < LIFETIME_MS));
            frame = requestAnimationFrame(prune);
        };
        frame = requestAnimationFrame(prune);
        return () => cancelAnimationFrame(frame);
    }, [enabled, particles.length]);

    return (
        <>
            {enabled && (
                <div className='cursor-digits' aria-hidden='true'>
                    {particles.map(p => (
                        <span
                            key={p.id}
                            className='cursor-digits__particle'
                            style={{
                                left: p.x,
                                top: p.y,
                                color: `var(${p.colorVar})`,
                            }}
                        >
                            {p.value}
                        </span>
                    ))}
                </div>
            )}
            <button
                type='button'
                className='cursor-digits__toggle'
                aria-pressed={enabled}
                onClick={() => setEnabled(v => !v)}
            >
                Cursor digits: {enabled ? 'On' : 'Off'}
            </button>
        </>
    );
};

export default CursorDigits;
// [/AI]
