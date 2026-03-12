import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getTenant, inviteMember } from '../controllers/tenants';

const router = Router();

router.use(authenticate);
router.get('/me', getTenant);
router.post('/invite', requireRole('OWNER', 'ADMIN'), inviteMember);

export default router;
