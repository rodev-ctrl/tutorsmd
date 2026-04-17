import { AxiosResponse } from "axios";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import api, { publicApi } from "../http";
import { AuthResponse } from "../models/response/AuthResponse";

import store from "../store";

import {
  setUser as setRuUser,
  setRole as setRuRole,
  setAccessToken as setRuToken,
} from "../store/russianStore";

import {
  setUser as setDeUser,
  setRole as setDeRole,
  setAccessToken as setDeToken,
} from "../store/germanStore";

const getEnv = () => {
  const lang = localStorage.getItem("language") || "german";

  return lang === "russian"
    ? { setUser: setRuUser, setRole: setRuRole, setToken: setRuToken }
    : { setUser: setDeUser, setRole: setDeRole, setToken: setDeToken };
};

export default class AuthService {
/*
  static async getDeviceId(): Promise<string> {
    let deviceId = localStorage.getItem("deviceId");
    if (deviceId) return deviceId;

    const fp = await FingerprintJS.load();
    const { visitorId } = await fp.get();

    localStorage.setItem("deviceId", visitorId);
    return visitorId;
  }
    */

  // LOGIN
  static async login(
    email: string,
    password: string,
    role: string
  ): Promise<AxiosResponse<AuthResponse>> {
    console.log("ENTER AuthService.login", email, role);
    try {
        
        const res = await publicApi.post<AuthResponse>(
          "login",
          { email, password },
          { withCredentials: true }
        );
    console.log(res);
        if(res.data) {
            const { setUser, setRole, setToken } = getEnv();
            const data = res.data;
        
            const person = data.person || data.client || data.tutor;
        
            if (data?.accessToken && person) {
              store.dispatch(setRole(role));
              store.dispatch(setUser(person));
              store.dispatch(setToken(data.accessToken));
            }
        }
       
    
        return res;
    } catch(err:any) {
        console.log(err);
        if (err.response?.data?.message) {
            throw new Error(err.response.data.message);
          }
      
          throw new Error("Нет соединения с сервером");
    } finally {
        console.log("EXIT AuthService.login");
      }
   
  }

  // REGISTRATION
  static async registration(
    name: string,
    surname: string,
    email: string,
    password: string
  ): Promise<AxiosResponse<AuthResponse>> {

    return publicApi.post<AuthResponse>(
      "registration",
      { name, surname, email, password },
      { withCredentials: true }
    );
  }

  // REFRESH (для useAuth)
  static async checkAuth() {

    const url = "refresh";

    const res = await api.post<AuthResponse>(
      url, {},
      { withCredentials: true }
    );
    console.log(res);
/*
    const { setUser, setRole, setToken } = getEnv();

    if(res && res.data) {
      const data = res.data;
      console.log(data);
  
      const person = data.person || data.client || data.tutor || data.user;
  
      if (data?.accessToken && person) {
        store.dispatch(setRole(data.role));
        store.dispatch(setUser(person));
        store.dispatch(setToken(data.accessToken));
      }
  */
    if(res && res.data) {
      return res.data;
    }
   return null
  }


  static async refreshSoft() {

    const url = "refreshSoft";

    const res = await api.post<AuthResponse>(
      url,
      { withCredentials: true }
    );
    console.log(res);

    if(res && res.data) {
      return res.data;
    }
   return null
  }

  // LOGOUT
  static async logout() {
    
    await api.post("logout", { withCredentials: true });

    const { setUser, setRole, setToken } = getEnv();

    store.dispatch(setUser(null));
    store.dispatch(setRole("gast"));
    store.dispatch(setToken(""));
  }
  

  static async setGastCookie() {
    return api.get("setGastCookie", { withCredentials: true });
  }

  /*
  static async passwordIsChanged(newPassword: string, email: string, role: string) {
    const url =
      role === "client"
        ? "client/passwordIsChanged"
        : "tutor/passwordIsChanged";

    return api.post(url, { newPassword, email }, { withCredentials: true });
  }
    */

  static async passwordChange(oldPassword: string, newPassword: string) {
    return api.post("password/change", { oldPassword, newPassword }, { withCredentials: true });
  }

  static async forgotPassword(email: string, language: string) {
    return api.post("password/forgot", { email, language }, { withCredentials: true })
  }

  static async passwordReset(link: string, newPassword: string) {
    console.log(link);
    console.log(newPassword);
    return api.post("password/reset", {link, newPassword}, {withCredentials: true} );
  }

  static async emailChange(newEmail: string, password:string) {
    return api.post("email/change", {newEmail, password}, {withCredentials: true} );
  }


  static async ReceiveMessagesFromUser(role: string, email?: string, userToken?: string) {
    return api.post("messagesFromUser", { role, email, userToken }, { withCredentials: true });
  }

  static async ReceiveAllMessagesFromUsers() {
    return api.get("allMessagesFromUsers", { withCredentials: true });
  }

  static async getAdminToken() {
    return api.get("adminToken", { withCredentials: true });
  }

  static async decrypt(id: string) {
    return publicApi.post("decrypt", { id }, { withCredentials: true });
  }

  
}
