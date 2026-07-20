import { logActivity } from "@/lib/activity";
import { trackUserSession, autoLogSecurityEvent } from "@/lib/activity-logger";

/**
 * Log a successful sign-in event.
 * Call this from your login page or auth callback.
 */
export async function logSignIn(
  userId: string,
  sessionToken?: string,
  ipAddress?: string,
  userAgent?: string,
) {
  await logActivity({
    action: "login",
    module: "auth",
    description: "User logged in",
    userId,
    ip: ipAddress,
    userAgent,
    severity: "INFO",
  });

  if (sessionToken) {
    await trackUserSession(userId, sessionToken, ipAddress, userAgent);
  }
}

/**
 * Log a failed sign-in attempt.
 * Tracks consecutive failures for security monitoring.
 */
export async function logFailedSignIn(
  username: string,
  ipAddress?: string,
  userAgent?: string,
) {
  // Check for brute force attempts (best-effort, non-blocking)
  if (ipAddress) {
    checkBruteForce(username, ipAddress);
  }
  await logActivity({
    action: "failed_login",
    module: "auth",
    description: `Failed login attempt for: ${username}`,
    ip: ipAddress,
    userAgent,
    severity: "WARNING",
  });
}

/**
 * Log a sign-out event.
 */
export async function logSignOut(
  userId: string,
  sessionToken: string,
) {
  await logActivity({
    action: "logout",
    module: "auth",
    description: "User logged out",
    userId,
    severity: "INFO",
  });

  // End the session
  try {
    const { prisma } = await import("@/lib/db");
    await prisma.userSession.updateMany({
      where: { sessionToken, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });
  } catch {
    // Non-critical
  }
}

/**
 * Log a password change event.
 */
export async function logPasswordChange(
  userId: string,
  ipAddress?: string,
) {
  await logActivity({
    action: "password_change",
    module: "auth",
    description: "User changed their password",
    userId,
    ip: ipAddress,
    severity: "INFO",
  });
}

/**
 * Log a password reset event.
 */
export async function logPasswordReset(
  email: string,
  ipAddress?: string,
) {
  await logActivity({
    action: "password_reset",
    module: "auth",
    description: `Password reset for: ${email}`,
    ip: ipAddress,
    severity: "INFO",
  });
}

/**
 * Check for brute force and log a security event if threshold exceeded.
 * Returns true if a security event was created.
 */
export async function checkBruteForce(
  username: string,
  ipAddress?: string,
  threshold = 5,
): Promise<boolean> {
  if (!ipAddress) return false;
  try {
    const { prisma } = await import("@/lib/db");
    const since = new Date(Date.now() - 15 * 60 * 1000); // last 15 min

    const recentFailures = await prisma.activityLog.count({
      where: {
        action: "failed_login",
        ip: ipAddress,
        createdAt: { gte: since },
      },
    });

    if (recentFailures >= threshold) {
      await autoLogSecurityEvent(
        "suspicious_activity",
        `Brute force detected: ${recentFailures} failed logins from ${ipAddress}`,
        "CRITICAL",
        undefined,
        ipAddress,
        { username, attemptCount: recentFailures, threshold },
      );
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
