import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useActivateAccountMutation } from '@shared/api/authApi';

type State = 'loading' | 'success' | 'error' | 'invalid';

export default function ActivatePage() {
  const { token } = useParams<{ token: string }>();
  const [activate] = useActivateAccountMutation();
  const [state, setState]   = useState<State>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }

    const run = async () => {
      try {
        await activate({ token }).unwrap();
        setState('success');
      } catch (err: any) {
        setErrorMsg(err?.data?.message ?? 'Aktivierungslink ungültig oder abgelaufen.');
        setState('error');
      }
    };

    run();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">

        {state === 'loading' && (
          <>
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent
              rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Konto wird aktiviert...</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Konto erfolgreich aktiviert!
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Sie können sich jetzt anmelden.
            </p>
            <Link
              to="/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white
                text-sm font-medium px-6 py-2 rounded-lg transition"
            >
              Zur Anmeldung
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Aktivierung fehlgeschlagen
            </h1>
            <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
            <div className="space-y-2">
              <Link
                to="/resend-verification"
                className="block bg-blue-600 hover:bg-blue-700 text-white
                  text-sm font-medium px-6 py-2 rounded-lg transition"
              >
                Neuen Link anfordern
              </Link>
              <Link
                to="/login"
                className="block text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Zur Anmeldung
              </Link>
            </div>
          </>
        )}

        {state === 'invalid' && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Ungültiger Link
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Der Aktivierungslink ist ungültig.
            </p>
            <Link
              to="/login"
              className="inline-block text-sm text-blue-600 hover:underline"
            >
              Zur Anmeldung
            </Link>
          </>
        )}

      </div>
    </div>
  );
}