import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import socket, { connectSocket, disconnectSocket } from './services/socket';
import { ToastProvider } from './context/ToastContext';
import { fetchNotifications, addNotification } from './features/notifications/notificationsSlice';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;

    const s = connectSocket();
    dispatch(fetchNotifications());

    const handleNewNotification = (notif) => {
      if (notif) {
        dispatch(addNotification(notif));
      }
    };

    s.on('notification:new', handleNewNotification);

    return () => {
      s.off('notification:new', handleNewNotification);
      disconnectSocket();
    };
  }, [dispatch, isAuthenticated]);

  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

export default App;
