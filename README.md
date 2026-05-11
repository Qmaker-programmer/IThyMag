# iThyMag — ¡VIVA EL ASCII ART! 🎨

**iThyMag** es una galería interactiva de ASCII Art diseñada para entusiastas de la estética retro-digital. La aplicación permite a los usuarios explorar, compartir, editar y organizar sus creaciones favoritas en un entorno visualmente impactante con efectos de plasma y animaciones fluidas.

## ✨ Características Principales

* **Galería de ASCII Art:** Explora una amplia colección de arte basado en caracteres.
* **Fondo de Plasma Dinámico:** Un fondo interactivo en Canvas con "blobs" que reaccionan a la configuración y profundidad (simulación 3D).
* **Gestión de Contenido:** Sistema completo de login, subida de arte, edición y eliminación (integrado con Firebase).
* **Panel de Detalles "Push":** Visualización lateral de piezas de arte con animaciones suaves y opciones de compartir/copiar.
* **Configuración Personalizada:** Controla efectos visuales como el desenfoque, colisiones de blobs, modo compacto y reducción de movimiento.
* **Persistencia:** Las preferencias se guardan localmente mediante cookies.

## 🛠️ Stack Tecnológico

* **Frontend:** React (Vite)
* **Estilos:** CSS3 (Variables personalizadas y animaciones "spring")
* **Backend & Auth:** Firebase (Firestore & Firebase Auth)
* **Renderizado:** Canvas API (para el fondo de plasma)

## 📂 Estructura del Proyecto

* `App.jsx`: Componente principal que gestiona el estado global, la lógica de Firebase y el layout.
* `PlasmaBackground.jsx`: Motor de renderizado para los efectos visuales del fondo.
* `Settings.jsx`: Modal de configuración y gestión de cookies.
* `App.css` e `index.css`: Definiciones de estilos, temas y resets globales.
* `index.html`: Punto de entrada con pre-carga de fuentes de Google (Syne, Space Grotesk, Fira Code).

## 🚀 Instalación y Desarrollo

1.  **Clonar el repositorio.**
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Configurar Firebase:**
    Asegúrate de tener un archivo `firebaseConfig.js` con tus credenciales de proyecto.
4.  **Ejecutar en modo desarrollo:**
    ```bash
    npm run dev
    ```

## 🎨 Personalización

Puedes ajustar la experiencia visual desde el menú de **Ajustes**:
* **Fancy Background:** Activa/desactiva los blobs de plasma.
* **Desenfoque:** Cambia la intensidad del efecto *glassmorphism*.
* **Modo ASCII Mono:** Fuerza a que el arte se vea en blanco puro para un look más clásico.

---
Creado con ❤️ por el equipo de iThyMag.
