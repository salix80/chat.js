"use strict";
const socket = io();
const messages = document.getElementById("messages");
const input = document.getElementById("message-input");
const form = document.getElementById("message-form");
const chatBox = document.getElementById("messages");
const topic = document.getElementById("topic");


// Fügt einen neuen Listeneintrag hinzu, wenn das Formular abgeschickt wird
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value;

  if (text.startsWith("/clean")) {
    // Leert den Chatverlauf, wenn der Befehl /clean eingegeben wird
    messages.innerHTML = "";
    return;
  }
  
  if (text) {
    socket.emit("nachricht", text);
    input.value = "";
  }
});

// Empfängt Nachrichten vom Server und fügt sie der Liste hinzu
socket.on("nachricht", (msg) => {
  const li = document.createElement("li");
  li.innerHTML = msg
  messages.appendChild(li);
  chatBox.scrollTop = chatBox.scrollHeight; // Scrollt zum Ende des Chatverlaufs
});

socket.on("system", (msg) => {
  if (msg.startsWith("topic:")) {
    const newTopic = msg.replace("topic:", "").trim();
    topic.textContent = newTopic;
  }
})
