// group.js 최상단에 추가
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabase = createClient('https://iujkvqdslefxilrnwtrz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1amt2cWRzbGVmeGlscm53dHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNjYzNjgsImV4cCI6MjA2Njk0MjM2OH0.1y9L8G9qQ2fHplS7vKxuOKE69Ni5duRplE8GChsoUec');

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


const RAID_BY_LEVEL = [
  { min: 1700, raids: ['3막(모르둠) 하드', '2막(아브) 하드', '1막(에기르) 하드'] },
  { min: 1690, raids: ['3막(모르둠) 노말', '2막(아브) 하드', '1막(에기르) 하드'] },
  { min: 1680, raids: ['3막(모르둠) 노말', '2막(아브) 노말', '1막(에기르) 하드'] },
  { min: 1670, raids: ['2막(아브) 노말', '1막(에기르) 노말', '서막(에키드나) 하드', '베히모스'] },
  { min: 1660, raids: ['1막(에기르) 노말', '서막(에키드나) 하드', '베히모스'] },
  { min: 1640, raids: ['서막(에키드나) 하드', '베히모스'] }
];


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
function getRaidsByItemLevel(ilvl) {
  for (const tier of RAID_BY_LEVEL) {
    if (ilvl >= tier.min) return tier.raids;
  }
  return [];
}

// 최초 방문 시 고유한 userToken을 쿠키로 저장
if (!getCookie('USER_TOKEN')) {
  const uid = crypto.randomUUID();
  setCookie('USER_TOKEN', uid, 30);
}
const userToken = getCookie('USER_TOKEN');

const raidPresets = [
  { ilvl: 1700, raids: ['모르둠|하드', '아브렐슈드|하드', '에기르|하드'] },
  { ilvl: 1690, raids: ['모르둠|노말', '아브렐슈드|하드', '에기르|하드'] },
  { ilvl: 1680, raids: ['모르둠|노말', '아브렐슈드|노말', '에기르|하드'] },
  { ilvl: 1670, raids: ['아브렐슈드|노말', '에기르|노말', '에키드나|하드', '베히모스'] },
  { ilvl: 1660, raids: ['에기르|노말', '에키드나|하드', '베히모스'] },
  { ilvl: 1640, raids: ['에키드나|하드', '베히모스'] },
];


function renderCharacters(characters, userToken) {
  const container = document.getElementById('characterList');
  container.innerHTML = '';

  characters.sort((a, b) => parseFloat(b.ItemAvgLevel.replace(/,/g, '')) - parseFloat(a.ItemAvgLevel.replace(/,/g, '')));

  characters.forEach(character => {
    const ilvl = parseFloat(character.ItemAvgLevel.replace(/,/g, ''));
    const raidGroup = raidPresets.find(preset => ilvl >= preset.ilvl);
    if (!raidGroup) return;

    const raidHtml = raidGroup.raids.map((r, i) => {
      const [name, mode] = r.split('|');
      return `
        <div class="raid-row">
          <span class="raid-name">${name}</span>
          <div class="raid-toggle" data-char="${character.CharacterName}" data-raid="${name}">
            <button class="toggle-btn" data-value="노말">노말</button>
            <button class="toggle-btn" data-value="하드">하드</button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML += `
      <div class="char-card" data-char="${character.CharacterName}">
        <h3>${character.CharacterName} <span class="ilvl">(${character.ItemAvgLevel})</span></h3>
        ${raidHtml}
      </div>
    `;
  });

  // 토글 버튼 이벤트 바인딩
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const wrapper = e.target.closest('.raid-toggle');
      wrapper.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
      e.target.classList.add('selected');
    });
  });
}

async function saveAllRaidStatus() {
  const userToken = getCookie('USER_TOKEN');
  const records = [];

  document.querySelectorAll('.char-card').forEach(card => {
    const charName = card.dataset.char;
    const toggles = card.querySelectorAll('.raid-toggle');

    toggles.forEach(toggle => {
      const raid = toggle.dataset.raid;
      const selected = toggle.querySelector('.toggle-btn.selected');
      if (selected) {
        records.push({
          character_name: charName,
          raid_id: `${raid}|${selected.dataset.value}`,
          cleared: false,
          user_token: userToken
        });
      }
    });
  });

  if (records.length === 0) {
    alert('선택된 레이드가 없습니다.');
    return;
  }

  await supabase.from('raid_status').delete().eq('user_token', userToken);
  await supabase.from('raid_status').insert(records);
  alert('레이드 상태가 저장되었습니다.');
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
window.saveAllRaidStatus = saveAllRaidStatus;