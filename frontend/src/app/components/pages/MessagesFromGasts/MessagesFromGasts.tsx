"use client"
import React, { FunctionComponent, useEffect, useState } from "react";

import BodyMessagesFromGasts from "./BodyMessagesFromGasts";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import AuthService from "../../../services/AuthServices.ts";
import UserService from "../../../services/UserService.ts";





type Message = {
  question?: string;
  answer?: string;
  language: string;
  files?: Array<{ name: string; type: string; data: number[] }>;
  ts?: number;
};

type MessageMain = {
  userid: string;
  name: string;
  email: string;
  chatid: string;
  messages: Message[];
};


const MessagesFromGasts:FunctionComponent = () => {
  
  const [messagesGasts, setMessagesGasts] = useState<MessageMain[]>([]);
  const [messagesClients, setMessagesClients] = useState<MessageMain[]>([]);
  const [messagesTutors, setMessagesTutors] = useState<MessageMain[]>([]);
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
 

console.log("MessagesFromUsers");

 

  useEffect(() => {
   async function checkRole() {
    const role = localStorage.getItem("role");
    if(role) {
      const isAdmin = await UserService.checkAdmin(role);
console.log(isAdmin);
      if(isAdmin) {
        setAccessGranted(true);
      }
    }
      
    }

    checkRole();
    
  }, []);



  




    // Загружаем сообщения при монтировании компонента
    useEffect(() => {
      
      async function fetchMessages() {
        try {
          console.log("Fetching messages...");
          const response = await AuthService.ReceiveAllMessagesFromUsers();

          if (!response) {
            console.error("Ответ не получен (undefined)");
            throw new Error("Нет соединения с сервером");
          }
          
          if (response.status >= 400) {
            throw new Error("Ошибка получения всех сообщений от пользователей сайта");
          }

          console.log(response.data);
if(response && response.data && response.data.users) {
  let users = response.data.users;
  console.log("Fetched messages from API:", users);
  for (let [key, value] of Object.entries(users)) {
    if (key === "gasts") {
      setMessagesGasts(value as MessageMain[] || []);
    }
    if (key === "clients") {
      console.log(value); // value — массив
      setMessagesClients(value as MessageMain[] || []);
    }
    if (key === "tutors") {
      setMessagesTutors(value as MessageMain[] || []);
    }
  }
  
}
 else {
            console.error("Invalid data received from API:", response?.data?.users);
          }
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      }
  
      if(accessGranted) {
        fetchMessages();
      }
      
    }, [accessGranted]);



    

  
return(
    <div>
      
      <div className="header h-20">
         <Link to="/">
            <Button className="hover:cursor-pointer bg-blue-300 hover:bg-gray-300 rounded-2xl"
                    style={{width: "60px", height: "60px"}}>
              Назад
            </Button>
         </Link>
      </div>

      
        <BodyMessagesFromGasts 
                       messagesGasts={messagesGasts} messagesClients={messagesClients} messagesTutors={messagesTutors} 
                       setMessagesGasts={setMessagesGasts} setMessagesClients={setMessagesClients} setMessagesTutors={setMessagesTutors} />
    
          
    </div>
    )
   
  }

  export default React.memo(MessagesFromGasts);
