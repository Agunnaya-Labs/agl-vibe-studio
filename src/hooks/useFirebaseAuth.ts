/**
 * Custom hook for managing Firebase authentication lifecycle.
 * Handles login, logout, and auth state changes with proper error handling and logging.
 */

import { useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useStudioStore } from "../lib/store";
import { CONFIG } from "../lib/config";
import { AgunnayaDatabase } from "../lib/db";

export function useFirebaseAuth() {
  const {
    setFirebaseUser,
    setIsAuthLoading,
    setDriveAccessToken,
    refreshAllData,
    addTerminalLog,
    showToast,
  } = useStudioStore();

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      setIsAuthLoading(false);

      if (user) {
        addTerminalLog(
          "success",
          `FIREBASE AUTH: Logged in as ${user.displayName || user.email}`
        );
      } else {
        addTerminalLog(
          "info",
          "FIREBASE AUTH: Cloud synchronization passive. Connect Google Account to enable shared state."
        );
      }
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setIsAuthLoading, addTerminalLog]);

  const handleSignInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      CONFIG.GOOGLE.SCOPES.forEach((scope) => provider.addScope(scope));

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        setDriveAccessToken(credential.accessToken);
        addTerminalLog(
          "success",
          "GOOGLE_DRIVE: Google Drive access token loaded and cached in-memory."
        );
      }

      showToast(`Welcome, ${result.user.displayName}! Cloud Sync active.`, "success");
      
      // Re-sync on log in
      await AgunnayaDatabase.syncAllFromFirestore();
      refreshAllData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast("Google Sign-In failed.", "error");
      addTerminalLog("error", `AUTH_ERROR: ${errorMessage}`);
    }
  };

  const handleAuthorizeDrive = async () => {
    try {
      const provider = new GoogleAuthProvider();
      CONFIG.GOOGLE.SCOPES.forEach((scope) => provider.addScope(scope));

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        setDriveAccessToken(credential.accessToken);
        showToast("Google Drive authorized successfully!", "success");
        addTerminalLog(
          "success",
          "GOOGLE_DRIVE: Connection verified. Cloud snapshot storage authorized."
        );
      } else {
        throw new Error("No OAuth access token was returned.");
      }

      await AgunnayaDatabase.syncAllFromFirestore();
      refreshAllData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast("Google Drive authorization failed.", "error");
      addTerminalLog("error", `DRIVE_AUTH_ERROR: ${errorMessage}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setDriveAccessToken(null);
      showToast("Signed out of Google account.", "info");
      refreshAllData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast("Google Sign-Out failed.", "error");
      addTerminalLog("error", `SIGNOUT_ERROR: ${errorMessage}`);
    }
  };

  return {
    handleSignInWithGoogle,
    handleAuthorizeDrive,
    handleSignOut,
  };
}
