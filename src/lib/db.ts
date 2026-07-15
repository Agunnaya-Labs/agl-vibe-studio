import { Token, NFTCollection, DAO, GameFiProject, AIAgent, WalletState, Activity, StakingPool, ReferralRecord, ReferralPayout } from "../types";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, auth } from "./firebase";

// EXACT BONDING CURVE MATH
export const BASE_PRICE = 0.000001; // 1e-6 ETH per token
export const SLOPE = 0.000000000001; // 1e-12 ETH per token of supply

// Reserve at supply s: R(s) = BASE_PRICE * s + (SLOPE * s^2) / 2
export function getReserveAtSupply(supply: number): number {
  return BASE_PRICE * supply + (SLOPE * supply * supply) / 2;
}

// Spot price at supply s: P(s) = BASE_PRICE + SLOPE * s
export function getSpotPrice(supply: number): number {
  return BASE_PRICE + SLOPE * supply;
}

// Buy formula: returns tokens minted (x) for given ethSent (after 1% fee)
export function getTokensForEth(currentSupply: number, ethSent: number): number {
  const ethForReserve = ethSent * 0.99; // 1% creator fee
  const B = BASE_PRICE + SLOPE * currentSupply;
  const discriminant = B * B + 2 * SLOPE * ethForReserve;
  if (discriminant < 0) return 0;
  return (Math.sqrt(discriminant) - B) / SLOPE;
}

// Cost of buying x tokens: gross = R(s + x) - R(s)
export function getEthCostForTokens(currentSupply: number, tokensToBuy: number): { gross: number; fee: number; total: number } {
  const reserveAfter = getReserveAtSupply(currentSupply + tokensToBuy);
  const reserveBefore = getReserveAtSupply(currentSupply);
  const gross = Math.max(0, reserveAfter - reserveBefore);
  const fee = gross * 0.01;
  const total = gross + fee;
  return { gross, fee, total };
}

// Sell return: returns ETH returned (net after 1% fee) for selling x tokens
export function getEthReturnForTokens(currentSupply: number, tokensToSell: number): { gross: number; fee: number; net: number } {
  const tokensToBurn = Math.min(currentSupply, tokensToSell);
  const reserveBefore = getReserveAtSupply(currentSupply);
  const reserveAfter = getReserveAtSupply(currentSupply - tokensToBurn);
  const gross = Math.max(0, reserveBefore - reserveAfter);
  const fee = gross * 0.01;
  const net = gross - fee;
  return { gross, fee, net };
}

// EMPTY DEFAULTS - All data now sourced from Firebase in production
// These are fallback values only when Firestore is unavailable
const EMPTY_WALLET: WalletState = {
  isConnected: false,
  address: "",
  balanceEth: 0,
  walletType: null,
  isSmartAccount: false,
  sponsoredGasEth: 0,
  aglTokenBalance: 0
};

// PERSISTENCE WRAPPER
export class AgunnayaDatabase {
  // Async methods to fetch real data from Firestore
  static async fetchTokensAsync(): Promise<Token[]> {
    try {
      const tokenSnap = await getDocs(collection(db, "tokens"));
      const tokens: Token[] = [];
      tokenSnap.forEach(doc => tokens.push(doc.data() as Token));
      return tokens;
    } catch (err) {
      console.warn("Failed to fetch tokens from Firestore:", err);
      return [];
    }
  }

  static async fetchNFTsAsync(): Promise<NFTCollection[]> {
    try {
      const nftSnap = await getDocs(collection(db, "nfts"));
      const nfts: NFTCollection[] = [];
      nftSnap.forEach(doc => nfts.push(doc.data() as NFTCollection));
      return nfts;
    } catch (err) {
      console.warn("Failed to fetch NFTs from Firestore:", err);
      return [];
    }
  }

  static async fetchDAOsAsync(): Promise<DAO[]> {
    try {
      const daoSnap = await getDocs(collection(db, "daos"));
      const daos: DAO[] = [];
      daoSnap.forEach(doc => daos.push(doc.data() as DAO));
      return daos;
    } catch (err) {
      console.warn("Failed to fetch DAOs from Firestore:", err);
      return [];
    }
  }

  static async fetchGameFiAsync(): Promise<GameFiProject[]> {
    try {
      const gamefiSnap = await getDocs(collection(db, "gamefi"));
      const gamefi: GameFiProject[] = [];
      gamefiSnap.forEach(doc => gamefi.push(doc.data() as GameFiProject));
      return gamefi;
    } catch (err) {
      console.warn("Failed to fetch GameFi projects from Firestore:", err);
      return [];
    }
  }

  static async fetchAgentsAsync(): Promise<AIAgent[]> {
    try {
      const agentSnap = await getDocs(collection(db, "agents"));
      const agents: AIAgent[] = [];
      agentSnap.forEach(doc => agents.push(doc.data() as AIAgent));
      return agents;
    } catch (err) {
      console.warn("Failed to fetch AI Agents from Firestore:", err);
      return [];
    }
  }

  static async fetchStakingAsync(): Promise<StakingPool[]> {
    try {
      const stakingSnap = await getDocs(collection(db, "staking"));
      const staking: StakingPool[] = [];
      stakingSnap.forEach(doc => staking.push(doc.data() as StakingPool));
      return staking;
    } catch (err) {
      console.warn("Failed to fetch staking pools from Firestore:", err);
      return [];
    }
  }

  static async fetchActivitiesAsync(): Promise<Activity[]> {
    try {
      const actSnap = await getDocs(collection(db, "activities"));
      const activities: Activity[] = [];
      actSnap.forEach(doc => activities.push(doc.data() as Activity));
      return activities.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.warn("Failed to fetch activities from Firestore:", err);
      return [];
    }
  }

  static async saveToFirestore(collectionName: string, docId: string, data: any) {
    if (!auth.currentUser) {
      // Passive local-only mode when not signed in with Google
      return;
    }
    try {
      await setDoc(doc(db, collectionName, docId), data);
    } catch (err) {
      console.warn(`Firestore save to ${collectionName}/${docId} failed:`, err);
      // Fail-fast context helper if authorized
      try {
        handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${docId}`);
      } catch (e) {
        console.error("Firestore rule validation error details: ", e);
      }
    }
  }

  static async syncAllFromFirestore() {
    try {
      // 1. Sync Tokens
      const tokenSnap = await getDocs(collection(db, "tokens"));
      if (!tokenSnap.empty) {
        const firestoreTokens: Token[] = [];
        tokenSnap.forEach(doc => firestoreTokens.push(doc.data() as Token));
        const localTokens = this.getTokens();
        const merged = [...localTokens];
        firestoreTokens.forEach(ft => {
          const idx = merged.findIndex(t => t.address.toLowerCase() === ft.address.toLowerCase());
          if (idx !== -1) {
            merged[idx] = ft;
          } else {
            merged.push(ft);
          }
        });
        localStorage.setItem("agl_tokens", JSON.stringify(merged));
      }

      // 2. Sync NFTs
      const nftsSnap = await getDocs(collection(db, "nfts"));
      if (!nftsSnap.empty) {
        const firestoreNFTs: NFTCollection[] = [];
        nftsSnap.forEach(doc => firestoreNFTs.push(doc.data() as NFTCollection));
        const localNFTs = this.getNFTs();
        const merged = [...localNFTs];
        firestoreNFTs.forEach(fn => {
          const idx = merged.findIndex(n => n.contractAddress.toLowerCase() === fn.contractAddress.toLowerCase());
          if (idx !== -1) {
            merged[idx] = fn;
          } else {
            merged.push(fn);
          }
        });
        localStorage.setItem("agl_nfts", JSON.stringify(merged));
      }

      // 3. Sync DAOs
      const daosSnap = await getDocs(collection(db, "daos"));
      if (!daosSnap.empty) {
        const firestoreDAOs: DAO[] = [];
        daosSnap.forEach(doc => firestoreDAOs.push(doc.data() as DAO));
        const localDAOs = this.getDAOs();
        const merged = [...localDAOs];
        firestoreDAOs.forEach(fd => {
          const idx = merged.findIndex(d => d.contractAddress.toLowerCase() === fd.contractAddress.toLowerCase());
          if (idx !== -1) {
            merged[idx] = fd;
          } else {
            merged.push(fd);
          }
        });
        localStorage.setItem("agl_daos", JSON.stringify(merged));
      }

      // 4. Sync GameFi
      const gamefiSnap = await getDocs(collection(db, "gamefi"));
      if (!gamefiSnap.empty) {
        const firestoreGamefi: GameFiProject[] = [];
        gamefiSnap.forEach(doc => firestoreGamefi.push(doc.data() as GameFiProject));
        const localGamefi = this.getGameFi();
        const merged = [...localGamefi];
        firestoreGamefi.forEach(fg => {
          const idx = merged.findIndex(g => g.contractAddress.toLowerCase() === fg.contractAddress.toLowerCase());
          if (idx !== -1) {
            merged[idx] = fg;
          } else {
            merged.push(fg);
          }
        });
        localStorage.setItem("agl_gamefi", JSON.stringify(merged));
      }

      // 5. Sync Agents
      const agentsSnap = await getDocs(collection(db, "agents"));
      if (!agentsSnap.empty) {
        const firestoreAgents: AIAgent[] = [];
        agentsSnap.forEach(doc => firestoreAgents.push(doc.data() as AIAgent));
        const localAgents = this.getAgents();
        const merged = [...localAgents];
        firestoreAgents.forEach(fa => {
          const idx = merged.findIndex(a => a.id.toLowerCase() === fa.id.toLowerCase());
          if (idx !== -1) {
            merged[idx] = fa;
          } else {
            merged.push(fa);
          }
        });
        localStorage.setItem("agl_agents", JSON.stringify(merged));
      }

      // 6. Sync Staking
      const stakingSnap = await getDocs(collection(db, "staking"));
      if (!stakingSnap.empty) {
        const firestoreStaking: StakingPool[] = [];
        stakingSnap.forEach(doc => firestoreStaking.push(doc.data() as StakingPool));
        const localStaking = this.getStaking();
        const merged = [...localStaking];
        firestoreStaking.forEach(fs => {
          const idx = merged.findIndex(s => s.id.toLowerCase() === fs.id.toLowerCase());
          if (idx !== -1) {
            merged[idx] = fs;
          } else {
            merged.push(fs);
          }
        });
        localStorage.setItem("agl_staking", JSON.stringify(merged));
      }

      // 7. Sync Activities
      const actSnap = await getDocs(collection(db, "activities"));
      if (!actSnap.empty) {
        const firestoreAct: Activity[] = [];
        actSnap.forEach(doc => firestoreAct.push(doc.data() as Activity));
        const localAct = this.getActivities();
        const merged = [...localAct];
        firestoreAct.forEach(fa => {
          const idx = merged.findIndex(a => a.id.toLowerCase() === fa.id.toLowerCase());
          if (idx !== -1) {
            merged[idx] = fa;
          } else {
            merged.push(fa);
          }
        });
        localStorage.setItem("agl_activities", JSON.stringify(merged));
      }

      // 8. Sync Referrals
      const refSnap = await getDocs(collection(db, "referrals"));
      if (!refSnap.empty) {
        const firestoreRef: ReferralRecord[] = [];
        refSnap.forEach(doc => firestoreRef.push(doc.data() as ReferralRecord));
        const localRef = this.getReferralRecords();
        const merged = [...localRef];
        firestoreRef.forEach(fr => {
          const idx = merged.findIndex(r => r.ownerAddress.toLowerCase() === fr.ownerAddress.toLowerCase());
          if (idx !== -1) {
            merged[idx] = fr;
          } else {
            merged.push(fr);
          }
        });
        localStorage.setItem("agl_referral_records", JSON.stringify(merged));
      }

      return true;
    } catch (err) {
      console.error("Firestore initial sync failed:", err);
      return false;
    }
  }

  static getTokens(): Token[] {
    const data = localStorage.getItem("agl_tokens");
    return data ? JSON.parse(data) : [];
  }

  static saveTokens(tokens: Token[]) {
    localStorage.setItem("agl_tokens", JSON.stringify(tokens));
    tokens.forEach(t => {
      this.saveToFirestore("tokens", t.address, t);
    });
  }

  static getNFTs(): NFTCollection[] {
    const data = localStorage.getItem("agl_nfts");
    return data ? JSON.parse(data) : [];
  }

  static saveNFTs(nfts: NFTCollection[]) {
    localStorage.setItem("agl_nfts", JSON.stringify(nfts));
    nfts.forEach(n => {
      this.saveToFirestore("nfts", n.contractAddress, n);
    });
  }

  static getDAOs(): DAO[] {
    const data = localStorage.getItem("agl_daos");
    return data ? JSON.parse(data) : [];
  }

  static saveDAOs(daos: DAO[]) {
    localStorage.setItem("agl_daos", JSON.stringify(daos));
    daos.forEach(d => {
      this.saveToFirestore("daos", d.contractAddress, d);
    });
  }

  static getGameFi(): GameFiProject[] {
    const data = localStorage.getItem("agl_gamefi");
    return data ? JSON.parse(data) : [];
  }

  static saveGameFi(gamefi: GameFiProject[]) {
    localStorage.setItem("agl_gamefi", JSON.stringify(gamefi));
    gamefi.forEach(g => {
      this.saveToFirestore("gamefi", g.contractAddress, g);
    });
  }

  static getAgents(): AIAgent[] {
    const data = localStorage.getItem("agl_agents");
    return data ? JSON.parse(data) : [];
  }

  static saveAgents(agents: AIAgent[]) {
    localStorage.setItem("agl_agents", JSON.stringify(agents));
    agents.forEach(a => {
      this.saveToFirestore("agents", a.id, a);
    });
  }

  static getStaking(): StakingPool[] {
    const data = localStorage.getItem("agl_staking");
    return data ? JSON.parse(data) : [];
  }

  static saveStaking(pools: StakingPool[]) {
    localStorage.setItem("agl_staking", JSON.stringify(pools));
    pools.forEach(p => {
      this.saveToFirestore("staking", p.id, p);
    });
  }

  static getWallet(): WalletState {
    const data = localStorage.getItem("agl_wallet");
    return data ? JSON.parse(data) : EMPTY_WALLET;
  }

  static saveWallet(wallet: WalletState) {
    localStorage.setItem("agl_wallet", JSON.stringify(wallet));
  }

  static getActivities(): Activity[] {
    const data = localStorage.getItem("agl_activities");
    if (!data) return [];
    return JSON.parse(data).sort((a: Activity, b: Activity) => b.timestamp - a.timestamp);
  }

  static saveActivities(activities: Activity[]) {
    localStorage.setItem("agl_activities", JSON.stringify(activities));
    activities.forEach(a => {
      this.saveToFirestore("activities", a.id, a);
    });
  }

  static addActivity(activity: Omit<Activity, "id" | "timestamp">) {
    const list = this.getActivities();
    const newAct: Activity = {
      ...activity,
      id: "act_" + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    list.unshift(newAct);
    this.saveActivities(list);
  }

  // REFERRAL ENGINE SUPPORT
  static getActiveReferrer(): string | null {
    return localStorage.getItem("agl_visitor_referrer");
  }

  static setActiveReferrer(referrer: string) {
    localStorage.setItem("agl_visitor_referrer", referrer);
  }

  static getReferralRecords(): ReferralRecord[] {
    const data = localStorage.getItem("agl_referral_records");
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  }

  static saveReferralRecords(records: ReferralRecord[]) {
    localStorage.setItem("agl_referral_records", JSON.stringify(records));
    records.forEach(r => {
      this.saveToFirestore("referrals", r.ownerAddress, r);
    });
  }

  static getReferralRecord(address: string): ReferralRecord {
    if (!address) {
      return {
        code: "",
        ownerAddress: "",
        totalReferredCount: 0,
        totalFeesGeneratedEth: 0,
        unclaimedRewardsAgl: 0,
        claimedRewardsAgl: 0
      };
    }
    const records = this.getReferralRecords();
    let record = records.find(r => r.ownerAddress.toLowerCase() === address.toLowerCase());
    if (!record) {
      // Create a default code: e.g. first 6 chars of address or "ref_" + random
      const randomCode = "agl_" + address.slice(2, 8).toLowerCase();
      record = {
        code: randomCode,
        ownerAddress: address,
        totalReferredCount: 0,
        totalFeesGeneratedEth: 0,
        unclaimedRewardsAgl: 0,
        claimedRewardsAgl: 0
      };
      records.push(record);
      this.saveReferralRecords(records);
    }
    return record;
  }

  static updateReferralRecord(record: ReferralRecord) {
    const records = this.getReferralRecords();
    const index = records.findIndex(r => r.ownerAddress.toLowerCase() === record.ownerAddress.toLowerCase());
    if (index !== -1) {
      records[index] = record;
    } else {
      records.push(record);
    }
    this.saveReferralRecords(records);
  }

  static resolveReferralCode(code: string): string | null {
    if (!code) return null;
    const cleanCode = code.trim().toLowerCase();
    
    // Check if it is directly an address
    if (cleanCode.startsWith("0x") && cleanCode.length === 42) {
      return cleanCode;
    }

    const records = this.getReferralRecords();
    const found = records.find(r => r.code.toLowerCase() === cleanCode);
    if (found) {
      return found.ownerAddress;
    }
    return null;
  }

  static registerReferral(referredAddress: string, codeOrAddress: string): string | null {
    const referrerAddress = this.resolveReferralCode(codeOrAddress);
    if (!referrerAddress) return null;
    if (referrerAddress.toLowerCase() === referredAddress.toLowerCase()) return null; // cannot refer oneself

    // Check if user is already referred
    const registeredKey = `agl_referred_by_${referredAddress.toLowerCase()}`;
    if (localStorage.getItem(registeredKey)) {
      return localStorage.getItem(registeredKey); // already referred
    }

    localStorage.setItem(registeredKey, referrerAddress);
    
    // Update referrer's referred count
    const record = this.getReferralRecord(referrerAddress);
    record.totalReferredCount += 1;
    this.updateReferralRecord(record);

    return referrerAddress;
  }

  static getReferrerOf(address: string): string | null {
    if (!address) return null;
    return localStorage.getItem(`agl_referred_by_${address.toLowerCase()}`);
  }

  static getPayouts(): ReferralPayout[] {
    const data = localStorage.getItem("agl_referral_payouts");
    if (!data) return [];
    return JSON.parse(data);
  }

  static savePayouts(payouts: ReferralPayout[]) {
    localStorage.setItem("agl_referral_payouts", JSON.stringify(payouts));
  }

  static getReferralPayouts(referrerAddress: string): ReferralPayout[] {
    const payouts = this.getPayouts();
    return payouts.filter(p => p.id.startsWith(referrerAddress.toLowerCase() + "_"));
  }

  static addReferralPayout(referredUser: string, txType: string, feeEth: number) {
    const referrer = this.getReferrerOf(referredUser);
    if (!referrer) return;

    // Get current AGL price to calculate exact token reward
    const tokens = this.getTokens();
    const aglToken = tokens.find(t => t.symbol === "AGL");
    const aglPrice = aglToken ? aglToken.currentPrice : 0.000001; // fallback price

    // 20% of the platform fee goes to the referrer
    const rewardEth = feeEth * 0.20;
    // convert reward to AGL tokens
    const rewardAgl = Math.floor((rewardEth / aglPrice) * 100) / 100; // 2 decimal precision

    if (rewardAgl <= 0) return;

    // Save payout history
    const payouts = this.getPayouts();
    const newPayout: ReferralPayout = {
      id: `${referrer.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
      referredUser,
      txType,
      feeEth,
      rewardAgl,
      timestamp: Date.now()
    };
    payouts.unshift(newPayout);
    this.savePayouts(payouts);

    // Update referrer record
    const record = this.getReferralRecord(referrer);
    record.totalFeesGeneratedEth += feeEth;
    record.unclaimedRewardsAgl += rewardAgl;
    this.updateReferralRecord(record);

    // Add general activity for the referrer
    this.addActivity({
      type: "referral",
      tokenSymbol: "AGL",
      tokenAddress: aglToken ? aglToken.address : "",
      user: referrer,
      amount: rewardAgl,
      ethValue: rewardEth,
      details: `Earned +${rewardAgl.toLocaleString()} AGL referral fee share from 0x${referredUser.slice(2, 6)}...'s ${txType}`
    });
  }

  static claimReferralRewards(address: string): { success: boolean; claimedAmount: number } {
    const record = this.getReferralRecord(address);
    const amount = record.unclaimedRewardsAgl;
    if (amount <= 0) {
      return { success: false, claimedAmount: 0 };
    }

    // Update record
    record.claimedRewardsAgl += amount;
    record.unclaimedRewardsAgl = 0;
    this.updateReferralRecord(record);

    // Add AGL to wallet balance
    const wallet = this.getWallet();
    wallet.aglTokenBalance += amount;
    this.saveWallet(wallet);

    return { success: true, claimedAmount: amount };
  }

  static resetDatabase() {
    localStorage.removeItem("agl_tokens");
    localStorage.removeItem("agl_nfts");
    localStorage.removeItem("agl_daos");
    localStorage.removeItem("agl_gamefi");
    localStorage.removeItem("agl_agents");
    localStorage.removeItem("agl_staking");
    localStorage.removeItem("agl_wallet");
    localStorage.removeItem("agl_activities");
    localStorage.removeItem("agl_referral_records");
    localStorage.removeItem("agl_referral_payouts");
    localStorage.removeItem("agl_visitor_referrer");
  }
}
