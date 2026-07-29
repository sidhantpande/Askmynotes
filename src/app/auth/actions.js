"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData) {
    const supabase = await createClient();

    const email = formData.get("email");
    const password = formData.get("password");

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    redirect("/dashboard");
}

export async function signUp(formData) {
    const supabase = await createClient();

    const email = formData.get("email");
    const password = formData.get("password");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    if (data?.session) {
        redirect("/dashboard");
    }

    return { success: "Account created. You can sign in right away." };
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth");
}
