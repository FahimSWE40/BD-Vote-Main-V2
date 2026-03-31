import { ethers } from 'ethers';

// BDVote Smart Contract ABI (Sepolia Testnet)
export const BD_VOTE_ABI = [
  "function castVote(bytes32 voterIdHash, bytes32 encryptedVote) external",
  "function checkHasVoted(bytes32 voterIdHash) external view returns (bool)",
  "function getVoteCount() external view returns (uint256)",
  "function getVote(uint256 index) external view returns (bytes32 voterIdHash, bytes32 encryptedVote, uint256 timestamp, address submittedBy)",
  "function electionActive() external view returns (bool)",
  "function totalVotes() external view returns (uint256)",
  "event VoteCast(bytes32 indexed voterIdHash, bytes32 encryptedVote, uint256 timestamp, uint256 voteIndex)"
];

// Contract address on Sepolia testnet - UPDATE after Remix deployment
export const BD_VOTE_CONTRACT_ADDRESS = import.meta.env.VITE_BD_VOTE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

// Sepolia RPC
export const SEPOLIA_RPC_URL = "https://rpc.sepolia.org";

/**
 * Check if real blockchain is configured
 */
export function isBlockchainConfigured(): boolean {
  return BD_VOTE_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";
}

/**
 * Generate a keccak256 hash of the voter ID for privacy
 */
export function hashVoterId(voterId: string): string {
  const salt = 'bdvote-election-system-2026';
  return ethers.keccak256(ethers.toUtf8Bytes(`${salt}:${voterId}`));
}

/**
 * Encrypt vote data before blockchain submission (FR-10)
 */
export function encryptVote(voterId: string, candidateId: string): string {
  const timestamp = Date.now().toString();
  const payload = `${voterId}:${candidateId}:${timestamp}`;
  return ethers.keccak256(ethers.toUtf8Bytes(payload));
}

/**
 * Check if a voter has already voted on-chain (FR-12)
 */
export async function checkVotedOnChain(voterId: string): Promise<boolean> {
  if (!isBlockchainConfigured()) return false;
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(BD_VOTE_CONTRACT_ADDRESS, BD_VOTE_ABI, provider);
    const voterIdHash = hashVoterId(voterId);
    return await contract.checkHasVoted(voterIdHash);
  } catch {
    console.error('Failed to check on-chain vote status');
    return false;
  }
}

/**
 * Get total vote count from blockchain
 */
export async function getOnChainVoteCount(): Promise<number> {
  if (!isBlockchainConfigured()) return 0;
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(BD_VOTE_CONTRACT_ADDRESS, BD_VOTE_ABI, provider);
    const count = await contract.getVoteCount();
    return Number(count);
  } catch {
    console.error('Failed to get on-chain vote count');
    return 0;
  }
}

/**
 * Get vote details from blockchain by index
 */
export async function getOnChainVote(index: number): Promise<{
  voterIdHash: string;
  encryptedVote: string;
  timestamp: number;
  submittedBy: string;
} | null> {
  if (!isBlockchainConfigured()) return null;
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(BD_VOTE_CONTRACT_ADDRESS, BD_VOTE_ABI, provider);
    const [voterIdHash, encryptedVote, timestamp, submittedBy] = await contract.getVote(index);
    return {
      voterIdHash,
      encryptedVote,
      timestamp: Number(timestamp),
      submittedBy,
    };
  } catch {
    return null;
  }
}

/**
 * Check if election is active on-chain
 */
export async function isElectionActive(): Promise<boolean> {
  if (!isBlockchainConfigured()) return true;
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const contract = new ethers.Contract(BD_VOTE_CONTRACT_ADDRESS, BD_VOTE_ABI, provider);
    return await contract.electionActive();
  } catch {
    return true;
  }
}

/**
 * Verify a transaction hash on Sepolia
 */
export async function verifyTransaction(txHash: string): Promise<{
  confirmed: boolean;
  blockNumber: number | null;
  timestamp: number | null;
}> {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { confirmed: false, blockNumber: null, timestamp: null };
    }
    const block = await provider.getBlock(receipt.blockNumber);
    return {
      confirmed: receipt.status === 1,
      blockNumber: receipt.blockNumber,
      timestamp: block?.timestamp ?? null,
    };
  } catch {
    return { confirmed: false, blockNumber: null, timestamp: null };
  }
}

/**
 * Format a transaction hash for display (shortened)
 */
export function formatTxHash(txHash: string): string {
  if (!txHash || txHash.length < 10) return txHash;
  return `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;
}

/**
 * Get Sepolia explorer URL for a transaction
 */
export function getExplorerUrl(txHash: string): string {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

/**
 * Generate a deterministic wallet from voter ID
 */
export function generateWalletFromVoterId(voterId: string): {
  address: string;
  privateKey: string;
} {
  const salt = 'bdvote-voting-system-2026';
  const seed = ethers.keccak256(ethers.toUtf8Bytes(`${salt}:${voterId}`));
  const wallet = new ethers.Wallet(seed);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Validate if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}
