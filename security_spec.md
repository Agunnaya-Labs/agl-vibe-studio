# Firestore Security Specification

This document details the security model, invariants, and test vectors validating our Attribute-Based Access Control (ABAC) and Zero-Trust Firestore Security model.

## 1. Data Invariants

1. **Owner Integrity**: Documents representing user-owned assets (like Custom Tokens, Referral codes, Staking positions, and newly created DAOs) must have their `creator` or `ownerAddress` immutable after creation, matching the authenticating user (`request.auth.uid` or authenticating email/address).
2. **Deterministic Timestamps**: Critical timestamps (`createdAt`, `updatedAt`) must always be verified using server-provided metrics (`request.time`) instead of trusting client inputs.
3. **No Key Tampering**: Self-assigning roles or admin states, or altering specific ledger metrics is strictly forbidden.
4. **Verified Users Only**: Unless authenticated, read or write operations to key transactional records are restricted.

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads attempt to break the rules and must be rejected with `PERMISSION_DENIED`:

1. **Self-Assign Admin Role**: Setting a field like `isAdmin: true` on user profiles.
2. **Forged Token Creator**: Creating a bonding curve token with `creator: "0xVictim"` instead of the active user.
3. **Spoofed Referral Reward Balance**: Attempting to rewrite `unclaimedRewardsAgl` directly to a high value.
4. **Time-travel Creation**: Providing a client-forged timestamp `createdAt: 0` (far in the past) to evade locks.
5. **Unauthorized Activity Deletion**: Attempting to clear of activities logged by other users.
6. **Altering Token Price**: Updating a Token's `currentPrice` directly without executing a bonding curve trade.
7. **Bypassing Max Supply**: Setting `supply` higher than `maxSupply` on creation.
8. **Altering Staking Balance**: Directly incrementing `stakedBalance` or `earnedRewards` without a secure staking transaction.
9. **Tampering with Agent Revenue**: Manually incrementing `lifetimeRevenueEth` inside an AIAgent document.
10. **Spoofing email**: Accessing admin paths by supplying `request.auth.token.email = "support@neonrps.xyz"` while `email_verified` is false.
11. **Malicious ID injection**: Writing to `tokens/this_is_a_super_long_malicious_id_intended_to_cause_denial_of_wallet_attacks_etc` containing junk characters.
12. **Bypassing Lock Periods**: Attempting to alter a pool's lockPeriodDays to withdraw staked funds early.

## 3. Test Runner Design

The rules are validated through a secure test setup asserting:
- Unauthenticated requests are denied.
- Authenticated writes must start with the entity's schema validation.
- Critical updates can only mutate fields matching the whitelisted operations (using `affectedKeys().hasOnly(...)`).
