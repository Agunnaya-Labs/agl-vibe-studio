/**
 * Custom hook for managing wallet connection and on-chain balance syncing.
 * Handles MetaMask/WalletConnect integration and Base Mainnet balance queries.
 */

import { ethers } from "ethers";
import { AgunnayaDatabase } from "../lib/db";
import { WalletState } from "../types";
import { useStudioStore } from "../lib/store";
import { CONFIG, getRpcEndpoint, getAglContractDetails } from "../lib/config";

export function useWalletConnection() {
  const {
    wallet,
    setWallet,
    refreshAllData,
    addTerminalLog,
    showToast,
  } = useStudioStore();

  /**
   * Fetch on-chain balances for a given address from Base Mainnet
   */
  const fetchOnChainBalances = async (
    address: string
  ): Promise<{ ethBalance: number; aglBalance: number }> => {
    if (!address) return { ethBalance: 0, aglBalance: 0 };

    try {
      addTerminalLog(
        "info",
        `SYNC: Querying native and AGL balances for ${address.slice(0, 8)}... on Base Mainnet.`
      );

      const baseProvider = new ethers.JsonRpcProvider(getRpcEndpoint("mainnet"));
      const ethBalRaw = await baseProvider.getBalance(address);
      const ethBalance = parseFloat(ethers.formatEther(ethBalRaw));

      let aglBalance = 0;
      try {
        const aglDetails = getAglContractDetails();
        const aglTokenContract = new ethers.Contract(
          aglDetails.address,
          aglDetails.abi,
          baseProvider
        );
        const aglBalRaw = await aglTokenContract.balanceOf(address);
        aglBalance = parseFloat(ethers.formatEther(aglBalRaw));
      } catch (e) {
        addTerminalLog(
          "info",
          "FETCH_BALANCES: AGL token balance query failed on-chain."
        );
        aglBalance = 0;
      }

      addTerminalLog(
        "success",
        `SYNC_COMPLETE: Synced Base Mainnet. Balance: ${ethBalance.toFixed(4)} ETH, ${aglBalance.toLocaleString()} AGL`
      );

      return { ethBalance, aglBalance };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addTerminalLog(
        "error",
        `FETCH_BALANCES: Base Mainnet RPC connection failed. ${errorMessage}`
      );
      return { ethBalance: 0, aglBalance: 0 };
    }
  };

  /**
   * Sync wallet balances from on-chain
   */
  const syncWalletBalancesOnChain = async (addr: string) => {
    if (!addr) return;
    const { ethBalance, aglBalance } = await fetchOnChainBalances(addr);
    useStudioStore.setState((state) => ({
      wallet: {
        ...state.wallet,
        balanceEth: ethBalance,
        aglTokenBalance: aglBalance,
      },
    }));
    refreshAllData();
  };

  /**
   * Connect wallet via MetaMask or generate demo wallet
   */
  const handleWalletConnect = async (
    type: "metamask" | "coinbase" | "walletconnect" | "smart"
  ) => {
    let address = "";
    let ethBalance = 0;
    let aglBalance = 0;

    // Try to connect via injected provider
    if (
      typeof window !== "undefined" &&
      (window as any).ethereum &&
      (type === "metamask" || type === "coinbase" || type === "walletconnect")
    ) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts && accounts.length > 0) {
          address = accounts[0];
          addTerminalLog(
            "success",
            `WALLET_CONNECT: Wallet account linked successfully via MetaMask / Injected Provider: ${address}`
          );
        }
      } catch (err: any) {
        showToast(
          "Injected wallet connection failed. Connecting mock wallet instead.",
          "info"
        );
        addTerminalLog(
          "info",
          `WALLET_CONNECT: Injected wallet error: ${err.message || String(err)}`
        );
      }
    }

    // Fall back to demo address if no injected provider
    if (!address) {
      address =
        "0x" + Math.random().toString(16).substr(2, 40);
      if (type === "smart") {
        address = "0xAA" + Math.random().toString(16).substr(2, 38);
      }
      addTerminalLog(
        "info",
        `WALLET_CONNECT: Injected provider not found/rejected. Generated demo address: ${address}`
      );
    }

    // Fetch on-chain balances
    const { ethBalance: fetchedEthBalance, aglBalance: fetchedAglBalance } =
      await fetchOnChainBalances(address);
    ethBalance = fetchedEthBalance;
    aglBalance = fetchedAglBalance;

    // Create and save new wallet state
    const newWallet: WalletState = {
      isConnected: true,
      address,
      balanceEth: ethBalance,
      aglTokenBalance: aglBalance,
      isSmartAccount: type === "smart",
      walletType: type,
      sponsoredGasEth: type === "smart" ? CONFIG.WALLET.DEFAULT_GAS_SPONSORED_ETH : 0,
      aglCredits: wallet.aglCredits || CONFIG.WALLET.DEFAULT_AGL_CREDITS,
    };

    AgunnayaDatabase.saveWallet(newWallet);
    setWallet(newWallet);

    addTerminalLog(
      "success",
      `SECURE LINK: Wallet linked successfully. Address: ${address}. Balance: ${ethBalance.toFixed(4)} ETH, ${aglBalance.toLocaleString()} AGL`
    );

    // Handle referral registration if active
    const activeRef = AgunnayaDatabase.getActiveReferrer();
    if (activeRef) {
      const actualReferrer = AgunnayaDatabase.registerReferral(address, activeRef);
      if (actualReferrer) {
        showToast(
          `Welcome! Registered under referrer 0x${actualReferrer.slice(2, 6)}...`,
          "success"
        );
        addTerminalLog(
          "success",
          `REFERRAL_COMPLETED: User referred successfully by 0x${actualReferrer.slice(2, 8)}...`
        );
      }
    }

    // Log activity
    AgunnayaDatabase.addActivity({
      type: "vote",
      tokenSymbol: "ETH",
      tokenAddress: address,
      user: address,
      amount: 1,
      ethValue: 0,
      details: `Connected decentralized identity wallet (${type}) to Agunnaya Studio`,
    });

    refreshAllData();
  };

  /**
   * Disconnect wallet
   */
  const handleWalletDisconnect = () => {
    const freshWallet: WalletState = {
      isConnected: false,
      address: "",
      balanceEth: 0,
      aglTokenBalance: 0,
      isSmartAccount: false,
      walletType: "metamask",
      sponsoredGasEth: 0,
      aglCredits: 0,
    };
    AgunnayaDatabase.saveWallet(freshWallet);
    setWallet(freshWallet);
    addTerminalLog("system", "SECURE LINK: Wallet link severed by user.");
  };

  /**
   * Handle fund wallet (sync on-chain balances)
   */
  const handleFundWallet = async () => {
    if (!wallet.isConnected || !wallet.address) {
      showToast("Please connect your wallet first in the header.", "error");
      return;
    }
    showToast("Synchronizing with Base Mainnet...", "info");
    addTerminalLog(
      "info",
      "FAUCET_REDIRECT: Faucet claims are disabled on Base Mainnet. Querying live on-chain balances instead..."
    );
    await syncWalletBalancesOnChain(wallet.address);
    showToast("Live Base Mainnet balances synchronized!", "success");
  };

  return {
    handleWalletConnect,
    handleWalletDisconnect,
    handleFundWallet,
    syncWalletBalancesOnChain,
    fetchOnChainBalances,
  };
}
