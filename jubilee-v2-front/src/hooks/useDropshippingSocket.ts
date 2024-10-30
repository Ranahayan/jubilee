const BASE_SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const useDropshippingSocket = () => {
  const connect = (userId: number, onMessage: any) => {
    const socket = new WebSocket(`${BASE_SOCKET_URL}dropshipping/?user_id=${userId}`);

    socket.onmessage = (event) => {
      const eventData = JSON.parse(event.data);
      onMessage(eventData);
    };

    socket.onerror = () => {
      socket.close();
    };

    return socket;
  };


  return { connect };
};
