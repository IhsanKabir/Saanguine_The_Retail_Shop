"use client";

import { createContext, useContext, useEffect, useReducer, useCallback, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  sku: string;
  name: string;
  priceBdt: number;
  cat: string;
  qty: number;
  color?: string | null;
  size?: string | null;
};

export type AppliedCoupon = {
  code: string;
  description: string | null;
  discountBdt: number;
  freeShipping: boolean;
};

type State = { items: CartItem[]; open: boolean; hydrated: boolean; coupon: AppliedCoupon | null };

type Action =
  | { type: "HYDRATE"; items: CartItem[]; coupon: AppliedCoupon | null }
  | { type: "ADD"; item: CartItem }
  | { type: "INC"; key: string }
  | { type: "DEC"; key: string }
  | { type: "REMOVE"; key: string }
  | { type: "CLEAR" }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "SET_COUPON"; coupon: AppliedCoupon | null };

const ITEMS_KEY = "ssg-cart-v1";
const COUPON_KEY = "ssg-coupon-v1";
const itemKey = (i: { productId: string; color?: string | null; size?: string | null }) =>
  `${i.productId}::${i.color ?? ""}::${i.size ?? ""}`;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE": return { ...state, items: action.items, coupon: action.coupon, hydrated: true };
    case "ADD": {
      const k = itemKey(action.item);
      const existing = state.items.findIndex((x) => itemKey(x) === k);
      const next = [...state.items];
      if (existing >= 0) next[existing] = { ...next[existing], qty: next[existing].qty + action.item.qty };
      else next.push(action.item);
      return { ...state, items: next, open: true };
    }
    case "INC": return { ...state, items: state.items.map((x) => itemKey(x) === action.key ? { ...x, qty: x.qty + 1 } : x) };
    case "DEC": return { ...state, items: state.items.map((x) => itemKey(x) === action.key ? { ...x, qty: Math.max(1, x.qty - 1) } : x) };
    case "REMOVE": return { ...state, items: state.items.filter((x) => itemKey(x) !== action.key) };
    case "CLEAR":  return { ...state, items: [], coupon: null };
    case "OPEN":   return { ...state, open: true };
    case "CLOSE":  return { ...state, open: false };
    case "SET_COUPON": return { ...state, coupon: action.coupon };
    default: return state;
  }
}

type CartCtx = {
  items: CartItem[];
  open: boolean;
  hydrated: boolean;
  count: number;
  subtotalBdt: number;
  coupon: AppliedCoupon | null;
  add: (item: CartItem) => void;
  inc: (key: string) => void;
  dec: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  itemKey: typeof itemKey;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false, hydrated: false, coupon: null });

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    let items: CartItem[] = [];
    let coupon: AppliedCoupon | null = null;
    try {
      const raw = localStorage.getItem(ITEMS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      items = Array.isArray(parsed) ? parsed : [];
    } catch {}
    try {
      const raw = localStorage.getItem(COUPON_KEY);
      coupon = raw ? JSON.parse(raw) : null;
    } catch {}
    dispatch({ type: "HYDRATE", items, coupon });
  }, []);

  // Persist on changes.
  useEffect(() => {
    if (!state.hydrated) return;
    try { localStorage.setItem(ITEMS_KEY, JSON.stringify(state.items)); } catch {}
  }, [state.items, state.hydrated]);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      if (state.coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(state.coupon));
      else localStorage.removeItem(COUPON_KEY);
    } catch {}
  }, [state.coupon, state.hydrated]);

  const value: CartCtx = {
    items: state.items,
    open: state.open,
    hydrated: state.hydrated,
    coupon: state.coupon,
    count: state.items.reduce((s, i) => s + i.qty, 0),
    subtotalBdt: state.items.reduce((s, i) => s + i.priceBdt * i.qty, 0),
    add: useCallback((item) => dispatch({ type: "ADD", item }), []),
    inc: useCallback((key) => dispatch({ type: "INC", key }), []),
    dec: useCallback((key) => dispatch({ type: "DEC", key }), []),
    remove: useCallback((key) => dispatch({ type: "REMOVE", key }), []),
    clear: useCallback(() => dispatch({ type: "CLEAR" }), []),
    openDrawer: useCallback(() => dispatch({ type: "OPEN" }), []),
    closeDrawer: useCallback(() => dispatch({ type: "CLOSE" }), []),
    setCoupon: useCallback((coupon) => dispatch({ type: "SET_COUPON", coupon }), []),
    itemKey,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}
