// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"; // <-- Viktigt att det är @/auth

export const { GET, POST } = handlers;