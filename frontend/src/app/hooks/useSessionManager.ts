import { clearCredentials } from "@entities/user/model/authSlice";
import { selectIsAuthenticated } from "@entities/user/model/selectors";
import { useRefreshMutation } from "@shared/api/authApi";
import { tokenManager } from "@shared/index";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";



   // Если другое устройство отозвало мою сессию -> мгновенно разлогиниваем
export const useSessionManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [refresh] = useRefreshMutation();

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (socketRef.current) return;

    const token = tokenManager.get();
    if (!token) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('session:revoked', () => {
      tokenManager.clear();
      dispatch(clearCredentials());
      navigate('/login');
    });

    socket.on('auth:expired', async () => {
      try {
        const data = await refresh({}).unwrap();
        tokenManager.set(data.accessToken);
      } catch {
        tokenManager.clear();
        dispatch(clearCredentials());
        navigate('/login');
      }
    });

    return () => {              // {} для типа "void", а не EffectCallback
        socket.disconnect();       
        socketRef.current = null;
    };  
  }, [isAuthenticated]);
};