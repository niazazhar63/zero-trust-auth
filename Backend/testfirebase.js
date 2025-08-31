import { firebaseAuth } from "./config/firebase.js";

(async () => {
  try {
    const user = await firebaseAuth.createUser({
      email: "testuser1234@gmail.com",
      displayName: "Test User",
    });
    console.log("User created:", user.uid);
  } catch (err) {
    console.error("Firebase error:", err);
  }
})();
