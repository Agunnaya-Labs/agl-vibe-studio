import React, { useState } from 'react';
import { Sparkles, Download, Copy, RefreshCw, Trash2, Plus } from 'lucide-react';

interface NFTMetadata {
  id: string;
  name: string;
  description: string;
  attributes: { trait_type: string; value: string }[];
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  imageUrl: string;
}

interface GenerationConfig {
  collectionName: string;
  totalSupply: number;
  theme: string;
  rarityDistribution: Record<string, number>;
  traits: string[];
}

interface NFTMetadataGeneratorProps {
  showToast: (message: string, type: string) => void;
}

const TRAIT_TEMPLATES = {
  'Art Collection': ['Background', 'Character', 'Accessory', 'Color Palette', 'Style'],
  'Gaming Characters': ['Class', 'Level', 'Armor', 'Weapon', 'Skill'],
  'Collectibles': ['Type', 'Rarity', 'Edition', 'Attribute', 'Bonus'],
  'Virtual Real Estate': ['Location', 'Size', 'Amenities', 'Surrounding', 'Value'],
  'Domain Names': ['TLD', 'Length', 'Type', 'Historic', 'Premium'],
};

export default function NFTMetadataGenerator({ showToast }: NFTMetadataGeneratorProps) {
  const [config, setConfig] = useState<GenerationConfig>({
    collectionName: 'Agunnaya Genesis',
    totalSupply: 100,
    theme: 'Art Collection',
    rarityDistribution: {
      common: 50,
      uncommon: 30,
      rare: 15,
      epic: 4,
      legendary: 1
    },
    traits: TRAIT_TEMPLATES['Art Collection']
  });

  const [generatedMetadata, setGeneratedMetadata] = useState<NFTMetadata[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMetadata, setSelectedMetadata] = useState<NFTMetadata | null>(null);

  const generateMetadata = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const rarities: ('common' | 'uncommon' | 'rare' | 'epic' | 'legendary')[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      const descriptions = [
        'An exquisite piece featuring intricate details and vibrant colors',
        'A stunning composition with masterful use of light and shadow',
        'A captivating artwork showcasing exceptional craftsmanship',
        'A mesmerizing creation blending traditional and modern aesthetics',
        'A breathtaking masterpiece with unprecedented complexity',
      ];

      const metadata: NFTMetadata[] = Array.from({ length: config.totalSupply }, (_, i) => {
        const rarity = rarities[Math.floor(Math.random() * rarities.length)];
        const attributes = config.traits.map(trait => ({
          trait_type: trait,
          value: `Variant ${Math.floor(Math.random() * 10) + 1}`
        }));

        return {
          id: `${config.collectionName.toLowerCase().replace(/\s/g, '-')}-${i + 1}`,
          name: `${config.collectionName} #${i + 1}`,
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          attributes,
          rarity,
          imageUrl: `https://images.unsplash.com/photo-${1600000000000 + i}?w=400&h=400&fit=crop`
        };
      });

      setGeneratedMetadata(metadata);
      setIsGenerating(false);
      showToast(`Generated ${config.totalSupply} NFT metadata records`, 'success');
    }, 1500);
  };

  const exportMetadata = (format: 'json' | 'csv') => {
    if (generatedMetadata.length === 0) {
      showToast('No metadata to export', 'error');
      return;
    }

    let content = '';
    let filename = `metadata-${config.collectionName.toLowerCase().replace(/\s/g, '-')}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(generatedMetadata, null, 2);
    } else {
      const headers = ['id', 'name', 'description', 'rarity', 'traits'];
      const rows = generatedMetadata.map(nft => [
        nft.id,
        nft.name,
        nft.description,
        nft.rarity,
        JSON.stringify(nft.attributes)
      ]);
      content = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    showToast(`Exported ${format.toUpperCase()} file`, 'success');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-900/30 border-gray-700 text-gray-300';
      case 'uncommon': return 'bg-green-900/30 border-green-700 text-green-300';
      case 'rare': return 'bg-blue-900/30 border-blue-700 text-blue-300';
      case 'epic': return 'bg-purple-900/30 border-purple-700 text-purple-300';
      case 'legendary': return 'bg-yellow-900/30 border-yellow-700 text-yellow-300';
      default: return 'bg-slate-900/30 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">NFT Metadata Generator</h1>
          <p className="text-slate-400">AI-powered metadata creation with rarity distribution and trait customization</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 h-fit">
            <h2 className="text-lg font-bold text-white mb-6">Collection Config</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Collection Name</label>
                <input
                  type="text"
                  value={config.collectionName}
                  onChange={(e) => setConfig({ ...config, collectionName: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Total Supply</label>
                <input
                  type="number"
                  value={config.totalSupply}
                  onChange={(e) => setConfig({ ...config, totalSupply: parseInt(e.target.value) })}
                  min="1"
                  max="10000"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Theme</label>
                <select
                  value={config.theme}
                  onChange={(e) => {
                    const theme = e.target.value;
                    setConfig({
                      ...config,
                      theme,
                      traits: TRAIT_TEMPLATES[theme as keyof typeof TRAIT_TEMPLATES] || []
                    });
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  {Object.keys(TRAIT_TEMPLATES).map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <h3 className="font-semibold text-slate-300 mb-3">Rarity Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(config.rarityDistribution).map(([rarity, percent]) => (
                    <div key={rarity} className="flex items-center gap-2">
                      <span className="text-sm text-slate-400 capitalize w-20">{rarity}</span>
                      <input
                        type="number"
                        value={percent}
                        onChange={(e) => setConfig({
                          ...config,
                          rarityDistribution: {
                            ...config.rarityDistribution,
                            [rarity]: parseInt(e.target.value)
                          }
                        })}
                        min="0"
                        max="100"
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-sm text-slate-400 w-8">%</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={generateMetadata}
                disabled={isGenerating}
                className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin">⟳</div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Generate Metadata
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview and Export */}
          <div className="lg:col-span-2 space-y-6">
            {generatedMetadata.length > 0 && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
                    <div className="text-slate-400 text-sm">Generated</div>
                    <div className="text-2xl font-bold text-white">{generatedMetadata.length}</div>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
                    <div className="text-slate-400 text-sm">Rarity Types</div>
                    <div className="text-2xl font-bold text-white">5</div>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
                    <div className="text-slate-400 text-sm">Traits per NFT</div>
                    <div className="text-2xl font-bold text-white">{config.traits.length}</div>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => exportMetadata('json')}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Export JSON
                  </button>
                  <button
                    onClick={() => exportMetadata('csv')}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Export CSV
                  </button>
                </div>

                {/* Metadata Grid */}
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                    <h3 className="font-bold text-white">Generated Metadata Preview</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-h-[500px] overflow-y-auto">
                    {generatedMetadata.slice(0, 8).map(nft => (
                      <div
                        key={nft.id}
                        onClick={() => setSelectedMetadata(nft)}
                        className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 cursor-pointer hover:border-purple-500 transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white">{nft.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded capitalize ${getRarityColor(nft.rarity)}`}>
                            {nft.rarity}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mb-3">{nft.description}</p>
                        <div className="space-y-1">
                          {nft.attributes.slice(0, 3).map((attr, idx) => (
                            <div key={idx} className="text-xs text-slate-400">
                              <span className="text-slate-300">{attr.trait_type}:</span> {attr.value}
                            </div>
                          ))}
                          {nft.attributes.length > 3 && (
                            <div className="text-xs text-slate-500">+{nft.attributes.length - 3} more traits</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {generatedMetadata.length === 0 && !isGenerating && (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-12 text-center">
                <Sparkles size={40} className="mx-auto mb-4 text-slate-400" />
                <p className="text-slate-400">Configure your collection and generate metadata</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {selectedMetadata && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedMetadata.name}</h2>
                  <span className={`text-sm px-3 py-1 rounded capitalize inline-block ${getRarityColor(selectedMetadata.rarity)}`}>
                    {selectedMetadata.rarity}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMetadata(null)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-slate-300 mb-6">{selectedMetadata.description}</p>

              <h3 className="font-bold text-white mb-4">Attributes</h3>
              <div className="space-y-3 mb-6">
                {selectedMetadata.attributes.map((attr, idx) => (
                  <div key={idx} className="bg-slate-700/50 rounded p-3 flex justify-between items-center">
                    <span className="text-slate-300">{attr.trait_type}</span>
                    <span className="text-white font-semibold">{attr.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/50 border border-slate-700 rounded p-4 mb-6">
                <h4 className="font-semibold text-slate-400 mb-2 text-sm">JSON Metadata</h4>
                <pre className="text-xs text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedMetadata, null, 2)}
                </pre>
              </div>

              <button
                onClick={() => copyToClipboard(JSON.stringify(selectedMetadata, null, 2))}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Copy size={16} /> Copy JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
