import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { connectSocket, disconnectSocket } from './services/socket';
import { ToastProvider } from './context/ToastContext';

function App() {
  useEffect(() => {
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

export default App;
