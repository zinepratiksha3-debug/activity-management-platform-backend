// import bcrypt from "bcryptjs";

// export const encryptPassword = (password) => {
//     if (typeof password !== "string" || password.trim().length === 0) {
//         throw new Error("Invalid Password");
//     }

//     return bcrypt.hashSync(password, 10);
// };

// export const comparePassword = (password, hash) => {
//     if (typeof password !== "string" || typeof hash !== "string" || hash.length === 0) {
//         return false;
//     }

//     return bcrypt.compareSync(password, hash);
// };



import bcrypt from "bcryptjs";

// Salt rounds - .env मधून किंवा default 10
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10");

/**
 * Password encrypt करा
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const encryptPassword = async (password) => {
  try {
    // Validation
    if (typeof password !== "string") {
      throw new Error("Password must be a string");
    }

    if (password.trim().length === 0) {
      throw new Error("Password cannot be empty");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Hash करा
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error(`Password encryption failed: ${error.message}`);
  }
};

/**
 * Password compare करा
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True अगर मिळाले
 */
export const comparePassword = async (password, hash) => {
  try {
    // Validation
    if (typeof password !== "string" || typeof hash !== "string") {
      return false;
    }

    if (password.trim().length === 0 || hash.length === 0) {
      return false;
    }

    // Compare करा
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    console.error("Password comparison error:", error.message);
    return false;
  }
};