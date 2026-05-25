import { useGetSessionsQuery, useRevokeSessionMutation, useRevokeAllSessionsMutation } from '@shared/api/authApi';
import { useLogoutMutation } from '@shared/api/authApi';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@shared/index';

export const SessionsList = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetSessionsQuery();
  const [revokeSession] = useRevokeSessionMutation();
  const [revokeAll]     = useRevokeAllSessionsMutation();
  const [logout]        = useLogoutMutation();

  const handleRevokeAll = async () => {
    await revokeAll();
    await logout();
    navigate('/login');
  };

  if (isLoading) return <Spinner />;

  const sessions = data?.sessions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Aktive Sitzungen ({sessions.length})
        </h2>
        <button
          onClick={handleRevokeAll}
          className="text-sm text-red-600 hover:underline"
        >
          Alle abmelden
        </button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">Keine aktiven Sitzungen.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.tokenHash}
              className="bg-white border border-gray-100 rounded-xl p-4
                flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {session.deviceInfo ?? 'Unbekanntes Gerät'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Erstellt: {new Date(session.createdAt).toLocaleDateString('de-DE')}
                  {' · '}
                  Läuft ab: {new Date(session.expiresAt).toLocaleDateString('de-DE')}
                </p>
              </div>
              <button
                onClick={() => revokeSession({ tokenHash: session.tokenHash })}
                className="text-xs text-red-500 hover:text-red-700 transition"
              >
                Abmelden
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};