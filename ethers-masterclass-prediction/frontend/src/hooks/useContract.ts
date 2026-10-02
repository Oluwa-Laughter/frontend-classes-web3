import { useCallback } from "react";
import { Contract, JsonRpcProvider } from "ethers";
import { InterfaceAbi } from "ethers";
import { useWeb3Wallet } from "./useWeb3Wallet";
import { RPC_URL } from "../constants";

export const jsonRpcProvider = new JsonRpcProvider(RPC_URL);

export const useContract = () => {
  const { signer } = useWeb3Wallet();

  const getContract = useCallback(
    (address: string, abi: InterfaceAbi, withSigner = false) => {
      if (!address || !abi) return;
      let contract;
      if (withSigner) {
        if (!signer) return;
        contract = new Contract(address, abi, signer);
      } else {
        contract = new Contract(address, abi, jsonRpcProvider);
      }
      return contract;
    },
    [signer],
  );
  return {
    getContract,
  };
};
