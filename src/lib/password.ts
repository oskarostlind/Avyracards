import bcrypt from "bcryptjs";

const DEFAULT_ROUNDS = 12;

function getRounds() {
  const envValue = process.env.AUTH_SALT_ROUNDS;
  if (!envValue) return DEFAULT_ROUNDS;
  const parsed = parseInt(envValue, 10);
  if (Number.isNaN(parsed) || parsed < 8 || parsed > 15) return DEFAULT_ROUNDS;
  return parsed;
}

export async function hashPassword(plain: string): Promise<string> {
  const rounds = getRounds();
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
