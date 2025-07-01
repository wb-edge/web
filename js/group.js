import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient('https://YOUR_SUPABASE_URL.supabase.co', 'YOUR_PUBLIC_API_KEY');

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

window.showApiKeyModal = () => document.getElementById('apiKeyModal').style.display = 'flex';
window.closeApiKeyModal = () => document.getElementById('apiKeyModal').style.display = 'none';
window.saveApiKey = () => {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (key) {
    setCookie('LOA_API_KEY', key, 30);
    closeApiKeyModal();
  }
};

window.addEventListener('click', e => {
  if (e.target === document.getElementById('apiKeyModal')) closeApiKeyModal();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeApiKeyModal();
});

const raidInfo = [
  { name: '3막 모르둠', key: 'mordor', levels: { normal: 1680, hard: 1700 } },
  { name: '2막 아브렐', key: 'abrel', levels: { normal: 1670, hard: 1690 } },
  { name: '1막 에기르', key: 'egir', levels: { normal: 1660, hard: 1680 } },
  { name: '서막 에키드나', key: 'ekidna', levels: { normal: 1620, hard: 1640 } },
  { name: '베히모스', key: 'behemoth', levels: { normal: 1640 } }
];

async function loadSiblings(event) {
  if (event.key !== 'Enter') return;

  const nickname = document.getElementById('searchInput').value.trim();
  const apiKey = getCookie('LOA_API_KEY');
  if (!nickname || !apiKey) return alert('닉네임과 API KEY를 입력해주세요.');

  const res = await fetch(`https://developer-lostark.game.onstove.com/characters/${encodeURIComponent(nickname)}/siblings`, {
    headers: { Authorization: `bearer ${apiKey}` }
  });

  const siblings = await res.json();
  const filtered = siblings
    .map(c => ({
      name: c.CharacterName,
      level: parseFloat(c.ItemAvgLevel.replace(/,/g, ''))
    }))
    .filter(c => c.level >= 1640)
    .sort((a, b) => b.level - a.level);

  renderTable(filtered);
}

function renderTable(characters) {
  const table = document.createElement('table');
  table.className = 'raid-table';

  // 헤더
  const thead = document.createElement('thead');
  const headerRow1 = document.createElement('tr');
  const headerRow2 = document.createElement('tr');
  headerRow1.innerHTML = `<th rowspan="2">캐릭터명</th>`;

  raidInfo.forEach(r => {
    const colspan = Object.keys(r.levels).length;
    headerRow1.innerHTML += `<th colspan="${colspan}">${r.name}</th>`;
    Object.keys(r.levels).forEach(type => {
      headerRow2.innerHTML += `<th>${type === 'hard' ? '하드' : '노말'}</th>`;
    });
  });

  thead.appendChild(headerRow1);
  thead.appendChild(headerRow2);
  table.appendChild(thead);

  // 바디
  const tbody = document.createElement('tbody');
  characters.forEach(char => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${char.name}</td>`;

    raidInfo.forEach(raid => {
      ['hard', 'normal'].forEach(type => {
        if (raid.levels[type] !== undefined) {
          const key = `${char.name}_${raid.key}_${type}`;
          const disabled = char.level < raid.levels[type];
          row.innerHTML += `
            <td>
              <label class="toggle-wrapper">
                <input type="checkbox" data-key="${key}" ${disabled ? 'disabled' : ''} />
                <span class="toggle-btn"></span>
              </label>
            </td>`;
        }
      });
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);

  const main = document.querySelector('main');
  main.innerHTML = '';
  main.appendChild(table);

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '저장';
  saveBtn.className = 'save-btn';
  saveBtn.onclick = saveRaidData;
  main.appendChild(saveBtn);

  // 동시 선택 방지
  document.querySelectorAll('input[type=checkbox]').forEach(input => {
    input.addEventListener('change', () => {
      const [char, raid, type] = input.dataset.key.split('_');
      if (input.checked) {
        const otherType = type === 'hard' ? 'normal' : 'hard';
        const otherInput = document.querySelector(`input[data-key="${char}_${raid}_${otherType}"]`);
        if (otherInput) otherInput.checked = false;
      }
    });
  });
}

async function saveRaidData() {
  const inputs = document.querySelectorAll('input[type=checkbox]');
  const data = {};

  inputs.forEach(input => {
    const [char, raid, type] = input.dataset.key.split('_');
    if (!data[char]) data[char] = {};
    if (input.checked) data[char][`${raid}_${type}`] = true;
  });

  // Supabase 저장 예시
  const { error } = await supabase
    .from('raid_checklist')
    .upsert(Object.entries(data).map(([character, raids]) => ({
      character,
      raids
    })));

  if (error) {
    alert('저장 실패');
    console.error(error);
  } else {
    alert('저장되었습니다.');
  }
}

window.loadSiblings = loadSiblings;
