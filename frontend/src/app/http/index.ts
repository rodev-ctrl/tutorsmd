/*
import axios from 'axios';
import russianStore from '../store/russianStore';
import germanStore from '../store/germanStore';


const backendURL = process.env.REACT_APP_BACKEND_URL || "/api/";

export const API_URL = backendURL;
console.log(backendURL);
// 1) Создание API
const api = axios.create({
    withCredentials: true,    // "withCredentials" - к каждому запросу цепляются COOKIE АВТОМАТИЧЕСКИ
    baseURL: API_URL
});


// 2) Interceptor на 'request' - перехватчик
// На КАЖДЫЙ ЗАПРОС будет цепляться TOKEN
api.interceptors.request.use((config) => {    // 'config' - от InstanceAxios
    // Определяем какой store использовать
    const language = localStorage.getItem('language') || 'german';
    let token: string | undefined;
    
    if (language === 'russian') {
        const state = russianStore.getState();
        token = state.russian?.accessToken;
    } else {
        const state = germanStore.getState();
        token = state.german?.accessToken;
    }
     
     if (token) {
         config.headers.Authorization = `Bearer ${token}`;
       } else {
         delete config.headers.Authorization;
       }
    return config;
});

export default api;
*/

















/////////////////////////////////// РАБОЧАЯ ВЕРСИЯ ////////////////////////

/*
import axios from "axios";
import store from "../store";

import { 
  setUser as ruSetUser,
  setAccessToken as ruSetToken 
} from "../store/russianStore";

import { 
  setUser as deSetUser,
  setAccessToken as deSetToken 
} from "../store/germanStore";

const backendURL = process.env.REACT_APP_BACKEND_URL || "/api/";
export const API_URL = backendURL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});


// =========================
// REQUEST
// =========================
api.interceptors.request.use((config) => {

  const state = store.getState();

  const token =
    state.russian?.accessToken ||
    state.german?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});


// =========================
// RESPONSE
// =========================
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (error.config?.url?.includes("login") || error.config?.url?.includes("registration")) {
        return Promise.reject(error);
      }
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const deviceId = localStorage.getItem("deviceId");
        const role = localStorage.getItem("role");

        if (!deviceId || !role) throw new Error("no role/deviceId");

        const refreshRes = await axios.post(
          `${API_URL}refresh${role[0].toUpperCase()}${role.slice(1)}`,
          { deviceId },
          { withCredentials: true }
        );

        const data = refreshRes.data;

        const access = data?.accessToken;
        const user = data?.person || data?.client || data?.tutor;

        if (!access || !user) throw new Error("refresh failed");

        const language = localStorage.getItem("language") || "german";

        if (language === "russian") {
          store.dispatch(ruSetUser(user));
          store.dispatch(ruSetToken(access));
        } else {
          store.dispatch(deSetUser(user));
          store.dispatch(deSetToken(access));
        }

        originalRequest.headers.Authorization = `Bearer ${access}`;

        return api(originalRequest);
      } catch (e) {

        const language = localStorage.getItem("language") || "german";

        if (language === "russian") {
          store.dispatch(ruSetUser(null));
          store.dispatch(ruSetToken(""));
        } else {
          store.dispatch(deSetUser(null));
          store.dispatch(deSetToken(""));
        }

        localStorage.removeItem("role");

        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
*/

/////////////////////////////////////////////////////////////////////////////

































import axios from "axios";
import store from "../store";

import { 
  setUser as ruSetUser,
  setAccessToken as ruSetToken 
} from "../store/russianStore";

import { 
  setUser as deSetUser,
  setAccessToken as deSetToken 
} from "../store/germanStore";

const backendURL = process.env.REACT_APP_BACKEND_URL || "/api/";
export const API_URL = backendURL;

// для гостя
export const publicApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// для залогиненого пользователя
export const authApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});







authApi.interceptors.request.use((config) => {
  const state = store.getState();
  console.log(state);

  const token =
    state.russian?.accessToken ||
    state.german?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers && "Authorization" in config.headers) {
    delete config.headers.Authorization;
  }

  return config;
});


authApi.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const deviceId = localStorage.getItem("deviceId");
        const role = localStorage.getItem("role");

        if (!deviceId || !role) {
          throw new Error("no role/deviceId");
        }

        const refreshRes = await axios.post(
          `${API_URL}refresh${role[0].toUpperCase()}${role.slice(1)}`,
          { deviceId },
          { withCredentials: true }
        );

        const data = refreshRes.data;

        const access = data?.accessToken;
        const user = data?.person || data?.client || data?.tutor;

        if (!access || !user) {
          throw new Error("refresh failed");
        }

        const language = localStorage.getItem("language") || "german";
console.log(language);
        if (language === "russian") {
          store.dispatch(ruSetUser(user));
          store.dispatch(ruSetToken(access));
        } else {
          store.dispatch(deSetUser(user));
          store.dispatch(deSetToken(access));
        }

        originalRequest.headers.Authorization = `Bearer ${access}`;

        return authApi(originalRequest);
      } catch (e) {
        const language = localStorage.getItem("language") || "german";

        if (language === "russian") {
          store.dispatch(ruSetUser(null));
          store.dispatch(ruSetToken(""));
        } else {
          store.dispatch(deSetUser(null));
          store.dispatch(deSetToken(""));
        }

        localStorage.removeItem("role");

        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
   });


export default authApi;





