import { Search } from "lucide-react";

interface BeneficiarySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function BeneficiarySearch({
  value,
  onChange,
  placeholder = "Search",
}: BeneficiarySearchProps) {
  return (
    <div className="relative mb-6">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        size={18}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-blue-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
      />
    </div>
  );
}
