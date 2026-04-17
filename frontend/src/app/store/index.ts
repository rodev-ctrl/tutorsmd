import { configureStore } from "@reduxjs/toolkit";
import { russianReducer } from "./russianStore";
import { germanReducer } from "./germanStore";

export const store = configureStore({
  reducer: {
    russian: russianReducer,
    german: germanReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
