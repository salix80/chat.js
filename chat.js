
// !!Lernprojekt, nicht für den produktiven Einsatz geeignet!!

// # Chat-Server mit Node.js, Express und Socket.IO
//
// Geschrieben von Andreas Pfister
// Läuft und getestet auf Node.js v20.10.0
// Lizensiert unter GNU General Public License v3.0
// SPDX-License-Identifier: GPL-3.0
// https://www.gnu.org/licenses/gpl-3.0.en.html 
// **Dieses Skript nutzt Comment Anchor**
//
// Dieses Skript implementiert einen einfachen Chat-Server mit Funktionen wie
// Benutzerregistrierung, Login, private Nachrichten, Administratorbefehle und
// Ban-Management. Es verwendet Express.js für die Webserver-Funktionalität,
// Socket.IO für Echtzeit-Kommunikation und SQLite für die Benutzerdatenbank.
//
// Die Anwendung ist so konzipiert, dass sie auf z.B. einem Raspberry Pi 3B mit
// 2GB RAM läuft, und bietet eine einfache, benutzerfreundliche Chat-Oberfläche.
// Die Benutzer können sich registrieren, einloggen, private Nachrichten senden
// und Administratoren können Benutzer verwalten, einschließlich Bannen und
// Entbannen von Benutzern. Die Anwendung unterstützt auch die Anzeige des
// letzten Logins der Benutzer und ermöglicht es Administratoren, das Chat-Thema
// zu ändern.

"use strict";
//-------- Abhängigkeiten importieren --------------------
// ANCHOR Abhängigkeiten importieren

//Cookie-Parser
const cookie = require('cookie');

// Express.js
const path = require('path');
const express = require('express');

// HTTP-Server
const http = require('http');

// express-handlebars für die Template-Engine
const { Server } = require('socket.io');
const exphbs = require('express-handlebars');

// bcrypt für Passwort-Hashing
const bcrypt = require('bcrypt');
const saltRounds = 10;

//better-sqlite3
const Database = require('better-sqlite3');
const db = new Database('data/db/users.db', { verbose: logToFile });

// Initialisieren
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 80;
const fs = require('fs');
//const { log } = require('console');
//const { disconnect, emit } = require('process');

// -------------- Einstellungen --------------------
// ANCHOR Einstellungen

// Titel der Anwendung
const title = 'Espas Chat (◕‿◕✿)';
// Chat-Thema
let topic = 'Willkommen im Chat!';
// Standard Username
let defaultUsername = 'Gast';
// Log-Datei
const loggingON = true; // Logging aktivieren oder deaktivieren

// Benutzerfarben
const Colors = [
  '#007bff', // Helles Blau 
  '#28a745', // Grün
  '#dc3545', // Rot
  '#6f42c1', // Violett
  '#0056b3', // Dunkleres Blau
  '#17a2b8', // Türkis
  '#fd7e14', // Orange
  '#6c757d', // Grau
  '#20c997', // Mittelgrün/Mint
  '#e83e8c', // Pink
  '#343a40', // Dunkelgrau
  '#ffc107', // Gelb
  '#6610f2', // Lila
  '#fd7e14', // Orange
];



// ------------Globale Variablen--------------------
// ANCHOR Globale Variablen
// Nicht editieren
let userNames = [];
let userColors = [];
let admins = []; // Liste der Administratoren
let userBanned = []; // Liste der gebannten Benutzer
let bannedIPs = []; // Liste der gebannten IP-Adressen
let disconnectedUsers = []; // Liste der getrennten Benutzer 



// ------------Funktionen--------------------
// ANCHOR Funktionen

function isNameTaken(name) {
  let taken = false;
  let lowerName = name.toLowerCase();

  if (Object.values(userNames).some(n => n.toLowerCase() === lowerName)) {
  return taken = true;
  }

  if (db.prepare('SELECT name FROM users WHERE LOWER(name) = ?').get(lowerName)) {
  taken = true;
  }

  return taken;
  }

function generateRandomUsername() {
  let username = '';
  
  do {
    const randomNumber = Math.floor(Math.random() * 1000);
    username = defaultUsername + randomNumber;
    logToFile(`Generierter Benutzername: ${username}`);
  } while (isNameTaken(username));

  return username;
}

function getCurrentTime() {
    const now = new Date(); // Erstellt ein neues Date-Objekt mit der aktuellen Zeit

    const year = now.getFullYear(); // Holt das Jahr (z.B. 2023)
    const month = now.getMonth() + 1; // Holt den Monat (0-11), daher +1
    const day = now.getDate(); // Holt den Tag des Monats (1-31)

    const hours = now.getHours();     // Holt die Stunden (0-23)
    const minutes = now.getMinutes();   // Holt die Minuten (0-59)
    const seconds = now.getSeconds();   // Holt die Sekunden (0-59)

    // Führende Nullen hinzufügen, damit die Ausgabe immer zweistellig ist (z.B. 09 statt 9)
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month).padStart(2, '0');

    // Gibt die Zeit im Format "HH:MM:SS" zurück
    return `${formattedDay}.${formattedMonth}.${year} | ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function getSocket(username){
  for (const [id, name] of Object.entries(userNames)) {
        if (name.toLowerCase()===username.toLowerCase()){
          return id;
        }
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function dbTimeStamp(name,where){
  db.prepare(`UPDATE users Set ${where} = CURRENT_TIMESTAMP WHERE LOWER(name) = ?`).run(name.toLowerCase());
}

//------------------Logging-------------------
// Diese Funktion wird verwendet, um Log-Ausgaben zu formatieren und in einem logfile zu speichern.
// ANCHOR Logging

function logToFile(message) {
  if (fs.existsSync('data/logs/chat.log') === false) 
    {fs.writeFile('data/logs/chat.log', '', (err) => {
      if (err) {console.error('Fehler beim Erstellen der Logdatei:', err);}
    });}


  const logMessage = `[${getCurrentTime()}] ${message}\n`;

  if (loggingON === true) {
    fs.appendFile('data/logs/chat.log', logMessage, (err) => {
      if (err) {console.error('Fehler beim Schreiben in die Logdatei:', err);}
    });
  } 

  console.log(logMessage.trim());
}

function deleteUserFromDB(username,socket) {
  const user = db.prepare('SELECT * FROM users WHERE LOWER(name) = ?').get(username.toLowerCase());
  if (user) {
    db.prepare('DELETE FROM users WHERE LOWER(name) = ?').run(username.toLowerCase());
    logToFile(`[${getCurrentTime()}] Benutzer ${username} wurde aus der Datenbank gelöscht`);
    io.to(socket).emit('nachricht', `<span class="user-action">Benutzer ${username} wurde erfolgreich gelöscht.</span>`);
  } else {
    io.to(socket).emit('nachricht', `<span class="user-action">Benutzer ${username} nicht gefunden.</span>`);
  }
}


function Adminproof(socket) {
  if (admins[socket] === undefined) {
    io.to(socket).emit('nachricht', '<span class="user-action">Du bist kein Administrator. Dieser Befehl ist nur für Administratoren verfügbar.</span>');
    io.emit('nachricht', `<span class="user-action">${userNames[socket]} versucht, einen Admin-Befehl auszuführen, aber ist kein Administrator.</span>`);
    logToFile(`Zugriff verweigert: ${userNames[socket]} versucht, einen Admin-Befehl auszuführen.`);
    return false;
  }
  //prüfe Datebank auf Adminrechte
  const user = db.prepare('SELECT admin FROM users WHERE LOWER(name) = ?').get(userNames[socket].toLowerCase());
  if (user && user.admin) {
    return true; // Der Benutzer ist ein Administrator
  } else {
    io.to(socket).emit('nachricht', '<span class="user-action">Du bist kein Administrator. Dieser Befehl ist nur für Administratoren verfügbar.</span>');
    io.emit('nachricht', `<span class="user-action">${userNames[socket]} versucht, einen Admin-Befehl auszuführen, aber ist kein Administrator.</span>`);
    logToFile(`Zugriff verweigert: ${userNames[socket]} versucht, einen Admin-Befehl auszuführen.`);
    return false; // Der Benutzer ist kein Administrator
  }
}


// ------------ Befehlsverarbeitung für Chat-Befehle --------------------
// Diese Funktion verarbeitet Chat-Befehle wie /help, /name und /msg

// ----------------- Befehlsverarbeitung für Admin-Befehle --------------------
// ANCHOR Admin-Befehle

function getAdminCommand(commandText, socket) {
  function adminHelp(socket) {
    const adminHelpMessage = `
      <span class="user-action">Hier sind die verfügbaren Admin-Befehle:</span><br>
      <span class="command">/ban &lt;Benutzername&gt;</span> - Bannt einen Benutzer.<br>
      <span class="command">/unban &lt;Benutzername&gt;</span> - Hebt den Bann eines Benutzers auf.<br>
      <span class="command">/setAdmin &lt;Benutzername&gt;</span> - Macht einen Benutzer zum Administrator.<br>
      <span class="command">/removeAdmin &lt;Benutzername&gt;</span> - Entfernt die Administratorrechte eines Benutzers.<br>
      <span class="command">/topic &lt;neues Thema&gt;</span> - Ändert das aktuelle Thema des Chats.<br>
      <span class="command">/deleteUser &lt;Benutzername&gt;</span> - Benutzer aus der Datenbank entfernen.<br>`;
    io.to(socket).emit('nachricht', adminHelpMessage);
  }

  function changeTopic(user, newTopic) {
    newTopic = newTopic.replace('/topic ', '').trim();
    if (newTopic.length > 15) {
      topic = newTopic;
      io.emit('nachricht', `<span class="user-action">Das Thema wurde von ${user} auf "${topic}" geändert.</span>`);
      io.emit('system', `topic:${topic}`);
      logToFile(`Thema geändert: ${topic} von ${user}`);
    }
    else {
      io.to(socket).emit('nachricht', `<span class="user-action">Das Thema muss mindestens 15 Zeichen lang sein.</span>`);
      logToFile(`Thema-Änderung fehlgeschlagen, weil zu kurz: "${newTopic}" von ${user}`);
    }
    return; 
  }


  function setAdmin(commandText, socket){
    const parts = commandText.split (' ');
    if (parts.length < 1){
      io.to(socket).emit('<span class="user-action>Bitte gib einen Benutzernamen an, den du zum Administrator machen möchtest.</span>');
      return;
    }
    
    if (parts[1] === undefined || parts[1].trim() === '') {
      io.to(socket).emit('nachricht', '<span class="user-action">Bitte gib einen Benutzernamen an, den du zum Administrator machen möchtest.</span>');
      return;
    }

    const userToAdmin = parts[1].trim();

    if (userToAdmin.startsWith('Gast')){
      io.to(socket).emit('nachricht','<span class="user-action>Gäste können nicht Administrator werden.</span>');
      return;
    }

    const user=db.prepare('SELECT admin, name FROM users WHERE LOWER(name) = ?').get(userToAdmin.toLowerCase());

    if (user){
      db.prepare('UPDATE users SET admin = 1 WHERE LOWER(name) = ?').run(userToAdmin.toLowerCase());
      dbTimeStamp(userToAdmin, 'updated_at');
      io.emit('nachricht',`<span class="user-action">${userNames[socket]} hat ${userToAdmin} zum Administrator ernannt.</span>`);
      logToFile(`${userNames[socket]} hat ${userToAdmin} zum Administrator ernannt.`);
     
      for (const [id,name] of Object.entries(userNames)) {
        if (name.toLowerCase()===userToAdmin.toLowerCase()){
          admins[name]=true;
          admins[id]=true;
          return;
        }
      }

    } 
     else {
      io.to(socket).emit('nachricht',`<span class="user-action">${userToAdmin} existiert nicht als registrierter Benutzer.</span>`);
      logToFile(`setAdmin von ${userNames[socket]} fehlgeschlagen: Benutzer ${userToAdmin} existiert nicht oder ist nicht registriert.`);
    }

    }
  
  function removeAdmin(commandText, socket) {
    const parts = commandText.split(' ');
    if (parts.length < 2) {
      io.to(socket).emit('nachricht', '<span class="user-action">Bitte gib einen Benutzernamen an, dessen Administratorrechte du entfernen möchtest. zB.: /removeAdmin Max</span>');
      return;
    }
    const targetUser = parts[1].trim();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(name) = ?').get(targetUser.toLowerCase());
    if (user && user.admin) {
      db.prepare('UPDATE users SET admin = 0 WHERE LOWER(name) = ?').run(targetUser.toLowerCase());
      dbTimeStamp(targetUser, 'updated_at');
      delete admins[targetUser];
      delete admins[getSocket(targetUser)];
      io.emit('nachricht', `<span class="user-action">${targetUser} wurde von ${userNames[socket]} die Administratorrechte entzogen.</span>`);
      logToFile(`Die Adminrechte von Benutzer ${targetUser} wurden von ${userNames[socket]} entfernt.`);
    } else {
      io.to(socket).emit('nachricht', `<span class="user-action">Benutzer ${targetUser} ist kein Administrator oder existiert nicht.</span>`);
    }
  }

  function banUser(commandText, socket) {
    const parts = commandText.split(' ');
    if (parts.length < 2) {
      io.to(socket).emit('nachricht', '<span class="user-action">Bitte gib einen Benutzernamen an, den du bannen möchtest. zB.: /ban Max</span>');
      return;
    }
    const targetUser = parts[1].trim();
    let userFound = false;

    for (const [id, name] of Object.entries(userNames)) {      
      if (name.toLowerCase() === targetUser.toLowerCase()) {

        if (admins[name]) {
          io.to(socket).emit('nachricht', `<span class="user-action">Du kannst ${name} nicht bannen, da er ein Administrator ist.</span>`);
          return;
        }

        db.prepare('UPDATE users SET banned = 1 WHERE LOWER(name) = ?').run(name.toLowerCase());
        dbTimeStamp(name,'updated_at')
        io.to(id).emit('nachricht', `<span class="user-action">Du wurdest von einem Administrator gebannt.</span>`);
        io.emit('nachricht', `<span class="user-action">${name} wurde von ${userNames[socket]} gebannt.</span>`);
        logToFile(`Benutzer ${name} wurde gebannt von ${userNames[socket]}`);
        const banIP = io.sockets.sockets.get(id).handshake.address;
        bannedIPs.push(banIP);
        if (!id.startsWith('Gast')) {
          userBanned[id] = true; // Markiere den Benutzer als gebannt 
          }
        userFound = true;
        break;
      }
    }
    if (!userFound) {
      io.to(socket).emit('nachricht', `<span class="user-action">Benutzer ${targetUser} nicht gefunden.</span>`);
    }
  }

  function unbanUser(commandText, socket) {
    const parts = commandText.split(' ');
    if (parts.length < 2) {
      io.to(socket).emit('nachricht', '<span class="user-action">Bitte gib einen Benutzernamen an, dessen Bann du aufheben möchtest. zB.: /unban Max</span>');
      return;
    }

    const targetUser = parts[1].trim();
    let userFound = false;

    const user = db.prepare('SELECT * FROM users WHERE LOWER(name) = ?').get(targetUser.toLowerCase());

    if (user && user.banned) {
      db.prepare('UPDATE users SET banned = 0 WHERE LOWER(name) = ?').run(targetUser.toLowerCase());
      dbTimeStamp(targetUser,'updated_at')
      userFound = true;
    }

    for (const key in userBanned){
      if (key.toLowerCase() === targetUser.toLowerCase()) {
        delete userBanned[key]; // Entferne den Benutzer aus der Liste der gebannten Benutzer
        userFound = true;
      }  
      }

    if (userFound) {
      io.emit('nachricht', `<span class="user-action">${targetUser} wurde von ${userNames[socket]} entbannt.</span>`);
      logToFile(`Benutzer ${targetUser} wurde entbannt von ${userNames[socket]}`);
      }
    else {
      io.to(socket).emit('nachricht', `<span class="user-action">Der Benutzer ${targetUser} ist nicht gebannt.</span>`);
    }

    if (!userFound) {
      io.to(socket).emit('nachricht', `<span class="user-action">Benutzer ${targetUser} nicht gefunden.</span>`);
    }
  }


  function deleteUser(commandText, socket) {
    const parts = commandText.split(' ');
    if (parts.length < 2) {
      io.to(socket).emit('nachricht', '<span class="user-action">Bitte gib einen Benutzernamen an, den du löschen möchtest. zB.: /deleteUser Max</span>');
      return;
    }
    const targetUser = parts[1].trim();
    deleteUserFromDB(targetUser, socket);
    io.to(getSocket(targetUser)).emit('nachricht', `<span class="user-action">Benutzer ${targetUser} wurde von einem Admin aus der Datenbank gelöscht. Du hast keinen registrierten Benutzer mehr.</span>`);
  }


//--------------------Main-Funktion getAdminCommand-------------------
if (Adminproof(socket) === false) {
  banUser(`/ban ${userNames(socket)}`, socket);
  return;
}


switch (true) {
  case commandText.startsWith('/help'):
    adminHelp(socket);
    logToFile(`Admin-Hilfe angefordert von ${socket}: [${getCurrentTime()}]`);
    break;
  case commandText.startsWith('/ban'):
    banUser(commandText, socket);
    break;
  case commandText.startsWith('/unban'):
    unbanUser(commandText, socket);
    break;
  case commandText.startsWith('/setAdmin'):
    setAdmin(commandText, socket);
    break;
  case commandText.startsWith('/removeAdmin'):
    removeAdmin(commandText, socket);
    break;
  case commandText.startsWith('/topic'):
    changeTopic(userNames[socket], commandText);
    break;
  case commandText.startsWith('/deleteUser'):
    deleteUser(commandText, socket);
    break;
  case commandText.startsWith('/dump'):
    dumpGlobalVariablesAndDB2file(socket);
    break
  default:
    io.to(socket).emit('nachricht', '<span class="user-action">Unbekannter Befehl. Tippe /help für Hilfe.</span>');
    break;
  }
}

// ---------------- Befehlsverarbeitung für User-Befehle --------------------
//ANCHOR User-Befehle
function getCommand(commandText, socket) {

  function showHelp(socket) {
    const helpMessage = `
      <span class="user-action">Hier sind die verfügbaren Befehle:</span><br>
      <span class="command">/help</span> - Zeigt diese Hilfe an.<br>
      <span class="command">/name &lt;dein Name&gt;</span> - Ändert deinen Benutzernamen.<br>
      <span class="command">/msg &lt;Benutzername&gt; &lt;Nachricht&gt;</span> - Sendet eine private Nachricht an einen Benutzer.<br>
      <span class="command">/userlist</span> - Zeigt eine Liste aller aktiven Benutzer an.<br>
      <span class="command">/clean</span> - Leert den Chatverlauf.<br>
      <span class="command">/createUser &lt;passwort&gt; &lt;passwort wiederholen&gt;</span> - Erstellt einen neuen Benutzer mit dem angegebenen Passwort und aktuellen Benutzernamen.<br>
      <span class="command">/login &lt;Benutzername&gt; &lt;Passwort&gt;</span> - Loggt einen Benutzer ein, wenn er bereits existiert.<br>
      <span class="command">/lastLogin &lt;Benutzername&gt;</span> - Zeigt die Datum und Zeit des letzten Logins eines Benutzers an.<br>
      <span class="command">/deleteMe</span> - Löscht deinen registrierten Benutzer.<br>
      <span class="command">/changePassword &lt;altes Passwort&gt; &lt;neues Passwort&gt; &lt;neues Passwort wiederholen&gt;</span> - Ändert dein Passwort.<br>`;

    io.to(socket).emit('nachricht', helpMessage);
    if (admins[userNames[socket]] !== undefined) {
        getAdminCommand(commandText, socket);}
    logToFile(`Hilfe angefordert von ${userNames[socket]}, ${socket}`);
  }

  function register(socket, commandText,oldName) {

    const parts = commandText.split(' ');
  
    const newName = parts.slice(1).join(' ').trim().replace(/[^a-zA-Z0-9]/g, '');

     if (newName.length < 3) {
      io.to(socket).emit('nachricht', '<span class="user-action">Benutzername muss mindestens 3 Zeichen und maximal 9 Zeichen haben.</span>');
      return;
    }

    if (newName.length > 9) {
      io.to(socket).emit('nachricht', '<span class="user-action">Benutzername darf maximal 9 Zeichen haben.</span>');
      return;
    }
    if (isNameTaken(newName)) {
      io.to(socket).emit('nachricht', '<span class="user-action">Benutzername ist bereits vergeben. Bitte wähle einen anderen oder logge dich mit /login <name> <passwort> ein.</span></span>');
      return;
    }
    
    logToFile(`Benutzername geändert von ${oldName} zu ${newName}`);
    userNames[socket] = newName;
    io.emit('nachricht', `<span class="user-action">${oldName} hat seinen Benutzernamen auf ${newName} geändert.</span>`);   
  }

  function privateMessage(commandText, socket) {
    const parts = commandText.split(' ');
    if (parts.length < 3) {
      io.to(socket).emit('nachricht', '<span class="user-action">Bitte gib einen Benutzernamen und eine Nachricht an. zB.: /msg Max Hallo</span>');
      return;
    }
    const targetUser = parts[1];
    const message = parts.slice(2).join(' ').trim();

    let userFound = false;
    for (const [id, name] of Object.entries(userNames)) {
      if (name.toLowerCase() === targetUser.toLowerCase()) {
        const privateMsg = `<span class="user-name" style="color:${userColors[socket]};">🔒[PN] ${userNames[socket]}</span> 
                            <span class="time">[${getCurrentTime()}]</span> <span class="privateMSG">${escapeHtml(message)}</span>`;
        io.to(id).emit('nachricht', privateMsg);
        io.to(socket).emit('nachricht', `<span class="user-action">Nachricht an ${targetUser} gesendet: </span><br>${privateMsg}`);
        logToFile(`Private Nachricht von ${socket} an ${targetUser}: ${message}`);
        userFound = true;
        break;
      }      
    }
  if (!userFound) {
    io.to(socket).emit('nachricht', `<span class="user-action">Benutzer ${targetUser} nicht gefunden.</span>`);
  }
  }
  
  function showUserList(socket) {
    let userList = '<span class="user-action">Aktive Benutzer:</span><br>';
    // Zeige die Administratoren zuerst an
    
    for (const [id, name] of Object.entries(userNames)) {
      if (admins[name]) {
        userList += `<span class="user-name" style="color:${userColors[id]}">@${name}</span><br>`;
      }
    }


    for (const [id, name] of Object.entries(userNames)) {
      if (!admins[name]){
        userList += `<span class="user-name" style="color:${userColors[id]}">${name}</span><br>`;
      }
    }
    io.to(socket).emit('nachricht', userList);
    logToFile(`Benutzerliste angefordert von ${userNames[socket]}`);
  }

  function createUser(commandText, socket) {
    const parts = commandText.split(' ');
    if (parts.length < 3) {
      io.to(socket).emit('nachricht', '<span class="user-action">Bitte gib ein Passwort an. zB.: /createUser &kt;passwort&gt; &kt;passwort wiederholen&gt;</span>');
      return;
    }
    const password = parts[1].trim();
    const passwordRepeat = parts[2].trim();

    if (password !== passwordRepeat) {
      io.to(socket).emit('nachricht', '<span class="user-action">Passwörter stimmen nicht überein. Bitte versuche es erneut.</span>');
      return;
    }
    
    if (password.length < 8) {
      io.to(socket).emit('nachricht', '<span class="user-action">Passwort muss mindestens 8 Zeichen lang sein.</span>');
      return;
    }
    if (password.length > 20) {
      io.to(socket).emit('nachricht', '<span class="user-action">Passwort darf maximal 20 Zeichen lang sein.</span>');
      return;
    }
    if (parts[1] !== parts[2]) {
      io.to(socket).emit('nachricht', '<span class="user-action">Passwörter stimmen nicht überein. Bitte versuche es erneut.</span>');
      return;
    }

    if (!db.prepare('SELECT name FROM users WHERE LOWER(name) = ?').get(userNames[socket].toLowerCase())) {

    // Benutzer in der Datenbank speichern
    const passwordHASH = bcrypt.hashSync(password, saltRounds);
    const ip = io.sockets.sockets.get(socket).handshake.address;
    const userEntry = db.prepare('INSERT INTO users (name, password, last_ip) VALUES (?, ?, ?)');
    userEntry.run(userNames[socket], passwordHASH, ip);
  
    
    io.to(socket).emit('nachricht', `<span class="user-action">Benutzer ${userNames[socket]} wurde erfolgreich erstellt.</span>`);
    logToFile(`Neuer Benutzer erstellt: ${userNames[socket]}`);
    }
    else {
      io.to(socket).emit('nachricht', `<span class="user-action">Benutzername ${userNames[socket]} ist bereits vergeben. Bitte wähle einen anderen.</span>`); 
    }
   }

  function loginUser(commandText, socket) {
    const parts = commandText.split(' ');
    if (parts.length < 3) {
      io.to(socket).emit('nachricht', '<span class="user-action">Bitte gib einen Benutzernamen und ein Passwort an. zB.: /login &lt;Benutzername&gt; &lt;Passwort&gt;</span>');
      return;
      }
    const username = parts[1].trim();
    const password = parts[2].trim();

    if (userNames.includes(username)) {
      io.to(socket).emit('nachricht', `<span class="user-action">Du bist bereits eingeloggt als ${userNames[socket]}.</span>`);
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(name) = ?').get(username.toLowerCase());
    
    if (user && bcrypt.compareSync(password, user.password)) {
      if (user.banned) {
        io.to(socket).emit('nachricht', '<span class="user-action">Du wurdest gebannt und kannst dich nicht einloggen.</span>');
        logToFile(`Versuchter Login eines gebannten Benutzers: ${username} von IP ${io.sockets.sockets.get(socket).handshake.address}`);
        bannedIPs.push(io.sockets.sockets.get(socket).handshake.address);
        return;
      }
      const ip= io.sockets.sockets.get(socket).handshake.address;
      userNames[socket] = user.name;
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP, last_ip = ? WHERE name = ?').run(ip, user.name);
      io.to(socket).emit('nachricht', `<span class="user-action">Willkommen zurück, ${userNames[socket]}!</span>`);
      io.emit('nachricht', `<span class="user-action">${userNames[socket]} hat sich eingeloggt.</span>`);
      logToFile(`Benutzer ${userNames[socket]} eingeloggt von IP ${ip} Socket-ID: ${socket.id}`);

      if (user.admin) {
        // Füge den Benutzernamen zur Admin-Liste hinzu
        admins[socket] = true;
        admins[userNames[socket]] = true; 
        io.to(socket).emit('nachricht', '<span class="user-action">Du bist als Administrator eingeloggt.</span>');
        io.emit('Nachricht', `<span class="user-action">${userNames[socket]} hat sich als Administrator eingeloggt.</span>`);
        logToFile(`Benutzer ${userNames[socket]} ist Administrator und hat sich eingeloggt.`);
      } 
    } else {
      io.to(socket).emit('nachricht', '<span class="user-action">Ungültiger Benutzername oder falsches Passwort.</span>');
    }
    }

    function lastLogin(commandText, socket) {
      const parts = commandText.split(' ');
      if (parts.length < 2) {
        io.to(socket).emit('nachricht', '<span class="user-action">Bitte gib einen Benutzernamen an, dessen letztes Login du sehen möchtest. zB.: /lastLogin Max</span>');
        return;
      }
      if (parts[1] === undefined || parts[1].trim() === '') {
        io.to(socket).emit('nachricht', '<span class="user-action">Bitte gib einen Benutzernamen an, dessen letztes Login du sehen möchtest. zB.: /lastLogin Max</span>');
        return; 
      }
      const targetUser = parts[1].trim();
      const user = db.prepare('SELECT last_login FROM users WHERE LOWER(name) = ?').get(targetUser.toLowerCase());
      if (user) {
        const lastLoginTime = user.last_login ? new Date(user.last_login).toLocaleString() : 'Nie';
        io.to(socket).emit('nachricht', `<span class="user-action">Letztes Login von ${targetUser}: ${lastLoginTime}</span>`);
        logToFile(`Letztes Login von ${targetUser} abgefragt von ${userNames[socket]}`);
      }
      else {
        io.to(socket).emit('nachricht', `<span class="user-action">Benutzer ${targetUser} nicht gefunden.</span>`);
      }
    }

    function changePassword(commandText, socket) {
      const parts = commandText.split(' ');
      if (parts.length < 4) {
        io.to(socket).emit('nachricht', '<span class="user-action">Bitte gib dein altes Passwort, neues Passwort und neues Passwort wiederholen an. zB.: /changePassword &lt;altes Passwort&gt; &lt;neues Passwort&gt; &lt;neues Passwort wiederholen&gt;</span>');
        return;}
      
      const oldPassword = parts[1].trim();
      const newPassword = parts[2].trim();
      const newPasswordRepeat = parts[3].trim();

      if (newPassword !== newPasswordRepeat) {
        io.to(socket).emit('nachricht', '<span class="user-action">Die neuen Passwörter stimmen nicht überein. Bitte versuche es erneut.</span>');
        return;}

      const user = db.prepare('SELECT * FROM users WHERE LOWER(name) = ?').get(userNames[socket].toLowerCase());
      if (user && bcrypt.compareSync(oldPassword, user.password)) {
        if (newPassword.length < 8) {
          io.to(socket).emit('nachricht', '<span class="user-action">Das neue Passwort muss mindestens 8 Zeichen lang sein.</span>');
          return;}
        if (newPassword.length > 20) {
          io.to(socket).emit('nachricht', '<span class="user-action">Das neue Passwort darf maximal 20 Zeichen lang sein.</span>');
          return;}
      const newPasswordHash = bcrypt.hashSync(newPassword, saltRounds);
      db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE LOWER(name) = ?').run(newPasswordHash, userNames[socket].toLowerCase());
      logToFile(`Passwort für ${userNames[socket]} geändert.`);
      } else {
        io.to(socket).emit('nachricht', '<span class="user-action">Das alte Passwort ist falsch. Bitte versuche es erneut.</span>');
        logToFile(`Passwortänderung fehlgeschlagen für ${userNames[socket]}: Falsches altes Passwort.`);
        return;
      }
    }
      


// ----------------- Hauptfunktion getCommand -------------------


  switch (true) {
    case commandText.startsWith('/help'):
      showHelp(socket);
      break;
    case commandText.startsWith('/name'):
      register(socket, commandText, userNames[socket]);
      break;
    case commandText.startsWith('/msg'):
      privateMessage(commandText, socket);
      break;
    case commandText.startsWith('/userlist'):
      showUserList(socket);
      break;
    case commandText.startsWith('/createUser'):
      createUser(commandText, socket);
      break;
    case commandText.startsWith('/login'):
      loginUser(commandText, socket);
      break;
    case commandText.startsWith('/lastLogin'):
      lastLogin(commandText, socket);
      break;
    case commandText.startsWith('/deleteMe'):
      deleteUserFromDB(userNames[socket], socket);  
      break;
    default:
      if (admins[userNames[socket]] !== undefined) {
        getAdminCommand(commandText, socket);}
      else {
        io.to(socket).emit('nachricht', '<span class="user-action">Unbekannter Befehl. Tippe /help für Hilfe.</span>');
        break;}
  }
  }
  
  

// ----------------------Main--------------------
// ANCHOR Main

// SQLite-Tabelle für Benutzernamen, Passworthashes und Benutzerdaten
// erstellen, falls sie nicht existieren
db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  password TEXT,
  admin INTEGER DEFAULT 0,
  banned INTEGER DEFAULT 0,
  last_ip TEXT,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`).run();


// Verzeichnis für statische Dateien einbinden:
app.use(express.static(path.join(__dirname, 'public')));

//Template-Engine (Handlebars) einbinden:
app.engine('handlebars', exphbs.engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts')
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Routen für Handlebars
app.get('/', (req, res) => {
  res.render('chat', {
    title: title,
    topic: topic,
  });
});

//cookie-Parser Middleware
let sessionRestore = false;
io.use((socket, next) => {
  if (socket.handshake.headers.cookie) {
    const cookies = cookie.parse(socket.handshake.headers.cookie);
    const oldSocketId = cookies.socketid;

    if (oldSocketId && disconnectedUsers[oldSocketId]) {
      logToFile(`Cookie gefunden: ${oldSocketId} mit Benutzername ${disconnectedUsers[oldSocketId]}`);
      socket.clientId = oldSocketId; // zum späteren Zugriff speichern
      sessionRestore = true;
      logToFile(`Wiederherstellung der Sitzung für ${socket.id} mit Benutzername ${disconnectedUsers[oldSocketId]}`);
      userNames[socket.id] = disconnectedUsers[oldSocketId];
      userColors[socket.id] = userColors[oldSocketId];
      delete disconnectedUsers[oldSocketId];
    } else {
      logToFile(`Cookie gefunden, aber Benutzername nicht in disconnectedUsers: ${oldSocketId}`);
    }
  }
  next();
});

// Socket.IO initialisieren
io.on('connection', (socket) => {
  if (!userNames[socket.id]) {
  userNames[socket.id] = generateRandomUsername();
  userColors[socket.id] = Colors[Math.floor(Math.random() * Colors.length)];
  io.emit('nachricht', `<span class="user-action">${userNames[socket.id]} hat den Chat betreten.</span>`);
  io.to(socket.id).emit ('nachricht', `<span class="user-action">Willkommen, ${userNames[socket.id]}!<span>
                         <span class="secretMsg">Tippe: '/name &lt;dein Name&gt;' um deinen Namen zu ändern oder 
                         /help für den Hilfe-Dialog.</span>`);
  logToFile('Neuer Benutzer verbunden: ' + userNames[socket.id] + ' mit ID: ' + socket.id + ' IP: ' + socket.handshake.address);
  io.to(socket.id).emit('system', `setCookie:${socket.id}`);}


  // Event-Handler für Nachrichten
  socket.on('nachricht', (text) => {
    let ip = socket.handshake.address;
    if (userBanned[socket.id] || bannedIPs.includes(ip) && !admins[socket.id]) {
        io.to(socket.id).emit('nachricht', '<span class="user-action">Du wurdest gebannt und kannst keine Nachrichten senden.</span>');
    }
    else {
          if (text[0] === '/') {
            io.to(socket.id).emit('system', `setCookie:${socket.id}`);
            getCommand(text, socket.id);
          } 
          else { 
            let chatMsg = '<span class="user-name" style="color:' + userColors[socket.id] + ';">'
                          + userNames[socket.id] + '</span>'
                          +' <span class=time>[' 
                          + getCurrentTime() + '] </span> ' 
                          + escapeHtml(text);
            io.emit('nachricht',  chatMsg);
            io.to(socket.id).emit('system', `setCookie:${socket.id}`);
            logToFile(`Nachricht von ${userNames[socket.id]}: ${text}`);
    }}
  });


  // Verbindung trennen
  socket.on('disconnect', () => {
    if (userNames[socket.id]) {
      io.emit('nachricht', `<span class="user-action">${userNames[socket.id]} hat den Chat verlassen.</span>`);
      logToFile(`Benutzer ${userNames[socket.id]} hat den Chat verlassen.`);
      disconnectedUsers[socket.id] = userNames[socket.id];
      disconnectedUsers[userNames[socket.id]] = socket.id;
      delete userNames[socket.id];
      delete userColors[socket.id];
    }
  });
});

// Start
server.listen(port, '0.0.0.0', () => {
  logToFile(`Server läuft auf http://localhost:${port}`);
});

