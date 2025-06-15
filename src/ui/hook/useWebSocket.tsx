import { useEffect, useState } from "react";

export function useWebSocket(url: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.addEventListener("open", () => {
      console.log("🔗 WebSocket kết nối thành công!");
    });

    socket.addEventListener("message", (event) => {
      console.log("📩 Nhận tin nhắn:", event.data);
      setMessages((prev) => [...prev, event.data]);
    });

    socket.addEventListener("error", (event) => {
      console.error("❌ Lỗi WebSocket:", event);
    });

    socket.addEventListener("close", (event) => {
      console.warn("⚠️ WebSocket đã đóng!", event.code, event.reason);
    });

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [url]);

  const sendMessage = (message: string) => {
    ws?.send(message);
  };

  return { ws, messages, sendMessage };
}
