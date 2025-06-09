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

  // 예시 데이터 (나중에 API 연동 가능)
  const allCharacters = [
    { name: "카단", class: "블레이드", server: "루페온" },
    { name: "아제나", class: "소서리스", server: "실리안" },
    { name: "루테란", class: "기공사", server: "루페온" }
  ];

  const matched = allCharacters.filter(c =>
    c.name.includes(keyword)
  );

  if (matched.length === 0) {
    resultsContainer.innerHTML = `<p>검색 결과가 없습니다.</p>`;
    return;
  }

  resultsContainer.innerHTML = ""; // 기존 내용 비우기

  matched.forEach(char => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="https://via.placeholder.com/250x150.png?text=${char.name}" alt="${char.name} 이미지" />
      <h3>${char.name}</h3>
      <p>클래스: ${char.class}</p>
      <p>서버: ${char.server}</p>
    `;
    resultsContainer.appendChild(card);
  });
}

// 실행 트리거
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("/group")) {
    renderCardsFromURL();
  }
});
