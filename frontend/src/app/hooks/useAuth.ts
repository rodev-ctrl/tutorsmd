import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

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

import AuthService from "../services/AuthServices";
import UserService from "../services/UserService";

type Role = "gast" | "client" | "tutor";

export const useAuth = (language: string) => {

  const dispatch = useDispatch();

  const user = useSelector((state: any) =>
    state.russian?.user || state.german?.user || null
  );

  const roleFromStore = useSelector((state: any) =>
    state.russian?.role || state.german?.role || "gast"
  );

  /*
  const token = useSelector((state: any) =>
    state.russian?.accessToken || state.german?.accessToken || ""
  );
  */

  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAllowCookies, setIsAllowCookies] = useState(false);

  // ---- Функция установки гостя ----
  const setGast = useCallback(() => {
    if (language === "russian") {
      dispatch(setRuRole("gast"));
      dispatch(setRuUser(null));
      dispatch(setRuToken(""));
    } else {
      dispatch(setDeRole("gast"));
      dispatch(setDeUser(null));
      dispatch(setDeToken(""));
    }
  }, [language]);

  // ---- Проверяем куки ----
  useEffect(() => {
    async function checkCookieAllow() {
      try {
        const res = await UserService.checkCookiesAllow();
        console.log(res);
        if (res) setIsAllowCookies(true);
      } catch(e) {
        console.log(e)
      }
    }
    checkCookieAllow();
  }, []);

  const getEnv = () => {
    return language == "russian"
      ? { setUser: setRuUser, setRole: setRuRole, setToken: setRuToken }
      : { setUser: setDeUser, setRole: setDeRole, setToken: setDeToken };
  };

  // ---- Основная проверка авторизации ----
  const checkAuth = useCallback(async () => {
    //const storedRole = (localStorage.getItem("role") ?? "gast") as Role;
console.log("check")
    try {
      //if (storedRole === "client" || storedRole === "tutor") {
        let data = await AuthService.checkAuth();
      //} else {
console.log(data)
        if (!data || !data.accessToken || !data.user) {
          return {
            user: { email: "" },
            role: "gast",
            isAllowCookies,
            isAuthChecked,
          };
        }

        const { setUser, setRole, setToken } = getEnv();
      
          const person = data.person || data.client || data.tutor || data.user;
      
          if (data?.accessToken && person) {
            dispatch(setRole(data.role));
            dispatch(setUser(person));
            dispatch(setToken(data.accessToken));
          }
        
      //}
    } catch (e) {
      console.log("SET GAST")
      const guest = await AuthService.setGastCookie();
      if (guest) setGast();
      console.error("Auth check failed:", e);
    } finally {
      setIsAuthChecked(true);
    }
  }, [setGast]);

  // ---- Запуск checkAuth один раз ----
  useEffect(() => {
    console.log("REFRESH");
    checkAuth();
  }, []);

  return {
    user: user || { email: "" },
    role: roleFromStore || "gast",
    //userToken: token,
    isAllowCookies,
    isAuthChecked,
  };
};
