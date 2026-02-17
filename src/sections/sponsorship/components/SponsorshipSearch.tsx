import { Search } from "lucide-react";

interface SponsorshipSearchProps {
  value: string;
  onChange: (value: string) => void;
  onBuyClick: () => void;
}

export function SponsorshipSearch({
  value,
  onChange,
  onBuyClick,
}: SponsorshipSearchProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
      <div className="relative flex-1 max-w-2xl">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-50"
        />
      </div>
      <button
        onClick={onBuyClick}
        className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
      >
        Buy Lesson Bundles
      </button>
    </div>
  );
}
