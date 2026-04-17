import axios, { AxiosResponse } from "axios";
import api, { publicApi } from "../http";


export default class LessonService {

    // Метод АССИНХРОННЫЙ, по этому всегда возвращается PROMISE
    static async getLessonsScheduleByTutor(email:string) {
        return api.post("/getLessonsScheduleByTutor", {email}, { withCredentials: true });
    }
 
}