import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Zap, Code2, BarChart3, Copy, Download } from 'lucide-react';

interface AuditIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  line?: number;
  recommendation: string;
  gasSavings?: number;
}

interface AuditReport {
  contractName: string;
  sourceCode: string;
  issues: AuditIssue[];
  gasOptimization: {
    currentGas: number;
    optimizedGas: number;
    savings: number;
    savingsPercent: number;
  };
  score: number;
  totalLines: number;
}

interface SmartContractAuditorProps {
  showToast: (message: string, type: string) => void;
}

export default function SmartContractAuditor({ showToast }: SmartContractAuditorProps) {
  const [sourceCode, setSourceCode] = useState(
    `pragma solidity ^0.8.19;

contract TokenBondingCurve {
    address public owner;
    uint256 public totalSupply;
    mapping(address => uint256) public balances;
    
    function mint(uint256 amount) public {
        require(msg.sender != address(0), "Invalid address");
        totalSupply += amount;
        balances[msg.sender] += amount;
    }
    
    function burn(uint256 amount) public {
        require(balances[msg.sender] >= amount);
        totalSupply -= amount;
        balances[msg.sender] -= amount;
    }
}`
  );
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const performAudit = async () => {
    setIsAuditing(true);
    
    // Simulate audit analysis
    const mockIssues: AuditIssue[] = [
      {
        id: 'reentrancy-1',
        severity: 'critical',
        title: 'Potential Reentrancy Vulnerability',
        description: 'The contract performs external calls before updating state, which could allow reentrancy attacks.',
        line: 8,
        recommendation: 'Use OpenZeppelin\'s ReentrancyGuard or implement checks-effects-interactions pattern',
        gasSavings: 0
      },
      {
        id: 'access-control-1',
        severity: 'high',
        title: 'Missing Access Control',
        description: 'The mint() function lacks access control modifiers. Any address can mint tokens.',
        line: 7,
        recommendation: 'Add onlyOwner modifier or implement role-based access control (RBAC)',
        gasSavings: 100
      },
      {
        id: 'unchecked-arithmetic-1',
        severity: 'high',
        title: 'Unchecked Arithmetic Operations',
        description: 'Arithmetic operations are not checked for overflow/underflow (pre-Solidity 0.8 behavior).',
        line: 9,
        recommendation: 'Ensure all arithmetic operations are safe or use SafeMath library',
        gasSavings: 200
      },
      {
        id: 'gas-optimization-1',
        severity: 'medium',
        title: 'Gas Optimization: Storage Packing',
        description: 'State variables can be optimized by packing them more efficiently in storage slots.',
        recommendation: 'Pack address and uint256 variables to reduce storage slots and save gas',
        gasSavings: 5000
      },
      {
        id: 'event-logging-1',
        severity: 'low',
        title: 'Missing Event Logging',
        description: 'Critical state changes (mint/burn) should emit events for off-chain tracking.',
        recommendation: 'Add Mint and Burn events and emit them in the respective functions',
        gasSavings: 0
      },
      {
        id: 'natspec-1',
        severity: 'info',
        title: 'Missing NatSpec Documentation',
        description: 'Contract and function documentation is missing. This reduces code clarity.',
        recommendation: 'Add comprehensive NatSpec comments for all public functions',
        gasSavings: 0
      }
    ];

    const gasMetrics = {
      currentGas: 125000,
      optimizedGas: 89000,
      savings: 36000,
      savingsPercent: 28.8
    };

    const criticalCount = mockIssues.filter(i => i.severity === 'critical').length;
    const highCount = mockIssues.filter(i => i.severity === 'high').length;
    const score = Math.max(10, 100 - (criticalCount * 25 + highCount * 15));

    setTimeout(() => {
      setAuditReport({
        contractName: 'TokenBondingCurve',
        sourceCode,
        issues: mockIssues,
        gasOptimization: gasMetrics,
        score,
        totalLines: sourceCode.split('\n').length
      });
      setIsAuditing(false);
      showToast('Contract audit completed', 'success');
    }, 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900/30 border-red-700 text-red-300';
      case 'high': return 'bg-orange-900/30 border-orange-700 text-orange-300';
      case 'medium': return 'bg-yellow-900/30 border-yellow-700 text-yellow-300';
      case 'low': return 'bg-blue-900/30 border-blue-700 text-blue-300';
      case 'info': return 'bg-slate-900/30 border-slate-700 text-slate-300';
      default: return 'bg-slate-900/30 border-slate-700 text-slate-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={18} />;
      case 'high': return <AlertCircle size={18} />;
      case 'medium': return <AlertCircle size={18} />;
      case 'low': return <CheckCircle size={18} />;
      case 'info': return <Code2 size={18} />;
      default: return <Code2 size={18} />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  const downloadReport = () => {
    if (!auditReport) return;
    
    const report = `
SMART CONTRACT AUDIT REPORT
===========================

Contract: ${auditReport.contractName}
Lines of Code: ${auditReport.totalLines}
Audit Score: ${auditReport.score}/100

SECURITY ISSUES
===============
${auditReport.issues.map(issue => `
[${issue.severity.toUpperCase()}] ${issue.title}
Description: ${issue.description}
Recommendation: ${issue.recommendation}
${issue.line ? `Line: ${issue.line}` : ''}
`).join('\n')}

GAS OPTIMIZATION
================
Current Gas: ${auditReport.gasOptimization.currentGas}
Optimized Gas: ${auditReport.gasOptimization.optimizedGas}
Savings: ${auditReport.gasOptimization.savings} gas (${auditReport.gasOptimization.savingsPercent}%)
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${auditReport.contractName}-${Date.now()}.txt`;
    a.click();
    showToast('Report downloaded', 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Smart Contract Auditor</h1>
          <p className="text-slate-400">AI-powered security analysis, optimization recommendations, and gas efficiency audits</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Editor */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Source Code</h2>
                  <button
                    onClick={() => copyToClipboard(sourceCode)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>
              <textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                className="flex-1 bg-slate-900 text-slate-100 p-4 font-mono text-sm focus:outline-none border-none resize-none"
                placeholder="Paste your Solidity contract code here..."
              />
            </div>

            <button
              onClick={performAudit}
              disabled={isAuditing || !sourceCode.trim()}
              className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {isAuditing ? (
                <>
                  <div className="animate-spin">⟳</div>
                  Analyzing Contract...
                </>
              ) : (
                <>
                  <BarChart3 size={18} /> Start Audit
                </>
              )}
            </button>
          </div>

          {/* Audit Summary */}
          <div className="space-y-4">
            {auditReport ? (
              <>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-white mb-2">{auditReport.score}</div>
                    <div className="text-sm text-slate-400">Audit Score</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Critical Issues</span>
                      <span className="font-bold text-red-400">{auditReport.issues.filter(i => i.severity === 'critical').length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">High Issues</span>
                      <span className="font-bold text-orange-400">{auditReport.issues.filter(i => i.severity === 'high').length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Medium Issues</span>
                      <span className="font-bold text-yellow-400">{auditReport.issues.filter(i => i.severity === 'medium').length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Zap size={18} /> Gas Optimization
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current</span>
                      <span className="font-mono text-white">{auditReport.gasOptimization.currentGas.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Optimized</span>
                      <span className="font-mono text-green-400">{auditReport.gasOptimization.optimizedGas.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Save</span>
                        <span className="font-bold text-green-400">
                          {auditReport.gasOptimization.savings.toLocaleString()} ({auditReport.gasOptimization.savingsPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={downloadReport}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download Report
                </button>
              </>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 text-center">
                <Code2 size={32} className="mx-auto mb-3 text-slate-400" />
                <p className="text-slate-400">Run audit to see analysis</p>
              </div>
            )}
          </div>
        </div>

        {/* Issues List */}
        {auditReport && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-4">Issues Found</h2>
            <div className="space-y-3">
              {auditReport.issues.map(issue => (
                <div
                  key={issue.id}
                  className={`bg-slate-800/50 backdrop-blur border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getSeverityIcon(issue.severity)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold">{issue.title}</h3>
                        {issue.gasSavings ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                            Save {issue.gasSavings} gas
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm opacity-90 mb-2">{issue.description}</p>
                      <div className="bg-black/20 rounded p-2 mb-2">
                        <p className="text-xs font-semibold mb-1">Recommendation:</p>
                        <p className="text-sm">{issue.recommendation}</p>
                      </div>
                      {issue.line && (
                        <p className="text-xs opacity-75">Line {issue.line}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
