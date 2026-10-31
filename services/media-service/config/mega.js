import { Storage } from "megajs";

let megaStorage = null;

export async function getMegaStorage() {
  if (megaStorage) {
    return megaStorage;
  }

  megaStorage = await new Storage({
    email: process.env.MEGA_EMAIL,
    password: process.env.MEGA_PASSWORD,
  }).ready;

  console.log("✅ MEGA connected successfully");

  return megaStorage;
}