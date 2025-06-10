document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");
  if (query) {
    fetchCharacters(query);
  }
});

function handleSearch(event) {
  if (event.key === "Enter") {
    const keyword = event.target.value.trim();
    if (keyword) {
      window.location.href = `/web/group.html?q=${encodeURIComponent(keyword)}`;
    }
  }
}

// 클래스명 → 아이콘 URL 매핑
const classIconMap = {
  '워로드': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/warlord_m.png',
  '디스트로이어': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/destroyer_m.png',
  '버서커': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/berserker_m.png',
  '홀리나이트': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/holyknight_m.png',
  '슬레이어': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/berserker_female.png',
  '인파이터': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/infighter_m.png',
  '배틀마스터': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/battle_master_m.png',
  '기공사': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/force_master_m.png',
  '창술사': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/lance_master_m.png',
  '스트라이커': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/battle_master_male_m.png',
  '브레이커': 'https://cdn-lostark.game.onstove.com/2018/obt/assets/images/common/thumb/battle_master_male_m.png',
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

function fetchCharacters(keyword) {
  const apiKey = getApiKey();
  if (!apiKey) {
    alert("API Key가 설정되지 않았습니다.");
    return;
  }

  fetch(`https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(keyword)}/siblings`, {
    headers: {
      Authorization: `bearer ${apiKey}`,
    },
  })
    .then(res => res.json())
    .then(data => {
      renderGroupedCharacters(data);
    })
    .catch(err => {
      console.error("데이터 불러오기 오류:", err);
      alert("검색 결과를 불러올 수 없습니다.");
    });
}

function renderGroupedCharacters(characters) {
  const container = document.querySelector("main.results");
  container.innerHTML = "";

  // 서버별로 그룹화
  const grouped = {};
  characters.forEach(c => {
    const server = c.ServerName;
    if (!grouped[server]) grouped[server] = [];
    grouped[server].push(c);
  });

  for (const server in grouped) {
    const section = document.createElement("section");
    section.className = "server-group";

    const title = document.createElement("h2");
    title.textContent = `${server} 서버`;
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "card-grid";

    // 템레벨 내림차순 정렬
    grouped[server]
      .sort((a, b) => parseFloat(b.ItemAvgLevel.replace(/,/g, "")) - parseFloat(a.ItemAvgLevel.replace(/,/g, "")))
      .forEach(char => {
        const card = document.createElement("div");
        card.className = "card";

        const icon = classIconMap[char.CharacterClassName] || "";
        const img = document.createElement("img");
        img.src = icon;
        img.alt = char.CharacterClassName;

        const name = document.createElement("h3");
        name.textContent = char.CharacterName;

        const level = document.createElement("p");
        level.textContent = `템레벨: ${char.ItemAvgLevel}`;

        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(level);
        grid.appendChild(card);
      });

    section.appendChild(grid);
    container.appendChild(section);
  }
}

// API Key 저장 및 불러오기
function getApiKey() {
  return localStorage.getItem("LOA_API_KEY");
}

function setApiKey(key) {
  localStorage.setItem("LOA_API_KEY", key);
  alert("API Key가 저장되었습니다.");
}

// 모달 관련
document.getElementById("openApiKeyModal")?.addEventListener("click", () => {
  document.getElementById("apiKeyModal").style.display = "block";
});

document.getElementById("saveApiKey")?.addEventListener("click", () => {
  const key = document.getElementById("apiKeyInput").value.trim();
  if (key) {
    setApiKey(key);
    document.getElementById("apiKeyModal").style.display = "none";
  }
});

document.getElementById("closeModal")?.addEventListener("click", () => {
  document.getElementById("apiKeyModal").style.display = "none";
});
