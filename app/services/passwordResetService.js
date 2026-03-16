import crypto from 'crypto';
import { prisma } from '#lib/prisma.js';
import { hashPassword } from '#utils/hashPassword.js';
import { logger } from '#utils/index.js';
import { sendPasswordResetEmail } from './emailService.js';

// =============================================================================
// CONSTANTS
// =============================================================================

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_EXPIRY_MINUTES = 15;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// =============================================================================
// HELPERS
// =============================================================================

function generateResetToken() {
  return crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Request a password reset for the given email.
 *
 * Always resolves successfully — never reveals whether the email exists.
 * If the email is found, a reset token is generated, its SHA-256 hash is
 * stored in the database, and a reset link is sent via email.
 *
 * @param {string} email
 */
export async function requestPasswordReset(email) {
  const user = await prisma.users.findUnique({ where: { email }, select: { user_id: true, is_ban: true } });

  if (!user) {
    // Silently return — no email enumeration
    logger.info('Password reset requested for non-existent email', { email });
    return;
  }

  if (user.is_ban) {
    logger.warn('Password reset requested for banned account', { email });
    return;
  }

  const plainToken = generateResetToken();
  const hashedToken = hashToken(plainToken);
  const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await prisma.users.update({
    where: { user_id: user.user_id },
    data: {
      reset_password_token: hashedToken,
      reset_password_token_expiry: expiry,
    },
  });
  
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${plainToken}`;

  await sendPasswordResetEmail(email, resetUrl);

  logger.info('Password reset token generated', { email, expiresAt: expiry.toISOString() });
}

/**
 * Verify a reset token and update the user's password.
 *
 * @param {string} plainToken  - Raw token from the reset link
 * @param {string} newPassword - New plaintext password (will be bcrypt-hashed)
 * @throws {Error} If the token is invalid or expired
 */
export async function resetPassword(plainToken, newPassword) {
  const hashedToken = hashToken(plainToken);

  const user = await prisma.users.findFirst({
    where: {
      reset_password_token: hashedToken,
      reset_password_token_expiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw new Error('Token không hợp lệ hoặc đã hết hạn');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.users.update({
    where: { user_id: user.user_id },
    data: {
      password: hashedPassword,
      reset_password_token: null,
      reset_password_token_expiry: null,
    },
  });

  logger.info('Password reset successful', { userId: user.user_id.toString() });
}
