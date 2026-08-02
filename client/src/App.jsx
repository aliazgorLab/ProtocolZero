import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { connectSocket, disconnectSocket } from './services/socket';

function App() {
  useEffect(() => {
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <AppRoutes />
  );
}

export default App;
