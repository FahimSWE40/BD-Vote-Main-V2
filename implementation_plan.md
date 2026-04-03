# Full System Debug & Completion — BD Vote V2

Comprehensive plan to fix all **Partially Completed** and **Not Completed** features identified in the SRS audit.

---

## User Review Required

> [!IMPORTANT]
> **Two features are fully NOT COMPLETED (FR-5, FR-21) and require new code + database logic. Eight features are PARTIALLY COMPLETED and need targeted fixes. Please review the proposed changes below and confirm before I begin.**

> [!WARNING]
> **FR-5 (Constituency Auto-Fetch)** requires a NID-to-constituency mapping strategy. Since there is no real government API, I will implement a **mapping table lookup** approach — the `voters` table already has a `constituency_id` column. The Verification flow will read the voter's stored constituency and pass it to the Ballot page for filtering.

> [!WARNING]
> **FR-21 (Election Lifecycle Control)** already has the AdminSettings UI and `election_config` table, but no enforcement. Voting/verification flows currently do NOT check if the election is active. I will wire this up end-to-end.

---

## Status Summary

| SRS ID | Feature | Current Status | Action Needed |
|--------|---------|---------------|---------------|
| FR-4 | Face Matching | Partial | Tune thresholds, add retry UX |
| FR-5 | Constituency Auto-Fetch | **Not Done** | Wire voter.constituency_id → ballot filter |
| FR-7 | Filtered Candidate List | Partial | Filter candidates by voter's constituency |
| FR-10 | Vote Encryption | Partial | Already complete in edge function — add client-side verification |
| FR-11 | Blockchain Storage | Partial | Add client-side contract status indicator |
| FR-12 | One Vote Restriction | Partial | Add blockchain-level check on verification page |
| FR-16 | Live Turnout Tracking | Partial | Add per-constituency breakdown on candidate dashboard |
| FR-19 | Public Transparency Portal | Partial | Enhance Results page with blockchain audit section |
| FR-21 | Election Lifecycle Control | **Not Done** | Enforce election active/inactive across all flows |
| — | Offline Queue | Partial | Wire to real `cast-vote` edge function |

---

## Proposed Changes

### Component 1: Constituency Auto-Fetch & Filtered Candidates (FR-5, FR-7)

These two features are directly linked — once we fetch the voter's constituency, we filter candidates by it.

---

#### [MODIFY] [Verification.tsx](file:///f:/BDVoteMainV2/src/pages/Verification.tsx)

- After voter lookup from Supabase, store `constituency_id` in `sessionStorage`:
  ```ts
  sessionStorage.setItem('verified_voter_constituency_id', voter.constituency_id || '');
  ```
- Already stores `verified_voter_id` and `verified_voter_name` — add constituency alongside.

#### [MODIFY] [Ballot.tsx](file:///f:/BDVoteMainV2/src/pages/Ballot.tsx)

- Read `verified_voter_constituency_id` from sessionStorage.
- If constituency is set, filter `activeCandidates` to only those with matching `constituency_id`:
  ```ts
  const voterConstituencyId = sessionStorage.getItem('verified_voter_constituency_id');
  const filteredCandidates = voterConstituencyId
    ? activeCandidates.filter(c => c.constituency_id === voterConstituencyId || !c.constituency_id)
    : activeCandidates;
  ```
- Show a badge indicating the voter's constituency area.

#### [MODIFY] [use-candidates.tsx](file:///f:/BDVoteMainV2/src/hooks/use-candidates.tsx)

- Update `Candidate` interface to include `constituency_id: string | null`.
- The query already does `select('*')` so the data is there.

---

### Component 2: Election Lifecycle Control Enforcement (FR-21)

The `AdminSettings.tsx` already has the election config UI and save logic. The database already has `election_config` table. **What's missing is enforcement.**

---

#### [MODIFY] [Verification.tsx](file:///f:/BDVoteMainV2/src/pages/Verification.tsx)

- Import `useActiveElection` hook.
- Before allowing ID scan, check if election is active. If not, show a blocking message: "নির্বাচন এখনো শুরু হয়নি" or "নির্বাচন শেষ হয়ে গেছে".
- Also check `start_time` and `end_time` against current time.

#### [MODIFY] [Ballot.tsx](file:///f:/BDVoteMainV2/src/pages/Ballot.tsx)

- Already imports `useActiveElection`. Add enforcement:
  - If `!election || !election.is_active` → block voting with message.
  - If `now < election.start_time` → "নির্বাচন শুরু হয়নি"
  - If `now > election.end_time` → "নির্বাচন শেষ হয়ে গেছে"

#### [MODIFY] [cast-vote/index.ts](file:///f:/BDVoteMainV2/supabase/functions/cast-vote/index.ts)

- Add server-side election active check before recording vote:
  ```ts
  const { data: electionConfig } = await supabaseAdmin
    .from('election_config')
    .select('is_active, start_time, end_time')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!electionConfig) {
    return error('বর্তমানে কোনো সক্রিয় নির্বাচন নেই');
  }
  const now = new Date();
  if (now < new Date(electionConfig.start_time) || now > new Date(electionConfig.end_time)) {
    return error('নির্বাচনের সময়সীমা শেষ');
  }
  ```

---

### Component 3: Face Matching Threshold Tuning (FR-4)

---

#### [MODIFY] [face-verification.ts](file:///f:/BDVoteMainV2/src/lib/face-verification.ts)

- Current threshold in `verifyFaceAgainstImage` is 55% (line 148), and `isFaceMatch` defaults to 60%.
- **Standardize to 50%** for first-time enrollment (already working), and **55%** for re-verification.
- Add a confidence tier system:
  - `≥70%`: High confidence match
  - `55-69%`: Moderate match (allow with warning)
  - `<55%`: Reject

#### [MODIFY] [Verification.tsx](file:///f:/BDVoteMainV2/src/pages/Verification.tsx)

- Add a retry mechanism: if face match fails, allow up to 3 retries with guidance.
- Show the confidence tier badge in the result.
- On very low match (< 30%), suggest re-scanning the ID card.

---

### Component 4: Vote Encryption & Blockchain Verification (FR-10, FR-11)

The `cast-vote` edge function already implements proper SHA-256 hashing and on-chain storage. The client-side `blockchain.ts` has the infrastructure. **What's missing**: client feedback on blockchain status.

---

#### [MODIFY] [Ballot.tsx](file:///f:/BDVoteMainV2/src/pages/Ballot.tsx)

- After successful vote, show the `blockchain_mode` from result (`live` vs `simulated`).
- If `simulated`, show an info badge: "সিমুলেটেড মোডে সংরক্ষিত".
- Add Etherscan link when tx_hash is a real 0x hash.

#### [MODIFY] [Results.tsx](file:///f:/BDVoteMainV2/src/pages/Results.tsx)

- Add a "ব্লকচেইন কনফিগারেশন স্ট্যাটাস" section at top showing:
  - Whether blockchain is `live` (contract configured) or `simulated`.
  - Total on-chain verified votes vs total simulated votes.

---

### Component 5: One Vote Cross-Node Restriction (FR-12)

The `cast-vote` edge function already checks both Supabase (`has_voted`) and blockchain (`checkHasVoted`). **What's missing**: client-side pre-check on the Verification page.

---

#### [MODIFY] [Verification.tsx](file:///f:/BDVoteMainV2/src/pages/Verification.tsx)

- Already checks `voter.has_voted` in the DB lookup (line 146). This is sufficient.
- Add an additional call to `checkVotedOnChain()` from `blockchain.ts` as a secondary check:
  ```ts
  const onChainVoted = await checkVotedOnChain(data.voterId);
  if (onChainVoted) {
    setErrorMessage('ব্লকচেইন রেকর্ড অনুযায়ী আপনি ইতিমধ্যে ভোট দিয়েছেন।');
  }
  ```

---

### Component 6: Live Turnout Per Constituency (FR-16)

---

#### [MODIFY] [CandidateDashboard.tsx](file:///f:/BDVoteMainV2/src/pages/candidate/CandidateDashboard.tsx)

- Add a per-constituency turnout section.
- Query voters grouped by constituency:
  ```ts
  const fetchConstituencyTurnout = async () => {
    const { data } = await supabase
      .from('voters')
      .select('constituency_id, has_voted');
    // Group by constituency_id and calculate per-area turnout
  };
  ```
- Show a breakdown table/chart of voter turnout per constituency.
- If candidate has a constituency, highlight their area.

#### [NEW] [use-constituency-stats.tsx](file:///f:/BDVoteMainV2/src/hooks/use-constituency-stats.tsx)

- New hook: `useConstituencyStats()` — fetches voters grouped by constituency with turnout percentages.
- Includes realtime subscription for live updates.

---

### Component 7: Public Transparency Portal Enhancement (FR-19)

---

#### [MODIFY] [Results.tsx](file:///f:/BDVoteMainV2/src/pages/Results.tsx)

- Add a "ব্লকচেইন অডিট" section:
  - Display `getOnChainVoteCount()` from `blockchain.ts`.
  - Show comparison: DB vote count vs blockchain vote count.
  - Add an "Etherscan-এ দেখুন" button linking to the contract address.
- Add constituency-wise result breakdown if constituencies exist.

---

### Component 8: Offline Queue Integration (Fix)

---

#### [MODIFY] [use-offline-queue.tsx](file:///f:/BDVoteMainV2/src/hooks/use-offline-queue.tsx)

- Currently uses simulated API call (line 97-104). Replace with real `cast-vote` edge function call:
  ```ts
  const { castVote } = useVotes(); // Can't use hook inside, so use supabase directly
  await supabase.functions.invoke('cast-vote', {
    body: { voter_id: data.voterId, candidate_id: data.candidateId },
  });
  ```
- Remove the random 90% success simulation.

---

## Open Questions

> [!IMPORTANT]
> 1. **FR-5 Constituency Auto-Fetch**: Should we require every voter to have a `constituency_id` assigned at registration, or allow voting without constituency assignment (showing all candidates)?
> 2. **FR-21 Election Lifecycle**: Should the election auto-stop when `end_time` passes, or require manual admin action to stop?
> 3. **Blockchain Mode**: The system currently falls back to `simulated` mode when no contract is deployed. Is this acceptable for the demo, or do you need a deployed Sepolia contract?

---

## Verification Plan

### Automated Tests
1. `npm run build` — Verify zero TypeScript errors after all changes.
2. `npm run lint` — Verify no ESLint warnings.
3. Browser test — Navigate all routes and verify no console errors.

### Manual Verification
1. **FR-5/FR-7**: Create voters and candidates with constituencies in Supabase. Verify ballot shows only matching candidates.
2. **FR-21**: Set election start/end time in admin settings. Verify voting is blocked outside the window.
3. **FR-4**: Test face verification with different lighting and angles. Verify retry UX works.
4. **FR-12**: Attempt double-voting. Verify both DB and blockchain checks block it.
5. **FR-16**: View candidate dashboard. Verify per-constituency turnout displays.
6. **FR-19**: View Results page. Verify blockchain audit section shows correctly.
7. **Build test**: `npm run build` produces a clean production bundle.
