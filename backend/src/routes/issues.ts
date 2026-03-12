import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listIssues, getIssue, createIssue, updateIssue, deleteIssue,
  getStats, addComment, createIssueValidation,
} from '../controllers/issues';

const router = Router();

router.use(authenticate); 

router.get('/stats', getStats);
router.get('/', listIssues);
router.get('/:id', getIssue);
router.post('/', createIssueValidation, createIssue);
router.patch('/:id', updateIssue);
router.delete('/:id', deleteIssue);
router.post('/:id/comments', addComment);

export default router;
