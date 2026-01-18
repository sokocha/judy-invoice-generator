import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'judy-invoice-generator-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Hash password
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Auth middleware for API routes
export async function authenticate(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No token provided', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return { error: 'Invalid or expired token', status: 401 };
  }

  const user = await db.getUserById(decoded.userId);

  if (!user) {
    return { error: 'User not found', status: 401 };
  }

  return { user };
}

// Helper to protect API routes
export function withAuth(handler) {
  return async (req, res) => {
    const auth = await authenticate(req);

    if (auth.error) {
      return res.status(auth.status).json({ error: auth.error });
    }

    req.user = auth.user;
    return handler(req, res);
  };
}
