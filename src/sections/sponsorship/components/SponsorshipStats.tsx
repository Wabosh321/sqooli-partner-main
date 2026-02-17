import { Layout, Book, Clock } from "lucide-react";
import type { SponsorshipMetrics } from "../types/sponsorship.types";

interface SponsorshipStatsProps {
  metrics: SponsorshipMetrics;
  onAwardClick: () => void;
}

export function SponsorshipStats({
  metrics,
  onAwardClick,
}: SponsorshipStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="bg-orange-50 p-2 rounded-lg w-fit mb-3">
          <Layout size={18} className="text-orange-500" />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          Total Slots
        </p>
        <h4 className="text-xl font-black text-gray-900">
          {metrics.totalSlots}
        </h4>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="bg-green-50 p-2 rounded-lg w-fit mb-3">
          <Book size={18} className="text-green-500" />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          Claimed Slots
        </p>
        <h4 className="text-xl font-black text-gray-900">
          {metrics.claimedSlots}
        </h4>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="bg-green-50 p-2 rounded-lg w-fit mb-3">
          <Clock size={18} className="text-green-500" />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          Pending Claim
        </p>
        <h4 className="text-xl font-black text-gray-900">
          {metrics.pendingClaim}
        </h4>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative">
        <div className="bg-green-50 p-2 rounded-lg w-fit mb-3">
          <Book size={18} className="text-green-500" />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          Available Slots
        </p>
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-black text-gray-900">
            {metrics.availableSlots}
          </h4>
          <button
            onClick={onAwardClick}
            className="text-[10px] font-black text-gray-800 border-2 border-gray-100 px-3 py-1 rounded-lg hover:bg-gray-50 transition-all"
          >
            Award Slots
          </button>
        </div>
      </div>
    </div>
  );
}
