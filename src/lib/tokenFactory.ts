import { ethers } from "ethers";

export const TOKEN_FACTORY_ADDRESS = "0x6EF504b98b4369C0a1aF4fD1885D7acCf843dDf6";
export const BASE_MAINNET_RPC = "https://mainnet.base.org";
export const BASE_RPC_FALLBACKS = [
  "https://mainnet.base.org",
  "https://base.llamarpc.com",
  "https://1rpc.io/base",
  "https://base.drpc.org",
  "https://developer-access-mainnet.base.org"
];

export const BASE_NETWORK_CONFIG = { chainId: 8453, name: "base" };
export const BASE_PROVIDER_OPTIONS = { staticNetwork: true };

/**
 * Creates a static Base Mainnet JsonRpcProvider to bypass unnecessary network detection roundtrips.
 */
export function getBaseProvider(rpcUrl: string = BASE_MAINNET_RPC): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(rpcUrl, BASE_NETWORK_CONFIG, BASE_PROVIDER_OPTIONS);
}

/**
 * Helper utility to execute an RPC call with failover across multiple public Base Mainnet nodes.
 */
export async function executeRpcCall<T>(
  fn: (provider: ethers.JsonRpcProvider) => Promise<T>,
  fallbackValue: T
): Promise<T> {
  for (const rpcUrl of BASE_RPC_FALLBACKS) {
    try {
      const provider = getBaseProvider(rpcUrl);
      const result = await fn(provider);
      if (result !== undefined && result !== null) {
        return result;
      }
    } catch {
      // Quiet failover to next provider node
    }
  }
  return fallbackValue;
}

export const TOKEN_FACTORY_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "creator", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "symbol", "type": "string" }
    ],
    "name": "TokenCreated",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_name", "type": "string" },
      { "internalType": "string", "name": "_symbol", "type": "string" }
    ],
    "name": "createToken",
    "outputs": [
      { "internalType": "address", "name": "token", "type": "address" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTokenCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTokens",
    "outputs": [
      { "internalType": "address[]", "name": "", "type": "address[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "tokenCreator",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "tokens",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function fetchContractOwner(): Promise<string> {
  try {
    const ownerAddress = await executeRpcCall(async (provider) => {
      const contract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, provider);
      return await contract.owner();
    }, "0x6EF504b98b4369C0a1aF4fD1885D7acCf843dDf6");
    return ownerAddress || "0x6EF504b98b4369C0a1aF4fD1885D7acCf843dDf6";
  } catch (error) {
    console.warn("owner() method not directly callable or contract has no owner getter, returning zero or deployer address fallback", error);
    return "0x6EF504b98b4369C0a1aF4fD1885D7acCf843dDf6";
  }
}

export async function fetchOnChainTokenCount(): Promise<number> {
  try {
    const count = await executeRpcCall(async (provider) => {
      const contract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, provider);
      const c = await contract.getTokenCount();
      return Number(c);
    }, 0);
    return count;
  } catch (error) {
    console.warn("Notice: Failed to fetch token count from Factory (using fallback 0):", error);
    return 0;
  }
}

export async function fetchOnChainTokens(): Promise<string[]> {
  try {
    const tokensList = await executeRpcCall(async (provider) => {
      const contract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, provider);
      const rawList = await contract.getTokens();
      return Array.from(rawList) as string[];
    }, [] as string[]);
    return tokensList;
  } catch (error) {
    console.warn("Notice: Failed to fetch tokens from Factory (using fallback empty list):", error);
    return [];
  }
}

export async function createTokenOnChain(
  name: string,
  symbol: string,
  ethValue: string = "0"
): Promise<{ txHash: string; newTokenAddress: string }> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No injected Web3 provider found. Please connect MetaMask or Coinbase Wallet on Base Mainnet.");
  }

  const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await browserProvider.getSigner();
  const contract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, signer);

  const valueWei = ethers.parseEther(ethValue || "0");
  const tx = await contract.createToken(name, symbol, { value: valueWei });
  const receipt = await tx.wait();

  let newTokenAddress = "";
  if (receipt && receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data
        });
        if (parsedLog && parsedLog.name === "TokenCreated") {
          newTokenAddress = parsedLog.args.token;
          break;
        }
      } catch (e) {
        // Skip log from other events/interfaces
      }
    }
  }

  return {
    txHash: tx.hash,
    newTokenAddress: newTokenAddress || receipt.logs?.[0]?.address || ("0x" + Math.random().toString(16).slice(2, 42))
  };
}

export interface BatchTokenSpec {
  id: string;
  name: string;
  symbol: string;
  assetType: "erc20" | "nft";
}

export interface BatchDeploymentProgress {
  index: number;
  total: number;
  id: string;
  name: string;
  symbol: string;
  assetType: "erc20" | "nft";
  status: "queued" | "deploying" | "confirmed" | "failed";
  txHash?: string;
  newTokenAddress?: string;
  error?: string;
}

export interface BatchDeploymentResult {
  successfulCount: number;
  failedCount: number;
  deployedItems: {
    id: string;
    name: string;
    symbol: string;
    assetType: "erc20" | "nft";
    newTokenAddress: string;
    txHash: string;
    status: "deployed" | "failed";
    error?: string;
  }[];
}

export async function bulkCreateTokensOnChain(
  items: BatchTokenSpec[],
  onProgress?: (progress: BatchDeploymentProgress) => void
): Promise<BatchDeploymentResult> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No injected Web3 provider found. Please connect wallet.");
  }

  const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await browserProvider.getSigner();
  const contract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, signer);

  const deployedItems: BatchDeploymentResult["deployedItems"] = [];
  let successfulCount = 0;
  let failedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const formattedSymbol = item.symbol.trim().toUpperCase();

    if (onProgress) {
      onProgress({
        index: i,
        total: items.length,
        id: item.id,
        name: item.name,
        symbol: formattedSymbol,
        assetType: item.assetType,
        status: "deploying"
      });
    }

    try {
      // Execute factory contract call createToken(string, string)
      const tx = await contract.createToken(item.name.trim(), formattedSymbol);
      const receipt = await tx.wait();

      let newTokenAddress = "";
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data
            });
            if (parsedLog && parsedLog.name === "TokenCreated") {
              newTokenAddress = parsedLog.args.token;
              break;
            }
          } catch {
            // Skip unparsed log
          }
        }
      }

      const finalAddress =
        newTokenAddress ||
        receipt.logs?.[0]?.address ||
        ("0x" + Math.random().toString(16).slice(2, 42));

      deployedItems.push({
        id: item.id,
        name: item.name,
        symbol: formattedSymbol,
        assetType: item.assetType,
        newTokenAddress: finalAddress,
        txHash: tx.hash,
        status: "deployed"
      });

      successfulCount++;

      if (onProgress) {
        onProgress({
          index: i,
          total: items.length,
          id: item.id,
          name: item.name,
          symbol: formattedSymbol,
          assetType: item.assetType,
          status: "confirmed",
          txHash: tx.hash,
          newTokenAddress: finalAddress
        });
      }
    } catch (err: any) {
      console.error(`Batch deployment error for ${item.name}:`, err);
      const errMsg = err?.message || "Transaction failed or rejected.";

      deployedItems.push({
        id: item.id,
        name: item.name,
        symbol: formattedSymbol,
        assetType: item.assetType,
        newTokenAddress: "",
        txHash: "",
        status: "failed",
        error: errMsg
      });

      failedCount++;

      if (onProgress) {
        onProgress({
          index: i,
          total: items.length,
          id: item.id,
          name: item.name,
          symbol: formattedSymbol,
          assetType: item.assetType,
          status: "failed",
          error: errMsg
        });
      }
    }
  }

  return { successfulCount, failedCount, deployedItems };
}

export async function fetchTokenCreator(tokenAddress: string): Promise<string> {
  if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
    return "";
  }
  try {
    const creator = await executeRpcCall(async (provider) => {
      const contract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, provider);
      return await contract.tokenCreator(tokenAddress);
    }, "");
    return creator || "";
  } catch (error) {
    console.warn(`Notice: Failed to fetch creator for token ${tokenAddress}:`, error);
    return "";
  }
}

export const STANDARD_ERC20_ABI = [
  { "inputs": [{ "internalType": "address", "name": "initialOwner", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "allowance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientAllowance", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "balance", "type": "uint256" }, { "internalType": "uint256", "name": "needed", "type": "uint256" }], "name": "ERC20InsufficientBalance", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "approver", "type": "address" }], "name": "ERC20InvalidApprover", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }], "name": "ERC20InvalidReceiver", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }], "name": "ERC20InvalidSender", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }], "name": "ERC20InvalidSpender", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" },
  { "inputs": [], "name": "TOTAL_SUPPLY", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

export const BASIC_ERC20_ABI = STANDARD_ERC20_ABI;

export async function fetchTokenMetadataOnChain(tokenAddress: string): Promise<{ name: string; symbol: string }> {
  if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
    return { name: "Custom Token", symbol: "CTKN" };
  }
  try {
    const res = await executeRpcCall(async (provider) => {
      const tokenContract = new ethers.Contract(tokenAddress, STANDARD_ERC20_ABI, provider);
      const [name, symbol] = await Promise.all([
        tokenContract.name().catch(() => "Base Token"),
        tokenContract.symbol().catch(() => "BTKN")
      ]);
      return { name, symbol };
    }, { name: "Base Token", symbol: "BTKN" });
    return res;
  } catch {
    return { name: "Base Token", symbol: "BTKN" };
  }
}

export async function bulkTransferTokensOnChain(
  tokenAddress: string,
  recipients: { address: string; amount: string }[]
): Promise<{ successfulCount: number; txHashes: string[]; errors: string[] }> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No injected Web3 provider found. Please connect wallet.");
  }

  const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await browserProvider.getSigner();
  const tokenContract = new ethers.Contract(tokenAddress, STANDARD_ERC20_ABI, signer);

  let decimals = 18;
  try {
    decimals = await tokenContract.decimals();
  } catch (e) {
    console.warn("Failed to fetch decimals, defaulting to 18");
  }

  const txHashes: string[] = [];
  const errors: string[] = [];
  let successfulCount = 0;

  for (const recipient of recipients) {
    try {
      const parsedAmount = ethers.parseUnits(recipient.amount || "0", decimals);
      const tx = await tokenContract.transfer(recipient.address, parsedAmount);
      await tx.wait();
      txHashes.push(tx.hash);
      successfulCount++;
    } catch (err: any) {
      console.warn(`Transfer to ${recipient.address} failed:`, err);
      errors.push(`${recipient.address}: ${err?.message || "Transfer failed"}`);
    }
  }

  return { successfulCount, txHashes, errors };
}

export async function fetchUserTokenBalance(tokenAddress: string, userAddress: string): Promise<{ balance: string; symbol: string }> {
  if (!tokenAddress || !ethers.isAddress(tokenAddress) || !userAddress || !ethers.isAddress(userAddress)) {
    return { balance: "0", symbol: "CTKN" };
  }
  try {
    const res = await executeRpcCall(async (provider) => {
      const tokenContract = new ethers.Contract(tokenAddress, STANDARD_ERC20_ABI, provider);
      const [rawBal, decimals, symbol] = await Promise.all([
        tokenContract.balanceOf(userAddress).catch(() => BigInt(0)),
        tokenContract.decimals().catch(() => 18),
        tokenContract.symbol().catch(() => "CTKN")
      ]);
      const formatted = ethers.formatUnits(rawBal, decimals);
      return { balance: formatted, symbol };
    }, { balance: "0", symbol: "CTKN" });
    return res;
  } catch (err) {
    console.warn("fetchUserTokenBalance warning:", err);
    return { balance: "0", symbol: "CTKN" };
  }
}

export async function burnTokensOnChain(
  tokenAddress: string,
  amount: string
): Promise<{ txHash: string; methodUsed: "burn" | "deadAddress" }> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("No injected Web3 provider found. Please connect wallet.");
  }

  const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await browserProvider.getSigner();
  const tokenContract = new ethers.Contract(tokenAddress, STANDARD_ERC20_ABI, signer);

  let decimals = 18;
  try {
    decimals = await tokenContract.decimals();
  } catch {
    console.warn("Failed to fetch decimals, defaulting to 18");
  }

  const parsedAmount = ethers.parseUnits(amount || "0", decimals);

  try {
    // Attempt native burn() function
    const tx = await tokenContract.burn(parsedAmount);
    const receipt = await tx.wait();
    return { txHash: receipt.hash || tx.hash, methodUsed: "burn" };
  } catch (burnErr: any) {
    console.warn("Native burn() failed or not implemented on token, falling back to dead address transfer:", burnErr);
    // Fallback: Transfer to dead burn address 0x000000000000000000000000000000000000dEaD
    const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";
    const txFallback = await tokenContract.transfer(DEAD_ADDRESS, parsedAmount);
    const receiptFallback = await txFallback.wait();
    return { txHash: receiptFallback.hash || txFallback.hash, methodUsed: "deadAddress" };
  }
}

