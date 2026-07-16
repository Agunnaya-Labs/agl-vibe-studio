/**
 * Centralized Zustand store for managing all global application state.
 * This replaces scattered useState calls and provides atomic state updates.
 */

import { create } from "zustand";
import { User } from "firebase/auth";
import { WalletState, Token, NFTCollection, DAO, GameFiProject, AIAgent, Activity } from "../types";
import { TerminalLine } from "../components/TerminalLog";
import { AgunnayaDatabase } from "./db";

interface StudioStore {
  // UI State
  isLaunched: boolean;
  currentTab: string;
  selectedToken: Token | null;
  network: "sepolia" | "mainnet";
  isWalletModalOpen: boolean;
  isAIDrawerOpen: boolean;

  // Auth State
  firebaseUser: User | null;
  isAuthLoading: boolean;
  driveAccessToken: string | null;

  // Wallet & Financial Data
  wallet: WalletState;
  tokens: Token[];
  nfts: NFTCollection[];
  daos: DAO[];
  games: GameFiProject[];
  agents: AIAgent[];
  activities: Activity[];

  // Terminal & Notifications
  terminalLogs: TerminalLine[];
  toast: { message: string; type: "success" | "error" | "info" } | null;

  // UI Actions
  setIsLaunched: (value: boolean) => void;
  setCurrentTab: (tab: string) => void;
  setSelectedToken: (token: Token | null) => void;
  setNetwork: (network: "sepolia" | "mainnet") => void;
  setIsWalletModalOpen: (value: boolean) => void;
  setIsAIDrawerOpen: (value: boolean) => void;

  // Auth Actions
  setFirebaseUser: (user: User | null) => void;
  setIsAuthLoading: (value: boolean) => void;
  setDriveAccessToken: (token: string | null) => void;

  // Wallet & Financial Actions
  setWallet: (wallet: WalletState) => void;
  setTokens: (tokens: Token[]) => void;
  setNfts: (nfts: NFTCollection[]) => void;
  setDaos: (daos: DAO[]) => void;
  setGames: (games: GameFiProject[]) => void;
  setAgents: (agents: AIAgent[]) => void;
  setActivities: (activities: Activity[]) => void;

  // Terminal & Toast Actions
  addTerminalLog: (type: TerminalLine["type"], text: string) => void;
  clearTerminalLogs: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  dismissToast: () => void;

  // Atomic Operations
  refreshAllData: () => void;
  mergeActivities: (firestoreActivities: Activity[]) => void;
  updateWalletBalance: (balanceEth: number, aglBalance: number) => void;
}

export const useStudioStore = create<StudioStore>((set, get) => ({
  // Initial UI State
  isLaunched: false,
  currentTab: "dashboard",
  selectedToken: null,
  network: "sepolia",
  isWalletModalOpen: false,
  isAIDrawerOpen: false,

  // Initial Auth State
  firebaseUser: null,
  isAuthLoading: true,
  driveAccessToken: null,

  // Initial Wallet & Financial Data
  wallet: AgunnayaDatabase.getWallet(),
  tokens: [],
  nfts: [],
  daos: [],
  games: [],
  agents: [],
  activities: [],

  // Initial Terminal & Notifications
  terminalLogs: [
    { type: "system", text: "AGUNNAYA_CORE: System booting successfully..." },
    { type: "system", text: "AGUNNAYA_CORE: Linear bonding curve mathematical model verified." },
    { type: "info", text: "Connected to simulated Base Sepolia nodes. Network status: online." },
  ],
  toast: null,

  // UI Actions
  setIsLaunched: (value) => set({ isLaunched: value }),
  setCurrentTab: (tab) => set({ currentTab: tab }),
  setSelectedToken: (token) => set({ selectedToken: token }),
  setNetwork: (network) => set({ network }),
  setIsWalletModalOpen: (value) => set({ isWalletModalOpen: value }),
  setIsAIDrawerOpen: (value) => set({ isAIDrawerOpen: value }),

  // Auth Actions
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setIsAuthLoading: (value) => set({ isAuthLoading: value }),
  setDriveAccessToken: (token) => set({ driveAccessToken: token }),

  // Wallet & Financial Actions
  setWallet: (wallet) => set({ wallet }),
  setTokens: (tokens) => set({ tokens }),
  setNfts: (nfts) => set({ nfts }),
  setDaos: (daos) => set({ daos }),
  setGames: (games) => set({ games }),
  setAgents: (agents) => set({ agents }),
  setActivities: (activities) => set({ activities }),

  // Terminal & Toast Actions
  addTerminalLog: (type, text) =>
    set((state) => ({
      terminalLogs: [...state.terminalLogs, { type, text }].slice(-1000), // Keep last 1000 logs
    })),

  clearTerminalLogs: () => set({ terminalLogs: [] }),

  showToast: (message, type) => set({ toast: { message, type } }),

  dismissToast: () => set({ toast: null }),

  // Atomic Operations
  refreshAllData: () => {
    set({
      wallet: AgunnayaDatabase.getWallet(),
      tokens: AgunnayaDatabase.getTokens(),
      nfts: AgunnayaDatabase.getNFTs(),
      daos: AgunnayaDatabase.getDAOs(),
      games: AgunnayaDatabase.getGameFi(),
      agents: AgunnayaDatabase.getAgents(),
      activities: AgunnayaDatabase.getActivities().reverse(), // newest first
    });
  },

  mergeActivities: (firestoreActivities) => {
    set((state) => {
      const localOnly = state.activities.filter(
        (a) => !firestoreActivities.find((fa) => fa.id === a.id)
      );
      return {
        activities: [...firestoreActivities, ...localOnly].sort(
          (a, b) => b.timestamp - a.timestamp
        ),
      };
    });
  },

  updateWalletBalance: (balanceEth, aglBalance) => {
    const currentWallet = get().wallet;
    const updatedWallet: WalletState = {
      ...currentWallet,
      balanceEth,
      aglTokenBalance: aglBalance,
    };
    AgunnayaDatabase.saveWallet(updatedWallet);
    set({ wallet: updatedWallet });
  },
}));

/**
 * Custom hook for subscribing to specific slices of store state
 * Usage: const isLaunched = useStudioStore(state => state.isLaunched)
 */
export type StudioStoreState = ReturnType<typeof useStudioStore.getState>;
