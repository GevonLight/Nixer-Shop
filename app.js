// ============================================================
// ⚡️ АВТО-ЗАГРУЗЧИК ТОВАРОВ (УДАЛИТЬ ПОСЛЕ ОДНОГО ЗАПУСКА)
// ============================================================
async function uploadProducts() {
    const products = [
        { name: "Nixware", price: "450", description: "Высокая стабильность и отличный функционал для игры.", image: "https://i.imgur.com/H9Yv7mC.png" },
        { name: "Fatality.Win", price: "2000", description: "Элитарный софт с уникальными функциями. Выбор профессионалов.", image: "https://i.imgur.com/qN7j9S8.png" },
        { name: "Midnight", price: "550", description: "Скрытный и мощный. Идеальный баланс функций и безопасности.", image: "https://i.imgur.com/pP8P8O2.png" },
        { name: "memesense", price: "550", description: "Простой, эффективный и максимально доступный софт.", image: "https://i.imgur.com/x6Lh7S5.png" },
        { name: "Interium", price: "550", description: "Быстрый старт, легкая настройка и стабильная работа.", image: "https://i.imgur.com/S8XlPjX.png" },
        { name: "NeverLose", price: "3000", description: "Премиальный софт с лучшим комьюнити и функционалом.", image: "https://i.imgur.com/7zL2NfA.png" },
        { name: "AimWare (mira)", price: "400", description: "Проверенная временем классика. Надежность и мощь.", image: "https://i.imgur.com/L1N0GvI.png" },
        { name: "Vacban.wtf invite", price: "25", description: "Эксклюзивный инвайт в закрытое сообщество.", image: "https://i.imgur.com/fC1X2Y8.png" },
    ];

    console.log("Начинаю загрузку товаров...");
    for (const p of products) {
        // Создаем уникальный ID для товара из его названия
        const productId = p.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
        await setDoc(doc(db, "products", productId), p);
        console.log(`Загружен товар: ${p.name}`);
    }
    alert("Все товары успешно загружены в магазин!");
}

// Запускаем загрузку, если мы на главной или в магазине
if (window.location.pathname.includes('index.html') || window.location.pathname.includes('shop.html')) {
    uploadProducts();
}
