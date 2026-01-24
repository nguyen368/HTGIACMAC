import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:8000/hubs/notifications", {
        accessTokenFactory: () => localStorage.getItem("aura_token")
    })
    .withAutomaticReconnect()
    .build();

export const startSignalR = async (onMessageReceived) => {
    try {
        await connection.start();
        console.log("Connected to AURA Notification Hub");
        
        // Lắng nghe sự kiện từ Backend (khớp với AnalysisCompletedConsumer)
        connection.on("ReceiveAiResult", (data) => {
            onMessageReceived(data);
        });
    } catch (err) {
        console.error("SignalR Connection Error: ", err);
    }
};