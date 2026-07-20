/**
 * verifyEmailMiddleware
 * 
 * Ensures the logged-in user has verified their email address before
 * allowing them to proceed. Must be used AFTER authMiddleware so that 
 * req.user is populated.
 */
export const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Allow bypass in test mode if needed, or if the user is verified
  if (req.user.emailVerified) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Please verify your email address to perform this action.'
  });
};
