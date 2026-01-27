import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from "@microsoft/signalr";
// @ts-ignore
import { useAuth } from './AuthContext';

interface NotificationData {
    message: string;
    type: string;
    timestamp: Date;
    [key: string]: any;
}

interface SignalRContextType {
    connection: signalR.HubConnection | null;
    lastNotification: NotificationData | null;
}

const SignalRContext = createContext<SignalRContextType>({ 
    connection: null, 
    lastNotification: null 
});

export const useSignalR = () => useContext(SignalRContext);

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth(); 
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [lastNotification, setLastNotification] = useState<NotificationData | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('aura_token');
        if (!user || !token) {
            if (connection) connection.stop();
            return;
        }

        // FIX 404: Ép SignalR gọi qua Gateway cổng 8000 để negotiate thành công
        const hubUrl = "http://localhost:8000/api/hubs/notifications";

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, { 
                accessTokenFactory: () => token,
                // Hỗ trợ fallback nếu WebSockets bị chặn
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, [user]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log("✅ SignalR Connected via Gateway 8000");
                    
                    // Listener 1: Kết quả AI
                    connection.on("ReceiveAiResult", (data: any) => {
                        setLastNotification({
                            message: "Đã có kết quả chẩn đoán mới!",
                            type: "AI_RESULT",
                            timestamp: new Date(),
                            ...data
                        });
                    });

                    // Listener 2: Ca khám mới
                    connection.on("NewExaminationCreated", (data: any) => {
                        setLastNotification({
                            message: "Có bệnh nhân mới đăng ký khám!",
                            type: "NEW_EXAM",
                            timestamp: new Date(),
                            ...data
                        });
                    });
                })
                .catch((e) => console.log("❌ SignalR Error: ", e));
        }
        
        return () => { connection?.stop(); };
    }, [connection]);

    return (
        <SignalRContext.Provider value={{ connection, lastNotification }}>
            {children}
        </SignalRContext.Provider>
    );
};