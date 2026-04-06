import type { Status } from '../types/inventory';

interface StatusChipProps {
  status: Status;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<Status, { dot: string; bg: string; text: string; border: string }> = {
  online: {
    dot: 'bg-green-500',
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  offline: {
    dot: 'bg-red-500',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  degraded: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  unknown: {
    dot: 'bg-gray-500',
    bg: 'bg-gray-500/20',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
  },
};

const sizeConfig = {
  sm: { chip: 'px-2 py-0.5 text-xs', dot: 'w-1.5 h-1.5' },
  md: { chip: 'px-2.5 py-1 text-sm', dot: 'w-2 h-2' },
  lg: { chip: 'px-3 py-1.5 text-base', dot: 'w-2.5 h-2.5' },
};

export function StatusChip({ status, label, size = 'md' }: StatusChipProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizes.chip}`}
    >
      <span className={`rounded-full ${config.dot} ${sizes.dot}`} />
      {label ?? status}
    </span>
  );
}

export function StatusDot({ status, size = 'md' }: { status: Status; size?: 'sm' | 'md' | 'lg' }) {
  const config = statusConfig[status];
  const dotSize = sizeConfig[size].dot;

  return <span className={`inline-block rounded-full ${config.dot} ${dotSize}`} />;
}
