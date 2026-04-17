import Language from "../../../templates/Language/Language";
import { Button } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

const MediaCheckPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState<string>("russian");



  const [grid, setGrid] = useState<number>(0);

  // ✅ Получаем доступ к камере и микрофону
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Ошибка доступа к камере/микрофону:", error);
      }
    };

    getMedia();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // ✅ Функция для начала записи аудио
  const startRecording = () => {
    if (!mediaStream) return;

     // Если уже идет запись, останавливаем ее
     if (mediaRecorder) {
        mediaRecorder.stop();
      }

      
    // Очищаем старую запись перед началом новой
    setAudioBlob(null);

    const recorder = new MediaRecorder(mediaStream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(chunks, { type: "audio/wav" });
      setAudioBlob(audioBlob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  // ✅ Функция для остановки записи аудио
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };


  useEffect(() => {
      if(window.innerWidth < 600) {
        setGrid(1)
      } else {
        setGrid(2)
      }
  }, [window.innerWidth])


  class TranslateClass {
    static headers() {
        if(language == "german") return ["Audio", "Video"]
        if(language == "russian") return ["Аудио", "Видео"]
    }

    static aufnahme() {
        if(language == "german") return ["Aufnahme zu anfangen", "Aufnahme zu stoppen"]
        if(language == "russian") return ["Начать запись", "Остановить запись"]
    }
  }
  
  const headers = TranslateClass.headers();
  const aufnahme = TranslateClass.aufnahme();

  return (
    <div style={{
      backgroundColor: "white",
      backgroundImage: "radial-gradient(circle, rgba(243, 134, 17, 0.1) 3px, transparent 1px)",
      backgroundSize: "20px 20px" 
    }}>
      <div className="flex justify-center">
      <Language />
      </div>
        
<div className={`media-check grid grid-cols-${grid}`} style={{margin: "1%", marginTop: "150px"}}>
        <div className="p-2">
        <h1 className="font-bold text-3xl text-center" style={{marginBottom: "20px"}}>{headers ? headers[1] : ''}</h1>

{/* 📷 Видео из веб-камеры */}
<video ref={videoRef} autoPlay playsInline className="video-preview w-full" />

        </div>
     
     
      {/* 🎤 Кнопки для записи аудио */}
      <div className="audio-controls text-center text-2xl mx-auto p-2">
      <h1 className="font-bold text-3xl text-center" style={{marginBottom: "20px"}}>{headers ? headers[0] : ''}</h1>
        {isRecording ? (
          <button className="p-10" onClick={stopRecording}>⏹ {aufnahme ? aufnahme[1] : ''}</button>
        ) : (
          <button className="p-10" onClick={startRecording}>🎤 {aufnahme ? aufnahme[0] : ''}</button>
        )}

        {/* ▶ Кнопка для прослушивания записанного аудио */}
      {audioBlob && (
        <div className="audio-preview mt-10 px-auto text-center">
          <audio controls className="mx-auto">
            <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
            Ваш браузер не поддерживает воспроизведение аудио.
          </audio>
        </div>
      )}
      </div>

      
    </div>

    </div>
    
  );
};

export default React.memo(MediaCheckPage);
