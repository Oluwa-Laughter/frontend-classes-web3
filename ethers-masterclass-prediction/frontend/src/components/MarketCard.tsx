import React, { useState } from "react";
import { Loader2, Trophy, TrendingUp, Clock } from "lucide-react";
import { MarketOutcome, PredictionMarketData } from "../types/prediction";

interface MarketCardProps {
  market: PredictionMarketData;
  isConnected: boolean;
  onPlaceBet: (
    marketId: number,
    isYes: boolean,
    amountEth: string,
  ) => Promise<void>;
  onClaim: (marketId: number) => Promise<void>;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  isConnected,
  onPlaceBet,
  onClaim,
}) => {
  const [betAmount, setBetAmount] = useState<string>("0.05");

  const [bettingOption, setBettingOption] = useState<"YES" | "NO" | null>(null);

  const [isClaiming, setIsClaiming] = useState(false);

  const totalPoolNumber =
    parseFloat(market.totalYesPool || "0") +
    parseFloat(market.totalNoPool || "0");

  const yesPercentage =
    totalPoolNumber > 0
      ? Math.round(
          (parseFloat(market.totalYesPool || "0") / totalPoolNumber) * 100,
        )
      : 50;

  const noPercentage = 100 - yesPercentage;

  const isMarketClosed = market.isExpired || market.resolved;

  const isBettingDisabled =
    !isConnected ||
    isMarketClosed ||
    !betAmount ||
    parseFloat(betAmount) <= 0 ||
    bettingOption !== null;

  const handleBet = async (isYes: boolean) => {
    if (isBettingDisabled) return;

    setBettingOption(isYes ? "YES" : "NO");

    try {
      await onPlaceBet(market.id, isYes, betAmount);
    } finally {
      setBettingOption(null);
    }
  };

  const handleClaim = async () => {
    setIsClaiming(true);

    try {
      await onClaim(market.id);
    } finally {
      setIsClaiming(false);
    }
  };

  const getMarketStatus = () => {
    if (market.resolved) {
      return {
        label: "Resolved",
        dot: "bg-slate-400",
      };
    }

    if (market.isExpired) {
      return {
        label: "Expired",
        dot: "bg-amber-500",
      };
    }

    return {
      label: "Bets Active",
      dot: "bg-emerald-500 animate-pulse",
    };
  };

  const status = getMarketStatus();

  const getOutcomeLabel = () => {
    switch (market.outcome) {
      case MarketOutcome.YES:
        return "YES";
      case MarketOutcome.NO:
        return "NO";
      case MarketOutcome.CANCELED:
        return "CANCELED";
      default:
        return "PENDING";
    }
  };

  return (
    <div className="surface-card surface-card-hover rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 opacity-80 group-hover:opacity-100 transition-opacity" />

      <div>
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-semibold text-slate-700 bg-slate-100/90 border border-slate-200/80 px-3 py-1 rounded-lg">
            {market.category}
          </span>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />

            <span>{status.label}</span>
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-4 line-clamp-2 leading-snug tracking-tight">
          {market.title}
        </h3>

        {market.isExpired && !market.resolved && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock className="w-4 h-4 text-amber-600" />

            <div>
              <p className="text-xs font-semibold text-amber-900">
                Betting Closed
              </p>

              <p className="text-[11px] text-amber-700">
                This market has expired and is waiting for resolution.
              </p>
            </div>
          </div>
        )}

        {market.resolved && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-[11px] text-slate-500">Final Outcome</span>

            <p className="text-sm font-bold text-slate-900">
              {getOutcomeLabel()}
            </p>
          </div>
        )}

        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 mb-5 space-y-2.5 shadow-inner">
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              YES {yesPercentage}%
            </span>

            <span className="text-rose-600">NO {noPercentage}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden flex p-0.5 border border-slate-300/50">
            <div
              style={{
                width: `${yesPercentage}%`,
              }}
              className="bg-emerald-500 rounded-l-full transition-all duration-500 shadow-sm"
            />

            <div
              style={{
                width: `${noPercentage}%`,
              }}
              className="bg-rose-500 rounded-r-full transition-all duration-500 shadow-sm"
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-0.5">
            <span>Pool: {market.totalYesPool} ETH</span>

            <span>Pool: {market.totalNoPool} ETH</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3.5 mb-5 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">My Open Position:</span>

          <span className="font-semibold text-slate-900 font-mono">
            {parseFloat(market.userYesBet || "0") > 0 &&
              `YES (${market.userYesBet} ETH)`}

            {parseFloat(market.userNoBet || "0") > 0 &&
              ` NO (${market.userNoBet} ETH)`}

            {parseFloat(market.userYesBet || "0") === 0 &&
              parseFloat(market.userNoBet || "0") === 0 &&
              "None"}
          </span>
        </div>

        {market.resolved && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 p-4 rounded-xl mb-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-4 h-4 text-emerald-600" />

              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  {market.userClaimed ? "Payout Claimed" : "Payout Available"}
                </span>

                <span className="text-[11px] text-emerald-700 font-mono">
                  {market.userEstimatedWinnings} ETH
                </span>
              </div>
            </div>

            <button
              onClick={handleClaim}
              disabled={
                !isConnected ||
                market.userClaimed ||
                parseFloat(market.userEstimatedWinnings || "0") <= 0 ||
                isClaiming
              }
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isClaiming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}

              <span>
                {isClaiming
                  ? "Claiming..."
                  : market.userClaimed
                    ? "Claimed"
                    : "Claim Payout"}
              </span>
            </button>
          </div>
        )}
      </div>

      {!market.resolved && !market.isExpired && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-50/90 border border-slate-200 p-2.5 rounded-xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:bg-white transition-all shadow-sm">
            <span className="text-xs font-semibold text-slate-500 pl-2">
              Amount:
            </span>

            <div className="flex items-center gap-1.5 pr-1">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={!isConnected || bettingOption !== null}
                className="w-24 text-right font-mono text-xs font-bold text-slate-900 bg-transparent outline-none disabled:opacity-40"
                placeholder="0.05"
              />

              <span className="text-xs font-bold text-slate-700 font-mono">
                ETH
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleBet(true)}
              disabled={isBettingDisabled}
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {bettingOption === "YES" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}

              <span>{bettingOption === "YES" ? "Placing..." : "Bet YES"}</span>
            </button>

            <button
              onClick={() => handleBet(false)}
              disabled={isBettingDisabled}
              className="inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold text-xs py-2.5 rounded-xl shadow-md shadow-rose-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {bettingOption === "NO" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}

              <span>{bettingOption === "NO" ? "Placing..." : "Bet NO"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
