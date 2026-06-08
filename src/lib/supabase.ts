import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "your-project-url-here") {
    console.warn(
      "Supabase credentials not configured. Form submissions will be logged to console instead."
    );
    return null;
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

export interface MemberFormData {
  full_name: string;
  uid: string;
  email: string;
  course_year: string;
  contact_number: string;
  areas_of_interest: string[];
  collaboration_preferences: string[];
  club_expectations: string;
  expected_outcomes: string;
  additional_ideas: string;
}

export async function submitMemberForm(
  data: MemberFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  if (!supabase) {
    // Dev fallback — log to console
    console.log("📋 Form Submission (dev mode):", JSON.stringify(data, null, 2));
    // Simulate a brief delay
    await new Promise((r) => setTimeout(r, 1000));
    return { success: true };
  }

  try {
    const { error } = await supabase.from("members").insert([data]);

    if (error) {
      console.error("Supabase insert error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
