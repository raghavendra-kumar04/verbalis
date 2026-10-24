import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateJwt } from '../middleware/auth.js';
import { UserPreference } from '../models/UserPreference.js';
import { User } from '../models/User.js';

const router = Router();
router.use(authenticateJwt);

/**
 * GET /api/profile
 * Retrieves user profile & preferences from database for the authenticated user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    let profile = await UserPreference.findOne({ userId });
    if (!profile) {
      // Look up user to get registered name & email
      const userDoc = await User.findById(userId);
      const email = userDoc?.email || req.user?.email || 'user@verbalis.ai';
      const firstName = userDoc?.firstName || email.split('@')[0];

      profile = await UserPreference.create({
        userId,
        email,
        firstName,
        preferredFeedbackMode: 'per_answer',
        coachingFocus: 'all_round',
        speechSpeed: '1.0x',
        reducedMotion: false,
      });
    }

    res.json({
      userId: profile.userId,
      email: profile.email,
      firstName: profile.firstName,
      preferredFeedbackMode: profile.preferredFeedbackMode,
      coachingFocus: profile.coachingFocus,
      speechSpeed: profile.speechSpeed,
      reducedMotion: profile.reducedMotion,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/profile
 * Updates user profile & preferences in database for the authenticated user
 */
router.put('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { firstName, preferredFeedbackMode, coachingFocus, speechSpeed, reducedMotion } = req.body;

  try {
    const updateData: any = {};
    if (firstName !== undefined && firstName.trim().length > 0) {
      updateData.firstName = firstName.trim();
      // Also update in User collection
      await User.findByIdAndUpdate(userId, { firstName: firstName.trim() });
    }
    if (preferredFeedbackMode) updateData.preferredFeedbackMode = preferredFeedbackMode;
    if (coachingFocus) updateData.coachingFocus = coachingFocus;
    if (speechSpeed) updateData.speechSpeed = speechSpeed;
    if (reducedMotion !== undefined) updateData.reducedMotion = Boolean(reducedMotion);

    const profile = await UserPreference.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({
      message: 'Profile updated successfully',
      profile: {
        userId: profile.userId,
        email: profile.email,
        firstName: profile.firstName,
        preferredFeedbackMode: profile.preferredFeedbackMode,
        coachingFocus: profile.coachingFocus,
        speechSpeed: profile.speechSpeed,
        reducedMotion: profile.reducedMotion,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update profile' });
  }
});

export const profileRoutes = router;
