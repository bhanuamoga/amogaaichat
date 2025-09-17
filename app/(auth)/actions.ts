"use server";

import { z } from "zod";

import { signIn } from "@/auth";
import { postgrest } from "@/lib/postgrest";
import { saveUserLogs } from "@/utils/userLogs";

// ---------------- SCHEMAS ----------------
const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  callbackUrl: z.string().optional(),
});

const authRegisterFormSchema = z.object({
  user_email: z.string().email(),
  password: z.string().min(6),
  user_name: z.string().min(4),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  user_mobile: z.string().optional(),
  business_name: z.string().optional(),
  business_number: z.string().optional(),
  store_name: z.string().optional(),
});

// ---------------- LOGIN ----------------
export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
}

export const login = async (
  _: LoginActionState,
  formData: z.infer<typeof authFormSchema>
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse(formData);

    const signInOptions: any = {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    };

    if (validatedData.callbackUrl) {
      signInOptions.redirectTo = validatedData.callbackUrl;
    }

    await signIn("credentials", signInOptions);

    await saveUserLogs({
      status: "Login Success",
      description: "Login Success",
      event_type: "Login Success",
      http_method: "POST",
      response_payload: {
        email: validatedData.email,
        password: validatedData.password,
      },
      app_name: "Amoga Next Blocks",
    });

    return { status: "success" };
  } catch (error) {
    await saveUserLogs({
      status: "failure",
      description: "Login Failure",
      event_type: "Login Failure",
    });
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }
};

// ---------------- REGISTER ----------------
export interface RegisterActionState {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
  message?: string;
}

export const register = async (
  _: RegisterActionState,
  formData: z.infer<typeof authRegisterFormSchema>
): Promise<RegisterActionState> => {
  try {
    // ✅ Step 1: validate user input
    const validatedData = authRegisterFormSchema.parse(formData);

    
    const insertPayload = {
      ...validatedData,
      for_business_name: validatedData.business_name ?? null,
      for_business_number: validatedData.business_number ?? null,
      roles_json: ["amogaaichat"], // default role
    };

   
    const { data: user } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select("*")
      .eq("user_email", validatedData.user_email)
      .single();

    if (user) {
      return { status: "user_exists" };
    }

    // ✅ Step 4: insert into DB
    const { error: insertError } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .insert(insertPayload);

    if (insertError) {
      if (
        insertError?.message?.includes("duplicate key") &&
        insertError?.message?.includes("user_mobile")
      ) {
        return { status: "failed", message: "Phone number already exists" };
      }
      return { status: "failed" };
    }
    
    // ✅ Step 5: auto login
    await signIn("credentials", {
      email: validatedData.user_email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }
};
