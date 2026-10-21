import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateJwt } from '../middleware/auth.js';
import { UserPreference } from '../models/UserPreference.js';

const router = Router();
router.use(authenticateJwt);

/**
 * GET /api/profile
 * Retrieves user profile & preferences from database
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId || 'personal_user_1';
  const email = req.user?.email || 'raghavendra@gmail.com';

  try {
    let profile = await UserPreference.findOne({ userId });
    if (!profile) {
      profile = await UserPreference.create({
        userId,
        email,
        firstName: 'Raghavendra',
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
 * Updates user profile & preferences in database
 */
router.put('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId || 'personal_user_1';
  const { firstName, preferredFeedbackMode, coachingFocus, speechSpeed, reducedMotion } = req.body;

  try {
    const updateData: any = {};
    if (firstName !== undefined && firstName.trim().length > 0) {
      updateData.firstName = firstName.trim();
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
