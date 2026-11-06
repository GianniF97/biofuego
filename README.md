# BIOFUEGO — Sitio Web Oficial

Landing page profesional y premium para **BIOFUEGO**, marca argentina de iniciadores de fuego artesanales elaborados a base de aserrín de madera ecológica en Misiones, Argentina.

---

## 🪵 Identidad & Filosofía de Diseño

Inspirada en el lenguaje visual moderno y editorial de **Aqa Lite** (`aqalite.co.nz`):
- **Minimalismo cálido y premium**: Grandes titulares tipográficos en sans-serif moderna (*Outfit* y *Plus Jakarta Sans*), amplio espacio en blanco/marfil y jerarquía visual impecable.
- **Protagonismo absoluto del producto**: La pastilla artesanal de aserrín con mecha extraída de los archivos originales del proyecto es la protagonista del sitio, con inclinación 3D interactiva que responde al cursor del mouse y animación suave de flotación.
- **Paleta oficial del PDF de la marca**:
  - **Naranja intenso** (`#F15625`): Color primario y acento enérgico del logo y la llama.
  - **Negro Carbón** (`#231F20` / `#141212`): Textos con excelente contraste y secciones nocturnas.
  - **Blanco & Marfil Orgánico** (`#FFFFFF` / `#FAF8F5`): Fondos limpios y luminosos.
  - **Tonos de Aserrín & Madera** (`#EAE1D5` / `#73533F`): Complementos naturales que transmiten autenticidad y calidez.

---

## 📁 Estructura del Proyecto

```
BioFuego/
├── assets/
│   ├── css/
│   │   ├── style.css            # Estilos globales, tipografía fluida, layouts y responsive
│   │   └── animations.css       # Keyframes de flotación, microinteracciones y scroll reveals
│   ├── js/
│   │   └── main.js              # Tilt 3D, parallax suave, observador de scroll y calculadora
│   └── images/
│       ├── biofuego-logo.png    # Logo horizontal nítido oficial en naranja
│       ├── biofuego-logo.svg    # Logo vectorizado oficial
│       ├── biofuego-logo-white.png # Logo oficial blanco para pie de página
│       ├── biofuego-flame.svg   # Isotipo oficial de la llama sólida
│       ├── flame-pattern.svg    # Patrón de fondo extraído de la pág. 2 del PDF
│       ├── favicon.svg          # Favicon oficial
│       ├── puck-hero.webp       # Fotografía recortada de la pastilla original
│       ├── pack-5-pastillas.webp # Composición fotográfica del pack de 5 unidades
│       ├── puck-texture-real.webp # Macro detalle de virutas y aserrín compactado
│       ├── puck-wick-detail.webp # Detalle de la mecha de encendido rápido
│       ├── aserrin_macro.webp   # Fotografía de taller y aserrín en Misiones
│       ├── misiones_paisaje.webp # Fotografía de tierra colorada y pinar misionero
│       └── fuego_parrilla.webp  # Fotografía de fuego y brasas para asado
├── index.html                   # Maquetación semántica y optimizada para SEO
├── firebase.json                # Configuración de Firebase Hosting (reglas de caché y headers)
├── .firebaserc                  # Vinculación del proyecto de Firebase (portafolio-f7359)
├── .gitignore                   # Exclusiones de Git y temporales
├── package.json                 # Configuración de scripts npm y deploy
└── README.md
```

---

## 🔥 Despliegue en Firebase Hosting

El proyecto es **100% estático (JAMstack)**, por lo que se sirve desde la CDN global de Firebase con máxima velocidad, compresión Brotli/Gzip y certificado SSL gratuito.

### 1. Probar localmente con el Emulador de Firebase
```bash
npm run emulate
# O con comando directo:
npx firebase-tools emulators:start --only hosting
```
Acceder en `http://localhost:5000`.

### 2. Desplegar a Producción
```bash
npm run deploy
# O con comando directo:
npx firebase-tools deploy --only hosting:biofuego
```
La web quedará publicada de inmediato en:
* **https://biofuego.web.app**
* **https://biofuego.firebaseapp.com**

### 3. Desplegar a un Canal de Vista Previa (Preview Channel)
Para probar cambios antes de pasarlos a producción:
```bash
npm run deploy:preview
```
Generará una URL temporal única que expira automáticamente a los 7 días.

---

## 🌐 Configurar Dominio Personalizado en Firebase

Para usar tu propio dominio (ej. `biofuego.com.ar`, `biofuego.ar`, `madereraferrari.com.ar`):

1. Ingresá a la [Consola de Firebase](https://console.firebase.google.com/project/portafolio-f7359/hosting/sites/biofuego).
2. En la sección **Hosting**, hacé clic en **Agregar dominio personalizado**.
3. Ingresá tu dominio (ej. `biofuego.com.ar`).
4. Firebase te brindará 2 registros DNS:
   - **Registro TXT**: Para verificar la propiedad del dominio en NIC.ar o tu registrador.
   - **Registros A**: Dos direcciones IP de Firebase Hosting (ej. `199.36.158.100`).
5. Copiá y pegá estos registros en el panel DNS de tu proveedor de dominio.
6. En pocos minutos (o hasta 24 hs según propagación DNS), Firebase provisionará automáticamente el certificado SSL (HTTPS) de forma gratuita.

---

## 📱 Canales Funcionales de Contacto
- **WhatsApp**: [+54 9 3755 665852](https://wa.me/5493755665852)
- **Correo**: [madereraferrari@yahoo.com.ar](mailto:madereraferrari@yahoo.com.ar)
- **Origen**: Misiones, Argentina (Maderera Ferrari)
