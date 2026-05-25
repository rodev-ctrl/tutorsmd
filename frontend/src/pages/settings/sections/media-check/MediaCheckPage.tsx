import { useEffect, useRef, useState } from 'react';
import { Layout } from '@widgets/layout/ui/Layout';

export default function MediaCheckPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream]             = useState<MediaStream | null>(null);
  const [recorder, setRecorder]         = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob]       = useState<Blob | null>(null);
  const [isRecording, setIsRecording]   = useState(false);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch {
        setError('Kein Zugriff auf Kamera/Mikrofon. Bitte Berechtigungen prüfen.');
      }
    };
    init();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = () => {
    if (!stream) return;
    setAudioBlob(null);
    const chunks: BlobPart[] = [];
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    rec.onstop = () => setAudioBlob(new Blob(chunks, { type: 'audio/wav' }));
    rec.start();
    setRecorder(rec);
    setIsRecording(true);
  };

  const stopRecording = () => {
    recorder?.stop();
    setIsRecording(false);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Kamera & Mikrofon testen
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm
            rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Video */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">📷 Video</h2>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-xl bg-gray-900 aspect-video object-cover"
            />
          </div>

          {/* Audio */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">🎤 Audio</h2>

            <div className="flex flex-col items-center justify-center gap-4 min-h-32">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700
                    text-white text-sm font-medium px-5 py-2 rounded-lg transition"
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Aufnahme stoppen
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={!stream}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                    text-white text-sm font-medium px-5 py-2 rounded-lg transition"
                >
                  🎙 Aufnahme starten
                </button>
              )}

              {audioBlob && (
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-2 text-center">
                    Wiedergabe:
                  </p>
                  <audio controls className="w-full">
                    <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                  </audio>
                </div>
              )}
            </div>
          </div>

        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          Wenn Sie Kamera oder Mikrofon nicht sehen, prüfen Sie die Browser-Berechtigungen.
        </p>
      </div>
    </Layout>
  );
}