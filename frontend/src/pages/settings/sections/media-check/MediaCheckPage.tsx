import { useEffect, useRef, useState } from 'react';
import { Layout } from '@widgets/layout/ui/Layout';
import { useTranslation } from 'react-i18next';

export default function MediaCheckPage() {
  const { t } = useTranslation('settings');

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream]           = useState<MediaStream | null>(null);
  const [recorder, setRecorder]       = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob]     = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch {
        setError(t('media.error'));
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
    rec.onstop = () => setAudioBlob(new Blob(chunks, { type: 'audio/webm' }));
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">
          {t('media.title')}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm
            rounded-3xl px-5 py-4 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Video */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              📷 {t('media.video')}
            </h2>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-2xl bg-slate-900 aspect-video object-cover"
            />
          </div>

          {/* Audio */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              🎤 {t('media.audio')}
            </h2>

            <div className="flex flex-col items-center justify-center gap-4 min-h-32">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700
                    text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  {t('media.stopRecording')}
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={!stream}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50
                    text-white text-sm font-medium px-5 py-2.5 rounded-xl transition
                    shadow-lg shadow-orange-200"
                >
                  🎙 {t('media.startRecording')}
                </button>
              )}

              {audioBlob && (
                <div className="w-full">
                  <p className="text-xs text-slate-400 mb-2 text-center">
                    {t('media.playback')}
                  </p>
                  <audio controls className="w-full">
                    <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                  </audio>
                </div>
              )}
            </div>
          </div>

        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          {t('media.hint')}
        </p>
      </div>
    </Layout>
  );
}