// apps/api/src/routes/events.js
import { Router } from 'express';
import { stream } from '../controllers/eventsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', stream);

export default router;