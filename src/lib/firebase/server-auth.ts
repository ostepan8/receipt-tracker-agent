import { cookies } from "next/headers";
import { jwtVerify, createRemoteJWKSet } from "jose";

// Firebase public keys for token verification
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

interface DecodedToken {
  sub: string; // user ID
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
  auth_time: number;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

// Helper to get project ID - read at runtime, not module load time
// Uses FIREBASE_PROJECT_ID (server-only) with fallback to NEXT_PUBLIC_ version
function getFirebaseProjectId(): string | undefined {
  return process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

export async function verifyIdToken(token: string): Promise<DecodedToken | null> {
  try {
    const projectId = getFirebaseProjectId();

    if (!projectId) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    // Additional validation
    const now = Math.floor(Date.now() / 1000);

    // Check auth_time is in the past
    if (payload.auth_time && (payload.auth_time as number) > now) {
      return null;
    }

    // Check sub (user ID) exists and is a string
    if (!payload.sub || typeof payload.sub !== "string") {
      return null;
    }

    return payload as unknown as DecodedToken;
  } catch {
    return null;
  }
}

export async function getServerAuth(): Promise<{
  userId: string | null;
  email?: string;
  name?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("firebase-token")?.value;

    if (!token) {
      return { userId: null };
    }

    const decoded = await verifyIdToken(token);

    if (!decoded) {
      return { userId: null };
    }

    return {
      userId: decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    return { userId: null };
  }
}

export async function getAuthFromHeader(
  authHeader: string | null
): Promise<{
  userId: string | null;
  email?: string;
  name?: string;
}> {
  try {
    if (!authHeader?.startsWith("Bearer ")) {
      return { userId: null };
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await verifyIdToken(token);

    if (!decoded) {
      return { userId: null };
    }

    return {
      userId: decoded.sub,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    return { userId: null };
  }
}
