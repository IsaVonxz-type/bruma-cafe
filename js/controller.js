import { $ } from "./querys.js";
import { orderModel } from "./model.js";
import { orderView } from "./view.js";

const form = $("#contact-form");
const themeToggle = $(".theme-toggle");
const savedTheme = localStorage.getItem("bruma-theme");

if (savedTheme === "dark") {
  document.documentElement.dataset.theme = "dark";
  themeToggle.setAttribute("aria-label", "Activar modo claro");
  themeToggle.setAttribute("aria-pressed", "true");
}

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.dataset.theme !== "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Activar modo claro" : "Activar modo oscuro",
  );
  themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem("bruma-theme", isDark ? "dark" : "light");
});

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
