import { Mars, Venus } from 'lucide-react';

export function GenderTd({ gender }: { gender: string }) {
  if (gender === 'M') return <td className="flex items-center justify-center"><Mars className="inline w-4 h-4 text-blue-600" /></td>;
  if (gender === 'F') return <td className="flex items-center justify-center"><Venus className="inline w-4 h-4 text-pink-600" /></td>;
  return <td className="flex items-center justify-center"><span className="text-gray-400">?</span></td>;
}
