import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUserId, selectActiveRole } from '@entities/user/model/selectors';
import { useTranslation } from 'react-i18next';
import { useLessonSocket } from '@shared/providers/LessonSocketProvider';
import { Socket } from 'socket.io-client';

interface Props {
  lessonId:        string;
  localStream:     MediaStream | null;
  setLocalStream:  (s: MediaStream | null) => void;
  remoteStreams:   Map<string, MediaStream>;
  setRemoteStreams: React.Dispatch<React.SetStateAction<Map<string, MediaStream>>>;
  canJoin:         boolean;
}

export const VideoRoom = ({
  lessonId, localStream, setLocalStream,
  remoteStreams, setRemoteStreams, canJoin,
}: Props) => {
  const { t } = useTranslation('lesson');
  const userId     = useSelector(selectUserId);
  const activeRole = useSelector(selectActiveRole);

  const localRef  = useRef<HTMLVideoElement>(null);
  const peersRef  = useRef<Map<string, RTCPeerConnection>>(new Map());

  const [participants, setParticipants]   = useState<string[]>([]);
  const [tutorPresent, setTutorPresent]   = useState(false);
  // null = показываем своё видео как главное
  const [activeVideo, setActiveVideo]     = useState<string | null>(null);

  const { socket, joined } = useLessonSocket();

  useEffect(() => {
    if (!canJoin) return;
    let stream: MediaStream;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s;
        setLocalStream(s);
        if (localRef.current) localRef.current.srcObject = s;
      })
      .catch(console.error);
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    };
  }, [canJoin]);

  useEffect(() => {
    if (!canJoin || !joined || !localStream || !userId) return;

    socket.on('updateParticipants', async (list: string[]) => {
      setParticipants(list);
      for (const peerId of list) {
        if (peerId === socket.id || peersRef.current.has(peerId)) continue;
        const pc = createPeerConnection(peerId, socket);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('lesson:offer', { to: peerId, offer });
      }
    });

    socket.on('tutor:joined', () => setTutorPresent(true));

    socket.on('lesson:offer', async ({ from, offer }) => {
      if (peersRef.current.has(from)) return;
      const pc = createPeerConnection(from, socket);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('lesson:answer', { to: from, answer });
    });

    socket.on('lesson:answer', async ({ from, answer }) => {
      await peersRef.current.get(from)?.setRemoteDescription(answer);
    });

    socket.on('lesson:ice-candidate', async ({ from, candidate }) => {
      await peersRef.current.get(from)?.addIceCandidate(candidate);
    });

    socket.on('lesson:user-left', (peerId: string) => {
      peersRef.current.get(peerId)?.close();
      peersRef.current.delete(peerId);
      setRemoteStreams(prev => { const m = new Map(prev); m.delete(peerId); return m; });
      setActiveVideo(v => v === peerId ? null : v);
    });

    socket.on('meetingEnded', () => {
      localStream.getTracks().forEach(t => t.stop());
    });

    return () => {
      socket.emit('leaveLesson', { lessonId });
      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
      setRemoteStreams(new Map());
      socket.off('updateParticipants');
      socket.off('tutor:joined');
      socket.off('lesson:offer');
      socket.off('lesson:answer');
      socket.off('lesson:ice-candidate');
      socket.off('lesson:user-left');
      socket.off('meetingEnded');
    };
  }, [canJoin, joined, localStream, userId, lessonId]);

  const createPeerConnection = (peerId: string, socket: Socket) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    localStream?.getTracks().forEach(track => pc.addTrack(track, localStream!));
    pc.onicecandidate = e => {
      if (e.candidate) socket.emit('lesson:ice-candidate', { to: peerId, candidate: e.candidate });
    };
    pc.ontrack = e => {
      setRemoteStreams(prev => { const m = new Map(prev); m.set(peerId, e.streams[0]); return m; });
    };
    peersRef.current.set(peerId, pc);
    return pc;
  };

  const remoteEntries = Array.from(remoteStreams.entries());

  if (!canJoin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <p className="text-slate-400 text-sm">{t('videoRoom.lessonNotStarted')}</p>
      </div>
    );
  }

  // ── МОБИЛЬНЫЙ LAYOUT: одно большое видео + миниатюры снизу ───────────────
  const MobileLayout = () => {
    const showLocal = activeVideo === null;
    const activeStream = activeVideo ? remoteStreams.get(activeVideo) : null;

    return (
      <div className="flex flex-col flex-1 bg-slate-950 overflow-hidden">
        {/* Главное видео */}
        <div className="flex-1 relative bg-slate-900 overflow-hidden">
          {showLocal ? (
            <>
              <video ref={localRef} autoPlay playsInline muted
                className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 text-xs text-white
                bg-black/60 px-2 py-1 rounded-lg">
                {t('videoRoom.you')}
              </span>
            </>
          ) : activeStream ? (
            <RemoteVideoFull stream={activeStream} />
          ) : null}

          {/* Participants count */}
          <span className="absolute top-2 right-2 text-xs text-white
            bg-black/60 px-2 py-1 rounded-lg">
            {participants.length} {t('videoRoom.online')}
          </span>

          {participants.length === 1 && (
            <span className="absolute top-2 left-2 text-xs text-amber-400
              bg-black/60 px-2 py-1 rounded-lg">
              {t('videoRoom.waitingForOthers')}
            </span>
          )}
        </div>

        {/* Миниатюры */}
        {(remoteEntries.length > 0 || true) && (
          <div className="flex gap-2 px-2 py-2 bg-slate-900 overflow-x-auto flex-shrink-0">
            {/* Своё видео как миниатюра */}
            <button onClick={() => setActiveVideo(null)}
              className={`relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2
                ${activeVideo === null ? 'border-blue-400' : 'border-transparent'}`}>
              <MiniLocalVideo stream={localStream} localRef={localRef} show={activeVideo !== null} />
              <span className="absolute bottom-0.5 left-0.5 text-xs text-white
                bg-black/60 px-1 rounded text-[10px]">
                {t('videoRoom.you')}
              </span>
            </button>

            {/* Чужие видео как миниатюры */}
            {remoteEntries.map(([peerId, stream]) => (
              <button key={peerId} onClick={() => setActiveVideo(peerId)}
                className={`relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2
                  ${activeVideo === peerId ? 'border-blue-400' : 'border-transparent'}`}>
                <RemoteVideoMini stream={stream} />
                <span className="absolute bottom-0.5 left-0.5 text-xs text-white
                  bg-black/60 px-1 rounded text-[10px]">
                  {peerId.slice(0, 6)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── ДЕСКТОП LAYOUT: grid ──────────────────────────────────────────────────
  const totalVideos = 1 + remoteEntries.length;
  const cols = totalVideos <= 1 ? 1 : totalVideos <= 4 ? 2 : 3;

  const DesktopLayout = () => (
    <div className="flex-1 grid gap-2 p-2 bg-slate-950"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video">
        <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <span className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded-lg">
          {t('videoRoom.you')}{' '}
          {activeRole === 'tutor' ? t('videoRoom.roleTeacher') :
           activeRole === 'admin' ? t('videoRoom.roleAdmin') :
           t('videoRoom.roleStudent')}
        </span>
        <span className="absolute top-2 right-2 text-xs text-white bg-black/60 px-2 py-1 rounded-lg">
          {participants.length} {t('videoRoom.online')}
        </span>
        {participants.length === 1 && (
          <span className="absolute top-2 left-2 text-xs text-amber-400 bg-black/60 px-2 py-1 rounded-lg">
            {t('videoRoom.waitingForOthers')}
          </span>
        )}
        {activeRole === 'client' && !tutorPresent && (
          <span className="absolute top-10 left-2 text-xs text-red-400 bg-black/60 px-2 py-1 rounded-lg">
            {t('videoRoom.tutorNotJoined')}
          </span>
        )}
      </div>
      {remoteEntries.map(([peerId, stream]) => (
        <RemoteVideo key={peerId} peerId={peerId} stream={stream} />
      ))}
    </div>
  );

  return (
    <>
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        <MobileLayout />
      </div>
      <div className="hidden md:flex flex-1 overflow-hidden">
        <DesktopLayout />
      </div>
    </>
  );
};

// ── Вспомогательные компоненты ────────────────────────────────────────────────

const RemoteVideo = ({ stream, peerId }: { stream: MediaStream; peerId: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      <span className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded-lg">
        {peerId.slice(0, 8)}
      </span>
    </div>
  );
};

const RemoteVideoFull = ({ stream }: { stream: MediaStream }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />;
};

const RemoteVideoMini = ({ stream }: { stream: MediaStream }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <video ref={ref} autoPlay playsInline muted className="w-full h-full object-cover" />;
};

const MiniLocalVideo = ({
  stream, localRef, show,
}: {
  stream: MediaStream | null;
  localRef: React.RefObject<HTMLVideoElement>;
  show: boolean;
}) => {
  const miniRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (show && miniRef.current && stream) miniRef.current.srcObject = stream;
  }, [show, stream]);

  // Когда локальное видео главное — используем тот же localRef
  // Когда оно миниатюра — нужен отдельный элемент
  if (!show) {
    return <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover" />;
  }
  return <video ref={miniRef} autoPlay playsInline muted className="w-full h-full object-cover" />;
};