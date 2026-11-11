// apps/api/src/routes/workers.js
import { Router } from 'express';
import { index } from '../controllers/workersController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', index);

export default router;