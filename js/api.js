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
        <div class="profile" style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
          <img src="${jobIconMap[profile.CharacterClassName] || ''}" style="width:40px;height:40px;border-radius:4px;" />
          <div style="font-size:1.2rem;font-weight:bold;">${profile.CharacterName}</div>
          <div style="font-size:0.95rem;color:#ccc;">${profile.ItemMaxLevel}</div>
        </div>
      `;

      const gearOrder = ['투구', '어깨', '상의', '하의', '장갑', '무기'];
      const accessoryOrder = ['목걸이', '귀걸이1', '귀걸이2', '반지1', '반지2', '팔찌'];

      const gearItems = [];
      const accessoryItems = [];

      equipment.forEach(item => {
        const name = item.Type;
        if (gearOrder.includes(name)) gearItems.push(item);
        else if (name.includes('목걸이')) accessoryItems.push({ ...item, slot: '목걸이' });
        else if (name.includes('귀걸이')) accessoryItems.push({ ...item, slot: item.Type });
        else if (name.includes('반지')) accessoryItems.push({ ...item, slot: item.Type });
        else if (name.includes('팔찌')) accessoryItems.push({ ...item, slot: '팔찌' });
      });

      const getGradeClass = (grade) => {
        switch (grade) {
          case '고대': return 'grade-ancient';
          case '유물': return 'grade-relic';
          case '전설': return 'grade-legendary';
          case '영웅': return 'grade-epic';
          case '희귀': return 'grade-rare';
          default: return '';
        }
      };

      const getTooltipText = (tooltip, key) => {
        const raw = tooltip?.[key]?.value;
        return raw ? raw.replace(/<[^>]+>/g, '').trim() : '';
      };

      const getReinforceText = (tooltip, name) => {
        if (!tooltip) return name;
        const keys = Object.keys(tooltip);
        let reinforceLevel = '';
        for (const key of keys) {
          const element = tooltip[key];
          const value = element?.value || '';
          if (
            element.type === 'SingleTextBox' &&
            value.includes('상급 재련') &&
            value.includes('단계')
          ) {
	console.log(value);
            const match = value.replace(/<[^>]+>/g, '').match(/(\d+)단계/);
            const stage = match ? match[1] : '';
            reinforceLevel = `x${stage}`;
            break;
          }
        }
        return `${name} ${reinforceLevel}`.trim();
      };

      const getTranscendText = (tooltip) => {
        if (!tooltip) return '';
        const keys = Object.keys(tooltip);
        for (const key of keys) {
          const element = tooltip[key];
          const value = element?.value || '';
          if (
            element.type === 'SingleTextBox' &&
            value.includes('슬롯 효과') &&
            value.includes('초월') &&
            value.includes('단계')
          ) {
            return value.replace(/<[^>]+>/g, '').trim();
          }
        }
        return '';
      };

      const equipmentList = document.getElementById('equipmentList');
      equipmentList.innerHTML = `
        <div class="equipment-columns">
          <div class="equipment-left">
            <h3>장비</h3>
            <div class="equipment-column">
              ${gearOrder.map(slot => {
                const item = gearItems.find(i => i.Type === slot);
                if (!item) return '';

                const transcend = getTranscendText(item.Tooltip);
                const reinforce = getReinforceText(item.Tooltip, item.Name);

                return `
                  <div class="equipment-item">
                    <div class="item-icon-text">
                      <div class="item-icon ${getGradeClass(item.Grade)}">
                        <img src="${item.Icon}" alt="${item.Name}" />
                      </div>
                      <div class="item-info">
                        ${transcend ? `<div class="item-sub">${transcend}</div>` : ''}
                        <div class="item-sub">+${item.Tier || ''} ${reinforce}</div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="equipment-right">
            <h3>악세사리</h3>
            <div class="equipment-column">
              ${accessoryOrder.map(slot => {
                const item = accessoryItems.find(i => i.slot === slot);
                return item ? `
                  <div class="equipment-item ${getGradeClass(item.Grade)}">
                    <img src="${item.Icon}" alt="${item.Name}" />
                    <div>${item.Name}</div>
                    <div>${item.Grade}</div>
                  </div>
                ` : '';
              }).join('')}
            </div>
          </div>
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
