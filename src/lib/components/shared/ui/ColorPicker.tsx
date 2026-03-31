'use client';

import { useState } from 'react';
import { colors } from '@/lib/const/appearance';

interface ColorPickerProps {
  selectedColor?: string;
  onColorSelect?: (color: { hex: string }) => void;
}

export function ColorPicker({
  selectedColor = colors[0].hex,
  onColorSelect = () => {},
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label="colorpicker"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="size-8 rounded-lg cursor-pointer"
        style={{ backgroundColor: selectedColor }}
      />

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow z-50 border border-zinc-500/25">
          <div className="grid grid-cols-6 gap-2 w-60">
            {colors.map((color, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onColorSelect({ hex: color.hex }); setIsOpen(false); }}
                title={color.name}
                className="group relative size-8 rounded-lg cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color.hex }}
              >
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 dark:bg-zinc-800 text-zinc-50 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow shadow-zinc-950">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
