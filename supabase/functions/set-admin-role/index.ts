import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email, secret, role } = await req.json();

    // Simple secret to prevent unauthorized access
    const envSecret = Deno.env.get("ADMIN_SETUP_SECRET");
    if (!envSecret || secret !== envSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate role
    const validRoles = ["admin", "moderator"];
    const targetRole = role || "admin";
    if (!validRoles.includes(targetRole)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let targetUserId = user_id;

    // If email is provided instead of user_id, look up the user
    if (!targetUserId && email) {
      const { data: users, error: lookupError } = await supabaseAdmin.auth.admin.listUsers();
      if (lookupError) throw lookupError;

      const user = users.users.find(u => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "user_id or email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { app_metadata: { role: targetRole } }
    );

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, user: data.user?.id, email: data.user?.email }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
