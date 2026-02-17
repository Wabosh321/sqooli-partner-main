"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export default function SelectAccount() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, partner } = useAuth();

  const accountTypes = [
    {
      id: "partner",
      label: "Partner",
      image: "/images/frame-2085664798.png",
    },
    {
      id: "school",
      label: "School",
      image: "/images/frame-2085664799.png",
    },
    {
      id: "teacher",
      label: "Teacher",
      image: "/images/frame-2085664800.png",
    },
  ];

  const verifyAccount = async (accountId: string): Promise<boolean> => {
    if (!user) {
      console.error("SelectAccount: No authenticated user found");
      toast.error("No authenticated user found");
      return false;
    }

    try {
      // Ensure we pass the Supabase auth user id (session user id) to the RPC
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const authId = session?.user?.id;
      if (!authId) {
        console.error("SelectAccount: No auth session found for user");
        toast.error("No authenticated session found");
        return false;
      }

      console.debug("SelectAccount: Verifying account type", {
        auth_id: authId,
        account_type: accountId,
      });

      // PHASE 2: Use verify_account_type RPC instead of inline queries
      const { data: result, error: rpcError } = await supabase.rpc(
        "verify_account_type",
        {
          p_auth_id: authId,
          p_account_type: accountId,
        },
      );

      if (rpcError) {
        console.error("SelectAccount: RPC error", {
          error_code: rpcError.code,
          error_message: rpcError.message,
          account_type: accountId,
        });
        return false;
      }

      if (!result || !Array.isArray(result) || result.length === 0) {
        console.warn("SelectAccount: No result from RPC", { accountId });
        return false;
      }

      const firstResult = result[0] as {
        account_exists: boolean;
        account_id: string;
      };
      const accountExists = firstResult.account_exists === true;

      console.debug("SelectAccount: Verification result", {
        account_type: accountId,
        exists: accountExists,
        account_id: firstResult.account_id,
      });

      return accountExists;
    } catch (err) {
      console.error("SelectAccount: Verification error", {
        error: err instanceof Error ? err.message : String(err),
        account_type: accountId,
      });
      return false;
    }
  };

  const onContinue = async () => {
    if (!selectedAccount) {
      toast.error("Please select an account type");
      return;
    }

    const verificationPromise = (async () => {
      const ok = await verifyAccount(selectedAccount);
      if (!ok) {
        throw new Error(
          `No ${selectedAccount} account found. Please create one first.`,
        );
      }
      return true;
    })();

    toast.promise(verificationPromise, {
      loading: "Verifying account...",
      success: "Account verified — redirecting to dashboard...",
      error: (e) => String(e),
    });

    try {
      await verificationPromise;
      console.debug("SelectAccount: Navigation to dashboard", {
        account_type: selectedAccount,
      });
      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("SelectAccount: Navigation error", { error: errorMsg });
      toast.error(errorMsg);
    }
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
                <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center relative bg-gray-100">
                  {selectedAccount === account.id && (
                    <div className="absolute inset-0 bg-[#34D399] rounded-full flex items-center justify-center z-10">
                      <Check className="w-12 h-12 text-white" strokeWidth={3} />
                    </div>
                  )}
                  <img
                    src={account.image}
                    alt={account.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.warn(`Failed to load image for ${account.label}`);
                      (e.currentTarget as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3C/svg%3E";
                    }}
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
