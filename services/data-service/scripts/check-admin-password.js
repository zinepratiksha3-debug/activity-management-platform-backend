
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { stdin, stdout } from "node:process";
import User from "../model/user.model.js";

async function readPassword() {
  if (!stdin.isTTY) throw new Error("Run in an interactive terminal.");

  stdout.write("Type the current admin password (input hidden): ");
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
        if (char === "\u0003") throw new Error("Cancelled.");
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
  await mongoose.connect(process.env.MONGO_DB_URL);

  const user = await User.findOne({
    email: "zinepratiksha777@gmail.com",
  }).select("+password");

  if (!user) throw new Error("Admin account not found.");

  const password = await readPassword();
  const matched = await bcrypt.compare(password, user.password);

  console.log("Password matches database:", matched);
}

main()
  .catch((error) => {
    console.error("Check failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
