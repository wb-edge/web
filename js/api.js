export function showCharacterDetails(characterName) {
  const apiKey = getCookie('LOA_API_KEY');
  if (!apiKey) return;

  const headers = { 'Authorization': `bearer ${apiKey}` };

  const profileUrl = `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(characterName)}/profiles`;
  const equipmentUrl = `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(characterName)}/equipment`;
  const engravingsUrl = `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(characterName)}/engravings`;
  const gemsUrl = `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(characterName)}/gems`;

  Promise.all([
    fetch(profileUrl, { headers }).then(res => res.json()),
    fetch(equipmentUrl, { headers }).then(res => res.json()),
    fetch(engravingsUrl, { headers }).then(res => res.json()),
    fetch(gemsUrl, { headers }).then(res => res.json())
  ])
    .then(([profile, equipment, engravings, gems]) => {
      const detailContent = document.getElementById('detailContent');
      detailContent.innerHTML = `
        <div class="profile" style="display:flex;align-items:center;gap:10px;">
          <img src="${jobIconMap[profile.CharacterClassName] || ''}" style="width:40px;height:40px;border-radius:4px;" />
          <div style="font-size:1.2rem;font-weight:bold;">${profile.CharacterName}</div>
          <div style="font-size:0.95rem;color:#ccc;">${profile.ItemMaxLevel}</div>
        </div>
      `;

      const equipmentList = document.getElementById('equipmentList');
      equipmentList.innerHTML = `
        <h3>장비</h3>
        <div class="equipment-grid">
          ${equipment.map(item => `
            <div class="equipment-item">
              <img src="${item.Icon}" alt="${item.Name}" />
              <div>${item.Name}</div>
              <div>${item.Grade}</div>
            </div>
          `).join('')}
        </div>
      `;

      const modal = document.getElementById('characterDetailModal');
      modal.style.display = 'flex';
    });
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const jobIconMap = {
  '워로드': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/warlord_m.png',
  '디스트로이어': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/destroyer_m.png',
  '버서커': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/berserker_m.png',
  '홀리나이트': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/holyknight_m.png',
  '슬레이어': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/berserker_female_m.png',
  '인파이터': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/infighter_m.png',
  '배틀마스터': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/battle_master_m.png',
  '기공사': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/force_master_m.png',
  '창술사': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/lance_master_m.png',
  '스트라이커': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/battle_master_male_m.png',
  '브레이커': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/infighter_male_m.png',
  '데빌헌터': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/devil_hunter_m.png',
  '블래스터': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/blaster_m.png',
  '호크아이': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/hawk_eye_m.png',
  '스카우터': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/scouter_m.png',
  '건슬링어': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/devil_hunter_female_m.png',
  '아르카나': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/arcana_m.png',
  '서머너': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/summoner_m.png',
  '바드': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/bard_m.png',
  '소서리스': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/elemental_master_m.png',
  '데모닉': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/demonic_m.png',
  '블레이드': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/blade_m.png',
  '리퍼': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/reaper_m.png',
  '소울이터': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/soul_eater.png',
  '도화가': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/yinyangshi_m.png',
  '기상술사': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/weather_artist_m.png',
  '환수사': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/alchemist.png',
};
