import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '@crm/config';
import { User } from '@crm/types';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return (jwt.sign as any)(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return (jwt.sign as any)(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });
}

/**
 * Sign access token helper
 */
export function signAccessToken(payload: object): string {
  return (jwt.sign as any)(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
}

/**
 * Sign refresh token helper
 */
export function signRefreshToken(payload: object): string {
  return (jwt.sign as any)(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
}

/**
 * Generate token pair for user
 */
export function generateTokenPair(user: User) {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
