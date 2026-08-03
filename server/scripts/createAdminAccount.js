const mongoose = require("mongoose");
require("dotenv").config({ path: "e:/6th final project/ProtocolZero/server/.env" });

const admin = require("../config/firebase");
const User = require("../models/User");

const createAdmin = async () => {
  const email = "protocolzero@admin.com";
  const password = "abcd1234";
  const phone = "+8801700000000";
  const name = "Protocol Zero Admin";

  console.log(`Setting up Admin account for ${email}...`);

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  let firebaseUser;
  try {
    firebaseUser = await admin.auth().getUserByEmail(email);
    console.log(`Found existing Firebase Auth user (${firebaseUser.uid}). Updating password...`);
    await admin.auth().updateUser(firebaseUser.uid, {
      password: password,
      displayName: name,
    });
    console.log("Firebase Auth password updated.");
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log("Creating new Firebase Auth user...");
      firebaseUser = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
      });
      console.log(`Firebase Auth user created: ${firebaseUser.uid}`);
    } else {
      throw err;
    }
  }

  // Create or update in MongoDB
  let mongoUser = await User.findOne({ email: email.toLowerCase() });
  if (mongoUser) {
    mongoUser.name = name;
    mongoUser.accountType = "SuperAdmin";
    mongoUser.verificationStatus = "verified";
    mongoUser.phone = phone;
    mongoUser.score = 0;
    await mongoUser.save();
    console.log("Updated MongoDB document to SuperAdmin role.");
  } else {
    mongoUser = await User.create({
      name: name,
      email: email.toLowerCase(),
      phone: phone,
      accountType: "SuperAdmin",
      verificationStatus: "verified",
      score: 0,
    });
    console.log("Created MongoDB document with SuperAdmin role.");
  }

  console.log("\n==============================================");
  console.log("✅ SUPERADMIN ACCOUNT READY FOR LOGIN:");
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`🛡️ Role:     SuperAdmin`);
  console.log("==============================================\n");
};

createAdmin()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Admin Creation Failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
