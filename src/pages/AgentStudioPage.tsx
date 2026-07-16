import React, { useState } from "react";
import { AIAgent, WalletState } from "../types";
import { AgunnayaDatabase } from "../lib/db";
import { chatWithAgentAI, optimizeSystemPromptAI } from "../lib/gemini";
import { Bot, Send, BrainCircuit, X, MessageSquare, Plus, Zap, Award, Coins, Sparkles, Cpu, Layers, ShieldCheck, Upload } from "lucide-react";
import BaseScanLink from "../components/BaseScanLink";
import { uploadImage } from "../lib/imageUpload";

interface AgentStudioPageProps {
  wallet: WalletState;
  agents: AIAgent[];
  onRefreshAgents: () => void;
  addTerminalLog: (type: "info" | "success" | "error" | "buy" | "sell" | "system", message: string) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function AgentStudioPage({ wallet, agents, onRefreshAgents, addTerminalLog, showToast }: AgentStudioPageProps) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [subFee, setSubFee] = useState("0.001");
  const [loading, setLoading] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [lastDeployedAddress, setLastDeployedAddress] = useState<string | null>(null);
  const avatarFileRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      setCustomAvatarUrl(url);
    } catch {
      showToast("Avatar upload failed.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Active chat state
  const [activeChatAgent, setActiveChatAgent] = useState<AIAgent | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [optimizingPrompt, setOptimizingPrompt] = useState(false);

  const handleOptimizePrompt = async () => {
    if (!systemPrompt.trim() || optimizingPrompt) return;
    setOptimizingPrompt(true);
    addTerminalLog("system", "AI Agent Optimizer: Initializing cognitive tuning pipeline via Gemini 3.5...");
    try {
      const optimized = await optimizeSystemPromptAI(systemPrompt);
      setSystemPrompt(optimized);
      showToast("System directive optimized!", "success");
      addTerminalLog("success", "AI Agent Optimizer: Compiled detailed autonomous directive schema successfully.");
    } catch (err: any) {
      console.error(err);
      showToast("Optimization failed: " + (err.message || "Network issue"), "error");
      addTerminalLog("error", "AI Agent Optimizer: Fine-tuning pipeline rejected. Verify API configurations.");
    } finally {
      setOptimizingPrompt(false);
    }
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.isConnected) {
      showToast("Connect wallet first.", "error");
      return;
    }
    if (!name || !symbol || !description || !systemPrompt) return;
    setLoading(true);

    addTerminalLog("info", `Launching autonomous AI Agent and registering standard token model ${symbol}...`);

    setTimeout(() => {
      const generatedId = "agent_" + Math.random().toString(36).substr(2, 5);
      const generatedAddress = "0x" + Math.random().toString(16).substr(2, 40);
      // Deterministic SVG avatar from symbol (or use uploaded image)
      const sym = symbol.slice(0, 2).toUpperCase();
      const hue = sym.split("").reduce((n: number, c: string) => n + c.charCodeAt(0), 0) % 360;
      const svgAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' rx='64' fill='hsl(${hue},60%,15%)'/><text x='64' y='82' font-family='monospace' font-size='48' font-weight='bold' text-anchor='middle' fill='hsl(${hue},80%,70%)'>${sym}</text></svg>`;

      const newAgent: AIAgent = {
        id: generatedId,
        name,
        symbol: symbol.toUpperCase(),
        description,
        creator: wallet.address,
        contractAddress: generatedAddress,
        queryCount: 0,
        tokenPrice: 0.01,
        usageFeeEth: parseFloat(subFee) || 0.001,
        lifetimeRevenueEth: 0,
        avatarUrl: customAvatarUrl || svgAvatar,
        systemPrompt: systemPrompt,
        aglRewardDiscounts: true,
        chatHistory: [
          { role: "assistant", content: `Sentinel security subroutines loaded for ${name}. Ready to assist.` }
        ],
        createdAt: Date.now()
      };

      const current = AgunnayaDatabase.getAgents();
      current.push(newAgent);
      AgunnayaDatabase.saveAgents(current);

      // Deduct ETH
      const updatedWallet = { ...wallet, balanceEth: Math.max(0, wallet.balanceEth - 0.005) };
      AgunnayaDatabase.saveWallet(updatedWallet);
      onRefreshAgents();

      AgunnayaDatabase.addActivity({
        type: "create",
        tokenSymbol: newAgent.symbol,
        tokenAddress: newAgent.contractAddress,
        user: wallet.address,
        amount: 0,
        ethValue: 0.005,
        details: `Launched AI agent worker: ${newAgent.name} (${newAgent.symbol}) powered by Gemini LLM`
      });

      addTerminalLog("success", `AI Agent fully registered at ${newAgent.contractAddress} — https://basescan.org/address/${newAgent.contractAddress}`);
      setLastDeployedAddress(newAgent.contractAddress);
      setLoading(false);
      setName("");
      setSymbol("");
      setDescription("");
      setSystemPrompt("");
      setCustomAvatarUrl("");
    }, 2000);
  };

  const handleStartChat = (agent: AIAgent) => {
    setActiveChatAgent(agent);
    setChatMessages([
      { role: "assistant", content: `I am ${agent.name} (${agent.symbol}). My active directives: "${agent.description}". How may I assist you today?` }
    ]);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !activeChatAgent) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userText }]);
    setChatLoading(true);

    try {
      const allMessages = [...chatMessages, { role: "user", content: userText }];
      
      const response = await chatWithAgentAI(allMessages, activeChatAgent, wallet.address);

      // Stream word-by-word for a typewriter effect
      const words = response.split(" ");
      let currentText = "";
      let wordIdx = 0;
      setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const interval = setInterval(() => {
        if (wordIdx < words.length) {
          currentText += (wordIdx === 0 ? "" : " ") + words[wordIdx];
          setChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: currentText };
            return updated;
          });
          wordIdx++;
        } else {
          clearInterval(interval);
          setChatLoading(false);
        }
      }, 20);

      // Mutate agent stats (increase query count & lifetime revenue)
      const allAgents = AgunnayaDatabase.getAgents();
      const found = allAgents.find(a => a.id === activeChatAgent.id);
      if (found) {
        found.queryCount += 1;
        found.lifetimeRevenueEth += activeChatAgent.usageFeeEth;
        AgunnayaDatabase.saveAgents(allAgents);
        
        // Sync active state
        activeChatAgent.queryCount = found.queryCount;
        activeChatAgent.lifetimeRevenueEth = found.lifetimeRevenueEth;
      }

      // Claim minor fee or consume credits
      if (wallet.isConnected) {
        let updatedWallet: WalletState;
        const currentCredits = wallet.aglCredits || 0;
        
        if (currentCredits >= 10) {
          // Sponsor with AGL credits (discounted model)
          const remainingCredits = currentCredits - 10;
          updatedWallet = {
            ...wallet,
            aglCredits: remainingCredits
          };
          showToast("Query sponsored with 10 AGL Credits!", "success");
          addTerminalLog("system", `AGENT HARNESS: Query sponsored using 10 computational credits for ${activeChatAgent.name}.`);
          if (remainingCredits < 20) {
            showToast("⚠️ Low computational credits remaining. Top up your AGL credits soon to prevent future AI failures!", "info");
          }
        } else {
          // Pay with ETH
          updatedWallet = { 
            ...wallet, 
            balanceEth: Math.max(0, wallet.balanceEth - activeChatAgent.usageFeeEth) 
          };
          showToast(`Paid standard subscription fee: ${activeChatAgent.usageFeeEth} ETH`, "info");
          addTerminalLog("system", `AGENT HARNESS: Debited ${activeChatAgent.usageFeeEth} ETH standard trigger fee for ${activeChatAgent.name}.`);
        }
        AgunnayaDatabase.saveWallet(updatedWallet);
        onRefreshAgents();
      }

    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: `Error connecting to AI kernel: ${err.message || "Endpoint timeout."}`
      }]);
      setChatLoading(false);
    }
  };

  return (
    <div id="ai-agents-workspace-root" className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      
      {/* Create form panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-6">
          <div>
            <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-brand-purple" />
              AI Agent Forge
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Assemble fully autonomous agent profiles. Direct prompt directives shape their decision parameters, and they earn transaction fees in real-time when other users prompt them.
            </p>
          </div>

          <form onSubmit={handleCreateAgent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Agent Name</label>
                <input
                  id="agent-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Agunnaya Smart Auditor"
                  required
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Ticker Token</label>
                <input
                  id="agent-symbol-input"
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. AUDIT"
                  required
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white uppercase focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Short Description</label>
                <input
                  id="agent-desc-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Reviewing Solidity code safety checklists..."
                  required
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Prompt Fee (ETH)</label>
                <input
                  id="agent-fee-input"
                  type="number"
                  step="0.0001"
                  value={subFee}
                  onChange={(e) => setSubFee(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500">System Directive Prompt (Directives to model behavior)</label>
                <button
                  type="button"
                  id="btn-optimize-directive"
                  onClick={handleOptimizePrompt}
                  disabled={optimizingPrompt || !systemPrompt.trim()}
                  className="text-[10px] px-2.5 py-1 rounded bg-brand-purple/10 border border-brand-purple/20 hover:bg-brand-purple hover:border-brand-purple text-brand-purple hover:text-white transition-all duration-200 flex items-center gap-1 font-mono font-bold disabled:opacity-40 disabled:hover:bg-brand-purple/10 disabled:hover:text-brand-purple disabled:hover:border-brand-purple/20 cursor-pointer"
                >
                  <Sparkles className={`w-3 h-3 ${optimizingPrompt ? "animate-spin" : ""}`} />
                  <span>{optimizingPrompt ? "Optimizing..." : "AI Auto-Optimize"}</span>
                </button>
              </div>
              <textarea
                id="agent-directives-input"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                placeholder="Declare instructions for Gemini to maintain behavior: e.g. You are a senior Solidity developer auditing contracts for reentrancy bugs. Keep responses technical and objective..."
                required
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Optional avatar upload */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Agent Avatar (Optional)</label>
              <div className="flex items-center gap-3">
                {customAvatarUrl ? (
                  <img src={customAvatarUrl} alt="avatar preview" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-dashed border-white/10 flex items-center justify-center text-zinc-600 text-xs">AI</div>
                )}
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingAvatar ? "Uploading…" : customAvatarUrl ? "Change Image" : "Upload Image"}
                </button>
                {customAvatarUrl && (
                  <button type="button" onClick={() => setCustomAvatarUrl("")} className="text-xs text-zinc-600 hover:text-red-400 transition-colors">Remove</button>
                )}
                <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                <span className="text-[10px] text-zinc-600">Leave empty for auto-generated SVG avatar</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                id="agent-create-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-purple hover:bg-purple-600 font-semibold font-display text-xs text-white shadow-lg shadow-brand-purple/20 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all flex items-center justify-center gap-2"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>{loading ? "Assembling cognitive layers..." : "Deploy AI Agent Worker"}</span>
              </button>
              {lastDeployedAddress && !loading && (
                <div className="flex justify-center pt-1">
                  <BaseScanLink value={lastDeployedAddress} badge label="View deployed agent on BaseScan ↗" />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Chat box container */}
        {activeChatAgent && (
          <div className="glass-panel p-6 rounded-2xl border border-brand-purple/40 bg-zinc-950 space-y-4 animate-fade-in flex flex-col justify-between min-h-[350px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <img src={activeChatAgent.avatarUrl} alt={activeChatAgent.name} className="w-8 h-8 rounded-lg object-cover border border-white/5" />
                <div>
                  <h3 className="text-xs font-bold text-white font-display leading-tight">{activeChatAgent.name} Chat</h3>
                  <span className="text-[9px] font-mono font-bold text-brand-purple uppercase">Directives Node Active</span>
                </div>
              </div>
              <button 
                id="close-agent-chat-btn"
                onClick={() => setActiveChatAgent(null)} 
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Cognitive Diagnostics HUD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] font-mono bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 text-zinc-400">
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 uppercase">Response Mode:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5" /> LOW LATENCY
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 uppercase">Average Latency:</span>
                <span className="text-white font-bold">~240ms (cached)</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 uppercase">Security Audit:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> SECURE
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 uppercase">Sponsorship Gas:</span>
                <span className="text-brand-purple font-bold">100% COVERED</span>
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto space-y-3.5 max-h-48 pr-1">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl p-2.5 text-[11px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-purple text-white rounded-br-none"
                      : "bg-zinc-900 border border-white/5 text-zinc-300 rounded-bl-none"
                  }`}>
                    <p className="whitespace-pre-line">{m.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900 border border-white/5 rounded-xl p-2.5 text-[11px] text-zinc-400 flex items-center gap-1.5 rounded-bl-none">
                    <Bot className="w-3.5 h-3.5 text-brand-purple animate-bounce" />
                    <span>Processing cognitive token directives...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-white/5 pt-3">
              <input
                id="agent-chat-message-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask your agent a question..."
                className="bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white flex-1 focus:outline-none focus:border-brand-purple/40 placeholder:text-zinc-700"
              />
              <button
                id="agent-chat-send-btn"
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 bg-brand-purple hover:bg-purple-600 rounded-xl text-white disabled:bg-zinc-800 disabled:text-zinc-500 transition-all flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Deployed AI Agents List */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Bot className="w-4 h-4 text-brand-purple" /> Deployed AI Workers
        </h3>

        {agents.length === 0 ? (
          <div className="text-center py-24 bg-zinc-950/20 border border-dashed border-white/5 rounded-2xl">
            <BrainCircuit className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No autonomous agents deployed.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {agents.map((agent) => (
              <div key={agent.id} className="glass-panel rounded-2xl border border-white/5 p-4 bg-zinc-900/10 space-y-4">
                <div className="flex gap-3">
                  <img src={agent.avatarUrl} alt={agent.name} className="w-12 h-12 rounded-xl object-cover border border-white/5 shrink-0" />
                  <div>
                    <h4 className="font-display font-bold text-white text-xs">{agent.name}</h4>
                    <span className="block text-[9px] font-mono text-brand-purple font-bold uppercase">{agent.symbol} Agent</span>
                    <span className="block text-[8px] font-mono text-zinc-500 truncate max-w-[150px]">Token Address: {agent.contractAddress}</span>
                  </div>
                </div>

                <p className="text-zinc-400 text-[10px] leading-normal line-clamp-2">
                  {agent.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <div>
                    <span className="text-zinc-500">Sub Fee: </span>
                    <span className="text-emerald-400 font-bold">{agent.usageFeeEth} ETH</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500">Queries: </span>
                    <span className="text-white font-bold">{agent.queryCount}</span>
                  </div>
                </div>

                {/* Prompt Chat Action */}
                <button
                  id={`chat-agent-trigger-${agent.id}`}
                  onClick={() => handleStartChat(agent)}
                  className="w-full py-2 bg-brand-purple/20 hover:bg-brand-purple text-brand-purple hover:text-white border border-brand-purple/30 text-[10px] font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Prompt AI Agent</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
