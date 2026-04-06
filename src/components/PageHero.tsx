import { sectionIcons, type SectionIconKey } from '../lib/section-icons';

interface PageHeroProps {
  title: string;
  subtitle: string;
  iconKey: SectionIconKey;
  iconClassName: string;
  accentClassName: string;
}

export function PageHero({
  title,
  subtitle,
  iconKey,
  iconClassName,
  accentClassName,
}: PageHeroProps) {
  const icon = sectionIcons[iconKey];

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/70 p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.85)] ${accentClassName}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)]" />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/5 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 p-2 shadow-lg backdrop-blur ${iconClassName}`}>
          <img
            src={icon.hero}
            alt={icon.alt}
            className="h-full w-full object-contain drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-100">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
