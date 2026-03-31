'use client';

interface SidebarProps {
  isOpen: boolean;
  children: React.ReactNode;
  side?: 'left' | 'right';
  type?: 'move' | 'shrink';
  maxWidth?: number;
  minWidth?: number;
  className?: string;
}

export function Sidebar({
  isOpen,
  children,
  side = 'left',
  type = 'move',
  maxWidth = 60,
  minWidth = 12,
  className = '',
}: SidebarProps) {
  const maxW = `${maxWidth * 0.25}rem`;
  const minW = `${minWidth * 0.25}rem`;

  const style: React.CSSProperties =
    type === 'shrink'
      ? { width: isOpen ? maxW : minW }
      : {
          width: maxW,
          transform: isOpen
            ? 'translateX(0)'
            : `translateX(${side === 'left' ? '-' + maxW : maxW})`,
        };

  return (
    <div
      id="sidebar"
      className={`h-full flex flex-col fixed top-0 transition-all duration-300 overflow-hidden
        ${side === 'left' ? 'left-0' : 'right-0'}
        ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
