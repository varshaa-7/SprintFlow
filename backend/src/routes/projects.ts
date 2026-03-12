import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listProjects, createProject, deleteProject } from '../controllers/projects';

const router = Router();

router.use(authenticate);
router.get('/', listProjects);
router.post('/', createProject);
router.delete('/:id', deleteProject);

export default router;
