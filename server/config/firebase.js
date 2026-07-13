const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
require("dotenv").config();

try {
  // Parse private key
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });

  console.log("Success: Firebase Admin SDK Initialized Successfully");

  // Export an object matching your existing .auth() calls in middleware and controllers
  module.exports = {
    auth: () => getAuth(app),
  };
} catch (error) {
  console.error("Error: Firebase Admin Initialization Error:", error.message);
  process.exit(1);
}
