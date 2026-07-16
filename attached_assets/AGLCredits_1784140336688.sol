// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title AGLCredits
/// @notice Permanent burn-for-credits contract powering Vibe Studio's spend-to-use compute model.
///         Users burn AGL (irrecoverably, sent to the canonical dead address) to receive on-chain-recorded
///         credits. An off-chain backend (Vercel + Supabase per Agunnaya Labs' existing stack) indexes
///         `CreditsPurchased` events to maintain a real-time, low-latency credit ledger for metering
///         individual AI calls inside Vibe Studio — burning AGL per keystroke would be both too slow
///         (block confirmation time) and too expensive (gas) for an interactive IDE.
///
///         This contract is intentionally the SOURCE OF TRUTH for "how much AGL has this wallet ever
///         burned for credits" — even if the off-chain ledger is ever lost, corrupted, or disputed,
///         anyone can independently verify a wallet's purchase history on BaseScan via emitted events
///         and the `totalCreditsPurchased` / `totalAGLBurned` views below.
contract AGLCredits is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    /// @dev Canonical Ethereum/Base burn address. Tokens sent here are unrecoverable by anyone,
    ///      including this contract's owner — this is a real burn, not a lock.
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    uint8 private constant AGL_DECIMALS = 18;

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    IERC20 public immutable aglToken;

    /// @notice Credits granted per 1 whole AGL burned. Owner-adjustable so pricing can track
    ///         Anthropic's own per-token API costs over time without redeploying the contract.
    ///         e.g. 1000 = 1000 credits per 1 AGL burned.
    uint256 public creditsPerAGL;

    /// @notice Cumulative credits ever purchased by a wallet (monotonically increasing, never decremented
    ///         on-chain — actual spend/deduction happens in the off-chain ledger, not here).
    mapping(address => uint256) public totalCreditsPurchased;

    /// @notice Cumulative AGL burned by a wallet through this contract.
    mapping(address => uint256) public totalAGLBurnedBy;

    /// @notice Protocol-wide cumulative AGL burned — a public, independently verifiable deflation counter.
    uint256 public totalAGLBurned;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    /// @dev The off-chain indexer listens for this event as the single source of truth for topping up
    ///      a wallet's real-time credit balance in Supabase.
    event CreditsPurchased(address indexed user, uint256 aglBurned, uint256 creditsGranted, uint256 timestamp);
    event RateUpdated(uint256 oldCreditsPerAGL, uint256 newCreditsPerAGL);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error ZeroAmount();
    error ZeroAddress();
    error RateNotSet();

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    /// @param aglTokenAddress Address of the deployed AGL ERC-20 token.
    /// @param initialOwner Address that will own this contract (multisig recommended).
    /// @param initialCreditsPerAGL Starting exchange rate, e.g. 1000 credits per 1 AGL.
    constructor(address aglTokenAddress, address initialOwner, uint256 initialCreditsPerAGL)
        Ownable(initialOwner)
    {
        if (aglTokenAddress == address(0)) revert ZeroAddress();
        if (initialCreditsPerAGL == 0) revert RateNotSet();
        aglToken = IERC20(aglTokenAddress);
        creditsPerAGL = initialCreditsPerAGL;
    }

    // ---------------------------------------------------------------------
    // Core: burn AGL for credits
    // ---------------------------------------------------------------------

    /// @notice Burn `aglAmount` AGL (in wei, 18 decimals) permanently in exchange for compute credits.
    ///         Credits themselves are NOT tracked as spendable balance on-chain — this contract only
    ///         records that the purchase happened. Actual spend-down happens off-chain in Vibe Studio's
    ///         backend ledger, which listens for the CreditsPurchased event below.
    function purchaseCredits(uint256 aglAmount) external nonReentrant whenNotPaused {
        if (aglAmount == 0) revert ZeroAmount();

        uint256 creditsGranted = (aglAmount * creditsPerAGL) / (10 ** AGL_DECIMALS);

        // --- Effects ---
        totalCreditsPurchased[msg.sender] += creditsGranted;
        totalAGLBurnedBy[msg.sender] += aglAmount;
        totalAGLBurned += aglAmount;

        emit CreditsPurchased(msg.sender, aglAmount, creditsGranted, block.timestamp);

        // --- Interaction (last) ---
        // Sent to the dead address rather than calling a token-specific burn() function, since we
        // can't assume AGLToken.sol implements ERC20Burnable — this achieves the same permanent
        // supply reduction using only the standard ERC-20 transfer interface.
        aglToken.safeTransferFrom(msg.sender, BURN_ADDRESS, aglAmount);
    }

    // ---------------------------------------------------------------------
    // Owner controls
    // ---------------------------------------------------------------------

    /// @notice Adjust the credits-per-AGL exchange rate. Only affects future purchases —
    ///         already-emitted CreditsPurchased events (and the off-chain ledger built from them)
    ///         are unaffected, since credits already granted are historical fact, not recalculated.
    function setCreditsPerAGL(uint256 newRate) external onlyOwner {
        if (newRate == 0) revert RateNotSet();
        emit RateUpdated(creditsPerAGL, newRate);
        creditsPerAGL = newRate;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    /// @notice Convenience preview: how many credits `aglAmount` would grant at the current rate,
    ///         without executing a purchase. Useful for Vibe Studio's UI to show a live quote.
    function previewCredits(uint256 aglAmount) external view returns (uint256) {
        return (aglAmount * creditsPerAGL) / (10 ** AGL_DECIMALS);
    }
}
