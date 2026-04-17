import Router from 'express';
const AdminRouter = Router();

import { AdminController } from '../controllers/adminController';
import { requireAuth } from '../middlewares/requireAuth';


AdminRouter.get("/allMessagesFromUsers", requireAuth, AdminController.ReceiveAllMessagesFromUsers);
AdminRouter.get("/adminToken", AdminController.getAdminToken);
// AdminRouter.post("/decrypt", AdminController.decrypt);
AdminRouter.post('/admin/get', AdminController.getAdmin);


export default AdminRouter;

