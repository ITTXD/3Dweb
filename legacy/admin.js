import { auth, db } from './firebase.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const userEmailDisplay = document.getElementById('userEmailDisplay');

// กำหนดอีเมลของผู้ดูแลระบบ (ป้องกันไม่ให้คนอื่นที่อาจจะสมัครสมาชิกเข้ามาได้)
const ADMIN_EMAIL = "admin@example.com"; // เปลี่ยนเป็นอีเมลที่คุณจะใช้

// ตรวจสอบสถานะการล็อกอินแบบ Real-time
let unsubscribeOrders = null;

onAuthStateChanged(auth, (user) => {
    loadingScreen.style.display = 'none';

    if (user) {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'flex';
        userEmailDisplay.textContent = user.email;
        loadOrders(); // โหลดข้อมูลออเดอร์เมื่อล็อกอินสำเร็จ
    } else {
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';
        if (unsubscribeOrders) unsubscribeOrders(); // หยุดฟังสัญญาณข้อมูลเมื่อออกจากระบบ
    }
});

// จัดการการล็อกอิน
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showError("กรุณากรอกอีเมลและรหัสผ่าน");
        return;
    }

    try {
        setLoading(true);
        await signInWithEmailAndPassword(auth, email, password);
        // เมื่อล็อกอินสำเร็จ onAuthStateChanged จะทำงานอัตโนมัติ
        errorMessage.textContent = '';
        loginForm.reset();
    } catch (error) {
        console.error("Login Error:", error);
        let msg = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            msg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
        } else if (error.code === 'auth/too-many-requests') {
            msg = "เข้าสู่ระบบล้มเหลวหลายครั้ง กรุณารอสักครู่แล้วลองใหม่";
        }
        showError(msg);
    } finally {
        setLoading(false);
    }
});

// จัดการการออกจากระบบ
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Error:", error);
        alert("ไม่สามารถออกจากระบบได้ กรุณาลองใหม่");
    }
});

// Helper functions
function showError(msg) {
    errorMessage.textContent = msg;
}

function setLoading(isLoading) {
    if (isLoading) {
        loginBtn.disabled = true;
        loginBtn.textContent = "กำลังเข้าสู่ระบบ...";
    } else {
        loginBtn.disabled = false;
        loginBtn.textContent = "เข้าสู่ระบบ";
    }
}

// ==========================================
// Order Management Logic
// ==========================================
const ordersTableBody = document.getElementById('ordersTableBody');

function loadOrders() {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    // onSnapshot ทำให้ข้อมูลอัปเดตแบบ Real-time ทันทีที่มีออเดอร์ใหม่เข้ามา
    unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
        ordersTableBody.innerHTML = ''; // ล้างข้อมูลเดิม

        if (querySnapshot.empty) {
            ordersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text2);">ยังไม่มีรายการสั่งพิมพ์</td></tr>`;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // Format Date
            let dateStr = '-';
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                dateStr = `${date.toLocaleDateString('th-TH')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            }

            // Status Badge
            let statusClass = 'status-pending';
            let statusText = 'รอตรวจสอบ';
            if (data.status === 'printing') {
                statusClass = 'status-printing';
                statusText = 'กำลังพิมพ์';
            } else if (data.status === 'completed') {
                statusClass = 'status-completed';
                statusText = 'จัดส่งแล้ว';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>
                    <span class="cust-name">${escapeHTML(data.customerName || 'ไม่ระบุชื่อ')}</span>
                    <span class="cust-contact">📞 ${escapeHTML(data.customerPhone || '-')}</span>
                    <span class="cust-contact" style="display:block; margin-top: 2px;">🏠 ${escapeHTML(data.customerAddress || '-')}</span>
                </td>
                <td>
                    <span class="file-info">${escapeHTML(data.fileName || '-')}</span>
                    <div class="file-settings">
                        ${data.settings ? `
                        ${data.settings.material} ${data.settings.color} | Infill ${data.settings.infill}%<br>
                        Layer: ${data.settings.layerHeight}mm | ${data.settings.support ? 'มี Support' : 'ไม่มี Support'}` : '-'}
                    </div>
                </td>
                <td class="price-tag">฿${data.price ? data.price.toFixed(2) : '0.00'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <select class="status-select" data-id="${id}">
                        <option value="pending" ${data.status === 'pending' ? 'selected' : ''}>รอตรวจสอบ</option>
                        <option value="printing" ${data.status === 'printing' ? 'selected' : ''}>กำลังพิมพ์</option>
                        <option value="completed" ${data.status === 'completed' ? 'selected' : ''}>จัดส่งแล้ว</option>
                    </select>
                </td>
            `;
            ordersTableBody.appendChild(tr);
        });

        // Add event listeners to all select dropdowns
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', (e) => updateOrderStatus(e.target.dataset.id, e.target.value));
        });
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            status: newStatus
        });
    } catch (error) {
        console.error("Error updating status:", error);
        alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
}

// Utility function to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}