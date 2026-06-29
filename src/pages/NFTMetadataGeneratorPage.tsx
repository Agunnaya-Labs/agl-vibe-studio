import React from 'react';
import NFTMetadataGenerator from '../components/NFTMetadataGenerator';

interface NFTMetadataGeneratorPageProps {
  showToast: (message: string, type: string) => void;
}

export default function NFTMetadataGeneratorPage({
  showToast
}: NFTMetadataGeneratorPageProps) {
  return (
    <NFTMetadataGenerator
      showToast={showToast}
    />
  );
}
