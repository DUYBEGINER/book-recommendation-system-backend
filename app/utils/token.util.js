import crypto from 'crypto';

// Generates a secure random token of the specified byte length and returns it as a hex string.
export function generateToken(token_bytes) {
  return crypto.randomBytes(token_bytes).toString('hex');
}

// Hashes the given token using SHA-256 and returns the hex digest.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

