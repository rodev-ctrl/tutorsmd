import { useParams, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useGetLessonQuery } from '@shared/api/lessonApi';
import { Spinner } from '@shared/index';
import { VideoRoom }      from './components/VideoRoom';
import { LessonChat }     from './components/LessonChat';
import { Whiteboard }     from './components/Whiteboard';
import { LessonControls } from './components/LessonControls';

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { data: lesson, isLoading } = useGetLessonQuery(lessonId ?? '', { skip: !lessonId });

  // WebRTC state — только локальный, не нужен глобально
  const [localStream, setLocalStream]   = useState<MediaStream | null>(null);
  const [peers, setPeers]               = useState<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [activeTab, setActiveTab]       = useState<'chat' | 'whiteboard'>('chat');

  if (!lessonId)    return <Navigate to="/dashboard" replace />;
  if (isLoading)    return <Spinner fullscreen />;
  if (!lesson)      return <Navigate to="/dashboard" replace />;

  const canJoin = lesson.status === 'confirmed' || lesson.status === 'in_progress';

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${
            lesson.status === 'in_progress' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
          }`} />
          <span className="text-sm font-medium">
            {lesson.status === 'in_progress' ? 'Unterricht läuft' : 'Warteraum'}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(lesson.scheduledAt).toLocaleString('de-DE')}
          {' · '}{lesson.durationMinutes} Min.
        </span>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video area */}
        <div className="flex-1 flex flex-col">
          <VideoRoom
            lessonId={lessonId}
            localStream={localStream}
            setLocalStream={setLocalStream}
            remoteStreams={remoteStreams}
            setRemoteStreams={setRemoteStreams}
            canJoin={canJoin}
          />
          <LessonControls
            lessonId={lessonId}
            lesson={lesson}
            localStream={localStream}
          />
        </div>

        {/* Sidebar — chat / whiteboard */}
        <aside className="w-80 flex flex-col border-l border-gray-700 bg-gray-800">
          {/* Tab switcher */}
          <div className="flex border-b border-gray-700">
            {(['chat', 'whiteboard'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm font-medium transition
                  ${activeTab === tab
                    ? 'text-white border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-200'}`}
              >
                {tab === 'chat' ? '💬 Chat' : '🖊 Whiteboard'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat'
              ? <LessonChat lessonId={lessonId} />
              : <Whiteboard lessonId={lessonId} />
            }
          </div>
        </aside>
      </div>
    </div>
  );
}