// apps/api/src/routes/jobs.js
import { Router } from 'express';
import { create, list, get, remove, stats } from '../controllers/jobsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', create);
router.get('/', list);
router.get('/stats', stats);
router.get('/:id', get);
router.delete('/:id', remove);

export default router;