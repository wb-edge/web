import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://iujkvqdslefxilrnwtrz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1amt2cWRzbGVmeGlscm53dHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNjYzNjgsImV4cCI6MjA2Njk0MjM2OH0.1y9L8G9qQ2fHplS7vKxuOKE69Ni5duRplE8GChsoUec';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 쿠키 유틸
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(';').shift() : null;
}

// 모달 및 검색
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
function handleSearch(event) {
  if (event.key === 'Enter') {
    const keyword = event.target.value.trim();
    const apiKey = getCookie('LOA_API_KEY');
    if (!keyword) return;
    if (!apiKey) return alert("먼저 API KEY를 입력해주세요.");
    window.location.href = `/web/group/?q=${encodeURIComponent(keyword)}`;
  }
}
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}
function toggleMySection() {
  const el = document.getElementById('characterList');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
function showCompareModal(content) {
  document.getElementById('compareModalContent').textContent = content;
  document.getElementById('compareModal').style.display = 'flex';
}
function closeCompareModal() {
  document.getElementById('compareModal').style.display = 'none';
}

// 글로벌 등록
window.handleSearch = handleSearch;
window.showApiKeyModal = showApiKeyModal;
window.closeApiKeyModal = closeApiKeyModal;
window.saveApiKey = saveApiKey;
window.toggleMySection = toggleMySection;
window.closeCompareModal = closeCompareModal;

const raidDefs = [
  { name: '3막 모르둠', hard: 1700, normal: 1680 },
  { name: '2막 아브렐', hard: 1690, normal: 1670 },
  { name: '1막 에기르', hard: 1680, normal: 1660 },
  { name: '서막 에키드나', hard: 1640, normal: 1620 },
  { name: '베히모스', hard: null, normal: 1640 }
];

let state = {};

async function loadSiblings(name) {
  const apiKey = getCookie('LOA_API_KEY');
  if (!apiKey) return alert('API KEY를 먼저 입력해주세요.');
  if (!name) return;

  const url = `https://developer-lostark.game.onstove.com/characters/${encodeURIComponent(name)}/siblings`;
  const headers = { Authorization: `bearer ${apiKey}` };

  const res = await fetch(url, { headers });
  const list = await res.json();

  const characters = list
    .map(c => ({ name: c.CharacterName, level: parseFloat(c.ItemAvgLevel.replace(/,/g, '')) }))
    .filter(c => c.level >= 1640)
    .sort((a, b) => b.level - a.level);

  state = {};
  characters.forEach(c => {
    state[c.name] = {};
    raidDefs.forEach(r => (state[c.name][r.name] = ""));
  });

  renderTable(characters);
  await loadPreviousData();
  await loadOtherUsersData();
}

function renderTable(characters) {
  const table = document.createElement('table');
  table.className = 'raid-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = `<th>캐릭터명</th>` + raidDefs.map(r => `<th>${r.name}</th>`).join('');
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  characters.forEach(c => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${c.name}</td>` + raidDefs.map(r => {
      const disabledHard = r.hard !== null && c.level < r.hard;
      const disabledNormal = r.normal && c.level < r.normal;

      return `
        <td>
          <div class="raid-toggle">
            ${r.hard !== null ? `<button class="toggle-btn hard ${disabledHard ? 'disabled' : ''}" data-char="${c.name}" data-raid="${r.name}" data-mode="hard">하드</button>` : ''}
            <button class="toggle-btn normal ${disabledNormal ? 'disabled' : ''}" data-char="${c.name}" data-raid="${r.name}" data-mode="normal">노말</button>
          </div>
        </td>`;
    }).join('');
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  const listContainer = document.getElementById('characterList');
  listContainer.innerHTML = '';
  listContainer.appendChild(table);

  // 저장 버튼 상단으로 이동
  const saveBtn = document.getElementById('saveButton');
  if (saveBtn) saveBtn.onclick = saveToDatabase;

  // 버튼 클릭 이벤트
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const char = btn.dataset.char;
      const raid = btn.dataset.raid;
      const mode = btn.dataset.mode;
      if (btn.classList.contains('disabled')) return;

      const otherBtn = document.querySelector(
        `.toggle-btn[data-char="${char}"][data-raid="${raid}"][data-mode="${mode === 'hard' ? 'normal' : 'hard'}"]`
      );
      if (state[char][raid] === mode) {
        state[char][raid] = "";
        btn.classList.remove('active');
      } else {
        state[char][raid] = mode;
        btn.classList.add('active');
        if (otherBtn) otherBtn.classList.remove('active');
      }
    });
  });
}

async function saveToDatabase() {
  const token = getCookie('LOA_API_KEY');
  if (!token) return alert('API KEY가 필요합니다.');

  const { error } = await supabase.from('raid_status').upsert(
    {
      user_token: token,
      data: JSON.stringify(state),
      updated_at: new Date().toISOString()
    },
    { onConflict: ['user_token'] }
  );

  if (!error) alert('저장 완료');
  else alert('저장 실패: ' + error.message);
}

async function loadPreviousData() {
  const token = getCookie('LOA_API_KEY');
  if (!token) return;

  const { data } = await supabase
    .from('raid_status')
    .select('data, updated_at')
    .eq('user_token', token)
    .single();

  if (!data || !data.data) return;

  const parsed = JSON.parse(data.data);
  const updated = new Date(data.updated_at);
  const resetTime = getMostRecentResetTime();
  if (updated < resetTime) return;

  for (const char in parsed) {
    for (const raid in parsed[char]) {
      const mode = parsed[char][raid];
      if (!mode) continue;

      const selector = `.toggle-btn[data-char="${char}"][data-raid="${raid}"][data-mode="${mode}"]`;
      const btn = document.querySelector(selector);
      if (btn) btn.classList.add('active');

      state[char][raid] = mode;
    }
  }
}

function getMostRecentResetTime() {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const day = kstNow.getDay();
  const hour = kstNow.getHours();
  let daysSinceReset = (day + 7 - 3) % 7;
  if (day === 3 && hour < 10) daysSinceReset = 7;
  const kstReset = new Date(kstNow);
  kstReset.setHours(10, 0, 0, 0);
  kstReset.setDate(kstReset.getDate() - daysSinceReset);
  return new Date(kstReset.getTime() - 9 * 60 * 60 * 1000);
}

async function loadOtherUsersData() {
  const token = getCookie('LOA_API_KEY');
  const { data } = await supabase
    .from('raid_status')
    .select('user_token, data, updated_at')
    .neq('user_token', token)
    .order('updated_at', { ascending: false })
    .limit(10);

  const container = document.getElementById('otherUsersData');
  container.innerHTML = '';
  container.dataset.selectedUsers = '';

  data.forEach((user, idx) => {
    const parsed = JSON.parse(user.data);
    const updated = new Date(user.updated_at);
    const kst = new Date(updated.getTime() + 9 * 60 * 60 * 1000);
    const formatted = `${kst.getFullYear()}-${String(kst.getMonth()+1).padStart(2,'0')}-${String(kst.getDate()).padStart(2,'0')} ${String(kst.getHours()).padStart(2,'0')}:${String(kst.getMinutes()).padStart(2,'0')}`;

    const wrapper = document.createElement('div');
    wrapper.className = 'user-raid-block';
    wrapper.dataset.index = idx;
    wrapper.dataset.selected = 'false';

    const titleChar = Object.keys(parsed)[0];

    wrapper.innerHTML = `
      <div class="user-raid-header">
        <span class="title">${titleChar}</span>
        <span class="updated-time">${formatted}</span>
      </div>`;

    const table = buildUserTable(parsed);
    wrapper.appendChild(table);

    wrapper.addEventListener('click', () => {
      wrapper.classList.toggle('selected');
      wrapper.dataset.selected = wrapper.classList.contains('selected') ? 'true' : 'false';
    });

    wrapper.dataset.raw = JSON.stringify(parsed);
    container.appendChild(wrapper);
  });

  document.getElementById('compareSelectedBtn').onclick = () => {
    const selected = [...document.querySelectorAll('.user-raid-block.selected')];
    const otherStates = selected.map(el => JSON.parse(el.dataset.raw));
    compareWithUsers(otherStates);
  };
}

function buildUserTable(userState) {
  const table = document.createElement('table');
  table.className = 'raid-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = raidDefs.map(r => `<th>${r.name} (하드)</th><th>${r.name} (노말)</th>`).join('');
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  const stageCounts = {};
  raidDefs.forEach(raid => {
    stageCounts[raid.name] = { hard: 0, normal: 0 };
  });

  Object.values(userState).forEach(characterData => {
    raidDefs.forEach(raid => {
      const status = characterData[raid.name];
      if (status === 'hard') stageCounts[raid.name].hard++;
      else if (status === 'normal') stageCounts[raid.name].normal++;
    });
  });

  let row = '<tr>';
  raidDefs.forEach(raid => {
    row += `<td class="count-cell">${stageCounts[raid.name].hard}</td><td class="count-cell">${stageCounts[raid.name].normal}</td>`;
  });
  row += '</tr>';
  tbody.innerHTML = row;

  table.appendChild(tbody);
  return table;
}

function compareWithUsers(otherStates) {
  const overlapMap = new Map();
  raidDefs.forEach(r => {
    ['hard', 'normal'].forEach(mode => {
      let myCount = Object.values(state).filter(c => c[r.name] === mode).length;
      if (!myCount) return;
      let minCount = otherStates.reduce((acc, userState) => {
        let userCount = Object.values(userState).filter(c => c[r.name] === mode).length;
        return Math.min(acc, userCount);
      }, Infinity);
      if (minCount > 0) {
        const label = `${r.name} [${mode === 'hard' ? '하드' : '노말'}]`;
        overlapMap.set(label, Math.min(myCount, minCount));
      }
    });
  });

  const result = [...overlapMap.entries()]
    .map(([key, val]) => `${key} : ${val}`)
    .join('\n') || '겹치는 레이드가 없습니다.';

  showCompareModal(result);
}

const keyword = getQueryParam('q');
if (keyword) {
  document.getElementById('searchInput').value = keyword;
  loadSiblings(keyword);
}
