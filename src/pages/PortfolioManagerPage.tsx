import React from 'react';
import PortfolioManager from '../components/PortfolioManager';

interface PortfolioManagerPageProps {
  userTokens: any[];
  userNFTs: any[];
  userAgents: any[];
  walletBalance: number;
  showToast: (message: string, type: string) => void;
}

export default function PortfolioManagerPage({
  userTokens,
  userNFTs,
  userAgents,
  walletBalance,
  showToast
}: PortfolioManagerPageProps) {
  return (
    <PortfolioManager
      userTokens={userTokens}
      userNFTs={userNFTs}
      userAgents={userAgents}
      walletBalance={walletBalance}
      showToast={showToast}
    />
  );
}
