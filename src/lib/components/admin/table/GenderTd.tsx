export function GenderTd({ gender }: { gender: string }) {
  if (gender === 'M') return <td className="flex items-center justify-center"><span className="text-sm font-semibold text-blue-600">M</span></td>;
  if (gender === 'F') return <td className="flex items-center justify-center"><span className="text-sm font-semibold text-pink-600">F</span></td>;
  return <td className="flex items-center justify-center"><span className="text-gray-400">?</span></td>;
}
