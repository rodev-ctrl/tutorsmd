// Типы
interface State {
    subjects: any[];
    tutors: any[];
    menu: any[];
    menuClient: any[];
    menuTutor: any[];
    headerText: any;
    time: any[];
    questions: any[];
    likedTutors: number[];
    accessToken: string;
}

interface ActionType {
    type: string;
    payload?: any;
}

// Импорты
import germanStoreImport, { setAccessToken as setGermanAccessToken } from '../store/germanStore';
import russianStoreImport, { setAccessToken as setRussianAccessToken } from '../store/russianStore';
import AuthService from "../services/AuthServices";
//
  
// Универсальный интерфейс стора для минимальной совместимости
type GlobalStoreLike = {
    getState: () => any;
    dispatch: (action: ActionType | any) => void;
};

// Хранилище по умолчанию
let store: GlobalStoreLike = germanStoreImport as unknown as GlobalStoreLike;

export const setGlobalStore = (newStore: GlobalStoreLike) => {
    store = newStore;
};
  
  // ✅ Основная функция с указанными типами
export const authFetch = async (url: string, options: RequestInit = {}, language: string): Promise<Response> => {
    let state: State | undefined;
  
    if (language === "german" && germanStoreImport) {
      state = (germanStoreImport.getState() as { german: State }).german;
      setGlobalStore(germanStoreImport);
    } else if (language === "russian" && russianStoreImport) {
      state = (russianStoreImport.getState() as { russian: State }).russian;
      setGlobalStore(russianStoreImport);
    }
  
    if (state) {
      const token = state.accessToken;
  
      const headers = {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : '',
        "Content-Type": "application/json"
      };
  
      const finalOptions: RequestInit = {
        ...options,
        headers
      };
  
      const response: Response = await fetch(url, finalOptions);
  
      if (response.status === 401) {
        try {
          
            const refreshed = await AuthService.refreshSoft();

            if (!refreshed || !refreshed.accessToken) {
              console.error("Ответ не получен (undefined)");
              throw new Error("Нет соединения с сервером");
            }
  
              const newToken = refreshed.accessToken;
              const currentState = store.getState() as any;
              const currentToken = currentState?.accessToken ?? currentState?.russian?.accessToken ?? currentState?.german?.accessToken;
              if (newToken && newToken !== currentToken) {
                const setAccessToken = language === "russian" ? setRussianAccessToken : setGermanAccessToken;
                store.dispatch(setAccessToken(newToken));
              }


              store.dispatch({ type: "SET_ACCESS_TOKEN", payload: newToken });
  
              const newHeaders = {
                ...options.headers,
                Authorization: `Bearer ${newToken}`,
                "Content-Type": "application/json"
              };
  
              const newOptions: RequestInit = {
                ...options,
                headers: newHeaders
              };
  
              return fetch(url, newOptions);
            
          
        } catch (error) {
          console.error("Ошибка при обновлении токена:", error);
          return response;
        }
      }
  
      return response;
    }
  
    return fetch(url, options);
  };
  