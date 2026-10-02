import { useCallback, useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "ethers";

import { CONTRACTS } from "../contracts/predictionConfig";
import { MarketOutcome, PredictionMarketData } from "../types/prediction";
import { useContract } from "./useContract";

export const usePredictionMarket = (walletAddress: string | null) => {
  const { getContract } = useContract();

  const [markets, setMarkets] = useState<PredictionMarketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contract = useMemo(() => {
    return getContract(
      CONTRACTS.predictionMarketOracleHub.address,
      CONTRACTS.predictionMarketOracleHub.abi,
      true,
    );
  }, [getContract]);

  const readMarketData = useCallback(
    async (market: any): Promise<PredictionMarketData> => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      let userYesBet = "0";
      let userNoBet = "0.00";
      let userClaimed = false;
      let userEstimatedWinnings = "0.00";

      if (walletAddress) {
        const [userBet, winnings] = await Promise.all([
          contract.userBets(market.id, walletAddress),
          contract.calculateWinnings(market.id, walletAddress),
        ]);

        userYesBet = formatEther(userBet.yesAmount);
        userNoBet = formatEther(userBet.noAmount);
        userClaimed = userBet.claimed;
        userEstimatedWinnings = formatEther(winnings);
      }

      const endTime = Number(market.endTime);

      return {
        id: Number(market.id),
        title: market.title,
        category: market.category,
        endTime,
        outcome: Number(market.outcome) as MarketOutcome,
        totalYesPool: formatEther(market.totalYesPool),
        totalNoPool: formatEther(market.totalNoPool),
        resolved: market.resolved,
        userYesBet,
        userNoBet,
        userClaimed,
        userEstimatedWinnings,
        isExpired: endTime <= Math.floor(Date.now() / 1000),
      };
    },
    [contract, walletAddress],
  );

  const fetchMarkets = useCallback(async () => {
    if (!contract) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const marketData = await contract.getAllMarkets();

      const processedMarkets = await Promise.all(
        marketData.map((market: any) => readMarketData(market)),
      );

      setMarkets(processedMarkets);
    } catch (err) {
      console.error("Failed to fetch markets:", err);

      setError(err instanceof Error ? err.message : "Failed to fetch markets");
    } finally {
      setIsLoading(false);
    }
  }, [contract, readMarketData]);

  const placeBet = useCallback(
    async (marketId: number, isYes: boolean, amountEth: string) => {
      if (!contract) {
        setError("Contract not initialized");
        return;
      }

      try {
        setError(null);

        const tx = await contract.placeBet(marketId, isYes, {
          value: parseEther(amountEth),
        });

        await tx.wait();
      } catch (err) {
        console.error("Failed to submit transaction:", err);

        setError(err instanceof Error ? err.message : "Transaction failed");
      }
    },
    [contract],
  );

  const claimWinnings = useCallback(
    async (marketId: number) => {
      if (!contract) {
        setError("Contract not initialized");
        return;
      }

      try {
        setError(null);

        const tx = await contract.claimWinnings(marketId);
        await tx.wait();
      } catch (err) {
        console.error("Failed to submit transaction:", err);

        setError(err instanceof Error ? err.message : "Transaction failed");
      }
    },
    [contract],
  );

  useEffect(() => {
    if (!contract) {
      return;
    }

    fetchMarkets();
  }, [contract, fetchMarkets]);

  useEffect(() => {
    if (!contract) {
      return;
    }

    const refreshMarkets = () => {
      fetchMarkets();
    };

    contract.on("MarketCreated", refreshMarkets);
    contract.on("BetPlaced", refreshMarkets);
    contract.on("MarketResolved", refreshMarkets);
    contract.on("WinningsClaimed", refreshMarkets);
    return () => {
      contract.off("MarketCreated", refreshMarkets);
      contract.off("BetPlaced", refreshMarkets);
      contract.off("MarketResolved", refreshMarkets);
      contract.off("WinningsClaimed", refreshMarkets);
    };
  }, [contract, fetchMarkets]);

  return {
    markets,
    isLoading,
    error,
    placeBet,
    claimWinnings,
  };
};
