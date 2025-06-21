# Gym Tracker - AstroJS PWA

Una aplicación web progresiva (PWA) para el seguimiento de entrenamientos de gimnasio, migrada de HTML/JS/CSS vanilla a AstroJS con soporte completo para PWA.

## ✨ Características

- 📱 **PWA Completa**: Instalable en dispositivos móviles y escritorio
- 🏋️‍♂️ **Seguimiento de Ejercicios**: 17 máquinas de gimnasio con imágenes
- ⏱️ **Temporizador de Descanso**: Sistema de descanso entre series
- 💾 **Almacenamiento Local**: Los datos se guardan automáticamente
- 🔄 **Funciona Offline**: Service Worker para uso sin conexión
- 📊 **Registro de Entrenamientos**: Historial completo de sesiones
- 🎨 **Interfaz Moderna**: Diseño responsive y atractivo

## 🏗️ Estructura del Proyecto

```text
/
├── public/
│   ├── css/
│   │   └── style.css          # Estilos principales
│   ├── js/
│   │   └── gym-app.js         # Lógica principal de la aplicación
│   ├── images/
│   │   └── gym/               # Imágenes de las máquinas de ejercicio
│   ├── manifest.json          # Configuración PWA
│   └── sw.js                  # Service Worker
├── src/
│   ├── components/            # Componentes reutilizables
│   │   ├── Header.astro       # Encabezado con logo y título
│   │   ├── Navigation.astro   # Pestañas de navegación
│   │   ├── TodayView.astro    # Vista de rutina diaria
│   │   ├── HistoryView.astro  # Vista del historial
│   │   ├── RoutineSelector.astro # Selector de rutinas
│   │   ├── Modal.astro        # Modal para imágenes
│   │   └── Toast.astro        # Notificaciones
│   ├── layouts/
│   │   └── Layout.astro       # Layout base de la aplicación
│   ├── pages/
│   │   └── index.astro        # Página principal (usa componentes)
│   └── styles/
│       └── global.css         # Estilos Tailwind + personalizados
├── astro.config.mjs           # Configuración de Astro + PWA
└── package.json
```

## 🚀 Instalación y Uso

### Requisitos Previos
- Node.js 18+ 
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

## 🧞 Comandos Disponibles

| Comando                   | Descripción                                      |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Instala las dependencias                        |
| `npm run dev`             | Inicia servidor de desarrollo                   |
| `npm run build`           | Construye la aplicación para producción         |
| `npm run preview`         | Previsualiza la build localmente                |
| `npm run astro ...`       | Ejecuta comandos CLI de Astro                   |

## 💡 Funcionalidades Principales

### 🏋️‍♂️ Seguimiento de Ejercicios
- Selección de 17 máquinas diferentes
- Registro de peso, repeticiones y series
- Notas personalizadas por ejercicio

### ⏱️ Sistema de Descanso
- Temporizador configurable entre series
- Notificaciones visuales y sonoras
- Control de pausa/reanudación

### 📊 Historial de Entrenamientos
- Registro automático de todas las sesiones
- Visualización de progreso por ejercicio
- Exportación de datos

### � Características PWA
- Instalable en dispositivos móviles
- Funciona completamente offline
- Sincronización automática cuando hay conexión

## 🔧 Tecnologías Utilizadas

- **AstroJS**: Framework moderno para sitios web
- **Tailwind CSS**: Framework de CSS utilitario para estilos rápidos y consistentes
- **Vite PWA**: Plugin para funcionalidades PWA
- **Workbox**: Service Worker para cache y offline
- **Vanilla JavaScript**: Lógica de aplicación
- **Web APIs**: LocalStorage, Notifications, etc.

## 📦 Migración desde Versión Anterior

Esta aplicación fue migrada completamente desde una versión vanilla (HTML/JS/CSS) a AstroJS + Tailwind CSS manteniendo:
- ✅ Toda la funcionalidad original
- ✅ Datos de usuario existentes
- ✅ Soporte PWA completo
- ✅ Rendimiento mejorado
- ✅ Mejor estructura de código
- ✅ Estilos modernos con Tailwind CSS

## 🎯 Próximas Mejoras

- [ ] Sincronización en la nube
- [ ] Gráficos de progreso
- [ ] Planes de entrenamiento personalizados
- [ ] Integración con wearables
- [ ] Modo multijugador/competitivo

## 🎨 Configuración de Estilos

La aplicación utiliza **Tailwind CSS** para los estilos, configurado de la siguiente manera:

### Estructura de Estilos
- `src/styles/global.css`: Estilos globales, importa Tailwind y contiene estilos personalizados
- `tailwind.config.js`: Configuración de Tailwind CSS
- `astro.config.mjs`: Configuración de Astro con plugin de Tailwind

### Características de Diseño
- **Mobile-first**: Diseño responsive desde dispositivos móviles
- **Dark mode ready**: Preparado para modo oscuro (futuro)
- **Componentes reutilizables**: Clases utilitarias de Tailwind
- **Estilos personalizados**: Para funcionalidades específicas de la app

### Personalización
Para personalizar los estilos, puedes:
1. Modificar `tailwind.config.js` para ajustar el tema
2. Añadir estilos personalizados en `src/styles/global.css`
3. Usar clases de Tailwind directamente en los componentes Astro

### 🧩 Arquitectura de Componentes

La aplicación utiliza una **arquitectura modular** con componentes Astro reutilizables:

#### **Layout Principal**
- `Layout.astro`: Estructura base HTML, importa estilos y scripts

#### **Componentes de UI**
- `Header.astro`: Logo, título y subtítulo de la aplicación
- `Navigation.astro`: Sistema de pestañas (Rutina de Hoy / Historial)
- `Modal.astro`: Modal para visualizar imágenes en pantalla completa
- `Toast.astro`: Sistema de notificaciones

#### **Componentes de Funcionalidad**
- `TodayView.astro`: Vista completa de la rutina diaria
- `HistoryView.astro`: Vista del historial de entrenamientos
- `RoutineSelector.astro`: Selector desplegable de rutinas

#### **Beneficios de la Modularización**
- ✅ **Reutilización**: Componentes pueden ser reutilizados
- ✅ **Mantenimiento**: Cada componente tiene una responsabilidad específica
- ✅ **Escalabilidad**: Fácil añadir nuevas funcionalidades
- ✅ **Testing**: Componentes pueden ser probados individualmente
- ✅ **Legibilidad**: Código más limpio y organizado
