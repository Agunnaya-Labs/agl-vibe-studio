import React from 'react';
import SmartContractAuditor from '../components/SmartContractAuditor';

interface SmartContractAuditorPageProps {
  showToast: (message: string, type: string) => void;
}

export default function SmartContractAuditorPage({
  showToast
}: SmartContractAuditorPageProps) {
  return (
    <SmartContractAuditor
      showToast={showToast}
    />
  );
}
