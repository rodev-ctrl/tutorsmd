/*
"use client";

import { Button } from "@mui/material";
import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";

import "./LessonsLive.css";
import ShareButton from "./components/ShareButton/ShareButton";
import EndCall from "./components/EndCall/EndCall";
import Desk from "./components/Desk/Desk";
import Chat from "./components/Chat/Chat";

import canvasState from "@/app/store/canvasState";
import DeskService from "../../../../app/services/DeskService";
import UserService from "../../../../app/services/UserService";
import { CanvasProvider } from "./components/context/CanvasContext.tsx";
import VideochatService from "../../../services/VideochatService.ts";
const CancelledMicrophone = require("./img/cancelledmicrophone.png");


type Review = {
  name: string;
  grade: number;
  comment: string
}
type Message = {
  question: string;
  files: Array<File | { name: string; type: string; data: number[] }>;
  language: string;
};

type Client = {
  id: number,
  name: string,
  surname: string,
  email: string,
  isActivated: boolean
}

type Tutor = {
  id: number,
  name: string,
  namegerman: string,
  surname: string,
  surnamegerman: string,
  email: string,
  grade: number,
  availableSubjects: { [key: string]: string[] },
  highlight: string,
  highlightgerman: string,
  fulldescribe: string,
  fulldescribegerman: string,
  messages: Message[],
  reviews: Array<Review>,
  isActivated: boolean
}

type Props = {
  randomLessonId: string;
  setRandomLessonId: Function;
  booking: Booking | null;
  setBooking: (booking: Booking) => void;
  language: string;
  participants: Participant[];
  setParticipants: Function;
  userToken: string;
  localStream: MediaStream | null;
  setLocalStream: (localStream: MediaStream | null) => void;
  clientUse:Client,
  tutorUse:Tutor
};

type Booking = {
    id: number;
    usertoken: string;
    tutoremail: string;
    datetime: string;
    lessonid: string;
  }

  type Participant = {
    userToken: string;
    stream: MediaStream | null;
  };

  type UserVideochat = {
    usertoken: string
  }



const LessonsLive: FunctionComponent<Props> = ({ randomLessonId, setRandomLessonId, booking, setBooking, language, participants, setParticipants, userToken, localStream, setLocalStream, clientUse, tutorUse }) => {
  
  

      const location = useLocation();
      const [prevUrl, setPrevUrl] = useState<string>("");
      const socketRef = useRef<Socket | null>(null);

      const navigate = useNavigate();

      const [activeCanvasIndex, setActiveCanvasIndex] = useState<number>(0);
      const [elapsedTime, setElapsedTime] = useState<number>(0);




      useEffect(() => {
        async function getBooking() {
          try {
              if(clientUse && clientUse.email.length > 0){
                const bookingResponse = await UserService.getBooking(clientUse.id, userToken, "", randomLessonId);
                if(bookingResponse) {

                  const bookingData = bookingResponse?.data.booking;
                  if (bookingData) {
                    setBooking(bookingData);
                  } 
                }
              }
              
          } catch (error) {
            console.error("Error fetching bookings:", error);
          }
        }
      
        getBooking();
      }, [userToken]);


    


  useEffect(() => {
    const loadUsers = async () => {
      if (!booking) return;
    
      const response = await VideochatService.getVideochatUsers(booking.lessonid);

      if (response) {
        const users = Array.isArray(response.data.data) ? response.data.data : [];

        if (!Array.isArray(users)) {
          console.error("Expected an array but got:", users);
          return;
        }
    
        const alreadyExists = users.some((user: UserVideochat) => user.usertoken === userToken);

        if (!alreadyExists) {
          await VideochatService.setVideochatUsers(userToken, booking);
          setParticipants(users);
        }
      }
    };
    
  
    loadUsers();
  
    return () => {}
  }, [booking]);

  useEffect(() => {
    console.log(participants);
  }, [participants]);



      useEffect(() => {
        setPrevUrl(location.pathname);
      }, [location.pathname]);


  const servers = {
    iceServers: [
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stun.services.mozilla.com" },
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:TURN_SERVER_ADDRESS:3478",
        username: "TURN_SERVER_USERNAME",
        credential: "TURN_SERVER_PASSWORD",
      },
    ],
  };

  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [screenSharingId, setScreenSharingId] = useState<string>("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
const [isAudioEnabled, setIsAudioEnabled] = useState(true);
const [currentLessonId, setCurrentLessonId] = useState<string | undefined>("");
const [gridVideo, setGridVideo] = useState<number>(0);
const [gridInstruments, setGridInstruments] = useState<number>(0);

const [isTutor, setIsTutor] = useState<boolean>(false);

  const user1 = useRef<HTMLVideoElement | null>(null);
  const user2 = useRef<HTMLVideoElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);


  

  

  const shareScreen = async() => {
    try {
      let stream: MediaStream;

      if(screenSharingId) {
        stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true}); 
        setScreenSharingId(""); // Сбрасываем ID экрана
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true }); 
        setScreenSharingId(userToken); // Сбрасываем ID экрана
      }
  
      switchStream(stream);
  
      // Уведомляем всех участников о новом потоке
      socketRef.current?.emit("shareScreen", randomLessonId, userToken, stream.id);
      
    } catch(e) {
      console.log(e);
    }

  }

  const switchStream = (stream: MediaStream) => {
    // Обновляем локальный поток
    setLocalStream(stream);
  
    // Отправляем обновленный поток всем участникам через WebRTC
    stream.getTracks().forEach((track) => {
      const sender = peerRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === track.kind);
      if (sender) {
        sender.replaceTrack(track);
      }
    });
  };

  const leaveMeeting = () => {
    if (peerRef.current) {
      peerRef.current.close(); // Закрываем соединение
      peerRef.current = null;  // Очищаем ссылку
    }
  };

  const stopMediaStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop()); // Останавливаем камеру и микрофон
      setLocalStream(null);
    }
  };

  const notifyServer = () => {
    if (socketRef.current && randomLessonId && userToken) {
      socketRef.current.emit("leaveLesson", randomLessonId, userToken); // Уведомляем сервер
    }
  };


  const getWeekRange = (): string => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1); // Понедельник
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Воскресенье
  
    const format = (date: Date) => {
      return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
    };
  
    return `${format(start)}-${format(end)}`;
  };

  const endCall = async () => {
    const week_range = getWeekRange();
    const total_hours = Number(progressTime(elapsedTime)); 
 
    await UserService.saveProgress(week_range, total_hours, clientUse.email);
    notifyServer();    // Уведомляем сервер
    leaveMeeting();    // Закрываем WebRTC
    stopMediaStream(); // Останавливаем видео/аудио
    navigate("/dashboard", {replace: true}); // Перенаправляем пользователя
  }


  const endMeetingForAll = () => {
    if (socketRef.current && randomLessonId) {
      socketRef.current.emit("endLesson", randomLessonId); // Сообщаем серверу
    }
  };

  useEffect(() => {
    socketRef.current?.on("meetingEnded", () => {
      navigate("/dashboard", {replace: true}); // Перенаправляем всех на главную
    });
  
    return () => {
      socketRef.current?.off("meetingEnded");
    };
  }, []);
  


  // Инициализация камеры/микрофона
  const init = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const isDeviceInUse = devices.some((device) => device.kind === "videoinput" && device.deviceId);

      if (!isDeviceInUse) {
      const stream = await navigator.mediaDevices
       .getUserMedia({
        video: true,
        audio: true,
      });
      console.log("Получен локальный поток:", stream);

      localStreamRef.current = stream;
      setLocalStream(stream);

      if (user1.current) {
        user1.current.srcObject = stream;
      }
    } else {
        console.warn("Камера/микрофон уже используется. Попробуйте использовать другое устройство."); 
     }
    } catch (error) {
      console.log("Ошибка при доступе к камере или микрофону:", error);
    }
  };

  // Создание предложения
  const createOffer = async () => {
    if (!peerRef.current || !localStreamRef.current) {
      console.error("PeerConnection или localStream отсутствует");
      return;
    }
  
    const rem = new MediaStream();
    setRemoteStream(rem);
  
    if (user2.current) {
      user2.current.srcObject = rem;
    }
  
    peerRef.current.ontrack = (event) => {
      console.log("Получен удалённый поток:", event.streams[0]);
      event.streams[0].getTracks().forEach((track) => {
        rem.addTrack(track);
      });
    };
  
    localStreamRef.current.getTracks().forEach((track) => {
      peerRef.current?.addTrack(track, localStreamRef.current!);
    });
  
    try {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      console.log("Создано предложение SDP:", offer);
    } catch (error) {
      console.error("Ошибка при создании предложения SDP:", error);
    }
  };
  

  useEffect(() => {
    const setupPeerConnection = async () => {
      if (!peerRef.current) {
        peerRef.current = new RTCPeerConnection(servers);
      }

      await init(); // Сначала инициализируем локальный поток
      if (localStreamRef.current) {
        await createOffer(); // Вызываем createOffer только после инициализации
      }
    };

    setupPeerConnection();

    return () => {
      // Очищаем соединение при размонтировании
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
    };
  }, []);

useEffect(() => {
  const setupSocket = async () => {
    // Устанавливаем соединение с WebSocket-сервером

    const backendURL = process.env.REACT_APP_BACKEND_URL || "/api/";


    socketRef.current = io(backendURL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Ошибка WebSocket:", err);
    });

    // Обрабатываем событие обновления участников
    socketRef.current.on("updateParticipants", (participantList: string[]) => {
      console.log("Обновление участников:", participantList);

      // Создаём список участников, обновляя только `stream` для новых
      setParticipants((prev: Participant[]) =>
        participantList.map((token) => ({
          userToken: token,
          stream: prev.find((p) => p.userToken === token)?.stream || null,
        }))
      );
    });


    try {
// Получаем медиапоток текущего пользователя
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});

setLocalStream(stream);
    } catch (e) {
        console.log(e);
    }
    

    // Обрабатываем потоки от сервера (если используется WebSocket для пересылки потоков)
    socketRef.current.on("receiveStream", (userId: string, stream: MediaStream) => {
      setParticipants((prev: Participant[]) =>
        prev.map((participant) =>
          participant.userToken === userId
            ? { ...participant, stream }
            : participant
        )
      );
    });
  };

  setupSocket();

  return () => {
    // Закрываем соединение при размонтировании
    socketRef.current?.disconnect();
  };
  
}, [randomLessonId, userToken]);

useEffect(() => {
  console.log(userToken);
  console.log(booking);
  console.log("Участники:", participants);
}, [participants]);


const toggleVideo = () => {
  if (localStream) {
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsVideoEnabled((prev) => !prev);
    
    // Обновляем поток у всех пользователей
    updateStream();
  }
};

const toggleAudio = () => {
  if (localStream) {
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsAudioEnabled((prev) => !prev);

    // Обновляем поток у всех пользователей
    updateStream();
  }
};

// Функция обновления потока для других участников
const updateStream = () => {
  if (socketRef.current && localStream) {
    socketRef.current.emit("updateStream", randomLessonId, userToken, localStream);
  }
};

useEffect(() => {
  if(socketRef.current) {
    console.log(randomLessonId);
    console.log(userToken);
    if(!randomLessonId) {
      setCurrentLessonId(window.location.href.match(/lessons\/(.+)/)?.[1]);

    } 
    let email;

      if(clientUse.email.length > 0) {
        email = clientUse.email;
      } else if(tutorUse.email.length > 0) {
        email = tutorUse.email;
      }

      const roleFromLocalStorage = localStorage.getItem("role");
    if (randomLessonId && userToken && email) {
      // Присоединяем текущего пользователя к комнате
      socketRef.current.emit("joinLesson", {randomLessonId, userToken, email, role: roleFromLocalStorage});
    }

    if (currentLessonId && !randomLessonId && userToken && email) {
      // Присоединяем текущего пользователя к комнате
      socketRef.current.emit("joinLesson", {currentLessonId, userToken, email, role: roleFromLocalStorage});
    }

    socketRef.current.on("tutorJoined", (tutor:boolean) => {
      console.log("joined?");
      if(tutor) {
        setIsTutor(true);
      }
    });
  }
}, [])

const mouseDownHandler = async () => {
  if(canvasRef.current) {
    const response = await DeskService.deskSave(randomLessonId, canvasRef);
  }

}

  useEffect(() => {
let count = participants.length;
   setGridVideo(count);
   console.log(participants);
  }, [participants, userToken]);


  useEffect(() => {
    setGridInstruments(isTutor ? 5 : 4);
  }, [isTutor]);

  useEffect(() => {
    if (!booking?.datetime) return; // Проверка на существование данных
  
    const lessonStartTime = new Date(booking.datetime).getTime();
    
    if (Date.now() < lessonStartTime) {
      setElapsedTime(0); // Урок ещё не начался
      return;
    }
  
    const updateElapsedTime = () => {
      const now = Date.now();
      const elapsed = now - lessonStartTime;
      setElapsedTime(elapsed);
    };
  
    updateElapsedTime(); // Вызываем сразу, чтобы обновить состояние
  
    const interval = setInterval(updateElapsedTime, 1000); // Обновляем каждую секунду
  
    return () => clearInterval(interval); // Очищаем таймер при размонтировании
  }, [booking?.datetime]);

// Функция форматирования миллисекунд в ЧЧ:ММ:СС
const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 1000 / 60) % 60;
  const hours = Math.floor(ms / 1000 / 60 / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const progressTime = (ms: number) => {
  return (ms / 1000 / 60 / 60).toFixed(1);
}

  return (
  <div>
        <div className="time"> Прошло времени: {formatTime(elapsedTime)}</div>


        <div className="sideShortBlock">
           <div className="icon_chat"></div>
           {participants.map((participant:Participant) => <div className="icon_participant"></div>)}
        </div>
        <Chat 
           currentUser={(clientUse && clientUse.email.length > 0) ? clientUse : tutorUse} 
           role={(clientUse && clientUse.email.length > 0) ? "client" : "tutor"}
           lessonid={randomLessonId} />


        <div className={`videos grid grid-cols-${gridVideo} gap-2`}>
       {localStream && (
        <div style={{margin: "3% 3% 0% 3%"}}>
        <video
          className="video-player bg-black"
          style={{ objectFit: "cover" }}
          id="user-1"
          ref={(video) => {
            if (video) video.srcObject = localStream;
          }}
          autoPlay
          playsInline
          muted
        />
        </div>
      )}

     
      {participants
        .filter((participant) => participant.userToken !== userToken) // Не отображаем текущего пользователя дважды
        .map((participant, index) => (
          <video
            key={participant.userToken}
            className="video-player bg-black rounded-xl m-10"
            id={`user-${index + 2}`} // Динамически задаём ID
            ref={(video) => {
              if (video && participant.stream) {
                video.srcObject = participant.stream;
              }
            }}
            autoPlay
            playsInline
          />
        ))}
      </div>

      <div className={`instruments grid grid-cols-${gridInstruments} h-24 px-auto w-full bg-zinc-500`}>
           <ShareButton shareScreen={shareScreen} />
           <EndCall endCall={endCall} />
           <Button onClick={toggleVideo}>
  {isVideoEnabled ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
</svg>
 : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
 <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 0 0-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" />
</svg>

}
</Button>

<Button onClick={toggleAudio}>
  {isAudioEnabled ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
</svg> : <img src={CancelledMicrophone} title="Microfone" />}
</Button>

{(isTutor) ? 
    <Button onClick={toggleAudio}>
       Завершить урок
    </Button> 
           :
           null
}
        </div>


      <ul>
        {participants.map((participant) => (
          <li key={participant.userToken}>{participant.userToken}</li>
        ))}
      </ul>


<div>
 <CanvasProvider pageId={activeCanvasIndex}>
 <Desk 
      randomLessonId={randomLessonId} 
      canvasRef={canvasRef} 
      language={language}
      activeCanvasIndex={activeCanvasIndex}
      setActiveCanvasIndex={setActiveCanvasIndex}
      
    />
 </CanvasProvider>


</div>

    
  </div>
  );
};

export default React.memo(LessonsLive);
*/




// LessonLive.tsx
"use client";

import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Button } from "@mui/material";

import "./LessonsLive.css";

// ===== твои сервисы/компоненты (оставил как были) =====
import Chat from "./components/Chat/Chat";
import ShareButton from "./components/ShareButton/ShareButton";
import EndCall from "./components/EndCall/EndCall";
import Desk from "./components/Desk/Desk";
import { CanvasProvider } from "../../../context/CanvasContext.tsx";
import UserService from "../../../../app/services/UserService";
import canvasState from "../../../store/canvasState";
// import DeskService from "../../../../app/services/DeskService";
// ======================================================
import { WeeklyPlan, Booking, Participant, Client, Tutor } from "../../../interfaces/index";
import { useLanguage } from "../../../context/LanguageContext.tsx";
import { selectToken, selectUser } from "../../../store/selectors.ts";
import { useSelector } from "react-redux";

type Props = {
  booking: Booking | null;
  setBooking: (booking: Booking) => void;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  localStream: MediaStream | null;
  setLocalStream: (s: MediaStream | null) => void;
  bookingCompleted: boolean;
  setBookingCompleted: (bookingCompleted: boolean) => void;
  lessons: WeeklyPlan[]
};

const LessonsLive: FunctionComponent<Props> = ({
  booking,
  setBooking,
  participants,
  setParticipants,
  localStream,
  setLocalStream,
  bookingCompleted, 
  setBookingCompleted,
  lessons
}) => {

  useEffect(() => {
   console.log(booking);
   console.log(participants);
   console.log(localStream);
   console.log(lessons);
  }, [])


const { language } = useLanguage();
const user = useSelector(selectUser);
const email = user.email;
const userToken = useSelector(selectToken);


/*
  // простой debounce (без сторонних либ)
function debounce<T extends (...args: any[]) => void>(fn: T, delay = 600) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
  */

  const navigate = useNavigate();
  const location = useLocation();

  

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
  if (!socketRef.current) {
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  }, []);

  const [isTutor, setIsTutor] = useState(false);
  const [gridVideo, setGridVideo] = useState(0);
  const [gridInstruments, setGridInstruments] = useState(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const [activeCanvasIndex, setActiveCanvasIndex] = useState<number>(0);
 

  // ===== helpers =====
  const getRoomFromUrl = (): string => {
    // /dashboard/lessons/:id
    const m = location.pathname.match(/lessons\/([^/]+)/);
    return m?.[1] || "";
  };

  const lessonid = getRoomFromUrl();

  // ====== загрузить бронь (как у тебя было) ======
  useEffect(() => {
    const run = async () => {
      try {
        if (!email || !userToken || !lessonid) return;

        const bookingResponse = await UserService.getBooking(user?.id, role, "", lessonid);
        console.log(bookingResponse);
        
        if(bookingResponse && bookingResponse.data) {
          if(bookingResponse.data && bookingResponse.data.status == "process") {
            setBooking(bookingResponse.data.booking)
          }
          if(bookingResponse.data.status == "completed") {
            setBookingCompleted(true);
            navigate("/dashboard", {replace: true});
          } else {
            console.log("else");
            navigate("/dashboard", {replace: true});
          }
        } 
        
      } catch (e) {
        console.error("Error fetching booking:", e);
      }
    };
    run();
    
  }, [userToken, lessonid, email]);

  // ====== Socket.IO: подключение и joinLesson ======
  useEffect(() => {
    const socket = socketRef.current!;
  
    if (!lessonid || !userToken || !email || !role) return;
  
    
    socket.on("connect", () => {
      //const lesson = lessons && lessons.length > 0 ? lessons[0] : null;
      socket.emit("joinLesson", { lessonid });
      socket.emit("joinBoard", { lessonid });  
    });

    // список участников
    socket.on("updateParticipants", (participantList: string[]) => {
      setParticipants((prev:Participant[]) =>
        participantList.map((token) => ({
          userToken: token,
          stream: prev.find((p) => p.userToken === token)?.stream || null,
        }))
      );
    });

    // пришёл препод
    socket.on("tutorJoined", (flag: boolean) => {
      if (flag) setIsTutor(true);
    });

    // завершили урок для всех
    socket.on("meetingEnded", () => {
      navigate("/dashboard", { replace: true });
    });

    // (опционально) сигналы для экранов/стримов — тут только сигналы, не сами MediaStream
    socket.on("shareScreen", (userId: string, streamId: string) => {
      console.log("shareScreen from", userId, "streamId:", streamId);
    });
    socket.on("receiveStream", (userId: string, streamId: string) => {
      console.log("receiveStream from", userId, "streamId:", streamId);
    });

    // cleanup
    return () => {
      // уведомим сервер, что выходим (если нужно)
      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit("leaveLesson", lessonid, userToken);
      }
      socket?.removeAllListeners();
      socket?.disconnect();
      // socketRef.current = null;
    };
   
  }, [userToken, lessonid, email]);

  useEffect(() => {
    const socket = socketRef.current;
  
    if (!socket || !email || !lessonid) return;
  

    canvasState.initSocket(socket, lessonid, email);

  }, [socketRef.current, lessonid, email]);
  
  

  // ====== локальный медиапоток (камера/микрофон) ======
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (e) {
        console.error("getUserMedia error:", e);
      }
    };
    if (!localStream) initMedia();

    return () => {
      // по желанию можно останавливать треки при уходе со страницы
      // localStream?.getTracks().forEach((t) => t.stop());
    };

  }, []);

  // ====== кнопки управления звуком/видео ======
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const toggleVideo = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsVideoEnabled((p) => !p);
    // это только сигнал; реальный апдейт трека делай через RTCPeerConnection
    socketRef.current?.emit("updateStream", lessonid, userToken, localStream.id);
  };

  const toggleAudio = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsAudioEnabled((p) => !p);
    socketRef.current?.emit("updateStream", lessonid, userToken, localStream.id);
  };

  const shareScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      // показываем у себя
      setLocalStream(stream);
      // сигнал для остальных
      socketRef.current?.emit("shareScreen", lessonid, userToken, stream.id);
    } catch (e) {
      console.error(e);
    }
  };

  // ====== завешение урока (для всех) / для себя ======
  const endMeetingForAll = () => {
    if (!lessonid) return; 
    
    socketRef.current?.emit("endLesson", lessonid);
  };

  const leaveForMe = () => {
    if (!lessonid) return; 
    
    socketRef.current?.emit("leaveLesson", lessonid, userToken);
    navigate("/dashboard", { replace: true });
  };

  // ====== таймер прошедшего времени (оставил как было) ======
  useEffect(() => {
    const dt = booking?.datetime;
    if (!dt) return;
    const start = new Date(dt).getTime();

    const tick = () => setElapsedTime(Math.max(0, Date.now() - start));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking?.datetime]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 1000 / 60) % 60;
    const h = Math.floor(ms / 1000 / 60 / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ====== сетки ======
  useEffect(() => setGridVideo(participants.length || 1), [participants.length]);
  useEffect(() => setGridInstruments(isTutor ? 5 : 4), [isTutor]);

/*
  const room = randomLessonId || getRoomFromUrl();

  const doSave = useCallback(async () => {
    if (!room || !canvasRef.current) return;
    // >>> 3) прокидываем номер страницы в сервис
    // Обнови DeskService.deskSave(room, canvasRef, pageIndex)
    await DeskService.deskSave(room, canvasRef);
  }, [room, activeCanvasIndex]);

  // дебаунсим сохранения (чтобы не молотило по каждому движению)
  const debouncedSave = useCallback(debounce(doSave, 700), [doSave]);

  // сохраняем при смене страницы (после небольшой паузы)
  useEffect(() => {
    debouncedSave();
  }, [activeCanvasIndex, debouncedSave]);

  // ...остальной код (таймер, видео, кнопки и т.п.)

  // ====== переключение видов оставляем как у тебя ======

  // >>> 4) коллбек, который отдаём в Desk — он и локально страницу поменяет, и всем отправит
  const handleCanvasIndexChange = useCallback((nextIndex: number) => {
    setActiveCanvasIndex(nextIndex);
    socketRef.current?.emit("desk:pageChanged", room, nextIndex);
  }, [room]);
  
  // ====== сохранение доски (оставил твой вызов) ======
  const saveDesk = async () => {
    const room = randomLessonId || getRoomFromUrl();
    if (!room) return;
    if (canvasRef.current) {
      await DeskService.deskSave(room, canvasRef);
    }
  };

  */

  useEffect(() => {
       console.log(participants);
  }, [participants])

 // ====== state (одно состояние вместо 4 булей) ======
type ViewKey = "chat" | "my" | "other" | "all";

const [activeView, setActiveView] = useState<ViewKey>("my");  // стартовый экран
const [statusIcon, setStatusIcon] = useState<string>("I");    // если нужно для UI

// Видимости вычисляем из activeView (а не храним отдельным стейтом)
const chatVisability        = activeView === "chat";
const myVideoVisability     = activeView === "my";
const anotherVideoVisability= activeView === "other";
const allVideosVisability   = activeView === "all";

// (опционально) если где-то нужен статус-значок
useEffect(() => {
  switch (activeView) {
    case "chat":  setStatusIcon("C"); break;
    case "my":    setStatusIcon("I"); break;
    case "other": setStatusIcon("P"); break;  // Peer
    case "all":   setStatusIcon("A"); break;
  }
}, [activeView]);

// ====== клики по иконкам — только стабильные ключи, НЕ локализованные строки ======
const ChangeBlockIcons = (key: ViewKey) => setActiveView(key);

// ====== подписи для иконок, зависят от роли и языка ======
type Role = "client" | "tutor" | "admin" | "gast";
type Lang = "german" | "russian";

const getIconLabels = (role: Role, lang: Lang) => {
  const me = lang === "german" ? "Ich" : "Я";
  // “другая сторона” — для клиента это “Учитель/Lehrer”, для тьютора — “Ученик/Schüler”
  const other =
    lang === "german"
      ? role === "client" ? "Lehrer" : "Schüler"
      : role === "client" ? "Учитель" : "Ученик";
  return { me, other };
};
const role = (localStorage.getItem("role") as Role) || "gast";

const { me: meLabel, other: otherLabel } = getIconLabels(role, (language as Lang) || "russian");

const colsClass = (n: number) => {
  const map: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  };
  return map[Math.min(Math.max(n, 1), 5)];
};

const videoCols = colsClass(gridVideo);
const instrCols = colsClass(gridInstruments);


return (
  <div style={{
    backgroundColor: "white",
    backgroundImage: "radial-gradient(circle, rgba(243, 134, 17, 0.1) 3px, transparent 1px)",
    backgroundSize: "20px 20px" 
  }}>
    <div className="time p-2 m-2" style={{backgroundColor: "orange", borderRadius: "30px", width: "85px"}}>
      <span className="mx-auto text-xl">{formatTime(elapsedTime)}</span>
    </div>

    {/* фиксированная двухколоночная сетка: слева сайдбар, справа контент */}
    <div className="lesson-layout">
      {/* Sidebar */}
      <aside className="sidebar sideShortBlock">
        <div className="icon_chat" onClick={() => ChangeBlockIcons("chat")}>
          <span className="m-2 text-xl">Chat</span>
        </div>

        {participants.map((p) => (
          <div
            className="icon_participant"
            key={p.userToken}
            onClick={() => ChangeBlockIcons(userToken === p.userToken ? "my" : "other")}
          >
            <span className="m-2 text-xl">
              {userToken === p.userToken ? meLabel : otherLabel}
            </span>
          </div>
        ))}

        <div className="icon_all_participants" onClick={() => ChangeBlockIcons("all")}>
          <span className="m-2 text-xl">All</span>
        </div>
      </aside>

      {/* Content */}
      <div className="content" style={{margin: "30px"}}>
        {chatVisability ? (
          <Chat lessonid={lessonid} socket={socketRef.current} />
        ) : (
          <>
            {allVideosVisability && (
              <div
                className="videos"
                style={{
                  display: "grid",
                  gap: "0.5rem",
                  gridTemplateColumns: `repeat(${Math.max(1, Math.min(5, gridVideo || 1))}, minmax(0, 1fr))`,
                }}
              >
                {participants.map((p) => (
                  <div key={p.userToken}>
                    <video
                      className="video-player"
                      autoPlay
                      playsInline
                      muted
                    />
                  </div>
                ))}
              </div>
            )}

            {myVideoVisability && (
              <div className="myVideo mx-auto">
                <video
                  className="video-player"
                  autoPlay
                  playsInline
                  muted
                  ref={(video) => { if (video) video.srcObject = localStream; }}
                />
              </div>
            )}

            {(allVideosVisability || myVideoVisability) && (
              <div
                className="instruments"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${isTutor ? 5 : 4}, minmax(0,1fr))`,
                }}
              >
                <ShareButton shareScreen={shareScreen} />
                <EndCall endCall={leaveForMe} />
                <Button onClick={toggleVideo}>
                  {isVideoEnabled ? "Видео выкл" : "Видео вкл"}
                </Button>
                <Button onClick={toggleAudio}>
                  {isAudioEnabled ? "Микрофон выкл" : "Микрофон вкл"}
                </Button>
                {isTutor && (
                  <Button color="error" variant="contained" onClick={endMeetingForAll}>
                    Завершить урок для всех
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>

    

    <div /*onMouseDown={saveDesk}*/>
      <CanvasProvider pageId={0}>
        <Desk
          randomLessonId={lessonid}
          canvasRef={canvasRef}
          socket={socketRef.current}
          activeCanvasIndex={activeCanvasIndex}
          setActiveCanvasIndex={setActiveCanvasIndex}
        />
      </CanvasProvider>
    </div>
  </div>
);

};

export default React.memo(LessonsLive);



