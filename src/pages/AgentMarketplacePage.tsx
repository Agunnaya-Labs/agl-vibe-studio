import React from 'react';
import AgentMarketplace from '../components/AgentMarketplace';

interface AgentMarketplacePageProps {
  userAgents: any[];
  showToast: (message: string, type: string) => void;
}

export default function AgentMarketplacePage({
  userAgents,
  showToast
}: AgentMarketplacePageProps) {
  return (
    <AgentMarketplace
      userAgents={userAgents}
      showToast={showToast}
    />
  );
}
