import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================================
// 1. НАСТРОЙКИ
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyDtRc4CG4JVANcY-JA7DLNzB6N9X9SSu9U",
    authDomain: "nixer-shop.firebaseapp.com",
    projectId: "nixer-shop",
    storageBucket: "nixer-shop.firebasestorage.app",
    messagingSenderId: "778032583087",
    appId: "1:778032583087:web:c050b96923d6032dab5f5a",
    measurementId: "G-CHES16PF8Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// ============================================================
// 2. УПРАВЛЕНИЕ ОКНАМИ
// ============================================================
const loginForm = document.getElementById('login-form');
const regForm = document.getElementById('reg-form');

if(document.getElementById('show-reg')) {
    document.getElementById('show-reg').onclick = () => { 
        if(loginForm) loginForm.style.display = 'none'; 
        if(regForm) regForm.style.display = 'block'; 
    };
}
if(document.getElementById('show-login')) {
    document.getElementById('show-login').onclick = () => { 
        if(regForm) regForm.style.display = 'none'; 
        if(loginForm) loginForm.style.display = 'block'; 
    };
}

// ============================================================
// 3. СБРОС ПАРОЛЯ
// ============================================================
const forgotPassBtn = document.getElementById('forgot-pass');
if (forgotPassBtn) {
    forgotPassBtn.onclick = async () => {
        const email = document.getElementById('login-email').value;
        if (!email) return alert("Сначала введите ваш Email!");
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Инструкции по сбросу пароля отправлены на почту!");
        } catch (e) { alert("Ошибка: " + e.message); }
    };
}

// ============================================================
// 4. РЕГИСТРАЦИЯ
// ============================================================
const regBtn = document.getElementById('do-reg');
if (regBtn) {
    regBtn.onclick = async () => {
        const nick = document.getElementById('reg-nick').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        if (!nick || !email || !pass) return alert("Заполните все поля!");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid, nick: nick, email: email, title: "User", role: "user", avatar: DEFAULT_AVATAR
            });
            alert("Аккаунт создан! Теперь войдите.");
            location.reload();
        } catch (e) { alert("Ошибка регистрации: " + e.message); }
    };
}

// ============================================================
// 5. ВХОД (ПРЯМОЙ)
// ============================================================
const loginBtn = document.getElementById('do-login');
if (loginBtn) {
    loginBtn.onclick = async () => {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            location.reload();
        } catch (e) { 
            console.error("Ошибка входа:", e);
            alert("Неверный email или пароль!"); 
        }
    };
}

// ============================================================
// 6. ПРОВЕРКА ПОЛЬЗОВАТЕЛЯ
// ============================================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        const adminLink = document.getElementById('admin-link');
        if (adminLink && userData?.role === 'admin') adminLink.style.display = 'block';

        if (window.location.pathname.includes('admin.html') && userData?.role !== 'admin') {
            alert("Доступ запрещен!"); window.location.href = 'index.html';
        }

        if (window.location.pathname.includes('profile.html') && userData) {
            document.getElementById('user-avatar').src = userData.avatar;
            document.getElementById('user-id').innerText = `ID: ${userData.uid}`;
            const nickEl = document.getElementById('user-nick');
            const titleEl = document.getElementById('user-title');
            nickEl.innerText = userData.nick;
            titleEl.innerText = userData.title;
            const titleClass = getTitleClass(userData.title);
            nickEl.className = `user-info nick-${titleClass}`;
            titleEl.className = `user-info title-${titleClass}`;
        }

        if (window.location.pathname.includes('index.html')) {
            if(loginForm) loginForm.style.display = 'none';
            if(regForm) regForm.style.display = 'none';
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

// ============================================================
// 7. АДМИН-ПАНЕЛЬ
// ============================================================
const findUserBtn = document.getElementById('find-user-btn');
if (findUserBtn) {
    findUserBtn.onclick = async () => {
        const uid = document.getElementById('edit-id').value;
        if (!uid) return alert("Введите UID!");
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
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
        const updates = {
            nick: document.getElementById('edit-nick').value,
            title: document.getElementById('edit-title').value,
            avatar: document.getElementById('edit-avatar').value,
        };
        await updateDoc(doc(db, "users", uid), updates);
        alert("Данные обновлены!");
    };
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = () => signOut(auth).then(() => location.href = 'index.html');
}
