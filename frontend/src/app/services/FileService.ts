import axios, { AxiosResponse } from "axios";
import api, { publicApi } from "../http";

export default class FileService {
   static file: File;
   static dirId: number;
   
  static formData = new FormData();

  static action() {
   
  
       try {
        
        FileService.formData.append('file', this.file);
         
         if(this.dirId) {
            let id = String(this.dirId);
             FileService.formData.append('parent', id);
         }

  
    } catch(e) {
        console.log(e);
       }

  }


  static async createDir(email:string) {
    //console.log("Hello File Create Dir");
    //console.log(email);
    let data = await api.post("createDir", { email });
        //console.log(data);
        return data;
  } 
  
}