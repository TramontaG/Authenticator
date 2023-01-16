import authRouter from './auth';
import userManagerRouter from './user-manager';
import { Router } from 'express';

const router = Router();

router.use('/user', userManagerRouter);
router.use('/auth', authRouter);

export default router;
