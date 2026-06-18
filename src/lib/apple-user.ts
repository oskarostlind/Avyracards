import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

function slugifyUsername(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);

  return base.length >= 3 ? base : `user${randomBytes(2).toString("hex")}`;
}

async function createUniqueUsername(seed: string): Promise<string> {
  let candidate = slugifyUsername(seed);
  let attempt = 0;

  while (attempt < 8) {
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
    candidate = `${slugifyUsername(seed)}${randomBytes(2).toString("hex")}`;
    attempt += 1;
  }

  return `user${randomBytes(4).toString("hex")}`;
}

export async function findUserByAppleSub(appleId: string) {
  return prisma.user.findUnique({ where: { appleId } });
}

export async function createUserFromApple(params: {
  appleId: string;
  email: string;
  name?: string | null;
}): Promise<{ id: string; email: string; username: string }> {
  const username = await createUniqueUsername(params.email.split("@")[0] ?? params.appleId);

  const user = await prisma.user.create({
    data: {
      email: params.email.toLowerCase(),
      username,
      name: params.name ?? username,
      appleId: params.appleId,
      appleEmail: params.email.toLowerCase(),
      emailVerified: new Date(),
    },
    select: {
      id: true,
      email: true,
      username: true,
    },
  });

  return user;
}

export async function linkAppleToExistingUser(params: {
  userId: string;
  appleId: string;
  appleEmail?: string | null;
}): Promise<void> {
  const conflict = await prisma.user.findFirst({
    where: {
      appleId: params.appleId,
      NOT: { id: params.userId },
    },
    select: { id: true },
  });

  if (conflict) {
    throw new Error("Detta Apple-ID är redan kopplat till ett annat konto");
  }

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      appleId: params.appleId,
      appleEmail: params.appleEmail?.toLowerCase() ?? undefined,
    },
  });
}

export async function linkAppleWithCredentials(params: {
  email: string;
  password: string;
  appleId: string;
  appleEmail?: string | null;
}): Promise<{ id: string; email: string; username: string }> {
  const user = await prisma.user.findUnique({
    where: { email: params.email.toLowerCase() },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Felaktig e-post eller lösenord");
  }

  const valid = await verifyPassword(params.password, user.passwordHash);
  if (!valid) {
    throw new Error("Felaktig e-post eller lösenord");
  }

  await linkAppleToExistingUser({
    userId: user.id,
    appleId: params.appleId,
    appleEmail: params.appleEmail,
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
  };
}
