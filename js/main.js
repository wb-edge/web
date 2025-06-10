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

function handleSearch(event) {
  if (event.key === "Enter") {
    const keyword = event.target.value.trim();
    if (keyword) {
      window.location.href = `/web/?q=${encodeURIComponent(keyword)}`;
    }
  }
}

function fetchCharacters(keyword) {
  const apiKey = getCookie("LOA_API_KEY");
  if (!apiKey) {
    alert("API Key가 필요합니다.");
    return;
  }

  fetch(`https://developer-lostark.game.onstove.com/characters/${keyword}/siblings`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) {
        alert("검색 실패 또는 API 응답 없음");
        return;
      }

      data.sort((a, b) => parseFloat(b.ItemMaxLevel.replace(/,/g, "")) - parseFloat(a.ItemMaxLevel.replace(/,/g, "")));

      const grouped = {};
      data.forEach(char => {
        const server = char.ServerName;
        if (!grouped[server]) grouped[server] = [];
        grouped[server].push(char);
      });

      const results = document.querySelector(".results");
      results.innerHTML = "";

      Object.entries(grouped).forEach(([server, chars]) => {
        const groupDiv = document.createElement("div");
        groupDiv.className = "group";

        const title = document.createElement("h2");
        title.textContent = `${server} 서버`;
        groupDiv.appendChild(title);

        const cardWrap = document.createElement("div");
        cardWrap.className = "card-container";

        chars.forEach(char => {
          const card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `
            <img src="${classIconMap[char.CharacterClassName] || ""}" alt="${char.CharacterClassName}" />
            <div><strong>${char.CharacterName}</strong></div>
            <div>${char.ItemMaxLevel}</div>
          `;
          cardWrap.appendChild(card);
        });

        groupDiv.appendChild(cardWrap);
        results.appendChild(groupDiv);
      });
    });
}

function setCookie(name, value, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/";
}

function getCookie(name) {
  return document.cookie.split("; ").find(row => row.startsWith(name + "="))?.split("=")[1];
}

// Modal 처리
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("apiKeyModal");
  const openBtn = document.getElementById("apiKeyBtn");
  const closeBtn = document.querySelector(".close");
  const saveBtn = document.getElementById("saveApiKey");

  openBtn.onclick = () => (modal.style.display = "block");
  closeBtn.onclick = () => (modal.style.display = "none");
  saveBtn.onclick = () => {
    const key = document.getElementById("apiKeyInput").value.trim();
    if (key) {
      setCookie("LOA_API_KEY", key);
      modal.style.display = "none";
      alert("API Key 저장됨");
    }
  };

  window.onclick = e => {
    if (e.target == modal) modal.style.display = "none";
  };

  const params = new URLSearchParams(location.search);
  const q = params.get("q");
  if (q) {
    document.getElementById("searchInput").value = q;
    fetchCharacters(q);
  }
});
