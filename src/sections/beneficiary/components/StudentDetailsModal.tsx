import {
  X,
  Edit2,
  Trash2,
  Layout,
  Book,
  Clock,
  Search,
  Upload,
  Download,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import type { Student, StudentBundle } from "../types/beneficiary.types";

interface StudentDetailsModalProps {
  student: Student | null;
  onClose: () => void;
}

export function StudentDetailsModal({
  student,
  onClose,
}: StudentDetailsModalProps) {
  if (!student) return null;

  const mockBundles: StudentBundle[] = [
    {
      id: "1",
      dateAwarded: "12 Jan 2025 11.00 PM",
      referenceNo: "#12345",
      lessonsAwarded: 48,
      lessonsUsed: 26,
      lessonsRemaining: 22,
      status: "Pending",
      expiryDays: 2,
    },
    {
      id: "2",
      dateAwarded: "12 Jan 2025 11.00 PM",
      referenceNo: "#12346",
      lessonsAwarded: 48,
      lessonsUsed: 26,
      lessonsRemaining: 22,
      status: "Claimed",
      expiryDays: "----",
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-12">
      <div className="bg-white rounded-[32px] w-full max-w-7xl h-full shadow-2xl overflow-hidden flex flex-col relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X size={32} />
        </button>

        <div className="flex-1 flex overflow-hidden">
          {/* Profile Sidebar */}
          <div className="w-[320px] border-r border-gray-100 p-10 flex flex-col space-y-8 bg-gray-50/50">
            <div className="bg-blue-200 w-full aspect-square rounded-2xl overflow-hidden shadow-sm">
              <img
                src="https://picsum.photos/seed/jane/320/320"
                alt={student.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h3 className="text-2xl font-black text-gray-900 leading-tight">
                {student.name}
              </h3>
              <p className="text-sm font-bold text-gray-500 mt-1">
                #{student.id}
              </p>
              <div className="mt-3 bg-yellow-400 text-white px-3 py-1 rounded-full text-[10px] font-black w-fit uppercase tracking-wider shadow-sm">
                {student.curriculum}
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Date Added:
                </span>
                <span className="text-xs font-black text-gray-900">
                  {student.dateAdded}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Status:
                </span>
                <span className="bg-green-500 text-white px-3 py-0.5 rounded-full text-[10px] font-black shadow-sm">
                  {student.status}
                </span>
              </div>
            </div>

            <div className="mt-auto flex space-x-4">
              <button className="flex-1 border-2 border-gray-100 p-2.5 rounded-xl text-gray-500 flex items-center justify-center hover:bg-white transition-all">
                <Edit2 size={20} />
              </button>
              <button className="flex-1 bg-red-500 p-2.5 rounded-xl text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg shadow-red-500/10">
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="p-10 flex-1 overflow-y-auto bg-blue-50/30">
              <div className="grid grid-cols-3 gap-8 mb-12">
                <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm flex items-start space-x-5">
                  <div className="bg-orange-50 p-3 rounded-2xl text-orange-500">
                    <Layout size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Total Lessons
                    </p>
                    <h4 className="text-3xl font-black text-gray-900">
                      {student.lessonsAwarded}
                    </h4>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm flex items-start space-x-5">
                  <div className="bg-green-50 p-3 rounded-2xl text-green-500">
                    <Book size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Claimed
                    </p>
                    <h4 className="text-3xl font-black text-gray-900">
                      {student.lessonsUsed}
                    </h4>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm flex items-start space-x-5">
                  <div className="bg-orange-50 p-3 rounded-2xl text-orange-400">
                    <Clock size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Remaining
                    </p>
                    <h4 className="text-3xl font-black text-gray-900">
                      {student.lessonsRemaining}
                    </h4>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-900">
                    Lesson Bundles
                  </h3>
                  <div className="flex space-x-4">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        placeholder="Search Reference Number"
                        className="pl-10 pr-4 py-2.5 border border-gray-100 rounded-xl text-sm w-80 outline-none focus:ring-2 focus:ring-blue-50 transition-all"
                      />
                    </div>
                    <button className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black flex items-center space-x-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all">
                      <span>Buy Lesson Bundle</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Date Awarded
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Reference No
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Lessons Awarded
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Lessons Used
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Lessons Remain
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Expiry (days)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {mockBundles.map((bundle) => (
                        <tr
                          key={bundle.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-8 py-5 text-sm font-bold text-gray-600">
                            {bundle.dateAwarded}
                          </td>
                          <td className="px-8 py-5 text-sm font-black text-gray-900">
                            {bundle.referenceNo}
                          </td>
                          <td className="px-8 py-5 text-sm font-black text-gray-900">
                            {bundle.lessonsAwarded}
                          </td>
                          <td className="px-8 py-5 text-sm font-black text-gray-900">
                            {bundle.lessonsUsed}
                          </td>
                          <td className="px-8 py-5 text-sm font-black text-gray-900">
                            {bundle.lessonsRemaining}
                          </td>
                          <td className="px-8 py-5">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                bundle.status === "Pending"
                                  ? "bg-orange-50 text-orange-500"
                                  : "bg-green-50 text-green-500"
                              }`}
                            >
                              {bundle.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm font-bold text-gray-400">
                            {bundle.expiryDays}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button className="px-5 py-2 border-2 border-gray-100 rounded-xl text-sm font-black text-gray-500 hover:bg-white transition-all flex items-center space-x-2">
                      <ArrowLeft size={16} />
                      <span>Previous</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, "...", 8, 9, 10].map((n, i) => (
                      <button
                        key={i}
                        className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                          n === 1
                            ? "bg-blue-50 text-blue-500"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-4">
                    <button className="px-5 py-2 border-2 border-gray-100 rounded-xl text-sm font-black text-gray-500 hover:bg-white transition-all flex items-center space-x-2">
                      <span>Next</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
