function handleSearch(event) {
  if (event.key === 'Enter') {
    const keyword = document.getElementById('searchInput').value.trim();
    if (keyword) {
      window.location.href = `/web/?character=${encodeURIComponent(keyword)}`;
    }
  }
}

function getCharacterQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("character");
}

function getApiKey() {
  return localStorage.getItem("LOA_API_KEY");
}

function fetchCharacterData(name) {
  const apiKey = getApiKey();
  if (!apiKey) {
    alert("API KEY가 설정되지 않았습니다.");
    return;
  }

  fetch(`https://developer-lostark.game.onstove.com/characters/${encodeURIComponent(name)}/siblings`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("검색 실패");
      return res.json();
    })
    .then((data) => {
      displayResults(data);
    })
    .catch((err) => {
      console.error(err);
      alert("캐릭터 정보를 가져오지 못했습니다.");
    });
}

function displayResults(characters) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  // 템레벨 숫자로 정렬
  characters.sort((a, b) => {
    const levelA = parseFloat(a.ItemAvgLevel.replace(/,/g, ""));
    const levelB = parseFloat(b.ItemAvgLevel.replace(/,/g, ""));
    return levelB - levelA;
  });

  // 서버명으로 그룹화
  const serverGroups = {};
  characters.forEach((char) => {
    if (!serverGroups[char.ServerName]) {
      serverGroups[char.ServerName] = [];
    }
    serverGroups[char.ServerName].push(char);
  });

  // 그룹별 카드 섹션 생성
  for (const [serverName, group] of Object.entries(serverGroups)) {
    const section = document.createElement("section");
    section.className = "server-section";

    const header = document.createElement("h2");
    header.textContent = serverName;
    section.appendChild(header);

    const cardContainer = document.createElement("div");
    cardContainer.className = "card-container";

    group.forEach((char) => {
      const card = document.createElement("div");
      card.className = "card";

      const iconUrl = getClassIconUrl(char.CharacterClassName); // 아이콘 URL 함수

      card.innerHTML = `
        <img src="${iconUrl}" alt="${char.CharacterClassName}" class="class-icon" />
        <p class="char-name">${char.CharacterName}</p>
        <p class="item-level">${char.ItemAvgLevel}</p>
      `;

      cardContainer.appendChild(card);
    });

    section.appendChild(cardContainer);
    container.appendChild(section);
  }
}

// 직업 아이콘 URL 매핑 함수 (임의 경로로 수정 가능)
function getClassIconUrl(className) {
  const encoded = encodeURIComponent(className);
  return `/web/images/classes/${encoded}.png`; // 정적 이미지 폴더 기준
}

// 모달 관련
function openModal() {
  document.getElementById("apikeyModal").style.display = "flex";
}
function closeModal() {
  document.getElementById("apikeyModal").style.display = "none";
}
function saveApiKey() {
  const key = document.getElementById("apiKeyInput").value.trim();
  if (key) {
    localStorage.setItem("LOA_API_KEY", key);
    closeModal();
    alert("API KEY가 저장되었습니다.");
  }
}

// 초기 로딩 시 검색
document.addEventListener("DOMContentLoaded", () => {
  const name = getCharacterQuery();
  if (name) {
    document.getElementById("searchInput").value = name;
    fetchCharacterData(name);
  }
});
