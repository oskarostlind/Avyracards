// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export const runtime = "nodejs"; // 👈 VIKTIGT: Tvingar servern att använda Node

export const { GET, POST } = handlers;