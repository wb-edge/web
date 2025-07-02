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

// API KEY 모달
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

// 토글 가능한 레이드 정보
const raidDefs = [
  { name: '3막 모르둠', hard: 1700, normal: 1680 },
  { name: '2막 아브렐', hard: 1690, normal: 1670 },
  { name: '1막 에기르', hard: 1680, normal: 1660 },
  { name: '서막 에키드나', hard: 1640, normal: 1620 },
  { name: '베히모스', hard: null, normal: 1640 }
];

// 현재 상태
let state = {}; // { 캐릭터명: { 레이드명: "hard"|"normal"|"" } }

// 캐릭터 검색
async function loadSiblings(event) {
  if (event.key !== 'Enter') return;

  const apiKey = getCookie('LOA_API_KEY');
  if (!apiKey) return alert('API KEY를 먼저 입력해주세요.');
  const name = document.getElementById('searchInput').value.trim();
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
    raidDefs.forEach(r => state[c.name][r.name] = "");
  });

  renderTable(characters);
  await loadPreviousData();
}

function renderTable(characters) {
  const table = document.createElement('table');
  table.className = 'raid-table';

  // 헤더
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = `<th>캐릭터명</th>` + raidDefs.map(r => `<th>${r.name}</th>`).join('');
  thead.appendChild(headRow);
  table.appendChild(thead);

  // 바디
  const tbody = document.createElement('tbody');

  characters.forEach(c => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${c.name}</td>` + raidDefs.map(r => {
      const disabledHard = r.hard && c.level < r.hard;
      const disabledNormal = r.normal && c.level < r.normal;

      return `
        <td>
          <div class="raid-toggle">
            <button class="toggle-btn hard ${disabledHard ? 'disabled' : ''}" data-char="${c.name}" data-raid="${r.name}" data-mode="hard">하드</button>
            <button class="toggle-btn normal ${disabledNormal ? 'disabled' : ''}" data-char="${c.name}" data-raid="${r.name}" data-mode="normal">노말</button>
          </div>
        </td>
      `;
    }).join('');

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  document.querySelector('.results').innerHTML = '';
  document.querySelector('.results').appendChild(table);

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '저장';
  saveBtn.className = 'save-button';
  saveBtn.onclick = saveToDatabase;
  document.querySelector('.results').appendChild(saveBtn);

  // 이벤트 바인딩
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const char = btn.dataset.char;
      const raid = btn.dataset.raid;
      const mode = btn.dataset.mode;

      if (btn.classList.contains('disabled')) return;

      const otherBtn = document.querySelector(`.toggle-btn[data-char="${char}"][data-raid="${raid}"][data-mode="${mode === 'hard' ? 'normal' : 'hard'}"]`);

      // 상태 토글
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

  const { error } = await supabase
    .from('raid_status')
    .upsert({
      user_token: token,
      data: JSON.stringify(state),
      updated_at: new Date().toISOString()
    }, { onConflict: ['user_token'] });

  if (!error) alert('저장 완료');
  else alert('저장 실패: ' + error.message);
}

async function loadPreviousData() {
  const token = getCookie('LOA_API_KEY');
  if (!token) return;

  const { data, error } = await supabase
    .from('raid_status')
    .select('data, updated_at')
    .eq('user_token', token)
    .single();

console.log(data);
  if (!data || !data.data) return;

  const updated = new Date(data.updated_at);
  const resetTime = getMostRecentResetTime();
console.log(updated);
console.log(resetTime);
console.log(updated < resetTime);

  if (updated < resetTime) return; // 지난주 데이터면 무시

  const parsed = JSON.parse(data.data);
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
  const day = now.getDay();
  const hour = now.getHours();
  const reset = new Date();
  reset.setHours(10, 0, 0, 0);
  reset.setDate(reset.getDate() - ((day < 3 || (day === 3 && hour < 10)) ? (7 + day - 3) : (day - 3)));
  return reset;
}
