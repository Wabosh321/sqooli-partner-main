import { Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Title } from "../../../components/ui/Typography";

interface BeneficiaryHeaderProps {
  onNewListClick: () => void;
}

export function BeneficiaryHeader({ onNewListClick }: BeneficiaryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <Title>Beneficiaries</Title>
        <p className="text-sm text-gray-500 mt-1">
          Manage your list of beneficiaries
        </p>
      </div>
      <Button
        onClick={onNewListClick}
        className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2 shadow-lg shadow-blue-500/10"
      >
        <Plus size={20} strokeWidth={3} />
        <span>New Beneficiary List</span>
      </Button>
    </div>
  );
}
