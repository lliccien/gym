# 🗓️ Seguimiento de Gimnasio

Aplicación web sencilla para registrar y seguir tu rutina de ejercicios semanal.

## 🚀 Descripción

Esta aplicación te permite visualizar tu rutina de gimnasio asignada para cada día de la semana, registrar los ejercicios completados (series, repeticiones y peso), y consultar un historial de tus entrenamientos. Es una herramienta útil para mantener la constancia y observar tu progreso a lo largo del tiempo.

## ✨ Características

*   **Visualización de Rutina Diaria:** Muestra los ejercicios programados para el día actual, incluyendo el nombre del grupo muscular, ejercicios específicos y cardio recomendado.
*   **Registro de Ejercicios:** Permite ingresar el número de series, repeticiones y el peso levantado para cada ejercicio.
*   **Confirmación Visual:** Los ejercicios registrados cambian de apariencia para indicar que han sido completados.
*   **Historial de Entrenamientos:** Guarda un registro de todos los ejercicios completados, ordenados por fecha, y permite eliminar entradas individuales.
*   **Modal de Imágenes:** Al hacer clic en la imagen de un ejercicio, esta se muestra en pantalla completa para mejor visualización.
*   **Notificaciones Toast:** Informa al usuario sobre acciones realizadas (ej. ejercicio registrado, registro eliminado).
*   **Diseño Responsivo:** Adaptado para una correcta visualización en dispositivos móviles y de escritorio.
*   **Persistencia de Datos:** Utiliza IndexedDB para almacenar los datos de entrenamiento localmente en el navegador del usuario.

## 🛠️ Tecnologías Utilizadas

*   **HTML5:** Para la estructura de la aplicación.
*   **CSS3:** Para los estilos visuales, incluyendo:
    *   **Tailwind CSS:** Framework CSS para un desarrollo rápido y utilitario.
    *   Estilos personalizados en `css/style.css`.
*   **JavaScript (ES6+):** Para la lógica de la aplicación, manipulación del DOM, manejo de eventos y la interacción con IndexedDB.
*   **IndexedDB:** API del navegador para almacenamiento de datos del lado del cliente.
*   **Google Fonts:** Para la tipografía (Inter).

## 📁 Estructura del Proyecto

```
.
├── css/
│   └── style.css        # Estilos personalizados
├── images/
│   └── gym/             # Imágenes de los ejercicios
│       ├── ultra-abdominal-crunch.png
│       ├── ... (otras imágenes)
├── js/
│   └── script.js        # Lógica principal de la aplicación
├── index.html           # Archivo HTML principal
└── README.md            # Este archivo
```

## ⚙️ Configuración y Uso

1.  **Clonar el repositorio (opcional):**
    Si has obtenido el código fuente, puedes clonarlo.
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd <NOMBRE_DEL_DIRECTORIO>
    ```
2.  **Abrir la aplicación:**
    Simplemente abre el archivo `index.html` en tu navegador web preferido. No se requiere un servidor web, ya que es una aplicación estática que se ejecuta completamente en el cliente.

3.  **Uso de la Aplicación:**
    *   **Rutina de Hoy:** Al cargar la página, verás la rutina asignada para el día actual.
        *   Ingresa las series, repeticiones y peso para cada ejercicio.
        *   Haz clic en el botón "Registrar" para guardar el ejercicio. El botón cambiará a "✓ Registrado".
        *   Haz clic en la imagen de un ejercicio para verla en pantalla completa.
    *   **Historial:** Haz clic en la pestaña "Historial" para ver todos los ejercicios que has registrado.
        *   Puedes eliminar entradas individuales haciendo clic en el botón "Eliminar" correspondiente.

## 🔮 Posibles Mejoras Futuras

*   Permitir la edición de entradas en el historial.
*   Agregar la posibilidad de crear y personalizar rutinas directamente en la aplicación.
*   Implementar gráficos de progreso para visualizar la evolución del peso levantado o repeticiones.
*   Sincronización de datos con un backend para uso en múltiples dispositivos.
*   Añadir un temporizador de descanso entre series.
*   Mejorar la accesibilidad (ARIA).
*   Internacionalización (i18n) para soportar múltiples idiomas.

---

Hecho con ❤️ para los entusiastas del fitness.
