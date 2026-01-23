import React, { createContext, useEffect, useState, useContext } from "react";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "./AuthContext";

const SignalRContext = createContext();

export const SignalRProvider = ({ children }) => {
  const { user } = useAuth();
  const [connection, setConnection] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Kết nối tới Ocelot Gateway (/hubs/notifications)
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`http://localhost:80/hubs/notifications?userId=${user.id}`) // Gửi UserId để định danh
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, [user]);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log("--> SignalR Connected!");
          
          // Nếu là Bác sĩ/Admin -> Join vào kênh phòng khám
          if (user.role === "Doctor" || user.role === "ClinicAdmin") {
             // Giả sử user có field clinicId (nếu không có thì hardcode ID mẫu để test)
             const clinicId = user.clinicId || "11111111-1111-1111-1111-111111111111"; // ID mẫu trong DbInitializer
             connection.invoke("JoinClinicChannel", clinicId);
          }

          // Lắng nghe sự kiện từ Backend (Notification Service)
          connection.on("ReceiveAiResult", (data) => {
            console.log("🔔 REAL-TIME NOTIFICATION:", data);
            setLastNotification(data);
            // Có thể dùng thư viện Toast (như react-toastify) để hiện popup đẹp hơn
            alert(`${data.Message}\nRisk Level: ${data.RiskLevel}`);
          });
        })
        .catch((e) => console.log("Connection failed: ", e));
    }
  }, [connection, user]);

  return (
    <SignalRContext.Provider value={{ connection, lastNotification }}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => useContext(SignalRContext);