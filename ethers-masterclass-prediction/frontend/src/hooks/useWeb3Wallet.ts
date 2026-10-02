import { BrowserProvider, formatEther, JsonRpcSigner } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EIP6963_ANNOUNCE_PROVIDER,
  EIP6963_REQUEST_PROVIDER,
  SEPOLIA_CHAIN_ID,
} from "../constants";
import {
  WalletState,
  EIP1193Provider,
  EIP6963ProviderEvent,
} from "../types/prediction";

export const useWeb3Wallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    balance: "0.00",
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const [provider, setProvider] = useState<EIP1193Provider | null>(null);

  const [browserProvider, setBrowserProvider] =
    useState<BrowserProvider | null>(null);

  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  const isSepolia = useMemo(() => {
    return wallet.chainId === SEPOLIA_CHAIN_ID;
  }, [wallet.chainId]);

  const getBalance = useCallback(
    async (address: string) => {
      if (!browserProvider) return;

      try {
        const balance = await browserProvider.getBalance(address);

        setWallet((prev) => ({
          ...prev,
          balance: Number(formatEther(balance)).toFixed(4),
        }));
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
      }
    },
    [browserProvider],
  );

  const setAccount = useCallback(
    async (accounts: string[]) => {
      if (!browserProvider || accounts.length === 0) {
        setSigner(null);

        setWallet((prev) => ({
          ...prev,
          address: null,
          balance: "0.00",
          isConnected: false,
        }));

        return;
      }

      const address = accounts[0];

      const walletSigner = await browserProvider.getSigner(address);

      setSigner(walletSigner);

      setWallet((prev) => ({
        ...prev,
        address,
        isConnected: true,
      }));

      await getBalance(address);
    },
    [browserProvider, getBalance],
  );

  const connectWallet = useCallback(async () => {
    if (!browserProvider) {
      setWallet((prev) => ({
        ...prev,
        error: "No wallet provider detected.",
      }));

      return;
    }

    try {
      setWallet((prev) => ({
        ...prev,
        isConnecting: true,
        error: null,
      }));

      const accounts = (await browserProvider.send(
        "eth_requestAccounts",
        [],
      )) as string[];

      const network = await browserProvider.getNetwork();

      setWallet((prev) => ({
        ...prev,
        chainId: Number(network.chainId),
      }));

      await setAccount(accounts);
    } catch (error) {
      setWallet((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to connect wallet.",
      }));
    } finally {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
      }));
    }
  }, [browserProvider, setAccount]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (provider) {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (error) {
      console.error("Could not revoke wallet permissions:", error);
    }

    setSigner(null);

    setWallet({
      address: null,
      chainId: null,
      balance: "0.00",
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, [provider]);

  const handleAccountsChanged = useCallback(
    async (accounts: string[]) => {
      await setAccount(accounts);

      if (accounts.length === 0) {
        setWallet((prev) => ({
          ...prev,
          chainId: null,
        }));
      }
    },
    [setAccount],
  );

  const handleChainChanged = useCallback(
    async (chainId: string) => {
      const newChainId = parseInt(chainId, 16);

      setWallet((prev) => ({
        ...prev,
        chainId: newChainId,
        balance: "0.00",
      }));

      if (provider) {
        const newBrowserProvider = new BrowserProvider(provider);

        setBrowserProvider(newBrowserProvider);
      }
    },
    [provider],
  );

  useEffect(() => {
    const handleProviderAnnouncement = (event: Event) => {
      const providerEvent = event as EIP6963ProviderEvent;

      const announcedProvider = providerEvent.detail.provider;

      setProvider(announcedProvider);
      setBrowserProvider(new BrowserProvider(announcedProvider));
    };

    window.addEventListener(
      EIP6963_ANNOUNCE_PROVIDER,
      handleProviderAnnouncement,
    );

    window.dispatchEvent(new Event(EIP6963_REQUEST_PROVIDER));

    return () => {
      window.removeEventListener(
        EIP6963_ANNOUNCE_PROVIDER,
        handleProviderAnnouncement,
      );
    };
  }, []);

  useEffect(() => {
    if (!provider) return;

    provider.on?.("accountsChanged", handleAccountsChanged);

    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);

      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [provider, handleAccountsChanged, handleChainChanged]);

  useEffect(() => {
    const restoreWallet = async () => {
      if (!browserProvider) return;

      const accounts = (await browserProvider.send(
        "eth_accounts",
        [],
      )) as string[];

      if (accounts.length === 0) return;

      const network = await browserProvider.getNetwork();

      setWallet((prev) => ({
        ...prev,
        chainId: Number(network.chainId),
      }));

      await setAccount(accounts);
    };

    restoreWallet();
  }, [browserProvider, setAccount]);

  return {
    wallet,
    signer,
    connectWallet,
    disconnectWallet,
  };
};
