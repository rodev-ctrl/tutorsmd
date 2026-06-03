import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectActiveRole } from '@entities/user/model/selectors';
import { setCredentials } from '@entities/user/model/authSlice';
import { useLogoutMutation, useSwitchRoleMutation } from '@shared/api/authApi';
import { useGetUserProfileQuery } from '@shared/api/profileApi';
import { tokenManager } from '@shared/lib/TokenManager';
import { useTranslation } from 'react-i18next';
import type { Role } from '@entities/user/model/types';

const ROLE_LABEL: Record<string, string> = {
  client: 'Schüler',
  tutor:  'Lehrer',
  admin:  'Admin',
};

const ROLE_ICON: Record<string, string> = {
  client: '🎓',
  tutor:  '📚',
  admin:  '⚙️',
};

export const UserMenu = () => {
  const { t }           = useTranslation('nav');
  const dispatch        = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const activeRole      = useSelector(selectActiveRole);
  const navigate        = useNavigate();
  const [logout]        = useLogoutMutation();
  const [switchRole, { isLoading: switching }] = useSwitchRoleMutation();
  const [open, setOpen] = useState(false);
  const menuRef         = useRef<HTMLDivElement>(null);

  const { data: profile } = useGetUserProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Роли у пользователя (из профиля)
  const userRoles = profile?.roles ?? [];
  const hasMultipleRoles = userRoles.length > 1;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  const handleSwitchRole = async (newRole: Role) => {
    if (newRole === activeRole || switching) return;
    try {
      const result = await switchRole({ newRole }).unwrap();
      tokenManager.set(result.accessToken);
      dispatch(setCredentials({
        userId:     profile!.id,
        activeRole: newRole,
      }));
      setOpen(false);
      navigate('/dashboard');
    } catch {
      // ошибка — роль не изменилась
    }
  };

  // Незалогиненный
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
        >
          {t('login')}
        </Link>
        <Link
          to="/register"
          className="text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white
            px-4 py-2 rounded-xl transition shadow-sm shadow-orange-200"
        >
          {t('register')}
        </Link>
      </div>
    );
  }

  
  const initials = profile
    ? `${profile.name[0]}${profile.surname[0]}`.toUpperCase()
    : activeRole?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm
          flex items-center justify-center hover:bg-blue-700 transition
          focus:outline-none focus:ring-2 focus:ring-blue-300 overflow-hidden"
        aria-label={t('userMenu')}
      >
        {profile?.avatarUrl
          ? <img src={profile.avatarUrl} alt="" className="w-9 h-9 object-cover" />
          : initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl
          border border-slate-200 py-1.5 z-50">

          {/* User info */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {profile ? `${profile.name} ${profile.surname}` : '...'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {ROLE_ICON[activeRole ?? '']} {ROLE_LABEL[activeRole ?? ''] ?? activeRole}
            </p>
          </div>

          {/* Role switcher — только если есть несколько ролей */}
          {hasMultipleRoles && (
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs text-slate-400 mb-1.5 px-1">
                {t('switchRole')}
              </p>
              <div className="flex flex-col gap-1">
                {userRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleSwitchRole(role as Role)}
                    disabled={switching}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                      transition text-left
                      ${role === activeRole
                        ? 'bg-blue-50 text-blue-700 font-medium cursor-default'
                        : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span>{ROLE_ICON[role]}</span>
                    <span>{ROLE_LABEL[role] ?? role}</span>
                    {role === activeRole && (
                      <span className="ml-auto text-xs text-blue-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="py-1">
            <MenuLink to="/dashboard"      onClick={() => setOpen(false)}>{t('dashboard')}</MenuLink>
            <MenuLink to="/lessons"        onClick={() => setOpen(false)}>{t('lessons')}</MenuLink>
            <MenuLink to="/liked-tutors"   onClick={() => setOpen(false)}>{t('likedTutors')}</MenuLink>
            <MenuLink to="/support"        onClick={() => setOpen(false)}>{t('support')}</MenuLink>
            <MenuLink to="/settings"       onClick={() => setOpen(false)}>{t('settings')}</MenuLink>
            <MenuLink to="/settings/media" onClick={() => setOpen(false)}>{t('mediaCheck')}</MenuLink>
          </div>

          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600
                hover:bg-red-50 transition rounded-b-2xl"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuLink = ({
  to, onClick, children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
  >
    {children}
  </Link>
);