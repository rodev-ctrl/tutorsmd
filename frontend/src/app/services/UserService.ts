import api, { publicApi } from "../http";
import { AuthResponse } from "../models/response/AuthResponse";


type SchedulePlan = {
  timezone: string;
  subjects: Record<string, Array<{ dow: number; time: string; status: string }>>;
};





export default class UserService {
   static async getTutors() {
      try{
         const data = await api.get("tutors");
         if(data) return data;

      } catch(e) {
         console.log(e)
      }

   }

   static async getTutor(name:string, surname:string, language:string) {
      try{
        console.log("get Tutor")
        console.log(language);
        console.log(surname);
        console.log(name);
         const data = await api.post(`tutors/get/${name}/${surname}`, {language});
         console.log(data);
         if(data) return data;

      } catch(e) {
         console.log(e)
      }

     }

     static async bookings(userid:number, tutorEmail:string, dateTime:string, email:string, role:string) {
      console.log(userid);
      console.log(tutorEmail);
      console.log(dateTime);
      console.log(email);
      console.log(role);
      const response = api.post(`bookings`, {
         userid,
         tutorEmail,
         dateTime,
         email,
         role
       });
       
         return response;
     }

     static async getTutorReviews(tutorId: number, limit = 10, offset = 0) {
      try {
        console.log("get Tutor Reviews");
        return await api.get(
          `tutors/${tutorId}/reviews`,
          { params: { limit, offset } }
        );
      } catch (e: any) {
        if (e.response?.status === 404) return null;
        throw e;
      }
    }
    
    
    static async getMyReview(tutorId: number) {
      try {
        console.log("get My Review");
        const response = api.get(`tutors/${tutorId}/reviews/me`);
        return response;
      } catch (e: any) {
        if (e.response?.status === 404) return null;
        throw e;
      }
    }
    
    static async sendReview(tutorId: number, grade: number, comment: string) {
      console.log("send Review");
      const URL = `tutors/${tutorId}/reviews`;
      console.log(grade);
      console.log(comment);
      console.log(URL);
      return api.post(URL, { grade, comment });
    }
    
    static async editReview(reviewId: number, grade: number, comment: string) {
      console.log("edit Review");
      const URL = `reviews/${reviewId}`;
      console.log(grade);
      console.log(comment);
      console.log(URL);
      return api.put(URL, { grade, comment });
    }
    

   
    

    static async getLessons(client_email: string, tutor_email?: string) {
      try {
        const response = await api.post('/getLessons', { client_email, tutor_email });

        if(response && response.data) {
          console.log(response);
          return response.data;
        } else {
          return { 
            id: 0,
            lessonid: "",
            client_email: "",
            tutor_email: "",
            datetime: {
              timezone: '',
              subjects: {}
            },
            status: ""
          };
        }
        
      
      } catch(e: any) {
        if(e.response?.status == 400 || e.response?.status === 404) {
          return { 
            id: 0,
            lessonid: "",
            client_email: "",
            tutor_email: "",
            datetime: {
              timezone: '',
              subjects: {}
            },
            status: ""
          };
        }

        console.log("getLessons unexpected error:", e);
        return { 
          id: 0,
          lessonid: "",
          client_email: "",
          tutor_email: "",
          datetime: {
            timezone: '',
            subjects: {}
          },
          status: ""
        };
      }
      
      
    }
    

     static async setLessonSchedule(lessonid:string, plan:SchedulePlan, client_email:string, tutor_email:string) {

      try {
        console.log(lessonid);
        console.log(plan);
        console.log(client_email);
        console.log(tutor_email);
        const resp = await api.post('setLessonSchedule', { lessonid, plan, client_email, tutor_email });
        console.log(resp);
        return resp;               // есть бронь
      } catch (err: any) {
        if (err?.response?.status === 404) {
          return null;             // просто нет брони — это ок
        }
        throw err;                 // остальные ошибки — наверх
      }
     }

     static async getBooking(id:number, role:string, tutorEmail?:string, lessonid?:string) {
      try {
        const resp = await api.post('getBooking', { id, tutorEmail, role, lessonid });
        if (resp?.status === 404) {
          return null;             // просто нет брони — это ок
        }
        return resp;               // есть бронь
      } catch (err: any) {
        if (err?.response?.status === 404) {
          return null;             // просто нет брони — это ок
        }
        
        throw err;                 // остальные ошибки — наверх
      }
    }

    static async deleteBooking(lessonid:string) {
      console.log(lessonid);
      const res = await api.post('deleteBooking', { lessonid });
      console.log(res);
      if(res.status == 200 && res.data.message == "Booking deleted successfully") {
        console.log(res);
        return res;
      }
      
    }
    
/*
     static async cancelBooking(userToken:string, tutorEmail:string, dateTime:string, lessonid:string) {
      const response = api.post(`cancelBooking`, {
         userToken,
         tutorEmail,
         dateTime,
         lessonid
       });
       
         if(response) return response;
     }
*/
static async cancelBooking(id:string, lessonid:string) {
  return api.post('cancelBooking', { id, lessonid });
}

static async sendComplaint(complaint:string) {
  return api.post('sendComplaint', { complaint });
}

     static async saveProgress(week_range: string, total_hours: number, email: string) {
      const response = api.post(`saveProgress`, {
        week_range,
        total_hours,
        email
      });

      if(response) return response;
    }

    static async getProgress(email: string) {
      const response = api.post(`getProgress`, {email});

      if(response) return response;
    }

    /*
    static async addCard(paymentMethodId:string, email:string) {
      console.log("add card in service");
      const response = api.post(`addCard`, {
         email,
         paymentMethodId
       });
       console.log(response);
       
         if(response) return response;
     }
     */

     static async checkAdmin(role: string) {
      try {
        if(role == "tutor") {
         const refreshToken = await api.get("adminToken", { withCredentials: true });

         if(refreshToken) {
            const response = await api.post(`admin/get`, {
               refreshToken
             }, { withCredentials: true });

             if(response.data.access) {
               return response.data.access;
             }
         }
         
        }
      } catch(e) {
         console.log(e);
      }
     }


     static async checkCookiesAllow() {
       const response = await api.get("checkCookiesAllow", {withCredentials: true});
console.log(response);
       if(response && response.data) {
         const isAllow = response.data.ok;
         if(isAllow) return isAllow;
       }
       
     }

     static async areCookiesForUsage() {
       const response = await api.get("areCookiesForUsage", {withCredentials: true});

       if(response && response.data) {
         const isAllow = response.data.message;
         if(isAllow) return isAllow;
       }
       
     }

     



    static async deleteAccount(email:string, role:string) {
      const response = api.post(`deleteAccount`, {
         email,
         role
       });
       console.log(response);
       
        if(response) return response;
     }
}