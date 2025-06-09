// 가상 캐릭터 데이터
const characters = [
  {
    name: "엘리나",
    class: "소서리스",
    server: "루페온",
    image: "https://via.placeholder.com/250x150?text=엘리나"
  },
  {
    name: "카스티엘",
    class: "버서커",
    server: "실리안",
    image: "https://via.placeholder.com/250x150?text=카스티엘"
  },
  {
    name: "루미에르",
    class: "블래스터",
    server: "카마인",
    image: "https://via.placeholder.com/250x150?text=루미에르"
  }
];

// 검색 및 카드 생성
document.getElementById("searchInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const keyword = e.target.value.trim();
    const results = document.getElementById("results");
    results.innerHTML = "";

    const filtered = characters.filter(char =>
      char.name.includes(keyword)
    );

    if (filtered.length === 0) {
      results.innerHTML = "<p style='text-align:center;'>결과가 없습니다.</p>";
      return;
    }

    filtered.forEach(char => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${char.image}" alt="${char.name}" />
        <h3>${char.name}</h3>
        <p>${char.class} - ${char.server}</p>
      `;
      results.appendChild(card);
    });
  }
});
