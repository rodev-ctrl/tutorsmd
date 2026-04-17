import { AxiosResponse } from "axios";
import api, { publicApi } from "../http";
import { DeskResponse } from "../models/response/DeskResponse";
import { Ref, RefObject } from "react";




export default class DeskService {

    // Метод АССИНХРОННЫЙ, по этому всегда возвращается PROMISE
    static async deskSave(lessonid: string, canvasRef: RefObject<HTMLCanvasElement>, pageindex: number): Promise<AxiosResponse<DeskResponse>> {
        if (!canvasRef.current) throw new Error("Canvas is not initialized");
    
        try {
            const response = await api.post<DeskResponse>(
                `desk/${lessonid}/${pageindex}/save`,
                { img: canvasRef.current.toDataURL(), time: Date.now() },
                { withCredentials: true }
            );

            if(response) {
                return response;
            } else {
                throw new Error("Desk data not found");
            }
        } catch(e) {
            console.log(e);
            throw e;
        }

    }
    
    static async getDesk(lessonid: string, pageindex: number): Promise<AxiosResponse<DeskResponse>> {
        try {
            const response = await api.get<DeskResponse>(
                `desk/${lessonid}/${pageindex}/get`,
                { withCredentials: true }
            );
    
            if(response && response.data) {
                return response;
            } else {
                throw new Error("Desk data not found");
            }
        } catch(e) {
            console.log(e);
            throw e;
        }
        
    }

}