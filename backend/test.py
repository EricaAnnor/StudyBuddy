from fastapi.responses import HTMLResponse
from fastapi import APIRouter

test_ui = APIRouter()

html = """
<!DOCTYPE html>
<html>
<head>
    <title>StudyBuddy Chat & Presence Test</title>
</head>
<body>
    <h2>WebSocket Chat and Presence Test</h2>

    <label>User ID (UUID):</label>
    <input type="text" id="user_id" value="11111111-1111-1111-1111-111111111111"><br>

    <label>Group ID (UUID):</label>
    <input type="text" id="group_id" value="22222222-2222-2222-2222-222222222222"><br>

    <label>Message Type:</label>
    <select id="messagetype">
        <option value="group">Group</option>
        <option value="one_on_one">One-on-One</option>
    </select><br>

    <label>Receiver ID (for 1-on-1):</label>
    <input type="text" id="receiver_id" value="33333333-3333-3333-3333-333333333333"><br>

    <label>Message:</label>
    <input type="text" id="messageText"><br><br>

    <button onclick="connectPresence()">Connect to Presence</button>
    <button onclick="connectChat()">Connect to Chat</button>
    <button onclick="sendMessage()">Send Message</button>

    <h3>Incoming Messages:</h3>
    <ul id="messages"></ul>

    <script>
        let chatSocket = null;
        let presenceSocket = null;

        function connectPresence() {
            const user_id = document.getElementById("user_id").value;
            presenceSocket = new WebSocket("ws://localhost:8000/studybuddy/ws?user_id=" + user_id);

            presenceSocket.onopen = () => {
                console.log("Connected to presence server");
                sendHeartbeat();
            };

            presenceSocket.onclose = () => console.log("Presence socket closed");

            presenceSocket.onerror = err => console.error("Presence error", err);
        }

        function sendHeartbeat() {
            if (presenceSocket && presenceSocket.readyState === WebSocket.OPEN) {
                presenceSocket.send("heartbeat");
                setTimeout(sendHeartbeat, 10000); // every 10 sec
            }
        }

        function connectChat() {
            chatSocket = new WebSocket("ws://localhost:8000/studybuddy/v1/chat/send/");

            chatSocket.onopen = () => {
                console.log("Connected to chat server");
            };

            chatSocket.onmessage = (event) => {
                const li = document.createElement("li");
                li.textContent = "Received: " + event.data;
                document.getElementById("messages").appendChild(li);
            };

            chatSocket.onerror = (err) => console.error("Chat error:", err);
            chatSocket.onclose = () => console.log("Chat socket closed");
        }

        function sendMessage() {
            const user_id = document.getElementById("user_id").value;
            const group_id = document.getElementById("group_id").value;
            const receiver_id = document.getElementById("receiver_id").value;
            const messagetype = document.getElementById("messagetype").value;
            const message = document.getElementById("messageText").value;

            if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
                const payload = {
                    sender_id: user_id,
                    message: message,
                    messagetype: messagetype,
                    group_id: messagetype === "group" ? group_id : null,
                    user_id: messagetype === "one_on_one" ? receiver_id : null
                };
                chatSocket.send(JSON.stringify(payload));
            } else {
                alert("Chat socket not connected");
            }
        }
    </script>
</body>
</html>
"""

@test_ui.get("/")
async def chat_presence_ui():
    return HTMLResponse(html)
