import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'অনুমোদন প্রয়োজন' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the authenticated user
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    ).auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if any admin already exists
    const { data: existingAdmins, error: adminCheckError } = await supabaseClient
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminCheckError) {
      return new Response(
        JSON.stringify({ error: 'ডাটাবেস চেক ব্যর্থ' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If admins already exist, only existing admins can create new admins
    if (existingAdmins && existingAdmins.length > 0) {
      const { data: callerRole } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!callerRole) {
        return new Response(
          JSON.stringify({ error: 'শুধুমাত্র বিদ্যমান অ্যাডমিনরা নতুন অ্যাডমিন তৈরি করতে পারবেন' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Assign admin role to the user
    const { data: existingRole } = await supabaseClient
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (existingRole) {
      return new Response(
        JSON.stringify({ success: true, message: 'আপনি ইতিমধ্যে অ্যাডমিন' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: insertError } = await supabaseClient
      .from('user_roles')
      .insert({ user_id: user.id, role: 'admin' });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'অ্যাডমিন রোল অ্যাসাইন ব্যর্থ', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Audit log
    await supabaseClient.from('audit_logs').insert({
      action: 'admin_role_assigned',
      entity_type: 'user_roles',
      entity_id: user.id,
      details: {
        email: user.email,
        first_admin: (!existingAdmins || existingAdmins.length === 0),
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: 'অ্যাডমিন রোল সফলভাবে অ্যাসাইন করা হয়েছে' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Setup admin error:', error);
    return new Response(
      JSON.stringify({ error: 'সার্ভার ত্রুটি', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
