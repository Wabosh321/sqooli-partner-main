interface BeneficiaryTabsProps {
  activeTab: "Active" | "Inactive";
  onTabChange: (tab: "Active" | "Inactive") => void;
}

export function BeneficiaryTabs({
  activeTab,
  onTabChange,
}: BeneficiaryTabsProps) {
  return (
    <div className="px-6 pt-6 flex items-center space-x-6 border-b border-gray-100">
      <button
        onClick={() => onTabChange("Active")}
        className={`pb-4 px-2 text-sm font-bold transition-all relative ${
          activeTab === "Active"
            ? "text-blue-500"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        Active
        {activeTab === "Active" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />
        )}
      </button>
      <button
        onClick={() => onTabChange("Inactive")}
        className={`pb-4 px-2 text-sm font-bold transition-all relative ${
          activeTab === "Inactive"
            ? "text-blue-500"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        Inactive
        {activeTab === "Inactive" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full" />
        )}
      </button>
    </div>
  );
}
