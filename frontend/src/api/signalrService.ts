import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:8000/hubs/notifications", {
        accessTokenFactory: () => localStorage.getItem("aura_token") || ""
    })
    .withAutomaticReconnect()
    .build();

export const startSignalR = async (onMessageReceived: (data: any) => void) => {
    try {
        if (connection.state === signalR.HubConnectionState.Disconnected) {
            await connection.start();
            console.log("✅ SignalR Connected");
        }
        connection.on("ReceiveAiResult", (data) => onMessageReceived(data));
    } catch (err) {
        console.error("❌ SignalR Error: ", err);
    }
};