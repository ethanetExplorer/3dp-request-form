const AUTH_SESSION_KEY = '3dp_admin_session_auth';
const AUTH_EXPIRY_KEY = '3dp_admin_session_exp';

// Default password hash for 'admin123' (SHA-256)
export const DEFAULT_ADMIN_PASSWORD_HASH =
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

/**
 * Computes SHA-256 hash of a string using Web Crypto API.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies a plaintext password against a stored SHA-256 hash.
 */
export async function verifyPassword(plainText: string, expectedHash: string): Promise<boolean> {
  if (!plainText || !expectedHash) return false;
  const inputHash = await hashPassword(plainText);
  return inputHash === expectedHash;
}

/**
 * Checks whether an authenticated admin session is currently active.
 */
export function isSessionAuthenticated(): boolean {
  try {
    // 1. Check temporary sessionStorage
    const sessionToken = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (sessionToken === 'authenticated') return true;

    // 2. Check persistent localStorage with expiration
    const localToken = localStorage.getItem(AUTH_SESSION_KEY);
    const expStr = localStorage.getItem(AUTH_EXPIRY_KEY);
    if (localToken === 'authenticated' && expStr) {
      const expTime = parseInt(expStr, 10);
      if (!isNaN(expTime) && Date.now() < expTime) {
        return true;
      } else {
        // Expired
        localStorage.removeItem(AUTH_SESSION_KEY);
        localStorage.removeItem(AUTH_EXPIRY_KEY);
      }
    }
  } catch {
    // Return false on storage access error
  }
  return false;
}

/**
 * Stores an authenticated session in browser storage.
 */
export function setAuthenticatedSession(rememberMe: boolean = false): void {
  try {
    sessionStorage.setItem(AUTH_SESSION_KEY, 'authenticated');
    if (rememberMe) {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(AUTH_SESSION_KEY, 'authenticated');
      localStorage.setItem(AUTH_EXPIRY_KEY, (Date.now() + sevenDaysMs).toString());
    }
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Clears the authenticated session.
 */
export function clearAuthenticatedSession(): void {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
  } catch {
    // Ignore storage errors
  }
}

