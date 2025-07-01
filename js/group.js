import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase 설정
const SUPABASE_URL = 'https://iujkvqdslefxilrnwtrz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1amt2cWRzbGVmeGlscm53dHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNjYzNjgsImV4cCI6MjA2Njk0MjM2OH0.1y9L8G9qQ2fHplS7vKxuOKE69Ni5duRplE8GChsoUec';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 쿠키 처리
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

// 모달 관련
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
window.loadSiblings = loadSiblings;

window.addEventListener('click', e => {
  const modal = document.getElementById('apiKeyModal');
  if (e.target === modal) closeApiKeyModal();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeApiKeyModal();
});

// 레이드 목록 정의
const RAID_LIST = [
  { id: 'morodoom_hard', name: '3막 모르둠', diff: '하드' },
  { id: 'morodoom_normal', name: '3막 모르둠', diff: '노말' },
  { id: 'abrelshud_hard', name: '2막 아브렐', diff: '하드' },
  { id: 'abrelshud_normal', name: '2막 아브렐', diff: '노말' },
  { id: 'egir_hard', name: '1막 에기르', diff: '하드' },
  { id: 'egir_normal', name: '1막 에기르', diff: '노말' },
  { id: 'ekidna_hard', name: '서막 에키드나', diff: '하드' },
  { id: 'ekidna_normal', name: '서막 에키드나', diff: '노말' },
  { id: 'behemoth_normal', name: '베히모스', diff: '노말' },
];

// 메인 캐릭터 검색 및 테이블 출력
export async function loadSiblings(event) {
  if (event.key !== 'Enter') return;

  const keyword = event.target.value.trim();
  const apiKey = getCookie('LOA_API_KEY');
  if (!apiKey) return alert('먼저 API KEY를 입력해주세요.');
  if (!keyword) return alert('닉네임을 입력해주세요.');

  const res = await fetch(`https://developer-lostark.game.onstove.com/characters/${encodeURIComponent(keyword)}/siblings`, {
    headers: { Authorization: `bearer ${apiKey}` }
  });
  const allChars = await res.json();

  const characters = allChars
    .map(c => ({ name: c.CharacterName, ilvl: parseFloat(c.ItemAvgLevel.replace(/,/g, '')) }))
    .filter(c => c.ilvl >= 1640)
    .sort((a, b) => b.ilvl - a.ilvl);

  const userToken = getUserToken(keyword);
  const { data: saved } = await supabase
    .from('raid_status')
    .select('*')
    .eq('user_token', userToken);

  renderTable(characters, saved || []);
}

// 유저 식별 토큰 (캐릭터명 기반)
function getUserToken(name) {
  return `USER_${name.toLowerCase()}`;
}

// 테이블 렌더링
function renderTable(characters, saved) {
  const container = document.querySelector('.results');
  const raidGroups = groupRaidsByName(RAID_LIST);

  // 상단 헤더 구성 (2줄)
  const thead1 = document.createElement('tr');
  const thead2 = document.createElement('tr');
  thead1.innerHTML = `<th rowspan="2">캐릭터</th>`;
  Object.keys(raidGroups).forEach(name => {
    const count = raidGroups[name].length;
    thead1.innerHTML += `<th colspan="${count}">${name}</th>`;
    raidGroups[name].forEach(r => {
      thead2.innerHTML += `<th>${r.diff}</th>`;
    });
  });

  const thead = document.createElement('thead');
  thead.appendChild(thead1);
  thead.appendChild(thead2);

  // 바디 구성
  const tbody = document.createElement('tbody');
  characters.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.name}</td>`;
    RAID_LIST.forEach(raid => {
      const td = document.createElement('td');
      td.classList.add('raid-cell');
      td.dataset.char = c.name;
      td.dataset.raid = raid.id;

      const matched = saved.find(s => s.character_name === c.name && s.raid_id === raid.id);
      if (matched) {
        if (matched.cleared) td.classList.add('selected-cleared');
        else if (matched.difficulty === '하드') td.classList.add('selected-hard');
        else if (matched.difficulty === '노말') td.classList.add('selected-normal');
      }

      td.addEventListener('click', () => {
        td.classList.remove('selected-normal', 'selected-hard', 'selected-cleared');
        if (td.dataset.state === 'normal') {
          td.dataset.state = 'hard';
          td.classList.add('selected-hard');
        } else if (td.dataset.state === 'hard') {
          td.dataset.state = 'cleared';
          td.classList.add('selected-cleared');
        } else {
          td.dataset.state = 'normal';
          td.classList.add('selected-normal');
        }
      });

      tbody.appendChild(tr);
      tr.appendChild(td);
    });
  });

  const table = document.createElement('table');
  table.className = 'raid-table';
  table.appendChild(thead);
  table.appendChild(tbody);

  // 저장 버튼
  const saveBtn = document.createElement('button');
  saveBtn.textContent = '저장하기';
  saveBtn.className = 'save-button';
  saveBtn.onclick = () => saveRaidStatus(characters);

  container.innerHTML = '';
  container.appendChild(table);
  container.appendChild(saveBtn);
}

function groupRaidsByName(list) {
  const map = {};
  list.forEach(r => {
    if (!map[r.name]) map[r.name] = [];
    map[r.name].push(r);
  });
  return map;
}

// 저장 처리
async function saveRaidStatus(characters) {
  const userToken = getUserToken(characters[0].name);
  const data = [];

  document.querySelectorAll('.raid-cell').forEach(cell => {
    const char = cell.dataset.char;
    const raid = cell.dataset.raid;

    let val = null;
    if (cell.classList.contains('selected-cleared')) val = '완료';
    else if (cell.classList.contains('selected-hard')) val = '하드';
    else if (cell.classList.contains('selected-normal')) val = '노말';
    else return;

    data.push({
      character_name: char,
      raid_id: raid,
      difficulty: val,
      cleared: val === '완료',
      user_token: userToken
    });
  });

  await supabase.from('raid_status').delete().eq('user_token', userToken);
  await supabase.from('raid_status').insert(data);

  alert('저장 완료');
}
