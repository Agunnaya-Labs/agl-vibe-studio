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

export async function generateProjectAI(prompt: string, type: string, walletAddress?: string): Promise<AIProjectResult> {
  const response = await fetch("/api/ai/build", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, type, walletAddress }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to generate project. Code: ${response.status}`);
  }

  return response.json();
}

export async function chatWithAgentAI(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  agentProfile: { name: string; symbol: string; description: string; contractAddress: string },
  walletAddress?: string
): Promise<string> {
  const response = await fetch("/api/ai/agent-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, agentProfile, walletAddress }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Autonomous agent system link broken. Code: ${response.status}`);
  }

  const result = await response.json();
  return result.content;
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

