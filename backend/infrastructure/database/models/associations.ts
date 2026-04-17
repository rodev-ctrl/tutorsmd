import Client from "./clientModel";
import Tutor from "./tutorModel";
import Booking from "./bookingModel";
import Lesson from "./lessonModel";
import LessonMessage from "./lessonMessagesModel";
import ClientToken from "./tokenModel";
import TutorToken from "./tokenTutorModel";
import { Complaint } from "./complaintModel";

export const setupAssociations = () => {
  // Ассоциации Client
  Client.hasMany(ClientToken, { foreignKey: 'clientid', as: 'tokens' });
  Client.hasMany(Booking, { foreignKey: 'clientid', as: 'bookings' });
  Client.hasMany(Lesson, { foreignKey: 'client_email', sourceKey: 'email', as: 'lessons' });
  Client.hasMany(Complaint, { foreignKey: 'clientid', as: 'complaints' });

  // Ассоциации Tutor
  Tutor.hasMany(TutorToken, { foreignKey: 'tutorid', as: 'tokens' });
  Tutor.hasMany(Lesson, { foreignKey: 'tutor_email', sourceKey: 'email', as: 'lessons' });

  // Ассоциации Booking
  Booking.belongsTo(Client, { foreignKey: 'clientid', as: 'client' });
  Booking.belongsTo(Tutor, { foreignKey: 'tutorid', as: 'tutor' });

  // Ассоциации Lesson & Messages
  Lesson.hasMany(LessonMessage, { foreignKey: 'lessonid', sourceKey: 'lessonid', as: 'messages' });
  LessonMessage.belongsTo(Lesson, { foreignKey: 'lessonid', targetKey: 'lessonid', as: 'lesson' });

  console.log("✅ Associations initialized");
};