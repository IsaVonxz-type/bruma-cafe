const STORAGE_KEY = "bruma-cafe-pedidos";

const readOrders = () => {
  try {
    const savedOrders = localStorage.getItem(STORAGE_KEY);
    return savedOrders ? JSON.parse(savedOrders) : [];
  } catch {
    return [];
  }
};

const saveOrders = (orders) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

export const orderModel = {
  getAll() {
    return readOrders();
  },

  add(order) {
    const orders = readOrders();
    const newOrder = {
      ...order,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    saveOrders([newOrder, ...orders]);
    return newOrder;
  },

  remove(id) {
    const orders = readOrders().filter((order) => order.id !== id);
    saveOrders(orders);
    return orders;
  },
};
