import { Router } from 'express';
import { register, registerValidation, login, loginValidation, getMe } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getMe);

export default router;
