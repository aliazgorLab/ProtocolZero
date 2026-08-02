import { useEffect } from 'react';
import socket, { connectSocket, disconnectSocket } from '../services/socket';

const useSocket = () => {
    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            connectSocket(token);
        }

        return () => {
            disconnectSocket();
        };
    }, []);

    return socket;
};

export default useSocket;