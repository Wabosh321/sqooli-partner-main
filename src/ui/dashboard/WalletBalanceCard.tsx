import React from "react";
import { CreditCard } from "lucide-react";
import WalletBalanceDisplay from "./WalletBalanceDisplay";

export default function WalletBalanceCard({ wallet }: { wallet: any }) {
  return (
    <div 
      className="h-32 bg-[#E1EEFA] rounded-2xl flex items-stretch gap-0 w-full"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
      }}
    >
      {/* Left side - Wallet Balance Card */}
      <WalletBalanceDisplay wallet={wallet} />

      {/* Right side - Payment Method */}
      <div className="flex-1 px-8 flex flex-col justify-center">
        <div className="text-gray-700 text-sm font-medium mb-3">Saved Method:</div>

        <div className="flex items-center gap-3 mb-4">
          <img
            src="/images/icons/mpesa.png"
            alt="M-Pesa"
            className="rounded"
            style={{
              width: '28px',
              height: '20px',
              border: '1px solid #EAECF0',
              borderRadius: '2.67px',
              opacity: 1,
              boxShadow: '0px 0.56px 1.11px -0.56px #1018280F, 0px 1.11px 2.22px -0.56px #1018281A',
            }}
          />
          <div>
            <div className="text-gray-900 text-sm">Paybill: {wallet?.paybill_number ? wallet.paybill_number.slice(0, 1) + '*****' + wallet.paybill_number.slice(-1) : '2*****7'}</div>
            <div className="text-gray-600 text-xs">Account No: {wallet?.account_number ? wallet.account_number.slice(0, 1) + '**********' + wallet.account_number.slice(-4) : '0**********5463'}</div>
          </div>
        </div>

        <button className="w-32 h-10 rounded-full bg-[#3B9DD9] hover:bg-[#3089C5] text-white text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-colors">
          <CreditCard className="w-4 h-4" strokeWidth={2} />
          Withdraw
        </button>
      </div>
    </div>
  );
}
