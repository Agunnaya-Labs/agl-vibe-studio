import React, { useState } from 'react';
import { CheckCircle, Clock, BarChart3, Users, Plus, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  creator: string;
  status: 'active' | 'pending' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  startDate: Date;
  endDate: Date;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: string;
}

interface GovernanceEnhancerProps {
  userDAOs: any[];
  showToast: (message: string, type: string) => void;
}

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'prop-001',
    title: 'Increase Base Fee from 1% to 1.5%',
    description: 'Proposal to adjust platform fees to improve sustainability and fund development',
    creator: '0x1234...5678',
    status: 'active',
    votesFor: 4250,
    votesAgainst: 1200,
    votesAbstain: 500,
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    impact: 'high',
    category: 'Economics'
  },
  {
    id: 'prop-002',
    title: 'Launch Agent Marketplace Feature',
    description: 'Enable creators to list and monetize AI agents on platform',
    creator: '0x8765...4321',
    status: 'active',
    votesFor: 5800,
    votesAgainst: 300,
    votesAbstain: 400,
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    impact: 'critical',
    category: 'Feature'
  },
  {
    id: 'prop-003',
    title: 'Treasury Diversification into Stablecoins',
    description: 'Allocate 30% of treasury reserves to stablecoins for stability',
    creator: '0xabcd...ef01',
    status: 'passed',
    votesFor: 6200,
    votesAgainst: 400,
    votesAbstain: 150,
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    impact: 'high',
    category: 'Treasury'
  }
];

export default function GovernanceEnhancer({ userDAOs, showToast }: GovernanceEnhancerProps) {
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showVoteForm, setShowVoteForm] = useState(false);
  const [voteType, setVoteType] = useState<'for' | 'against' | 'abstain'>('for');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'passed': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'executed': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'bg-slate-500/10 text-slate-300';
      case 'medium': return 'bg-yellow-500/10 text-yellow-300';
      case 'high': return 'bg-orange-500/10 text-orange-300';
      case 'critical': return 'bg-red-500/10 text-red-300';
      default: return 'bg-slate-500/10 text-slate-300';
    }
  };

  const castVote = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const updated = proposals.map(p => {
      if (p.id === proposalId) {
        const votePower = 100;
        return {
          ...p,
          votesFor: voteType === 'for' ? p.votesFor + votePower : p.votesFor,
          votesAgainst: voteType === 'against' ? p.votesAgainst + votePower : p.votesAgainst,
          votesAbstain: voteType === 'abstain' ? p.votesAbstain + votePower : p.votesAbstain
        };
      }
      return p;
    });

    setProposals(updated);
    setShowVoteForm(false);
    showToast(`Vote cast: ${voteType.toUpperCase()}`, 'success');
  };

  const filteredProposals = proposals.filter(p => !filterStatus || p.status === filterStatus);

  const totalVotes = proposals.reduce((sum, p) => sum + (p.votesFor + p.votesAgainst + p.votesAbstain), 0);
  const activeProposals = proposals.filter(p => p.status === 'active').length;
  const passedProposals = proposals.filter(p => p.status === 'passed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Governance Hub</h1>
          <p className="text-slate-400">Advanced proposal tools, voting analytics, and impact simulation</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-2">Total Votes</div>
            <div className="text-2xl font-bold text-white">{(totalVotes / 1000).toFixed(1)}k</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-2">Active</div>
            <div className="text-2xl font-bold text-blue-400">{activeProposals}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-2">Passed</div>
            <div className="text-2xl font-bold text-green-400">{passedProposals}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-2">Avg Participation</div>
            <div className="text-2xl font-bold text-white">72.5%</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus(null)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !filterStatus
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          {['active', 'passed', 'rejected', 'pending'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                filterStatus === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Proposals Grid */}
        <div className="space-y-4">
          {filteredProposals.map(proposal => {
            const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
            const forPercent = (proposal.votesFor / totalVotes) * 100;
            const againstPercent = (proposal.votesAgainst / totalVotes) * 100;
            const abstainPercent = (proposal.votesAbstain / totalVotes) * 100;
            const daysLeft = Math.ceil((proposal.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

            return (
              <div
                key={proposal.id}
                onClick={() => setSelectedProposal(proposal)}
                className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 cursor-pointer hover:border-purple-500/50 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{proposal.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(proposal.status)}`}>
                        {proposal.status.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getImpactColor(proposal.impact)}`}>
                        {proposal.impact.toUpperCase()} IMPACT
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">by {proposal.creator}</p>
                  </div>
                  {proposal.status === 'active' && (
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Time Left</div>
                      <div className="text-lg font-bold text-white flex items-center gap-1 justify-end">
                        <Clock size={16} /> {daysLeft}d
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-slate-300 text-sm mb-4">{proposal.description}</p>

                {/* Vote Bars */}
                <div className="space-y-2 mb-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-400 font-semibold">For</span>
                      <span className="text-slate-400">{forPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${forPercent}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-400 font-semibold">Against</span>
                      <span className="text-slate-400">{againstPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${againstPercent}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-semibold">Abstain</span>
                      <span className="text-slate-400">{abstainPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-900 rounded overflow-hidden">
                      <div className="h-full bg-slate-600" style={{ width: `${abstainPercent}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Users size={14} /> {(totalVotes / 1000).toFixed(1)}k votes
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <BarChart3 size={14} /> {proposal.category}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Modal */}
        {selectedProposal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-3">{selectedProposal.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <span className={`text-sm px-3 py-1 rounded border ${getStatusColor(selectedProposal.status)}`}>
                      {selectedProposal.status.toUpperCase()}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded ${getImpactColor(selectedProposal.impact)}`}>
                      {selectedProposal.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-slate-300 mb-6">{selectedProposal.description}</p>

              <div className="bg-slate-900/50 rounded p-4 mb-6">
                <h4 className="font-semibold text-white mb-4">Vote Distribution</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-green-400 font-semibold">For</span>
                      <span className="text-white font-bold">{selectedProposal.votesFor.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${(selectedProposal.votesFor / (selectedProposal.votesFor + selectedProposal.votesAgainst + selectedProposal.votesAbstain)) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-red-400 font-semibold">Against</span>
                      <span className="text-white font-bold">{selectedProposal.votesAgainst.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${(selectedProposal.votesAgainst / (selectedProposal.votesFor + selectedProposal.votesAgainst + selectedProposal.votesAbstain)) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-400 font-semibold">Abstain</span>
                      <span className="text-white font-bold">{selectedProposal.votesAbstain.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded overflow-hidden">
                      <div className="h-full bg-slate-600" style={{ width: `${(selectedProposal.votesAbstain / (selectedProposal.votesFor + selectedProposal.votesAgainst + selectedProposal.votesAbstain)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {selectedProposal.status === 'active' && !showVoteForm && (
                <button
                  onClick={() => setShowVoteForm(true)}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
                >
                  Cast Your Vote
                </button>
              )}

              {showVoteForm && (
                <div className="space-y-4 mt-6 p-4 bg-slate-900/50 rounded-lg">
                  <h4 className="font-semibold text-white">Your Vote</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {(['for', 'against', 'abstain'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setVoteType(type)}
                        className={`py-2 rounded-lg font-medium transition capitalize ${
                          voteType === type
                            ? type === 'for' ? 'bg-green-600 text-white' : type === 'against' ? 'bg-red-600 text-white' : 'bg-slate-600 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => castVote(selectedProposal.id)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
                  >
                    Confirm Vote
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
