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

type State = { items: CartItem[]; open: boolean; hydrated: boolean };

type Action =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD"; item: CartItem }
  | { type: "INC"; key: string }
  | { type: "DEC"; key: string }
  | { type: "REMOVE"; key: string }
  | { type: "CLEAR" }
  | { type: "OPEN" }
  | { type: "CLOSE" };

const KEY = "ssg-cart-v1";
const itemKey = (i: { productId: string; color?: string | null; size?: string | null }) =>
  `${i.productId}::${i.color ?? ""}::${i.size ?? ""}`;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE": return { ...state, items: action.items, hydrated: true };
    case "ADD": {
      const k = itemKey(action.item);
      const existing = state.items.findIndex((x) => itemKey(x) === k);
      const next = [...state.items];
      if (existing >= 0) next[existing] = { ...next[existing], qty: next[existing].qty + action.item.qty };
      else next.push(action.item);
      return { ...state, items: next, open: true };
    }
    case "INC": {
      return { ...state, items: state.items.map((x) => itemKey(x) === action.key ? { ...x, qty: x.qty + 1 } : x) };
    }
    case "DEC": {
      return { ...state, items: state.items.map((x) => itemKey(x) === action.key ? { ...x, qty: Math.max(1, x.qty - 1) } : x) };
    }
    case "REMOVE": return { ...state, items: state.items.filter((x) => itemKey(x) !== action.key) };
    case "CLEAR":  return { ...state, items: [] };
    case "OPEN":   return { ...state, open: true };
    case "CLOSE":  return { ...state, open: false };
    default: return state;
  }
}

type CartCtx = {
  items: CartItem[];
  open: boolean;
  hydrated: boolean;
  count: number;
  subtotalBdt: number;
  add: (item: CartItem) => void;
  inc: (key: string) => void;
  dec: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  itemKey: typeof itemKey;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false, hydrated: false });

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const items: CartItem[] = raw ? JSON.parse(raw) : [];
      dispatch({ type: "HYDRATE", items: Array.isArray(items) ? items : [] });
    } catch {
      dispatch({ type: "HYDRATE", items: [] });
    }
  }, []);

  // Persist on changes.
  useEffect(() => {
    if (!state.hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(state.items)); } catch {}
  }, [state.items, state.hydrated]);

  const value: CartCtx = {
    items: state.items,
    open: state.open,
    hydrated: state.hydrated,
    count: state.items.reduce((s, i) => s + i.qty, 0),
    subtotalBdt: state.items.reduce((s, i) => s + i.priceBdt * i.qty, 0),
    add: useCallback((item) => dispatch({ type: "ADD", item }), []),
    inc: useCallback((key) => dispatch({ type: "INC", key }), []),
    dec: useCallback((key) => dispatch({ type: "DEC", key }), []),
    remove: useCallback((key) => dispatch({ type: "REMOVE", key }), []),
    clear: useCallback(() => dispatch({ type: "CLEAR" }), []),
    openDrawer: useCallback(() => dispatch({ type: "OPEN" }), []),
    closeDrawer: useCallback(() => dispatch({ type: "CLOSE" }), []),
    itemKey,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}
