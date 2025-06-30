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


window.addEventListener('click', (e) => {
  const modal2 = document.getElementById('apiKeyModal');
  if (e.target === modal2) closeApiKeyModal();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeApiKeyModal();
  }
});

window.showApiKeyModal = showApiKeyModal;
window.closeApiKeyModal = closeApiKeyModal;
window.saveApiKey = saveApiKey;




let groupData = {}; // 모든 사용자 데이터

function submitRaidData() {
  const name = document.getElementById('userName').value.trim();
  if (!name) return alert('닉네임을 입력해주세요');

  const raidInputs = document.querySelectorAll('#raid-list input[type=checkbox]');
  const raids = {};
  raidInputs.forEach(input => {
    raids[input.value] = !input.checked; // 체크 시 클리어로 간주
  });

  groupData[name] = { name, raids };

  renderCommonRaids();
}

function renderCommonRaids() {
  const allRaids = Object.keys(groupData[Object.keys(groupData)[0]].raids || {});
  const remainingRaids = allRaids.filter(raid =>
    Object.values(groupData).every(user => user.raids[raid] === false)
  );

  const ul = document.getElementById('common-raids');
  ul.innerHTML = remainingRaids.map(r => `<li>${r}</li>`).join('');
}

function renderCharacters(characters, userName) {
  const container = document.getElementById('character-container');
  container.innerHTML = '';

  characters.forEach(char => {
    const charId = `${userName}_${char.CharacterName}`;
    const raidHtml = RAID_LIST.map(r => `
      <label><input type="checkbox" data-user="${userName}" data-char="${char.CharacterName}" value="${r}"> ${r}</label>
    `).join('<br>');

    const html = `
      <div class="character-card">
        <div class="char-header">
          <strong>${char.CharacterName}</strong>
          <span>${char.ItemMaxLevel}</span>
        </div>
        <div class="char-raids">${raidHtml}</div>
      </div>
    `;
    container.innerHTML += html;
  });
}

async function loadSiblings(event) {
  if (event.key === 'Enter') {
    const keyword = event.target.value.trim();
    const apiKey = getCookie('LOA_API_KEY');
    if (!keyword) return;

    if (!apiKey) {
      alert("먼저 API KEY를 입력해주세요.");
      return;
    }

    const characterName = document.getElementById('searchInput').value.trim();
    if (!characterName) return alert('닉네임을 입력해주세요.');

    const url = `https://developer-lostark.game.onstove.com/characters/${encodeURIComponent(characterName)}/siblings`;
    const headers = { Authorization: `bearer ${apiKey}` };

    const res = await fetch(url, { headers });
    const characters = await res.json();

    const filtered = characters.filter(c => {
      const ilvl = parseFloat(c.ItemAvgLevel.replace(/,/g, ''));
      return ilvl >= 1640;
    });

    renderCharacters(filtered, characterName);
  }
}

window.loadSiblings = loadSiblings;