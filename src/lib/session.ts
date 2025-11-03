import { auth } from "@/app/api/auth/[...nextauth]/auth";

export async function getCurrentSession() {
  return auth();
}
