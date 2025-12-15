// --- CẤU HÌNH ---
// BẠN DÁN LINK GOOGLE APPS SCRIPT (ĐUÔI /exec) VÀO DƯỚI ĐÂY:
const API_URL = "DÁN_LINK_WEB_APP_GOOGLE_SCRIPT_VÀO_ĐÂY"; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khai báo biến UI
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

    // 2. Tạo hoặc Lấy Mã Máy Ảo
    let machineID = localStorage.getItem('mmx_mid');
    if (!machineID) {
        machineID = 'WEB-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        localStorage.setItem('mmx_mid', machineID);
    }
    txtMachineId.value = machineID;

    // 3. Kiểm tra trạng thái VIP đã lưu từ trước
    if (localStorage.getItem('mmx_is_vip') === 'true') {
        activateVIPMode();
    }

    // 4. Logic Đếm Ký Tự & Giới Hạn Quota
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

    // 5. Xử lý các nút bấm Giao diện
    btnUpgrade.addEventListener('click', () => modal.classList.remove('hidden'));
    document.querySelector('.close-modal').addEventListener('click', () => modal.classList.add('hidden'));
    
    document.getElementById('btn-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(machineID);
        alert("Đã copy mã máy: " + machineID);
    });

    // 6. Nút: Kiểm tra kích hoạt (Gọi Server Google Sheet)
    btnCheck.addEventListener('click', async () => {
        if(API_URL.includes("DÁN_LINK")) {
            statusMsg.innerText = "❌ Lỗi: Bạn chưa dán Link API vào file app.js dòng số 3!";
            statusMsg.style.color = "red";
            return;
        }

        statusMsg.innerText = "⏳ Đang kết nối máy chủ...";
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
                }, 1500);
            } else {
                statusMsg.innerText = "❌ Mã này chưa được kích hoạt trên hệ thống.";
                statusMsg.style.color = "#ff5555";
            }
        } catch (e) {
            statusMsg.innerText = "❌ Lỗi đường truyền mạng!";
            console.error(e);
        } finally {
            btnCheck.disabled = false;
        }
    });

    // ============================================================
    // PHẦN MỚI THÊM: KẾT NỐI VỚI EXTENSION (CẦU NỐI MA)
    // ============================================================

    // 7. Xử lý nút: BẮT ĐẦU TẠO (Gửi lệnh sang Extension)
    btnStart.addEventListener('click', () => {
        const text = textarea.value.trim();
        if (!text) {
            alert("Vui lòng nhập văn bản cần tạo!");
            return;
        }

        // Kiểm tra xem Extension đã được cài chưa
        // (Extension khi cài xong sẽ tự set biến này vào localStorage)
        if (localStorage.getItem("mmx_extension_installed") !== "true") {
            // Backup check: Gửi thử một tin nhắn ping
            window.postMessage({ type: "MMX_PING" }, "*");
            
            addLog("⚠️ Cảnh báo: Chưa tìm thấy Extension Ghost Bridge.", "red");
            alert("⚠️ Bạn chưa cài Extension!\nVui lòng cài đặt Extension 'Minimax Ghost Bridge' vào trình duyệt trước.");
            return;
        }

        addLog("🚀 Đang gửi lệnh sang Minimax...");
        btnStart.disabled = true;
        btnStart.innerText = "⏳ Đang chạy...";
        
        // Đóng gói dữ liệu thành "Gói hàng"
        const packet = {
            type: "MMX_COMMAND",
            payload: {
                text: text,
                config: {
                    machineId: machineID, // Gửi mã máy để sau này check quota
                    isVip: IS_VIP,
                    voiceId: "voice_id_mac_dinh" // Có thể mở rộng chọn giọng sau
                }
            }
        };

        // Bắn tín hiệu đi (Extension content.js sẽ bắt được cái này)
        window.postMessage(packet, "*");
    });

    // 8. Lắng nghe phản hồi từ Extension (Để hiện Log lên màn hình)
    window.addEventListener("message", (event) => {
        // Chỉ nghe tin nhắn từ chính trang này (do Extension gửi vào)
        if (event.source !== window) return;

        const data = event.data;

        // Nếu Extension báo cáo trạng thái
        if (data.type === "MMX_LOG") {
            addLog(data.message);
        }

        // Nếu Extension báo hoàn thành
        if (data.type === "MMX_COMPLETE") {
            btnStart.disabled = false;
            btnStart.innerText = "▶️ Bắt đầu tạo";
            addLog("✅ Hoàn tất quy trình!");
        }
        
        // Nếu Extension báo lỗi
        if (data.type === "MMX_ERROR") {
            btnStart.disabled = false;
            btnStart.innerText = "▶️ Bắt đầu tạo";
            addLog("❌ Lỗi: " + data.message);
        }
    });

    // ============================================================
    // CÁC HÀM HỖ TRỢ
    // ============================================================

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
        // Tạo element log mới
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerText = `[${time}] ${msg}`;
        
        // Tô màu nếu là lỗi
        if (msg.includes("Lỗi") || msg.includes("❌")) entry.style.color = "#ff5555";
        if (msg.includes("Thành công") || msg.includes("✅")) entry.style.color = "#50fa7b";

        log.appendChild(entry);
        log.scrollTop = log.scrollHeight; // Tự cuộn xuống dưới
    }
});
