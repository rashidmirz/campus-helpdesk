import { cn } from '../../lib/utils';
export function LogoMark({ size = 32, className }) {
  return (
    <span style={{ width: size, height: size }} className={cn('inline-flex shrink-0 items-center justify-center rounded-[28%] bg-accent text-accent-on', className)} aria-hidden>
      <svg viewBox="0 0 24 24" width={size * .62} height={size * .62} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19c0-8 4.5-13 14-13 0 9-4.5 13-10.5 13-1.2 0-2.4-.2-3.5-.6" /><path d="M5 19c3-4 6-7 10-9" />
      </svg>
    </span>
  );
}
export const Wordmark = ({ className, light }) => (
  <span className={cn('flex flex-col leading-none', className)}>
    <span className={cn('font-display text-[17px]', light ? 'text-white' : 'text-ink')}>Silver Oak</span>
    <span className={cn('mt-1 text-[11px] tracking-wide', light ? 'text-white/60' : 'text-ink-3')}>Campus Helpdesk</span>
  </span>
);
