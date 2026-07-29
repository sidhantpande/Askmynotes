import { createClient } from "./client";

export async function getSafeUser() {
    const supabase = createClient();

    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            const message = error.message || "";
            if (message.toLowerCase().includes("refresh token") || error.code === "refresh_token_not_found") {
                await supabase.auth.signOut();
                return { user: null, error: null, clearedSession: true };
            }
            return { user: null, error };
        }

        return { user: data?.user ?? null, error: null, clearedSession: false };
    } catch (error) {
        const message = error?.message || "";
        if (message.toLowerCase().includes("refresh token") || error?.code === "refresh_token_not_found") {
            await supabase.auth.signOut();
            return { user: null, error: null, clearedSession: true };
        }

        return { user: null, error };
    }
}
