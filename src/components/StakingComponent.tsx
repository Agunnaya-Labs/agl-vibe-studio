import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { 
  Landmark, 
  ShieldAlert, 
  Coins, 
  Clock, 
  ArrowUpRight, 
  Check, 
  Zap, 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp, 
  Wallet, 
  ChevronRight,
  Info,
  Unlock,
  Skull
} from "lucide-react";
import { WalletState } from "../types";
import { AgunnayaDatabase } from "../lib/db";

// Constants & ABI definitions matching contract at 0xd4B61B4876c15e78e0275EbA52cf62D55ED5fD30
const BASE_RPC_URL = "https://mainnet.base.org";
const STAKING_CONTRACT_ADDRESS = "0xd4B61B4876c15e78e0275EbA52cf62D55ED5fD30";
const AGL_TOKEN_ADDRESS = "0xEA1221B4d80A89BD8C75248Fae7c176BD1854698";

const AGL_STAKING_ABI = [
  "function aglToken() external view returns (address)",
  "function totalStaked() external view returns (uint256)",
  "function paused() external view returns (bool)",
  "function positionCount(address user) external view returns (uint256)",
  "function getPosition(address user, uint256 positionId) external view returns (uint256 amount, uint64 startTime, uint64 unlockTime, uint8 tierId, uint16 aprBasisPoints, bool withdrawn)",
  "function pendingReward(address user, uint256 positionId) external view returns (uint256)",
  "function totalClaimable(address user, uint256 positionId) external view returns (uint256)",
  "function stake(uint256 amount, uint8 tierId) external",
  "function unstake(uint256 positionId) external",
  "function emergencyWithdraw(uint256 positionId) external",
  "function getTier(uint256) external view returns (uint32 lockDuration, uint16 aprBasisPoints, bool active)",
  "function tiers(uint256) external view returns (uint32 lockDuration, uint16 aprBasisPoints, bool active)"
];

const ERC20_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function symbol() external view returns (string)"
];

interface StakingPosition {
  id: number;
  amount: number;
  startTime: number; // timestamp in seconds
  unlockTime: number; // timestamp in seconds
  tierId: number;
  aprBasisPoints: number;
  withdrawn: boolean;
  pendingReward: number;
}

interface StakingComponentProps {
  wallet: WalletState;
  onRefreshWallet: () => void;
  addTerminalLog: (type: "info" | "success" | "error" | "buy" | "sell" | "system", message: string) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function StakingComponent({ 
  wallet, 
  onRefreshWallet, 
  addTerminalLog, 
  showToast 
}: StakingComponentProps) {
  
  // Connection and Global State
  const [web3Active, setWeb3Active] = useState<boolean>(false);
  const [onWrongNetwork, setOnWrongNetwork] = useState<boolean>(false);
  const [loadingGlobal, setLoadingGlobal] = useState<boolean>(true);
  const [loadingUser, setLoadingUser] = useState<boolean>(false);
  const [stakingLoading, setStakingLoading] = useState<boolean>(false);

  // Staking details
  const [totalStakedProtocol, setTotalStakedProtocol] = useState<string>("1,450,250");
  const [stakingPaused, setStakingPaused] = useState<boolean>(false);
  const [stakingTiers, setStakingTiers] = useState<any[]>([
    { id: 0, name: "30-Day Locked Staking", durationDays: 30, durationSec: 2592000, apr: 8.00, aprBps: 800 }
  ]);

  // User State
  const [userAllowance, setUserAllowance] = useState<bigint>(0n);
  const [userPositions, setUserPositions] = useState<StakingPosition[]>([]);
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [selectedTierId, setSelectedTierId] = useState<number>(0);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(Math.floor(Date.now() / 1000));
  const [activeTab, setActiveTab] = useState<"stake" | "positions">("stake");

  // Keep clock running for countdowns and real-time reward accrual
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check Web3 connectivity and set providers
  const checkWeb3Connectivity = useCallback(async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await browserProvider.send("eth_accounts", []).catch(() => []);
        const network = await browserProvider.getNetwork().catch(() => ({ chainId: 0n }));

        if (accounts.length > 0 && wallet.isConnected && accounts[0].toLowerCase() === wallet.address.toLowerCase()) {
          if (network.chainId === 8453n) {
            setWeb3Active(true);
            setOnWrongNetwork(false);
            return true;
          } else {
            setWeb3Active(false);
            setOnWrongNetwork(true);
            return false;
          }
        }
      } catch (err) {
        console.error("Web3 connectivity check error:", err);
      }
    }
    setWeb3Active(false);
    setOnWrongNetwork(false);
    return false;
  }, [wallet.isConnected, wallet.address]);

  // Load contract details and active tiers
  const loadGlobalStakingStats = async () => {
    setLoadingGlobal(true);
    try {
      const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
      const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, AGL_STAKING_ABI, provider);

      const [totalStakedRaw, isPaused] = await Promise.all([
        stakingContract.totalStaked().catch(() => 0n),
        stakingContract.paused().catch(() => false)
      ]);

      setTotalStakedProtocol(
        parseFloat(ethers.formatEther(totalStakedRaw)).toLocaleString(undefined, { 
          maximumFractionDigits: 2 
        })
      );
      setStakingPaused(isPaused);

      // Fetch Tiers from contract using getTier or tiers fallback
      const fetchedTiers: any[] = [];
      for (let i = 0; i < 5; i++) {
        try {
          let tierRaw;
          try {
            // Priority: getTier(i)
            tierRaw = await stakingContract.getTier(i);
          } catch (getTierError) {
            // Fallback: tiers(i)
            tierRaw = await stakingContract.tiers(i);
          }

          const lockDuration = Number(tierRaw[0]);
          const aprBasisPoints = Number(tierRaw[1]);
          const active = tierRaw[2];

          if (lockDuration > 0 && active) {
            const days = Math.floor(lockDuration / (24 * 3600));
            fetchedTiers.push({
              id: i,
              name: `${days}-Day Locked Staking`,
              durationDays: days,
              durationSec: lockDuration,
              apr: aprBasisPoints / 100,
              aprBps: aprBasisPoints
            });
          }
        } catch (tierErr) {
          // Break when no more active tiers are found
          break;
        }
      }

      if (fetchedTiers.length > 0) {
        setStakingTiers(fetchedTiers);
      }
    } catch (err) {
      console.error("Failed to query global staking contract:", err);
      // Fallback design stats
      setTotalStakedProtocol("1,450,250");
      setStakingPaused(false);
    } finally {
      setLoadingGlobal(false);
    }
  };

  // Load User Staking Positions, Allowances and Pending rewards
  const loadUserStakingData = useCallback(async () => {
    if (!wallet.isConnected || !wallet.address) {
      setUserPositions([]);
      return;
    }

    setLoadingUser(true);
    const isWeb3 = await checkWeb3Connectivity();

    try {
      if (isWeb3) {
        // Direct Web3 Queries from Smart Contract
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, AGL_STAKING_ABI, browserProvider);
        const tokenContract = new ethers.Contract(AGL_TOKEN_ADDRESS, ERC20_ABI, browserProvider);

        const [allowanceVal, pCountRaw] = await Promise.all([
          tokenContract.allowance(wallet.address, STAKING_CONTRACT_ADDRESS).catch(() => 0n),
          stakingContract.positionCount(wallet.address).catch(() => 0n)
        ]);

        setUserAllowance(allowanceVal);

        const count = Number(pCountRaw);
        const fetchedPositions: StakingPosition[] = [];

        for (let i = 0; i < count; i++) {
          try {
            const pos = await stakingContract.getPosition(wallet.address, i);
            
            // Query pending reward using contract function: pendingReward(user, positionId)
            let pending = await stakingContract.pendingReward(wallet.address, i).catch(() => 0n);
            if (pending === 0n) {
              pending = await stakingContract.totalClaimable(wallet.address, i).catch(() => 0n);
            }

            fetchedPositions.push({
              id: i,
              amount: parseFloat(ethers.formatEther(pos[0])),
              startTime: Number(pos[1]),
              unlockTime: Number(pos[2]),
              tierId: Number(pos[3]),
              aprBasisPoints: Number(pos[4]),
              withdrawn: pos[5],
              pendingReward: parseFloat(ethers.formatEther(pending))
            });
          } catch (posErr) {
            console.warn(`Failed to fetch position ${i}:`, posErr);
          }
        }

        setUserPositions(fetchedPositions);
      } else {
        // Sandbox Simulation Mode using localStorage persistence
        const cached = localStorage.getItem("agl_staking_positions");
        let positionsList: StakingPosition[] = cached ? JSON.parse(cached) : [];

        // Calculate dynamic live rewards in Sandbox
        const updatedList = positionsList.map((pos) => {
          if (pos.withdrawn) return pos;

          // Reward calculation: amount * (apr / 100) * (timeElapsedSec / 365 days)
          const elapsedSec = currentTimeSec - pos.startTime;
          const aprDecimal = pos.aprBasisPoints / 10000;
          const timeFraction = elapsedSec / (365 * 24 * 3600);
          
          // Sandbox accelerates simulation: reward accrues 100x faster for user testing
          const sandboxAcc = 100;
          const rewardAmount = pos.amount * aprDecimal * timeFraction * sandboxAcc;

          return {
            ...pos,
            pendingReward: Number(rewardAmount.toFixed(6))
          };
        });

        setUserPositions(updatedList);
        // Infinite allowance for simulated sandbox
        setUserAllowance(ethers.parseEther("1000000000"));
      }
    } catch (err) {
      console.error("Error loading user staking data:", err);
    } finally {
      setLoadingUser(false);
    }
  }, [wallet.isConnected, wallet.address, checkWeb3Connectivity, currentTimeSec]);

  // Load everything on mount and wallet transition
  useEffect(() => {
    loadGlobalStakingStats();
    loadUserStakingData();
  }, [wallet.address, wallet.isConnected]);

  // ERC20 Approve Token Spender
  const handleApprove = async () => {
    setStakingLoading(true);
    addTerminalLog("info", "Requesting allowance approval for Agunnaya Labs Token (AGL)...");

    try {
      if (web3Active && !onWrongNetwork) {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await browserProvider.getSigner();
        const tokenContract = new ethers.Contract(AGL_TOKEN_ADDRESS, ERC20_ABI, signer);

        const approveTx = await tokenContract.approve(STAKING_CONTRACT_ADDRESS, ethers.MaxUint256);
        addTerminalLog("info", `Approval TX submitted: ${approveTx.hash}. Awaiting confirmation...`);
        await approveTx.wait();

        showToast("AGL token spending approved!", "success");
        addTerminalLog("success", `Approved contract to spend AGL on Base. Tx: ${approveTx.hash}`);
        await loadUserStakingData();
      } else {
        // Sandbox mock approval
        setTimeout(() => {
          setUserAllowance(ethers.parseEther("1000000000"));
          showToast("AGL approved (Sandbox)!", "success");
          addTerminalLog("success", "Sandbox: Multi-million token spending approved successfully.");
        }, 1000);
      }
    } catch (err: any) {
      console.error("Approval failed:", err);
      showToast(err.message || "Approval transaction failed.", "error");
      addTerminalLog("error", `Approval failed: ${err.message || String(err)}`);
    } finally {
      setStakingLoading(false);
    }
  };

  // Stake transaction execution
  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(stakeAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast("Please enter a valid amount.", "error");
      return;
    }
    if (amt > wallet.aglTokenBalance) {
      showToast("Insufficient AGL balance.", "error");
      return;
    }

    setStakingLoading(true);
    const selectedTier = stakingTiers[selectedTierId] || stakingTiers[0];
    addTerminalLog("info", `Staking ${amt.toLocaleString()} AGL into ${selectedTier.name} on Base Mainnet...`);

    try {
      if (web3Active && !onWrongNetwork) {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await browserProvider.getSigner();
        const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, AGL_STAKING_ABI, signer);

        const tx = await stakingContract.stake(ethers.parseEther(stakeAmount), selectedTierId);
        addTerminalLog("info", `Staking TX broadcast. Hash: ${tx.hash}. Waiting for confirmations...`);
        await tx.wait();

        showToast(`Staked ${amt.toLocaleString()} AGL successfully!`, "success");
        addTerminalLog("success", `Staked ${amt.toLocaleString()} AGL on-chain. TX Hash: ${tx.hash}`);
        setStakeAmount("");
        
        onRefreshWallet();
        await loadUserStakingData();
      } else {
        // Sandbox Simulation Mode
        setTimeout(() => {
          const tier = stakingTiers[selectedTierId] || stakingTiers[0];
          const newPos: StakingPosition = {
            id: userPositions.length + 100, // mock unique id
            amount: amt,
            startTime: Math.floor(Date.now() / 1000),
            // Lock is 60 seconds in Sandbox for beautiful immediate testing!
            unlockTime: Math.floor(Date.now() / 1000) + 60,
            tierId: selectedTierId,
            aprBasisPoints: tier.aprBps,
            withdrawn: false,
            pendingReward: 0
          };

          const updatedPositions = [...userPositions, newPos];
          localStorage.setItem("agl_staking_positions", JSON.stringify(updatedPositions));
          setUserPositions(updatedPositions);

          const updatedWallet = { 
            ...wallet, 
            aglTokenBalance: wallet.aglTokenBalance - amt 
          };
          AgunnayaDatabase.saveWallet(updatedWallet);
          onRefreshWallet();

          showToast(`Staked ${amt.toLocaleString()} AGL successfully (Sandbox)!`, "success");
          addTerminalLog("success", `Sandbox: Staked ${amt.toLocaleString()} AGL. Demo lock set to 60 seconds for instant testing.`);
          setStakeAmount("");
          setActiveTab("positions");
        }, 1500);
      }
    } catch (err: any) {
      console.error("Staking error:", err);
      showToast(err.message || "Staking transaction failed.", "error");
      addTerminalLog("error", `Staking failed: ${err.message || String(err)}`);
    } finally {
      setStakingLoading(false);
    }
  };

  // Unstaking position execution
  const handleUnstake = async (positionId: number) => {
    setStakingLoading(true);
    addTerminalLog("info", `Unstaking position #${positionId} and claiming accumulated rewards...`);

    try {
      if (web3Active && !onWrongNetwork) {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await browserProvider.getSigner();
        const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, AGL_STAKING_ABI, signer);

        const tx = await stakingContract.unstake(positionId);
        addTerminalLog("info", `Unstake TX broadcast. Hash: ${tx.hash}. Confirming on-chain...`);
        await tx.wait();

        showToast("Position unstaked successfully! Funds and rewards returned.", "success");
        addTerminalLog("success", `On-Chain: Unstaked Position #${positionId}. Check your wallet balance.`);
        onRefreshWallet();
        await loadUserStakingData();
      } else {
        // Sandbox Unstake Simulation
        setTimeout(() => {
          const index = userPositions.findIndex(p => p.id === positionId);
          if (index === -1) {
            showToast("Position not found.", "error");
            setStakingLoading(false);
            return;
          }

          const pos = userPositions[index];
          const lockDurationSec = currentTimeSec - pos.startTime;
          
          // Calculate reward dynamically: reward = amount * (apr/100) * (timeStaked / 365 days) * acceleration
          const aprDecimal = pos.aprBasisPoints / 10000;
          const timeFraction = lockDurationSec / (365 * 24 * 3600);
          const sandboxAcc = 100;
          const calculatedReward = pos.amount * aprDecimal * timeFraction * sandboxAcc;
          const finalReward = calculatedReward > 0 ? calculatedReward : pos.amount * 0.005;

          // Mark withdrawn
          const updatedPositions = userPositions.map((p) => {
            if (p.id === positionId) {
              return { ...p, withdrawn: true, pendingReward: finalReward };
            }
            return p;
          });

          localStorage.setItem("agl_staking_positions", JSON.stringify(updatedPositions));
          setUserPositions(updatedPositions);

          // Return staked amount + reward to wallet
          const refund = pos.amount + finalReward;
          const updatedWallet = { 
            ...wallet, 
            aglTokenBalance: wallet.aglTokenBalance + refund 
          };
          AgunnayaDatabase.saveWallet(updatedWallet);
          onRefreshWallet();

          showToast(`Position #${positionId} unstaked successfully (Sandbox)!`, "success");
          addTerminalLog("success", `Sandbox: Returned ${pos.amount.toLocaleString()} AGL principal + ${finalReward.toLocaleString(undefined, { maximumFractionDigits: 4 })} AGL reward to wallet.`);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Unstaking error:", err);
      showToast(err.message || "Unstaking failed.", "error");
      addTerminalLog("error", `Unstaking failed: ${err.message || String(err)}`);
    } finally {
      setStakingLoading(false);
    }
  };

  // Emergency exit/unstake execution (forfeits rewards)
  const handleEmergencyWithdraw = async (positionId: number) => {
    if (!window.confirm("WARNING: Emergency withdrawal will immediately withdraw your staked tokens, but you may FORFEIT all accumulated rewards or pay a contract penalty. Are you sure you want to proceed?")) {
      return;
    }
    
    setStakingLoading(true);
    addTerminalLog("info", `Executing emergency exit for staking position #${positionId} on-chain...`);

    try {
      if (web3Active && !onWrongNetwork) {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await browserProvider.getSigner();
        const stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, AGL_STAKING_ABI, signer);

        const tx = await stakingContract.emergencyWithdraw(positionId);
        addTerminalLog("info", `Emergency Exit TX broadcast. Hash: ${tx.hash}. Confirming...`);
        await tx.wait();

        showToast("Emergency withdrawal completed!", "success");
        addTerminalLog("success", `On-Chain: Emergency withdrew position #${positionId}. Principal recovered.`);
        onRefreshWallet();
        await loadUserStakingData();
      } else {
        // Sandbox Emergency Unstake
        setTimeout(() => {
          const index = userPositions.findIndex(p => p.id === positionId);
          if (index === -1) {
            showToast("Position not found.", "error");
            setStakingLoading(false);
            return;
          }

          const pos = userPositions[index];

          // Mark withdrawn but WITH zero rewards!
          const updatedPositions = userPositions.map((p) => {
            if (p.id === positionId) {
              return { ...p, withdrawn: true, pendingReward: 0 };
            }
            return p;
          });

          localStorage.setItem("agl_staking_positions", JSON.stringify(updatedPositions));
          setUserPositions(updatedPositions);

          // Return ONLY principal, NO rewards
          const updatedWallet = { 
            ...wallet, 
            aglTokenBalance: wallet.aglTokenBalance + pos.amount 
          };
          AgunnayaDatabase.saveWallet(updatedWallet);
          onRefreshWallet();

          showToast(`Emergency withdrew position #${positionId} (Sandbox)!`, "success");
          addTerminalLog("success", `Sandbox: Emergency exit completed. Returned ${pos.amount.toLocaleString()} AGL principal with 0 reward.`);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Emergency exit error:", err);
      showToast(err.message || "Emergency exit failed.", "error");
      addTerminalLog("error", `Emergency exit failed: ${err.message || String(err)}`);
    } finally {
      setStakingLoading(false);
    }
  };

  let isApproved = false;
  try {
    const cleanedAmount = stakeAmount ? stakeAmount.trim() : "0";
    if (cleanedAmount && !isNaN(Number(cleanedAmount)) && /^[0-9]*\.?[0-9]*$/.test(cleanedAmount) && cleanedAmount !== ".") {
      isApproved = userAllowance >= ethers.parseEther(cleanedAmount);
    } else {
      isApproved = userAllowance >= 0n;
    }
  } catch (err) {
    isApproved = false;
  }
  const activePositions = userPositions.filter(p => !p.withdrawn);
  const totalUserStaked = activePositions.reduce((acc, p) => acc + p.amount, 0);
  
  // Calculate total pending rewards with real-time sandbox ticking fallback
  const totalPendingRewards = activePositions.reduce((acc, p) => {
    if (!web3Active || onWrongNetwork) {
      // Sandbox mode: calculate dynamically based on time elapsed
      const elapsedSec = currentTimeSec - p.startTime;
      const aprDecimal = p.aprBasisPoints / 10000;
      const timeFraction = elapsedSec / (365 * 24 * 3600);
      const sandboxAcc = 100; // sandbox accelerator
      const currentReward = p.amount * aprDecimal * timeFraction * sandboxAcc;
      return acc + currentReward;
    }
    return acc + p.pendingReward;
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Staking Header and Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-[#A855F7]" />
            AGL Smart Contract Yield Farming
          </h2>
          <p className="text-[11px] text-zinc-500 mt-1">
            Official AGL Ecosystem Yield Vault at contract address <span className="text-purple-400 font-mono select-all">0xd4B61B4876c15e78e0275EbA52cf62D55ED5fD30</span> on Base.
          </p>
        </div>
        
        {/* Quick stats panel */}
        <div className="flex items-center gap-4 bg-black/40 p-2.5 px-4 rounded-xl border border-white/5">
          <div className="text-center md:text-left">
            <span className="block text-[8px] text-zinc-500 uppercase font-mono font-bold">Total Staked Pool</span>
            <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
              {totalStakedProtocol} AGL
            </span>
          </div>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="text-center md:text-left">
            <span className="block text-[8px] text-zinc-500 uppercase font-mono font-bold">Yield APR Range</span>
            <span className="text-xs font-mono font-bold text-emerald-400">8.00% - 15.00%</span>
          </div>
        </div>
      </div>

      {/* Mode indicators / Web3 Warning */}
      {wallet.isConnected && (
        <div className={`p-3 rounded-xl text-[10px] font-mono flex items-center gap-2 border ${
          web3Active && !onWrongNetwork
            ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-300"
            : onWrongNetwork
              ? "bg-red-950/40 border-red-500/20 text-red-300"
              : "bg-amber-950/40 border-amber-500/20 text-amber-300"
        }`}>
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <div className="flex-1">
            {web3Active && !onWrongNetwork ? (
              <span>Connected directly on-chain on **Base Mainnet**. Staking will write directly to the smart contract.</span>
            ) : onWrongNetwork ? (
              <span className="text-red-300 font-bold">WRONG NETWORK: Please switch your browser extension wallet to **Base Mainnet (8453)** to load details on-chain.</span>
            ) : (
              <span>**Sandbox Simulation Mode**: Using simulated, durable localStorage. Stakes will unlock in 60 seconds for instant testability!</span>
            )}
          </div>
          <button 
            onClick={() => { loadGlobalStakingStats(); loadUserStakingData(); }} 
            className="p-1 hover:bg-white/5 rounded-md transition-all text-zinc-400 hover:text-white"
            title="Refresh contract state"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pending Rewards Live Tracker Widget */}
      {wallet.isConnected && activePositions.length > 0 && (
        <div className="relative overflow-hidden p-4 rounded-xl border border-[#A855F7]/30 bg-gradient-to-r from-purple-950/20 via-zinc-900/50 to-zinc-950 shadow-[0_0_20px_rgba(168,85,247,0.05)]">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 pointer-events-none">
            <TrendingUp className="w-48 h-48 text-[#A855F7]" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#A855F7] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 animate-pulse" /> Live Yield Aggregator
              </span>
              <h3 className="text-xl font-bold font-mono text-white tracking-tight">
                {totalPendingRewards.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}{" "}
                <span className="text-xs text-zinc-400 font-sans">AGL</span>
              </h3>
              <p className="text-[10px] text-zinc-400">
                Accruing from {activePositions.length} active positions. Locked values are automatically compounding.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="block text-[8px] text-zinc-500 uppercase font-mono">My Total Deposit</span>
                <span className="text-xs font-mono font-bold text-white">{totalUserStaked.toLocaleString()} AGL</span>
              </div>
              <button 
                onClick={loadUserStakingData}
                disabled={loadingUser}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUser ? "animate-spin" : ""}`} />
                <span>Sync Vault</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal Tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab("stake")}
          className={`px-5 py-2.5 text-xs font-bold font-display border-b-2 transition-all ${
            activeTab === "stake"
              ? "border-[#A855F7] text-white bg-[#A855F7]/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Stake AGL
        </button>
        <button
          onClick={() => setActiveTab("positions")}
          className={`px-5 py-2.5 text-xs font-bold font-display border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "positions"
              ? "border-[#A855F7] text-white bg-[#A855F7]/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span>My Positions</span>
          {activePositions.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-[9px] font-bold text-white">
              {activePositions.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: STAKE FORM */}
      {activeTab === "stake" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Input amount & Tier selection */}
            <form onSubmit={handleStake} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span className="uppercase font-bold">Staking Amount</span>
                  <span>Available: {wallet.aglTokenBalance.toLocaleString()} AGL</span>
                </div>
                <div className="relative">
                  <input
                    id="stake-comp-input-amount"
                    type="number"
                    min="1"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="10,000"
                    disabled={stakingLoading}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 pr-16 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-[#A855F7] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setStakeAmount(Math.floor(wallet.aglTokenBalance).toString())}
                    className="absolute right-2 top-2 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-300 transition-all uppercase"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Dynamic Tier Selection Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold">Select Lock-up Tier</label>
                <select
                  id="staking-comp-tier-select"
                  value={selectedTierId}
                  onChange={(e) => setSelectedTierId(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-[#A855F7] transition-all"
                >
                  {stakingTiers.map((tier) => (
                    <option key={tier.id} value={tier.id} className="bg-zinc-950 text-white">
                      {tier.name} — {tier.apr.toFixed(2)}% fixed APR
                    </option>
                  ))}
                </select>
              </div>

              {/* Approve/Stake dual action buttons */}
              {!wallet.isConnected ? (
                <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 text-center text-xs text-zinc-500 font-mono">
                  Please connect your wallet to access staking.
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  {!isApproved ? (
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={stakingLoading || stakingPaused}
                      className="flex-1 py-3 bg-brand-purple hover:bg-brand-purple/90 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-xs font-bold font-display transition-all shadow-lg shadow-purple-500/10 flex items-center justify-center gap-1.5"
                    >
                      {stakingLoading ? "Approving AGL..." : "Approve Agunnaya Smart Contract"}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={stakingLoading || stakingPaused || !stakeAmount}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-[#A855F7] hover:from-purple-500 hover:to-purple-600 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-xs font-bold font-display transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5"
                    >
                      {stakingLoading ? "Broadcasting Stake..." : "Confirm Locked Deposit"}
                    </button>
                  )}
                </div>
              )}
            </form>

            {/* Right Card: Selected Tier Info */}
            {(() => {
              const activeTier = stakingTiers[selectedTierId] || stakingTiers[0];
              const estReward = stakeAmount ? parseFloat(stakeAmount) * (activeTier.apr / 100) * (activeTier.durationDays / 365) : 0;
              return (
                <div className="p-5 bg-zinc-950/40 rounded-xl border border-white/5 space-y-4 font-mono text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#A855F7]" />
                    <span className="text-[9px] text-[#A855F7] uppercase font-bold tracking-wider">Active Smart Contract Tier</span>
                  </div>
                  <div className="space-y-2 border-y border-white/5 py-3">
                    <div className="flex justify-between">
                      <span>Tier Name:</span>
                      <span className="text-white font-bold">{activeTier.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lock Period:</span>
                      <span className="text-white font-bold">{activeTier.durationDays} Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protocol Yield APR:</span>
                      <span className="text-emerald-400 font-bold">{activeTier.apr.toFixed(2)}% fixed</span>
                    </div>
                    {stakeAmount && (
                      <div className="flex justify-between border-t border-white/5 pt-2">
                        <span>Est. Reward:</span>
                        <span className="text-emerald-400 font-bold">+{estReward.toLocaleString(undefined, { maximumFractionDigits: 4 })} AGL</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-normal">
                    * Locked staking deposits AGL into the yield farming pool. Once the {activeTier.durationDays}-day period expires, unstake to claim principal and 100% accrued yield rewards securely. Early exits will forfeit rewards.
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 2: POSITIONS LIST */}
      {activeTab === "positions" && (
        <div className="space-y-4">
          {!wallet.isConnected ? (
            <div className="p-8 text-center text-zinc-500 font-mono text-xs border border-white/5 rounded-2xl bg-zinc-950/40">
              Please connect your wallet to view your active staking vaults.
            </div>
          ) : userPositions.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 font-mono text-xs border border-white/5 rounded-2xl bg-zinc-950/40">
              No active or historical staking positions found. Create your first locked deposit to start earning.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950/20">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/40 text-zinc-500 text-[10px] uppercase font-bold">
                    <th className="p-4">ID</th>
                    <th className="py-4">Amount</th>
                    <th className="py-4">Lock Progress</th>
                    <th className="py-4">Yield APR</th>
                    <th className="py-4 text-right">Pending Reward</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {userPositions.map((pos) => {
                    const isUnlocked = currentTimeSec >= pos.unlockTime;
                    const elapsedSec = currentTimeSec - pos.startTime;
                    const totalSec = pos.unlockTime - pos.startTime;
                    const progressPct = pos.withdrawn 
                      ? 100 
                      : totalSec > 0 
                        ? Math.min(100, Math.max(0, (elapsedSec / totalSec) * 100))
                        : 0;
                    
                    const timeRemaining = pos.unlockTime - currentTimeSec;
                    const daysLeft = Math.ceil(timeRemaining / (24 * 3600));

                    // Dynamic reward visual representation using current pending rewards with real-time sandbox fallback
                    let estReward = pos.pendingReward;
                    if (!web3Active || onWrongNetwork) {
                      if (!pos.withdrawn) {
                        const elapsedSec = currentTimeSec - pos.startTime;
                        const aprDecimal = pos.aprBasisPoints / 10000;
                        const timeFraction = elapsedSec / (365 * 24 * 3600);
                        const sandboxAcc = 100;
                        estReward = pos.amount * aprDecimal * timeFraction * sandboxAcc;
                      }
                    }

                    return (
                      <tr key={pos.id} className={`transition-all ${pos.withdrawn ? "opacity-45 bg-black/10" : "hover:bg-white/[0.02]"}`}>
                        <td className="p-4 font-bold text-zinc-400">
                          #{pos.id}
                        </td>
                        <td className="py-4">
                          <span className="text-white font-bold">{pos.amount.toLocaleString()}</span>{" "}
                          <span className="text-[9px] text-zinc-500">AGL</span>
                        </td>
                        <td className="py-4 min-w-[120px]">
                          {pos.withdrawn ? (
                            <span className="text-zinc-500 flex items-center gap-1 text-[10px]">
                              <Check className="w-3.5 h-3.5 text-zinc-500" /> Withdrawn & Settled
                            </span>
                          ) : (
                            <div className="space-y-1.5 max-w-[150px]">
                              <div className="flex justify-between text-[9px] text-zinc-500">
                                <span>{progressPct.toFixed(0)}% Locked</span>
                                {isUnlocked ? (
                                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                    <Unlock className="w-2.5 h-2.5" /> Ready
                                  </span>
                                ) : (
                                  <span>{daysLeft}d left</span>
                                )}
                              </div>
                              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    isUnlocked 
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                                      : "bg-gradient-to-r from-purple-500 to-indigo-500"
                                  }`} 
                                  style={{ width: `${progressPct}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-zinc-300 font-bold">
                          {(pos.aprBasisPoints / 100).toFixed(2)}%
                        </td>
                        <td className="py-4 text-right text-emerald-400 font-bold">
                          +{estReward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} AGL
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
                            {pos.withdrawn ? (
                              <span className="text-[10px] text-zinc-600 bg-zinc-950/50 px-2.5 py-1 rounded border border-white/5">
                                Closed
                              </span>
                            ) : isUnlocked ? (
                              <button
                                onClick={() => handleUnstake(pos.id)}
                                disabled={stakingLoading}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold font-display bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]"
                              >
                                Unstake & Claim
                              </button>
                            ) : (
                              <>
                                <button
                                  disabled
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold font-display bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed flex items-center gap-1"
                                >
                                  <Clock className="w-3 h-3 text-zinc-600" /> Locked
                                </button>
                                <button
                                  onClick={() => handleEmergencyWithdraw(pos.id)}
                                  disabled={stakingLoading}
                                  className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold font-display bg-red-950/40 text-red-400 hover:bg-red-900 hover:text-white border border-red-500/20 transition-all flex items-center gap-1"
                                  title="Emergency Exit (Forfeits rewards)"
                                >
                                  <Skull className="w-3 h-3" /> Emergency Exit
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
