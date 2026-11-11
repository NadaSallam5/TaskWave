// apps/api/src/controllers/workersController.js
import * as workerService from '../services/workerService.js';

export async function index(req, res, next) {
  try {
    const workers = await workerService.getWorkers();
    res.json({ workers });
  } catch (err) {
    next(err);
  }
}