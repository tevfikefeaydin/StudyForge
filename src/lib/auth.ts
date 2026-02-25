import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

function safeCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function verifyPassword(
  password: string,
  passwordHash: string | null
): Promise<{ valid: boolean; upgradedHash?: string }> {
  if (!passwordHash) {
    return { valid: false };
  }

  if (passwordHash.startsWith("scrypt$")) {
    const [, salt, hashHex] = passwordHash.split("$");
    if (!salt || !hashHex) {
      return { valid: false };
    }

    const expected = Buffer.from(hashHex, "hex");
    if (expected.length === 0) {
      return { valid: false };
    }

    const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;
    return { valid: safeCompare(expected, derived) };
  }

  // Legacy support: SHA-256 hashes are upgraded to scrypt on successful login.
  const legacyHash = createHash("sha256").update(password).digest("hex");
  const valid = safeCompare(Buffer.from(legacyHash, "utf8"), Buffer.from(passwordHash, "utf8"));
  if (!valid) {
    return { valid: false };
  }

  return {
    valid: true,
    upgradedHash: await hashPassword(password),
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          // Auto-register for MVP
          user = await prisma.user.create({
            data: {
              email,
              passwordHash: await hashPassword(password),
              name: email.split("@")[0],
            },
          });
        } else {
          const check = await verifyPassword(password, user.passwordHash);
          if (!check.valid) return null;

          if (check.upgradedHash) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { passwordHash: check.upgradedHash },
            });
          }
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};
