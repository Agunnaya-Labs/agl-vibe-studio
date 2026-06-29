import { useEffect, useCallback } from 'react';
import { AgunnayaDatabase } from '../lib/db';
import { errorHandler, ErrorCodes } from '../lib/errorHandler';

interface DataInitializationState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to initialize data from Firebase on app startup
 * Fetches all collections asynchronously and updates cache
 */
export function useDataInitialization(
  onDataLoaded: () => void,
  onError?: (error: string) => void
): DataInitializationState {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const initializeData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[v0] Starting Firebase data initialization...');

      // Fetch all collections in parallel
      const [tokens, nfts, daos, gamefi, agents, staking, activities] = await Promise.all([
        AgunnayaDatabase.fetchTokensAsync(),
        AgunnayaDatabase.fetchNFTsAsync(),
        AgunnayaDatabase.fetchDAOsAsync(),
        AgunnayaDatabase.fetchGameFiAsync(),
        AgunnayaDatabase.fetchAgentsAsync(),
        AgunnayaDatabase.fetchStakingAsync(),
        AgunnayaDatabase.fetchActivitiesAsync(),
      ]);

      console.log('[v0] Firebase data loaded:', {
        tokens: tokens.length,
        nfts: nfts.length,
        daos: daos.length,
        gamefi: gamefi.length,
        agents: agents.length,
        staking: staking.length,
        activities: activities.length,
      });

      // Cache data locally
      if (tokens.length > 0) AgunnayaDatabase.saveTokens(tokens);
      if (nfts.length > 0) AgunnayaDatabase.saveNFTs(nfts);
      if (daos.length > 0) AgunnayaDatabase.saveDAOs(daos);
      if (gamefi.length > 0) AgunnayaDatabase.saveGameFi(gamefi);
      if (agents.length > 0) AgunnayaDatabase.saveAgents(agents);
      if (staking.length > 0) AgunnayaDatabase.saveStaking(staking);
      if (activities.length > 0) AgunnayaDatabase.saveActivities(activities);

      console.log('[v0] Firebase data initialization complete');
      onDataLoaded();
      setIsLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[v0] Data initialization failed:', message);

      errorHandler.handle(
        err,
        ErrorCodes.FIREBASE_READ_FAILED,
        'warning',
        { stage: 'data-initialization' }
      );

      setError(message);
      onError?.(message);
      setIsLoading(false);
    }
  }, [onDataLoaded, onError]);

  useEffect(() => {
    initializeData();
  }, []);

  return { isLoading, error };
}

// Re-export React for the hook
import * as React from 'react';
