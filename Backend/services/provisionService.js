import { firebaseAuth } from "../config/firebase.js";
import { sendPasswordSetEmail } from "../utils/emailService.js";

/**
 * Create a Firebase user and send a password set email (SCIM direct flow)
 * @param {Object} param0
 * @param {string} param0.email - User email
 * @param {string} param0.displayName - User display name
 * @returns {Object} uid and resetLink
 */
export const provisionUserAndEmail = async ({ email, displayName }) => {
  try {
    // 1️⃣ Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new Error(`Invalid email: ${email}`);
    }
    email = email.trim().toLowerCase();
    displayName = (displayName || "User").trim();

    console.log("Provisioning user:", email);

    // 2️⃣ Check if user already exists
    let user = null;
    try {
      user = await firebaseAuth.getUserByEmail(email);
      console.log("User already exists:", user.uid);
    } catch (err) {
      // User does not exist, safe to create
      user = null;
      console.log("User does not exist, will create new.");
    }

    // 3️⃣ Create user if not exists
    if (!user) {
      user = await firebaseAuth.createUser({
        email,
        displayName,
        disabled: false,
        emailVerified: false,
      });
      console.log("New user created:", user.uid);
    }

    // 4️⃣ Generate password reset link
    const resetLink = await firebaseAuth.generatePasswordResetLink(email);
    console.log("Password reset link generated");

    // 5️⃣ Send email
    await sendPasswordSetEmail({
      to: email,
      name: displayName,
      resetLink,
    });
    console.log("Password set email sent");

    return { uid: user.uid, resetLink };
  } catch (err) {
    console.error("Provision error:", err);
    throw err; // Let the controller handle response
  }
};
