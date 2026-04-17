// Универсальный селектор пользователя
export const selectUser = (state: any) => 
  state.russian?.user || state.german?.user || null;

// Универсальный селектор роли
export const selectRole = (state: any) => 
  state.russian?.role || state.german?.role || "gast";

// Универсальный селектор токена
export const selectToken = (state: any) => 
  state.russian?.accessToken || state.german?.accessToken || "";

type Language = "russian" | "german"

export const selectLanguage = (state: any) => state.language;

