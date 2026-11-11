import jwt from 'jsonwebtoken';
import env from '../config/index.js';
import { findUserById } from '../database/queries.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
      });
    }

    const token = header.substring(7);

    const payload = jwt.verify(token, env.JWT_SECRET);

    const user = await findUserById(payload.sub);

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
      });
    }

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
}