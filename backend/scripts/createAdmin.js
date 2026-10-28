import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

const createAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log("Please set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  await connectDB();

  const existingUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existingUser) {
    console.log(`A user with email ${ADMIN_EMAIL} already exists (role: ${existingUser.role})`);
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
      consent: { termsAccepted: true, acceptedAt: new Date() },
    });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  }

  await mongoose.disconnect();
};

createAdmin();
