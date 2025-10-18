// utils/riskEngine.js
/**
 * A risk scoring function that maps the manager's scenarios to numeric scores.
 *
 * Input:
 *   - current: object with { ip, country, region, city, deviceInfo, deviceId, timestamp }
 *   - last: the last Risk document (can be null)
 *
 * Output:
 *   { riskScore: Number (0-100), riskLevel: "low"|"medium"|"high", reason: String }
 *
 * Notes:
 *  - Scores are additive but capped at 100.
 *  - The thresholds chosen follow your manager mapping:
 *      low: 0-39, medium: 40-69, high: 70+
 */
export const calculateRiskScore = (current = {}, last = null) => {
  let score = 0;
  const reasons = [];

  const now = current.timestamp ? new Date(current.timestamp) : new Date();

  // --- Baseline / session refresh (low risk)
  if (!last) {
    reasons.push("First login - baseline");
    // baseline small score so new users are low risk
    score += 5;
  } else {
    // time since last login
    const lastLoginAt = last.lastLoginAt ? new Date(last.lastLoginAt) : null;
    if (lastLoginAt) {
      const deltaMs = Math.abs(now - lastLoginAt);
      const deltaMinutes = Math.floor(deltaMs / (60 * 1000));

      // Rapid logins from distant countries (impossible travel)
      if (
        current.country &&
        last.location?.country &&
        current.country !== last.location.country &&
        deltaMinutes < 60 // within 1 hour
      ) {
        score += 60;
        reasons.push("Rapid logins from distant countries (impossible travel)");
      }

      // Long inactivity (e.g., 60 days)
      const deltaDays = Math.floor(deltaMs / (24 * 60 * 60 * 1000));
      if (deltaDays >= 60) {
        score += 30;
        reasons.push("Long inactivity gap");
      }
    }
  }

  // --- Network & Geo
  if (current.ip && last?.ip && current.ip !== last.ip) {
    // Same country but different IP could be VPN or ISP change -> medium-ish
    score += 20;
    reasons.push("IP changed since last login");
  }

  if (
    current.country &&
    last?.location?.country &&
    current.country !== last.location.country
  ) {
    // Different country -> more weight (depends on time gap handled above)
    score += 40;
    reasons.push("Different country login");
  } else if (current.country && !last) {
    // new user country - small weight
    score += 5;
  }

  // --- Device & Browser
  if (
    current.deviceId &&
    last?.deviceId &&
    current.deviceId !== last.deviceId
  ) {
    // new device fingerprint
    score += 30;
    reasons.push("New device detected");
  } else if (
    current.deviceInfo?.userAgent &&
    last?.userAgent &&
    current.deviceInfo.userAgent !== last.userAgent
  ) {
    score += 15;
    reasons.push("New browser/userAgent detected");
  }

  // If same IP but new device -> medium (auto add as trusted later)
  if (
    current.deviceId &&
    last?.deviceId &&
    current.deviceId !== last.deviceId &&
    current.ip &&
    last?.ip &&
    current.ip === last.ip &&
    current.country === last?.location?.country
  ) {
    // New device on same network
    score += 10; // medium-friendly
    reasons.push("New device on same IP (possible trusted device)");
  }

  // --- Behavioral & historical checks
  // Unusual hour detection (3 AM when usual is business hours)
  try {
    const tz = current.timezone || Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone;
    const loginHour = new Date(current.timestamp || new Date()).getUTCHours(); // fallback to UTC
    // we do a naive unusual-hour check: if last has usual hours,
    // calculate average or simply check if this login is between 0-5 and user's last logins were 9-18
    if (last?.lastLoginAt) {
      const lastHour = new Date(last.lastLoginAt).getUTCHours();
      // if current in night (0-5) and last was day (8-20)
      if (loginHour >= 0 && loginHour <= 5 && lastHour >= 8 && lastHour <= 20) {
        score += 20;
        reasons.push("Login at unusual hour");
      }
    }
  } catch (e) {
    // ignore timezone parsing errors
  }

  // Failed OTP attempts (behavioral)
  if (last?.failedOtpCount && last.failedOtpCount >= 3) {
    score += 50;
    reasons.push("Multiple recent failed OTP attempts");
  } else if (last?.failedOtpCount && last.failedOtpCount > 0) {
    score += last.failedOtpCount * 10;
    reasons.push("Recent failed OTP attempts");
  }

  // VPN / ASN hints: if org/asn contains suspicious words, add weight
  if (current.asn || current.org) {
    const vpnIndicators = ["VPN", "PROXY", "DATACENTER", "HOSTING", "AZURE", "AMAZON", "GOOGLE", "MICROSOFT"];
    const combined = `${current.asn || ""} ${current.org || ""}`.toUpperCase();
    for (const token of vpnIndicators) {
      if (combined.includes(token)) {
        score += 15;
        reasons.push("VPN / data-center provider detected");
        break;
      }
    }
  }

  // Cap score
  if (score > 100) score = 100;

  // Determine risk level
  let riskLevel = "low";
  if (score >= 70) riskLevel = "high";
  else if (score >= 40) riskLevel = "medium";

  // Combine reasons into a single string
  const reason = reasons.length ? reasons.join(", ") : "Normal activity";

  return {
    riskScore: score,
    riskLevel,
    reason,
  };
};
