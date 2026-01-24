import React, { createContext, useEffect, useState, useContext, ReactNode } from "react";
import * as signalR from "@microsoft/signalr";
import { useAuth } from "./AuthContext";

interface SignalRContextType {
    connection: signalR.HubConnection | null;
    lastNotification: any;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const SignalRProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [lastNotification, setLastNotification] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`http://localhost:80/hubs/notifications?userId=${user.id}`)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, [user]);

  useEffect(() => {
    if (connection && user) {
      connection.start()
        .then(() => {
          console.log("--> SignalR Connected!");
          
          if (user.role === "doctor" || user.role === "clinicadmin") {
             const clinicId = user.clinicId || "11111111-1111-1111-1111-111111111111";
             connection.invoke("JoinClinicChannel", clinicId);
          }

          connection.on("ReceiveAiResult", (data) => {
            console.log("🔔 REAL-TIME NOTIFICATION:", data);
            setLastNotification(data);
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

export const useSignalR = () => {
    const context = useContext(SignalRContext);
    if (!context) throw new Error("useSignalR must be used within SignalRProvider");
    return context;
};