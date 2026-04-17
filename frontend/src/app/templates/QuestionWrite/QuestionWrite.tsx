/*
"use client";

import React, { useState, useRef, FunctionComponent, useEffect, useMemo, useCallback, Ref, RefObject } from "react";

import Button from '@mui/material/Button';
import TextField from "@mui/material/TextField";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';


import FileService from "../../services/FileService";

import "./QuestionWrite.css";
import EmojiBlock from "./EmojiBlock";
import { useLocation } from "react-router-dom";
import Close from "../Close";


const AddFile = require("../../../assets/img/addFile.png");
const AddEmoji = require("../../../assets/img/emojiAdd.png");
const SendIcon = require("../../../assets/img/sendIcon.png");




type Tutor = {
  id: number,
  name: string,
  reviews: Object[],
  availableSubjects: String[],
  highlight: string,
  fullDescribe: string
}


type Props = {
    language: string,
    isQuestionWriteBlockOpened: string,
    setIsQuestionWriteBlockOpened: Function,
    name: string
  }

  
  interface PropsStore {
    subjects: Object[],
    tutors: Tutor[],
    menu: Object[]
  }

  
  

const QuestionWrite: FunctionComponent<Props> = ({language, isQuestionWriteBlockOpened, setIsQuestionWriteBlockOpened, name}) => {

  const ref = useRef<HTMLDivElement>(null);

const [user, setUser] = useState<object>({});
const [newQuestion, setNewQuestion] = useState<string>("");

const [route, setRoute] = useState<string>("questionAsk");
const [stickyStyle, setStickyStyle] = useState<string>("");
const [selectedFiles, setSelectedFiles] = useState<Array<File>>([]);
const [isEmojiOpened, setIsEmojiOpened] = useState<Boolean>(false);
const [currentEmoji, setCurentEmoji] = useState(null);
const [isAllFilesBlockOpened, setIsAllFilesBlockOpened] = useState<boolean>(false);
const [isMainContentOpened, setIsMainContentOpened] = useState<boolean>(true);
const [hours, setHours] = useState<number>(0);
const [params, setParams] = useState(null);
const [messages, setMessages] = useState<Array<Message>>([]);
const [processedMessages, setProcessedMessages] = useState<JSX.Element[]>([]);
const [chatId, setChatId] = useState<string | null>(null);

const filePicker = useRef<HTMLInputElement | null>(null);
const listOfFiles = useRef<HTMLParagraphElement | null>(null);
const [fileLinks, setFileLinks] = useState<{ name: string; link: string }[]>([]);


const backToMainContent = () => {
  setIsAllFilesBlockOpened(false);
  setIsMainContentOpened(true);
}




useEffect(() => {
  let date = new Date();
  setHours(date.getHours());
}, []);



const socket = io("http://localhost:7898", {
  withCredentials: true, // Убедитесь, что используете этот параметр для передачи cookies
})   // URL-Backend

let userId = "";
  useEffect(() => {
    if(isQuestionWriteBlockOpened !== "hidden") {
      const matchGast = document.cookie.match(/gastToken=([^;]+)/);
      const matchClient = document.cookie.match(/accessToken=([^;]+)/);

if (matchGast) {
  userId = matchGast[1];
} 

if (matchClient) {
  userId = matchClient[1];
} 
 

 // Отправляем userId на сервер при подключении
 socket.emit("join", { userId });

     // Слушаем сообщение о присоединении к комнате
     socket.on("join", ({ chatId, members }) => {
      setChatId(chatId);
      console.log(`Joined room: ${chatId} with members:`, members);
    });


socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err);
});
    }
  }, [isQuestionWriteBlockOpened]);

  


const handleFile = (e:any) => {

   setSelectedFiles((prev) => {
    let arr = [...prev, e.target.files[0]];
   
    return arr;
});
}


const clickFile = () => {
  if(filePicker.current) {
    filePicker.current.click()   // клик на добавление файла
  }
}


const deleteFile = (id: number) => { 
  for(let i = 0; i < selectedFiles.length; i++) {
    if(i == id) {
      setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index != id));
    } 
    
  }
}

const displayAllMessages = useCallback(async () => {
  const links: { name: string; link: string }[] = [];
  const elements: JSX.Element[] = [];

  for (const message of messages) {
    for (const file of message.files) {
      if (typeof file === 'object' && file !== null && 'name' in file) {
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        const link = URL.createObjectURL(blob);

        links.push({ name: file.name, link });
        elements.push(
          <p className="file" key={file.name} onClick={() => saveFile(link)}>
            {file.name}
          </p>
        );
      } else {
        console.error('Некорректный тип файла:', file);
      }
    }

    elements.push(<p className="message" key={message.question}>{message.question}</p>);
  }

  setFileLinks(links);
  setProcessedMessages(elements);
}, [messages]);

useEffect(() => {
  displayAllMessages();
}, [messages, displayAllMessages]);




//const saveFile = (link: HTMLAnchorElement) => {
//  link.click();
//}
  
const saveFile = (link: string) => {
  const anchor = document.createElement('a');
  anchor.href = link;
  anchor.download = 'file';
  anchor.click();
};


const visabilityEmojiBlock = () => {
  (isEmojiOpened) ? setIsEmojiOpened(false) : setIsEmojiOpened(true);
}


useEffect(() => {
  if(currentEmoji != null) setNewQuestion(newQuestion + currentEmoji);
}, [currentEmoji]);



type Message = {
  question: string;
  files: Array<number[] | File>;
  language: string;
}

//////////// Тут нужны WebSockets по идее /////////////////////////////////////////////////////
const responseFunction = async(data:Message) => {
console.log(data);
  const { question, files, language } = data;

     // Преобразуем файлы в массив байтов
  const byteArrayFiles = files
  ? await Promise.all(
      files.map(async (file) => {
        if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        return Array.from(new Uint8Array(arrayBuffer));
        };

        return file;
      })
    )
  : [];

 // Формируем сообщение
 const message:Message = {
  question,
  files: byteArrayFiles, // Преобразованные файлы
  language: language || "russian",
};

 if(message != null) {
  socket.emit("message", message);   
  //setMessages((prev) => [...prev, message]);
 }

  
  
  socket.on("message", (receivedMessage) => {
    setMessages((prev) => [...prev, receivedMessage]);
    console.log("Bekommen");
    console.log(messages);
  });

  setNewQuestion("");
}




  
    class TranslateClass {

     static header() {
      let greeting = "";
      if(hours > 6 && hours < 12) {
        if(language == "russian") greeting = "Доброе утро";
        if(language == "german") greeting = "Guten Morgen";
      }
      if(hours >= 12 && hours < 18) {
        if(language == "russian") greeting = "Добрый день";
        if(language == "german") greeting = "Guten Tag";
      }
      if(hours >= 18 || hours <= 6) {
        if(language == "russian") greeting = "Добрый вечер";
        if(language == "german") greeting = "Guten Abend"; 
      }

        if(language == "russian") {
           return <h1 className="greeting text-center mt-5">{greeting + " " + name + " !"}<br/> Я ваш менеджер Роман. Напишите мне Ваш вопрос и я в ближайшее время Вам отвечу</h1>
        } else if(language == "german") {
           return <h1 className="greeting text-center m-2 mt-5">{greeting + " " + name + " !"}<br/> Ich bin Ihr Manager Roman. Schreiben Sie mir Ihre Frage und ich helfe Ihnen in Kurze</h1>
        }
      }

      static inputPlaceholder() {
        if(language == "russian") {
          return "Вопрос"
        } else if(language == "german") {
          return "Frage"
        }
      }

      static buttonAllFiles() {
        if(language == "russian") {
          return "Файлы"
        } else if(language == "german") {
          return "Files"
        }
      }

      static buttonSend() {
        if(language == "russian") {
          return "Отправить"
        } else if(language == "german") {
          return "Schicken"
        }
      }

    }


    useEffect(() => {
      console.log(isQuestionWriteBlockOpened);
      if(ref.current) {
        if(isQuestionWriteBlockOpened == "sticky") {ref.current.style.position = "sticky"; setIsMainContentOpened(true)}
        else {ref.current.style.display="none"}
      }
     
    }, [isQuestionWriteBlockOpened])


   

  return (
  
<div ref={ref} className="questionWrite justify-self-end shadow-[0_-3px_38px_-9px_rgba(0,0,0,1)]">
  {isMainContentOpened ? ( 
  <div className="mainContent">
  <div className="flex">
    <div className="choosedFiles">
      <Button 
            type="button"
            onClick={() => {setIsAllFilesBlockOpened(true); setIsMainContentOpened(false)}}
      >
                 {TranslateClass.buttonAllFiles()}   
      </Button> 
    </div>
    <div className="items-center justify-between">{TranslateClass.header()}</div>
    <div className="m-2"><Close funcClose={setIsQuestionWriteBlockOpened} /></div>
  </div>
<input
                      key={Math.random()}
                      type="file"
                      ref={filePicker}
                      title="fileChoose"
                      className="fileChoose"
                      onChange={handleFile}
                      accept=".png, .jpg, .web, .pdf, .docx"
            />


    <div className="messages">
    {processedMessages}
    </div>
                       
                
               
    <div className="flex downInputAndIcons">
            
            
            
            <div className="input ml-3">
            <TextField
                    onChange={(e) => setNewQuestion(e.target.value)}
                    value={newQuestion} 
                    label={TranslateClass.inputPlaceholder()} 
                    variant="outlined" />
              </div>
 
           
            <div className="icons mb-2 flex" style={{"position": "relative", left: "20px"}}>

            <Button 
                      type="button" 
                      className=""
                      onClick={clickFile} >
                
                  <img src={AddFile} className="hover:cursor-pointer" title="Add File" style={{width: "45px", height: "45px" }} />
                  <div ref={listOfFiles}></div>
                </Button>

                <Button 
                      type="button" 
                      className=""
                      onClick={visabilityEmojiBlock}>
                       <img src={AddEmoji} title="Add Emoji" style={{width: "45px", height: "45px" }} />
                </Button> 
                   
                <Button
                      type="button" 
                      className=""
                      onClick={() => responseFunction({question: newQuestion, files: selectedFiles, language: language})}>
                       <img src={SendIcon} title="Send" style={{width: "45px", height: "45px"}} />
                </Button>
            </div>  
  </div>
      
</div>
) : <div></div>}


{isAllFilesBlockOpened ? (
  <div>
   <div className="flex p-2">
    <Close funcClose={function(){}} funcCloseBoolean={backToMainContent} />
    <div className="w-full text-3xl">
    <h1 className="text-center">All Files</h1>
    </div>
   </div>
   {
  selectedFiles.map((file, index) => (
      
      <div key={index} className={`${index} flex p-4`}>
        <p className="my-auto">{index + 1}. <span className="font-bold">{file.name}</span></p>
        <Button
                variant="contained"
                color="error"
                className="bg-red-700 w-10 h-4 p-4 rounded-lg"
                style={{"position": "relative", left: "40px", padding: "10px"}}
                onClick={() => deleteFile(index)}>
          Delete
        </Button>
      </div>
    ))
  
  }
</div>

): null}

<EmojiBlock isEmojiOpened={isEmojiOpened} setCurentEmoji={setCurentEmoji} />

</div>
  );

}
export default QuestionWrite;
*/
"use client";

import React, { useState, useRef, FunctionComponent, useEffect, useCallback, useMemo, Ref, RefObject, forwardRef, ForwardedRef } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { io, Socket } from "socket.io-client";
import Close from "../Close";
import EmojiBlock from "./EmojiBlock";

const AddFile = require("../../../assets/img/addFile.png");
const AddEmoji = require("../../../assets/img/emojiAdd.png");
const SendIcon = require("../../../assets/img/sendIcon.png");


import "./QuestionWrite.css";
import AuthService from "../../services/AuthServices";
import Attachments from "./Attachments";
import { useSelector } from "react-redux";
import { selectUser, selectRole, selectToken } from "../../store/selectors";

import { useLanguage } from "../../context/LanguageContext";

// что отправляем НА бэк
type OutgoingMessage = {
  question?: string;
  answer?: string;
  language: string;
  files?: Array<{ name: string; type: string; data: number[] }>;
  ts?: number;
};

// что получаем ОТ бэка (и из истории)
type FileMeta = { name: string; url: string; size?: number; type?: string };
type IncomingMessage = {
  id?: string;
  ts?: number;
  question?: string;
  answer?: string;
  language?: string;
  files?: FileMeta[];
};




type ChatItem =
  | { id: string; from: "me" | "admin"; ts: number; text: string }
  | { id: string; from: "me" | "admin"; ts: number; files: FileMeta[] };


  type Props = {
    refQuestionWrite: ForwardedRef<HTMLDivElement>
  }

      const QuestionWrite: FunctionComponent<Props> = ({refQuestionWrite}) => {

          const user = useSelector(selectUser);
          const role = useSelector(selectRole);
          const userToken = useSelector(selectToken);
          const { language } = useLanguage();

          const [isAuthFertig, setIsAuthFertig] = useState<boolean>(false);
          const [history, setHistory] = useState<ChatItem[]>([]);


       /*
       useEffect(() => {
        async function checkAuth() {
          
      
          try {
            const accessToken = store.getState().accessToken;

            switch (roleFromLocalStorage) {
              case "tutor":
              case "client": {
                const user = await AuthService.checkAuth(roleFromLocalStorage, language, accessToken);

                if (!user) {
                  console.error("Ответ не получен (undefined)");
                  throw new Error("Нет соединения с сервером");
                }
                
                if (user.status >= 400) {
                  throw new Error("Ошибка авторизации или refresh для клиента или пользователя");
                }

                if (user?.data?.client) {
                  handleClientLogin(user.data.client, user.data.refreshtoken);
                } else if (user?.data?.tutor) {
                  handleTutorLogin(user.data.tutor, user.data.refreshtoken);
                }
  const currentToken = (store.getState() as any).accessToken;
              if (user?.data?.accessToken && user.data.accessToken !== currentToken) {
                store.dispatch(setAccessToken(user.data.accessToken));
              }

                
                break;
              }
      
              case "gast":
              default:
                localStorage.setItem("role", "gast");
                await setCookie();
                break;
            }
          } catch (error) {
            console.error("Ошибка в checkAuth:", error);
          }
        }
      if(clientUse && clientUse.email.length > 0 || tutorUse && tutorUse.email.length > 0) checkAuth();
      }, []);
      

     // Установка гостевого токена
async function setCookie() {
  try {
    if(localStorage.getItem("role")?.length == 0) {
      localStorage.setItem("role", "gast");
    }
    const user = await AuthService.setGastCookie();

    if (!user) {
      console.error("Ответ не получен (undefined)");
      throw new Error("Нет соединения с сервером");
    }
    
    if (user.status >= 400) {
      throw new Error("Ошибка утсановки токена для гостя");
    }

    setUserToken(user.data.gastToken);
    setIsAuthFertig(true);
  } catch (error) {
    console.error("Ошибка при установке гостевого токена:", error);
  }
}



// Функция для обработки входа клиента
const handleClientLogin = (clientData:Client, refreshToken: string) => {
  setUserToken(refreshToken);
  setEmail(clientData.email);
  setIsAuthFertig(true);
};

// Функция для обработки входа преподавателя
const handleTutorLogin = (tutorData:Tutor, refreshToken:string) => {
  setUserToken(refreshToken);
  setEmail(tutorData.email);
  setIsAuthFertig(true);
};
*/
       
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newQuestion, setNewQuestion] = useState<string>("");
  const [processedMessages, setProcessedMessages] = useState<JSX.Element[]>([]);
  const [isMainContentOpened, setIsMainContentOpened] = useState<boolean>(true);
  const [isAllFilesBlockOpened, setIsAllFilesBlockOpened] = useState<boolean>(false);
  const [currentEmoji, setCurentEmoji] = useState<string | null>(null);

const [route, setRoute] = useState<string>("questionAsk");
const [stickyStyle, setStickyStyle] = useState<string>("");
const [isEmojiOpened, setIsEmojiOpened] = useState<Boolean>(false);
const [hours, setHours] = useState<number>(0);
const [params, setParams] = useState(null);
const [chatId, setChatId] = useState<string | null>(null);
const filePicker = useRef<HTMLInputElement | null>(null);
const listOfFiles = useRef<HTMLParagraphElement | null>(null);
const [fileLinks, setFileLinks] = useState<{ name: string; link: string }[]>([]);
const socketRef = useRef<Socket | null>(null);

const [id, setId] = useState<number>(0);
// const [copyToken, setCopyToken] = useState<string>("");
const [copyMessages, setCopyMessages] = useState<IncomingMessage[]>([]);

const lastFetchedMessages = useRef<OutgoingMessage[] | null>(null);
const hasRefreshed = useRef(false); // Флаг для предотвращения повторного вызова refreshMessages
const hasDisplayedMessages = useRef(false); // Флаг для displayAllMessages
const [socketReady, setSocketReady] = useState(false);
const [checkMessages, setCheckMessages] = useState<boolean>(false);


  // Массив рефов для каждого сообщения
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // const [currentUser, setCurrentUser] = useState<Tutor | Client>(user);



  class TranslateClass {

    static header(language: string, name: string, hours: number) {
     let greeting = "";
     if(hours > 6 && hours < 12) {
       if(language == "russian") greeting = "Доброе утро";
       if(language == "german") greeting = "Guten Morgen";
     }
     if(hours >= 12 && hours < 18) {
       if(language == "russian") greeting = "Добрый день";
       if(language == "german") greeting = "Guten Tag";
     }
     if(hours >= 18 || hours <= 6) {
       if(language == "russian") greeting = "Добрый вечер";
       if(language == "german") greeting = "Guten Abend"; 
     }

       if(language == "russian") {
          return <h1 className="greeting text-center">{greeting + " " + name}<br/> Я менеджер Роман</h1>
       } else if(language == "german") {
          return <h1 className="greeting text-center">{greeting + " " + name}<br/> Ich bin Manager Roman</h1>
       }
     }

     static inputPlaceholder() {
       if(language == "russian") {
         return "Вопрос"
       } else if(language == "german") {
         return "Frage"
       }
     }

     static buttonAllFiles() {
       if(language == "russian") {
         return "Файлы"
       } else if(language == "german") {
         return "Files"
       }
     }

     static buttonBack() {
      if(language == "russian") {
        return "Назад"
      } else if(language == "german") {
        return "Zurück"
      }
    }

     static buttonSend() {
       if(language == "russian") {
         return "Отправить"
       } else if(language == "german") {
         return "Schicken"
       }
     }


   }

   function openClose() {
    if(refQuestionWrite && "current" in refQuestionWrite && refQuestionWrite.current) {
      if(refQuestionWrite.current.style.position == "sticky" || refQuestionWrite.current.style.position == "fixed" || refQuestionWrite.current.style.display == "block") {refQuestionWrite.current.style.display = "none";}
      else {refQuestionWrite.current.style.position="sticky"; refQuestionWrite.current.style.display="block"; setIsMainContentOpened(true)}
    }
   }

   const clickFile = () => {
    if(filePicker.current) {
      filePicker.current.click()   // клик на добавление файла
    }
  }

  const visabilityEmojiBlock = () => {
    (isEmojiOpened) ? setIsEmojiOpened(false) : setIsEmojiOpened(true);
  }

  const deleteFile = (id: number) => { 
    for(let i = 0; i < selectedFiles.length; i++) {
      if(i == id) {
        setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index != id));
      } 
      
    }
  }


  const socketURL = useMemo(
    () => process.env.REACT_APP_SOCKET_URL || window.location.origin,
    []
  );
   // ✅ Инициализация сокета при монтировании
   useEffect(() => {
    console.log("AAAAAAAUUUUUUUU");
    
    if (!user.email && user.email.length < 1) return;
  
    const socket = io(socketURL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  
    socketRef.current = socket;
  
    socket.on("connect", () => {
      if (user?.email && role) {
        socket.emit("join"/*, { email: user?.email, role, target: "question", lessonid: "" }*/);
      }
    });
  
    socket.on("joined", () => {
      // Ставим слушатель только после успешного join
      socket.on("message", (receivedMessage: IncomingMessage) => {
  
       // const processedFiles: never[] = [];
  
       setCopyMessages(prev => [...prev, receivedMessage]);
      });

      
    });
  
    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });
  
  }, [isAuthFertig]);
  

useEffect(() => {
  hasDisplayedMessages.current = true;

  const date = new Date();
  const currentLanguage = language.length > 0 ? language : String(localStorage.getItem("language"));
  const answerItem = TranslateClass.header(currentLanguage, user?.name, date.getHours());
  const alignment: "start" | "end" = "start";
  const className = "answer";

  setProcessedMessages(prev => [
    ...prev,
    <div
      key={Math.random()}
      className={`message ${className}`}
      style={{ justifySelf: alignment }}
    >
      {answerItem}
    </div>
  ]);
}, []);

async function refreshMessages() {

  if (hasRefreshed.current) return;
  hasRefreshed.current = true;

  /*
  if (userToken) {
    setCopyToken(userToken);
    setUserToken(userToken);
  }
    */

  if (window.location.href !== `${process.env.REACT_APP_CLIENT_URL}/dashboard/gast/messages`) {
    if (refQuestionWrite && "current" in refQuestionWrite && refQuestionWrite.current && role && user && user?.email.length > 0 && userToken) {
  
      if(!role || !userToken) {
        throw new Error("Not enough data");
      }

      let messagesFromGast: any = null;
      console.log(user);
      console.log(user.email);
      console.log(role);
      if(role === "gast") {
        messagesFromGast = await AuthService.ReceiveMessagesFromUser(role, userToken);
      } else {
        messagesFromGast = await AuthService.ReceiveMessagesFromUser(role, user?.email);
      }


      if (messagesFromGast && messagesFromGast.data) {
        const newMessages: IncomingMessage[] = messagesFromGast.data.messages;

        //lastFetchedMessages.current = newMessages;

         setCopyMessages(prev => [...prev, ...newMessages]);
      } else {

        if (messagesFromGast && messagesFromGast.status >= 400) {
          throw new Error("Ошибка авторизации или refresh для клиента или пользователя");
        }
        console.error("Ответ не получен (undefined)");
        throw new Error("Нет соединения с сервером");

        
      }
    }
  }
}

// ⬇️ Новый правильный useEffect: ждет currentUser и role
useEffect(() => {

  if (role) {
    refreshMessages();
  }
}, [role, user]);



/*
const displayAllMessages = () => {
  hasDisplayedMessages.current = true;

  if (currentUser) {
    if (copyMessages.length !== 0) {
      
      const elements = (copyMessages as OutgoingMessage[] || []).map((message, index) => {
        const ref = messageRefs.current[index];
        let questionItem = "";
        let answerItem = "";
        let alignment: "start" | "end" = "start";
        let className = "";

        if (message.question) {
          questionItem = message.question;
          alignment = "end";
          className = "question";
        }

        if (message.answer !== undefined) {
          answerItem = message.answer;
          alignment = "start";
          className = "answer";
        }

        return (
          <div
            ref={(el) => (messageRefs.current[index] = el)}
            key={`${questionItem}-${answerItem}-${index}`}
            style={{ justifySelf: alignment }}
            className={`message ${className}`}
          >
            {questionItem && <p className="text">{questionItem}</p>}
            {answerItem && <p className="text">{answerItem}</p>}
          </div>
        );
      });

      setProcessedMessages(elements);
    }
  }
};
*/

const displayAllMessages = () => {
  if (!user || copyMessages.length === 0) return;


  const elements = [...copyMessages]
  .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0))
  .map((m, index) => {
    const hasQuestion = !!m.question;
    const alignment: "start" | "end" = hasQuestion ? "end" : "start";
    const className = hasQuestion ? "question" : "answer";

    return (
      <div
        ref={el => (messageRefs.current[index] = el)}
        key={`${m.question ?? ""}-${m.answer ?? ""}-${index}`}
        style={{ justifySelf: alignment }}
        className={`message ${className}`}
      >
        {m.question && <p className="text">{m.question}</p>}
        {m.answer && <p className="text">{m.answer}</p>}
        {m.files?.length ? <Attachments files={m.files} /> : null}
      </div>
    );
  });

  setProcessedMessages(elements);
};



useEffect(() => {
  displayAllMessages();
}, [copyMessages]);


  const saveFileFromMetadata = (file: { name: string; type: string; data: number[] }) => {
    const blob = new Blob([new Uint8Array(file.data)], { type: file.type });
    const link = URL.createObjectURL(blob);
    saveFile(link);
  };
  

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files as FileList | null; // Явное указание типа
    if (files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };
  

  const saveFile = (link: string) => {
    const anchor = document.createElement("a");
    anchor.href = link;
    anchor.download = "file";
    anchor.click();
  };


  

  const responseFunction = () => {
    const message: OutgoingMessage = {
      question: newQuestion,
      answer: "",
      files: [], // по умолчанию — без файлов
      language,
    };

    console.log(message);
  
    const sendMessage = async (msg: OutgoingMessage) => {
   
      if (socketRef.current) {
        console.log(socketRef.current);
       
  
          if(userToken && msg && role && user?.email) {
             socketRef.current.emit("message", { /*userToken, email,*/ msg /*, role, deviceid, lessonid: ""*/ });
             setSelectedFiles([]);
             setNewQuestion("");
             return;
          }
        
      }
    };
  
    // если нет файлов — отправляем сразу
    if (!selectedFiles || selectedFiles.length === 0) {
      sendMessage(message);
      setCheckMessages(true);
      return;
    }
  
    // если есть файлы — обрабатываем
    const byteArrayFiles = selectedFiles.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      return {
        name: file.name,
        type: file.type,
        data: Array.from(new Uint8Array(arrayBuffer)),
      };
    });
  
    Promise.all(byteArrayFiles).then((processedFiles) => {
      message.files = processedFiles;
      sendMessage(message);
      setCheckMessages(true);
    });
  };
  
  return (
    <div ref={refQuestionWrite} id="questionWrite" style={{display: "none"}} className={`questionWrite justify-self-end shadow-[0_-3px_38px_-9px_rgba(0,0,0,1)]`}>
      {isMainContentOpened ? (
        <div className="mainContent">
         <div className="flex justify-between items-center w-full">
  <div className="choosedFiles">
    <Button 
      type="button"
      onClick={() => {
        setIsAllFilesBlockOpened(true);
        setIsMainContentOpened(false);
      }}
    >
      {TranslateClass.buttonAllFiles()}   
    </Button> 
  </div>

  <div>
    <Close funcClose={openClose} />
  </div>
</div>



             <input key={Math.random()} 
                    type="file"  
                    ref={filePicker}
                    title="fileChoose"
                    className="fileChoose" multiple onChange={handleFile} accept=".png, .jpg, .web, .pdf, .docx" />
          <div className="messages">{processedMessages}</div>
<div className="flex downInputAndIcons">       
<div className="input ml-3">
            <TextField
                    onChange={(e) => setNewQuestion(e.target.value)}
                    value={newQuestion} 
                    label={TranslateClass.inputPlaceholder()} 
                    variant="outlined" />
              </div>

          
           <div className="icons flex" style={{"position": "relative", left: "20px"}}>

           <Button 
                     type="button"
                     onClick={clickFile} >
               
                 <img src={AddFile} className="file hover:cursor-pointer" title="Add File" />
                 <div ref={listOfFiles}></div>
               </Button>

               <Button 
                     type="button" 
                     onClick={visabilityEmojiBlock}>
                      <img className="emoji hover:cursor-pointer" src={AddEmoji} title="Add Emoji" />
               </Button> 
                  
               <Button
                     type="button"
                     onClick={responseFunction}>
                      <img className="send hover:cursor-pointer" src={SendIcon} title="Send" />
               </Button>
           </div>  
 </div>
     
</div>
) : <div></div>}


{isAllFilesBlockOpened ? (
  <div>
    {/* стабильная трёхколоночная сетка: [кнопка] [заголовок расширяется] [крестик] */}
    <div
      className="p-2 gap-2"
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
      }}
    >
      <div>
        <Button
          type="button"
          onClick={() => {
            setIsAllFilesBlockOpened(false);
            setIsMainContentOpened(true);
          }}
        >
          {TranslateClass.buttonBack()}
        </Button>
      </div>

      <h1 className="text-3xl text-center m-0">
        {TranslateClass.buttonAllFiles()}
      </h1>

      <div className="justify-self-end">
        <Close funcClose={openClose} />
      </div>
    </div>

    {selectedFiles.length > 0 ? (
      selectedFiles.map((file, index) => (
        <div key={index} className="flex items-center gap-4 p-4">
          <p className="m-0">
            {index + 1}. <span className="font-bold">{file.name}</span>
          </p>
          <Button
            variant="contained"
            color="error"
            className="rounded-lg"
            onClick={() => deleteFile(index)}
          >
            Delete
          </Button>
        </div>
      ))
    ) : (
      <div className="text-center text-3xl">---</div>
    )}
  </div>
) : null}



<EmojiBlock isEmojiOpened={isEmojiOpened} setCurentEmoji={setCurentEmoji} setNewQuestion={setNewQuestion} />

    </div>
  );
};
export default React.memo(QuestionWrite);
