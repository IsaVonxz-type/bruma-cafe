"use strict";

// 1. Datos y referencias a los elementos de la página.
// Lista inicial de productos del inventario.
const products = [
  { id: 1, nombre: "Sierra Dulce", precio: 42000, categoria: "Grano", cantidad: 12, imagen: "assets/sierra-dulce.jpg" },
  { id: 2, nombre: "Niebla Rosa", precio: 48000, categoria: "Grano", cantidad: 8, imagen: "assets/niebla-rosa.jpg" },
  { id: 3, nombre: "Monte Negro", precio: 45000, categoria: "Molido", cantidad: 5, imagen: "assets/monte-negro.jpg" },
  { id: 4, nombre: "Caturra Honey", precio: 52000, categoria: "Grano", cantidad: 0, imagen: "assets/caturra-honey.jpg" },
  { id: 5, nombre: "Prensa Bruma", precio: 68000, categoria: "Accesorios", cantidad: 4, imagen: "assets/prensa-bruma.jpg" },
  { id: 6, nombre: "Huila de Altura", precio: 39000, categoria: "Molido", cantidad: 9, imagen: "assets/huila-de-altura.jpg" },
];
// Estado actual del filtro de categoría y del buscador.
let activeCategory = "Todas";
let searchText = "";
// Referencias a los elementos de la página.
const productList = document.querySelector("#product-list");
const categoryFilters = document.querySelector("#category-filters");
const recordForm = document.querySelector("#record-form");
const recordStatus = document.querySelector("#record-status");
const contactForm = document.querySelector("#contact-form");
const contactStatus = document.querySelector("#form-status");
const savedOrders = document.querySelector("#saved-orders");
// Clave de almacenamiento local y temporizador del mensaje de contacto.
const ordersKey = "bruma-cafe-pedidos";
const confirmDialog = document.querySelector("#confirm-dialog");
let statusTimer;

// 2. Funciones de ayuda (formato, validación).
// Da formato de pesos colombianos a un número.
function formatPrice(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

// Valida un producto nuevo y devuelve el mensaje de error o texto vacío.
function validateProduct(product) {
  if (product.nombre.trim().length < 3) return "El nombre debe tener al menos 3 caracteres.";
  if (!Number.isFinite(product.precio) || product.precio <= 0 || !Number.isInteger(product.cantidad) || product.cantidad < 0) return "Ingresa un precio positivo y una cantidad entera no negativa.";
  if (products.some((item) => item.nombre.trim().toLocaleLowerCase() === product.nombre.trim().toLocaleLowerCase())) return "Ya existe un producto con ese nombre.";
  let imageUrl;
  try {
    imageUrl = new URL(product.imagen);
  } catch {
    return "Ingresa una URL válida para la imagen.";
  }
  if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") return "La imagen debe usar una URL HTTP o HTTPS.";
  if (product.categoria === "Grano" && product.cantidad > 50) return "No se pueden registrar más de 50 bolsas de café en grano.";
  return "";
}

// Muestra el inventario actual en la consola.
function logInventory() {
  console.info("Inventario actualizado en consola.");
  console.table(products.map(({ nombre, categoria, precio, cantidad }) => ({ nombre, categoria, precio, cantidad })));
}

// Lee los pedidos guardados en el navegador.
function readOrders() {
  try {
    const stored = localStorage.getItem(ordersKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Guarda la lista de pedidos en el navegador.
function saveOrders(orders) {
  localStorage.setItem(ordersKey, JSON.stringify(orders));
}

// Agrega un pedido nuevo al inicio de la lista guardada.
function addOrder(order) {
  const newOrder = { ...order, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  saveOrders([newOrder, ...readOrders()]);
  return newOrder;
}

// Elimina un pedido guardado por su id.
function removeOrder(id) {
  saveOrders(readOrders().filter((order) => order.id !== id));
}

// Da formato de fecha y hora local a una fecha.
function formatDate(date) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

// 3. Funciones que dibujan en la página.
// Dibuja las tarjetas de la lista recibida y actualiza el contador.
function renderProducts(list) {
  productList.replaceChildren();
  list.forEach((product) => {
    const card = document.createElement("article");
    card.classList.add("product-card");
    if (product.cantidad === 0) card.classList.add("is-empty");
    card.dataset.id = product.id;
    const image = document.createElement("img");
    image.src = product.imagen;
    image.alt = `Café ${product.nombre}`;
    image.loading = "lazy";
    const tag = document.createElement("span");
    tag.classList.add("product-tag");
    tag.textContent = product.categoria;
    const title = document.createElement("h3");
    title.textContent = product.nombre;
    const details = document.createElement("p");
    details.textContent = `${formatPrice(product.precio)} · ${product.cantidad} bolsas`;
    const stock = document.createElement("p");
    stock.classList.add("stock-status");
    stock.textContent = product.cantidad === 0 ? "Agotado" : "Disponible";
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.classList.add("delete-product");
    removeButton.dataset.id = product.id;
    removeButton.textContent = "Eliminar";
    card.appendChild(image);
    card.appendChild(tag);
    card.appendChild(title);
    card.appendChild(details);
    card.appendChild(stock);
    card.appendChild(removeButton);
    productList.appendChild(card);
  });
  document.querySelector("#result-count").textContent = `${list.length} ${list.length === 1 ? "resultado" : "resultados"}`;
  document.querySelector("#empty-results").hidden = list.length > 0;
}

// Crea los botones de categoría en la barra lateral.
function renderFilters() {
  const categories = ["Todas", ...new Set(products.map((product) => product.categoria))];
  categoryFilters.replaceChildren();
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("filter-button");
    if (category === activeCategory) button.classList.add("is-selected");
    button.dataset.category = category;
    button.textContent = category;
    categoryFilters.appendChild(button);
  });
}

// Calcula el resumen lateral y llena la tabla de productos.
function renderSummary() {
  document.querySelector("#summary-total").textContent = products.length;
  document.querySelector("#summary-empty").textContent = products.filter((product) => product.cantidad === 0).length;
  document.querySelector("#summary-quantity").textContent = products.reduce((total, product) => total + product.cantidad, 0);
  const tableBody = document.querySelector("#summary-table");
  tableBody.replaceChildren();
  products.forEach((product) => {
    const row = document.createElement("tr");
    [product.nombre, product.categoria, formatPrice(product.precio), String(product.cantidad)].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });
    tableBody.appendChild(row);
  });
}

// Muestra un mensaje de contacto y lo borra pasado un tiempo.
function showContactStatus(message, isError, duration) {
  clearTimeout(statusTimer);
  contactStatus.textContent = message;
  contactStatus.classList.toggle("has-error", isError);
  if (duration) {
    statusTimer = setTimeout(() => {
      contactStatus.textContent = "";
      contactStatus.classList.remove("has-error");
    }, duration);
  }
}

// Construye la tarjeta de un pedido guardado.
function createOrderElement(order) {
  const article = document.createElement("article");
  article.classList.add("saved-order");
  article.dataset.orderId = order.id;
  const heading = document.createElement("h3");
  heading.textContent = order.nombre;
  const details = document.createElement("p");
  details.textContent = `${order.email} · ${formatDate(order.createdAt)}`;
  const phone = document.createElement("p");
  phone.textContent = `Teléfono: ${order.telefono}`;
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.classList.add("remove-order");
  removeButton.textContent = "Eliminar";
  article.append(heading, details, phone, removeButton);
  return article;
}

// Dibuja la lista de pedidos guardados.
function renderOrders(highlightedId) {
  const orders = readOrders();
  savedOrders.replaceChildren();
  if (!orders.length) return;
  const heading = document.createElement("h3");
  heading.textContent = "Pedidos guardados";
  savedOrders.appendChild(heading);
  orders.forEach((order) => {
    const orderElement = createOrderElement(order);
    if (order.id === highlightedId) orderElement.classList.add("saved-order--new");
    savedOrders.appendChild(orderElement);
  });
}

// Abre el cuadro de confirmación y devuelve true si la persona acepta.
function askConfirmation(title, message, acceptLabel, isDanger) {
  confirmDialog.querySelector("#confirm-title").textContent = title;
  confirmDialog.querySelector("#confirm-message").textContent = message;
  const acceptButton = confirmDialog.querySelector("#confirm-accept");
  acceptButton.textContent = acceptLabel;
  acceptButton.classList.toggle("is-danger", isDanger);
  confirmDialog.returnValue = "cancel";
  confirmDialog.showModal();
  const dialogForm = confirmDialog.querySelector("form");
  return new Promise((resolve) => {
    const settle = (accepted) => {
      dialogForm.removeEventListener("submit", handleSubmit);
      confirmDialog.removeEventListener("close", handleClose);
      resolve(accepted);
    };
    const handleSubmit = (event) => settle(event.submitter.value === "accept");
    const handleClose = () => settle(confirmDialog.returnValue === "accept");
    dialogForm.addEventListener("submit", handleSubmit);
    confirmDialog.addEventListener("close", handleClose);
  });
}

// Aplica búsqueda y categoría, y vuelve a dibujar todo.
function updateView() {
  const normalizedSearch = searchText.toLocaleLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "Todas" || product.categoria === activeCategory;
    const matchesSearch = `${product.nombre} ${product.categoria}`.toLocaleLowerCase().includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });
  renderProducts(filteredProducts);
  renderFilters();
  renderSummary();
}

// 4. Eventos.
// Agrega un producto tras validar el formulario.
recordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(recordForm);
  const rawPrice = String(formData.get("precio")).trim();
  const rawQuantity = String(formData.get("cantidad")).trim();
  if (!String(formData.get("nombre")).trim() || !rawPrice || !String(formData.get("categoria")) || !rawQuantity || !String(formData.get("imagen")).trim()) {
    recordStatus.textContent = "Completa todos los campos del producto.";
    recordStatus.classList.add("has-error");
    return;
  }
  const product = {
    id: products.reduce((largestId, item) => Math.max(largestId, item.id), 0) + 1,
    nombre: String(formData.get("nombre")).trim(),
    precio: Number(rawPrice),
    categoria: String(formData.get("categoria")),
    cantidad: Number(rawQuantity),
    imagen: String(formData.get("imagen")).trim(),
  };
  const error = validateProduct(product);
  if (error) {
    recordStatus.textContent = error;
    recordStatus.classList.add("has-error");
    return;
  }
  const accepted = await askConfirmation("Agregar producto", `¿Agregar "${product.nombre}" al inventario?`, "Agregar", false);
  if (!accepted) return;
  products.unshift(product);
  recordForm.reset();
  recordStatus.textContent = `${product.nombre} agregado al inventario.`;
  recordStatus.classList.remove("has-error");
  console.info(`Registro guardado: producto ${product.nombre}`);
  updateView();
  logInventory();
});

// Filtra mientras se escribe en el buscador.
document.querySelector("#product-search").addEventListener("input", (event) => {
  searchText = event.target.value;
  updateView();
});

// Cambia la categoría activa al pulsar un botón.
categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  updateView();
  document.querySelector("#catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
});

// Selecciona una tarjeta o elimina un producto con confirmación.
productList.addEventListener("click", async (event) => {
  const card = event.target.closest(".product-card");
  if (card && !event.target.closest("button")) card.classList.toggle("is-selected");
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  const target = products.find((product) => String(product.id) === button.dataset.id);
  if (!target) return;
  const accepted = await askConfirmation("Eliminar producto", `¿Eliminar "${target.nombre}" del inventario?`, "Eliminar", true);
  if (!accepted) return;
  const productIndex = products.findIndex((product) => product.id === target.id);
  if (productIndex !== -1) {
    const removedProduct = products[productIndex];
    products.splice(productIndex, 1);
    if (activeCategory !== "Todas" && !products.some((product) => product.categoria === activeCategory)) {
      activeCategory = "Todas";
    }
    console.info(`Producto eliminado: ${removedProduct.nombre}`);
    logInventory();
  }
  updateView();
});

// Valida el contacto, guarda el pedido y confirma con el nombre.
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const contactName = contactForm.elements.nombre.value.trim();
  const savedOrder = addOrder({
    nombre: contactName,
    email: contactForm.elements.email.value.trim(),
    telefono: contactForm.elements.telefono.value.trim(),
  });
  console.info(`Pedido guardado: ${contactName}`);
  console.table(readOrders().map(({ nombre, email, telefono }) => ({ nombre, email, telefono })));
  contactForm.reset();
  showContactStatus(`Gracias, ${contactName}. Recibimos tu mensaje y pronto te contactaremos.`, false, 5000);
  renderOrders(savedOrder.id);
});

// Elimina un pedido guardado con una animación corta.
savedOrders.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-order");
  if (!button) return;
  const orderElement = button.closest(".saved-order");
  orderElement.classList.add("saved-order--removing");
  setTimeout(() => {
    removeOrder(orderElement.dataset.orderId);
    console.info("Pedido eliminado.");
    showContactStatus("Pedido eliminado.", false, 5000);
    renderOrders();
  }, 260);
});

// Aplica y alterna el tema guardado.
const themeToggle = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("bruma-theme");
if (savedTheme === "dark") {
  document.documentElement.dataset.theme = "dark";
  themeToggle.setAttribute("aria-label", "Activar modo claro");
  themeToggle.setAttribute("aria-pressed", "true");
}

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.dataset.theme !== "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-label", isDark ? "Activar modo claro" : "Activar modo oscuro");
  themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem("bruma-theme", isDark ? "dark" : "light");
});

// 5. Arranque con DOMContentLoaded.
// Dibuja la página al terminar de cargar.
document.addEventListener("DOMContentLoaded", () => {
  updateView();
  renderOrders();
  console.info("Bruma Café: inventario cargado correctamente.");
  logInventory();
});
