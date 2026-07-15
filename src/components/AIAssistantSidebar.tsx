import { useState } from "react";
import { Bot, Send, BrainCircuit, X, MessageSquare, Zap, Coins } from "lucide-react";
import { chatWithAgentAI } from "../lib/gemini";
import { WalletState } from "../types";
import { AgunnayaDatabase } from "../lib/db";

interface AIAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onRefreshWallet: () => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function AIAssistantSidebar({ 
  isOpen, 
  onClose, 
  wallet, 
  onRefreshWallet, 
  showToast 
}: AIAssistantSidebarProps) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Greetings! I am the Agunnaya Labs AI Assistant. Ask me anything about building dApps, deploying on Base, staking, or modeling bonding curve mathematics." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const predefinedQuestions = [
    "Explain the bonding curve math",
    "What is AGL token utility?",
    "How does AA Gas Sponsorship work?"
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    if (wallet.isConnected) {
      const currentCredits = wallet.aglCredits || 0;
      if (currentCredits < 5) {
        showToast("Insufficient credits! 5 AGL Credits required.", "error");
        setMessages(prev => [...prev, { 
          role: "user", 
          content: textToSend.trim() 
        }, {
          role: "assistant",
          content: "⚠️ SYSTEM NOTICE: Insufficient computational credits! Each query to the AI Advisor consumes 5 AGL Credits.\n\nPlease navigate to the **AGL Credits** page from the sidebar and permanently burn AGL tokens on-chain or in the Sepolia Sandbox to earn more computational credits."
        }]);
        setInput("");
        return;
      }

      // Deduct 5 credits
      const updatedWallet: WalletState = {
        ...wallet,
        aglCredits: Math.max(0, currentCredits - 5)
      };
      AgunnayaDatabase.saveWallet(updatedWallet);
      onRefreshWallet();
      showToast("Consumed 5 AGL Credits", "info");
    }

    const userMsg = textToSend.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatWithAgentAI(
        [...messages, { role: "user", content: userMsg }],
        {
          name: "Agunnaya General Assistant",
          symbol: "AGL-AI",
          description: "Decentralized AI Assistant powering Agunnaya Labs Studio.",
          contractAddress: "0xGeneralAssistantContractAddress"
        }
      );

      const words = response.split(" ");
      let currentText = "";
      let wordIdx = 0;
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const interval = setInterval(() => {
        if (wordIdx < words.length) {
          currentText += (wordIdx === 0 ? "" : " ") + words[wordIdx];
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: currentText };
            return updated;
          });
          wordIdx++;
        } else {
          clearInterval(interval);
          setIsLoading(false);
        }
      }, 20);

    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Sorry, I encountered an issue: ${err.message || "Connection refused. Please make sure process.env.GEMINI_API_KEY is configured."}`
      }]);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="ai-assistant-drawer" className="fixed inset-y-0 right-0 w-80 bg-zinc-950/95 border-l border-white/10 z-50 flex flex-col justify-between shadow-2xl backdrop-blur-md animate-slide-in">
      {/* Drawer Header */}
      <div className="p-4 border-b border-white/5 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-purple/20 text-brand-purple">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-display text-white">AI Web3 Advisor</h3>
            <span className="text-[10px] text-zinc-500 font-mono">Powered by Gemini 3.5</span>
          </div>
        </div>
        <button 
          id="close-ai-drawer"
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
              m.role === "user"
                ? "bg-brand-blue text-white rounded-br-none"
                : "bg-zinc-900 border border-white/5 text-zinc-200 rounded-bl-none"
            }`}>
              {m.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-brand-purple font-bold uppercase tracking-wider">
                  <Bot className="w-3.5 h-3.5" />
                  <span>AGL Core</span>
                </div>
              )}
              <p className="whitespace-pre-line">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-3 text-xs text-zinc-400 rounded-bl-none flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-brand-purple animate-bounce" />
              <span>Thinking on Base...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="p-4 border-t border-white/5 bg-zinc-950/50 space-y-3">
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            <Zap className="w-3 h-3 text-brand-purple" /> Recommended Queries
          </span>
          <div className="flex flex-col gap-1">
            {predefinedQuestions.map((q, idx) => (
              <button
                id={`pref-q-${idx}`}
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="w-full text-left text-[10px] text-zinc-400 hover:text-brand-purple bg-zinc-900 hover:bg-brand-purple/5 p-2 rounded-lg border border-white/5 hover:border-brand-purple/20 transition-all font-mono"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Form Input */}
        <form 
          id="ai-assistant-input-form"
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
          className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 p-1 rounded-xl focus-within:border-brand-purple/40 transition-all"
        >
          <input
            id="ai-assistant-text-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a technical question..."
            className="bg-transparent flex-1 focus:outline-none px-2.5 py-1 text-xs text-white placeholder:text-zinc-600"
          />
          <button
            id="ai-assistant-send-button"
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-1.5 bg-brand-purple hover:bg-purple-600 text-white rounded-lg disabled:bg-zinc-800 disabled:text-zinc-500 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
