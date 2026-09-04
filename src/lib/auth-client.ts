/** Browser-local GrowthPilot accounts — required before creating posts. */

export type GrowthPilotUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type StoredAccount = GrowthPilotUser & {
  passwordHash: string;
  salt: string;
};

type Session = {
  userId: string;
  email: string;
  name: string;
  signedInAt: string;
};

const USERS_KEY = "growthpilot.auth.users.v1";
const SESSION_KEY = "growthpilot.auth.session.v1";

export const DEMO_LOGIN = {
  name: "Demo User",
  email: "demo@growthpilot.app",
  password: "growthpilot123",
} as const;

function readAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(accounts));
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, saltHex: string) {
  const enc = new TextEncoder();
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)),
  );
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 120_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return toHex(derived);
}

function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toHex(bytes.buffer);
}

function publicUser(account: StoredAccount): GrowthPilotUser {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    createdAt: account.createdAt,
  };
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function getCurrentUser(): GrowthPilotUser | null {
  const session = getSession();
  if (!session) return null;
  const account = readAccounts().find((item) => item.id === session.userId);
  if (!account) return null;
  return publicUser(account);
}

export function requireUserId(): string | null {
  return getSession()?.userId ?? null;
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required.");
  }
  if (!email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const accounts = readAccounts();
  if (accounts.some((item) => item.email === email)) {
    throw new Error("An account with this email already exists. Sign in instead.");
  }

  const salt = randomSalt();
  const passwordHash = await hashPassword(password, salt);
  const account: StoredAccount = {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date().toISOString(),
    salt,
    passwordHash,
  };
  writeAccounts([...accounts, account]);
  setSession(account);
  return publicUser(account);
}

export async function login(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  // Always provision the shared demo account when those credentials are used.
  if (email === DEMO_LOGIN.email && password === DEMO_LOGIN.password) {
    await ensureDemoAccount();
  }

  let account = readAccounts().find((item) => item.email === email);
  if (!account) {
    throw new Error("No account found for that email. Create an account first.");
  }

  const passwordHash = await hashPassword(password, account.salt);
  if (passwordHash !== account.passwordHash) {
    throw new Error("Incorrect password.");
  }

  setSession(account);
  return publicUser(account);
}

function setSession(account: StoredAccount) {
  const session: Session = {
    userId: account.id,
    email: account.email,
    name: account.name,
    signedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("growthpilot-auth-changed"));
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("growthpilot-auth-changed"));
}

/** Ensure the shared demo account exists in this browser. */
export async function ensureDemoAccount() {
  const accounts = readAccounts();
  const existing = accounts.find((item) => item.email === DEMO_LOGIN.email);
  if (existing) return publicUser(existing);

  const salt = randomSalt();
  const passwordHash = await hashPassword(DEMO_LOGIN.password, salt);
  const account: StoredAccount = {
    id: "demo-user",
    name: DEMO_LOGIN.name,
    email: DEMO_LOGIN.email,
    createdAt: new Date().toISOString(),
    salt,
    passwordHash,
  };
  writeAccounts([...accounts, account]);
  return publicUser(account);
}

export function storageKeyForUser(baseKey: string, userId?: string | null) {
  const id = userId || requireUserId();
  if (!id) return baseKey;
  return `${baseKey}.${id}`;
}
