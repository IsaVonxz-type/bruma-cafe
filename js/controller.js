import { $ } from "./querys.js";
import { orderModel } from "./model.js";
import { orderView } from "./view.js";

const form = $("#contact-form");

const refreshOrders = (highlightedId) => {
  orderView.renderOrders(orderModel.getAll(), handleRemove, highlightedId);
};

const handleSubmit = (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    orderView.showStatus("Completa los campos obligatorios.", "error");
    return;
  }

  const order = Object.fromEntries(new FormData(form));
  const savedOrder = orderModel.add(order);
  form.reset();
  orderView.showStatus("Pedido guardado correctamente.", "success", 5000);
  refreshOrders(savedOrder.id);
};

const handleRemove = (id) => {
  orderView.removeOrder(id, () => {
    orderModel.remove(id);
    orderView.showStatus("Pedido eliminado.", "success", 5000);
    refreshOrders();
  });
};

form.addEventListener("submit", handleSubmit);
refreshOrders();
