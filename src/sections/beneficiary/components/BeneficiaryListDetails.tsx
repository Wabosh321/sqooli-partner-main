import {
  ChevronRight,
  Layout,
  Book,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Search,
  X,
} from "lucide-react";
import type { Student } from "../types/beneficiary.types";
import { Pagination } from "./Pagination";

interface BeneficiaryListDetailsProps {
  listId: string;
  onBack: () => void;
  students: Student[];
  onStudentClick: (student: Student) => void;
  loading?: boolean;
}

export function BeneficiaryListDetails({
  listId,
  onBack,
  students,
  onStudentClick,
  loading = false,
}: BeneficiaryListDetailsProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<
    "Overview" | "Audit Trail"
  >("Overview");

  const metrics = {
    totalLessons: 12,
    claimed: 10,
    pendingClaim: 2,
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden min-h-[80vh] flex flex-col border border-gray-100">
      {/* Breadcrumb */}
      <div className="px-8 py-4 bg-gray-50 flex items-center space-x-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
        <Layout size={14} className="text-blue-500" />
        <span>Beneficiary Lists</span>
        <ChevronRight size={14} />
        <span>Children of Employees</span>
        {activeSubTab === "Overview" && (
          <>
            <ChevronRight size={14} />
            <span className="text-blue-500">Jane Doe</span>
          </>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Detail Sidebar */}
        <div className="w-80 border-r border-gray-100 p-8 flex flex-col space-y-6">
          <div className="bg-yellow-400 w-full aspect-[4/3] rounded-xl relative overflow-hidden flex flex-col justify-end p-6">
            <h2 className="text-xl font-bold text-white leading-tight">
              Children of Employees
            </h2>
            <div className="absolute top-2 right-2">
              <button className="bg-white/20 p-2 rounded-full text-white backdrop-blur-sm">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-medium">
              Lorem ipsum text describing the campaign could be long.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between">
                <span className="text-xs font-bold text-gray-400">
                  Date Created:
                </span>
                <span className="text-xs font-bold text-gray-900">
                  11 Jan 2025 11.00 AM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-bold text-gray-400">
                  No of Students:
                </span>
                <span className="text-xs font-bold text-gray-900">10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-bold text-gray-400">
                  Created By:
                </span>
                <span className="text-xs font-bold text-gray-900">
                  Jane Doe
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Status:</span>
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto flex space-x-3">
            <button className="flex-1 border border-gray-200 p-2 rounded-lg text-gray-500 flex items-center justify-center hover:bg-gray-50">
              <Edit2 size={18} />
            </button>
            <button className="flex-1 bg-red-500 p-2 rounded-lg text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/10">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Main Details Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 border-b border-gray-100 flex items-center space-x-8">
            <button
              onClick={() => setActiveSubTab("Overview")}
              className={`py-4 text-sm font-bold border-b-2 transition-colors ${
                activeSubTab === "Overview"
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSubTab("Audit Trail")}
              className={`py-4 text-sm font-bold border-b-2 transition-colors ${
                activeSubTab === "Audit Trail"
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Audit Trail
            </button>
          </div>

          <div className="p-8 flex-1 overflow-y-auto bg-blue-50/30">
            {activeSubTab === "Overview" ? (
              <div className="space-y-8">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
                    <div className="bg-orange-50 p-2 rounded-xl text-orange-500">
                      <Layout size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-1">
                        Total Lessons
                      </p>
                      <h4 className="text-2xl font-bold text-gray-900">
                        {metrics.totalLessons}
                      </h4>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
                    <div className="bg-green-50 p-2 rounded-xl text-green-500">
                      <Book size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-1">
                        Claimed
                      </p>
                      <h4 className="text-2xl font-bold text-gray-900">
                        {metrics.claimed}
                      </h4>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start space-x-4">
                    <div className="bg-orange-50 p-2 rounded-xl text-orange-400">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-1">
                        Pending Claim
                      </p>
                      <h4 className="text-2xl font-bold text-gray-900">
                        {metrics.pendingClaim}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Students Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Beneficiaries</h3>
                    <div className="flex space-x-3">
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Enter student name, student ID..."
                          className="pl-9 pr-4 py-2 border border-gray-100 rounded-lg text-sm bg-white outline-none w-64"
                        />
                      </div>
                      <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 hover:bg-blue-600 transition-all">
                        <span>Add Beneficiary</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-50 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                            Date Added
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                            Student ID
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                            Student Name
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                            Curriculum
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                            Lessons Awarded
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                            Lessons Used
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                            Lessons Remaining
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {loading ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              Loading students...
                            </td>
                          </tr>
                        ) : students.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              No students found
                            </td>
                          </tr>
                        ) : (
                          students.map((s) => (
                            <tr
                              key={s.id}
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => onStudentClick(s)}
                            >
                              <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                {s.dateAdded}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                {s.id}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                {s.name}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-600">
                                {s.curriculum}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-600">
                                {s.lessonsAwarded}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-600">
                                {s.lessonsUsed}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-600">
                                {s.lessonsRemaining}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={1}
                    totalPages={10}
                    onPrevious={() => {}}
                    onNext={() => {}}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Audit Logs</h3>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Search"
                      className="pl-9 pr-4 py-2 border border-gray-100 rounded-lg text-sm bg-white outline-none w-64"
                    />
                  </div>
                </div>
                <div className="relative space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                  {[1, 2, 3].map((log) => (
                    <div
                      key={log}
                      className="flex items-start space-x-4 relative"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xs font-bold border-4 border-white z-10">
                        SJ
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-bold text-blue-500 hover:underline cursor-pointer">
                            John Juma
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            Downloaded Report{" "}
                          </span>
                          <span className="text-gray-900 font-semibold">
                            #123456
                          </span>
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wide">
                          22 Jan 2024 at 9:34:12 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={onBack}
        className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close details"
      >
        <X size={32} />
      </button>
    </div>
  );
}

import React from "react";
