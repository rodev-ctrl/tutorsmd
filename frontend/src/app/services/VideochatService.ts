import axios, { AxiosResponse } from "axios";
import api, { publicApi } from "../http";

type Booking = {
  id: number;
  usertoken: string;
  tutoremail: string;
  datetime: string;
  lessonid: string;
  status: string;
}

const backendURL = process.env.REACT_APP_BACKEND_URL || "/api/";

export default class VideochatService {
  
  

     static async getVideochatUsers(lessonid:string) {
        try{
            const response = api.post(`getVideochatUsers`, {
                lessonid
              });
              
                return response;
        } catch(e) {
          console.log(e)
        }
     
     }

     static async setVideochatUsers(userToken: string, booking:Booking) {
        try{

          console.log(userToken);
          console.log(booking);
            const response = api.post(`setVideochatUsers`, {
                userToken,
                booking
              });
              
                return response;
        } catch(e) {
          console.log(e)
        }
     
     }

     static async removeVideochatUsers(userToken: string, lessonid:string) {
        try{
            const response = api.post(`removeVideochatUsers`, {
                userToken,
                lessonid
              });
              
                return response;
        } catch(e) {
          console.log(e)
        }
     
     }


   
     
}