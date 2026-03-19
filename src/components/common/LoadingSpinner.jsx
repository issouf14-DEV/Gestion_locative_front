import { cn } from '@/lib/utils';

export default function LoadingSpinner({ fullPage = false, size = 'md', className }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  const spinner = (
    <div
      className={cn(
        'rounded-full border-navy-800 border-t-transparent animate-spin',
        sizes[size],
        className
      )}
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <p className="text-sm text-navy-800 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return spinner;
}
