// Supabase Edge Function: provision-student
// Securely provisions auth.users and public.students for newly registered students.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment secrets");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is an admin
    const { data: studentRecord } = await supabaseAdmin
      .from("students")
      .select("role")
      .eq("id", caller.id)
      .maybeSingle();

    const isAdmin =
      caller.app_metadata?.role === "admin" ||
      studentRecord?.role === "admin" ||
      caller.email === "admin@ilmessentials.pk";

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin privileges required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const { email, password, name, phone, format, cohort_id } = payload;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const listRes = await supabaseAdmin.auth.admin.listUsers();
    let targetAuthUser = listRes.data?.users?.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!targetAuthUser) {
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password || "student123",
        email_confirm: true,
        user_metadata: { name: name || "Student" },
        app_metadata: { role: "student" },
      });

      if (createErr) throw createErr;
      targetAuthUser = newUser.user;
    }

    // Insert student profile into public.students
    const { data: student, error: stdErr } = await supabaseAdmin
      .from("students")
      .upsert({
        id: targetAuthUser.id,
        email: cleanEmail,
        name: name || "Student",
        phone: phone || "+92 300 0000000",
        role: "student",
        cohort_id: cohort_id || "foundations_sem1",
        format: format === "onsite" ? "onsite" : "online",
        is_video_restricted: false,
      }, { onConflict: "id" })
      .select()
      .single();

    if (stdErr) throw stdErr;

    return new Response(JSON.stringify({ success: true, student }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
