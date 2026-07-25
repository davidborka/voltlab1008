/** Közös felületi elemek. Kevés, jól megtervezett darab a sok apró helyett. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

type BtnTone = 'default' | 'primary' | 'ghost' | 'danger' | 'live';

export function Button({
  children,
  tone = 'default',
  size = 'md',
  icon: Icon,
  className,
  ...rest
}: {
  children?: ReactNode;
  tone?: BtnTone;
  size?: 'sm' | 'md';
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const tones: Record<BtnTone, string> = {
    default: 'bg-surface-3/70 border-line hover:border-arc/50 text-ink',
    primary: 'bg-arc/15 border-arc/45 text-arc hover:bg-arc/25',
    ghost: 'bg-transparent border-transparent text-ink-dim hover:text-ink hover:bg-surface-3/60',
    danger: 'bg-transparent border-line text-bad hover:bg-bad/10 hover:border-bad/40',
    live: 'bg-amber/15 border-amber/50 text-amber hover:bg-amber/25',
  };
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex select-none items-center gap-2 rounded-[11px] border font-semibold',
        'transition-colors duration-150 ease-snap active:translate-y-px disabled:opacity-40 disabled:pointer-events-none',
        size === 'sm' ? 'h-8 px-2.5 text-[12px]' : 'h-10 px-3.5 text-[13px]',
        tones[tone],
        className
      )}
    >
      {Icon ? <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} /> : null}
      {children}
    </button>
  );
}

export function Panel({
  title,
  eyebrow,
  right,
  children,
  className,
}: {
  title?: ReactNode;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        'rounded-[14px] border border-line bg-surface-2/80 shadow-panel backdrop-blur-[2px]',
        className
      )}
    >
      {(title || eyebrow || right) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
            {title && <h2 className="truncate text-[14px] font-bold tracking-[-0.01em]">{title}</h2>}
          </div>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'arc' | 'amber' | 'good' | 'bad' }) {
  const tones = {
    neutral: 'border-line text-ink-dim',
    arc: 'border-arc/40 text-arc bg-arc/10',
    amber: 'border-amber/40 text-amber bg-amber/10',
    good: 'border-good/40 text-good bg-good/10',
    bad: 'border-bad/40 text-bad bg-bad/10',
  };
  return (
    <span className={cx('mono inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em]', tones[tone])}>
      {children}
    </span>
  );
}

/** Súlyosságot nem csak szín jelöl - a jel és a szöveg is hordozza. */
export function SeverityMark({ severity }: { severity: 'error' | 'warning' | 'info' }) {
  const map = {
    error: { sign: '✕', cls: 'text-bad border-bad/40 bg-bad/10', label: 'Hiba' },
    warning: { sign: '!', cls: 'text-amber border-amber/40 bg-amber/10', label: 'Figyelem' },
    info: { sign: 'i', cls: 'text-arc border-arc/40 bg-arc/10', label: 'Megjegyzés' },
  }[severity];
  return (
    <span className={cx('mono inline-flex h-5 shrink-0 items-center gap-1 rounded border px-1.5 text-[10px] font-bold', map.cls)}>
      <span aria-hidden>{map.sign}</span>
      {map.label}
    </span>
  );
}

export function Meter({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-arc transition-[width] duration-500 ease-snap"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      {label && <div className="mono mt-1 text-[10px] text-ink-faint">{label}</div>}
    </div>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] text-ink shadow-lift group-hover/tt:block"
      >
        {label}
      </span>
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose(): void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm no-print">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'mt-[6vh] w-full rounded-[14px] border border-line bg-surface-2 shadow-lift outline-none',
          wide ? 'max-w-4xl' : 'max-w-xl'
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[14px] font-bold">{title}</h2>
          <Button tone="ghost" size="sm" onClick={onClose} aria-label="Bezárás">
            <X size={16} />
          </Button>
        </header>
        <div className="max-h-[74vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function useLocal<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial; /* privát mód vagy tele a tárhely - az app enélkül is megy */
    }
  });
  const set = (next: T) => {
    setV(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* nem baj */
    }
  };
  return [v, set];
}

/** Rövid, nem tolakodó visszajelzés. */
export function useToast() {
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? (
    <div
      role="status"
      className={cx(
        'pointer-events-none fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-[11px] border px-4 py-2.5 text-[13px] shadow-lift no-print',
        msg.bad ? 'border-bad/50 bg-surface-2 text-bad' : 'border-line bg-surface-2 text-ink'
      )}
    >
      {msg.text}
    </div>
  ) : null;
  return { toast: (text: string, bad?: boolean) => setMsg({ text, bad }), node };
}
