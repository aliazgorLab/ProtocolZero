const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");

const run = async () => {
  const email = process.env.SEED_ADMIN_EMAIL || "protocolzero@admin.com";
  const phone = process.env.SEED_ADMIN_PHONE || "+8801700000000";
  const name = process.env.SEED_ADMIN_NAME || "Protocol SuperAdmin";

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();

  let adminUser = await User.findOne({ email: normalizedEmail });

  if (adminUser) {
    adminUser.name = name;
    adminUser.phone = normalizedPhone;
    adminUser.accountType = "SuperAdmin";
    adminUser.verificationStatus = "verified";
    adminUser.score = 0;
    await adminUser.save();
    console.log(`SuperAdmin updated: ${adminUser.email}`);
  } else {
    adminUser = await User.create({
      name,
      phone: normalizedPhone,
      email: normalizedEmail,
      accountType: "SuperAdmin",
      verificationStatus: "verified",
      score: 0,
    });
    console.log(`SuperAdmin created: ${adminUser.email}`);
  }
};

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed admin failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });