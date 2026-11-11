// apps/api/src/controllers/eventsController.js
import * as eventService from '../services/eventService.js';

export function stream(req, res, next) {
  req.socket.setNoDelay(true);
  req.socket.setTimeout(0);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write('\n');

  eventService.addClient(res);

  req.on('close', () => {
    eventService.removeClient(res);
  });
}