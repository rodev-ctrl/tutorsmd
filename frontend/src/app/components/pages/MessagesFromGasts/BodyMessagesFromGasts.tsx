import React, {
  FunctionComponent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AuthService from "../../../services/AuthServices.ts";
import "./BodyMessagesFromGasts.css";
import { Button } from "@mui/material";
import { io, Socket } from "socket.io-client";
import AnswerInput from "./AnswerInput.tsx";

type AdminSocket = Socket & {
  data: {
    decryptedChatId?: string;
  };
};



type Props = {
  messagesGasts: MessageMain[];
  setMessagesGasts: React.Dispatch<React.SetStateAction<MessageMain[]>>;
  messagesClients: MessageMain[];
  setMessagesClients: React.Dispatch<React.SetStateAction<MessageMain[]>>;
  messagesTutors: MessageMain[];
  setMessagesTutors: React.Dispatch<React.SetStateAction<MessageMain[]>>;
};

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

const BodyMessagesFromGasts: FunctionComponent<Props> = React.memo(
  ({
    messagesGasts,
    messagesClients,
    messagesTutors,
    setMessagesGasts,
    setMessagesClients,
    setMessagesTutors,
  }) => {
    const [currentChatId, setCurrentChatId] = useState<string>("");
    const [decodedCurrentChatId, setDecodedCurrentChatId] = useState<string>("");
    const socketRef = useRef<AdminSocket | null>(null);

   

    // Подключение сокета при выборе чата
    useEffect(() => {
      //console.log(currentChatId);
      if (!currentChatId) return;
      console.log(currentChatId);

      const backendURL = process.env.REACT_APP_SOCKET_URL || "http://localhost:7898";

      const socket = io(backendURL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
      }) as AdminSocket;

      //socketRef.current = socket;
      //socket.customData = {}; // Обязательно инициализируем
      socketRef.current = socket;
      

      const connect = async () => {
        const response = await AuthService.getAdminToken();
        if (!response) {
          console.error("Ответ не получен (undefined)");
          throw new Error("Нет соединения с сервером");
        }
        
        if (response.status >= 400) {
          throw new Error("Ошибка получения токена админа");
        }
        
        //console.log(response);
        if (response?.data?.refreshToken) {
          const refreshToken = response.data.refreshToken;

          //console.log(refreshToken);
          //console.log(currentChatId);
          const decryptedChatId = (
            await AuthService.decrypt(currentChatId)
          ).data.decrypted;
          console.log(decryptedChatId);
          setDecodedCurrentChatId(decryptedChatId);
          console.log(decodedCurrentChatId);
          let chatid = "";
          if(decodedCurrentChatId) {
              chatid = decodedCurrentChatId;
          } else if(decryptedChatId) {
              chatid = decryptedChatId;
          }
          console.log(chatid);
          console.log(socketRef.current);
          if(chatid.length > 0 && chatid.includes("@") && socketRef.current) {
            socketRef.current.data = {
              decryptedChatId: chatid,
             };
             socket.emit("join", /*{ email: chatid, role: "admin", target: "question", lessonid: "" }*/);
          }
          
        }
      };

      connect();

      return () => {
        socket.disconnect();
      };
    }, [currentChatId]);


    const handleSend = (chatId: string, message: string) => {
      const mesg = { answer: message };
      console.log(mesg);
      //console.log("CONCHHHHHHHHHHHHHHHHHHHHHHHHH BLYATTTTTTTTTTTTTTTTTTTTTTT");
      //console.log(mesg);
      //console.log(socketRef.current);
      if(socketRef.current) {
        const decrypted = socketRef.current.data.decryptedChatId;
        console.log(decrypted);
        //console.log(decrypted);
        //console.log(socketRef.current);
      
        if (!decrypted || !socketRef.current) {
          console.warn("decodedCurrentChatId отсутствует");
          return;
        }
      
        socketRef.current.emit("message", {
          //userToken: "admin",
          //email: decrypted,
          msg: mesg,
          //role: "admin",
          //deviceid: "1",
          //lessonid: ""
        });
            
        
      }
     
    };
    

    const displayMessages = (message: Message, idx: number) => {
      return (
        <p className="text message" key={idx}>
          {message.question
            ? `Клиент: ${message.question}`
            : `Я: ${message.answer}`}
        </p>
      );
    };

    const processedClientsMessages = useMemo(() => {
      return messagesClients.map((client, index) => {
        //console.log(client);
        const chatId = client.chatid || `fallback-${index}`;

        return (
          <div key={index} className="client">
            <h3 className="guest-id font-bold">Клиент: {client.name}</h3>
            <h3 className="guest-id font-bold">Chat ID: {client.chatid}</h3>
            <h2 className="text-xl">Сообщения:</h2>

            {client.messages.map((msg, idx) => displayMessages(msg, idx))}

            {currentChatId === chatId && (
              <AnswerInput chatId={chatId} onSend={handleSend} />
            )}

            <Button
              onClick={() => {
                //console.log(chatId);
                setCurrentChatId(chatId);
              }}
              >
              {currentChatId === chatId ? "Скрыть" : "Показать больше"}
            </Button>
          </div>
        );
      });
    }, [messagesClients, currentChatId]);

    const processedGastsMessages = useMemo(() => {
      return messagesGasts.map((guest, index) => {
        const chatId = guest.chatid;

        return (
          <div key={index} className="gast">
            <h3 className="guest-id font-bold">Гость</h3>
            <h3 className="guest-id font-bold">Chat ID: {chatId}</h3>
            <h2 className="text-xl">Сообщения:</h2>

            {guest.messages.map((msg, idx) => displayMessages(msg, idx))}

            {currentChatId === chatId && (
              <AnswerInput chatId={chatId} onSend={handleSend} />
            )}

            <Button
              onClick={() => {
                setCurrentChatId((prev) =>
                  prev === chatId ? "" : chatId
                );
              }}
            >
              {currentChatId === chatId ? "Скрыть" : "Показать больше"}
            </Button>
          </div>
        );
      });
    }, [messagesGasts, currentChatId]);



    return (
      <div className="bodyMessagesFromUsers">
        <div className="gasts">
          <h1>Гости</h1>
          {processedGastsMessages}
        </div>
        <div className="clients">
          <h1>Клиенты</h1>
          {processedClientsMessages}
        </div>
        {/* <div className="tutors"><h1>Преподаватели</h1>{processedTutorsMessages}</div> */}
      </div>
    );
  }
);

export default React.memo(BodyMessagesFromGasts);
