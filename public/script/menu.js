function menuToggle() {
    const menu = document.getElementById('menu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
}

function nameAendern() {
    const usernameInput = document.getElementById('username-input');
    const newUsername = usernameInput.value.trim();
    console.log("Neuer Benutzername:", newUsername);
    if (newUsername) {
        // Schicke Benutzernamen an den Server
        socket.emit('nachricht', `/name ${newUsername}`);
        usernameInput.value = '';
    }
    menuToggle(); // Schliesse das Menü nach der Änderung
}

function login() {
    const loginInput = document.getElementById('login-input');
    const passwordInput = document.getElementById('password-input');
    const username = loginInput.value.trim();
    const password = passwordInput.value.trim();
    console.log("neues Login:", username);
    if (username && password) {
        // Sende Login-Daten an den Server
        socket.emit('nachricht', `/login ${username} ${password}`);
        loginInput.value = '';
        passwordInput.value = '';
    }
    menuToggle(); // Schliesse das Menü nach dem Login
}

function register() {
    const passwordInput1 = document.getElementById('register-password-input1');
    const passwordInput2 = document.getElementById('register-password-input2');
    const password1 = passwordInput1.value.trim();
    const password2 = passwordInput2.value.trim();
    
    console.log("neuer Benutzer registriert");
    if (password1 && password2) {
        // Sende Registrierungsdaten an den Server
        socket.emit('nachricht', `/createUser ${password1} ${password2}`);
        passwordInput1.value = '';
        passwordInput2.value = '';
    }
    menuToggle(); // Schliesse das Menü nach der Registrierung
}

function lastLogin() {
    const lastLoginInput = document.getElementById('last-login-input');
    const lastLogin = lastLoginInput.value.trim();
    
    if (lastLogin) {
        // Sende letzten Login an den Server
        socket.emit('nachricht', `/lastLogin ${lastLogin}`);
        lastLoginInput.value = '';
    }
    menuToggle(); // Schliesse das Menü nach der Eingabe
}

function clean() {
    // Sende Befehl zum Leeren des Chats an den Server
    document.cookie = `socketid=${cookieValue}; path=/`; // Setzt das Cookie mit dem Socket-ID
    location.reload();
    menuToggle(); // Schliesse das Menü nach der Aktion
}

function userlist() {
    // Sende Befehl zum Anzeigen der Benutzerliste an den Server
    socket.emit('nachricht', '/userlist');
    menuToggle(); // Schliesse das Menü nach der Aktion
}

function help() {
    // Sende Befehl zum Anzeigen der Hilfe an den Server
    socket.emit('nachricht', '/help');
    menuToggle(); // Schliesse das Menü nach der Aktion
}   

