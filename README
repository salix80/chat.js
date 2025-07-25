# ChatJS

**ChatJS ist Open Source und ein Lernprojekt, welches zwar funktioniert, aber derzeit nicht auf Produktivsystemen in unkontrollierter Umgebung eingesetzt werden
sollte**

**Geschrieben von Andreas Pfister**
Läuft und getestet auf Node.js v20.10.0
Lizensiert unter GNU General Public License v3.0
SPDX-License-Identifier: GPL-3.0
[[https://www.gnu.org/licenses/gpl-3.0.en.html]]
*Dieses Skript nutzt Comment Anchor in VS Code*

## Beschreibung

Dieses Skript implementiert einen einfachen Chat-Server mit Funktionen wie
Benutzerregistrierung, Login, private Nachrichten, Administratorbefehle und
Ban-Management. Es verwendet Express.js für die Webserver-Funktionalität,
Socket.IO für Echtzeit-Kommunikation und SQLite für die Benutzerdatenbank.

Die Anwendung ist so konzipiert, dass sie auf z.B. einem Raspberry Pi 3B mit
2GB RAM läuft, und bietet eine einfache, benutzerfreundliche Chat-Oberfläche.
Die Benutzer können sich registrieren, einloggen, private Nachrichten senden
und Administratoren können Benutzer verwalten, einschließlich Bannen und
Entbannen von Benutzern. Die Anwendung unterstützt auch die Anzeige des
letzten Logins der Benutzer und ermöglicht es Administratoren, das Chat-Thema
zu ändern.
Die Anwendung ist für den Einsatz in internen vertrauenswürdigen Netzwerken konzipiert
und nicht für den Einsatz im Internet geeignet.
**Benutzung auf eigene Gefahr**

## Installation

1. Node.js (mindestens Version 20.10.0) installieren
2. Projekt klonen:

   ```bash
   git clone https://github.com/salix80/chatjs.git
   cd chatjs
   npm install
   node chat.js
   ```

   Server läuft auf Port 80.

   Mit Browser auf [[http://localhost:80/]]

   Adminlogin: /login admin password* **!!Passwort ändern!!**

## Konfiguration

Einige Variablen am Beginn von chat.js können zum Konfigurieren geändert werden.

* title
* topic
* defaultUserName
* loggingON

## Anleitung

Folgende Befehle können ins Chat Eingabefeld eingegenen werden. Sämtliche Befehle können aber auch
grafisch mittels Menu ausgelöst werden:
/help - Zeigt diese Hilfe an.
/name \<dein Name\> - Ändert deinen Benutzernamen.
/msg \<Benutzername\> \<Nachricht\> - Sendet eine private Nachricht an einen Benutzer.
/userlist - Zeigt eine Liste aller aktiven Benutzer an.
/clean - Leert den Chatverlauf.
/createUser \<passwort\> \<passwort wiederholen\> - Erstellt einen neuen Benutzer mit dem angegebenen Passwort und aktuellen Benutzernamen.
/login \<Benutzername\> \<Passwort\> - Loggt einen Benutzer ein, wenn er bereits existiert.
/lastLogin \<Benutzername\> - Zeigt die Datum und Zeit des letzten Logins eines Benutzers an.
/deleteMe - Löscht deinen registrierten Benutzer.
/changePassword \<altes Passwort\> \<neues Passwort\> \<neues Passwort wiederholen\> - Ändert dein Passwort.

*Als Administrator zusätzlich:*
/ban \<Benutzername\> - Bannt einen Benutzer.
/unban \<Benutzername\> - Hebt den Bann eines Benutzers auf.
/setAdmin \<Benutzername\> - Macht einen Benutzer zum Administrator.
/removeAdmin \<Benutzername\> - Entfernt die Administratorrechte eines Benutzers.
/topic \<neues Thema\> - Ändert das aktuelle Thema des Chats.
/deleteUser \<Benutzername\> - Benutzer aus der Datenbank entfernen.

## Technisches

* Als Datenbank wurde SQLite verwendet
* Passwort wird als Hash (Bcrpt) in der Datenbank gespeichert.
* Skript basiert auf der Grundlage von Express.JS, Handlebar.JS und Socket.IO
* Logdateien befinden sich unter data/log
* Datenbank befindet sich in data/db

## Projektstruktur

* `server.js` – Hauptserver inkl. Websocket-Logik
* `public/` – Statische Dateien (JS, CSS, HTML)
* `views/` – Handlebars-Templates
* `data/db/` – SQLite-Datenbank
* `data/log/` – Logs (Chat-Verlauf, Systemmeldungen)

## Bekannte Schwächen / TODO

* Bessere Fehlerbehandlung im Login/Register
* Session-Handling verbessern
* Logging-Rotation oder -Begrenzung fehlt
* Benutzeraktionen nicht persistent bei Absturz
* Moderation-Tools ausbaubar
* Konfigrierbarkeit ausbauen
