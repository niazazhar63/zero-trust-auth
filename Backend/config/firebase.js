import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("../firebase/zero-trust-auth-cc714-firebase-adminsdk-fbsvc-684f8cad30.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const firebaseAuth = admin.auth();
