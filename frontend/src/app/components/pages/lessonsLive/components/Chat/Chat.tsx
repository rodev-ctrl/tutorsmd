import React, { useEffect, useMemo, useRef, useState, FunctionComponent, useCallback } from "react";
import { Socket } from "socket.io-client";
import { Button, TextField } from "@mui/material";
import EmojiBlock from "../../../../../templates/QuestionWrite/EmojiBlock";

import { useLanguage } from "../../../../../context/LanguageContext";
import { useSelector } from "react-redux";
import { selectRole, selectUser } from "../../../../../store/selectors";

const AddEmoji = require("../../../../../../assets/img/emojiAdd.png");
const SendIcon = require("../../../../../../assets/img/sendIcon.png");


type Message = {
  id: number;
  sender_email: string;
  sender_role?: "client" | "tutor" | "admin";
  text: string;
  created_at: string | Date;
  type: "text" | "system" | "file";
};

type Props = {                   
  lessonid: string; 
  socket: Socket | null;
};


const Chat: FunctionComponent<Props> = ({ lessonid, socket }) => {


  const { language } = useLanguage();
  const user = useSelector(selectUser);
  const role = useSelector(selectRole);

  const hasDisplayedMessages = useRef(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // const [isAllFilesBlockOpened, setIsAllFilesBlockOpened] = useState<boolean>(false);
  const [isMainChatBlockOpened, setIsMainChatBlockOpened] = useState<boolean>(true);
  const [isEmojiOpened, setIsEmojiOpened] = useState<boolean>(false);
  const [currentEmoji, setCurentEmoji] = useState<string | null>(null);

  // const filePickerRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const shouldForceScrollRef = useRef(false);


  const socketURL = useMemo(
    () => process.env.REACT_APP_SOCKET_URL || window.location.origin,
    []
  );
 

  // локализация
  const t = useMemo(() => {
    const lng = language || localStorage.getItem("language") || "russian";
    return {
      inputPlaceholder: lng === "german" ? "Nachricht" : "Сообщение",
      //filesBtn: lng === "german" ? "Files" : "Файлы",
      sendBtn: lng === "german" ? "Schicken" : "Отправить",
      //allFilesTitle: lng === "german" ? "Alle Dateien" : "Все файлы",
      //filesBtnBack: lng === "german" ? "Zurück" : "Назад",
    };
  }, [language]);

  // автоскролл вниз при каждом новом сообщении
  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;
    if (!container || !end) return;
  
    const wasForced = shouldForceScrollRef.current;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
  
    if (wasForced || atBottom) {
      end.scrollIntoView({ behavior: "smooth" });
    }
  
    shouldForceScrollRef.current = false;
  }, [messages.length]);
  




  const onHistory = useCallback((history: Message[]) => {
    setMessages(
      history.map(msg => ({
        ...msg,
        created_at: new Date(msg.created_at),
      }))
    );
  }, []);
  
  const onNewMessage = useCallback((msg: Message) => {

  }, []);
  
  // инициализация сокета
  useEffect(() => {
    if (!socket || !lessonid) return;
    console.log("joinLessonChat");

    socket.emit("joinLessonChat", { lessonid });
  
     socket.off("lessonChatHistory", onHistory);
     socket.off("newLessonMessage", onNewMessage);

     socket.on("lessonChatHistory", onHistory);
     socket.on("newLessonMessage", onNewMessage);

    return () => {
      socket.off("lessonChatHistory", onHistory);
      socket.off("newLessonMessage", onNewMessage);
    };
  }, [socketURL, lessonid, onHistory, onNewMessage]);

  

  useEffect(() => {
    hasDisplayedMessages.current = true;
  }, []);


  /*
  // выбор файлов
  const clickFile = () => filePickerRef.current?.click();
  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };
  const deleteFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };
  */


/*
  // аплоад файлов (REST), возвращает массив метаданных
  const uploadChatFiles = async (files: File[]): Promise<ChatFile[]> => {
    if (!files.length) return [];
    const deviceid = await AuthService.getDeviceId();

    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    form.append("role", role);
    form.append("email", user?.email || "");
    form.append("deviceid", deviceid);

    const res = await fetch(apiBase + "chat/upload", {
      method: "POST",
      body: form,
      credentials: "include",
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      name: f.filename,
      type: f.mimeType,
      url: f.url,
      size: f.size,
    }));
    
  };
  */

  // отправка сообщения
  const sendMessage = async () => {
    const textTrimmed = text.trim();
    if (!textTrimmed && selectedFiles.length === 0) return;

    if (!socket || !socket.connected) {
      console.error("Socket not connected");
      return;
    }

    shouldForceScrollRef.current = true;
    /*
    // 1) сначала грузим файлы, если есть
    let filesMeta: ChatFile[] = [];
    if (selectedFiles.length) {
      try {
        filesMeta = await uploadChatFiles(selectedFiles);
      } catch (e) {
        console.error(e);
        return;
      }
    }
      */

    // 4) локально добавим «эхо», чтобы не ждать round-trip
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(), // временный id
        sender_email: user.email,
        sender_role: role,
        text: text.trim(),
        created_at: new Date(),
        type: "text",
      },
    ]);

    let filesMeta = Object;
    socket?.emit("lessonMessage", {
      msg: text.trim() || (filesMeta.length > 0 ? "Файлы прикреплены" : ""),
      lessonid,
    });

    setText("");
    setSelectedFiles([]);
  };

  /*
  // для legacy сообщений: скачать файл, если пришёл как сырые байты
  const saveFileFromMetadata = (file: ChatFile) => {
    if (!file.data) return;
    const blob = new Blob([new Uint8Array(file.data)], { type: file.type || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name || "file";
    a.click();
    URL.revokeObjectURL(url);
  };
  */

  // рендер одного сообщения
  const renderMessage = (msg: Message, index: number) => {
    const isMine = msg.sender_email === user.email;
    const time = new Date(msg.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        key={msg.id || index}
        className={`message ${isMine ? "text-right" : "text-left"}`}
      >
        <div
          className={`inline-block max-w-xs px-4 py-2 rounded-lg ${
            isMine ? "bg-orange-400 text-white" : "bg-gray-200"
          }`}
        >
          <p className="text-sm font-semibold opacity-70">
            {isMine ? "Вы" : msg.sender_role === "tutor" ? "Преподаватель" : "Ученик"}
          </p>
          <p>{msg.text}</p>
          <p className="text-xs opacity-70 mt-1">{time}</p>
        </div>

      </div>
    );
  };

  const visabilityEmojiBlock = () => {
    (isEmojiOpened) ? setIsEmojiOpened(false) : setIsEmojiOpened(true);
  }

  return (
    <div className="chat p-4 mx-auto border-2" style={{borderRadius: "30px", height: "100%"}}>
      {/* 
      <div className="choosedFiles">
          <Button
            type="button"
            onClick={() => {
              if(!isAllFilesBlockOpened) {
                setIsAllFilesBlockOpened(true);
                setIsMainChatBlockOpened(false);
              } else {
                setIsAllFilesBlockOpened(false);
                setIsMainChatBlockOpened(true);
              }
               
            }}
          >
            {(isAllFilesBlockOpened) ? t.filesBtnBack : t.filesBtn}
          </Button>
        </div>
      */}
 
        
      
{isMainChatBlockOpened && (
   <>
   <div
      ref={containerRef} 
      className="messages overflow-y-auto px-3 py-2"
      style={{ flex: 1, minHeight: 0 }}
    >
     {messages.map(renderMessage)}
     <div ref={endRef} />
   </div>

 
   <div className="grid grid-cols-12 gap-2 px-3 py-2">
     
     {/*
     <input
       ref={filePickerRef}
       type="file"
       className="hidden"
       multiple
       onChange={onPickFiles}
       accept=".png,.jpg,.jpeg,.webp,.pdf,.docx"
     />
     */}

     <div className="col-span-7" style={{marginLeft: "15%"}}>
       <TextField
         fullWidth
         value={text}
         onChange={(e) => setText(e.target.value)}
         label={t.inputPlaceholder}
         variant="outlined"
         size="small"
       />
     </div>

  <div className="col-span-4" style={{marginLeft: "15%"}}>
     
     {/*
     <Button type="button" className="h-full" onClick={clickFile}>
       <img src={AddFile} className="file hover:cursor-pointer" title="Add File" />
     </Button>
     */}
     <Button type="button" className="h-full" onClick={visabilityEmojiBlock}>
       <img className="emoji hover:cursor-pointer" src={AddEmoji} title="Add Emoji" />
     </Button> 

     <Button type="button" className="h-full" onClick={sendMessage}>
       <img className="send hover:cursor-pointer" src={SendIcon} title={t.sendBtn} />
     </Button>
  </div>
     
   </div>
   </>
     
)}
      

      {/* Блок со списком выбранных файлов */}
      { /* {isAllFilesBlockOpened && (
        <div className="p-2 border-t files">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t.allFilesTitle}</h2>
            
          </div>

          {selectedFiles.length === 0 ? (
            <p className="px-1 py-2 opacity-70">—</p>
          ) : (
            selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-4 p-2">
                <p className="m-0">{idx + 1}. <b>{file.name}</b></p>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => deleteFile(idx)}
                  style={{marginLeft: "20px"}}
                >
                  {(language == "german") ? "Löschen" : "Удалить"}
                </Button>
              </div>
            ))
          )}
        </div>
      )} */ }
      

      {/* Эмодзи-палитра */}
      <EmojiBlock isEmojiOpened={isEmojiOpened} setCurentEmoji={setCurentEmoji} setNewQuestion={setText} />
    </div>
  );
};

export default React.memo(Chat);
