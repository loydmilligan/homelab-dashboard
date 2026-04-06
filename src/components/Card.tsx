import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-800 bg-gray-900/50 p-4 ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="text-lg font-medium text-gray-100">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  status?: 'ok' | 'warn' | 'fail' | 'neutral';
}

export function StatCard({ label, value, status = 'neutral' }: StatCardProps) {
  const statusColors = {
    ok: 'text-green-400',
    warn: 'text-amber-400',
    fail: 'text-red-400',
    neutral: 'text-gray-100',
  };

  return (
    <Card className="text-center">
      <div className={`text-3xl font-bold ${statusColors[status]}`}>{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </Card>
  );
}
