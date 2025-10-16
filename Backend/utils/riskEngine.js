// utils/riskEngine.js
export const calculateRiskScore = (current, last) => {
  let score = 0;
  let reasons = [];

  if (last) {
    if (current.ip && last.ip && current.ip !== last.ip) {
      score += 30;
      reasons.push("New IP detected");
    }
    if (
      current.country &&
      last.location?.country &&
      current.country !== last.location.country
    ) {
      score += 40;
      reasons.push("Different country login");
    }
    if (
      current.deviceInfo?.userAgent &&
      last.userAgent &&
      current.deviceInfo.userAgent !== last.userAgent
    ) {
      score += 20;
      reasons.push("New device/browser detected");
    }
  } else {
    reasons.push("First login - baseline");
  }

  let riskLevel = "low";
  if (score >= 70) riskLevel = "high";
  else if (score >= 40) riskLevel = "medium";

  return {
    riskScore: score,
    riskLevel,
    reason: reasons.join(", ") || "Normal activity",
  };
};
