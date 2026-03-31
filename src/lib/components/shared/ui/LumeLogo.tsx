import { Lightbulb } from 'lucide-react';

interface LumeLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { icon: 16, text: 'text-lg' },
  md: { icon: 20, text: 'text-xl' },
  lg: { icon: 28, text: 'text-3xl' },
};

export function LumeLogo({ size = 'md' }: LumeLogoProps) {
  const { icon, text } = sizeMap[size];

  return (
    <span className={`inline-flex items-center gap-1.5 ${text} font-semibold tracking-tight`}>
      <Lightbulb size={icon} className="text-indigo-500" strokeWidth={2.25} />
      Lume<span className="text-indigo-500">.</span>
    </span>
  );
}
