import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, onAuthStateChanged, sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, setDoc, updateDoc, 
    collection, getDocs, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDtRc4CG4JVANcY-JA7DLNzB6N9X9SSu9U",
    authDomain: "nixer-shop.firebaseapp.com",
    projectId: "nixer-shop",
    storageBucket: "nixer-shop.firebasestorage.app",
    messagingSenderId: "778032583087",
    appId: "1:778032583087:web:c050b96923d6032dab5f5a",
    measurementId: "G-CHES16PF8Y"
};

const EMAILJS_SERVICE_ID = "service_nixershop";
const EMAILJS_TEMPLATE_ID = "template_5spf6og";
const EMAILJS_PUBLIC_KEY = "egHeKDfgrUFLL8z58";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

emailjs.init(EMAILJS_PUBLIC_KEY);

let generatedCode = null, pendingUserEmail = null, pendingUserPass = null;

// ============================================================
// БЕЗОПАСНАЯ ПРИВЯЗКА СОБЫТИЙ (Исправление ошибки в консоли)
// ============================================================
function setupEventListeners() {
    // Элементы навигации и модалки
    const openAuthBtn = document.getElementById('open-auth-btn');
    const closeAuthBtn = document.getElementById('close-auth-btn');
    const authModal = document.getElementById('auth-modal');

    if (openAuthBtn) openAuthBtn.onclick = () => { if(authModal) authModal.style.display = 'flex'; };
    if (closeAuthBtn) closeAuthBtn.onclick = () => { if(authModal) authModal.style.display = 'none'; };

    // Формы входа/регистрации
    const showReg = document.getElementById('show-reg');
    const showLogin = document.getElementById('show-login');
    const backToLogin = document.getElementById('back-to-login');
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('reg-form');
    const codeForm = document.getElementById('code-form');

    if (showReg && loginForm && regForm) {
        showReg.onclick = () => { loginForm.style.display = 'none'; regForm.style.display = 'block'; };
    }
    if (showLogin && regForm && loginForm) {
        showLogin.onclick = () => { regForm.style.display = 'none'; loginForm.style.display = 'block'; };
    }
    if (backToLogin && codeForm && loginForm) {
        backToLogin.onclick = () => { codeForm.style.//display = 'none'; loginForm.style.display = 'block'; };
    }

    // Кнопка сброса пароля
    const forgotPassBtn = document.getElementById('forgot-pass');
    if (forgotPassBtn) {
        forgotPassBtn.onclick = async () => {
            const email = document.getElementById('login-email')?.value;
            if (!email) return alert("Введите Email!");
            try { await sendPasswordResetEmail(auth, email); alert("Инструкции отправлены!"); } catch (e) { alert("Ошибка"); }
        };
    }

    // Кнопка регистрации
    const regBtn = document.getElementById('do-reg');
    if (regBtn) {
        regBtn.onclick = async () => {
            const nick = document.getElementById('reg-nick')?.value;
            const email = document.getElementById('reg-email')?.value;
            const pass = document.getElementById('reg-pass')?.value;
            if (!nick || !email || !pass) return alert("Заполните всё!");
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                const uid = userCredential.user.uid;
                const refCode = "NIXER" + Math.random().toString(36).substring(2, 8).toUpperCase();
                await setDoc(doc(db, "users", uid), { uid, nick, email, title: "User", role: "user", avatar: DEFAULT_AVATAR, referralCode: refCode, balance: 0, referredBy: null });
                alert("Аккаунт создан!"); location.reload();
            } catch (e) { alert("Ошибка: " + e.message); }
        };
    }

    // Кнопка входа
    const loginBtn = document.getElementById('do-login');
    if (loginBtn) {
        loginBtn.onclick = async () => {
            const email = document.getElementById('login-email')?.value;
            const pass = document.getElementById('login-pass')?.value;
            try {
                await signInWithEmailAndPassword(auth, email, pass);
                generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
                pendingUserEmail = email; pendingUserPass = pass;
                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: email, code: generatedCode });
                await signOut(auth);
                if(loginForm) loginForm.style.display = 'none';
                if(codeForm) codeForm.style.display = 'block';
                alert("Код отправлен!");
            } catch (e) { alert("Неверный email или пароль!"); }
        };
    }

    // Кнопка верификации кода
    const verifyBtn = document.getElementById('do-verify');
    if (verifyBtn) {
        verifyBtn.onclick = async () => {
            const enteredCode = document.getElementById('auth-code')?.value;
            if (enteredCode === generatedCode) {
                try { await signInWithEmailAndPassword(auth, pendingUserEmail, pendingUserPass); location.reload(); } catch (e) { alert("Ошибка"); }
            } else { alert("Неверный код!"); }
        };
    }

    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => signOut(auth).then(() => location.href = 'index.html');
    }
}

// ============================================================
// ПРОФИЛЬ, ПРАВА И МАГАЗИН
// ============================================================
onAuthStateChanged(auth, async (user) => {
    const navAuth = document.getElementById('nav-auth');
    if (user) {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.data();
        if (navAuth) navAuth.innerHTML = ""; 

        const adminLink = document.getElementById('admin-link');
        if (adminLink && userData?.role === 'admin') adminLink.style.display = 'block';
        
        if (window.location.pathname.includes('admin.html') && userData?.role !== 'admin') {
            alert("Нет доступа!"); window.location.href = 'index.//html';
        }

        if (window.location.pathname.includes('profile.html') && userData) {
            document.getElementById('user-avatar').src = userData.avatar;
            document.getElementById('user-id').innerText = `ID: ${userData.uid}`;
            document.getElementById('user-nick').innerText = userData.nick;
            document.getElementById('user-title').innerText = userData.title;
            const titleClass = getTitleClass(userData.title);
            document.getElementById('user-nick').className = `user-info nick-${titleClass}`;
            document.getElementById('user-title').className = `user-info title-${titleClass}`;
            
            const profileDiv = document.querySelector('.user-info');
            if (profileDiv) {
                const refBox = document.createElement('div');
                refBox.className = 'ref-box';
                refBox.innerHTML = `<strong>Ваша реф-ссылка:</strong><br><span>${window.location.origin}/index.html?ref=${userData.referralCode}</span>`;
                refBox.onclick = () => { navigator.clipboard.writeText(refBox.innerText); alert("Скопировано!"); };
                profileDiv.appendChild(refBox);
            }
        }

        if (window.location.pathname.includes('index.html')) {
            const authSection = document.getElementById('auth-section');
            if(authSection) authSection.style.display = 'none';
            const display = document.getElementById('user-display');
            if (display) {
                display.style.display = 'block';
                document.getElementById('welcome-text').innerHTML = `Привет, <span class="nick-${getTitleClass(userData?.title)}">${userData?.nick}</span>!`;
            }
        }
    } else {
        if (window.location.pathname.includes('profile.html') || window.location.pathname.includes('admin.html')) {
            window.location.href = 'index.html';
        }
    }
});

function getTitleClass(title) {
    if (title === "Moderator") return "mod";
    if (title === "Admin") return "admin";
    if (title === ") Медиа длинное") return "media";
    return "user";
}

// Загрузка товаров на главной
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    try {
        const snap = await getDocs(collection(db, "products"));
        grid.innerHTML = "";
        if (snap.empty) { grid.innerHTML = "<div class='loading'>Товары отсутствуют.</div>"; return; }
        snap.forEach(docSnap => {
            const p = docSnap.data();
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `<img src="${p.image || 'https://via.placeholder.com/200'}" class="product-image"><div class="product-name">${p.name}</div><div class="product-description">${p.description}</div><div class="product-price">${p.price} ₽</div><button class="btn btn-buy" onclick="alert('Заказ на ${p.name} отправлен!')">Купить</button>`;
            grid.appendChild(card);
        });
    } catch (e) { grid.innerHTML = "<div class='loading'>Ошибка загрузки.</div>"; }
}

// Админка: Функции
async function loadAdminProducts() {
    const body = document.getElementById('prod-list-body');
    if (!body) return;
    const snap = await getDocs(collection(db, "products"));
    body.innerHTML = "";
    snap.forEach(docSnap => {
        const p = docSnap.data();
        body.innerHTML += `<tr><td>${p.name}</td><td>${p.price} ₽</td><td><button class="btn btn-danger btn-small" onclick="deleteProduct('${docSnap.id}')">Удалить</button></td></tr>`;
    });
}

window.deleteProduct = async (id) => {
    if (confirm("Удалить?")) { await deleteDoc(doc(db, "products", id)); location.reload(); }
};

const addProdBtn = document.getElementById('add-prod-btn');
if (addProdBtn) {
    addProdBtn.onclick = async () => {
        const name = document.getElementById('prod-name').value;
        const price = document.getElementById('prod-price').value;
        const desc = document.getElementById('prod-desc').value;
        const img = document.getElementById('prod-img').value;
        if (!name || !price) return alert("Имя и цена обязательны!");
        const prodId = name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
        await setDoc(doc(db, "products", prodId), { name, price, description: desc, image: img });
        alert("Товар добавлен!"); location.reload();
    };
}

const findUserBtn = document.getElementById('find-user-btn');
if (findUserBtn) {
    findUserBtn.onclick = async () => {
        const uid = document.getElementById('edit-id').value;
        if (!uid) return alert("Введите UID!");
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
            const data = userSnap.data();
            document.getElementById('edit-nick').value = data.nick;
            document.getElementById('edit-title').value = data.title;
            document.getElementById('edit-avatar').value = data.avatar;
        } else { alert("Не найден!"); }
    };
}
const saveUserBtn = document.getElementById('save-user-btn');
if (saveUserBtn) {
    saveUserBtn.onclick = async () => {
        const uid = document.getElementById('edit-id').value;
        if (!uid) return alert("Введите UID!");
        await updateDoc(doc(db, "users", uid), {
            nick: document.getElementById('edit-nick').value,
            title: document.getElementById('edit-title').value,
            avatar: document.getElementById('edit-avatar').value,
        });
        alert("Обновлено!");
    };
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) { logoutBtn.onclick = () => signOut(auth).then(() => location.href = 'index.html'); }

// ЗАПУСК
setupEventListeners();
if (window.location.pathname.includes('index.html')) loadProducts();
if (window.location.pathname.includes('admin.html')) loadAdminProducts();
