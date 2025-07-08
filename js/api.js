import { jobIconMap, engravingIconMap } from './icons.js';

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

const dealerOptions = [
  '공격력', '무기 공격력', '공격력%', '무기 공격력%',
  '치명타 적중률', '치명타 피해',
  '적에게 주는 피해', '추가 피해'
];

const supporterOptions = [
  '세레나데', '낙인력', '아군 피해량 강화', '파티원 회복',
  '아군 공격력 강화', '파티원 보호막', '무기 공격력'
];

const isSupporter = (job) => ['바드', '도화가', '홀리나이트'].includes(job);

const getOptionGrade = (text) => {
  const numeric = parseFloat(text.replace(/[^\d.\-]/g, '')) || 0;
  let matched = null;

  for (const opt of optionStandards) {
    if (opt.keyword.includes('무기 공격력') && text.includes('무기 공격력')) {
      const isPercent = text.includes('%');
      const isStdPercent = opt.keyword.includes('%');
      if (isPercent === isStdPercent) {
        matched = opt;
        break;
      }
    } else if (opt.keyword.includes('공격력') && !opt.keyword.includes('무기') && text.includes('공격력')) {
      const isPercent = text.includes('%');
      const isStdPercent = opt.keyword.includes('%');
      if (isPercent === isStdPercent) {
        matched = opt;
        break;
      }
    } else if (text.includes(opt.keyword)) {
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

const shouldShowStar = (text, job) => {
  const isSup = isSupporter(job);
  return isSup
    ? supporterOptions.some(opt => text.includes(opt))
    : dealerOptions.some(opt => text.includes(opt));
};

const parseTooltip = (tooltip) => {
  try {
    return JSON.parse(tooltip);
  } catch {
    return {};
  }
};

const parseElixir = (tooltipString) => {
  const tooltip = parseTooltip(tooltipString);
  const el = tooltip?.Element_011?.value?.Element_000?.contentStr;
  if (!el) return '';

  const contents = Object.values(el)
    .map(x => x?.contentStr?.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);

  const parsed = contents.map(line => {
    const match = line.match(/\[(.*?)\]\s*(.*?)Lv\.(\d+)/);
    if (match) {
      const label = match[2].trim().replace(/\s+/g, ' ');
      const level = parseInt(match[3], 10);
      let gradeClass = 'grade-low';
      if (level === 4) gradeClass = 'grade-mid';
      else if (level === 5) gradeClass = 'grade-high';
      return `${label} <span class="${gradeClass}">Lv.${level}</span>`;
    }
    return '';
  }).filter(Boolean);

  return parsed.slice(0, 2).join(' ');
};

const parseAbilityStone = (tooltipString) => {
  const tooltip = parseTooltip(tooltipString);
  const entries = tooltip?.Element_006?.value?.Element_000?.contentStr;
  if (!entries) return [];

  return Object.values(entries).map(el => {
    const raw = el?.contentStr || '';
    const line = raw.replace(/<[^>]+>/g, '').replace(/\[|\]/g, '').trim();
    if (line.includes('감소')) {
      return `<span style="color:#ff4c4c">${line}</span>`;
    }
    const match = line.match(/Lv\.(\d)/);
    if (!match) return line;

    const lv = parseInt(match[1], 10);
    let color = '#ccc';
    if (lv === 3) color = '#f9ae00';
    else if (lv === 2) color = '#8045dd';
    else if (lv === 1) color = '#2a81f6';

    return line.replace(`Lv.${lv}`, `<span style="color:${color}">Lv.${lv}</span>`);
  }).slice(0, 3);
};

const getAccessoryOptions = (tooltipString, job) => {
  const tooltip = parseTooltip(tooltipString);
  const options = [];

  for (const key in tooltip) {
    const element = tooltip[key];
    if (!element?.value?.Element_000?.includes?.('연마 효과')) continue;

    const raw = element.value.Element_001 || '';
    const lines = raw
      .split(/<br>|<BR>|\\n|\\r/i)
      .map(line => {
        const clean = line.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim();
        const gradeClass = getOptionGrade(clean);
        const match = clean.match(/(.*?)([+\-]?\d[\d.,]*%?)$/);
        const label = match ? match[1].trim() : clean;
        const value = match ? match[2] : '';
        const coloredValue = value ? `<span class="${gradeClass}">${value}</span>` : '';
        const showStar = shouldShowStar(clean, job);
        return `
          <div class="item-sub${showStar ? ' show-star' : ''}">
            ${label} ${coloredValue}
          </div>
        `;
      })
      .filter(Boolean);

    options.push(...lines);
  }

  return options.slice(0, 3);
};

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

const getTranscendText = (tooltipString) => {
  const tooltip = parseTooltip(tooltipString);
  for (const key in tooltip) {
    const element = tooltip[key];
    if (!element || typeof element !== 'object') continue;  // element null 체크

    const value = element.value;
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
    if (!element || typeof element !== 'object') continue;
    const value = element.value || '';
    if (element.type === 'SingleTextBox' && value.includes('상급 재련')) {
      const clean = value.replace(/<[^>]+>/g, '');
      const match = clean.match(/(\d+)단계/);
      const stage = match ? match[1] : '';
      return `${name} x${stage}`;
    }
  }
  return name;
};

const formatDecimal = (str) => {
  const num = parseFloat(str.replace(/,/g, ''));
  return isNaN(num) ? '-' : num.toFixed(1);
};

const formatNumberWithComma = (str) => {
  const num = parseInt(str.replace(/,/g, ''), 10);
  return isNaN(num) ? '-' : num.toLocaleString();
};

export function showCharacterDetails(characterName) {
  const apiKey = getCookie('LOA_API_KEY');
  if (!apiKey) return;

  const headers = { Authorization: `bearer ${apiKey}` };

  const profileUrl = `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(characterName)}/profiles`;
  const equipmentUrl = `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(characterName)}/equipment`;
  const gemUrl = `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(characterName)}/gems`;
  const engravingUrl = `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(characterName)}/engravings`;

  Promise.all([
    fetch(profileUrl, { headers }).then(res => res.json()),
    fetch(equipmentUrl, { headers }).then(res => res.json()),
    fetch(gemUrl, { headers }).then(res => res.json()),
    fetch(engravingUrl, { headers }).then(res => res.json())
  ]).then(([profile, equipment, gems, engraving]) => {
    const gearOrder = ['투구', '어깨', '상의', '하의', '장갑', '무기'];
    const accessoryOrder = ['목걸이', '귀걸이', '귀걸이', '반지', '반지'];
    const gearItems = [], accessoryItems = [];
    let abilityStone = null, bracelet = null;

    equipment.forEach(item => {
      const type = item.Type;
      if (gearOrder.includes(type)) gearItems.push(item);
      else if (type === '어빌리티 스톤') abilityStone = item;
      else if (type === '팔찌') bracelet = item;
      else if (accessoryOrder.includes(type)) accessoryItems.push(item);
    });

    // 엘릭서 총합 계산
    let elixirTotal = 0;
    gearItems.forEach(item => {
      const tooltip = parseTooltip(item.Tooltip);
      const lines = tooltip?.Element_011?.value?.Element_000?.contentStr;
      if (lines) {
        Object.values(lines).forEach(obj => {
          const match = obj.contentStr.replace(/<[^>]+>/g, '').match(/Lv\.(\d+)/);
          if (match) elixirTotal += parseInt(match[1], 10);
        });
      }
    });

    // 투구 특수 옵션
    let specialRefineText = '';
    const helmet = gearItems.find(i => i.Type === '투구');
    if (helmet) {
      const tooltip = parseTooltip(helmet.Tooltip);
      const topStr = tooltip?.Element_011?.value?.Element_000?.topStr;
      if (topStr) {
        const clean = topStr.replace(/<[^>]+>/g, '').trim();
        specialRefineText = clean;
      }
    }

    // 보석 통계
    let damageGemCount = 0;
	let cooldownGemCount = 0;
	let baseAtkPercent = 0;
	
	const gemDetailHTML = gems.Gems.map(gem => {
	  try {
	    const tooltip = JSON.parse(gem.Tooltip);
	    const level = parseInt(gem.Name.match(/(\d+)레벨/)?.[1] || '0', 10);
	
	    const type = gem.Name.includes('겁화') ? '겁'
	      : gem.Name.includes('작열') ? '작'
	      : gem.Name.includes('홍염') ? '홍'
	      : gem.Name.includes('멸화') ? '멸'
	      : gem.Name.includes('광휘') ? '광'
	      : '?';
	
	    const grade =
	      (['겁', '작', '광'].includes(type))
	        ? (level >= 10 ? 'ancient'
	          : level >= 8 ? 'relic'
	          : level >= 5 ? 'legendary'
	          : level >= 3 ? 'epic' : 'rare')
	        : (level >= 10 ? 'relic'
	          : level >= 7 ? 'legendary'
	          : level >= 5 ? 'epic'
	          : level >= 3 ? 'rare' : 'uncommon');
	
	    const levelType = `${level}${type}`;
	
	    const rawSkill = tooltip?.Element_007?.value?.Element_000?.contentStr || '';
	    const rawDesc = tooltip?.Element_007?.value?.Element_001 || '';
	
	    let skillName = rawSkill.replace(/<[^>]+>/g, '').replace(/\[.*?\]/g, '').trim();
	    let effect = rawDesc.replace(/<[^>]+>/g, '').trim();
	
	    // 🎯 중복 제거: "추가 효과" 이후 잘라냄
	    if (effect.includes('추가 효과')) {
	      effect = effect.split('추가 효과')[0].trim();
	    }
	
	    // 🎯 기본 공격력 ~ 증가 제거
	    effect = effect.replace(/기본 공격력\s[\d.]+% 증가/g, '').trim();
	
	    // 🎯 마지막 불필요한 콤마 제거
	    if (effect.endsWith(',')) effect = effect.slice(0, -1);
	
	    // 카운트
	    if (effect.includes('피해')) damageGemCount++;
	    if (effect.includes('재사용 대기시간')) cooldownGemCount++;
	
	    // 기본 공격력 % 합산
	    const atkBoosts = Object.values(tooltip)
	      .map(e => e?.value?.Element_001 || '')
	      .filter(s => s.includes('기본 공격력'))
	      .map(s => s.replace(/<[^>]+>/g, '').match(/([\d.]+)%/))
	      .filter(Boolean)
	      .map(match => parseFloat(match[1]));
	
	    const atkSum = atkBoosts.reduce((acc, val) => acc + val, 0);
	    baseAtkPercent += atkSum;
	
	    return `
	      <div class="gem-detail-item">
	        <div class="item-icon gem-icon grade-${grade}">
	          <img src="${gem.Icon}" />
	        </div>
	        <div class="gem-detail-text">
	          <span class="gem-tag">${levelType}</span>
	          ${skillName} ${effect}
	        </div>
	      </div>
	    `;
	  } catch {
	    return '';
	  }
	}).join('');

    const gemHtml = `
	  <div class="gem-card">
	    <div class="gem-summary">
		  <div class="gem-metrics">
		    <div class="metric damage">피증 <strong>${damageGemCount}</strong></div>
		    <div class="metric cooldown">쿨감 <strong>${cooldownGemCount}</strong></div>
		    <div class="metric atk">기본 공격력 <strong>+${baseAtkPercent.toFixed(2)}%</strong></div>
		  </div>
		  <button class="toggle-btn" onclick="toggleGemPanel()">
		    <span class="gem-toggle-icon">▼</span>
		  </button>
		</div>
	    <div class="gem-container">
	      ${gems.Gems.slice(0, 11).map(gem => {
	        const level = parseInt(gem.Name.match(/(\d+)레벨/)?.[1] || '0', 10);
	        const type = gem.Name.includes('겁화') ? '겁'
	          : gem.Name.includes('작열') ? '작'
	          : gem.Name.includes('홍염') ? '홍'
	          : gem.Name.includes('멸화') ? '멸'
	          : gem.Name.includes('광휘') ? '광'
	          : '?';
	
	        const grade =
	          (['겁', '작', '광'].includes(type))
	            ? (level >= 10 ? 'ancient'
	              : level >= 8 ? 'relic'
	              : level >= 5 ? 'legendary'
	              : level >= 3 ? 'epic' : 'rare')
	            : (level >= 10 ? 'relic'
	              : level >= 7 ? 'legendary'
	              : level >= 5 ? 'epic'
	              : level >= 3 ? 'rare' : 'uncommon');
	
	        return `
	          <div class="gem-item">
	            <div class="item-icon gem-icon grade-${grade}">
	              <img src="${gem.Icon}" />
	            </div>
	            <div class="item-sub gem-center"><span class="gem-tag">${level}${type}</span></div>
	          </div>
	        `;
	      }).join('')}
	    </div>
	    <div class="gem-detail-panel collapsed">
	      ${gemDetailHTML}
	    </div>
	  </div>
	`;

    // 팔찌 툴팁 처리
    if (bracelet) {
      const tooltip = parseTooltip(bracelet.Tooltip);
      const html = tooltip?.Element_005?.value?.Element_001 || '';
      const parsed = html
        .replace(/<img[^>]+emoticon_tooltip_bracelet_locked[^>]*>/g,
          `<img src="https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/game/ico_tooltip_locked.png" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;" />`)
        .replace(/<img[^>]+emoticon_tooltip_bracelet_changeable[^>]*>/g,
          `<img src="https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/game/ico_tooltip_changeable.png" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;" />`);
      document.getElementById('braceletTooltipContent').innerHTML = parsed;
    }

    // 각인 처리
	const engravingList = engraving.Engravings ?? engraving.ArkPassiveEffects ?? [];
	
	const abilityEffects = (abilityStone?.Tooltip && JSON.parse(abilityStone.Tooltip)?.Element_006?.value?.Element_000?.contentStr) || {};
	const abilityEffectList = Object.values(abilityEffects).map(e => e?.contentStr?.replace(/<[^>]+>/g, '') ?? '');
	
	const gradePositionMap = {
	  '전설': '-60px',
	  '영웅': '-88px',
	  '유물': '-118px'
	};
	
	const engravings = engravingList.map(e => {
	  const name = e.Name.replace(/\s*\([^)]+\)/g, '');
	  const level = e.Level;
	  const icon = engravingIconMap[name] || '';
	  const grade = e.Grade;
	
	  const gradeIcon = gradePositionMap[grade]
	  ? `<img src="https://cdn-lostark.game.onstove.com/2018/obt/assets/images/pc/profile/img_engrave_icon.png" style="width:22px;height:22px;object-fit:none;object-position:${gradePositionMap[grade]};vertical-align:middle;margin:0 4px;" />`
	  : '';
	
	  const abilityLv = e.AbilityStoneLevel || '';
	  const abilityHtml = abilityLv
	    ? `<img src="https://cdn-lostark.game.onstove.com/2018/obt/assets/images/pc/profile/img_engrave_icon.png" style="width:22px;height:22px;object-fit:none;object-position: -1px;vertical-align:middle;margin-left:4px;" /> Lv.${abilityLv}`
	    : '';
	
	  return `
	  <div class="engraving-line">
	    <div class="engraving-left">
	      <img class="engraving-icon" src="${icon}" />
	      <span class="engraving-name">${name}</span>
	      ${abilityLv ? `
	        <img class="engraving-stone-icon" src="https://cdn-lostark.game.onstove.com/2018/obt/assets/images/pc/profile/img_engrave_icon.png" />
	        <span class="engraving-stone-lv">Lv.${abilityLv}</span>
	      ` : ''}
	    </div>
	    <div class="engraving-right">
	      ${gradeIcon}
	      <span class="engraving-grade-lv">x${level}</span>
	    </div>
	  </div>
	`;

	}).join('');
	
	const engravingHtml = `
	  <div class="engraving-card">
	    <div class="engraving-section">${engravings}</div>
	  </div>
	`;

    // 렌더링
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
      <div class="profile">
        <img src="${jobIconMap[profile.CharacterClassName] || ''}" />
        <div style="font-size:1.2rem;font-weight:bold;">${profile.CharacterName}</div>
        <div style="font-size:0.95rem;color:#ccc;">${profile.ServerName} / ${profile.GuildName || '-'}</div>
      </div>

      <div class="equipment-columns">
        <!-- 왼쪽: 캐릭터 정보 + 각인 -->
        <div class="equipment-left">
          <div class="character-info-card">
			<button class="toggle-btn" onclick="toggleStatsPanel()">
              <span class="stats-toggle-icon">▼</span>
            </button>

            <div class="level-block">
              <div class="item-level-text">${formatDecimal(profile.ItemAvgLevel)}</div>
              <div class="combat-power-text">${formatDecimal(profile.CombatPower)}</div>
            </div>

			<div class="stat-panel collapsed">
              <div class="stat-block-row">
                <div class="stat-card"><strong>공격력</strong><div>${formatNumberWithComma(profile.Stats.find(s => s.Type === '공격력')?.Value)}</div></div>
                <div class="stat-card"><strong>생명력</strong><div>${formatNumberWithComma(profile.Stats.find(s => s.Type === '최대 생명력')?.Value)}</div></div>
              </div>
              <div class="stat-block-row">
                <div class="stat-card"><strong>치명</strong><div>${profile.Stats.find(s => s.Type === '치명')?.Value || '-'}</div></div>
                <div class="stat-card"><strong>특화</strong><div>${profile.Stats.find(s => s.Type === '특화')?.Value || '-'}</div></div>
                <div class="stat-card"><strong>신속</strong><div>${profile.Stats.find(s => s.Type === '신속')?.Value || '-'}</div></div>
              </div>
			</div>
          </div>
          ${engravingHtml}
        </div>

        <!-- 오른쪽: 장비/악세/보석 -->
        <div class="equipment-right">
          <div class="equipment-columns">
            <div class="equipment-column">
              ${gearOrder.map(slot => {
                const item = gearItems.find(i => i.Type === slot);
                if (!item) return '';
                const trans = getTranscendText(item.Tooltip);
                const reforged = getReinforceText(item.Tooltip, item.Name);
                const elixir = parseElixir(item.Tooltip);
                return `
                  <div class="equipment-item">
                    <div class="item-icon-text">
                      <div class="item-icon ${getGradeClass(item.Grade)}"><img src="${item.Icon}" /></div>
                      <div class="item-info">
                        ${trans ? `<div class="item-sub">${trans}</div>` : ''}
                        <div class="item-sub">${reforged}</div>
                        ${elixir ? `<div class="item-sub">${elixir}</div>` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
              <div class="equipment-item">
                <div class="item-icon-text">
                  <div class="item-icon"><img src="https://cdn-lostark.game.onstove.com/efui_iconatlas/use/use_11_146.png" /></div>
                  <div class="item-info">
                    <div class="item-sub">엘릭서 총합: Lv.${elixirTotal}</div>
                    ${specialRefineText ? `<div class="item-sub">${specialRefineText}</div>` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div class="equipment-column">
              ${accessoryItems.map(item => `
                <div class="equipment-item">
                  <div class="item-icon-text">
                    <div class="item-icon ${getGradeClass(item.Grade)}"><img src="${item.Icon}" /></div>
                    <div class="item-info">
                      ${getAccessoryOptions(item.Tooltip, profile.CharacterClassName).join('')}
                    </div>
                  </div>
                </div>
              `).join('')}
              ${abilityStone ? `
                <div class="equipment-item">
                  <div class="item-icon-text">
                    <div class="item-icon ${getGradeClass(abilityStone.Grade)}"><img src="${abilityStone.Icon}" /></div>
                    <div class="item-info">
                      ${parseAbilityStone(abilityStone.Tooltip).map(line => `<div class="item-sub">${line}</div>`).join('')}
                    </div>
                  </div>
                </div>` : ''}
              ${bracelet ? `
                <div class="equipment-item">
                  <div class="item-icon-text">
                    <div class="item-icon ${getGradeClass(bracelet.Grade)}"><img src="${bracelet.Icon}" /></div>
                    <div class="item-info">
                      <div class="item-sub" onclick="showBraceletTooltip()">팔찌 정보 보기</div>
                    </div>
                  </div>
                </div>` : ''}
            </div>
          </div>

          ${gemHtml}
        </div>
      </div>
    `;

    document.getElementById('characterDetailModal').style.display = 'flex';
  });
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';')[0];
}

window.showBraceletTooltip = () => {
  const modal = document.getElementById('braceletTooltipModal');
  modal.style.display = 'flex';
};

window.closeBraceletTooltip = () => {
  document.getElementById('braceletTooltipModal').style.display = 'none';
};

window.toggleStatsPanel = () => {
  const panel = document.querySelector('.stat-panel');
  const icon = document.querySelector('.stats-toggle-icon');
  panel.classList.toggle('collapsed');
  icon.textContent = panel.classList.contains('collapsed') ? '▼' : '▲';
}

window.toggleGemPanel = () => {
  const panel = document.querySelector('.gem-detail-panel');
  const icon = document.querySelector('.gem-toggle-icon');
  panel.classList.toggle('collapsed');
  icon.textContent = panel.classList.contains('collapsed') ? '▼' : '▲';
};

