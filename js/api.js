import { jobIconMap } from './icons.js';

const optionStandards = [
  { keyword: '적에게 주는 피해', std: 1.20 },
  { keyword: '추가 피해', std: 1.60 },
  { keyword: '무기 공격력%', std: 1.80 },
  { keyword: '무기 공격력', std: 480 },
  { keyword: '공격력%', std: 0.95 },
  { keyword: '공격력', std: 195 },
  { keyword: '치명타 적중률', std: 0.95 },
  { keyword: '치명타 피해', std: 2.40 },
  { keyword: '세레나데', std: 3.60 },
  { keyword: '낙인력', std: 4.80 },
  { keyword: '최대 마나', std: 15 },
  { keyword: '상태이상', std: 0.50 },
  { keyword: '전투 중 생명력', std: 25 },
  { keyword: '파티원 회복', std: 2.10 },
  { keyword: '아군 피해량 강화', std: 4.50 },
  { keyword: '아군 공격력 강화', std: 3.00 },
  { keyword: '파티원 보호막', std: 2.10 },
  { keyword: '최대 생명력', std: 3250 }
];

const getOptionGrade = (text) => {
  const numeric = parseFloat(text.replace(/[^\d.\-]/g, '')) || 0;

  let matched = null;

  for (const opt of optionStandards) {
    // 무기 공격력 특수 처리
    if (opt.keyword.startsWith('무기 공격력')) {
      if (text.includes('무기 공격력')) {
        const isPercent = text.includes('%');
        const isStdPercent = opt.keyword.includes('%');
        if (isPercent === isStdPercent) {
          matched = opt;
          break;
        }
      }
    }

    // 공격력 특수 처리 (단, 무기 공격력 제외)
    else if (opt.keyword.startsWith('공격력')) {
      if (text.includes('공격력') && !text.includes('무기 공격력')) {
        const isPercent = text.includes('%');
        const isStdPercent = opt.keyword.includes('%');
        if (isPercent === isStdPercent) {
          matched = opt;
          break;
        }
      }
    }

    // 일반 항목 처리
    else if (text.includes(opt.keyword)) {
      matched = opt;
      break;
    }
  }

  if (!matched) return 'grade-unknown';

  const std = matched.std;
  if (numeric > std) return 'grade-high';
  if (numeric === std) return 'grade-mid';
  return 'grade-low';
};


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
    .then(([profile, equipment]) => {
      const detailContent = document.getElementById('detailContent');
      detailContent.innerHTML = `
        <div class="profile" style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
          <img src="${jobIconMap[profile.CharacterClassName] || ''}" style="width:40px;height:40px;border-radius:4px;" />
          <div style="font-size:1.2rem;font-weight:bold;">${profile.CharacterName}</div>
          <div style="font-size:0.95rem;color:#ccc;">${profile.ItemMaxLevel}</div>
        </div>
      `;

      const gearOrder = ['투구', '어깨', '상의', '하의', '장갑', '무기'];
      const accessoryOrder = ['목걸이', '귀걸이', '귀걸이', '반지', '반지', '어빌리티스톤'];

      const gearItems = [];
      const accessoryItems = [];

      equipment.forEach(item => {
        const name = item.Type;
        if (gearOrder.includes(name)) gearItems.push(item);
        else if (name.includes('목걸이')) accessoryItems.push(item);
        else if (name.includes('귀걸이')) accessoryItems.push(item);
        else if (name.includes('반지')) accessoryItems.push(item);
        else if (name.includes('어빌리티스톤')) accessoryItems.push(item);
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

      const parseTooltip = (tooltip) => {
        try {
          return JSON.parse(tooltip);
        } catch {
          return {};
        }
      };

      const getTranscendText = (tooltipString) => {
        const tooltip = parseTooltip(tooltipString);
        for (const key in tooltip) {
          const element = tooltip[key];
          const value = element?.value;
          if (
            element.type === 'IndentStringGroup' &&
            value?.Element_000?.topStr?.includes('초월')
          ) {
            const clean = value.Element_000.topStr.replace(/<[^>]+>/g, '').trim();
            const match = clean.match(/(\d+)단계\s*(\d+)/);
            if (match) {
              const level = match[1];
              const count = match[2];
              return `<img src="https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/game/ico_tooltip_transcendence.png" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;" />Lv.${level} x${count}`;
            }
          }
        }
        return '';
      };

      const getReinforceText = (tooltipString, name) => {
        const tooltip = parseTooltip(tooltipString);
        for (const key in tooltip) {
          const element = tooltip[key];
          const value = element?.value || '';
          if (
            element.type === 'SingleTextBox' &&
            value.includes('상급 재련')
          ) {
            const match = value.replace(/<[^>]+>/g, '').match(/(\d+)단계/);
            const stage = match ? match[1] : '';
            return `${name} x${stage}`;
          }
        }
        return name;
      };

      const getAccessoryOptions = (tooltipString) => {
        const tooltip = parseTooltip(tooltipString);
        const options = [];

        for (const key in tooltip) {
          const element = tooltip[key];
          if (
            element?.type === 'ItemPartBox' &&
            element.value?.Element_000?.includes('연마 효과')
          ) {
            const raw = element.value.Element_001 || '';
            const lines = raw
			  .split(/<br>|<BR>|\\n|\\r/i)
			  .map(line => line.replace(/<[^>]+>/g, '').trim())
			  .filter(Boolean);
            options.push(...lines);
          }
        }
        return options.slice(0, 3);
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
                      <div class="item-info" style="text-align:left">
                        ${transcend ? `<div class="item-sub">${transcend}</div>` : ''}
                        <div class="item-sub">${reinforce}</div>
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
              ${accessoryOrder.map((slot, index) => {
                const item = accessoryItems[index];
                if (!item) return '';

                const options = getAccessoryOptions(item.Tooltip);

                return `
                  <div class="equipment-item">
                    <div class="item-icon-text">
                      <div class="item-icon ${getGradeClass(item.Grade)}">
                        <img src="${item.Icon}" alt="${item.Name}" />
                      </div>
                      <div class="item-info" style="text-align:left">
                        ${options.map(opt => `<div class="item-sub ${getOptionGrade(opt)}">${opt}</div>`).join('')}
                      </div>
                    </div>
                  </div>
                `;
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
