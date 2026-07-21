import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AIAgent, WalletState } from "../types";
import { AgunnayaDatabase } from "../lib/db";
import ImageWithFallback from "../components/ImageWithFallback";
import { 
  chatWithAgentAdvancedAI, 
  optimizeSystemPromptAI, 
  transcribeAudioAI, 
  generateImageAI, 
  generateVideoStartAI, 
  pollVideoStatusAI 
} from "../lib/gemini";
import { 
  Bot, Send, BrainCircuit, X, MessageSquare, Plus, Zap, Award, Coins, 
  Sparkles, Cpu, Layers, ShieldCheck, Mic, MicOff, Image as ImageIcon, 
  MapPin, Eye, Film, Download, RefreshCw, Sliders, Play, Trash2, Loader2, Info
} from "lucide-react";

interface AgentStudioPageProps {
  wallet: WalletState;
  agents: AIAgent[];
  onRefreshAgents: () => void;
  addTerminalLog: (type: "info" | "success" | "error" | "buy" | "sell" | "system", message: string) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: string;
  groundingMetadata?: any;
}

export default function AgentStudioPage({ wallet, agents, onRefreshAgents, addTerminalLog, showToast }: AgentStudioPageProps) {
  // Tabs: "agents" (Agent Forge & chats) or "creative" (Media Generator)
  const [activeTab, setActiveTab] = useState<"agents" | "creative">("agents");

  // Agent Creator State
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [subFee, setSubFee] = useState("0.001");
  const [loading, setLoading] = useState(false);

  // Active chat state
  const [activeChatAgent, setActiveChatAgent] = useState<AIAgent | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [optimizingPrompt, setOptimizingPrompt] = useState(false);

  // Advanced Chat Settings State
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash");
  const [highThinking, setHighThinking] = useState(false);
  const [enableMapsGrounding, setEnableMapsGrounding] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ data: string; mimeType: string } | null>(null);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Creative Studio State (Image)
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");
  const [imageSize, setImageSize] = useState("1K");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");

  // Creative Studio State (Video)
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");
  const [videoResolution, setVideoResolution] = useState("720p");
  const [videoStartImage, setVideoStartImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");

  // Reassuring messages for long-running video tasks
  const videoLoadingMessages = [
    "Assembling temporal dimensions...",
    "Casting holographic projection...",
    "Synthesizing motion vectors...",
    "Compiling fluid simulation...",
    "Resolving cinematic lighting arrays..."
  ];

  // Optimize System directive prompt
  const handleOptimizePrompt = async () => {
    if (!systemPrompt.trim() || optimizingPrompt) return;
    setOptimizingPrompt(true);
    addTerminalLog("system", "AI Agent Optimizer: Initializing cognitive tuning pipeline via Gemini...");
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

  // Deploy AI Agent
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
      const mockAvatar = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=60";

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
        avatarUrl: mockAvatar,
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

      addTerminalLog("success", `AI Agent fully registered. Metadata synced with token model: ${newAgent.contractAddress}`);
      setLoading(false);
      setName("");
      setSymbol("");
      setDescription("");
      setSystemPrompt("");
    }, 2000);
  };

  // Start chat with a specific agent
  const handleStartChat = (agent: AIAgent) => {
    setActiveChatAgent(agent);
    setChatMessages([
      { role: "assistant", content: `I am ${agent.name} (${agent.symbol}). My active directives: "${agent.description}". How may I assist you today?` }
    ]);
    setAttachedImage(null);
  };

  // Send message in advanced chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !attachedImage || chatLoading || !activeChatAgent) return;

    const userText = chatInput.trim();
    const currentAttachedImage = attachedImage;
    
    setChatInput("");
    setAttachedImage(null);
    
    const userMsg: ChatMessage = { 
      role: "user", 
      content: userText || "Analyze attached image", 
      image: currentAttachedImage ? `data:${currentAttachedImage.mimeType};base64,${currentAttachedImage.data}` : undefined 
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const apiMessages = chatMessages.map(m => ({ role: m.role, content: m.content }));
      apiMessages.push({ role: "user", content: userText });

      const result = await chatWithAgentAdvancedAI(
        apiMessages,
        activeChatAgent,
        {
          model: selectedModel,
          thinkingLevel: highThinking ? "HIGH" : "LOW",
          image: currentAttachedImage,
          enableMapsGrounding,
          location
        }
      );

      const response = result.content;
      const words = response.split(" ");
      let currentText = "";
      let wordIdx = 0;
      
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: "", 
        groundingMetadata: result.groundingMetadata 
      }]);

      const interval = setInterval(() => {
        if (wordIdx < words.length) {
          currentText += (wordIdx === 0 ? "" : " ") + words[wordIdx];
          setChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { 
              ...updated[updated.length - 1], 
              content: currentText 
            };
            return updated;
          });
          wordIdx++;
        } else {
          clearInterval(interval);
          setChatLoading(false);
        }
      }, 15);

      if (wallet.isConnected) {
        let updatedWallet: WalletState;
        const currentCredits = wallet.aglCredits || 0;
        
        if (currentCredits >= 10) {
          const remainingCredits = currentCredits - 10;
          updatedWallet = {
            ...wallet,
            aglCredits: remainingCredits
          };
          showToast("Query sponsored with 10 AGL Credits!", "success");
          addTerminalLog("system", `AGENT HARNESS: Sponsored query using 10 computational credits for ${activeChatAgent.name}.`);
        } else {
          updatedWallet = { 
            ...wallet, 
            balanceEth: Math.max(0, wallet.balanceEth - activeChatAgent.usageFeeEth) 
          };
          showToast(`Paid subscription fee: ${activeChatAgent.usageFeeEth} ETH`, "info");
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

  // Audio transcription voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Bytes = base64data.split(',')[1];
          try {
            showToast("Transcribing voice recording...", "info");
            const text = await transcribeAudioAI(base64Bytes, "audio/wav");
            setChatInput(prev => prev ? prev + " " + text : text);
            showToast("Voice transcribed successfully!", "success");
          } catch (err: any) {
            showToast("Transcription failed: " + err.message, "error");
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      showToast("Recording audio... speak into your mic", "info");
    } catch (err: any) {
      showToast("Could not access microphone: " + err.message, "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Attach image to chat prompt
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1];
      setAttachedImage({
        data: base64Data,
        mimeType: file.type
      });
      showToast("Image attached! Submit to analyze.", "success");
    };
    reader.readAsDataURL(file);
  };

  // Google Maps Location Grounding
  const handleToggleMaps = () => {
    if (!enableMapsGrounding) {
      if (navigator.geolocation) {
        showToast("Requesting GPS coordinate grounding...", "info");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            setEnableMapsGrounding(true);
            showToast("Google Maps Grounding activated!", "success");
          },
          (err) => {
            showToast("GPS location denied. General grounding active.", "info");
            setEnableMapsGrounding(true);
          }
        );
      } else {
        setEnableMapsGrounding(true);
      }
    } else {
      setEnableMapsGrounding(false);
      setLocation(null);
    }
  };

  // Creative Studio: Generate high-quality image
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setGeneratedImageUrl("");
    showToast("Dispatching text-to-image pipeline...", "info");
    try {
      const url = await generateImageAI(imagePrompt, imageAspectRatio, imageSize);
      setGeneratedImageUrl(url);
      showToast("High-quality asset generated!", "success");
    } catch (err: any) {
      showToast("Image generation failed: " + err.message, "error");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Creative Studio: Attach image for video start frame
  const handleVideoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1];
      setVideoStartImage({
        data: base64Data,
        mimeType: file.type
      });
      showToast("Starting frame image attached!", "success");
    };
    reader.readAsDataURL(file);
  };

  // Creative Studio: Generate Veo Video
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || isVideoGenerating) return;
    setIsVideoGenerating(true);
    setGeneratedVideoUrl("");
    setVideoProgress("Initializing Veo 3 rendering framework...");
    showToast("Launching video synthesis thread...", "info");

    let msgIndex = 0;
    const progressInterval = setInterval(() => {
      setVideoProgress(videoLoadingMessages[msgIndex % videoLoadingMessages.length]);
      msgIndex++;
    }, 4500);

    try {
      const opName = await generateVideoStartAI(
        videoPrompt, 
        videoAspectRatio, 
        videoResolution, 
        videoStartImage?.data
      );
      
      setVideoProgress("Syncing with operation worker node...");

      // Poll loop
      let done = false;
      while (!done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        done = await pollVideoStatusAI(opName);
      }

      setVideoProgress("Downloading high-fidelity MP4 payload...");
      
      const res = await fetch("/api/ai/video-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName: opName })
      });

      if (!res.ok) throw new Error("Could not pull final video payload.");

      const blob = await res.blob();
      const videoUrl = URL.createObjectURL(blob);
      setGeneratedVideoUrl(videoUrl);
      showToast("Veo Video rendered successfully!", "success");
    } catch (err: any) {
      showToast("Video synthesis failed: " + err.message, "error");
    } finally {
      clearInterval(progressInterval);
      setIsVideoGenerating(false);
      setVideoProgress("");
    }
  };

  return (
    <div id="agent-workspace-container" className="space-y-6">
      
      {/* Workspace Sub Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950/40 p-4 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-xl font-bold font-display text-white flex items-center gap-2">
            <BrainCircuit className="text-brand-purple w-6 h-6 animate-pulse" />
            AGI Agent Workspace & Studio
          </h1>
          <p className="text-xs text-zinc-500 font-sans">
            Power autonomous blockchain consciousness, transcribe speech, grounding maps, and render creative high-quality media.
          </p>
        </div>

        {/* Tab Selection buttons */}
        <div className="flex gap-2 bg-zinc-900/60 p-1 rounded-xl border border-white/5">
          <button
            id="tab-agents"
            onClick={() => setActiveTab("agents")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-display transition-all ${
              activeTab === "agents"
                ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Agent Forge & Chats
          </button>
          <button
            id="tab-creative"
            onClick={() => setActiveTab("creative")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-display transition-all ${
              activeTab === "creative"
                ? "bg-brand-purple text-white shadow-lg shadow-brand-purple/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Creative Media Studio
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "agents" ? (
          <motion.div 
            key="agents-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
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
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-purple/40"
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
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white uppercase focus:outline-none focus:border-brand-purple/40 font-mono font-bold"
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
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-purple/40"
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
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-purple/40 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500">System Directive Prompt (Behavior Control Directives)</label>
                      <button
                        type="button"
                        id="btn-optimize-directive"
                        onClick={handleOptimizePrompt}
                        disabled={optimizingPrompt || !systemPrompt.trim()}
                        className="text-[10px] px-2.5 py-1 rounded bg-brand-purple/10 border border-brand-purple/20 hover:bg-brand-purple hover:border-brand-purple text-brand-purple hover:text-white transition-all duration-200 flex items-center gap-1 font-mono font-bold disabled:opacity-40 disabled:hover:bg-brand-purple/10 disabled:hover:text-brand-purple disabled:hover:border-brand-purple/20 cursor-pointer"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${optimizingPrompt ? "animate-spin" : ""}`} />
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
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-brand-purple/40"
                    />
                  </div>

                  <button
                    id="agent-create-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-brand-purple hover:bg-purple-600 font-semibold font-display text-xs text-white shadow-lg shadow-brand-purple/20 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all flex items-center justify-center gap-2"
                  >
                    <BrainCircuit className="w-4 h-4" />
                    <span>{loading ? "Assembling cognitive layers..." : "Deploy AI Agent Worker"}</span>
                  </button>
                </form>
              </div>

              {/* Advanced Chat Panel Box */}
              {activeChatAgent && (
                <div className="glass-panel p-6 rounded-2xl border border-brand-purple/40 bg-zinc-950 space-y-4 animate-fade-in flex flex-col justify-between min-h-[460px]">
                  {/* Chat Panel Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <ImageWithFallback src={activeChatAgent.avatarUrl} alt={activeChatAgent.name} fallbackText={activeChatAgent.symbol} className="w-10 h-10 rounded-xl object-cover border border-white/5" />
                      <div>
                        <h3 className="text-sm font-bold text-white font-display leading-tight">{activeChatAgent.name} Chat</h3>
                        <span className="text-[10px] font-mono font-bold text-brand-purple uppercase">Directives Node Active</span>
                      </div>
                    </div>

                    {/* Model Switcher row inside header */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/40 p-1 rounded-xl border border-white/5">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold px-1.5">Model:</span>
                      <button
                        onClick={() => { setSelectedModel("gemini-3.5-flash"); setHighThinking(false); }}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold transition-all ${
                          selectedModel === "gemini-3.5-flash"
                            ? "bg-zinc-800 text-white border border-white/10"
                            : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        flash (General)
                      </button>
                      <button
                        onClick={() => setSelectedModel("gemini-3.1-pro-preview")}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold transition-all ${
                          selectedModel === "gemini-3.1-pro-preview"
                            ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30"
                            : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        pro (Thinking)
                      </button>
                      <button
                        onClick={() => { setSelectedModel("gemini-3.1-flash-lite"); setHighThinking(false); }}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold transition-all ${
                          selectedModel === "gemini-3.1-flash-lite"
                            ? "bg-brand-blue/20 text-brand-blue border border-brand-blue/30"
                            : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        lite (Fast)
                      </button>
                    </div>

                    <button 
                      id="close-agent-chat-btn"
                      onClick={() => { setActiveChatAgent(null); setAttachedImage(null); }} 
                      className="text-zinc-500 hover:text-white absolute right-6 top-6 md:static"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cognitive Tuning Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-900/30 p-3 rounded-xl border border-white/5 text-[10px]">
                    {/* High Thinking switch (pro-only) */}
                    <div className="flex items-center justify-between bg-zinc-950/40 p-2 rounded-lg border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-zinc-400 font-bold flex items-center gap-1 font-mono uppercase">
                          <Cpu className="w-3.5 h-3.5 text-brand-purple" /> Reasoning Depth
                        </span>
                        <span className="text-[9px] text-zinc-500">Enable deep-thinking mode</span>
                      </div>
                      <input 
                        type="checkbox" 
                        disabled={selectedModel !== "gemini-3.1-pro-preview"}
                        checked={highThinking && selectedModel === "gemini-3.1-pro-preview"}
                        onChange={(e) => setHighThinking(e.target.checked)}
                        className="rounded bg-zinc-950 border-white/10 text-brand-purple focus:ring-brand-purple w-4 h-4 cursor-pointer disabled:opacity-30"
                      />
                    </div>

                    {/* Google Maps grounding switch */}
                    <div className="flex items-center justify-between bg-zinc-950/40 p-2 rounded-lg border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-zinc-400 font-bold flex items-center gap-1 font-mono uppercase">
                          <MapPin className="w-3.5 h-3.5 text-brand-blue" /> Maps Grounding
                        </span>
                        <span className="text-[9px] text-zinc-500">{location ? "GPS coordinates attached" : "Attach local coordinates"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleMaps}
                        className={`w-8 h-4 rounded-full transition-all relative ${
                          enableMapsGrounding ? "bg-brand-blue" : "bg-zinc-800"
                        }`}
                      >
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                          enableMapsGrounding ? "right-0.5" : "left-0.5"
                        }`}></span>
                      </button>
                    </div>

                    {/* Attachment Info */}
                    <div className="flex items-center gap-2 bg-zinc-950/40 p-2 rounded-lg border border-white/5 font-mono text-zinc-400 text-[9px]">
                      <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <div>
                        <span className="block text-zinc-500 font-bold">MULTIMODAL STATUS:</span>
                        <span>{attachedImage ? "Image ready for analysis" : "No image files loaded"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages List */}
                  <div className="flex-1 overflow-y-auto space-y-4 max-h-64 pr-1 min-h-[160px] border border-white/5 bg-zinc-950/60 p-4 rounded-xl">
                    {chatMessages.map((m, idx) => (
                      <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          m.role === "user"
                            ? "bg-brand-purple/25 text-white border border-brand-purple/30 rounded-br-none"
                            : "bg-zinc-900 border border-white/5 text-zinc-200 rounded-bl-none"
                        }`}>
                          {m.role === "assistant" && (
                            <div className="flex items-center gap-1.5 mb-1.5 text-[9px] text-brand-purple font-bold uppercase tracking-wider font-mono">
                              <Bot className="w-3.5 h-3.5" />
                              <span>{activeChatAgent.name} Consciousness</span>
                            </div>
                          )}

                          {m.image && (
                            <img src={m.image} alt="Chat attachment" className="max-w-[200px] max-h-[150px] rounded-lg object-cover mb-2 border border-white/10" />
                          )}

                          <p className="whitespace-pre-line text-zinc-200 font-sans">{m.content}</p>

                          {/* Grounding references link list */}
                          {m.groundingMetadata?.groundingChunks && (
                            <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
                              <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-mono font-bold">Grounded References:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {m.groundingMetadata.groundingChunks.map((chunk: any, cidx: number) => {
                                  const url = chunk.maps?.uri || chunk.web?.uri;
                                  const label = chunk.maps?.title || chunk.web?.title || "Maps Reference";
                                  if (!url) return null;
                                  return (
                                    <a 
                                      key={cidx}
                                      href={url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="inline-flex items-center gap-1 text-[9px] bg-brand-blue/15 hover:bg-brand-blue/25 text-brand-blue px-2 py-0.5 rounded border border-brand-blue/30 font-mono transition-all"
                                    >
                                      <MapPin className="w-2.5 h-2.5" />
                                      <span>{label}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-3 text-xs text-zinc-400 rounded-bl-none flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-brand-purple animate-spin" />
                          <span className="font-mono text-[10px]">Processing cognitive directives via {selectedModel}...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Input with Voice Recording and Image Attachments */}
                  <form onSubmit={handleSendChatMessage} className="space-y-3 pt-2">
                    {attachedImage && (
                      <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 p-2 rounded-xl text-xs text-white max-w-xs animate-fade-in relative">
                        <img 
                          src={`data:${attachedImage.mimeType};base64,${attachedImage.data}`} 
                          alt="Thumbnail preview" 
                          className="w-10 h-10 object-cover rounded-lg border border-white/10" 
                        />
                        <div className="flex-1 overflow-hidden">
                          <span className="block text-[10px] text-zinc-400 font-mono uppercase font-bold">Attached Asset</span>
                          <span className="block text-[8px] text-zinc-500 truncate">{attachedImage.mimeType} Data payload</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setAttachedImage(null)}
                          className="text-zinc-500 hover:text-white hover:bg-white/5 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 p-1.5 rounded-xl focus-within:border-brand-purple/40 transition-all">
                      {/* Attach Image button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-zinc-500 hover:text-brand-purple hover:bg-white/5 rounded-lg transition-all"
                        title="Attach image for Multimodal analysis"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden" 
                      />

                      {/* Microphone Transcription button */}
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2 rounded-lg transition-all ${
                          isRecording 
                            ? "bg-red-500/15 text-red-500 animate-pulse" 
                            : "text-zinc-500 hover:text-brand-purple hover:bg-white/5"
                        }`}
                        title={isRecording ? "Stop voice recording" : "Record audio for voice transcription"}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      {/* Chat Input Text */}
                      <input
                        id="agent-chat-message-input"
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={isRecording ? "Recording speech... Speak clearly." : "Type a message or use speech recorder..."}
                        disabled={chatLoading}
                        className="bg-transparent flex-1 focus:outline-none px-2 py-1 text-xs text-white placeholder:text-zinc-600"
                      />

                      <button
                        id="agent-chat-send-btn"
                        type="submit"
                        disabled={chatLoading || (!chatInput.trim() && !attachedImage)}
                        className="p-2 bg-brand-purple hover:bg-purple-600 rounded-lg text-white disabled:bg-zinc-800 disabled:text-zinc-500 transition-all flex items-center justify-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                  {agents.map((agent) => (
                    <div key={agent.id} className="glass-panel rounded-2xl border border-white/5 p-4 bg-zinc-900/10 space-y-4">
                      <div className="flex gap-3">
                      <ImageWithFallback src={agent.avatarUrl} alt={agent.name} fallbackText={agent.symbol} className="w-12 h-12 rounded-xl object-cover border border-white/5 shrink-0" />
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
          </motion.div>
        ) : (
          <motion.div 
            key="creative-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Image Generator space */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-6">
              <div>
                <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-brand-purple animate-pulse" />
                  High-Quality Image Generator
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Synthesize high-fidelity visual assets, token icons, or landing headers utilizing the advanced gemini-3.1-flash-image cognitive framework.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Aspect Ratio</label>
                    <select
                      value={imageAspectRatio}
                      onChange={(e) => setImageAspectRatio(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                    >
                      <option value="1:1">Square (1:1)</option>
                      <option value="16:9">Widescreen (16:9)</option>
                      <option value="9:16">Portrait (9:16)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Image Resolution</label>
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                    >
                      <option value="512px">Standard 512px</option>
                      <option value="1K">High Quality 1K</option>
                      <option value="2K">Ultra Quality 2K</option>
                      <option value="4K">Extreme Quality 4K</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Visual Prompt Instructions</label>
                  <textarea
                    rows={4}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe what you want to synthesize: e.g. An elegant dark-themed Web3 workspace with neon cyan dashboard graphics, high-contrast, cyberpunk aesthetic, matte glass finishes..."
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-purple/40"
                  />
                </div>

                <button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  className="w-full py-3 rounded-xl bg-brand-purple hover:bg-purple-600 font-semibold font-display text-xs text-white shadow-lg shadow-brand-purple/20 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all flex items-center justify-center gap-2"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing visual matrices...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Render High-Quality Asset</span>
                    </>
                  )}
                </button>
              </div>

              {/* Viewport for generated image */}
              <div className="border border-white/5 rounded-2xl bg-black/40 min-h-[220px] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {isGeneratingImage ? (
                  <div className="text-center space-y-2 animate-pulse">
                    <Sparkles className="w-8 h-8 text-brand-purple mx-auto animate-spin" />
                    <p className="text-xs text-zinc-500 font-mono">Resolving color coordinate planes...</p>
                  </div>
                ) : generatedImageUrl ? (
                  <div className="w-full text-center space-y-4">
                    <img 
                      src={generatedImageUrl} 
                      alt="Synthesized AI Asset" 
                      className="max-h-[300px] mx-auto rounded-xl border border-white/10 shadow-2xl object-contain bg-zinc-950" 
                    />
                    <a
                      href={generatedImageUrl}
                      download="synthesized_asset.png"
                      className="inline-flex items-center gap-1.5 text-xs text-brand-purple hover:text-white bg-brand-purple/10 hover:bg-brand-purple border border-brand-purple/30 px-4 py-2 rounded-xl font-mono font-bold transition-all"
                    >
                      <Download className="w-4 h-4" /> Download Asset
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-600 font-mono text-xs">
                    <Eye className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                    <span>Visual layout viewport is idle. Enter prompt above.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Veo Video Generator space */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-zinc-900/10 space-y-6">
              <div>
                <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-brand-purple animate-pulse" />
                  Veo 3 Temporal Video Synthesizer
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Generate immersive high-fidelity cinematic video loops or loading clips from text prompts or an initial reference image.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Aspect Ratio</label>
                    <select
                      value={videoAspectRatio}
                      onChange={(e) => setVideoAspectRatio(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                    >
                      <option value="16:9">Landscape (16:9)</option>
                      <option value="9:16">Portrait (9:16)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Resolution</label>
                    <select
                      value={videoResolution}
                      onChange={(e) => setVideoResolution(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                    >
                      <option value="720p">HD 720p</option>
                      <option value="1080p">Full HD 1080p</option>
                    </select>
                  </div>
                </div>

                {/* Optional Starting Frame attachment */}
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Start Frame Reference Image (Optional)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleVideoImageChange}
                      className="hidden"
                      id="video-image-input"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("video-image-input")?.click()}
                      className="px-4 py-2.5 bg-zinc-950 border border-white/10 hover:border-brand-purple/30 rounded-xl text-xs text-zinc-400 hover:text-white transition-all font-mono"
                    >
                      {videoStartImage ? "Change Image" : "Attach Starting Image"}
                    </button>
                    {videoStartImage && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                        <img 
                          src={`data:${videoStartImage.mimeType};base64,${videoStartImage.data}`} 
                          alt="Thumbnail" 
                          className="w-8 h-8 rounded border border-white/15 object-cover" 
                        />
                        <button type="button" onClick={() => setVideoStartImage(null)} className="text-red-400 hover:text-red-300">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 mb-1.5">Video Prompt Instructions</label>
                  <textarea
                    rows={2}
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="Describe the motion scene: e.g. A digital golden coin flipping endlessly through deep indigo galactic void, sparks of code and glowing starlight..."
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-purple/40"
                  />
                </div>

                <button
                  onClick={handleGenerateVideo}
                  disabled={isVideoGenerating || !videoPrompt.trim()}
                  className="w-full py-3 rounded-xl bg-brand-purple hover:bg-purple-600 font-semibold font-display text-xs text-white shadow-lg shadow-brand-purple/20 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all flex items-center justify-center gap-2"
                >
                  {isVideoGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating temporal video...</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-4 h-4 text-white" />
                      <span>Synthesize Veo Cinematic</span>
                    </>
                  )}
                </button>
              </div>

              {/* Viewport for video rendering */}
              <div className="border border-white/5 rounded-2xl bg-black/40 min-h-[200px] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {isVideoGenerating ? (
                  <div className="text-center space-y-3 p-4">
                    <Loader2 className="w-8 h-8 text-brand-purple mx-auto animate-spin" />
                    <p className="text-xs font-mono text-white animate-pulse">{videoProgress}</p>
                    <p className="text-[10px] text-zinc-600 font-mono">Note: Cinematic video synthesis usually takes ~1-2 minutes. Please remain connected.</p>
                  </div>
                ) : generatedVideoUrl ? (
                  <div className="w-full text-center space-y-4">
                    <video 
                      src={generatedVideoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="max-h-[300px] mx-auto rounded-xl border border-white/10 shadow-2xl bg-zinc-950"
                    />
                    <a
                      href={generatedVideoUrl}
                      download="veo_synthesis.mp4"
                      className="inline-flex items-center gap-1.5 text-xs text-brand-purple hover:text-white bg-brand-purple/10 hover:bg-brand-purple border border-brand-purple/30 px-4 py-2 rounded-xl font-mono font-bold transition-all"
                    >
                      <Download className="w-4 h-4" /> Download Video
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-600 font-mono text-xs">
                    <Play className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                    <span>Cinematic rendering engine is idle. Submit prompt above.</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
