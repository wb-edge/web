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

async function fetchSiblingCharacters(characterName) {
  const apiKey = getCookie('LOA_API_KEY');
  if (!apiKey) {
    alert('API KEY가 등록되지 않았습니다.');
    return [];
  }

  try {
    const response = await fetch(`https://developer-lostark.game.onstove.com/characters/${encodeURIComponent(characterName)}/siblings`, {
      headers: { Authorization: `bearer ${apiKey}` }
    });
    if (!response.ok) throw new Error('서버 응답 오류');

    const characters = await response.json(); // 형식: [{ CharacterName: "abc", CharacterClassName: "데모닉", ... }, ...]
    return characters;
  } catch (err) {
    console.error('원정대 캐릭터 조회 실패:', err);
    alert('원정대 캐릭터를 불러오는 데 실패했습니다.');
    return [];
  }
}

async function loadSiblings() {
  const mainChar = document.getElementById('mainCharacter').value.trim();
  if (!mainChar) return alert('대표 캐릭터명을 입력하세요');

  const siblings = await fetchSiblingCharacters(mainChar);
  const ul = document.getElementById('siblingList');
  ul.innerHTML = siblings.map(c => `<li>${c.CharacterName} (${c.CharacterClassName})</li>`).join('');
}

