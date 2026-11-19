import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type PointerEvent,
} from "react";
import {
  CATEGORIES,
  STATUS_LABELS,
  money,
  productImage,
  shortDate,
  type Category,
  type Order,
  type Post,
  type Product,
  type Sticker,
} from "./data";
import { useStore } from "./store";

type Navigate = (path: string) => void;

const TABS = [
  { id: "overview", label: "Сводка", icon: "◈" },
  { id: "products", label: "Товары", icon: "☕" },
  { id: "content", label: "Контент", icon: "✎" },
  { id: "orders", label: "Заказы", icon: "▤" },
  { id: "analytics", label: "Аналитика", icon: "↗" },
  { id: "stickers", label: "Стикеры", icon: "✦" },
];

const CHART_COLORS = ["#f4afd2", "#121011", "#cceef2", "#a97c9a", "#e3b06b"];

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const width = 760;
  const height = 280;
  const pad = 40;
  const max = Math.max(1, ...data.map((item) => item.value));
  const slot = (width - pad * 2) / Math.max(data.length, 1);
  const barWidth = Math.min(48, slot * 0.58);

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="График продаж">
      {[0, 1, 2, 3].map((line) => {
        const y = pad + ((height - pad * 2) / 3) * line;
        return (
          <g key={line}>
            <line x1={pad} x2={width - pad} y1={y} y2={y} stroke="#d9d0c9" strokeDasharray="4 6" />
            <text x={4} y={y + 4} fontSize="11" fill="#777">
              {Math.round(max - (max / 3) * line)}
            </text>
          </g>
        );
      })}
      {data.map((item, index) => {
        const barHeight = (item.value / max) * (height - pad * 2);
        const x = pad + slot * index + (slot - barWidth) / 2;
        const y = height - pad - barHeight;
        return (
          <g key={item.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx="5"
              fill={index === data.length - 1 ? "#121011" : "#f4afd2"}
              stroke="#121011"
              strokeWidth="1.5"
            />
            <text
              x={x + barWidth / 2}
              y={y - 7}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#121011"
            >
              {item.value}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - pad + 20}
              textAnchor="middle"
              fontSize="11"
              fill="#555"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({
  data,
  centerLabel,
}: {
  data: { label: string; value: number }[];
  centerLabel: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg
        viewBox="0 0 200 200"
        className="donut"
        role="img"
        aria-label="Диаграмма продаж по категориям"
      >
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#ebe3dd" strokeWidth="26" />
        {total > 0 &&
          data.map((item, index) => {
            const length = (item.value / total) * circumference;
            const circle = (
              <circle
                key={item.label}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth="26"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 100 100)"
              />
            );
            offset += length;
            return circle;
          })}
        <text x="100" y="96" textAnchor="middle" fontSize="28" fontWeight="700" fill="#121011">
          {total}
        </text>
        <text x="100" y="118" textAnchor="middle" fontSize="11" fill="#777">
          {centerLabel}
        </text>
      </svg>
      <ul className="donut-legend">
        {data.map((item, index) => (
          <li key={item.label}>
            <i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
            <span>{item.label}</span>
            <b>{total ? Math.round((item.value / total) * 100) : 0}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function useAnalytics() {
  const { orders, products } = useStore();

  return useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const avgCheck = orders.length ? revenue / orders.length : 0;
    const byDay = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(Date.now() - (6 - index) * 86_400_000);
      const key = date.toISOString().slice(0, 10);
      const value = orders
        .filter((order) => order.createdAt.slice(0, 10) === key)
        .reduce((sum, order) => sum + order.total, 0);
      return {
        label: date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
        value: Math.round(value),
      };
    });

    const productStats = products
      .map((product) => {
        const rows = orders
          .flatMap((order) => order.items)
          .filter((item) => item.productId === product.id);
        const qty = rows.reduce((sum, item) => sum + item.qty, 0);
        return { ...product, qty, revenue: qty * product.price };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const byCategory = CATEGORIES.filter((cat) => cat.id !== "all").map((cat) => ({
      label: cat.label,
      value: productStats
        .filter((product) => product.cat === cat.id)
        .reduce((sum, product) => sum + product.revenue, 0),
    }));

    return { revenue, avgCheck, orders, productStats, byDay, byCategory };
  }, [orders, products]);
}

function StatCards() {
  const { revenue, avgCheck, orders, byDay } = useAnalytics();
  const cards = [
    { label: "Выручка", value: money(revenue), note: "за всё время" },
    {
      label: "Заказов",
      value: String(orders.length),
      note: `${orders.filter((order) => order.status === "new").length} новых`,
    },
    { label: "Средний чек", value: money(avgCheck), note: "на заказ" },
    {
      label: "За неделю",
      value: money(byDay.reduce((sum, day) => sum + day.value, 0)),
      note: "последние 7 дней",
    },
  ];
  return (
    <div className="stat-grid">
      {cards.map((card) => (
        <article className="stat-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.note}</small>
        </article>
      ))}
    </div>
  );
}

function Overview({ navigate }: { navigate: Navigate }) {
  const { orders } = useStore();
  const { byDay, productStats } = useAnalytics();
  return (
    <div className="admin-section">
      <h2>Сводка</h2>
      <StatCards />
      <div className="admin-panels two">
        <section className="admin-panel">
          <div className="panel-head">
            <h3>Продажи за неделю</h3>
            <button className="link-button" onClick={() => navigate("/admin/analytics")}>
              Подробнее →
            </button>
          </div>
          <BarChart data={byDay} />
        </section>
        <section className="admin-panel">
          <div className="panel-head">
            <h3>Лидеры продаж</h3>
          </div>
          <ol className="leader-list">
            {productStats.slice(0, 5).map((product, index) => (
              <li key={product.id}>
                <span className="leader-index">{index + 1}</span>
                <img src={productImage(product)} alt="" />
                <div>
                  <strong>{product.name}</strong>
                  <small>
                    {product.qty} шт. · {money(product.revenue)}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <section className="admin-panel">
        <div className="panel-head">
          <h3>Последние заказы</h3>
          <button className="link-button" onClick={() => navigate("/admin/orders")}>
            Все заказы →
          </button>
        </div>
        <OrdersTable orders={orders.slice(0, 5)} navigate={navigate} short />
      </section>
    </div>
  );
}

function OrdersTable({
  orders,
  navigate,
  short = false,
}: {
  orders: Order[];
  navigate: Navigate;
  short?: boolean;
}) {
  const { setOrderStatus } = useStore();
  if (!orders.length)
    return (
      <div className="empty-state small">
        <p>Заказов пока нет</p>
      </div>
    );
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>№ чека</th>
            <th>Дата</th>
            <th>Клиент</th>
            {!short && <th>Состав</th>}
            <th>Сумма</th>
            <th>Статус</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>#{order.check.number}</strong>
              </td>
              <td>
                {new Date(order.createdAt).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td>
                {order.customer.name}
                <small>{order.customer.phone}</small>
              </td>
              {!short && (
                <td>{order.items.map((item) => `${item.name} ×${item.qty}`).join(", ")}</td>
              )}
              <td>{money(order.total)}</td>
              <td>
                <select
                  className={`status-select status-${order.status}`}
                  value={order.status}
                  onChange={(event) =>
                    setOrderStatus(order.id, event.target.value as Order["status"])
                  }
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button className="link-button" onClick={() => navigate(`/order/${order.id}`)}>
                  Чек →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductsAdmin() {
  const { products, saveProduct, removeProduct } = useStore();
  const empty: Product = {
    id: "",
    name: "",
    price: 0,
    cat: "coffee",
    tag: "Горячее",
    desc: "",
    stock: 0,
  };
  const [draft, setDraft] = useState<Product>(empty);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name || draft.price <= 0) return;
    saveProduct({
      ...draft,
      id: draft.id || `prd_${Date.now()}`,
      price: Number(draft.price),
      stock: Number(draft.stock),
    });
    setDraft(empty);
  };

  return (
    <div className="admin-section">
      <h2>Управление товарами</h2>
      <div className="admin-panels split">
        <section className="admin-panel">
          <div className="panel-head">
            <h3>{draft.id ? "Редактирование" : "Новый товар"}</h3>
            {draft.id && (
              <button className="link-button" onClick={() => setDraft(empty)}>
                Отмена
              </button>
            )}
          </div>
          <form className="admin-form" onSubmit={submit}>
            <label>
              Название
              <input
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <div className="form-row">
              <label>
                Цена, ₽
                <input
                  required
                  type="number"
                  min="1"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                />
              </label>
              <label>
                Остаток
                <input
                  required
                  type="number"
                  min="0"
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Категория
                <select
                  value={draft.cat}
                  onChange={(e) => setDraft({ ...draft, cat: e.target.value as Category })}
                >
                  {CATEGORIES.filter((cat) => cat.id !== "all").map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Метка
                <input
                  value={draft.tag}
                  onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                />
              </label>
            </div>
            <label>
              Описание
              <textarea
                rows={3}
                value={draft.desc}
                onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
              />
            </label>
            <button type="submit" className="button-dark wide">
              {draft.id ? "Сохранить изменения" : "Добавить товар"}
            </button>
          </form>
        </section>
        <section className="admin-panel">
          <div className="panel-head">
            <h3>Каталог ({products.length})</h3>
          </div>
          <div className="table-scroll">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Категория</th>
                  <th>Цена</th>
                  <th>Остаток</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="cell-product">
                        <img src={productImage(product)} alt="" />
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td>
                      {CATEGORIES.find((cat) => cat.id === product.cat)?.label ?? product.cat}
                    </td>
                    <td>{money(product.price)}</td>
                    <td>{product.stock}</td>
                    <td className="cell-actions">
                      <button
                        className="icon-button"
                        title="Редактировать"
                        onClick={() => setDraft(product)}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-button danger"
                        title="Удалить"
                        onClick={() => {
                          if (confirm(`Удалить ${product.name}?`)) removeProduct(product.id);
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function ContentAdmin() {
  const { posts, savePost, removePost } = useStore();
  const empty: Post = {
    id: "",
    title: "",
    excerpt: "",
    content: "",
    date: new Date().toISOString().slice(0, 10),
    tag: "menu",
    image: "",
  };
  const [draft, setDraft] = useState<Post>(empty);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title) return;
    savePost({ ...draft, id: draft.id || `post_${Date.now()}` });
    setDraft(empty);
  };

  return (
    <div className="admin-section">
      <h2>Управление контентом</h2>
      <div className="admin-panels split">
        <section className="admin-panel">
          <div className="panel-head">
            <h3>{draft.id ? "Редактирование статьи" : "Новая статья"}</h3>
            {draft.id && (
              <button className="link-button" onClick={() => setDraft(empty)}>
                Отмена
              </button>
            )}
          </div>
          <form className="admin-form" onSubmit={submit}>
            <label>
              Заголовок
              <input
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label>
              Краткое описание
              <textarea
                rows={2}
                value={draft.excerpt}
                onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              />
            </label>
            <label>
              Текст статьи
              <textarea
                rows={6}
                value={draft.content ?? ""}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder="Абзацы разделяйте пустой строкой"
              />
            </label>
            <div className="form-row">
              <label>
                Дата
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </label>
              <label>
                Тег
                <input
                  value={draft.tag}
                  onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                />
              </label>
            </div>
            <label>
              Изображение (путь)
              <input
                value={draft.image ?? ""}
                onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                placeholder="/assets/coffee-latte.jpg"
              />
            </label>
            <button type="submit" className="button-dark wide">
              {draft.id ? "Сохранить статью" : "Опубликовать"}
            </button>
          </form>
        </section>
        <section className="admin-panel">
          <div className="panel-head">
            <h3>Статьи ({posts.length})</h3>
          </div>
          <div className="content-list">
            {posts.map((post) => (
              <article className="content-row" key={post.id}>
                <img src={post.image || "/assets/coffee-barista.jpg"} alt="" />
                <div>
                  <strong>{post.title}</strong>
                  <small>
                    {shortDate(post.date)} · {post.tag}
                  </small>
                </div>
                <button
                  className="icon-button"
                  title="Редактировать"
                  onClick={() => setDraft(post)}
                >
                  ✎
                </button>
                <button
                  className="icon-button danger"
                  title="Удалить"
                  onClick={() => {
                    if (confirm(`Удалить статью «${post.title}»?`)) removePost(post.id);
                  }}
                >
                  ×
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Analytics() {
  const { byDay, byCategory, productStats, orders, revenue, avgCheck } = useAnalytics();
  return (
    <div className="admin-section">
      <h2>Статистика и аналитика</h2>
      <StatCards />
      <div className="admin-panels split">
        <section className="admin-panel">
          <div className="panel-head">
            <h3>Выручка по дням</h3>
            <span className="panel-note">последние 7 дней</span>
          </div>
          <BarChart data={byDay} />
        </section>
        <section className="admin-panel">
          <div className="panel-head">
            <h3>Продажи по категориям</h3>
          </div>
          <DonutChart data={byCategory} centerLabel="рублей" />
        </section>
      </div>
      <section className="admin-panel">
        <div className="panel-head">
          <h3>Товары в разрезе продаж</h3>
          <span className="panel-note">
            {orders.length} заказов · средний чек {money(avgCheck)}
          </span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Товар</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Продано</th>
                <th>Выручка</th>
                <th>Доля</th>
              </tr>
            </thead>
            <tbody>
              {productStats.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="cell-product">
                      <img src={productImage(product)} alt="" />
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>{CATEGORIES.find((cat) => cat.id === product.cat)?.label ?? product.cat}</td>
                  <td>{money(product.price)}</td>
                  <td>{product.qty} шт.</td>
                  <td>
                    <strong>{money(product.revenue)}</strong>
                  </td>
                  <td>
                    <div className="progress-cell">
                      <i style={{ width: `${revenue ? (product.revenue / revenue) * 100 : 0}%` }} />
                      <span>{revenue ? Math.round((product.revenue / revenue) * 100) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const PALETTE = ["✦", "★", "☕", "♥", "✿", "☂", "♪", "◉"];

function StickersAdmin() {
  const {
    stickers,
    showStickers,
    setShowStickers,
    addSticker,
    moveSticker,
    updateSticker,
    removeSticker,
  } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const current = stickers.find((sticker) => sticker.id === selected);

  const pointToPercent = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const onPointerDown = (event: PointerEvent<HTMLSpanElement>, sticker: Sticker) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = sticker.id;
    setSelected(sticker.id);
  };

  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (!dragging.current) return;
    const { x, y } = pointToPercent(event.clientX, event.clientY);
    moveSticker(dragging.current, x, y);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const icon = event.dataTransfer.getData("text/sticker");
    if (!icon) return;
    const { x, y } = pointToPercent(event.clientX, event.clientY);
    setSelected(addSticker(icon, x, y));
  };

  return (
    <div className="admin-section">
      <h2>Система стикеров</h2>
      <p className="section-note">
        Перетащите стикер на макет или нажмите, чтобы добавить его в центр. Стикеры можно двигать
        мышью и касанием.
      </p>
      <div className="admin-panels split">
        <section className="admin-panel">
          <div className="panel-head">
            <h3>Палитра</h3>
          </div>
          <div className="sticker-palette">
            {PALETTE.map((icon) => (
              <button
                type="button"
                key={icon}
                className="palette-item"
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/sticker", icon)}
                onClick={() => setSelected(addSticker(icon, 50, 50))}
                title="Перетащите на макет"
              >
                {icon}
              </button>
            ))}
          </div>
          <label className="toggle-line">
            <input
              type="checkbox"
              checked={showStickers}
              onChange={(event) => setShowStickers(event.target.checked)}
            />
            Показывать стикеры на главной странице
          </label>
          {current ? (
            <div className="sticker-controls">
              <h3>Настройки стикера</h3>
              <label>
                Цвет
                <input
                  type="color"
                  value={current.color}
                  onChange={(e) => updateSticker(current.id, { color: e.target.value })}
                />
              </label>
              <label>
                Размер: {current.size}px
                <input
                  type="range"
                  min="24"
                  max="96"
                  value={current.size}
                  onChange={(e) => updateSticker(current.id, { size: Number(e.target.value) })}
                />
              </label>
              <label>
                Поворот: {current.rot}°
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={current.rot}
                  onChange={(e) => updateSticker(current.id, { rot: Number(e.target.value) })}
                />
              </label>
              <button
                type="button"
                className="button-light danger"
                onClick={() => {
                  removeSticker(current.id);
                  setSelected(null);
                }}
              >
                Удалить стикер
              </button>
            </div>
          ) : (
            <p className="section-note">Выберите стикер на макете, чтобы изменить его.</p>
          )}
        </section>
        <section className="admin-panel">
          <div className="panel-head">
            <h3>Макет главной</h3>
            <span className="panel-note">{stickers.length} стикеров</span>
          </div>
          <div
            className="sticker-canvas"
            ref={canvasRef}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
          >
            <img src="/assets/coffee-latte.jpg" alt="Макет главной страницы" draggable={false} />
            <div className="canvas-label">OCTARINE · HERO</div>
            {stickers.map((sticker) => (
              <span
                key={sticker.id}
                className={`canvas-sticker ${selected === sticker.id ? "selected" : ""}`}
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  background: sticker.color,
                  fontSize: sticker.size,
                  transform: `translate(-50%, -50%) rotate(${sticker.rot}deg)`,
                }}
                onPointerDown={(event) => onPointerDown(event, sticker)}
                onPointerMove={onPointerMove}
                onPointerUp={() => {
                  dragging.current = null;
                }}
                onPointerCancel={() => {
                  dragging.current = null;
                }}
              >
                {sticker.icon}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Admin({ navigate, tab }: { navigate: Navigate; tab: string }) {
  const { user, orders } = useStore();
  const active = TABS.some((item) => item.id === tab) ? tab : "overview";

  if (!user) {
    return (
      <div className="app-page">
        <div className="empty-state">
          <h2>Доступ только для администратора</h2>
          <p>Войдите под учётной записью администратора.</p>
          <button type="button" className="button-dark" onClick={() => navigate("/login")}>
            Войти
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="app-page">
        <div className="empty-state">
          <h2>Недостаточно прав</h2>
          <p>Ваша учётная запись не имеет доступа к панели управления.</p>
          <button type="button" className="button-dark" onClick={() => navigate("/")}>
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <p className="eyebrow">Панель управления</p>
        <h2>
          Octarine<span>admin</span>
        </h2>
        <nav>
          {TABS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={active === item.id ? "active" : ""}
              onClick={() => navigate(item.id === "overview" ? "/admin" : `/admin/${item.id}`)}
            >
              <span aria-hidden="true">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <button className="link-button" onClick={() => navigate("/")}>
          ← На сайт
        </button>
      </aside>
      <div className="admin-content">
        {active === "overview" && <Overview navigate={navigate} />}
        {active === "products" && <ProductsAdmin />}
        {active === "content" && <ContentAdmin />}
        {active === "orders" && (
          <div className="admin-section">
            <h2>Заказы</h2>
            <section className="admin-panel">
              <OrdersTable orders={orders} navigate={navigate} />
            </section>
          </div>
        )}
        {active === "analytics" && <Analytics />}
        {active === "stickers" && <StickersAdmin />}
      </div>
    </div>
  );
}
