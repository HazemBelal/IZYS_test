import bcrypt from 'bcrypt';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'fallback-secret';
const SALT_ROUNDS = 10;

export const AuthService = {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  },

  // Compare password with hash
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  },

  // Generate JWT token
  generateToken(payload: object, expiresIn: string = '1h'): string {
    // Construct options and assert its type as SignOptions
    const options = {
      algorithm: 'HS256',
      expiresIn,            // string like '1h' or a number of seconds
    } as SignOptions;

    return jwt.sign(payload, JWT_SECRET, options);
  },

  // Verify JWT token
  verifyToken(token: string): any {
    return jwt.verify(token, JWT_SECRET);
  }
};
