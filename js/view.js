import { $ } from "./querys.js";

const formStatus = $("#form-status");
const savedOrders = $("#saved-orders");
let statusTimer;

const formatDate = (date) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

const createOrderElement = (order, onRemove) => {
  const article = document.createElement("article");
  article.className = "saved-order";
  article.dataset.orderId = order.id;

  const heading = document.createElement("h3");
  heading.textContent = order.nombre;

  const details = document.createElement("p");
  details.textContent = `${order.email} · ${order.pago} · ${formatDate(order.createdAt)}`;

  const phone = document.createElement("p");
  phone.textContent = `Teléfono: ${order.telefono}`;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-order";
  removeButton.textContent = "Eliminar";
  removeButton.addEventListener("click", () => onRemove(order.id));

  article.append(heading, details, phone, removeButton);
  return article;
};

export const orderView = {
  showStatus(message, type = "success", duration = 0) {
    clearTimeout(statusTimer);
    formStatus.textContent = message;
    formStatus.dataset.type = type;

    if (duration) {
      statusTimer = setTimeout(() => {
        formStatus.textContent = "";
        delete formStatus.dataset.type;
      }, duration);
    }
  },

  renderOrders(orders, onRemove, highlightedId) {
    savedOrders.replaceChildren();

    if (!orders.length) {
      return;
    }

    const heading = document.createElement("h3");
    heading.textContent = "Pedidos guardados";
    savedOrders.append(heading);

    orders.forEach((order) => {
      const orderElement = createOrderElement(order, onRemove);

      if (order.id === highlightedId) {
        orderElement.classList.add("saved-order--new");
      }

      savedOrders.append(orderElement);
    });
  },

  removeOrder(id, onComplete) {
    const orderElement = $(`[data-order-id="${id}"]`, savedOrders);

    if (!orderElement) {
      onComplete();
      return;
    }

    orderElement.classList.add("saved-order--removing");
    setTimeout(onComplete, 260);
  },
};
