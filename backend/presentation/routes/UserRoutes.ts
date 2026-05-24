/*
import Router from 'express';
const UserRouter = Router();

import { UserController } from '../controllers/userController';
import { requireAuth } from '../middlewares/auth/requireAuth';


UserRouter.post('/messagesFromUser', UserController.receiveMessagesFromUser);
UserRouter.post('/offers', UserController.offers);
UserRouter.post('/bookings', UserController.bookings);
UserRouter.post('/getBooking', UserController.getBooking);
UserRouter.post('/cancelBooking', UserController.cancelBooking);


// UserRouter.get('/lessons/:lessonid', UserController.lessonLive);
//UserRouter.post('/desk/:lessonid/:pageindex/save', UserController.deskSave);
//UserRouter.get('/desk/:lessonid/:pageindex/get', UserController.getDesk);

//UserRouter.post('/deleteAccount', UserController.deleteAccount);
//UserRouter.post('/addCard', UserController.addCard);
// UserRouter.get('/getRefreshToken', UserController.getRefreshToken);
//UserRouter.post('/getVideochatUsers', UserController.getUsersInRoom);
//UserRouter.post('/setVideochatUsers', UserController.addUser);
//UserRouter.post('/removeVideochatUsers', UserController.removeUser);

UserRouter.get('/checkCookiesAllow', UserController.checkCookiesAllow);
UserRouter.post('/getLessons', requireAuth, UserController.getLessons);
UserRouter.post('/setlessonSchedule', requireAuth, UserController.setLessonSchedule);
UserRouter.post('/deleteBooking', requireAuth, UserController.deleteBooking);
UserRouter.post('/getLessonScheduleByTutor', requireAuth, UserController.getLessonsScheduleByTutor);

UserRouter.get('/tutors', UserController.getTutors);
UserRouter.post('/tutors/get/:name/:surname', UserController.getOneTutor);
UserRouter.post('/sendComplaint', requireAuth, UserController.sendComplaint);



export default UserRouter;
*/