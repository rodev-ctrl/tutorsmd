import { Router } from 'express';
const ClientRouter = Router();

import { ClientController } from '../controllers/clientController';
import { requireAuth } from '../middlewares/requireAuth';



// ClientRouter.post('/loginClient', ClientController.login);
// ClientRouter.post('/logoutClient', requireAuth, ClientController.logout);
ClientRouter.post('/registration', ClientController.createClient);
// ClientRouter.post('/client/passwordIsChanged', ClientController.passwordIsChanged);

// ClientRouter.get('/clients', ClientController.getClients);
// ClientRouter.get('/client/get', ClientController.getOneClientByAccessToken);
ClientRouter.get("/activate/:activationLink", ClientController.activateClient);
//ClientRouter.get("/checkIsActivated/:link", ClientController.checkIsActivated);
// ClientRouter.put('/clients/:name', ClientController.updateClient);
// ClientRouter.delete('/clients/:email', ClientController.deleteClient);

ClientRouter.post('/saveProgress', requireAuth, ClientController.saveProgress);
ClientRouter.post('/getProgress', requireAuth, ClientController.getProgress);






//ClientRouter.post('/questionAsk', ClientController.questionAsk);



export default ClientRouter;


