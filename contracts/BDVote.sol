// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BDVote - Bangladesh Digital Voting Smart Contract
 * @notice SRS FR-10 (Vote Encryption), FR-11 (Blockchain Storage), FR-12 (One Vote Restriction)
 * @dev Deploy on Sepolia testnet via Remix IDE + MetaMask
 * 
 * HOW TO DEPLOY (Remix IDE):
 * 1. Go to https://remix.ethereum.org
 * 2. Create new file "BDVote.sol" and paste this code
 * 3. Compile with Solidity 0.8.24+
 * 4. Deploy → Environment: "Injected Provider - MetaMask"
 * 5. Select Sepolia network in MetaMask (get free ETH from https://sepoliafaucet.com)
 * 6. Click "Deploy" and confirm in MetaMask
 * 7. Copy the deployed contract address
 */
contract BDVote {
    // ===== State Variables =====
    address public admin;
    bool public electionActive;
    uint256 public totalVotes;

    struct Vote {
        bytes32 voterIdHash;      // keccak256 hash of voter ID (privacy)
        bytes32 encryptedVote;    // encrypted candidate selection
        uint256 timestamp;        // block timestamp
        address submittedBy;      // wallet that submitted
    }

    // All votes stored sequentially
    Vote[] public votes;

    // Track which voter hashes have already voted (FR-12: One Vote Restriction)
    mapping(bytes32 => bool) public hasVoted;

    // ===== Events =====
    event VoteCast(
        bytes32 indexed voterIdHash,
        bytes32 encryptedVote,
        uint256 timestamp,
        uint256 voteIndex
    );
    event ElectionStarted(uint256 timestamp);
    event ElectionEnded(uint256 timestamp);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    // ===== Modifiers =====
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier electionIsActive() {
        require(electionActive, "Election is not active");
        _;
    }

    // ===== Constructor =====
    constructor() {
        admin = msg.sender;
        electionActive = true;
        emit ElectionStarted(block.timestamp);
    }

    // ===== Core Functions =====

    /**
     * @notice Cast a vote (FR-10, FR-11, FR-12)
     * @param voterIdHash keccak256 hash of the voter's NID/ID (privacy preserved)
     * @param encryptedVote encrypted vote data (candidate selection)
     */
    function castVote(bytes32 voterIdHash, bytes32 encryptedVote) external electionIsActive {
        // FR-12: One Vote Restriction - each voter hash can only vote once
        require(!hasVoted[voterIdHash], "This voter has already voted");
        require(voterIdHash != bytes32(0), "Invalid voter ID hash");
        require(encryptedVote != bytes32(0), "Invalid encrypted vote");

        // Mark as voted
        hasVoted[voterIdHash] = true;

        // Store vote on-chain (FR-11: Blockchain/Distributed Storage)
        votes.push(Vote({
            voterIdHash: voterIdHash,
            encryptedVote: encryptedVote,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        }));

        totalVotes++;

        emit VoteCast(voterIdHash, encryptedVote, block.timestamp, totalVotes - 1);
    }

    /**
     * @notice Get total number of votes cast
     */
    function getVoteCount() external view returns (uint256) {
        return totalVotes;
    }

    /**
     * @notice Get vote details by index
     */
    function getVote(uint256 index) external view returns (
        bytes32 voterIdHash,
        bytes32 encryptedVote,
        uint256 timestamp,
        address submittedBy
    ) {
        require(index < votes.length, "Vote index out of bounds");
        Vote storage v = votes[index];
        return (v.voterIdHash, v.encryptedVote, v.timestamp, v.submittedBy);
    }

    /**
     * @notice Check if a voter hash has already voted
     */
    function checkHasVoted(bytes32 voterIdHash) external view returns (bool) {
        return hasVoted[voterIdHash];
    }

    // ===== Admin Functions =====

    function startElection() external onlyAdmin {
        require(!electionActive, "Election already active");
        electionActive = true;
        emit ElectionStarted(block.timestamp);
    }

    function endElection() external onlyAdmin {
        require(electionActive, "Election not active");
        electionActive = false;
        emit ElectionEnded(block.timestamp);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }
}
