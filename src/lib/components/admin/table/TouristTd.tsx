import { Plane } from 'lucide-react';

export function TouristTd({ isTourist }: { isTourist: boolean }) {
  return (
    <td className="flex items-center justify-center">
      {isTourist && <Plane className="inline w-4 h-4 text-zinc-600" />}
    </td>
  );
}
