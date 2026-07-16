/**
 * Tab content router component.
 * Separates page rendering logic from main App component for better maintainability.
 */

import React from "react";
import { Token, NFTCollection, DAO, GameFiProject, AIAgent, Activity, WalletState } from "../types";
import { TerminalLine } from "./TerminalLog";

// Pages
import LandingPage from "../pages/LandingPage";
import DashboardPage from "../pages/DashboardPage";
import ExplorePage from "../pages/ExplorePage";
import CreatePage from "../pages/CreatePage";
import TradePage from "../pages/TradePage";
import NFTStudioPage from "../pages/NFTStudioPage";
import DAOBuilderPage from "../pages/DAOBuilderPage";
import GameFiPage from "../pages/GameFiPage";
import AgentStudioPage from "../pages/AgentStudioPage";
import DeFiPage from "../pages/DeFiPage";
import AGLCreditsPage from "../pages/AGLCreditsPage";
import GasDashboardPage from "../pages/GasDashboardPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import AdminPanelPage from "../pages/AdminPanelPage";
import ReferralPage from "../pages/ReferralPage";
import GoogleDrivePage from "../pages/GoogleDrivePage";
import GmailPage from "../pages/GmailPage";

interface TabContentProps {
  currentTab: string;
  selectedToken: Token | null;
  wallet: WalletState;
  tokens: Token[];
  nfts: NFTCollection[];
  daos: DAO[];
  games: GameFiProject[];
  agents: AIAgent[];
  activities: Activity[];
  terminalLogs: TerminalLine[];
  firebaseUser: any;
  driveAccessToken: string | null;
  onSelectTab: (tab: string) => void;
  onSelectToken: (token: Token | null) => void;
  onRefreshWallet: () => void;
  addTerminalLog: (type: TerminalLine["type"], text: string) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  onAuthorizeDrive: () => Promise<void>;
  setWalletState: (wallet: WalletState) => void;
  onOpenConnect: () => void;
}

export const TabContent: React.FC<TabContentProps> = ({
  currentTab,
  selectedToken,
  wallet,
  tokens,
  nfts,
  daos,
  games,
  agents,
  activities,
  terminalLogs,
  firebaseUser,
  driveAccessToken,
  onSelectTab,
  onSelectToken,
  onRefreshWallet,
  addTerminalLog,
  showToast,
  onAuthorizeDrive,
  setWalletState,
  onOpenConnect,
}) => {
  if (selectedToken) {
    return (
      <TradePage
        token={selectedToken}
        wallet={wallet}
        onBack={() => onSelectToken(null)}
        onRefreshWallet={onRefreshWallet}
        terminalLogs={terminalLogs}
        addTerminalLog={addTerminalLog}
        showToast={showToast}
      />
    );
  }

  switch (currentTab) {
    case "dashboard":
      return (
        <DashboardPage
          wallet={wallet}
          userTokens={tokens}
          userNFTs={nfts}
          userDAOs={daos}
          userGameFi={games}
          userAgents={agents}
          activities={activities}
          onOpenConnect={onOpenConnect}
          onSelectTab={onSelectTab}
        />
      );
    case "explore":
      return (
        <ExplorePage
          tokens={tokens}
          onSelectToken={onSelectToken}
        />
      );
    case "ai-builder":
      return (
        <CreatePage
          wallet={wallet}
          onLaunchSuccess={(newToken) => {
            onRefreshWallet();
            onSelectToken(newToken);
          }}
          onRefreshWallet={onRefreshWallet}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
        />
      );
    case "nfts":
      return (
        <NFTStudioPage
          wallet={wallet}
          collections={nfts}
          onRefreshNFTs={onRefreshWallet}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
        />
      );
    case "daos":
      return (
        <DAOBuilderPage
          wallet={wallet}
          daos={daos}
          onRefreshDAOs={onRefreshWallet}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
        />
      );
    case "gamefi":
      return (
        <GameFiPage
          wallet={wallet}
          games={games}
          onRefreshGames={onRefreshWallet}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
        />
      );
    case "ai-agents":
      return (
        <AgentStudioPage
          wallet={wallet}
          agents={agents}
          onRefreshAgents={onRefreshWallet}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
        />
      );
    case "defi":
      return (
        <DeFiPage
          wallet={wallet}
          onRefreshWallet={onRefreshWallet}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
        />
      );
    case "analytics":
      return (
        <AnalyticsPage
          tokens={tokens}
          onSelectToken={onSelectToken}
        />
      );
    case "admin":
      return (
        <AdminPanelPage
          wallet={wallet}
          tokens={tokens}
          onRefreshTokens={onRefreshWallet}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
        />
      );
    case "referrals":
      return (
        <ReferralPage
          wallet={wallet}
          onOpenConnect={onOpenConnect}
          onRefreshWallet={onRefreshWallet}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
        />
      );
    case "agl-credits":
      return (
        <AGLCreditsPage
          wallet={wallet}
          onRefreshWallet={onRefreshWallet}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
          setWalletState={setWalletState}
        />
      );
    case "gas-dashboard":
      return (
        <GasDashboardPage
          wallet={wallet}
          onRefreshWallet={onRefreshWallet}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
        />
      );
    case "gdrive":
      return (
        <GoogleDrivePage
          firebaseUser={firebaseUser}
          driveAccessToken={driveAccessToken}
          onAuthorizeDrive={onAuthorizeDrive}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
          onRefreshAllData={onRefreshWallet}
        />
      );
    case "gmail":
      return (
        <GmailPage
          firebaseUser={firebaseUser}
          driveAccessToken={driveAccessToken}
          onAuthorizeDrive={onAuthorizeDrive}
          addTerminalLog={addTerminalLog}
          showToast={showToast}
        />
      );
    default:
      return <div>Tab not found</div>;
  }
};
