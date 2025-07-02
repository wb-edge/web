// ---------------- 공통 유틸 ----------------
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';')[0];
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

window.showApiKeyModal = showApiKeyModal;
window.closeApiKeyModal = closeApiKeyModal;
window.saveApiKey = saveApiKey;

window.addEventListener('click', (e) => {
  const modal = document.getElementById('apiKeyModal');
  if (e.target === modal) closeApiKeyModal();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeApiKeyModal();
});

// ---------------- 캐릭터 불러오기 ----------------

const raidRequirements = {
  '모르둠': { normal: 1680, hard: 1700 },
  '아브렐': { normal: 1670, hard: 1690 },
  '에기르': { normal: 1660, hard: 1680 },
  '에키드나': { normal: 1620, hard: 1640 },
  '베히모스': { normal: 1640 }
};

const raidOrder = ['모르둠', '아브렐', '에기르', '에키드나', '베히모스'];

let currentCharacters = [];

window.loadSiblings = async function (event) {
  if (event.key !== 'Enter') return;
  const characterName = document.getElementById('searchInput').value.trim();
  const apiKey = getCookie('LOA_API_KEY');
  if (!characterName || !apiKey) {
    alert('닉네임과 API KEY를 입력해주세요.');
    return;
  }

  const url = `https://developer-lostark.game.onstove.com/characters/${encodeURIComponent(characterName)}/siblings`;
  const headers = { Authorization: `bearer ${apiKey}` };
  const res = await fetch(url, { headers });
  const characters = await res.json();

  currentCharacters = characters
    .map(c => ({
      name: c.CharacterName,
      level: parseFloat(c.ItemAvgLevel.replace(/,/g, ''))
    }))
    .filter(c => c.level >= 1640)
    .sort((a, b) => b.level - a.level);

  renderCharacterTable();
  loadExistingStatus();
};

// ---------------- 테이블 렌더링 ----------------

function renderCharacterTable() {
  const container = document.getElementById('characterList');
  if (!currentCharacters.length) return (container.innerHTML = '');

  let html = '<div id="characterTableContainer"><table class="character-table"><thead><tr><th>레이드</th>';
  currentCharacters.forEach(c => {
    html += `<th>${c.name}<br><span style="font-size:0.8rem;color:#999;">(${c.level})</span></th>`;
  });
  html += '</tr></thead><tbody>';

  raidOrder.forEach(raid => {
    html += `<tr><td>${raid}</td>`;
    currentCharacters.forEach(char => {
      const req = raidRequirements[raid];
      const hard = req.hard ? char.level >= req.hard : false;
      const normal = req.normal ? char.level >= req.normal : false;

      const isBehemoth = raid === '베히모스';

      html += `<td><div class="toggle-group">`;

      if (!isBehemoth) {
        html += `
          <label class="toggle-btn">
            <input type="radio" name="${raid}-${char.name}" value="hard" ${!hard ? 'disabled' : ''}>
            <span>하드</span>
          </label>`;
      }

      html += `
        <label class="toggle-btn">
          <input type="radio" name="${raid}-${char.name}" value="normal" ${!normal ? 'disabled' : ''}>
          <span>노말</span>
        </label>
        <label class="toggle-btn">
          <input type="radio" name="${raid}-${char.name}" value="done">
          <span>완료</span>
        </label>`;

      html += `</div></td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';

  container.innerHTML = html;
}

// ---------------- Supabase 저장 ----------------

const SUPABASE_URL = 'https://iujkvqdslefxilrnwtrz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1amt2cWRzbGVmeGlscm53dHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNjYzNjgsImV4cCI6MjA2Njk0MjM2OH0.1y9L8G9qQ2fHplS7vKxuOKE69Ni5duRplE8GChsoUec';

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function saveAllRaidStatus() {
  const token = getCookie('LOA_API_KEY');
  if (!token) return alert('API KEY가 없습니다.');

  const data = [];

  currentCharacters.forEach(char => {
    raidOrder.forEach(raid => {
      const radios = document.getElementsByName(`${raid}-${char.name}`);
      let selected = '';
      radios.forEach(r => {
        if (r.checked) selected = r.value;
      });
      if (selected) {
        data.push({
          user_token: token,
          character_name: char.name,
          raid_name: raid,
          difficulty: selected
        });
      }
    });
  });

  const { error } = await supabase
    .from('raid_status')
    .delete()
    .eq('user_token', token);

  if (error) {
    console.error('삭제 실패:', error);
    alert('저장 실패(삭제 단계)');
    return;
  }

  const { error: insertError } = await supabase
    .from('raid_status')
    .insert(data);

  if (insertError) {
    console.error('저장 실패:', insertError);
    alert('저장 실패');
  } else {
    alert('레이드 정보가 저장되었습니다!');
  }
}

window.saveAllRaidStatus = saveAllRaidStatus;

// ---------------- 기존 상태 불러오기 ----------------

async function loadExistingStatus() {
  const token = getCookie('LOA_API_KEY');
  if (!token) return;

  const { data, error } = await supabase
    .from('raid_status')
    .select('*')
    .eq('user_token', token);

  if (error || !data || !data.length) return;

  data.forEach(row => {
    const selector = `input[name="${row.raid_name}-${row.character_name}"][value="${row.difficulty}"]`;
    const input = document.querySelector(selector);
    if (input) input.checked = true;
  });
}
