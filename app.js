// app.js (módulo)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

/* --- Inicializar Firebase con la config del archivo firebase-config.js --- */
const cfg = window.__FIREBASE_CONFIG__;
if (!cfg || Object.keys(cfg).length === 0) {
  console.warn("No se encontró la configuración de Firebase. Rellena firebase-config.js con tu config.");
}
const app = initializeApp(cfg);
const db = getFirestore(app);

/* --- Elementos DOM --- */
const catalog = document.getElementById('catalogo');
const form = document.getElementById('form-add');
const btnAdminToggle = document.getElementById('btn-admin-toggle');
const adminPanel = document.getElementById('admin-panel');
const yearSpan = document.getElementById('year');
yearSpan.textContent = new Date().getFullYear();

/* Mostrar / ocultar admin */
btnAdminToggle.addEventListener('click', () => {
  adminPanel.classList.toggle('hidden');
});

/* Renderizar artículo */
function crearCard({id, nombre, precio, imagen, email}) {
  const div = document.createElement('article');
  div.className = 'card';
  div.innerHTML = `
    <img src="${imagen || 'https://via.placeholder.com/400x300?text=Artesania'}" alt="${nombre}">
    <div class="body">
      <h4>${escapeHtml(nombre)}</h4>
      <div class="price">MXN $${Number(precio).toFixed(2)}</div>
      <div class="contact">Contacto: <a href="mailto:${encodeURIComponent(email)}">${escapeHtml(email)}</a></div>
    </div>
  `;
  return div;
}

/* Cargar artículos desde Firestore */
async function cargarArticulos() {
  catalog.innerHTML = '<p>Cargando artículos...</p>';
  try {
    const q = query(collection(db, 'articulos'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    catalog.innerHTML = '';
    if (snap.empty) {
      catalog.innerHTML = '<p>No hay artículos todavía. Agrega algunos desde el panel administrador.</p>';
      return;
    }
    snap.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      const card = crearCard(data);
      catalog.appendChild(card);
    });
  } catch (err) {
    console.error("Error cargando artículos:", err);
    catalog.innerHTML = '<p>Error cargando artículos. Revisa la consola.</p>';
  }
}

/* Añadir artículo (desde form) */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const imagen = document.getElementById('img').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const precio = document.getElementById('precio').value;
  const email = document.getElementById('email').value.trim();

  if (!nombre || !precio || !email) return;

  try {
    await addDoc(collection(db, 'articulos'), {
      nombre, precio: Number(precio), imagen, email,
      createdAt: serverTimestamp()
    });
    form.reset();
    await cargarArticulos(); // refrescar listado
    alert('Artículo agregado correctamente.');
  } catch (err) {
    console.error(err);
    alert('Error al agregar el artículo. Revisa la consola.');
  }
});

document.getElementById('btn-clear').addEventListener('click', () => form.reset());

/* Helper: escapar HTML */
function escapeHtml(unsafe) {
  return unsafe
       .replaceAll('&','&amp;')
       .replaceAll('<','&lt;')
       .replaceAll('>','&gt;')
       .replaceAll('"','&quot;')
       .replaceAll("'","&#039;");
}

/* Inicializar carga */
cargarArticulos();
