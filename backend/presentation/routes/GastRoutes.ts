import Router from 'express';
const GastRouter = Router();

import { GastController }  from '../controllers/gastController';


GastRouter.get('/setGastCookie', GastController.setGastCookie);



export default GastRouter;