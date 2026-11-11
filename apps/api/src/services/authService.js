// apps/api/src/services/authService.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { createUser, findUserByEmail } from '../database/queries.js';
import env from '../config/index.js';

function generateToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: '24h', algorithm: 'HS256' }
  );
}

export async function register(name, email, password) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const error = new Error('Email already registered');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = nanoid();
  const user = await createUser(id, email, passwordHash, name);
  const token = generateToken(user);

  return { user, token };
}

export async function login(email, password) {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;

  return { user: safeUser, token };
}