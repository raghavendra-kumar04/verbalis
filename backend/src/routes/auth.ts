import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { UserPreference } from '../models/UserPreference.js';

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user in MongoDB
 */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName } = req.body;

  if (!email || !email.trim()) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters' });
    return;
  }

  const cleanFirstName = (firstName && firstName.trim()) || email.split('@')[0];
  const cleanEmail = email.toLowerCase().trim();

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      res.status(400).json({ message: 'Email is already registered. Please sign in.' });
      return;
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in database
    const newUser = await User.create({
      email: cleanEmail,
      passwordHash,
      firstName: cleanFirstName,
    });

    const userId = newUser._id.toString();

    // Create user preferences in database
    await UserPreference.create({
      userId,
      email: cleanEmail,
      firstName: cleanFirstName,
      preferredFeedbackMode: 'per_answer',
      coachingFocus: 'all_round',
      speechSpeed: '1.0x',
      reducedMotion: false,
    });

    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_verbalis_2026';
    const token = jwt.sign(
      { userId, email: cleanEmail },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        userId,
        email: cleanEmail,
        firstName: cleanFirstName,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user from MongoDB
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  if (!password) {
    res.status(400).json({ message: 'Password is required' });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    // Retrieve user from database
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      res.status(401).json({ message: 'User not registered. Please sign up first.' });
      return;
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const userId = user._id.toString();
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_verbalis_2026';
    const token = jwt.sign(
      { userId, email: cleanEmail },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        userId,
        email: cleanEmail,
        firstName: user.firstName,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Authentication failed' });
  }
});

export const authRoutes = router;
