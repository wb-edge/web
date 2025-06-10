// 모달 열기
function openModal() {
  document.getElementById('apiModal').style.display = 'flex';
}

// 모달 닫기
function closeModal() {
  document.getElementById('apiModal').style.display = 'none';
}

// API 키 저장 (쿠키에 저장)
function saveApiKey() {
  const key = document.getElementById("apiKeyInput").value;
  if (key) {
    document.cookie = `loa_api_key=${key}; path=/; max-age=2592000`; // 30일
    alert("API Key가 저장되었습니다.");
    closeModal();
  }
}

// 쿠키에서 API 키 읽기
function getApiKeyFromCookie() {
  const match = document.cookie.match(/(?:^|; )loa_api_key=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// 검색 입력 시 엔터 처리
function handleSearch(event) {
  if (event.key === "Enter") {
    const query = event.target.value.trim();
    if (query) {
      window.location.href = `/web/group/${encodeURIComponent(query)}`;
    }
  }
}

// 현재 페이지 URL에서 캐릭터명을 추출
function getCharacterQuery() {
  const match = window.location.pathname.match(/\/group\/(.+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// API 호출 및 카드 생성
async function fetchCharacterData(query) {
  const apiKey = getApiKeyFromCookie();
  if (!apiKey) {
    alert("API Key가 설정되지 않았습니다.");
    return;
  }

  try {
    const response = await fetch(`https://developer-lostark.game.onstove.com/characters/${query}/siblings`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("캐릭터 정보를 불러오지 못했습니다.");
    }

    const data = await response.json();
    displayCards(data);
  } catch (error) {
    console.error("API 요청 오류:", error);
    alert("API 요청 중 오류가 발생했습니다.");
  }
}

// 카드 영역 출력
function displayCards(characters) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  characters.forEach((char) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-content">
        <p><strong>캐릭터명:</strong> ${char.CharacterName}</p>
        <p><strong>서버:</strong> ${char.ServerName}</p>
        <p><strong>클래스:</strong> ${char.CharacterClassName}</p>
        <p><strong>아이템 레벨:</strong> ${char.ItemAvgLevel}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

// 페이지 로딩 시 실행
document.addEventListener("DOMContentLoaded", () => {
  const characterName = getCharacterQuery();
  if (characterName) {
    fetchCharacterData(characterName);
  }
});
