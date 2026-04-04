/**
 * components/ui/index.tsx
 * Shared primitive components used across the app.
 */

'use client';

import { type ReactNode } from 'react';

// ── Avatar ────────────────────────────────────────────────────────────────────
interface AvatarProps {
    name: string;
    src?: string;
    size?: number;
}

export function Avatar({ name, src, size = 32 }: AvatarProps) {
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join('');

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
            />
        );
    }

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${size * 0.375}px`,
            fontWeight: 600,
            flexShrink: 0,
            userSelect: 'none',
        }}>
            {initials}
        </div>
    );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_VARIANTS: Record<string, { bg: string; color: string }> = {
    success: { bg: '#d1fae5', color: '#065f46' },
    warning: { bg: '#fef3c7', color: '#92400e' },
    danger: { bg: '#fee2e2', color: '#991b1b' },
    info: { bg: '#e0e7ff', color: '#3730a3' },
    neutral: { bg: 'var(--surface-2)', color: 'var(--ink-2)' },
    accent: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
};

interface BadgeProps {
    children: ReactNode;
    variant?: keyof typeof BADGE_VARIANTS;
    dot?: boolean;
}

export function Badge({ children, variant = 'neutral', dot }: BadgeProps) {
    const { bg, color } = BADGE_VARIANTS[variant];
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: dot ? '5px' : undefined,
            padding: '2px 8px',
            borderRadius: '99px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: bg,
            color,
        }}>
            {dot && (
                <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: color, flexShrink: 0,
                }} />
            )}
            {children}
        </span>
    );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 24px',
            textAlign: 'center',
            gap: '12px',
        }}>
            <span style={{ fontSize: '2.5rem', opacity: 0.5 }}>{icon}</span>
            <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 400,
                margin: 0,
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
            }}>{title}</h3>
            <p style={{ color: 'var(--ink-3)', fontSize: '0.875rem', margin: 0, maxWidth: '280px', lineHeight: 1.6 }}>
                {description}
            </p>
            {action && <div style={{ marginTop: '8px' }}>{action}</div>}
        </div>
    );
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 20 }: { size?: number }) {
    return (
        <div style={{
            width: size,
            height: size,
            border: `2px solid var(--border)`,
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            flexShrink: 0,
        }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    title, message, confirmText = 'Confirm',
    danger = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
    return (
        <>
            <div
                onClick={onCancel}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 80 }}
            />
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                zIndex: 81,
                background: 'var(--surface-0)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '28px',
                width: '380px',
                maxWidth: '95vw',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                animation: 'slideIn 0.15s ease-out',
            }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 400, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                    {title}
                </h3>
                <p style={{ color: 'var(--ink-2)', fontSize: '0.875rem', margin: '0 0 24px', lineHeight: 1.6 }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
                    <button
                        onClick={onConfirm}
                        className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ width, height, style }: { width?: string | number; height?: number; style?: React.CSSProperties }) {
    return (
        <div
            className="skeleton"
            style={{ width: width ?? '100%', height: height ?? 16, borderRadius: 'var(--radius-sm)', ...style }}
        />
    );
}