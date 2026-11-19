import { useEffect, useState } from "react";
import Admin from "./admin";
import Landing from "./landing";
import {
  AccountPage,
  BlogPage,
  CartPage,
  Catalog,
  CheckoutPage,
  LoginPage,
  NotFoundPage,
  ReceiptPage,
} from "./pages";
import { StoreProvider, useStore } from "./store";

type Route = { page: string; id?: string };

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [page, id] = raw.split("/");
  return { page: page || "home", id };
}

function AppShell() {
  const [route, setRoute] = useState<Route>(parseHash);
  const { cart, user, connected } = useStore();
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);

  useEffect(() => {
    const handle = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);

  useEffect(() => {
    const titles: Record<string, string> = {
      home: "Octarine — кофейня восьмого цвета",
      catalog: "Каталог — Octarine",
      cart: "Корзина — Octarine",
      checkout: "Оформление заказа — Octarine",
      blog: "Блог — Octarine",
      login: "Вход — Octarine",
      account: "Личный кабинет — Octarine",
      admin: "Панель управления — Octarine",
    };
    document.title = titles[route.page] ?? "Octarine";
  }, [route.page]);

  const navigate = (path: string) => {
    const next = path.startsWith("/") ? path : `/${path}`;
    if (window.location.hash === `#${next}`) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.hash = next;
  };

  const navItems: { path: string; label: string; key: string; count?: number }[] = [
    { path: "/", label: "Главная", key: "home" },
    { path: "/catalog", label: "Каталог", key: "catalog" },
    { path: "/blog", label: "Блог", key: "blog" },
    { path: "/cart", label: "Корзина", key: "cart", count: cartCount },
    {
      path: user ? "/account" : "/login",
      label: user ? user.name : "Войти",
      key: user ? "account" : "login",
    },
  ];
  if (user?.role === "admin") navItems.push({ path: "/admin", label: "Админка", key: "admin" });

  let content;
  switch (route.page) {
    case "home":
      content = <Landing onBook={() => undefined} onCatalog={() => navigate("/catalog")} />;
      break;
    case "catalog":
      content = <Catalog navigate={navigate} />;
      break;
    case "cart":
      content = <CartPage navigate={navigate} />;
      break;
    case "checkout":
      content = <CheckoutPage navigate={navigate} />;
      break;
    case "order":
      content = <ReceiptPage id={route.id ?? ""} navigate={navigate} />;
      break;
    case "blog":
      content = <BlogPage id={route.id} navigate={navigate} />;
      break;
    case "login":
      content = <LoginPage navigate={navigate} />;
      break;
    case "account":
      content = <AccountPage navigate={navigate} />;
      break;
    case "admin":
      content = <Admin navigate={navigate} tab={route.id ?? "overview"} />;
      break;
    default:
      content = <NotFoundPage navigate={navigate} />;
  }

  if (route.page !== "home") content = <div className="page-shell">{content}</div>;

  return (
    <div className="app-root">
      <main className="app-main">{content}</main>
      <nav
        className="site-dock"
        aria-label="Навигация"
        title={connected ? "API подключён" : "Данные хранятся локально"}
      >
        {navItems.map((item) => (
          <button
            type="button"
            key={item.key}
            className={route.page === item.key ? "active" : ""}
            onClick={() => navigate(item.path)}
          >
            {item.label}
            {!!item.count && <span className="dock-count">{item.count}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
