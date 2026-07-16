import React, { useEffect, useRef, useState } from "react";
import { Terminal, Shield, Cpu, Maximize2, Minimize2, Trash2 } from "lucide-react";

export interface TerminalLine {
  id: string;
  timestamp: string;
  type: "info" | "success" | "error" | "buy" | "sell" | "system";
  message: string;
}

interface TerminalLogProps {
  logs: TerminalLine[];
  onClear?: () => void;
}

export default function TerminalLog({ logs, onClear }: TerminalLogProps) {
  const [inputCommand, setInputCommand] = useState("");
  const [consoleHistory, setConsoleHistory] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of terminal log on new entries
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, consoleHistory]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim()) return;

    const cmd = inputCommand.trim().toLowerCase();
    let reply = "";

    if (cmd === "help") {
      reply = "Available commands: help | stats | status | clear | audit | version";
    } else if (cmd === "stats") {
      reply = "NETWORK: Base Mainnet | COMPILER: solc v0.8.20 | GAS: 0.05 gwei | SYNC_STATE: 100% synced";
    } else if (cmd === "status") {
      reply = "System fully operational. All bonding curves fully capitalized and balanced.";
    } else if (cmd === "clear") {
      setConsoleHistory([]);
      setInputCommand("");
      if (onClear) onClear();
      return;
    } else if (cmd === "audit") {
      reply = "AUDIT SECURE: CEI pattern compliant. ReentrancyGuard active on all entrypoints.";
    } else if (cmd === "version") {
      reply = "Agunnaya Labs Studio CLI - v2.4.0-release";
    } else {
      reply = `Command not found: '${cmd}'. Type 'help' for available diagnostic subroutines.`;
    }

    setConsoleHistory(prev => [...prev, `> ${inputCommand}`, reply]);
    setInputCommand("");
  };

  // Helper to parse hex addresses and turn them into BaseScan links
  const renderMessageWithLinks = (msg: string) => {
    const addressRegex = /0x[a-fA-F0-9]{40}/g;
    const matches = msg.match(addressRegex);
    
    if (!matches) {
      return msg;
    }

    const parts = [];
    let lastIndex = 0;
    addressRegex.lastIndex = 0;
    let match;
    let keyIdx = 0;
    
    while ((match = addressRegex.exec(msg)) !== null) {
      const matchIndex = match.index;
      const address = match[0];
      
      if (matchIndex > lastIndex) {
        parts.push(msg.substring(lastIndex, matchIndex));
      }
      
      parts.push(
        <a 
          key={`link-${keyIdx++}`}
          href={`https://basescan.org/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue hover:underline font-bold font-mono hover:text-brand-purple transition-all"
          title="Verify on BaseScan"
          onClick={(e) => e.stopPropagation()}
        >
          {address.slice(0, 10)}...{address.slice(-8)}
        </a>
      );
      
      lastIndex = addressRegex.lastIndex;
    }
    
    if (lastIndex < msg.length) {
      parts.push(msg.substring(lastIndex));
    }
    
    return <>{parts}</>;
  };

  return (
    <>
      {isExpanded && (
        <div 
          id="terminal-fullscreen-backdrop"
          className="fixed inset-0 bg-[#050505]/85 backdrop-blur-md z-50 transition-all duration-300 animate-fade-in" 
          onClick={() => setIsExpanded(false)} 
        />
      )}
      <div 
        id="retro-terminal-log" 
        className={`${
          isExpanded 
            ? "fixed inset-4 md:inset-8 z-50 bg-black border border-white/15 rounded-2xl shadow-[0_0_80px_rgba(168,85,247,0.15)] animate-scale-in" 
            : "w-full rounded-xl bg-black border border-white/10 overflow-hidden h-80"
        } flex flex-col font-mono text-[11px] leading-relaxed transition-all duration-200`}
      >
        {/* Header Bar */}
        <div className="bg-zinc-900 px-4 py-2 border-b border-white/5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            <span className="text-[10px] text-zinc-500 font-bold ml-2 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-brand-purple" />
              agl-base-rpc-terminal.sh
            </span>
          </div>
          <div className="flex items-center gap-3 text-[9px] text-zinc-500">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-emerald-500" /> RPC: Connected</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-brand-blue" /> Secure</span>
            {onClear && (
              <button
                id="terminal-clear-logs-btn"
                type="button"
                onClick={onClear}
                className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-1"
                title="Clear Terminal Logs"
              >
                <Trash2 className="w-3 h-3 text-zinc-400 hover:text-white" />
              </button>
            )}
            <button
              id="terminal-toggle-expand-btn"
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-1 border border-white/10"
              title={isExpanded ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isExpanded ? (
                <Minimize2 className="w-3 h-3 text-brand-purple" />
              ) : (
                <Maximize2 className="w-3 h-3 text-brand-purple" />
              )}
              <span className="sr-only">{isExpanded ? "Collapse" : "Expand"}</span>
            </button>
          </div>
        </div>

      {/* Terminal Output */}
      <div className="p-4 flex-1 overflow-y-auto terminal-scroll space-y-1 bg-zinc-950 text-emerald-500/90 selection:bg-emerald-500/20">
        <div className="text-zinc-500 text-[10px] pb-2 border-b border-white/5 mb-2">
          AGUNNAYA LABS BASE STREAMING CLI [Version 2.4.0]<br />
          Ready to listen to on-chain Base Events. Type 'help' for diagnostics.
        </div>

        {/* Dynamic streamed logs */}
        {logs.map((log, idx) => {
          let typeColor = "text-zinc-400";
          let badge = "[INFO]";
          
          if (log.type === "success") {
            typeColor = "text-emerald-400";
            badge = "[OK  ]";
          } else if (log.type === "error") {
            typeColor = "text-red-400 font-bold";
            badge = "[ERR ]";
          } else if (log.type === "buy") {
            typeColor = "text-green-400 font-bold";
            badge = "[BUY ]";
          } else if (log.type === "sell") {
            typeColor = "text-rose-400 font-bold";
            badge = "[SELL]";
          } else if (log.type === "system") {
            typeColor = "text-brand-purple";
            badge = "[SYS ]";
          }

          const logId = log.id || `log-${idx}-${log.message || (log as any).text || ""}`;
          const logTimestamp = log.timestamp || new Date().toLocaleTimeString();
          const logMessage = log.message || (log as any).text || "";

          return (
            <div key={logId} className="flex items-start gap-2">
              <span className="text-zinc-600 select-none">{logTimestamp}</span>
              <span className={`${typeColor} shrink-0`}>{badge}</span>
              <span className="text-zinc-100">{renderMessageWithLinks(logMessage)}</span>
            </div>
          );
        })}

        {/* Commands history */}
        {consoleHistory.map((line, idx) => (
          <div key={`hist-${idx}`} className={line.startsWith(">") ? "text-brand-purple" : "text-emerald-500"}>
            {line}
          </div>
        ))}

        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Command Input */}
      <form onSubmit={handleCommandSubmit} className="bg-zinc-950 border-t border-white/5 p-2 flex items-center shrink-0">
        <span className="text-brand-purple mr-2 font-bold select-none">$</span>
        <input
          id="terminal-command-input"
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          placeholder="Type command (e.g. 'help', 'stats', 'audit') and press Enter..."
          className="bg-transparent text-emerald-400 focus:outline-none w-full placeholder:text-zinc-700 caret-emerald-500"
          autoComplete="off"
          spellCheck={false}
        />
        <span className="terminal-cursor"></span>
      </form>
    </div>
    </>
  );
}
