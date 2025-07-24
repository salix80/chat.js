async function showSmileys() {
  const smileybox = document.getElementById('emoji-container');
    if (smileybox.style.display === 'block') {
        smileybox.style.display = 'none';
        return;
    } else {
        smileybox.style.display = 'block';
    }
  const container = document.getElementById("emoji-container");
  container.innerHTML = ""; // leeren

  try {
    const res = await fetch("script/emojis.json");
    const emojiData = await res.json();

    for (const [category, emojis] of Object.entries(emojiData)) {
      const catDiv = document.createElement("div");
      catDiv.className = "emoji-kategorie";

      const title = document.createElement("h3");
      title.textContent = category.replace(/_/g, " ");
      catDiv.appendChild(title);

      const emojiRow = document.createElement("div");
      emojiRow.className = "emoji-row";

      emojis.forEach((emoji) => {
        const btn = document.createElement("button");
        btn.textContent = emoji;
        btn.className = "emoji-btn";
        btn.onclick = () => insertEmoji(emoji);
        emojiRow.appendChild(btn);
      });

      catDiv.appendChild(emojiRow);
      container.appendChild(catDiv);
    }
  } catch (err) {
    container.innerHTML = "Fehler beim Laden der Emojis.";
    console.error(err);
  }
}

function insertEmoji(emoji) {
  const input = document.getElementById("message-input");
  input.value += emoji;
  showSmileys(); // Schließe die Emoji-Auswahl nach dem Einfügen
  input.focus();
}