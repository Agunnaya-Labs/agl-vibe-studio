/**
 * Custom hook for managing app initialization lifecycle.
 * Handles Firebase sync, Firestore listeners, referral code parsing, and initial data load.
 */

import { useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Activity } from "../types";
import { useStudioStore } from "../lib/store";
import { AgunnayaDatabase } from "../lib/db";
import { CONFIG } from "../lib/config";

export function useAppInitialization() {
  const {
    wallet,
    mergeActivities,
    refreshAllData,
    addTerminalLog,
    showToast,
  } = useStudioStore();

  useEffect(() => {
    // Initial data refresh
    refreshAllData();

    // Perform initial community sync from Firestore
    AgunnayaDatabase.syncAllFromFirestore().then((success) => {
      if (success) {
        addTerminalLog("success", "CLOUD SYNC: Community database updated from Firestore!");
        refreshAllData();
      }
    });

    // Real-time Firestore activity subscription
    let unsubActivities: (() => void) | null = null;
    try {
      const actQ = query(
        collection(db, CONFIG.FIRESTORE.COLLECTION_NAMES.ACTIVITIES),
        orderBy("timestamp", "desc"),
        limit(CONFIG.FIRESTORE.ACTIVITIES_LIMIT)
      );
      unsubActivities = onSnapshot(
        actQ,
        (snap) => {
          if (snap.empty) return;
          const firestoreActs = snap.docs.map((d) => d.data() as Activity);
          mergeActivities(firestoreActs);
        },
        (error) => {
          addTerminalLog(
            "info",
            `FIRESTORE: Real-time activity sync unavailable. ${error.message}`
          );
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addTerminalLog(
        "info",
        `FIRESTORE_SETUP: Activity listener initialization failed. ${errorMessage}`
      );
    }

    // Parse and handle referral code from URL
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) {
      AgunnayaDatabase.setActiveReferrer(refCode);
      showToast(`Referral invitation active (Ref: ${refCode})`, "info");
      addTerminalLog(
        "system",
        `REFERRAL_DETECTED: Active invite code ${refCode} stored in session.`
      );

      // If wallet is already connected, register referral immediately
      const currentWallet = AgunnayaDatabase.getWallet();
      if (currentWallet && currentWallet.isConnected) {
        const actualReferrer = AgunnayaDatabase.registerReferral(
          currentWallet.address,
          refCode
        );
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
    }

    // Cleanup on unmount
    return () => {
      unsubActivities?.();
    };
  }, [refreshAllData, addTerminalLog, showToast, mergeActivities]);

  // Sync wallet balances when wallet connection changes
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      // Balances are already fetched during connection
      // This effect mainly serves as a dependency trigger for other operations
    }
  }, [wallet.isConnected, wallet.address]);
}
