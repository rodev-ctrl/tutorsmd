import api from "../http";

export default class UsersChatService {
   
    static async ticket(role:string, email:string) {
      try {
        console.log("ticket");
        const response = await api.post('/ticket', {role, email}, { withCredentials: true });

        console.log(response);
        if(response?.status == 400 || response?.status === 404) {
          return response;
        }

        if(response && response.data) {
          return response.data;
        }
      } catch(e: any) {
         console.log(e);
      }
      
    }
    
}