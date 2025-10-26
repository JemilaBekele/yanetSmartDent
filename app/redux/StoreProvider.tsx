"use client"; 
import store from "./store";  // Default import
import { Provider } from "react-redux";

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    return <Provider store={store}>{children}</Provider>;
};
