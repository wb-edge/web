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

  characters.forEach((char) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-content">
        <p><strong>서버:</strong> ${char.ServerName}</p>
        <p><strong>캐릭터명:</strong> ${char.CharacterName}</p>
        <p><strong>클래스:</strong> ${char.CharacterClassName}</p>
        <p><strong>템레벨:</strong> ${char.ItemAvgLevel}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// 모달
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

// 페이지 로딩 시 자동 검색
document.addEventListener("DOMContentLoaded", () => {
  const name = getCharacterQuery();
  if (name) {
    document.getElementById("searchInput").value = name;
    fetchCharacterData(name);
  }
});
