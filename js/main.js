import { showCharacterDetails } from './api.js';
import { jobIconMap } from './icons.js';

function handleSearch(event) {
  if (event.key === 'Enter') {
    const keyword = event.target.value.trim();
    const apiKey = getCookie('LOA_API_KEY');
    if (!keyword) return;

    if (!apiKey) {
      alert("먼저 API KEY를 입력해주세요.");
      return;
    }

    window.location.href = `/web/?q=${encodeURIComponent(keyword)}`;
  }
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function fetchCharacters(keyword) {
  const apiKey = getCookie('LOA_API_KEY');
  if (!apiKey) return;

  fetch(`https://developer-lostark.game.onstove.com/characters/${keyword}/siblings`, {
    headers: {
      'Authorization': `bearer ${apiKey}`,
    },
  })
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) return;

      const grouped = {};
      data.forEach(char => {
        const server = char.ServerName;
        const level = parseFloat(char.ItemMaxLevel.replace(/,/g, ''));
        if (!grouped[server]) grouped[server] = [];
        grouped[server].push({
          name: char.CharacterName,
          job: char.CharacterClassName,
          level,
        });
      });

      const sortedServers = Object.keys(grouped).sort((a, b) => grouped[b].length - grouped[a].length);

      const results = document.querySelector('.results');
      results.innerHTML = '';

      sortedServers.forEach(server => {
        const group = grouped[server].sort((a, b) => b.level - a.level);
        const section = document.createElement('section');
        section.classList.add('server-group');

        const title = document.createElement('h2');
        title.textContent = server;
        section.appendChild(title);

        const container = document.createElement('div');
        container.classList.add('card-container');

        group.forEach(({ name, job, level }) => {
          const card = document.createElement('div');
          card.classList.add('card');
          card.addEventListener('click', () => showCharacterDetails(name));

          const img = document.createElement('img');
          img.src = jobIconMap[job] || '';

          const info = document.createElement('div');
          info.classList.add('info');

          const charName = document.createElement('div');
          charName.classList.add('name');
          charName.textContent = name;

          const itemLevel = document.createElement('div');
          itemLevel.classList.add('itemLevel');
          itemLevel.textContent = `${level.toLocaleString()} 레벨`;

          info.appendChild(charName);
          info.appendChild(itemLevel);

          card.appendChild(img);
          card.appendChild(info);
          container.appendChild(card);
        });

        section.appendChild(container);
        results.appendChild(section);
      });
    });
}

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function showApiKeyModal() {
  document.getElementById('apiKeyModal').style.display = 'flex';
}

function closeApiKeyModal() {
  document.getElementById('apiKeyModal').style.display = 'none';
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (key) {
    setCookie('LOA_API_KEY', key, 30);
    closeApiKeyModal();
  }
}

function closeCharacterDetailModal() {
  document.getElementById('characterDetailModal').style.display = 'none';
}

window.addEventListener('click', (e) => {
  const modal1 = document.getElementById('characterDetailModal');
  const modal2 = document.getElementById('apiKeyModal');
  if (e.target === modal1) closeCharacterDetailModal();
  if (e.target === modal2) closeApiKeyModal();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCharacterDetailModal();
    closeApiKeyModal();
  }
});

const keyword = getQueryParam('q');
if (keyword) fetchCharacters(keyword);

window.handleSearch = handleSearch;
window.showApiKeyModal = showApiKeyModal;
window.closeApiKeyModal = closeApiKeyModal;
window.saveApiKey = saveApiKey;
window.closeCharacterDetailModal = closeCharacterDetailModal;

