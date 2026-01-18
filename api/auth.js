import * as db from './lib/db.js';
import { hashPassword, verifyPassword, generateToken, authenticate } from './lib/auth.js';
import { sendPasswordResetEmail } from './lib/email.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // POST /api/auth?action=login
    if (req.method === 'POST' && action === 'login') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await db.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isValid = await verifyPassword(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateToken(user);

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    }

    // GET /api/auth?action=me - Get current user
    if (req.method === 'GET' && action === 'me') {
      const auth = await authenticate(req);

      if (auth.error) {
        return res.status(auth.status).json({ error: auth.error });
      }

      return res.status(200).json({ user: auth.user });
    }

    // POST /api/auth?action=create-user - Create new user (protected, requires existing auth)
    if (req.method === 'POST' && action === 'create-user') {
      // Check if any users exist
      const existingUser = await db.getUserByEmail('check@exists.com').catch(() => null);

      // If this is the first user, allow creation without auth
      // Otherwise, require authentication
      const users = await db.getUserByEmail(req.body.email);

      // Simple check: try to get any user to see if table has users
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check if user already exists
      const existing = await db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const passwordHash = await hashPassword(password);
      const newUser = await db.createUser({
        email,
        password_hash: passwordHash,
        name: name || null
      });

      return res.status(201).json({
        message: 'User created successfully',
        user: newUser
      });
    }

    // POST /api/auth?action=forgot-password - Request password reset
    if (req.method === 'POST' && action === 'forgot-password') {
      const { email, appUrl } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await db.getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Save token to database
      await db.setUserResetToken(email, resetToken, tokenExpires.toISOString());

      // Send email
      try {
        await sendPasswordResetEmail(email, resetToken, appUrl || 'https://invoice.judy.legal');
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        return res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
      }

      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // POST /api/auth?action=reset-password - Reset password with token
    if (req.method === 'POST' && action === 'reset-password') {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const user = await db.getUserByResetToken(token);

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Hash new password and update
      const passwordHash = await hashPassword(password);
      await db.updateUserPassword(user.id, passwordHash);

      return res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
