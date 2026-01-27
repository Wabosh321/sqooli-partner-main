"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import partnerImage from "../assets/Frame 2085664798.png";
import schoolImage from "../assets/Frame 2085664799.png";
import teacherImage from "../assets/Frame 2085664800.png";

export default function SelectAccount() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, partner } = useAuth();

  const accountTypes = [
    {
      id: "partner",
      label: "Partner",
      image: partnerImage,
    },
    {
      id: "school",
      label: "School",
      image: schoolImage,
    },
    {
      id: "teacher",
      label: "Teacher",
      image: teacherImage,
    },
  ];

  const verifyAccount = (accountId: string) => {
    if (!user) {
      toast.error("No authenticated user found");
      return false;
    }

    // JSON-based account verification
    // Based on partner_type from JSON user
    if (accountId === "partner") {
      return partner ? true : false;
    }

    // School: check if partner type is institutional/corporate
    if (accountId === "school") {
      if (!partner) return false;
      const partnerType = (partner as any)?.partner_type || "";
      return ["institutional", "corporate", "school"].includes(
        partnerType.toLowerCase()
      );
    }

    // Teacher: check if user role is teacher
    if (accountId === "teacher") {
      return (
        user.role === "teacher" || (user as any)?.partner_role === "teacher"
      );
    }

    return false;
  };

  const onContinue = () => {
    if (!selectedAccount) return;

    // JSON-based verification (synchronous)
    const ok = verifyAccount(selectedAccount);
    if (!ok) {
      toast.error("You don't have the selected account type on record.");
      return;
    }

    toast.success("Account verified — redirecting...");
    navigate("/dashboard");
  };

  return (
    <div className="relative w-full min-h-screen bg-white flex items-center justify-center p-8">
      <div
        className="flex flex-col items-center gap-12"
        style={{ width: 638, height: 424, gap: 48 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center w-full">
          <img
            src="/images/sqooli-logo.svg"
            alt="Sqooli logo"
            className="w-48 h-auto"
          />
        </div>

        <div className="text-center">
          <h1 className="text-[#1F2937] text-3xl font-semibold mb-2">
            Select Account
          </h1>
          <p className="text-[#6B7280] text-base">Select an account to login</p>
        </div>

        <div className="flex gap-6 justify-center">
          {accountTypes.map((account) => (
            <button
              key={account.id}
              onClick={() => setSelectedAccount(account.id)}
              className={`relative w-40 h-52 rounded-2xl border transition-all ${
                selectedAccount === account.id
                  ? "bg-[#E8F5EC] border-[#E8F5EC]"
                  : "bg-white border-[#E5E7EB] hover:border-[#3B9FE2]"
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
                <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center relative">
                  {selectedAccount === account.id && (
                    <div className="absolute inset-0 bg-[#34D399] rounded-full flex items-center justify-center z-10">
                      <Check className="w-12 h-12 text-white" strokeWidth={3} />
                    </div>
                  )}
                  <img
                    src={account.image}
                    alt={account.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[#1F2937] text-lg font-medium">
                  {account.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div
          className="w-full flex justify-between items-center"
          style={{ width: "100%" }}
        >
          <button
            className="flex items-center gap-2 text-[#374151] hover:text-[#1F2937] transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
              selectedAccount
                ? "bg-[#3B9FE2] text-white hover:bg-[#2D8FD5]"
                : "bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed"
            }`}
            disabled={!selectedAccount}
            onClick={onContinue}
          >
            <span className="font-medium">Continue</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
