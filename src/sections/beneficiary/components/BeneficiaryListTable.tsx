import type { BeneficiaryListEntry } from "../types/beneficiary.types";

interface BeneficiaryListTableProps {
  lists: BeneficiaryListEntry[];
  onView: (id: string) => void;
  loading?: boolean;
}

export function BeneficiaryListTable({
  lists,
  onView,
  loading = false,
}: BeneficiaryListTableProps) {
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading lists...</div>
    );
  }

  if (lists.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No beneficiary lists found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-50">
            <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Date Created
            </th>
            <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Beneficiaries
            </th>
            <th className="pb-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {lists.map((list) => (
            <tr
              key={list.id}
              className="group hover:bg-blue-50 transition-colors"
            >
              <td className="py-4 text-sm font-medium text-gray-600">
                {list.dateCreated}
              </td>
              <td className="py-4 text-sm font-bold text-gray-900">
                {list.name}
              </td>
              <td className="py-4 text-sm font-medium text-gray-600">
                {list.beneficiariesCount}
              </td>
              <td className="py-4 text-right">
                <button
                  onClick={() => onView(list.id)}
                  className="text-blue-500 text-sm font-bold hover:underline transition-colors"
                >
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
