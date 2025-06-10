const allCharacters = [
  {
    name: "카단",
    server: "루페온",
    class: "블레이드",
    itemLevel: 1620,
    icon: "https://via.placeholder.com/48?text=BLD"
  },
  {
    name: "아제나",
    server: "실리안",
    class: "소서리스",
    itemLevel: 1605,
    icon: "https://via.placeholder.com/48?text=SOR"
  },
  {
    name: "루테란",
    server: "루페온",
    class: "기공사",
    itemLevel: 1580,
    icon: "https://via.placeholder.com/48?text=GIG"
  },
  {
    name: "카단2",
    server: "루페온",
    class: "도화가",
    itemLevel: 1540,
    icon: "https://via.placeholder.com/48?text=ART"
  }
];

// 검색창에서 엔터 입력 시 그룹 주소로 이동
function handleSearch(event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim();
    if (query) {
      window.location.href = `/web/group/?q=${encodeURIComponent(query)}`;
    }
  }
}

// 그룹 페이지에서 URL 파라미터로 캐릭터 카드 출력
function renderCardsFromURL() {
  const params = new URLSearchParams(window.location.search);
  const keyword = params.get("q");
  if (!keyword) return;

  const resultsContainer = document.querySelector(".results");

//API 호출

  const matched = allCharacters.filter(c =>
    c.name.includes(keyword)
  );

  if (matched.length === 0) {
    resultsContainer.innerHTML = `<p>검색 결과가 없습니다.</p>`;
    return;
  }

  resultsContainer.innerHTML = ""; // 초기화

  matched.forEach(char => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img class="class-icon" src="${char.icon}" alt="${char.class}" />
      <h3>${char.name}</h3>
      <p>서버: ${char.server}</p>
      <p>템레벨: ${char.itemLevel}</p>
    `;
    resultsContainer.appendChild(card);
  });
}

// 페이지 로드 시 카드 렌더링
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("/group")) {
    renderCardsFromURL();
  }
});
