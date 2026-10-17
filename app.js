// ============================================================
// 3. ОБНОВЛЕННАЯ РЕГИСТРАЦИЯ (С ПРОВЕРКОЙ)
// ============================================================
function setupRegistration() {
    const regBtn = document.getElementById('do-reg');
    if (!regBtn) {
        console.error("Кнопка do-reg не найдена в HTML!");
        return;
    }

    console.log("Событие регистрации успешно привязано к кнопке");

    regBtn.onclick = async (e) => {
        e.preventDefault(); // Предотвращаем перезагрузку страницы
        console.log("Нажата кнопка регистрации...");

        const nick = document.getElementById('reg-nick')?.value;
        const email = document.getElementById('reg-email')?.value;
        const pass = document.getElementById('reg-pass')?.value;

        if (!nick || !email || !pass) {
            alert("Пожалуйста, заполните все поля!");
            return;
        }

        try {
            console.log("Попытка создания пользователя в Firebase...");
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const uid = userCredential.user.uid;
            
            const refCode = "NIXER" + Math.random().toString(36).substring(2, 8).toUpperCase();

            await setDoc(doc(db, "users", uid), {
                uid: uid,
                nick: nick,
                email: email,
                title: "User",
                role: "user",
                avatar: DEFAULT_AVATAR,
                referralCode: refCode,
                balance: 0,
                referredBy: null
            });

            console.log("Пользователь успешно создан:", uid);
            alert("Аккаунт успешно создан! Ваш реф-код: " + refCode);
            location.reload();
        } catch (error) {
            console.error("Ошибка Firebase при регистрации:", error);
            alert("Ошибка регистрации: " + error.message);
        }
    };
}

// Запускаем настройку регистрации сразу при загрузке
setupRegistration();
