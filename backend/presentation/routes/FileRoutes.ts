import Router from 'express';
const FileRouter = Router();

import { FileController } from '../controllers/fileController';
import { requireAuth } from '../middlewares/requireAuth';


FileRouter.post('/createDir', requireAuth, FileController.createDir);


export default FileRouter;