import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  // Personal use account authentication
  const expectedEmail = process.env.ADMIN_EMAIL || 'raghavendra@gmail.com';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'password123';

  // For developer ease in personal MVP mode, check password or match admin account
  if (password && password !== expectedPassword && process.env.NODE_ENV === 'production') {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_verbalis_2026';
  const token = jwt.sign(
    { userId: 'personal_user_1', email: email.toLowerCase() },
    secret,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      userId: 'personal_user_1',
      email: email.toLowerCase(),
    },
  });
});

export const authRoutes = router;
