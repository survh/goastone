document.addEventListener("DOMContentLoaded", async function () {
    console.log("🚀 deck-view.js 로드됨!");

    const deckList = document.getElementById("deckList");
    const deckDetails = document.getElementById("deckDetails");
    const deckTitle = document.getElementById("deckTitle");
    const cardContainer = document.getElementById("cardContainer");
    const exportDeckBtn = document.getElementById("exportDeck");
    const importDeckBtn = document.getElementById("importDeckBtn");
    const importDeckInput = document.getElementById("importDeckInput");
    const editCardPopup = document.getElementById("editCardPopup");
    const editCardName = document.getElementById("editCardName");
    const editCardKeyword = document.getElementById("editCardKeyword");
    const editCardType = document.getElementById("editCardType");
    const editCardImageUpload = document.getElementById("editCardImageUpload");
    const editImagePreview = document.getElementById("editImagePreview");
    const saveCardChangesBtn = document.getElementById("saveCardChanges");
    const deleteCardBtn = document.getElementById("deleteCard");
    const closeEditPopupBtn = document.getElementById("closeEditPopup");

    let selectedCardIndex = null; // 수정 중인 카드 인덱스
    let selectedDeckData = null; // 현재 선택된 덱 데이터

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
        const transaction = db.transaction("decks", "readonly");
        const store = transaction.objectStore("decks");
        const request = store.getAll();

        request.onsuccess = function () {
            deckList.innerHTML = "";

            if (!request.result.length) {
                deckList.innerHTML = "<p>저장된 덱이 없습니다.</p>";
                return;
            }

            request.result.forEach(deck => {
                const li = document.createElement("li");
                li.classList.add("deck-item");

                li.innerHTML = `
                    <span class="share-icon" data-name="${deck.name}" style="margin-left: 6.5px;">
                        <img src="image/shareicon.png" alt="공유" width="16" height="16">
                    </span>
                    <span class="deck-name">${deck.name}</span>
                    <button class="delete-deck" data-name="${deck.name}">삭제</button>
                `;

                li.querySelector(".share-icon").addEventListener("click", (event) => {
                    event.stopPropagation();
                    exportDeck(deck.name);
                });

                li.querySelector(".delete-deck").addEventListener("click", (event) => {
                    event.stopPropagation();
                    confirmDeleteDeck(deck.name);
                });

                li.addEventListener("click", function () {
                    console.log("✅ 덱 선택됨:", deck.name);
                    showDeckDetails(deck);
                });

                deckList.appendChild(li);
            });

            console.log("✔ 덱 목록 로드 완료", request.result);
        };
    }

    function showDeckDetails(deck) {
        selectedDeckData = deck;
        deckTitle.textContent = `덱 정보: ${deck.name}`;
        cardContainer.innerHTML = "";

        if (deck.cards.length === 0) {
            cardContainer.innerHTML = "<p>이 덱에는 카드가 없습니다.</p>";
            return;
        }

        deck.cards.forEach((card, index) => {
            const cardDiv = document.createElement("div");
            cardDiv.classList.add("card");
            cardDiv.innerHTML = `
                <img src="${card.image}" style="width: 100px; height: 150px; object-fit: cover;">
                <p><strong>${card.name}</strong><br>${card.keyword}<br>${card.type}</p>
            `;

            cardDiv.addEventListener("click", () => {
                editCard(index);
            });

            cardContainer.appendChild(cardDiv);
        });
    }

    function confirmDeleteDeck(deckName) {
        const confirmation = document.createElement("div");
        confirmation.classList.add("confirmation-popup");
        confirmation.innerHTML = `
            <div class="confirmation-content">
                <p>정말 이 덱을 삭제하시겠습니까?</p>
                <button id="confirmDelete">예</button>
                <button id="cancelDelete">아니오</button>
            </div>
        `;

        document.body.appendChild(confirmation);

        document.getElementById("confirmDelete").addEventListener("click", () => {
            deleteDeck(deckName);
            document.body.removeChild(confirmation);
        });

        document.getElementById("cancelDelete").addEventListener("click", () => {
            document.body.removeChild(confirmation);
        });
    }

    function deleteDeck(deckName) {
        const transaction = db.transaction("decks", "readwrite");
        const store = transaction.objectStore("decks");
        store.delete(deckName);

        transaction.oncomplete = function () {
            console.log("🗑 덱 삭제 완료:", deckName);
            loadDecks();

            if (deckTitle.textContent.includes(deckName)) {
                deckTitle.textContent = "덱 정보";
                cardContainer.innerHTML = "";
            }
        };

        transaction.onerror = function () {
            console.error("❌ 덱 삭제 실패");
        };
    }
    
    function editCard(index) {
        selectedCardIndex = index;
        let card = selectedDeckData.cards[index];

        editCardName.value = card.name;
        editCardKeyword.value = card.keyword;
        editCardType.value = card.type;
        editImagePreview.innerHTML = `<img src="${card.image}" style="width: 100px; height: 150px;">`;

        editCardPopup.classList.add("show-popup");
    }

    editCardImageUpload.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                editImagePreview.innerHTML = `<img src="${e.target.result}" style="width: 100px; height: 150px;">`;
            };
            reader.readAsDataURL(file);
        }
    });

    saveCardChangesBtn.addEventListener("click", async function () {
        if (selectedCardIndex === null || !selectedDeckData) return;

        let updatedCard = {
            name: editCardName.value,
            keyword: editCardKeyword.value,
            type: editCardType.value,
            image: editImagePreview.querySelector("img").src,
        };

        selectedDeckData.cards[selectedCardIndex] = updatedCard;

        await updateDeckInDB(selectedDeckData);
        editCardPopup.classList.remove("show-popup");
        showDeckDetails(selectedDeckData);
    });

    deleteCardBtn.addEventListener("click", async function () {
        if (selectedCardIndex === null || !selectedDeckData) return;

        selectedDeckData.cards.splice(selectedCardIndex, 1);

        await updateDeckInDB(selectedDeckData);
        editCardPopup.classList.remove("show-popup");
        showDeckDetails(selectedDeckData);
    });

    closeEditPopupBtn.addEventListener("click", function () {
        editCardPopup.classList.remove("show-popup");
    });

    async function updateDeckInDB(deck) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("decks", "readwrite");
            const store = transaction.objectStore("decks");
            const request = store.put(deck);

            request.onsuccess = function () {
                resolve();
            };

            request.onerror = function () {
                reject("❌ 덱 업데이트 실패!");
            };
        });
    }
    
    async function exportDeck(deckName) {
        console.log(`📥 덱 내보내기 시도: ${deckName}`);

        if (!deckName) {
            alert("⚠️ 내보낼 덱을 선택하세요!");
            return;
        }

        const transaction = db.transaction("decks", "readonly");
        const store = transaction.objectStore("decks");
        const request = store.get(deckName);

        request.onsuccess = function () {
            if (!request.result) {
                alert("❌ 덱을 찾을 수 없습니다!");
                return;
            }

            const deckData = JSON.stringify(request.result, null, 2);
            const blob = new Blob([deckData], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${deckName}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            console.log(`✅ 덱 내보내기 완료: ${deckName}.json`);
        };

        request.onerror = function () {
            alert("❌ 덱을 불러오는 중 오류 발생!");
        };
    }
    
    async function importDeck(event) {
        console.log("📂 덱 가져오기 시작");
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith(".json")) {
            alert("❌ 올바른 JSON 덱 파일을 선택하세요!");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const deckData = JSON.parse(event.target.result);
                if (!deckData.name || !deckData.cards) {
                    throw new Error("덱 데이터 형식이 올바르지 않습니다.");
                }

                console.log(`📂 가져온 덱: ${deckData.name}`, deckData);

                const transaction = db.transaction("decks", "readwrite");
                const store = transaction.objectStore("decks");
                store.put(deckData);

                transaction.oncomplete = function () {
                    alert(`✅ '${deckData.name}' 덱이 성공적으로 가져와졌습니다!`);
                    loadDecks();
                };

                transaction.onerror = function () {
                    alert("❌ 덱 저장 실패!");
                };
            } catch (error) {
                alert("❌ 잘못된 덱 JSON 파일입니다!");
                console.error(error);
            }
        };
        reader.readAsText(file);
    }

    importDeckInput.addEventListener("change", importDeck);
    importDeckBtn.addEventListener("click", function () {
        importDeckInput.click(); // 숨겨진 input을 클릭하여 파일 업로드 창 열기
    });

    async function checkForSharedDeck() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedDeck = urlParams.get("deck");

        if (encodedDeck) {
            importDeckInput.value = encodedDeck;
        }
    }

    document.getElementById("closeImportDeckPopup").addEventListener("click", () => importDeckPopup.classList.remove("show-popup"));

    await checkForSharedDeck();
    await loadDecks();
});
