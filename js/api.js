import { jobIconMap } from './icons.js';

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
