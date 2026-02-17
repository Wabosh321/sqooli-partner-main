import type { SponsorshipEntry } from "../types/sponsorship.types";

interface SponsorshipTableProps {
  sponsorships: SponsorshipEntry[];
  loading?: boolean;
}

export function SponsorshipTable({
  sponsorships,
  loading = false,
}: SponsorshipTableProps) {
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading sponsorships...
      </div>
    );
  }

  if (sponsorships.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">No sponsorships found</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-50">
            <th className="pb-4 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">
              Reference No.
            </th>
            <th className="pb-4 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">
              Name
            </th>
            <th className="pb-4 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">
              Beneficiaries
            </th>
            <th className="pb-4 px-4 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sponsorships.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-gray-50 transition-colors group"
            >
              <td className="py-5 px-4 text-sm font-bold text-gray-600">
                {item.referenceNo}
              </td>
              <td className="py-5 px-4 text-sm font-black text-gray-900">
                {item.name}
              </td>
              <td className="py-5 px-4 text-sm font-bold text-gray-600">
                {item.beneficiariesCount}
              </td>
              <td className="py-5 px-4 text-right">
                <button className="text-blue-500 text-sm font-black hover:underline">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
