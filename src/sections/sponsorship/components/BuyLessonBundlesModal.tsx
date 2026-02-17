import { X, CreditCard, CheckCircle, Plus, Search } from "lucide-react";
import type {
  ModalStep,
  BundleTier,
  Student,
} from "../types/sponsorship.types";

interface BuyLessonBundlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalStep: ModalStep;
  selectedTier: BundleTier;
  onTierChange: (tier: BundleTier) => void;
  selectedAmount: string;
  onAmountChange: (amount: string) => void;
  customAmount: string;
  onCustomAmountChange: (amount: string) => void;
  onProceed: () => void;
  onAward: () => void;
  students: Student[];
  selectedStudents: string[];
  onStudentToggle: (studentId: string) => void;
  loading?: boolean;
}

const BUNDLE_TIERS = [
  { id: 1, label: "Tier 1", desc: "From KES 250,000 to KES 999,999.99" },
  { id: 2, label: "Tier 2", desc: "From KES 1M to KES 5M" },
  { id: 3, label: "Tier 3", desc: "Over KES 5M" },
];

const TIER_AMOUNTS: Record<BundleTier, string[]> = {
  1: ["KES 250,000.00", "KES 500,000.00", "KES 750,000.00", "KES 999,999.99"],
  2: ["KES 1,000,000.00", "KES 2,500,000.00", "KES 5,000,000.00"],
  3: ["KES 5,100,000.00", "KES 10,000,000.00", "KES 50,000,000.00"],
};

const ArrowDown = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export function BuyLessonBundlesModal({
  isOpen,
  onClose,
  modalStep,
  selectedTier,
  onTierChange,
  selectedAmount,
  onAmountChange,
  customAmount,
  onCustomAmountChange,
  onProceed,
  onAward,
  students,
  selectedStudents,
  onStudentToggle,
  loading = false,
}: BuyLessonBundlesModalProps) {
  if (!isOpen) return null;

  const modalWidth =
    modalStep === "award"
      ? "max-w-7xl h-full"
      : ["pin", "success", "failed", "payment"].includes(modalStep)
        ? "max-w-lg"
        : "max-w-5xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-8">
      <div
        className={`bg-white rounded-[32px] w-full shadow-2xl overflow-hidden flex flex-col relative ${modalWidth}`}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-20"
          aria-label="Close modal"
        >
          <X size={28} />
        </button>

        {/* Step Indicators */}
        {["package", "payment"].includes(modalStep) && (
          <div className="px-10 pt-10">
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              Buy Lesson Bundles
            </h3>
            <p className="text-sm font-medium text-gray-400 mb-6">
              Each bundle contains structured lessons, assignments, and
              assessments
            </p>
            <div className="flex items-center border-b border-gray-100">
              <button
                className={`pb-4 px-2 text-sm font-black relative ${
                  modalStep === "package" ? "text-blue-500" : "text-gray-400"
                }`}
              >
                Select Package
                {modalStep === "package" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-500 rounded-t-full" />
                )}
              </button>
              <button
                className={`pb-4 px-10 text-sm font-black relative ${
                  modalStep === "payment" ? "text-blue-500" : "text-gray-400"
                }`}
              >
                Make Payment
                {modalStep === "payment" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-500 rounded-t-full" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-10">
          {/* STEP: Select Package */}
          {modalStep === "package" && (
            <div className="flex flex-col items-center">
              <h4 className="text-xl font-black text-gray-900 mb-10 text-center">
                Select Lesson Bundle Package
              </h4>
              <div className="flex w-full max-w-4xl gap-10">
                {/* Tier Sidebar */}
                <div className="w-64 space-y-4">
                  {BUNDLE_TIERS.map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => onTierChange(tier.id as BundleTier)}
                      className={`w-full p-4 text-left rounded-xl transition-all border-2 ${
                        selectedTier === tier.id
                          ? "bg-gray-50 border-blue-500"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <p
                        className={`font-black text-sm ${
                          selectedTier === tier.id
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {tier.label}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                        {tier.desc}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Amount Selection */}
                <div className="flex-1 bg-gray-50/50 p-8 rounded-2xl border border-gray-100">
                  <h5 className="font-black text-gray-900 mb-1">
                    Tier {selectedTier}
                  </h5>
                  <p className="text-xs font-bold text-gray-400 mb-6">
                    Select a bundle to proceed
                  </p>

                  <div className="space-y-4 mb-10">
                    <p className="text-xs font-black text-gray-600 uppercase tracking-widest">
                      Bundles
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {TIER_AMOUNTS[selectedTier].map((amt) => (
                        <label
                          key={amt}
                          className="flex items-center space-x-3 cursor-pointer group"
                        >
                          <div className="relative">
                            <input
                              type="radio"
                              name="bundle"
                              className="peer hidden"
                              checked={selectedAmount === amt}
                              onChange={() => {
                                onAmountChange(amt);
                                onCustomAmountChange("");
                              }}
                            />
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 flex items-center justify-center transition-all">
                              <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
                            </div>
                          </div>
                          <span
                            className={`text-sm font-black transition-colors ${
                              selectedAmount === amt
                                ? "text-gray-900"
                                : "text-gray-400 group-hover:text-gray-600"
                            }`}
                          >
                            {amt}
                          </span>
                        </label>
                      ))}
                    </div>

                    <label className="flex items-center space-x-3 cursor-pointer mt-6">
                      <input
                        type="radio"
                        name="bundle"
                        className="peer hidden"
                        checked={selectedAmount === "custom"}
                        onChange={() => onAmountChange("custom")}
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
                      </div>
                      <span className="text-sm font-black text-gray-900">
                        Custom Amount
                      </span>
                    </label>

                    {selectedAmount === "custom" && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          Amount
                        </p>
                        <input
                          type="text"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="KES"
                          value={customAmount}
                          onChange={(e) => onCustomAmountChange(e.target.value)}
                        />
                        <p className="text-[10px] font-bold text-gray-400 italic">
                          Amount must be between KES 250,000 and KES 1M
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={onProceed}
                      className="bg-blue-500 text-white px-8 py-2.5 rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP: Make Payment */}
          {modalStep === "payment" && (
            <div className="space-y-8">
              <h4 className="text-2xl font-black text-gray-900 text-center mb-10">
                Make Payment
              </h4>
              <div className="bg-blue-50 p-8 rounded-2xl flex flex-col items-center border border-blue-100">
                <div className="flex space-x-1 mb-4">
                  {["s", "q", "o", "o", "li"].map((c) => (
                    <div
                      key={c}
                      className="w-7 h-7 flex items-center justify-center rounded-[3px] text-white font-bold text-lg bg-blue-500"
                    >
                      {c}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Amount to Pay
                </p>
                <h2 className="text-3xl font-black text-gray-900 mb-1">
                  KES 173,800.00
                </h2>
                <p className="text-xs font-bold text-gray-500">
                  Avg 200 lessons
                </p>

                <button
                  onClick={onProceed}
                  className="mt-8 bg-blue-500 text-white w-full py-3.5 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
                >
                  Make Payment
                </button>
              </div>
            </div>
          )}

          {/* STEP: PIN Entry */}
          {modalStep === "pin" && (
            <div className="flex flex-col items-center py-10">
              <h4 className="text-2xl font-black text-gray-900 mb-10">
                Make Payment
              </h4>
              <div className="bg-blue-50 p-6 rounded-2xl mb-8">
                <CreditCard size={48} className="text-blue-500" />
              </div>
              <p className="text-sm font-black text-gray-500 mb-8">
                Enter your PIN to proceed
              </p>
              <div className="flex space-x-4 mb-10">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border-2 border-blue-500 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-xl bg-gray-50 border-2 border-gray-100"
                  />
                ))}
              </div>
            </div>
          )}

          {/* STEP: Success */}
          {modalStep === "success" && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center mb-8 relative">
                <CheckCircle size={48} className="text-green-500" />
                <div className="absolute -top-4 -right-4 text-green-500/40">
                  <Plus size={32} />
                </div>
                <div className="absolute -bottom-2 -left-6 text-green-500/40">
                  <Plus size={24} />
                </div>
              </div>
              <h4 className="text-2xl font-black text-gray-900 mb-4">
                Payment Initiated Successfully
              </h4>
              <p className="text-sm font-bold text-gray-400 mb-10 leading-relaxed max-w-xs mx-auto">
                You have successfully purchased lesson bundles worth <br />
                <span className="text-gray-900 font-black">KES 100,000.00</span>
              </p>
              <button
                onClick={onAward}
                className="bg-blue-500 text-white px-10 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
              >
                Award Beneficiaries
              </button>
            </div>
          )}

          {/* STEP: Award Beneficiaries */}
          {modalStep === "award" && (
            <div className="h-full flex flex-col space-y-8">
              <div className="flex flex-col space-y-4">
                <h4 className="text-3xl font-black text-gray-900">
                  Award Beneficiaries
                </h4>
                <p className="text-sm font-bold text-gray-400">
                  Select students to award
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-black text-gray-900">
                    {selectedStudents.length} Selected
                  </span>
                  <button
                    className={`px-8 py-2.5 rounded-xl font-black transition-all ${
                      selectedStudents.length > 0
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={selectedStudents.length === 0}
                  >
                    Award Selected
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-50">
                  <div className="relative w-full">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full pl-12 pr-6 py-3 bg-gray-50/50 rounded-2xl outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-8 py-5">
                          <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                            <ArrowDown size={14} />
                          </div>
                        </th>
                        {[
                          "Student ID",
                          "Student Name",
                          "Gender",
                          "DoB",
                          "Email",
                          "Phone",
                          "Kin",
                          "Relationship",
                          "Kin Email",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {students.map((s, idx) => {
                        const isSelected = selectedStudents.includes(
                          s.id + idx,
                        );
                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-gray-50 transition-colors ${
                              isSelected ? "bg-blue-50/30" : ""
                            }`}
                          >
                            <td className="px-8 py-5">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded-lg accent-blue-500"
                                checked={isSelected}
                                onChange={(e) => {
                                  onStudentToggle(s.id + idx);
                                }}
                              />
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                              {s.id}
                            </td>
                            <td className="px-8 py-5 text-sm font-black text-gray-900">
                              {s.name}
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                              {s.gender}
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                              {s.dob}
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                              {s.email}
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                              {s.phone}
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                              {s.kin}
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                              {s.relationship}
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-gray-600">
                              {s.kinEmail}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-8 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-black text-gray-400">
                    Page <span className="text-gray-900 font-black">1</span> of
                    10
                  </p>
                  <div className="flex space-x-3">
                    <button className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-500 hover:bg-gray-50">
                      Previous
                    </button>
                    <button className="px-6 py-2 bg-blue-500/10 text-blue-500 border border-transparent rounded-xl text-xs font-black hover:bg-blue-500/20">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
