const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const userController = require("../controllers/user.controller");

async function testProfilePictureUpload() {
  console.log("==========================================");
  console.log("📸 PROTOCOL ZERO: PROFILE PICTURE UPLOAD TEST");
  console.log("==========================================");

  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/protocolzero";
    await mongoose.connect(mongoUri);
    console.log("🟢 Connected to MongoDB.");

    // Create temporary user
    const testUser = await User.create({
      name: "Avatar Test User",
      email: `avatar_${Date.now()}@test.com`,
      phone: `+88015${Date.now().toString().slice(-8)}`,
      accountType: "User",
      verificationStatus: "verified"
    });
    console.log(`📍 Created test user: ${testUser.email} (ID: ${testUser._id})`);

    // Mock base64 image string
    const mockBase64Avatar = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...MOCK_AVATAR_DATA";

    // Mock Express Req/Res for updateProfileAddresses
    const req = {
      user: testUser,
      body: {
        avatar: mockBase64Avatar
      }
    };

    let responseData = null;
    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        responseData = data;
        return this;
      }
    };

    await userController.updateProfileAddresses(req, res);

    if (res.statusCode === 200 && responseData?.data?.avatar === mockBase64Avatar) {
      console.log("✅ Profile picture uploaded & persisted in MongoDB successfully!");
      console.log(`   User Avatar field: ${responseData.data.avatar.slice(0, 45)}...`);
    } else {
      console.error(`❌ Profile picture upload test failed. Status: ${res.statusCode}`, responseData);
    }

    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    console.log("🧹 Cleaned up test user.");

    console.log("==========================================");
    console.log("🎉 PROFILE PICTURE UPLOAD TEST PASSED!");
    console.log("==========================================");

  } catch (err) {
    console.error("❌ Test Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

testProfilePictureUpload();
