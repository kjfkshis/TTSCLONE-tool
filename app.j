// --- CẤU HÌNH ---
// CHỖ NÀY SẼ DÁN LINK GOOGLE SCRIPT Ở BƯỚC SAU
const API_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRkykGmX7BjXeORbQVDS7DLvmN9WNepCNn9ghui7-TUKvvIW_a7V9QCcxfh900XdiJP4cgGHL-PYmvy/pub?output=tsv"; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khai báo biến
    const modal = document.getElementById('activation-modal');
    const txtMachineId = document.getElementById('machine-id');
    const textarea = document.getElementById('main-textarea');
    const charCount = document.getElementById('char-count');
    const btnStart = document.getElementById('btn-start');
    const btnUpgrade = document.getElementById('btn-upgrade');
    const btnCheck = document.getElementById('btn-check-license');
    const warningBox = document.getElementById('warning-box');
    const quotaBadge = document.getElementById('quota-badge');
    const statusMsg = document.getElementById('msg-status');

    let MAX_QUOTA = 10000;
    let IS_VIP = false;

    // 2. Tạo Mã Máy Ảo
    let machineID = localStorage.getItem('mmx_mid');
    if (!machineID) {
        machineID = 'WEB-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        localStorage.setItem('mmx_mid', machineID);
    }
    txtMachineId.value = machineID;

    // 3. Kiểm tra trạng thái VIP đã lưu
    if (localStorage.getItem('mmx_is_vip') === 'true') {
        activateVIPMode();
    }

    // 4. Logic Đếm Ký Tự & Giới Hạn
    textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        charCount.innerText = `${len.toLocaleString()} / ${IS_VIP ? '∞' : MAX_QUOTA.toLocaleString()} ký tự`;

        if (!IS_VIP && len > MAX_QUOTA) {
            charCount.classList.add('red');
            btnStart.disabled = true;
            warningBox.classList.remove('hidden');
            // Tự động mở modal nếu quá giới hạn
            if(modal.classList.contains('hidden')) modal.classList.remove('hidden');
        } else {
            charCount.classList.remove('red');
            btnStart.disabled = false;
            warningBox.classList.add('hidden');
        }
    });

    // 5. Các nút bấm
    btnUpgrade.addEventListener('click', () => modal.classList.remove('hidden'));
    document.querySelector('.close-modal').addEventListener('click', () => modal.classList.add('hidden'));
    
    document.getElementById('btn-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(machineID);
        alert("Đã copy mã máy!");
    });

    // 6. Kiểm tra kích hoạt (Gọi API)
    btnCheck.addEventListener('click', async () => {
        if(API_URL.includes("DÁN_LINK")) {
            statusMsg.innerText = "❌ Lỗi: Chưa cấu hình API Server!";
            statusMsg.style.color = "red";
            return;
        }

        statusMsg.innerText = "⏳ Đang kiểm tra...";
        btnCheck.disabled = true;

        try {
            const res = await fetch(`${API_URL}?action=check&id=${machineID}`);
            const data = await res.json();

            if (data.status === 'active') {
                statusMsg.innerText = "✅ Kích hoạt thành công!";
                statusMsg.style.color = "#50fa7b";
                localStorage.setItem('mmx_is_vip', 'true');
                setTimeout(() => {
                    activateVIPMode();
                    modal.classList.add('hidden');
                }, 1000);
            } else {
                statusMsg.innerText = "❌ Mã chưa được kích hoạt.";
                statusMsg.style.color = "#ff5555";
            }
        } catch (e) {
            statusMsg.innerText = "❌ Lỗi kết nối!";
        } finally {
            btnCheck.disabled = false;
        }
    });

    function activateVIPMode() {
        IS_VIP = true;
        MAX_QUOTA = 999999999;
        btnUpgrade.classList.add('hidden'); // Ẩn nút nâng cấp
        quotaBadge.innerText = "Trạng thái: VIP 👑";
        quotaBadge.style.background = "#f1c40f";
        quotaBadge.style.color = "black";
        quotaBadge.style.fontWeight = "bold";
        btnStart.disabled = false;
        warningBox.classList.add('hidden');
        addLog("Đã khôi phục trạng thái VIP.");
    }

    function addLog(msg) {
        const log = document.getElementById('log-container');
        const time = new Date().toLocaleTimeString('vi-VN');
        log.innerHTML += `<div class="log-entry">[${time}] ${msg}</div>`;
        log.scrollTop = log.scrollHeight;
    }
});