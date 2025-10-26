// redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './sessionSlice'; // Correct import for sessionReducer

const store = configureStore({
  reducer: {
    session: sessionReducer, // Use sessionReducer for session state
  },
});

export default store;

// Infer the type of the store
export type AppStore = typeof store;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
