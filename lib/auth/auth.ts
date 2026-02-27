import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import clientPromise from "@/lib/db-native";
import { initializeUserBoard } from "../init-user-board";

export const runtime = "nodejs";

async function createAuth() {
  const client = await clientPromise; // ✅ runtime only
  const db = client.db();

  return betterAuth({
    database: mongodbAdapter(db),
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60,
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if (user.id) {
              await initializeUserBoard(user.id);
            }
          },
        },
      },
    },
  });
}

export async function getSession() {
  const auth = await createAuth();
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function signOut() {
  const auth = await createAuth();
  const result = await auth.api.signOut({
    headers: await headers(),
  });

  if (result.success) {
    redirect("/sign-in");
  }
}

export async function getAuth() {
  return createAuth();
}