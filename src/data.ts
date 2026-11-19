export type Category = "coffee" | "cold" | "tea" | "dessert";

export interface Product {
  id: string;
  name: string;
  price: number;
  cat: Category | string;
  tag: string;
  desc: string;
  stock: number;
}

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  tag: string;
  image?: string;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Check {
  number: number;
  issuedAt: string;
  items: OrderItem[];
  total: number;
  payment: string;
  cafe: string;
  customer: { name: string; phone: string; email?: string };
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  customer: { name: string; phone: string; email?: string; comment?: string };
  status: "new" | "doing" | "ready" | "done" | "canceled";
  createdAt: string;
  check: Check;
}

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface LocalUser extends User {
  password: string;
}

export interface Sticker {
  id: string;
  icon: string;
  x: number;
  y: number;
  color: string;
  size: number;
  rot: number;
}

export const round2 = (value: number) => Math.round(value * 100) / 100;

export const SEED_PRODUCTS: Product[] = [
  {
    id: "robusta",
    name: "Французский робуста",
    price: 249,
    cat: "coffee",
    tag: "Горячее",
    desc: "Крупная фракция, ягодные нотки. 250 г — эталон нашего дома.",
    stock: 20,
  },
  {
    id: "koree",
    name: "Бабл-кофе Корея",
    price: 299,
    cat: "coffee",
    tag: "Новинка",
    desc: "Нежная тапиока и кофейная пенка. Идеальное «кофе с чаем» в одном стакане.",
    stock: 14,
  },
  {
    id: "coldbrew",
    name: "Холодный брю",
    price: 319,
    cat: "cold",
    tag: "Холодное",
    desc: "Длинный холодный эспрессо с кокосовой молокой и какао. Лето спасено.",
    stock: 12,
  },
  {
    id: "jasmine",
    name: "Жасмин с матчатей",
    price: 289,
    cat: "tea",
    tag: "Чай",
    desc: "Две травы и зелёный чай. Тонкий цветочный лёгкий.",
    stock: 18,
  },
  {
    id: "cake",
    name: "Карамельный трюфель",
    price: 189,
    cat: "dessert",
    tag: "Десерт",
    desc: "Тёмный шоколад, фундук, каштан. Кофе в глянце.",
    stock: 9,
  },
  {
    id: "tong",
    name: "Сингапурский тонг",
    price: 299,
    cat: "coffee",
    tag: "Горячее",
    desc: "Медленный затиранный латте с корицей. Двойная концентрация сладости.",
    stock: 11,
  },
  {
    id: "ivan",
    name: "Иван-чай с ежевикой",
    price: 259,
    cat: "tea",
    tag: "Чай",
    desc: "Тёмный травяной чай, лесная ягода, мёд. Зима в стакане.",
    stock: 16,
  },
  {
    id: "oat",
    name: "Колд брю с овсом",
    price: 339,
    cat: "cold",
    tag: "Холодное",
    desc: "Холодный эспрессо, овсяная молочная основа, жареный орех.",
    stock: 8,
  },
  {
    id: "babl",
    name: "Шоколадный бабл",
    price: 199,
    cat: "dessert",
    tag: "Десерт",
    desc: "Классический сливочный бабл-ти. Идеальный баланс, яркий вкус.",
    stock: 13,
  },
];

export const SEED_POSTS: Post[] = [
  {
    id: "p1",
    title: "Почему тапиока — главный ингредиент лета",
    excerpt: "Джус-боллы, колотый лёд и нежная пенка: разбираем летние напитки.",
    content:
      "Тапиока появилась в наших напитках случайно: бариста привёз её с фестиваля в Сеуле, и мы недели две пробовали разные текстуры. Победила маленькая жемчужина — она даёт тот самый «попс», ради которого люди возвращаются.\n\nСекрет прост: шарики варятся строго по таймеру, затем охлаждаются в ледяной воде и соединяются с напитком прямо перед подачей. Так они остаются упругими и не разбухают.\n\nПриходите попробовать бабл-кофе Корея и шоколадный бабл — это два разных характера одного ингредиента.",
    date: "2026-10-02",
    tag: "menu",
    image: "/assets/coffee-cups.jpg",
  },
  {
    id: "p2",
    title: "Рецепт brewfest: как мы тестировали 12 версий кофе",
    excerpt: "От робусты до бабл-кофе — наш путь дегустаций.",
    content:
      "Мы заварили больше ста чашек, чтобы понять, какой кофе хочется пить каждый день. Начинали с классической робусты: плотное тело, ягодная кислинка, длинное послевкусие.\n\nПотом экспериментировали с температурой, временем экстракции и разными молочными основами. Овсяная молока неожиданно лучше всего раскрыла холодный брю.\n\nИтог — линейка, в которой каждый найдёт свой восьмой цвет. Делитесь в комментариях, какой напиток стал вашим фаворитом.",
    date: "2026-09-18",
    tag: "lab",
    image: "/assets/coffee-machine.jpg",
  },
];

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const demoOrder = (
  index: number,
  days: number,
  productIds: string[],
  qty: number,
  name: string,
): Order => {
  const items = productIds.map((id) => {
    const product = SEED_PRODUCTS.find((item) => item.id === id)!;
    return { productId: product.id, name: product.name, qty, price: product.price };
  });
  const total = round2(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  const issuedAt = daysAgo(days);
  const customer = { name, phone: "+7 999 000-00-00" };
  return {
    id: `ord_demo_${index}`,
    items,
    total,
    customer,
    status: "done",
    createdAt: issuedAt,
    check: {
      number: 1000 + index,
      issuedAt,
      items,
      total,
      payment: "Карта",
      cafe: "Octarine",
      customer,
    },
  };
};

export const SEED_ORDERS: Order[] = [
  demoOrder(1, 1, ["koree", "cake"], 2, "Анна"),
  demoOrder(2, 2, ["robusta", "ivan"], 1, "Михаил"),
  demoOrder(3, 3, ["coldbrew", "babl", "oat"], 1, "Полина"),
  demoOrder(4, 5, ["tong", "jasmine"], 3, "Дмитрий"),
];

export const SEED_USERS: LocalUser[] = [
  { id: 1, name: "Admin", email: "admin@octarine.ru", password: "admin123", role: "admin" },
];

export const SEED_STICKERS: Sticker[] = [
  { id: "st-1", icon: "✦", x: 12, y: 24, color: "#cceef2", size: 54, rot: -14 },
  { id: "st-2", icon: "☕", x: 84, y: 64, color: "#f6f1ed", size: 48, rot: 12 },
  { id: "st-3", icon: "★", x: 68, y: 18, color: "#f4afd2", size: 42, rot: 8 },
];

export const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "Всё" },
  { id: "coffee", label: "Кофе" },
  { id: "cold", label: "Холодное" },
  { id: "tea", label: "Чай" },
  { id: "dessert", label: "Десерты" },
];

export const STATUS_LABELS: Record<Order["status"], string> = {
  new: "Новый",
  doing: "Готовится",
  ready: "Готов",
  done: "Выдан",
  canceled: "Отменён",
};

export const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

export const shortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
};

export const productImage = (product: Product) => {
  const images: Record<string, string> = {
    robusta: "/assets/coffee-machine.jpg",
    koree: "/assets/coffee-cups.jpg",
    coldbrew: "/assets/coffee-latte.jpg",
    jasmine: "/assets/coffee-interior.jpg",
    cake: "/assets/coffee-latte.jpg",
    tong: "/assets/coffee-barista.jpg",
    ivan: "/assets/coffee-interior.jpg",
    oat: "/assets/coffee-machine.jpg",
    babl: "/assets/coffee-cups.jpg",
  };
  return (
    images[product.id] ??
    (product.cat === "dessert" ? "/assets/coffee-cups.jpg" : "/assets/coffee-latte.jpg")
  );
};

export const postImage = (post: Post) => post.image ?? "/assets/coffee-barista.jpg";
