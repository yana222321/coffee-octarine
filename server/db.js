import fs from "node:fs";
import path from "node:path";

const FILE = path.join(import.meta.dirname, "data.json");

const seed = {
  products: [
    { id: "robusta", name: "Французский робуста", price: 249, cat: "coffee", tag: "Горячее", desc: "Крупная фракция, ягодные нотки. 250 г — эталон нашего дома.", stock: 20 },
    { id: "koree", name: "Бабл-кофе Корея", price: 299, cat: "coffee", tag: "Новинка", desc: "Нежная тапиока и кофейная пенка. Идеальное «кофе с чаем» в одном стакане.", stock: 14 },
    { id: "coldbrew", name: "Холодный брю", price: 319, cat: "cold", tag: "Холодное", desc: "Длинный холодный эспрессо с кокосовой молокой и какао. Лето спасено.", stock: 12 },
    { id: "jasmine", name: "Жасмин с матчейей", price: 289, cat: "tea", tag: "Чай", desc: "Две травы и зелёный чай. Тонкий цветочный лёгкий.", stock: 18 },
    { id: "cake", name: "Карамельный трюфель", price: 189, cat: "dessert", tag: "Десерт", desc: "Тёмный шоколад, фундуки, каштан. Кофе в глянце.", stock: 9 },
    { id: "tong", name: "Сингапурский тонг", price: 299, cat: "coffee", tag: "Горячее", desc: "Медленный затиранный латте с корицей. Двойная концентрация сладости.", stock: 11 },
    { id: "ivan", name: "Иван-чай с ежевикой", price: 259, cat: "tea", tag: "Чай", desc: "Тёмный травяной чай, лесная ягода, мёд. Зима в стакане.", stock: 16 },
    { id: "oat", name: "Колд брю с овсом", price: 339, cat: "cold", tag: "Холодное", desc: "Холодный эспрессо, овсяная молочная основа, жареный орех. Сытный летний напиток.", stock: 8 },
    { id: "babl", name: "Шоколадный бабл", price: 199, cat: "dessert", tag: "Десерт", desc: "Классический сливочный бабл-ти. Идеальный баланс, яркий вкус.", stock: 13 },
  ],
  orders: [],
  posts: [
    { id: "p1", title: "Почему тапиока — главный ингредиент лета", excerpt: "Джус-боллы, колотый лёд и нежная пенка: разбираем летние напитки.", date: "2026-10-02", tag: "menu" },
    { id: "p2", title: "Рецепт brewfest: как мы тестировали 12 версий кофе", excerpt: "От робусты до бабл-кофе — наш путь дегустаций.", date: "2026-09-18", tag: "lab" },
  ],
  users: [
    { id: 1, name: "Admin", email: "admin@octarine.ru", password: "admin123", role: "admin" },
  ],
};

export function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return structuredClone(seed);
  }
}

export function save(db) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

export const db = load();
