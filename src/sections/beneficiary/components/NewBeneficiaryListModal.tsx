import { Search, Upload, Layout } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { BeneficiaryModal } from "./BeneficiaryModal";

interface NewBeneficiaryListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateList: (data: { name: string; description: string }) => Promise<void>;
  loading?: boolean;
}

export function NewBeneficiaryListModal({
  isOpen,
  onClose,
  onCreateList,
  loading = false,
}: NewBeneficiaryListModalProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    await onCreateList({ name, description });
    e.currentTarget.reset();
  };

  return (
    <BeneficiaryModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Beneficiary List"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-gray-500 font-medium">
          Search and select students to add to list
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Beneficiary List Name
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="Enter list name"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Enter a description..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Search Students
            </label>
            <div className="flex space-x-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Enter student name, student ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none"
                />
              </div>
              <button
                type="button"
                className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <Upload size={18} className="text-blue-500" />
                <span>or Upload List</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50 rounded-lg">
            <div className="w-32 h-32 mb-4 text-blue-100">
              <Layout className="w-full h-full" />
            </div>
            <p className="text-gray-400 text-sm font-medium">
              Search and select student to be added to list
            </p>
          </div>

          <div className="pt-4 border-t border-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg font-bold border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white hover:bg-blue-600 px-8 py-2.5 rounded-lg font-bold"
            >
              {loading ? "Creating..." : "Create Beneficiary List"}
            </Button>
          </div>
        </div>
      </form>
    </BeneficiaryModal>
  );
}
