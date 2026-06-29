import React from 'react';
import GovernanceEnhancer from '../components/GovernanceEnhancer';

interface GovernanceEnhancerPageProps {
  userDAOs: any[];
  showToast: (message: string, type: string) => void;
}

export default function GovernanceEnhancerPage({
  userDAOs,
  showToast
}: GovernanceEnhancerPageProps) {
  return (
    <GovernanceEnhancer
      userDAOs={userDAOs}
      showToast={showToast}
    />
  );
}
