import { Router } from "express";
const TutorRouter = Router();

import { TutorController } from '../controllers/tutorController';
import { requireAuth } from "../middlewares/requireAuth";


// TutorRouter.get('/clients', ClientController.getClients);
// TutorRouter.get('/clients/:name', ClientController.getOneClient);
// TutorRouter.post('/questionAsk', TutorController.questionAsk);


export default TutorRouter;