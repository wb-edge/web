import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase 초기화
const SUPABASE_URL = 'https://iujkvqdslefxilrnwtrz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1amt2cWRzbGVmeGlscm53dHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNjYzNjgsImV4cCI6MjA2Njk0MjM2OH0.1y9L8G9qQ2fHplS7vKxuOKE69Ni5duRplE8GChsoUec';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 레이드 기준 정보
const RAIDS = [
  { name: '모르둠', hard: 1700, normal: 1680 },
  { name: '아브렐', hard: 1690, normal: 1670 },
  { name: '에기르', hard: 1680, normal: 1660 },
  { name: '에키드나', hard: 1640, normal: 1620 },
  { name: '베히모스', hard: null, normal: 1640 }
];

// 유틸 함수
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 86400000);
  document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/`;
}
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
function getMostRecentResetTime() {
  const now = new Date();
  const utc = new Date(now.toISOString());
  const day = utc.getUTCDay();
  const diff = (day >= 3 ? day - 3 : 7 - (3 - day));
  utc.setUTCDate(utc.getUTCDate() - diff);
  utc.setUTCHours(1, 0, 0, 0); // 한국 수요일 10시 → UTC 1시
  return utc;
}
function isRaidAvailable(ilvl, raid, difficulty) {
  const required = raid[difficulty.toLowerCase()];
  return required ? ilvl >= required : false;
}

// 모달 처리
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
window.showApiKeyModal = showApiKeyModal;
window.closeApiKeyModal = closeApiKeyModal;
window.saveApiKey = saveApiKey;

window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('apiKeyModal')) closeApiKeyModal();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeApiKeyModal();
});

// 캐릭터 불러오기
async function loadSiblings(event) {
  if (event.key !== 'Enter') return;

  const characterName = document.getElementById('searchInput').value.trim();
  const apiKey = getCookie('LOA_API_KEY');
  if (!apiKey) return alert('API KEY를 먼저 입력해주세요');

  const headers = { Authorization: `bearer ${apiKey}` };
  const url = `https://developer-lostark.game.onstove.com/characters/${encodeURIComponent(characterName)}/siblings`;

  const res = await fetch(url, { headers });
  const siblings = await res.json();

  const characters = siblings
    .map(c => ({
      name: c.CharacterName,
      ilvl: parseFloat(c.ItemAvgLevel.replace(/,/g, '')),
    }))
    .filter(c => c.ilvl >= 1640)
    .sort((a, b) => b.ilvl - a.ilvl);

  renderCharacterCards(characters);
  await loadSavedRaidStatus(apiKey);
}

// 카드 렌더링
function renderCharacterCards(characters) {
  const container = document.getElementById('characterList');
  container.innerHTML = '';

  characters.forEach(char => {
    const card = document.createElement('div');
    card.className = 'character-card';

    const title = `<div class="char-header"><strong>${char.name}</strong> <span class="ilvl">${char.ilvl}</span></div>`;

    const raidRows = RAIDS.map(raid => {
      const isHardAvailable = raid.hard && char.ilvl >= raid.hard;
      const isNormalAvailable = raid.normal && char.ilvl >= raid.normal;

      const hardDisabled = !isHardAvailable ? 'disabled' : '';
      const normalDisabled = !isNormalAvailable ? 'disabled' : '';

      const onlyNormal = raid.hard === null;

      return `
        <div class="raid-row">
          <span class="raid-name">${raid.name}</span>
          <div class="toggle-group">
            ${!onlyNormal ? `
              <label class="toggle-btn">
                <input type="radio" name="${char.name}_${raid.name}" value="하드" ${hardDisabled}>
                <span>하드</span>
              </label>` : ''}
            <label class="toggle-btn">
              <input type="radio" name="${char.name}_${raid.name}" value="노말" ${normalDisabled}>
              <span>노말</span>
            </label>
          </div>
        </div>
      `;
    }).join('');

    card.innerHTML = title + raidRows;
    container.appendChild(card);
  });
}

// 저장
async function saveAllRaidStatus() {
  const apiKey = getCookie('LOA_API_KEY');
  if (!apiKey) return alert('API KEY 없음');

  const inputs = document.querySelectorAll('.toggle-btn input:checked');
  const entries = [];

  inputs.forEach(input => {
    const [character_name, raid_name] = input.name.split('_');
    const difficulty = input.value;

    const card = input.closest('.character-card');
    const ilvl = parseFloat(card.querySelector('.ilvl').innerText);

    entries.push({ user_token: apiKey, character_name, raid_name, difficulty, ilvl });
  });

  if (entries.length === 0) return alert('선택 항목이 없습니다.');

  await supabase.from('raid_status').delete().eq('user_token', apiKey);
  const { error } = await supabase.from('raid_status').insert(entries);
  if (error) return alert('저장 실패');

  alert('저장 완료');
  await loadOtherUsers();
}

// 내 데이터 불러오기
async function loadSavedRaidStatus(apiKey) {
  const { data } = await supabase
    .from('raid_status')
    .select('*')
    .eq('user_token', apiKey);

  data?.forEach(row => {
    const selector = `input[name="${row.character_name}_${row.raid_name}"][value="${row.difficulty}"]`;
    const radio = document.querySelector(selector);
    if (radio) radio.checked = true;
  });
}

// 다른 사용자 표시
async function loadOtherUsers() {
  const { data } = await supabase
    .from('raid_status')
    .select('*')
    .order('updated_at', { ascending: false });

  const resetTime = getMostRecentResetTime();
  const recent = data.filter(row => new Date(row.updated_at) >= resetTime);

  const grouped = {};
  recent.forEach(row => {
    if (!grouped[row.user_token]) grouped[row.user_token] = [];
    grouped[row.user_token].push(row);
  });

  const tbody = document.getElementById('user-table-body');
  tbody.innerHTML = '';

  Object.entries(grouped).forEach(([token, list]) => {
    const main = list.sort((a, b) => b.ilvl - a.ilvl)[0];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" data-token="${token}" /></td>
      <td>${main.character_name}</td>
      ${RAIDS.map(raid => {
        const found = list.find(x => x.raid_name === raid.name);
        if (!found) return `<td>-</td>`;
        const cls = found.difficulty === '하드' ? 'hard' : 'normal';
        return `<td><span class="tag ${cls}">${found.difficulty}</span></td>`;
      }).join('')}
    `;
    tbody.appendChild(tr);
  });
}

// 등록
window.loadSiblings = loadSiblings;
window.saveAllRaidStatus = saveAllRaidStatus;
loadOtherUsers();
