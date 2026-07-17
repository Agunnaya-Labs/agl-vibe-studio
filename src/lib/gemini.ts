export interface AIProjectResult {
  name: string;
  symbol: string;
  description: string;
  solidityCode: string;
  parameters: {
    initialSupply: string;
    mintPrice: string;
    additionalConfig: string;
  };
  securityAudit: string;
  uiTheme: {
    primaryColor: string;
    glowColor: string;
  };
  launchChecklist: string[];
}

export async function generateProjectAI(prompt: string, type: string): Promise<AIProjectResult> {
  const response = await fetch("/api/ai/build", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, type }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate project. Code: ${response.status}`);
  }

  return response.json();
}

export async function chatWithAgentAI(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  agentProfile: { name: string; symbol: string; description: string; contractAddress: string }
): Promise<string> {
  const response = await fetch("/api/ai/agent-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, agentProfile }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Autonomous agent system link broken. Code: ${response.status}`);
  }

  const result = await response.json();
  return result.content;
}

export interface ChatAdvancedOptions {
  model?: string;
  thinkingLevel?: "HIGH" | "LOW" | "MINIMAL";
  image?: { data: string; mimeType: string } | null;
  enableMapsGrounding?: boolean;
  location?: { latitude: number; longitude: number } | null;
}

export async function chatWithAgentAdvancedAI(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  agentProfile: { name: string; symbol: string; description: string; contractAddress: string },
  options: ChatAdvancedOptions
): Promise<{ content: string; groundingMetadata?: any }> {
  const response = await fetch("/api/ai/agent-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, agentProfile, ...options }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Autonomous agent advanced cognitive link broken. Code: ${response.status}`);
  }

  return response.json();
}

export async function transcribeAudioAI(audioBytes: string, mimeType?: string): Promise<string> {
  const response = await fetch("/api/ai/transcribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audioBytes, mimeType }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Audio transcription module failed. Code: ${response.status}`);
  }

  const result = await response.json();
  return result.transcription;
}

export async function generateImageAI(prompt: string, aspectRatio?: string, imageSize?: string): Promise<string> {
  const response = await fetch("/api/ai/generate-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, aspectRatio, imageSize }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Image generator module rejected task. Code: ${response.status}`);
  }

  const result = await response.json();
  return result.imageUrl;
}

export async function generateVideoStartAI(prompt: string, aspectRatio?: string, resolution?: string, base64Image?: string): Promise<string> {
  const response = await fetch("/api/ai/generate-video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, aspectRatio, resolution, base64Image }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Temporal video rendering start failed. Code: ${response.status}`);
  }

  const result = await response.json();
  return result.operationName;
}

export async function pollVideoStatusAI(operationName: string): Promise<boolean> {
  const response = await fetch("/api/ai/video-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ operationName }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Video status query offline. Code: ${response.status}`);
  }

  const result = await response.json();
  return result.done;
}

export async function optimizeSystemPromptAI(prompt: string): Promise<string> {
  const response = await fetch("/api/ai/optimize-prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to optimize prompt. Code: ${response.status}`);
  }

  const result = await response.json();
  return result.optimizedPrompt;
}

