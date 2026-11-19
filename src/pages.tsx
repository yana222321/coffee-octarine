import { useMemo, useState, type FormEvent } from "react";
import {
  CATEGORIES,
  STATUS_LABELS,
  money,
  postImage,
  productImage,
  shortDate,
  type CartLine,
  type Order,
  type Product,
} from "./data";
import { useStore } from "./store";

type Navigate = (path: string) => void;

function PageHead({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div className="page-head">
      <p className="eyebrow">{kicker}</p>
      <h1>{title}</h1>
      <p className="page-head-text">{text}</p>
    </div>
  );
}

export function Catalog({ navigate }: { navigate: Navigate }) {
  const { products, addToCart, cart } = useStore();
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("popular");
  const [added, setAdded] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = products.filter(
      (product) =>
        (cat === "all" || product.cat === cat) &&
        (!needle ||
          `${product.name} ${product.desc} ${product.tag}`.toLowerCase().includes(needle)),
    );
    if (sort === "cheap") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "expensive") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    return list;
  }, [products, cat, query, sort]);

  const handleAdd = (product: Product) => {
    addToCart(product.id);
    setAdded(product.id);
    window.setTimeout(() => setAdded(null), 1200);
  };

  const count = cart.reduce((sum, line) => sum + line.qty, 0);

  return (
    <div className="app-page">
      <PageHead
        kicker="Меню / на каждый день"
        title="Каталог"
        text="Зерно, лёд, трава и сладости. Всё, что мы умеем делать вкусным, — в одном месте."
      />
      <div className="catalog-toolbar">
        <div className="chips">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${cat === item.id ? "active" : ""}`}
              onClick={() => setCat(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="toolbar-fields">
          <label className="field-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти напиток или десерт"
              aria-label="Поиск по каталогу"
            />
          </label>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Сортировка"
          >
            <option value="popular">Сначала популярные</option>
            <option value="cheap">Сначала дешёвые</option>
            <option value="expensive">Сначала дорогие</option>
            <option value="name">По названию</option>
          </select>
        </div>
      </div>

      <div className="catalog-meta">
        <span>{visible.length} позиций</span>
        <button type="button" className="link-button" onClick={() => navigate("/cart")}>
          В корзине: {count} →
        </button>
      </div>

      {visible.length ? (
        <div className="product-grid">
          {visible.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                <img src={productImage(product)} alt={product.name} loading="lazy" />
                <span className="product-tag">{product.tag}</span>
                <span className={`stock ${product.stock < 10 ? "low" : ""}`}>
                  {product.stock ? `В наличии: ${product.stock}` : "Нет в наличии"}
                </span>
              </div>
              <div className="product-body">
                <h3>{product.name}</h3>
                <p>{product.desc}</p>
                <div className="product-bottom">
                  <strong>{money(product.price)}</strong>
                  <button
                    type="button"
                    className={`add-button ${added === product.id ? "added" : ""}`}
                    disabled={!product.stock}
                    onClick={() => handleAdd(product)}
                  >
                    {added === product.id
                      ? "Добавлено ✓"
                      : product.stock
                        ? "В корзину"
                        : "Нет в наличии"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-icon">⌕</p>
          <h2>Ничего не нашли</h2>
          <p>Попробуйте другой запрос или сбросьте фильтр.</p>
          <button
            type="button"
            className="button-dark"
            onClick={() => {
              setCat("all");
              setQuery("");
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
}

export function CartPage({ navigate }: { navigate: Navigate }) {
  const { cart, products, setQty, removeFromCart } = useStore();
  const lines = cart
    .map((line) => ({ line, product: products.find((item) => item.id === line.productId) }))
    .filter((item): item is { line: CartLine; product: Product } => Boolean(item.product));
  const total = lines.reduce((sum, { line, product }) => sum + line.qty * product.price, 0);

  return (
    <div className="app-page">
      <PageHead
        kicker="Ваш заказ"
        title="Корзина"
        text="Проверьте состав заказа — чек мы сформируем сразу после оформления."
      />
      {lines.length ? (
        <div className="cart-layout">
          <div className="cart-list">
            {lines.map(({ line, product }) => (
              <article className="cart-row" key={line.productId}>
                <img src={productImage(product)} alt={product.name} />
                <div className="cart-row-info">
                  <h3>{product.name}</h3>
                  <p>{product.desc}</p>
                  <button
                    type="button"
                    className="link-button danger"
                    onClick={() => removeFromCart(line.productId)}
                  >
                    Удалить
                  </button>
                </div>
                <div className="qty-control" aria-label="Количество">
                  <button type="button" onClick={() => setQty(line.productId, line.qty - 1)}>
                    −
                  </button>
                  <span>{line.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(line.productId, Math.min(line.qty + 1, product.stock))}
                  >
                    +
                  </button>
                </div>
                <strong className="cart-row-price">{money(product.price * line.qty)}</strong>
              </article>
            ))}
          </div>
          <aside className="summary-card">
            <h2>Итого</h2>
            <div className="summary-line">
              <span>Позиций</span>
              <b>{lines.reduce((sum, { line }) => sum + line.qty, 0)}</b>
            </div>
            <div className="summary-line">
              <span>Доставка</span>
              <b>Бесплатно</b>
            </div>
            <div className="summary-line total">
              <span>К оплате</span>
              <b>{money(total)}</b>
            </div>
            <button
              type="button"
              className="button-dark wide"
              onClick={() => navigate("/checkout")}
            >
              Оформить заказ →
            </button>
            <button type="button" className="link-button" onClick={() => navigate("/catalog")}>
              ← Вернуться в каталог
            </button>
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-icon">☕</p>
          <h2>Пока пусто</h2>
          <p>Самое время выбрать что-нибудь вкусное.</p>
          <button type="button" className="button-dark" onClick={() => navigate("/catalog")}>
            В каталог
          </button>
        </div>
      )}
    </div>
  );
}

export function CheckoutPage({ navigate }: { navigate: Navigate }) {
  const { cart, products, checkout, user } = useStore();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: "",
    email: user?.email ?? "",
    comment: "",
    payment: "card",
  });
  const lines = cart
    .map((line) => ({ line, product: products.find((item) => item.id === line.productId) }))
    .filter((item): item is { line: CartLine; product: Product } => Boolean(item.product));
  const total = lines.reduce((sum, { line, product }) => sum + line.qty * product.price, 0);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lines.length) return;
    const order = checkout(
      { name: form.name, phone: form.phone, email: form.email, comment: form.comment },
      form.payment === "card" ? "Карта" : form.payment === "cash" ? "Наличные" : "При получении",
    );
    navigate(`/order/${order.id}`);
  };

  if (!lines.length) {
    return (
      <div className="app-page">
        <div className="empty-state">
          <h2>Корзина пуста</h2>
          <button type="button" className="button-dark" onClick={() => navigate("/catalog")}>
            В каталог
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <PageHead
        kicker="Последний шаг"
        title="Оформление заказа"
        text="Оставьте контакты — мы соберём заказ и выставим чек."
      />
      <div className="cart-layout">
        <form className="checkout-form" onSubmit={submit}>
          <h2>Контактные данные</h2>
          <label>
            Имя
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Как к вам обращаться"
            />
          </label>
          <label>
            Телефон
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+7 999 000-00-00"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
            />
          </label>
          <label>
            Комментарий
            <textarea
              rows={3}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Без сахара, extra hot..."
            />
          </label>
          <fieldset>
            <legend>Способ оплаты</legend>
            <div className="payment-options">
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={form.payment === "card"}
                  onChange={() => setForm({ ...form, payment: "card" })}
                />{" "}
                Карта
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={form.payment === "cash"}
                  onChange={() => setForm({ ...form, payment: "cash" })}
                />{" "}
                Наличные
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="counter"
                  checked={form.payment === "counter"}
                  onChange={() => setForm({ ...form, payment: "counter" })}
                />{" "}
                На стойке
              </label>
            </div>
          </fieldset>
          <button type="submit" className="button-dark wide">
            Подтвердить заказ →
          </button>
        </form>
        <aside className="summary-card">
          <h2>Ваш заказ</h2>
          {lines.map(({ line, product }) => (
            <div className="summary-line" key={line.productId}>
              <span>
                {product.name} × {line.qty}
              </span>
              <b>{money(product.price * line.qty)}</b>
            </div>
          ))}
          <div className="summary-line total">
            <span>К оплате</span>
            <b>{money(total)}</b>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ReceiptPage({ id, navigate }: { id: string; navigate: Navigate }) {
  const { orders } = useStore();
  const order = orders.find((item) => item.id === id);

  const download = () => {
    if (!order) return;
    const lines = order.check.items.map(
      (item) => `${item.name} × ${item.qty} — ${money(item.price * item.qty)}`,
    );
    const text = [
      "OCTARINE — кофейня восьмого цвета",
      `Чек №${order.check.number}`,
      `Дата: ${new Date(order.check.issuedAt).toLocaleString("ru-RU")}`,
      `Клиент: ${order.customer.name} ${order.customer.phone}`,
      "",
      ...lines,
      "",
      `Оплата: ${order.check.payment}`,
      `ИТОГО: ${money(order.check.total)}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `octarine-check-${order.check.number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!order) {
    return (
      <div className="app-page">
        <div className="empty-state">
          <h2>Заказ не найден</h2>
          <button type="button" className="button-dark" onClick={() => navigate("/account")}>
            Мои заказы
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page receipt-page">
      <div className="receipt-success">
        <span>✓</span>
        <h1>Заказ принят!</h1>
        <p>Мы уже начали готовить. Чек сохранён и доступен для печати.</p>
      </div>
      <article className="receipt" id="receipt-print">
        <div className="receipt-top">
          <strong>OCTARINE</strong>
          <span>кофейня восьмого цвета</span>
          <span>Москва, ул. Восьмого Марта, 8</span>
        </div>
        <div className="receipt-divider" />
        <div className="receipt-meta">
          <span>Чек №{order.check.number}</span>
          <span>{new Date(order.check.issuedAt).toLocaleString("ru-RU")}</span>
        </div>
        <div className="receipt-meta">
          <span>Клиент: {order.customer.name}</span>
          <span>{order.customer.phone}</span>
        </div>
        <div className="receipt-divider" />
        <table className="receipt-table">
          <thead>
            <tr>
              <th>Позиция</th>
              <th>Кол-во</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {order.check.items.map((item, index) => (
              <tr key={`${item.productId}-${index}`}>
                <td>
                  {item.name}
                  <small>{money(item.price)} / шт.</small>
                </td>
                <td>{item.qty}</td>
                <td>{money(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="receipt-divider" />
        <div className="receipt-total">
          <span>ИТОГО</span>
          <strong>{money(order.check.total)}</strong>
        </div>
        <p className="receipt-payment">Оплата: {order.check.payment}</p>
        <p className="receipt-thanks">Спасибо, что пьёте кофе с нами ✦</p>
        <div className="receipt-code" aria-hidden="true">
          ▮▯▮▮▯▮▯▮▮▮▯▮▯▮▮▯▮
        </div>
      </article>
      <div className="receipt-actions">
        <button type="button" className="button-dark" onClick={() => window.print()}>
          Печать чека
        </button>
        <button type="button" className="button-light" onClick={download}>
          Скачать .txt
        </button>
        <button type="button" className="link-button" onClick={() => navigate("/catalog")}>
          Сделать ещё заказ →
        </button>
      </div>
    </div>
  );
}

export function BlogPage({ id, navigate }: { id?: string; navigate: Navigate }) {
  const { posts, user, removePost } = useStore();
  const post = id ? posts.find((item) => item.id === id) : undefined;

  if (id) {
    if (!post) {
      return (
        <div className="app-page">
          <div className="empty-state">
            <h2>Статья не найдена</h2>
            <button className="button-dark" onClick={() => navigate("/blog")}>
              Все статьи
            </button>
          </div>
        </div>
      );
    }
    return (
      <article className="app-page article-page">
        <button type="button" className="link-button" onClick={() => navigate("/blog")}>
          ← Все статьи
        </button>
        <p className="eyebrow">
          {post.tag} · {shortDate(post.date)}
        </p>
        <h1>{post.title}</h1>
        <img className="article-cover" src={postImage(post)} alt="" />
        <p className="article-lead">{post.excerpt}</p>
        {(post.content ?? "")
          .split("\n\n")
          .filter(Boolean)
          .map((paragraph, index) => (
            <p className="article-paragraph" key={index}>
              {paragraph}
            </p>
          ))}
        {user?.role === "admin" && (
          <div className="article-admin">
            <button className="button-light" onClick={() => navigate("/admin/content")}>
              Редактировать
            </button>
            <button
              className="link-button danger"
              onClick={() => {
                removePost(post.id);
                navigate("/blog");
              }}
            >
              Удалить
            </button>
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="app-page">
      <PageHead
        kicker="Дневник кофейни"
        title="Блог"
        text="Истории про зерно, текстуры, людей и маленькую магию каждый день."
      />
      {user?.role === "admin" && (
        <button type="button" className="button-dark" onClick={() => navigate("/admin/content")}>
          + Новая статья
        </button>
      )}
      <div className="post-grid">
        {[...posts].reverse().map((post) => (
          <article className="post-card" key={post.id}>
            <div className="post-image">
              <img src={postImage(post)} alt="" loading="lazy" />
            </div>
            <div className="post-body">
              <p className="eyebrow">
                {post.tag} · {shortDate(post.date)}
              </p>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <button
                type="button"
                className="link-button"
                onClick={() => navigate(`/blog/${post.id}`)}
              >
                Читать →
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function LoginPage({ navigate }: { navigate: Navigate }) {
  const { login, register } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result =
      mode === "login"
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
    setBusy(false);
    if (!result) {
      setError(mode === "login" ? "Неверный email или пароль" : "Такой email уже занят");
      return;
    }
    navigate(result.role === "admin" ? "/admin" : "/account");
  };

  return (
    <div className="app-page auth-page">
      <div className="auth-card">
        <p className="eyebrow">Личный кабинет</p>
        <h1>{mode === "login" ? "С возвращением" : "Добро пожаловать"}</h1>
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Вход
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Регистрация
          </button>
        </div>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Имя
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
          )}
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Пароль
            <input
              required
              type="password"
              minLength={4}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="button-dark wide" disabled={busy}>
            {busy ? "Подождите..." : mode === "login" ? "Войти →" : "Создать аккаунт →"}
          </button>
        </form>
        <p className="auth-hint">Демо-доступ администратора: admin@octarine.ru / admin123</p>
      </div>
    </div>
  );
}

export function AccountPage({ navigate }: { navigate: Navigate }) {
  const { user, orders, logout } = useStore();
  if (!user) {
    return (
      <div className="app-page">
        <div className="empty-state">
          <h2>Нужно войти</h2>
          <p>Войдите, чтобы видеть историю заказов.</p>
          <button type="button" className="button-dark" onClick={() => navigate("/login")}>
            Войти
          </button>
        </div>
      </div>
    );
  }

  const myOrders = orders.filter(
    (order) => order.customer.email === user.email || user.role === "admin",
  );

  return (
    <div className="app-page">
      <PageHead
        kicker="Личный кабинет"
        title={`Привет, ${user.name}!`}
        text="Здесь хранится история ваших заказов и чеки."
      />
      <div className="account-layout">
        <aside className="summary-card account-card">
          <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="role-badge">
            {user.role === "admin" ? "Администратор" : "Гость кофейни"}
          </span>
          {user.role === "admin" && (
            <button className="button-dark wide" onClick={() => navigate("/admin")}>
              Панель управления →
            </button>
          )}
          <button
            className="link-button"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            Выйти
          </button>
        </aside>
        <div className="account-orders">
          <h2>История заказов</h2>
          {myOrders.length ? (
            myOrders.map((order: Order) => (
              <article className="order-row" key={order.id}>
                <div>
                  <strong>Заказ №{order.check.number}</strong>
                  <span>{new Date(order.createdAt).toLocaleString("ru-RU")}</span>
                </div>
                <span className={`status status-${order.status}`}>
                  {STATUS_LABELS[order.status]}
                </span>
                <b>{money(order.total)}</b>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate(`/order/${order.id}`)}
                >
                  Чек →
                </button>
              </article>
            ))
          ) : (
            <div className="empty-state small">
              <p>Заказов пока нет.</p>
              <button className="button-dark" onClick={() => navigate("/catalog")}>
                В каталог
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage({ navigate }: { navigate: Navigate }) {
  return (
    <div className="app-page">
      <div className="empty-state">
        <p className="empty-icon">✦</p>
        <h1>Страница потерялась</h1>
        <p>Похоже, она ушла за восьмой цвет радуги.</p>
        <button type="button" className="button-dark" onClick={() => navigate("/")}>
          На главную
        </button>
      </div>
    </div>
  );
}
