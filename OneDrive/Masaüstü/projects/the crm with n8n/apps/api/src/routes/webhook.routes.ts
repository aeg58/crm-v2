import { Router } from 'express';
import { N8NWebhookController } from '../webhooks/n8n.controller';

const router: Router = Router();

// Webhook routes (no auth required, uses secret header)
router.post('/n8n', N8NWebhookController.handleWebhook);
router.post('/n8n/test', N8NWebhookController.testWebhook);

export default router;
