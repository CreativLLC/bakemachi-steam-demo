import { create } from 'zustand';

interface InventoryItem {
  id: string;        // e.g. 'ocha', 'yakitori'
  name: string;      // Japanese kana name
  image: string;     // asset path
  quantity: number;
}

interface InventoryState {
  items: InventoryItem[];
  addItem: (id: string, name: string, image: string) => void;
  removeItem: (id: string) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],

  addItem: (id, name, image) =>
    set((state) => {
      const existing = state.items.find((item) => item.id === id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      return { items: [...state.items, { id, name, image, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => {
      const existing = state.items.find((item) => item.id === id);
      if (!existing || existing.quantity <= 0) return state;
      if (existing.quantity === 1) {
        return { items: state.items.filter((item) => item.id !== id) };
      }
      return {
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        ),
      };
    }),
}));
