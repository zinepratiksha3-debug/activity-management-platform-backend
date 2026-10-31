
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import User from "../model/user.model.js";

async function askHiddenPassword() {
  if (!stdin.isTTY) {
    throw new Error("Run this script in an interactive terminal.");
  }

  stdout.write("Enter NEW admin password (minimum 12 characters): ");
  stdin.setRawMode(true);
  stdin.resume();

  let password = "";

  try {
    for await (const chunk of stdin) {
      for (const char of chunk.toString("utf8")) {
        if (char === "\r" || char === "\n") {
          stdout.write("\n");
          return password;
        }

        if (char === "\u0003") {
          throw new Error("Cancelled.");
        }

        if (char === "\u007f" || char === "\b") {
          password = password.slice(0, -1);
        } else {
          password += char;
        }
      }
    }
  } finally {
    stdin.setRawMode(false);
  }

  return password;
}

async function main() {
  if (!process.env.MONGO_DB_URL) {
    throw new Error("MONGO_DB_URL is missing.");
  }

  await mongoose.connect(process.env.MONGO_DB_URL);
  console.log("Connected to MongoDB.");

  const email = "zinepratiksha777@gmail.com";
  const user = await User.findOne({ email }).select("+password");

  if (!user || user.role !== "admin") {
    throw new Error("Admin account not found. No changes made.");
  }

  const password = await askHiddenPassword();

  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }
  console.log("Password characters received:", password.length);

  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  user.password = await bcrypt.hash(password, rounds);
  await user.save();

  console.log("Admin password reset successfully.");
  console.log("Email:", user.email);
  console.log("Role:", user.role);
}

main()
  .catch((error) => {
    console.error("Reset failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
