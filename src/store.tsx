import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SEED_ORDERS,
  SEED_POSTS,
  SEED_PRODUCTS,
  SEED_STICKERS,
  SEED_USERS,
  round2,
  type CartLine,
  type Check,
  type LocalUser,
  type Order,
  type Post,
  type Product,
  type Sticker,
  type User,
} from "./data";

const KEY = "octarine.v1";

function read<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${KEY}.${name}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(name: string, value: unknown) {
  try {
    localStorage.setItem(`${KEY}.${name}`, JSON.stringify(value));
  } catch {
    /* storage can be unavailable in private mode */
  }
}

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T | null> {
  try {
    const response = await fetch(`/api${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function mergeById<T extends { id: string | number }>(local: T[], remote: T[]): T[] {
  const ids = new Set(remote.map((item) => String(item.id)));
  return [...remote, ...local.filter((item) => !ids.has(String(item.id)))];
}

export interface Store {
  products: Product[];
  posts: Post[];
  orders: Order[];
  cart: CartLine[];
  users: LocalUser[];
  user: User | null;
  stickers: Sticker[];
  showStickers: boolean;
  connected: boolean;
  addToCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: (customer: Order["customer"], payment: string) => Order;
  saveProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  savePost: (post: Post) => void;
  removePost: (id: string) => void;
  setOrderStatus: (id: string, status: Order["status"]) => void;
  login: (email: string, password: string) => Promise<User | null>;
  register: (name: string, email: string, password: string) => Promise<User | null>;
  logout: () => void;
  addSticker: (icon: string, x: number, y: number) => string;
  moveSticker: (id: string, x: number, y: number) => void;
  updateSticker: (id: string, patch: Partial<Sticker>) => void;
  removeSticker: (id: string) => void;
  setShowStickers: (value: boolean) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => read("products", SEED_PRODUCTS));
  const [posts, setPosts] = useState<Post[]>(() => read("posts", SEED_POSTS));
  const [orders, setOrders] = useState<Order[]>(() => read("orders", SEED_ORDERS));
  const [cart, setCart] = useState<CartLine[]>(() => read("cart", []));
  const [users, setUsers] = useState<LocalUser[]>(() => read("users", SEED_USERS));
  const [user, setUser] = useState<User | null>(() => read("user", null));
  const [stickers, setStickers] = useState<Sticker[]>(() => read("stickers", SEED_STICKERS));
  const [showStickers, setShowStickers] = useState(() => read("showStickersOnLanding", false));
  const [connected, setConnected] = useState(false);

  useEffect(() => write("products", products), [products]);
  useEffect(() => write("posts", posts), [posts]);
  useEffect(() => write("orders", orders), [orders]);
  useEffect(() => write("cart", cart), [cart]);
  useEffect(() => write("users", users), [users]);
  useEffect(() => write("user", user), [user]);
  useEffect(() => write("stickers", stickers), [stickers]);
  useEffect(() => write("showStickersOnLanding", showStickers), [showStickers]);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const health = await api<{ ok: boolean }>("/health");
      if (!active) return;
      setConnected(Boolean(health?.ok));
      if (!health?.ok) return;

      const [remoteProducts, remotePosts, remoteOrders] = await Promise.all([
        api<{ items: Product[] }>("/products"),
        api<{ items: Post[] }>("/posts"),
        api<{ items: Order[] }>("/orders"),
      ]);
      if (!active) return;
      if (remoteProducts?.items?.length)
        setProducts((local) => mergeById(local, remoteProducts.items));
      if (remotePosts?.items?.length) setPosts((local) => mergeById(local, remotePosts.items));
      if (remoteOrders?.items?.length) setOrders((local) => mergeById(local, remoteOrders.items));
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const addToCart = useCallback(
    (productId: string) => {
      setCart((current) => {
        const found = current.find((line) => line.productId === productId);
        if (found) {
          const product = products.find((item) => item.id === productId);
          const limit = product?.stock ?? 99;
          return current.map((line) =>
            line.productId === productId ? { ...line, qty: Math.min(line.qty + 1, limit) } : line,
          );
        }
        return [...current, { productId, qty: 1 }];
      });
    },
    [products],
  );

  const setQty = useCallback((productId: string, qty: number) => {
    setCart((current) =>
      qty <= 0
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) => (line.productId === productId ? { ...line, qty } : line)),
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const checkout = useCallback(
    (customer: Order["customer"], payment: string) => {
      const items = cart
        .map((line) => {
          const product = products.find((item) => item.id === line.productId);
          if (!product) return null;
          return { productId: product.id, name: product.name, qty: line.qty, price: product.price };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
      const total = round2(items.reduce((sum, item) => sum + item.price * item.qty, 0));
      const now = new Date().toISOString();
      const check: Check = {
        number: 1000 + orders.length + 1,
        issuedAt: now,
        items,
        total,
        payment,
        cafe: "Octarine",
        customer,
      };
      const order: Order = {
        id: `ord_${Date.now()}`,
        items,
        total,
        customer,
        status: "new",
        createdAt: now,
        check,
      };
      setOrders((current) => [order, ...current]);
      setCart([]);
      void api("/orders", "POST", order);
      return order;
    },
    [cart, orders.length, products],
  );

  const saveProduct = useCallback((product: Product) => {
    setProducts((current) => {
      const exists = current.some((item) => item.id === product.id);
      const next = exists
        ? current.map((item) => (item.id === product.id ? product : item))
        : [...current, product];
      void api(
        exists ? `/admin/products/${product.id}` : "/admin/products",
        exists ? "PUT" : "POST",
        product,
      );
      return next;
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts((current) => current.filter((item) => item.id !== id));
    setCart((current) => current.filter((line) => line.productId !== id));
    void api(`/admin/products/${id}`, "DELETE");
  }, []);

  const savePost = useCallback((post: Post) => {
    setPosts((current) => {
      const exists = current.some((item) => item.id === post.id);
      const next = exists
        ? current.map((item) => (item.id === post.id ? post : item))
        : [...current, post];
      void api(exists ? `/posts/${post.id}` : "/posts", exists ? "PUT" : "POST", post);
      return next;
    });
  }, []);

  const removePost = useCallback((id: string) => {
    setPosts((current) => current.filter((item) => item.id !== id));
    void api(`/posts/${id}`, "DELETE");
  }, []);

  const setOrderStatus = useCallback((id: string, status: Order["status"]) => {
    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, status } : order)),
    );
    void api(`/orders/${id}/status`, "PATCH", { status });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const remote = await api<User>("/auth/login", "POST", { email, password });
      const local =
        remote ?? users.find((item) => item.email === email && item.password === password);
      if (!local) return null;
      const safe: User = { id: local.id, name: local.name, email: local.email, role: local.role };
      setUser(safe);
      return safe;
    },
    [users],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const exists = users.some((item) => item.email.toLowerCase() === email.toLowerCase());
      if (exists) return null;
      const localUser: LocalUser = {
        id: Date.now(),
        name,
        email,
        password,
        role: "user",
      };
      const remote = await api<User>("/auth/register", "POST", { name, email, password });
      setUsers((current) => [...current, localUser]);
      const safe: User = remote ?? {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: localUser.role,
      };
      setUser(safe);
      return safe;
    },
    [users],
  );

  const logout = useCallback(() => setUser(null), []);

  const addSticker = useCallback((icon: string, x: number, y: number) => {
    const id = `st-${Date.now()}-${Math.round(Math.random() * 999)}`;
    setStickers((current) => [
      ...current,
      { id, icon, x, y, color: "#cceef2", size: 48, rot: Math.round(Math.random() * 30 - 15) },
    ]);
    return id;
  }, []);

  const moveSticker = useCallback((id: string, x: number, y: number) => {
    setStickers((current) =>
      current.map((sticker) =>
        sticker.id === id
          ? { ...sticker, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
          : sticker,
      ),
    );
  }, []);

  const updateSticker = useCallback((id: string, patch: Partial<Sticker>) => {
    setStickers((current) =>
      current.map((sticker) => (sticker.id === id ? { ...sticker, ...patch } : sticker)),
    );
  }, []);

  const removeSticker = useCallback((id: string) => {
    setStickers((current) => current.filter((sticker) => sticker.id !== id));
  }, []);

  const value = useMemo<Store>(
    () => ({
      products,
      posts,
      orders,
      cart,
      users,
      user,
      stickers,
      showStickers,
      connected,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      checkout,
      saveProduct,
      removeProduct,
      savePost,
      removePost,
      setOrderStatus,
      login,
      register,
      logout,
      addSticker,
      moveSticker,
      updateSticker,
      removeSticker,
      setShowStickers,
    }),
    [
      products,
      posts,
      orders,
      cart,
      users,
      user,
      stickers,
      showStickers,
      connected,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      checkout,
      saveProduct,
      removeProduct,
      savePost,
      removePost,
      setOrderStatus,
      login,
      register,
      logout,
      addSticker,
      moveSticker,
      updateSticker,
      removeSticker,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
