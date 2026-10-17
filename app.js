import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let generatedCode = null;
let pendingUserEmail = null;
let pendingUserPass = null;
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

emailjs.init(EMAILJS_PUBLIC_KEY);

// UI Переключение
const loginForm = document.getElementById('login-form');
const regForm = document.getElementById('reg-form');
const codeForm = document.getElementById('code-form');

if(document.getElementById('show-reg')) {
    document.getElementById('show-reg').onclick = () => { if(loginForm) loginForm.style.display = 'none'; if(regForm) regForm.style.display = 'block'; };
}
if(document.getElementById('show-login')) {
    document.getElementById('show-login').onclick = () => { if(regForm) regForm.style.display = 'none'; if(loginForm) loginForm.style.display = 'block'; };
}
if(document.getElementById('back-to-login')) {
    document.getElementById('back-to-login').onclick = () => { if(codeForm) codeForm.style.display = 'none'; if(loginForm) loginForm.style.display = 'block'; };
}

// Сброс пароля
const forgotPassBtn = document.getElementById('forgot-pass');
if (forgotPassBtn) {
    forgotPassBtn.onclick = async () => {
        const email = document.getElementById('login-email').value;
        if (!email) return alert("Сначала введите ваш Email!");
        try { await sendPasswordResetEmail(auth, email); alert("Инструкции отправлены на почту!"); } catch (e) { alert("Ошибка: " + e.message); }
    };
}

// Регистрация
const regBtn = document.getElementById('do-reg');
if (regBtn) {
    regBtn.onclick = async () => {
        const nick = document.getElementById('reg-nick').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        if (!nick || !email || !pass) return alert("Заполните все поля!");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", userCredential.user.uid), { uid: userCredential.user.uid, nick: nick, email: email, title: "User", role: "user", avatar: DEFAULT_AVATAR });
            alert("Аккаунт создан! Теперь войдите."); location.reload();
        } catch (e) { alert("Ошибка: " + e.message); }
    };
}

// Вход
const loginBtn = document.getElementById('do-login');
if (loginBtn) {
    loginBtn.onclick = async () => {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
            pendingUserEmail = email; pendingUserPass = pass;
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: email, code: generatedCode });
            await signOut(auth);
            if(loginForm) loginForm.style.display = 'none';
            if(codeForm) codeForm.style.display = 'block';
            alert("Код отправлен на почту!");
        } catch (e) { alert("Неверный email или пароль!"); }
    };
}

// Верификация кода
const verifyBtn = document.getElementById('do-verify');
if (verifyBtn) {
    verifyBtn.onclick = async () => {
        const enteredCode = document.getElementById('auth-code').value;
        if (enteredCode === generatedCode) {
            try { await signInWithEmailAndPassword(auth, pendingUserEmail, pendingUserPass); location.reload(); } catch (e) { alert("Ошибка"); }
        } else { alert("Неверный код!"); }
    };
}

// Профиль и Права
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const adminLink = document.getElementById('admin-link');
        if (adminLink && userData?.role === 'admin') adminLink.style.display = 'block';
        if (window.location.pathname.includes('admin.html') && userData?.role !== 'admin') { alert("Доступ запрещен!"); window.location.href = 'index.html'; }
        if (window.location.pathname.includes('profile.html') && userData) {
            document.getElementById('user-avatar').src = userData.avatar;
            document.getElementById('user-id').innerText = `ID: ${userData.uid}`;
            const nickEl = document.getElementById('user-nick');
            const titleEl = document.getElementById('user-title');
            nickEl.innerText = userData.nick; titleEl.innerText = userData.title;
            const titleClass = getTitleClass(userData.title);
            nickEl.className = `user-info nick-${titleClass}`; titleEl.className = `user-info title-${titleClass}`;
        }
        if (window.location.pathname.includes('index.html')) {
            if(loginForm) loginForm.style.display = 'none';
            if(regForm) regForm.style.//display = 'none';
            if(codeForm) codeForm.style.display = 'none';
            const display = document.getElementById('user-display');
            if (display) { display.style.display = 'block'; document.getElementById('welcome-text').innerHTML = `Привет, <span class="nick-${getTitleClass(userData?.title)}">${userData?.nick}</span>!`; }
        }
    } else {
        if (window.location.pathname.includes('profile.html') || window.location.pathname.includes('admin.html')) window.location.href = 'index.html';
    }
});

function getTitleClass(title) {
    if (title === "Moderator") return "mod";
    if (title === "Admin") return "admin";
    if (title === ") Медиа длинное") return "media";
    return "user";
}

// Магазин
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        grid.innerHTML = "";
        if (querySnapshot.empty) { grid.innerHTML = "<div class='loading'>Товары еще не добавлены.</div>"; return; }
        querySnapshot.forEach((doc) => {
            const p = doc.data();
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `<img src="${p.image || 'https://via.placeholder.com/200'}" class="product-image"><div class="product-name">${p.name}</div><div class="product-description">${p.description}</div><div class="product-price">${p.price} ₽</div><button class="btn btn-buy" onclick="alert('Заказ на ${p.name} отправлен!')">Купить</button>`;
            grid.appendChild(card);
        });
    } catch (e) { grid.innerHTML = "<div class='loading'>Ошибка загрузки.</div>"; }
}
if (window.location.pathname.includes('shop.html')) loadProducts();

// Админка
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
        } else { alert("Пользователь не найден!"); }
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
