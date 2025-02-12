document.addEventListener("DOMContentLoaded", async function () {
    console.log("🚀 deck-create.js 로드됨!");

    const imageUpload = document.getElementById("imageUpload");
    const dropZone = document.getElementById("dropZone");
    const createCardBtn = document.getElementById("createCard");
    const deckPreview = document.getElementById("deckPreview");
    const saveDeckBtn = document.getElementById("saveDeck");

    async function initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("DeckDatabase", 1);

            request.onupgradeneeded = function (event) {
                let db = event.target.result;
                if (!db.objectStoreNames.contains("decks")) {
                    db.createObjectStore("decks", { keyPath: "name" });
                }
            };

            request.onsuccess = function (event) {
                resolve(event.target.result);
            };

            request.onerror = function (event) {
                reject("❌ IndexedDB 초기화 실패: " + event.target.error);
            };
        });
    }

    const db = await initIndexedDB();

    // ✅ 파일 업로드 & 이미지 미리보기
    imageUpload.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const imagePreview = document.getElementById("imagePreview");
                imagePreview.src = e.target.result;
                imagePreview.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });

    // ✅ 카드 추가 기능
    createCardBtn.addEventListener("click", function () {
        const cardName = document.getElementById("cardName").value.trim();
        const cardKeyword = document.getElementById("cardKeyword").value.trim();
        const cardType = document.getElementById("cardType").value.trim();
        const imageSrc = document.getElementById("imagePreview").src;

        if (!cardName || !cardKeyword || !cardType || imageSrc === "") {
            alert("⚠ 모든 정보를 입력해주세요!");
            return;
        }

        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
            <img src="${imageSrc}" style="width:100px; height:150px;">
            <p><strong>${cardName}</strong><br>${cardKeyword}<br>${cardType}</p>
        `;

        // 카드 삭제 기능 추가
        card.addEventListener("click", () => {
            deckPreview.removeChild(card);
        });

        deckPreview.appendChild(card);
        console.log("✅ 카드 추가됨:", cardName);
    });

    // ✅ 덱 저장 기능 (IndexedDB)
    saveDeckBtn.addEventListener("click", async function () {
        const deckName = document.getElementById("deckName").value.trim();
        if (!deckName) {
            alert("⚠ 덱 이름을 입력해주세요!");
            return;
        }

        const cards = Array.from(deckPreview.children).map(card => {
            return {
                image: card.querySelector("img").src,
                name: card.querySelector("p strong").innerText,
                keyword: card.querySelector("p").childNodes[2].nodeValue.trim(),
                type: card.querySelector("p").childNodes[4].nodeValue.trim()
            };
        });

        const transaction = db.transaction("decks", "readwrite");
        const store = transaction.objectStore("decks");
        const deckData = { name: deckName, cards };

        store.put(deckData);

        transaction.oncomplete = function () {
            console.log("✔ 덱 저장 완료:", deckData);
            showSavePopup();
        };

        transaction.onerror = function () {
            console.error("❌ 덱 저장 실패");
        };
    });

    // ✅ 저장 완료 팝업 애니메이션
    function showSavePopup() {
        const popup = document.getElementById("savePopup");
        popup.classList.add("show");

        setTimeout(() => {
            popup.classList.remove("show");
        }, 3000);
    }
});
