import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRefreshMutation } from '@shared/api/authApi';
import { setCredentials, clearCredentials } from '@entities/user/model/authSlice';
import { tokenManager } from '@shared/lib/TokenManager';
import { jwtDecode } from 'jwt-decode';
import type { Role } from '@entities/user/model/types';


interface JwtPayload {
  userId: string;
  activeRole: Role;
  exp: number;
}

export const useInitAuth = () => {
  const dispatch  = useDispatch();
  const [refresh] = useRefreshMutation();
  const [isReady, setIsReady] = useState(false);



  useEffect(() => {
    const init = async () => {
      try {
        const data = await refresh({}).unwrap();
        tokenManager.set(data.accessToken);

        const payload = jwtDecode<JwtPayload>(data.accessToken);
        dispatch(setCredentials({
          userId:     payload.userId,
          activeRole: payload.activeRole,
        }));
      } catch {
        // Нет валидного refreshToken - не залогинен
        tokenManager.clear();
        dispatch(clearCredentials());
      } finally {
        setIsReady(true);
      }
    };

    init();
  }, []); 

  return { isReady };
}