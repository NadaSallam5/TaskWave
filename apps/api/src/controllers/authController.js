// apps/api/src/controllers/authController.js
import { z } from 'zod';
import * as authService from '../services/authService.js';

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export async function register(req, res, next) {
  try {
    const parsed = registerSchema.parse(req.body);
    const { user, token } = await authService.register(parsed.name, parsed.email, parsed.password);
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (err instanceof z.ZodError) return res.status(422).json({ error: err.errors[0].message });
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.parse(req.body);
    const { user, token } = await authService.login(parsed.email, parsed.password);
    res.json({ user, token });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (err instanceof z.ZodError) return res.status(422).json({ error: err.errors[0].message });
    next(err);
  }
}