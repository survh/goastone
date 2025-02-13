document.addEventListener("DOMContentLoaded", function () {
    const copyTextButton = document.getElementById("copyTextButton");
    const copySuccessMessage = document.getElementById("copySuccessMessage");

    // ✅ 복사할 텍스트
    const textToCopy = `
조건, 키워드 기록 칸

/ 영웅

A 체력 30

A 무기 : 
A 아티팩트 : 

B 체력 30

B 무기 : 
B 아티팩트 : 

/ 필드

A - 

B - 
`;

    copyTextButton.addEventListener("click", async function () {
        try {
            await navigator.clipboard.writeText(textToCopy);
            copySuccessMessage.classList.remove("hidden");

            // ✅ 2초 후 복사 완료 메시지 숨기기
            setTimeout(() => {
                copySuccessMessage.classList.add("hidden");
            }, 2000);

        } catch (error) {
            console.error("❌ 복사 실패:", error);
            alert("⚠️ 복사에 실패했습니다! 직접 선택하여 복사하세요.");
        }
    });
});
