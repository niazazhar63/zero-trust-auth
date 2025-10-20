// utils/riskEngine.js
/**
 * Calculates risk score based on current login attempt and last login record.
 * trustedDevices: array of deviceIds trusted for this account only
 */
export const calculateRiskScore = (current = {}, last = null, trustedDevices = []) => {
  // If device is trusted for this account, skip risk
  if (current.deviceId && trustedDevices.includes(current.deviceId)) {
    return { riskScore: 0, riskLevel: "low", reason: "Trusted device override" };
  }

  let score = 0;
  const reasons = [];
  const now = current.timestamp ? new Date(current.timestamp) : new Date();

  // Baseline / first login
  if (!last) {
    reasons.push("First login - baseline");
    score += 5;
  } else {
    const lastLoginAt = last.lastLoginAt ? new Date(last.lastLoginAt) : null;
    if (lastLoginAt) {
      const deltaMs = Math.abs(now - lastLoginAt);
      const deltaMinutes = Math.floor(deltaMs / (60 * 1000));
      const deltaDays = Math.floor(deltaMs / (24 * 60 * 60 * 1000));

      if (current.country && last.location?.country && current.country !== last.location.country && deltaMinutes < 60) {
        score += 60;
        reasons.push("Rapid logins from distant countries (impossible travel)");
      }

      if (deltaDays >= 60) {
        score += 30;
        reasons.push("Long inactivity gap");
      }
    }
  }

  // Network & Geo
  if (current.ip && last?.ip && current.ip !== last.ip) {
    score += 20;
    reasons.push("IP changed since last login");
  }

  if (current.country && last?.location?.country && current.country !== last.location.country) {
    score += 40;
    reasons.push("Different country login");
  } else if (current.country && !last) {
    score += 5;
  }

  // Device & Browser
  if (current.deviceId && last?.deviceId && current.deviceId !== last.deviceId) {
    score += 30;
    reasons.push("New device detected");
  } else if (current.deviceInfo?.userAgent && last?.userAgent && current.deviceInfo.userAgent !== last.userAgent) {
    score += 15;
    reasons.push("New browser/userAgent detected");
  }

  if (current.deviceId && last?.deviceId && current.deviceId !== last.deviceId && current.ip && last?.ip && current.ip === last.ip && current.country === last?.location?.country) {
    score += 10;
    reasons.push("New device on same IP (possible trusted device)");
  }

  // Behavioral & historical checks
  try {
    const loginHour = new Date(current.timestamp || new Date()).getUTCHours();
    if (last?.lastLoginAt) {
      const lastHour = new Date(last.lastLoginAt).getUTCHours();
      if (loginHour >= 0 && loginHour <= 5 && lastHour >= 8 && lastHour <= 20) {
        score += 20;
        reasons.push("Login at unusual hour");
      }
    }
  } catch (e) {}

  // Failed OTP attempts
  if (last?.failedOtpCount && last.failedOtpCount >= 3) {
    score += 50;
    reasons.push("Multiple recent failed OTP attempts");
  } else if (last?.failedOtpCount && last?.failedOtpCount > 0) {
    score += last.failedOtpCount * 10;
    reasons.push("Recent failed OTP attempts");
  }

  // VPN / ASN hints
  if (current.asn || current.org) {
    const vpnIndicators = ["VPN","PROXY","DATACENTER","HOSTING","AZURE","AMAZON","GOOGLE","MICROSOFT"];
    const combined = `${current.asn || ""} ${current.org || ""}`.toUpperCase();
    for (const token of vpnIndicators) {
      if (combined.includes(token)) {
        score += 15;
        reasons.push("VPN / data-center provider detected");
        break;
      }
    }
  }

  if (score > 100) score = 100;

  let riskLevel = "low";
  if (score >= 70) riskLevel = "high";
  else if (score >= 40) riskLevel = "medium";

  const reason = reasons.length ? reasons.join(", ") : "Normal activity";

  return { riskScore: score, riskLevel, reason };
};
