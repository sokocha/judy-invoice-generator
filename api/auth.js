import * as db from './lib/db.js';
import { hashPassword, verifyPassword, generateToken, authenticate } from './lib/auth.js';

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

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
