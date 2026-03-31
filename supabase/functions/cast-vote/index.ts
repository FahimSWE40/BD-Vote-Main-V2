import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// BDVote contract ABI (only the functions we need)
const BD_VOTE_ABI = [
  {
    "inputs": [{"name": "voterIdHash", "type": "bytes32"}, {"name": "encryptedVote", "type": "bytes32"}],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "voterIdHash", "type": "bytes32"}],
    "name": "checkHasVoted",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function sha256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert SHA-256 hex to bytes32 (pad/truncate to 32 bytes)
function toBytes32(hexStr: string): string {
  const clean = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
  return '0x' + clean.slice(0, 64).padEnd(64, '0');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const contractAddress = Deno.env.get('BD_VOTE_CONTRACT_ADDRESS');
    const deployerPrivateKey = Deno.env.get('BD_VOTE_DEPLOYER_PRIVATE_KEY');

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'অনুমোদন প্রয়োজন' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { voter_id, candidate_id } = await req.json();

    if (!voter_id || !candidate_id) {
      return new Response(
        JSON.stringify({ error: 'voter_id এবং candidate_id প্রয়োজন' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify voter exists and hasn't voted yet (FR-12)
    const { data: voter, error: voterError } = await supabaseAdmin
      .from('voters')
      .select('id, voter_id, full_name, has_voted, is_verified, constituency_id')
      .eq('id', voter_id)
      .single();

    if (voterError || !voter) {
      return new Response(
        JSON.stringify({ error: 'ভোটার খুঁজে পাওয়া যায়নি' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (voter.has_voted) {
      return new Response(
        JSON.stringify({ error: 'আপনি ইতিমধ্যে ভোট দিয়েছেন। একাধিক ভোট অনুমোদিত নয়।' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!voter.is_verified) {
      return new Response(
        JSON.stringify({ error: 'ভোটার যাচাই সম্পন্ন হয়নি' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify candidate
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('id, full_name, constituency_id')
      .eq('id', candidate_id)
      .eq('is_active', true)
      .single();

    if (candidateError || !candidate) {
      return new Response(
        JSON.stringify({ error: 'প্রার্থী খুঁজে পাওয়া যায়নি' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. FR-10: Vote Encryption
    const salt = 'bdvote-election-system-2026';
    const voterIdHash = await sha256Hash(`${salt}:${voter.voter_id}`);
    const encryptedVote = await sha256Hash(`${voter.voter_id}:${candidate_id}:${Date.now()}`);

    const voterIdHashBytes32 = toBytes32(voterIdHash);
    const encryptedVoteBytes32 = toBytes32(encryptedVote);

    let txHash: string;
    let blockchainMode: 'live' | 'simulated';

    // 4. FR-11: Blockchain Storage - Try real Sepolia, fallback to simulated
    if (contractAddress && deployerPrivateKey && contractAddress !== '0x0000000000000000000000000000000000000000') {
      try {
        // Dynamic import ethers for Deno
        const { ethers } = await import('npm:ethers@6');
        
        const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
        const wallet = new ethers.Wallet(deployerPrivateKey, provider);
        const contract = new ethers.Contract(contractAddress, BD_VOTE_ABI, wallet);

        // Check if already voted on-chain
        const alreadyVoted = await contract.checkHasVoted(voterIdHashBytes32);
        if (alreadyVoted) {
          return new Response(
            JSON.stringify({ error: 'এই ভোটার ইতিমধ্যে ব্লকচেইনে ভোট দিয়েছেন' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Cast vote on Sepolia
        const tx = await contract.castVote(voterIdHashBytes32, encryptedVoteBytes32);
        const receipt = await tx.wait();
        txHash = receipt.hash;
        blockchainMode = 'live';
        console.log(`✅ Vote cast on Sepolia: ${txHash}`);
      } catch (blockchainError) {
        console.error('Blockchain error, falling back to simulated:', blockchainError);
        txHash = await sha256Hash(`tx:${voterIdHash}:${encryptedVote}:${Date.now()}`);
        blockchainMode = 'simulated';
      }
    } else {
      // No contract configured - simulated mode
      txHash = await sha256Hash(`tx:${voterIdHash}:${encryptedVote}:${Date.now()}`);
      blockchainMode = 'simulated';
    }

    // 5. Record vote in database
    const { data: voteRecord, error: voteError } = await supabaseAdmin
      .from('votes')
      .insert({
        voter_id: voter.id,
        candidate_id: candidate_id,
        tx_hash: txHash,
        voter_id_hash: voterIdHash,
        encrypted_vote: encryptedVote,
        status: blockchainMode === 'live' ? 'confirmed' : 'simulated',
      })
      .select()
      .single();

    if (voteError) {
      console.error('Vote insert error:', voteError);
      return new Response(
        JSON.stringify({ error: 'ভোট রেকর্ড করতে ব্যর্থ হয়েছে', details: voteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Update voter status
    await supabaseAdmin
      .from('voters')
      .update({ has_voted: true })
      .eq('id', voter.id);

    // 7. Increment vote count
    await supabaseAdmin.rpc('increment_vote_count', { p_candidate_id: candidate_id }).catch(() => {});

    // 8. Audit log
    await supabaseAdmin.from('audit_logs').insert({
      action: 'vote_cast',
      entity_type: 'vote',
      entity_id: voteRecord.id,
      details: {
        voter_id_hash: voterIdHash,
        candidate_id: candidate_id,
        tx_hash: txHash,
        blockchain_mode: blockchainMode,
        status: blockchainMode === 'live' ? 'confirmed' : 'simulated',
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        vote_id: voteRecord.id,
        tx_hash: txHash,
        voter_id_hash: voterIdHash,
        blockchain_mode: blockchainMode,
        status: blockchainMode === 'live' ? 'confirmed' : 'simulated',
        message: blockchainMode === 'live'
          ? 'আপনার ভোট সফলভাবে Sepolia ব্লকচেইনে রেকর্ড করা হয়েছে'
          : 'আপনার ভোট সিমুলেটেড মোডে রেকর্ড করা হয়েছে (কন্ট্রাক্ট কনফিগার করুন)',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cast vote error:', error);
    return new Response(
      JSON.stringify({ error: 'সার্ভার ত্রুটি', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
