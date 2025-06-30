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
