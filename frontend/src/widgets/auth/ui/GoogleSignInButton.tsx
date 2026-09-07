import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleAuthMutation } from '@shared/api/authApi';

declare global {
  interface Window {
    google?: any;
  }
}

interface Props {
  role: 'client' | 'tutor';
  onError?: (message: string) => void;
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/**
 * Rendert den offiziellen Google-Button (Google Identity Services, Skript in
 * index.html geladen). Ohne VITE_GOOGLE_CLIENT_ID rendert die Komponente nichts —
 * kein Fehler, das Feature ist einfach noch nicht konfiguriert.
 */
export function GoogleSignInButton({ role, onError }: Props) {
  const navigate = useNavigate();
  const [googleAuth] = useGoogleAuthMutation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | undefined;

    const render = () => {
      if (cancelled || !window.google || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            await googleAuth({ idToken: response.credential, role }).unwrap();
            navigate('/dashboard');
          } catch (err: any) {
            onError?.(err?.data?.message ?? 'Google sign-in failed');
          }
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: role === 'tutor' ? 'signup_with' : 'signin_with',
      });
    };

    // Скрипт грузится async/defer — window.google может ещё не существовать
    // в момент маунта компонента.
    if (window.google) {
      render();
    } else {
      pollId = setInterval(() => {
        if (window.google) {
          clearInterval(pollId);
          render();
        }
      }, 100);
    }

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
    };
  }, [role, googleAuth, navigate, onError]);

  if (!CLIENT_ID) return null;

  return <div ref={containerRef} className="flex justify-center" />;
}
