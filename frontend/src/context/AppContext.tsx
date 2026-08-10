"use client"

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import cookies from "js-cookie";
import axios from "axios";
import {Toaster} from "react-hot-toast";

export const user_service = "http://localhost:5000"
export const chat_service = "http://localhost:5002"

export interface User{
    _id: string;
    name: string;
    email: string;
}
export interface Chat{
    _id: string;
    users: string[];
    latestMessage: {
        text: string;
        sender: string;
    };
    createdAt: string;
    updatedAt: string;
    unseenCount?: number;

}

export interface Chats{
    _id: string;
    users: User;
    chat: Chat;
}

interface AppContextType{
    user: User | null;
    loading: boolean;
    isAuth: boolean;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps{
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);

    async function fetchUser() {
        try{
            const token = cookies.get("token");

            const {data} = await axios.get(`${user_service}/api/v1/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUser(data);
            setLoading(false);
            setIsAuth(true);
        }catch(error){
            console.error("Error fetching user:", error);
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);
    
    return (
        <AppContext.Provider value={{ user, loading, isAuth, setUser, setIsAuth }}>
            {children}
            <Toaster />
        </AppContext.Provider>
    );
}

export const useAppData=():AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppData must be used within an AppProvider");
    }
    return context;
}
