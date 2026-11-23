// Actividad 2 - Gestor de tareas con JavaScript, ES6+, POO y LocalStorage

class Tarea {
  constructor(nombre, completada = false, id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)) {
    this.id = id;
    this.nombre = nombre;
    this.completada = completada;
  }
  actualizarEstado() { this.completada = !this.completada; }
  editarContenido(nuevoNombre) { this.nombre = nuevoNombre; }
  eliminar() { return this.id; }
}

class GestorDeTareas {
  constructor() { this.tareas = this.cargar(); }
  cargar() {
    try {
      const datos = JSON.parse(localStorage.getItem("taskflow-tareas")) || [];
      return datos.map(({ id, nombre, completada }) => new Tarea(nombre, completada, id));
    } catch (error) {
      console.error("No fue posible recuperar las tareas:", error);
      return [];
    }
  }
  guardar() { localStorage.setItem("taskflow-tareas", JSON.stringify(this.tareas)); }
  agregar(nombre) {
    const tarea = new Tarea(nombre);
    this.tareas.push(tarea);
    this.guardar();
    return tarea;
  }
  buscar(id) { return this.tareas.find((tarea) => tarea.id === id); }
  editar(id, nuevoNombre) {
    const tarea = this.buscar(id);
    if (!tarea) return false;
    tarea.editarContenido(nuevoNombre);
    this.guardar();
    return true;
  }
  cambiarEstado(id) {
    const tarea = this.buscar(id);
    if (!tarea) return false;
    tarea.actualizarEstado();
    this.guardar();
    return true;
  }
  eliminar(id) {
    const tarea = this.buscar(id);
    if (!tarea) return false;
    tarea.eliminar();
    this.tareas = this.tareas.filter((elemento) => elemento.id !== id);
    this.guardar();
    return true;
  }
  limpiarCompletadas() {
    this.tareas = this.tareas.filter((tarea) => !tarea.completada);
    this.guardar();
  }
}

const gestor = new GestorDeTareas();
const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const formMessage = document.querySelector("#formMessage");
const totalCount = document.querySelector("#totalCount");
const completedCount = document.querySelector("#completedCount");
const pendingCount = document.querySelector("#pendingCount");
const filterButtons = document.querySelectorAll(".filter-button");
const editDialog = document.querySelector("#editDialog");
const editForm = document.querySelector("#editForm");
const editInput = document.querySelector("#editInput");
const editMessage = document.querySelector("#editMessage");
let filtroActual = "all";
let tareaEnEdicion = null;

const validarNombre = (nombre) => nombre.trim().length > 0;
const mostrarMensaje = (elemento, mensaje = "") => { elemento.textContent = mensaje; };

const actualizarResumen = () => {
  const total = gestor.tareas.length;
  const completadas = gestor.tareas.filter((tarea) => tarea.completada).length;
  totalCount.textContent = total;
  completedCount.textContent = completadas;
  pendingCount.textContent = total - completadas;
};

const renderizarTareas = () => {
  taskList.innerHTML = "";
  const tareasFiltradas = gestor.tareas.filter((tarea) => {
    if (filtroActual === "pending") return !tarea.completada;
    if (filtroActual === "completed") return tarea.completada;
    return true;
  });
  tareasFiltradas.forEach((tarea) => {
    const item = document.createElement("li");
    item.className = `task-item ${tarea.completada ? "completed" : ""}`;
    item.dataset.id = tarea.id;
    item.innerHTML = `
      <input class="task-check" type="checkbox" aria-label="Marcar como completada" ${tarea.completada ? "checked" : ""}>
      <span class="task-name"></span>
      <div class="task-actions">
        <button type="button" class="action-button edit" data-action="edit">Editar</button>
        <button type="button" class="action-button delete" data-action="delete">Eliminar</button>
      </div>`;
    // Se usa textContent para insertar el texto del usuario sin interpretarlo como HTML.
    item.querySelector(".task-name").textContent = tarea.nombre;
    taskList.append(item);
  });
  emptyState.hidden = tareasFiltradas.length > 0;
  actualizarResumen();
};

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nombre = taskInput.value.trim();
  if (!validarNombre(nombre)) {
    mostrarMensaje(formMessage, "Escribe una tarea antes de agregarla.");
    taskInput.focus();
    return;
  }
  gestor.agregar(nombre);
  taskInput.value = "";
  mostrarMensaje(formMessage);
  filtroActual = "all";
  actualizarFiltros();
  renderizarTareas();
  taskInput.focus();
});

const actualizarFiltros = () => {
  filterButtons.forEach((boton) => {
    boton.classList.toggle("active", boton.dataset.filter === filtroActual);
  });
};
filterButtons.forEach((boton) => {
  boton.addEventListener("click", () => {
    filtroActual = boton.dataset.filter;
    actualizarFiltros();
    renderizarTareas();
  });
});

// Delegación de eventos para controles creados dinámicamente.
taskList.addEventListener("click", (event) => {
  const boton = event.target.closest("button[data-action]");
  if (!boton) return;
  const item = boton.closest(".task-item");
  const id = item.dataset.id;
  if (boton.dataset.action === "edit") abrirEdicion(id);
  if (boton.dataset.action === "delete") {
    const tarea = gestor.buscar(id);
    if (tarea && window.confirm(`¿Eliminar la tarea "${tarea.nombre}"?`)) {
      gestor.eliminar(id);
      renderizarTareas();
    }
  }
});

taskList.addEventListener("change", (event) => {
  if (!event.target.matches(".task-check")) return;
  const id = event.target.closest(".task-item").dataset.id;
  gestor.cambiarEstado(id);
  renderizarTareas();
});

const abrirEdicion = (id) => {
  const tarea = gestor.buscar(id);
  if (!tarea) return;
  tareaEnEdicion = id;
  editInput.value = tarea.nombre;
  mostrarMensaje(editMessage);
  editDialog.hidden = false;
  editInput.focus();
};
const cerrarEdicion = () => {
  editDialog.hidden = true;
  tareaEnEdicion = null;
};

editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nuevoNombre = editInput.value.trim();
  if (!validarNombre(nuevoNombre)) {
    mostrarMensaje(editMessage, "El nombre de la tarea no puede estar vacío.");
    editInput.focus();
    return;
  }
  gestor.editar(tareaEnEdicion, nuevoNombre);
  cerrarEdicion();
  renderizarTareas();
});

document.querySelector("#closeDialog").addEventListener("click", cerrarEdicion);
document.querySelector("#cancelEdit").addEventListener("click", cerrarEdicion);
editDialog.addEventListener("click", (event) => {
  if (event.target === editDialog) cerrarEdicion();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !editDialog.hidden) cerrarEdicion();
});

document.querySelector("#clearCompleted").addEventListener("click", () => {
  const hayCompletadas = gestor.tareas.some((tarea) => tarea.completada);
  if (!hayCompletadas) {
    mostrarMensaje(formMessage, "No hay tareas completadas para limpiar.");
    return;
  }
  gestor.limpiarCompletadas();
  renderizarTareas();
  mostrarMensaje(formMessage, "Se eliminaron las tareas completadas.");
});

const fecha = new Intl.DateTimeFormat("es-MX", {
  weekday: "long", day: "numeric", month: "long"
}).format(new Date());
document.querySelector("#todayLabel").textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
renderizarTareas();