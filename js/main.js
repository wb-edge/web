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

function handleSearch(event) {
  if (event.key === 'Enter') {
    const keyword = event.target.value.trim();
    if (keyword) {
      window.location.href = `/web/?q=${encodeURIComponent(keyword)}`;
    }
  }
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function fetchCharacters(keyword) {
  const apiKey = getCookie('LOA_API_KEY');
  if (!apiKey) return;

  fetch(`https://developer-lostark.game.onstove.com/characters/${keyword}/siblings`, {
    headers: {
      'Authorization': `bearer ${apiKey}`,
    },
  })
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) return;

      const grouped = {};
      data.forEach(char => {
        const server = char.ServerName;
        const level = parseFloat(char.ItemMaxLevel.replace(/,/g, ''));
        if (!grouped[server]) grouped[server] = [];
        grouped[server].push({
          name: char.CharacterName,
          job: char.CharacterClassName,
          level,
        });
      });

      const results = document.querySelector('.results');
      results.innerHTML = '';

      const sortedServers = Object.entries(grouped)
        .sort((a, b) => b[1].length - a[1].length);

      for (const [server, group] of sortedServers) {
        const sortedGroup = group.sort((a, b) => b.level - a.level);
        const section = document.createElement('section');
        section.classList.add('server-group');

        const title = document.createElement('h2');
        title.textContent = server;
        section.appendChild(title);

        const container = document.createElement('div');
        container.classList.add('card-container');

        sortedGroup.forEach(({ name, job, level }) => {
          const card = document.createElement('div');
          card.classList.add('card');

          const img = document.createElement('img');
          img.src = jobIconMap[job] || '';

          const info = document.createElement('div');
          info.classList.add('info');

          const charName = document.createElement('div');
          charName.classList.add('name');
          charName.textContent = name;

          const itemLevel = document.createElement('div');
          itemLevel.classList.add('itemLevel');
          itemLevel.textContent = `${level.toLocaleString()} 레벨`;

          info.appendChild(charName);
          info.appendChild(itemLevel);

          card.appendChild(img);
          card.appendChild(info);
          container.appendChild(card);
        });

        section.appendChild(container);
        results.appendChild(section);
      }
    });
}

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

function showModal() {
  document.getElementById('apiKeyModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('apiKeyModal').style.display = 'none';
}

function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (key) {
    setCookie('LOA_API_KEY', key, 30);
    closeModal();
  }
}

// 초기 실행
const keyword = getQueryParam('q');
if (keyword) fetchCharacters(keyword);
