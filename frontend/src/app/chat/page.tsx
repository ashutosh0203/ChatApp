"use client";
import ChatSideBar from "@/components/ChatSideBar";
import Loading from "@/components/Loading";
import { useAppData, User } from "@/context/AppContext";
import { useRouter } from "next/dist/client/components/navigation";
import React, { useEffect, useState } from "react";

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}
const ChatApp = () => {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
    setChats,
  } = useAppData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [siderbarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<User| null>(null);
  const [showAllUser, setShowAllUser] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuth) {
      router.push("/login");
    }
  }, [loading, isAuth, router]);

  const handleLogout = () => logoutUser();

  if (loading) return <Loading />;
  return <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
    <ChatSideBar 
      siderbarOpen={siderbarOpen} 
      setSidebarOpen={setSidebarOpen} 
      showAllUser={showAllUser} 
      setShowAllUser={setShowAllUser} 
      users={users} 
      loggedInUser={loggedInUser} 
      chats={chats} 
      selectedUser={selectedUser} 
      setSelectedUser={setSelectedUser} 
      handleLogout={handleLogout} 
    />
    <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10">
      
    </div>
  </div>;
};

export default ChatApp;
