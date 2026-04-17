export interface Booking {
    id: number;
    userToken: string;
    tutorEmail: string;
    dateTime: string;
    email: string;
    lessonid: string;
    status: string;
  }
  
  export interface BookingResponse {
    message: string;
    booking: Booking | Booking[]; // Учитываем, что "booking" может быть объектом или массивом объектов
  }