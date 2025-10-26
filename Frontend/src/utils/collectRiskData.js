// src/utils/collectRiskData.js
export const collectRiskData = async () => {
  try {
    // Use backend proxy to get actual IP
    const ipRes = await fetch("https://ipwho.is/");
    const ipData = await ipRes.json();

    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: navigator.deviceMemory || "Unknown",
    };

    return {
      ip: ipData.ip || "Unknown",
      city: ipData.city || "Unknown",
      country: ipData.country || ipData.country_name || "Unknown",
      region: ipData.region || ipData.region_name || "Unknown",
      latitude: ipData.latitude,
      longitude: ipData.longitude,
      org: ipData.org || ipData.asn?.org || "Unknown",
      asn: ipData.asn?.asn || ipData.asn || "Unknown",
      deviceInfo,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Risk data collection failed:", error);
    return { error: true };
  }
};

