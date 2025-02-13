document.addEventListener("DOMContentLoaded", async function () {
    console.log("🚀 play.js 로드됨!");

    const deckSelector = document.getElementById("deckSelector");
    const startGameBtn = document.getElementById("startGame");
    const drawCardBtn = document.getElementById("drawCard");
    const shuffleAddBtn = document.getElementById("shuffleAdd");
    const discoverBtn = document.getElementById("discoverCard");
    const handContainer = document.getElementById("handContainer");
    const deckRemaining = document.getElementById("deckRemaining");
    const burnedCardPopup = document.getElementById("burnedCardPopup");
    const burnedCardMessage = document.getElementById("burnedCardMessage");
    const closeBurnedCardPopup = document.getElementById("closeBurnedCardPopup");
    const discoverByTypeBtn = document.getElementById("discoverByType");
    const endTurnBtn = document.getElementById("endTurn");
    const manaDestroyBtn = document.getElementById("manaDestroy");
    const setMaxManaBtn = document.getElementById("setMaxMana");
    const manaCountDisplay = document.getElementById("manaCount");

    let currentMana = 0; // 현재 마나
    let maxMana = 10; // 최대 마나 (초기값: 10)

    let db;
    let selectedDeck = null;
    let hand = [];
    let availableCards = [];

    // ✅ 턴 종료 (마나 1 증가, 최대 maxMana까지)
    endTurnBtn.addEventListener("click", function () {
        if (currentMana < maxMana) {
            currentMana++;
        }
        updateManaDisplay();
        console.log(`🔄 턴 종료! 현재 마나: ${currentMana}/${maxMana}`);
    });

    // ✅ 마나 수정 파괴 (마나 1 감소, 최소 0)
    manaDestroyBtn.addEventListener("click", function () {
        if (currentMana > 0) {
            currentMana--;
        }
        updateManaDisplay();
        console.log(`⚡ 마나 수정 파괴! 현재 마나: ${currentMana}/${maxMana}`);
    });

    // ✅ 최대 마나 설정 (1~20 사이로 설정 가능)
    setMaxManaBtn.addEventListener("click", function () {
        let input = prompt("최대 마나를 설정하세요 (최대 20)");
        let value = parseInt(input);

        if (!isNaN(value) && value > 0 && value <= 20) {
            maxMana = value;
            if (currentMana > maxMana) {
                currentMana = maxMana; // 현재 마나가 최대 마나 초과 시 조정
            }
            updateManaDisplay();
            alert(`✅ 최대 마나가 ${maxMana}로 설정되었습니다!`);
        } else {
            alert("❌ 올바른 숫자를 입력하세요! (1~20)");
        }
    });

    // ✅ 마나 UI 업데이트 함수
    function updateDeckRemaining() {
        document.getElementById("deckRemaining").textContent = availableCards.length;
    }

    function updateManaDisplay() {
        document.getElementById("manaCount").textContent = `${currentMana}/10`;
    }

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

    db = await initIndexedDB();

    async function loadDecks() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("decks", "readonly");
            const store = transaction.objectStore("decks");
            const request = store.getAll();

            request.onsuccess = function () {
                let decks = request.result;
                deckSelector.innerHTML = "";
                if (!Array.isArray(decks) || decks.length === 0) {
                    deckSelector.innerHTML = "<option>저장된 덱이 없음</option>";
                    startGameBtn.disabled = true;
                    return;
                }

                decks.forEach(deck => {
                    let option = document.createElement("option");
                    option.value = deck.name;
                    option.textContent = deck.name;
                    deckSelector.appendChild(option);
                });

                startGameBtn.disabled = false;
                resolve(decks);
            };

            request.onerror = function () {
                reject("❌ 덱 로딩 실패");
            };
        });
    }

    async function getDeckByName(deckName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("decks", "readonly");
            const store = transaction.objectStore("decks");
            const request = store.get(deckName);

            request.onsuccess = function () {
                if (request.result) {
                    resolve(request.result);
                } else {
                    reject("❌ 해당 덱을 찾을 수 없음: " + deckName);
                }
            };

            request.onerror = function () {
                reject("❌ 덱 불러오기 실패");
            };
        });
    }

    async function startGame() {
        const selectedDeckName = deckSelector.value;
        if (!selectedDeckName) {
            console.error("🚨 덱이 올바르게 선택되지 않음!");
            return;
        }

        selectedDeck = await getDeckByName(selectedDeckName);
        hand = [];
        availableCards = [...selectedDeck.cards];
        handContainer.innerHTML = "";
        updateDeckRemaining();
        updateManaDisplay();
        console.log(`🎮 게임 시작! 선택된 덱: ${selectedDeck.name}`);
    }

    function drawCard() {
        if (!selectedDeck || availableCards.length === 0) {
            alert("덱에 남은 카드가 없습니다!");
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const drawnCard = availableCards.splice(randomIndex, 1)[0];

        if (hand.length >= 10) {
            burnCard(drawnCard);
        } else {
            hand.push(drawnCard);
            updateHandDisplay();
        }

        updateDeckRemaining();
    }

    function burnCard(card) {
        console.warn(`🔥 카드 소각됨: ${card.name}`);

        burnedCardMessage.innerHTML = `<strong>${card.name}</strong> 카드가 불타버렸습니다!`;
        burnedCardPopup.classList.add("show-popup");

        setTimeout(() => {
            burnedCardPopup.classList.remove("show-popup");
        }, 3000);
    }

    function updateHandDisplay() {
        handContainer.innerHTML = "";
        hand.forEach((card, index) => {
            const cardDiv = document.createElement("div");
            cardDiv.classList.add("card");
            cardDiv.innerHTML = `
                <img src="${card.image}" style="width: 100px; height: 150px; object-fit: cover;">
                <p><strong>${card.name}</strong><br>${card.keyword}<br>${card.type}</p>
            `;

            cardDiv.addEventListener("click", () => {
                removeCardFromHand(index);
            });

            handContainer.appendChild(cardDiv);
        });
    }

    function removeCardFromHand(index) {
        hand.splice(index, 1);
        updateHandDisplay();
    }

    closeBurnedCardPopup.addEventListener("click", function () {
        burnedCardPopup.classList.remove("show-popup");
    });

    function shuffleAddCard() {
    // 이미 존재하는 팝업이 있으면 제거 후 다시 생성
    let existingPopup = document.getElementById("shufflePopup");
    if (existingPopup) {
        document.body.removeChild(existingPopup);
    }

    // ✅ 팝업 생성
    const shuffleBox = document.createElement("div");
    shuffleBox.id = "shufflePopup"; 
    shuffleBox.classList.add("popup");
    shuffleBox.innerHTML = `
        <div class="popup-content">
            <h3>덱에 카드 추가</h3>
            <input type="text" id="shuffleCardName" placeholder="카드 이름">
            <input type="text" id="shuffleCardKeyword" placeholder="카드 키워드">
            <input type="text" id="shuffleCardType" placeholder="카드 종족">
            
            <!-- ✅ 파일 업로드 추가 -->
            <input type="file" id="shuffleCardImageUpload" accept="image/*">
            <div id="shuffleImagePreview" class="image-preview"></div>

            <button id="addShuffleCard">추가</button>
            <button id="closeShuffle">닫기</button>
        </div>
    `;

    document.body.appendChild(shuffleBox);
    shuffleBox.classList.add("show-popup"); // 📌 팝업 애니메이션 효과

    const imageUploadInput = document.getElementById("shuffleCardImageUpload");
    const imagePreviewContainer = document.getElementById("shuffleImagePreview");
    let uploadedImageURL = ""; // ✅ 업로드된 이미지 저장 변수

    // 📌 파일 선택 시 미리보기 표시
    imageUploadInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                uploadedImageURL = e.target.result; // ✅ Base64 URL 저장
                imagePreviewContainer.innerHTML = `<img src="${uploadedImageURL}" style="width: 100px; height: 150px;">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // ✅ 카드 추가 버튼 기능
    document.getElementById("addShuffleCard").addEventListener("click", function () {
        const name = document.getElementById("shuffleCardName").value;
        const keyword = document.getElementById("shuffleCardKeyword").value;
        const type = document.getElementById("shuffleCardType").value;

        if (!name || !keyword || !type || !uploadedImageURL) {
            alert("모든 정보를 입력하고 이미지를 업로드해야 합니다!");
            return;
        }

        availableCards.push({ name, keyword, type, image: uploadedImageURL });
        alert(`🃏 '${name}' 카드가 덱에 추가되었습니다!`);
        
        updateDeckRemaining();

        // ✅ 팝업 닫기
        shuffleBox.classList.remove("show-popup");
        setTimeout(() => document.body.removeChild(shuffleBox), 300);
    });

    // ✅ 닫기 버튼 기능
    document.getElementById("closeShuffle").addEventListener("click", function () {
        shuffleBox.classList.remove("show-popup");
        setTimeout(() => document.body.removeChild(shuffleBox), 300);
    });
}



    function discoverCard() {
        if (!selectedDeck || availableCards.length === 0) {
            alert("덱이 비어 있어 발견할 카드가 없습니다.");
            return;
        }

        const keywordInput = prompt("🔍 찾을 키워드를 입력하세요 (쉼표 , 로 구분):");
        if (!keywordInput) {
            alert("키워드를 입력해야 합니다!");
            return;
        }

        const keywords = keywordInput.split(",").map(k => k.trim()); // 다중 키워드 지원

        // 🔍 키워드 중 하나라도 포함된 카드 검색
        const matchingCards = availableCards.filter(card =>
            keywords.some(keyword => card.keyword.includes(keyword))
        );

        if (matchingCards.length === 0) {
            alert("해당 키워드를 가진 카드가 없습니다!");
            return;
        }
        
        shuffleArray(matchingCards);

        // 🔍 최대 3장만 보여주기
        const discoveredCards = matchingCards.slice(0, 3);

        // 💡 발견 창 UI 생성
        const discoverBox = document.createElement("div");
        discoverBox.classList.add("discover-container");
        discoverBox.innerHTML = `<h3>발견한 카드</h3><div id="discoverOptions"></div>`;

        // 📌 카드 목록 추가
        const optionsContainer = discoverBox.querySelector("#discoverOptions");
        discoveredCards.forEach((card, index) => {
            const cardDiv = document.createElement("div");
            cardDiv.classList.add("card");
            cardDiv.innerHTML = `
                <img src="${card.image}" style="width: 100px; height: 150px; object-fit: cover;">
                <p><strong>${card.name}</strong><br>${card.keyword}<br>${card.type}</p>
            `;

            // 🔥 클릭 시 카드 선택
            cardDiv.addEventListener("click", function () {
                hand.push(card); // 손패에 추가
                availableCards = availableCards.filter(c => c !== card); // 덱에서 제거
                updateHandDisplay(); // 손패 UI 업데이트
                updateDeckRemaining(); // 덱 남은 카드 업데이트
                alert(`🎉 '${card.name}' 카드를 선택했습니다!`);
                document.body.removeChild(discoverBox); // 창 닫기
            });

            optionsContainer.appendChild(cardDiv);
        });

        // 📢 닫기 버튼 추가
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "닫기";
        closeBtn.addEventListener("click", function () {
            document.body.removeChild(discoverBox);
        });
        discoverBox.appendChild(closeBtn);

        document.body.appendChild(discoverBox);
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // 요소 교환
        }
    }
    
    function discoverCardByType() {
        if (!selectedDeck || availableCards.length === 0) {
            alert("덱이 비어 있어 발견할 카드가 없습니다.");
            return;
        }

        const type = prompt("발견할 카드의 종족을 입력하세요:");
        if (!type) {
            alert("종족을 입력해야 합니다!");
            return;
        }

        // 🔄 리스트 셔플을 위한 함수
        function shuffleArray(array) {
            return array.sort(() => Math.random() - 0.5);
        }

        // 🔍 종족 기반 카드 검색 후 섞기
        let matchingCards = availableCards.filter(card => card.type.includes(type));
        matchingCards = shuffleArray(matchingCards);

        if (matchingCards.length === 0) {
            alert("해당 종족을 가진 카드가 없습니다!");
            return;
        }

        // 🔍 최대 3장만 보여주기
        const discoveredCards = matchingCards.slice(0, 3);

        // 💡 발견 창 UI 생성
        const discoverBox = document.createElement("div");
        discoverBox.classList.add("discover-container");
        discoverBox.innerHTML = `<h3>발견한 카드</h3><div id="discoverOptions"></div>`;

        // 📌 카드 목록 추가
        const optionsContainer = discoverBox.querySelector("#discoverOptions");
        discoveredCards.forEach(card => {
            const cardDiv = document.createElement("div");
            cardDiv.classList.add("card");
            cardDiv.innerHTML = `
                <img src="${card.image}" style="width: 100px; height: 150px; object-fit: cover;">
                <p><strong>${card.name}</strong><br>${card.keyword}<br>${card.type}</p>
            `;

            // 🔥 클릭 시 카드 선택
            cardDiv.addEventListener("click", function () {
                hand.push(card); // 손패에 추가
                availableCards = availableCards.filter(c => c !== card); // 덱에서 제거
                updateHandDisplay(); // 손패 UI 업데이트
                alert(`🎉 '${card.name}' 카드를 선택했습니다!`);
                document.body.removeChild(discoverBox); // 창 닫기
            });

            optionsContainer.appendChild(cardDiv);
        });

        // 📢 닫기 버튼 추가
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "닫기";
        closeBtn.addEventListener("click", function () {
            document.body.removeChild(discoverBox);
        });
        discoverBox.appendChild(closeBtn);

        document.body.appendChild(discoverBox);
    }

// ✅ 이벤트 리스너 추가
discoverByTypeBtn.addEventListener("click", discoverCardByType);


    await loadDecks();
    
    startGameBtn.addEventListener("click", startGame);
    drawCardBtn.addEventListener("click", drawCard);
    shuffleAddBtn.addEventListener("click", shuffleAddCard);
    discoverBtn.addEventListener("click", discoverCard);
});
