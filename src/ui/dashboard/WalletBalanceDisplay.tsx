import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function WalletBalanceDisplay({ wallet }: { wallet: any }) {
  const [hidden, setHidden] = useState(false);

  const formatted = wallet
    ? Number(wallet.balance || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  return (
    <div
      className="relative overflow-hidden w-[297px] max-w-full"
      style={{
        height: "127px",
        borderRadius: "12px",
        background:
          "linear-gradient(282.42deg, #5FA3E2 27.79%, #5E7AE0 98.98%)",
        boxShadow: "6px 4px 2px -10px rgba(180, 209, 192, 0.12)",
        backdropFilter: "blur(30px)",
      }}
    >
      {/* Decorative Circle 1 - Large */}
      <div
        className="absolute rounded-full"
        style={{
          width: "100px",
          height: "100px",
          top: "49px",
          left: "243px",
          background: "rgba(255, 255, 255, 0.3)",
        }}
      />

      {/* Decorative Circle 2 - Small */}
      <div
        className="absolute rounded-full"
        style={{
          width: "66px",
          height: "66px",
          top: "90px",
          left: "210px",
          background: "rgba(255, 255, 255, 0.3)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-4 flex flex-col h-full">
        <div
          className="absolute"
          style={{
            top: "66.5px",
            left: "233px",
          }}
        >
          {hidden ? (
            <EyeOff className="w-5 h-5 text-white" strokeWidth={1.67} />
          ) : (
            <Eye className="w-5 h-5 text-white" strokeWidth={1.67} />
          )}
        </div>

        <div>
          <div className="text-white/80 text-sm mb-1">Wallet Balance</div>
          <div className="text-white text-2xl font-bold">
            <span
              style={{
                display: "inline-block",
                filter: hidden ? "blur(6px)" : "none",
                WebkitFilter: hidden ? "blur(6px)" : "none",
                transition: "filter 160ms ease-in-out",
              }}
              aria-hidden={hidden}
            >
              KES {formatted}
            </span>
          </div>
        </div>

        {/* Toggle button kept for accessibility and interactivity */}
        <div className="mt-auto">
          <button
            type="button"
            aria-pressed={hidden}
            aria-label={hidden ? "Show balance" : "Hide balance"}
            onClick={() => setHidden(!hidden)}
            className="mt-2 p-1 rounded hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            style={{
              background: "transparent",
              border: "none",
            }}
          >
            {/* visually hidden since we show the absolute icon as well */}
            {hidden ? (
              <span className="sr-only">Show balance</span>
            ) : (
              <span className="sr-only">Hide balance</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
