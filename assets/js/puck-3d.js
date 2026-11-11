/**
 * BIOFUEGO — Visor 3D Interactivo de la Pastilla Artesanal de Aserrín
 * Renderizado WebGL PBR con Three.js
 * - Texturas PBR de alta definición de virutas de madera compactadas y cera ecológica
 * - Geometría de cilindro biselado con grupos de materiales separados para máxima nitidez
 * - Mecha artesanal de algodón trenzado con curvatura natural y punta tostada
 * - Control táctil y de ratón 360° con inercia física suave
 * - Órbita automática y respiración cuando está inactivo
 * - Optimización por IntersectionObserver (0% CPU fuera de vista)
 */

(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPuck3D);
  } else {
    initPuck3D();
  }

  function initPuck3D() {
    const container = document.getElementById('heroPuck');
    if (!container) return;

    if (typeof THREE === 'undefined') {
      console.warn('Biofuego 3D: Three.js no está disponible.');
      return;
    }

    // Ocultar foto 2D estática de inmediato
    const pictureEl = container.querySelector('picture');
    if (pictureEl) {
      pictureEl.style.display = 'none';
    }

    const canvas = document.createElement('canvas');
    canvas.id = 'heroPuckCanvas';
    canvas.className = 'hero-puck-canvas';
    canvas.setAttribute('aria-label', 'Modelo 3D interactivo de la pastilla iniciadora Biofuego');
    canvas.setAttribute('role', 'img');

    // Badge indicador interactivo 3D
    const hintBadge = document.createElement('div');
    hintBadge.className = 'puck-3d-hint';
    hintBadge.innerHTML = `
      <svg class="puck-3d-hint-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
      </svg>
      <span>3D Interactivo · Arrastrá para girar</span>
    `;

    container.appendChild(canvas);
    container.appendChild(hintBadge);

    // Dimensiones
    const rect = container.getBoundingClientRect();
    let width = rect.width || 540;
    let height = rect.height || 440;

    // 1. Escena y Cámara con perspectiva de producto
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(26, width / height, 0.1, 50);
    camera.position.set(0, 0.70, 5.8);
    camera.lookAt(0, -0.06, 0);

    // 2. Renderer WebGL
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('Biofuego 3D: WebGL no compatible.', e);
      if (pictureEl) pictureEl.style.display = 'block';
      canvas.remove();
      hintBadge.remove();
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (renderer.outputEncoding !== undefined) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    if (renderer.toneMapping !== undefined) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.98;
    }

    // 3. Iluminación de Estudio Fotográfico Profesional (Softboxes Neutros y Luz de Ambiente Suave)
    const ambientLight = new THREE.AmbientLight(0xfdfbf7, 0.60);
    scene.add(ambientLight);

    // Luz principal (Key Softbox) desde arriba a la derecha - luz blanca pura equilibrada
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.88);
    keyLight.position.set(3.2, 4.2, 3.5);
    scene.add(keyLight);

    // Luz de relleno (Fill Softbox) suave y neutra para preservar microdetalles en sombras
    const fillLight = new THREE.DirectionalLight(0xf2e8dd, 0.40);
    fillLight.position.set(-3.2, 1.8, 2.2);
    scene.add(fillLight);

    // Luz de contorno neutra (Rim Light suave para volumen tridimensional sin saturación)
    const rimLight = new THREE.DirectionalLight(0xfff6ea, 0.30);
    rimLight.position.set(-2.6, 2.8, -3.2);
    scene.add(rimLight);

    // Reflejo suave desde el plano inferior (Tonos madera clara / beige)
    const groundBounce = new THREE.DirectionalLight(0xeee2d5, 0.16);
    groundBounce.position.set(0, -2.5, 1.5);
    scene.add(groundBounce);

    // 4. Grupo 3D de la Pastilla
    const puckGroup = new THREE.Group();
    scene.add(puckGroup);

    // 5. Carga de Texturas PBR con Mapeos Separados para Caras y Lateral
    const textureLoader = new THREE.TextureLoader();

    // Textura para la cara superior e inferior (Mapeo cenital 1:1 perfecto sin costuras)
    const albedoTop = textureLoader.load('assets/textures/puck_albedo.webp');
    albedoTop.encoding = THREE.sRGBEncoding;

    const normalTop = textureLoader.load('assets/textures/puck_normal.webp');
    const roughnessTop = textureLoader.load('assets/textures/puck_roughness.webp');

    // Textura para la pared lateral (Escala idéntica a la cara superior y relación 1:1 sin estiramiento)
    // Circunferencia / Diámetro = Pi (~3.1416) y Altura / Diámetro = 0.86 / 2.92 = 0.295
    const albedoSide = textureLoader.load('assets/textures/puck_albedo.webp');
    albedoSide.encoding = THREE.sRGBEncoding;
    albedoSide.wrapS = THREE.RepeatWrapping;
    albedoSide.wrapT = THREE.RepeatWrapping;
    albedoSide.repeat.set(Math.PI, 0.295);

    const normalSide = textureLoader.load('assets/textures/puck_normal.webp');
    normalSide.wrapS = THREE.RepeatWrapping;
    normalSide.wrapT = THREE.RepeatWrapping;
    normalSide.repeat.set(Math.PI, 0.295);

    const roughnessSide = textureLoader.load('assets/textures/puck_roughness.webp');
    roughnessSide.wrapS = THREE.RepeatWrapping;
    roughnessSide.wrapT = THREE.RepeatWrapping;
    roughnessSide.repeat.set(Math.PI, 0.295);

    // Texturas para la mecha de algodón
    const wickAlbedo = textureLoader.load('assets/textures/wick_albedo.webp');
    wickAlbedo.encoding = THREE.sRGBEncoding;
    const wickNormal = textureLoader.load('assets/textures/wick_normal.webp');
    const wickRoughness = textureLoader.load('assets/textures/wick_roughness.webp');

    // 6. Geometría de Cilindro Biselado Artesanal (Pastilla de Aserrín Prensado)
    const R = 1.46;
    const H = 0.86;
    const segRadial = 64;
    const segHeight = 16;

    // Conicidad suave tipo molde artesanal (base ligeramente menor que la corona superior)
    const puckGeo = new THREE.CylinderGeometry(R, R * 0.92, H, segRadial, segHeight);

    // Redondear artesanalmente aristas, relieve orgánico y depresión central
    const pos = puckGeo.attributes.position;
    const norm = puckGeo.attributes.normal;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const r = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x);

      // Redondeo del borde superior
      if (y > H / 2 - 0.14 && r > R - 0.22) {
        const factor = (y - (H / 2 - 0.14)) / 0.14;
        const newX = x - Math.cos(angle) * (factor * 0.10);
        const newZ = z - Math.sin(angle) * (factor * 0.10);
        const newY = y - (factor * factor * 0.05);
        pos.setXYZ(i, newX, newY, newZ);
      }
      // Redondeo del borde inferior
      if (y < -H / 2 + 0.14 && r > R - 0.22) {
        const factor = (-y - (H / 2 - 0.14)) / 0.14;
        const newX = x - Math.cos(angle) * (factor * 0.10);
        const newZ = z - Math.sin(angle) * (factor * 0.10);
        const newY = y + (factor * factor * 0.05);
        pos.setXYZ(i, newX, newY, newZ);
      }

      // Suave depresión artesanal hacia el centro donde se asienta la mecha
      if (y > H / 2 - 0.08 && r < R - 0.25) {
        const centerDip = Math.max(0, 1.0 - (r / (R - 0.25))) * 0.045;
        pos.setY(i, pos.getY(i) - centerDip);
      }

      // Micro-rugosidad artesanal de virutas prensadas
      const n1 = Math.sin(angle * 14.0) * Math.cos(y * 12.0) * 0.007;
      const n2 = Math.cos(angle * 22.0 + y * 9.0) * 0.004;
      const disp = n1 + n2;

      pos.setX(i, pos.getX(i) + norm.getX(i) * disp);
      pos.setY(i, pos.getY(i) + norm.getY(i) * disp);
      pos.setZ(i, pos.getZ(i) + norm.getZ(i) * disp);
    }

    puckGeo.computeVertexNormals();

    // Materiales PBR - Aserrín de madera comprimido artesanal (superficie mate, orgánica y fibrosa)
    const sideMaterial = new THREE.MeshStandardMaterial({
      map: albedoSide,
      normalMap: normalSide,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughnessMap: roughnessSide,
      roughness: 0.90,
      metalness: 0.0
    });

    const topMaterial = new THREE.MeshStandardMaterial({
      map: albedoTop,
      normalMap: normalTop,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughnessMap: roughnessTop,
      roughness: 0.90,
      metalness: 0.0
    });

    const bottomMaterial = topMaterial.clone();

    // Array de materiales: [0: Lateral, 1: Superior, 2: Inferior]
    const puckMaterials = [sideMaterial, topMaterial, bottomMaterial];
    const puckMesh = new THREE.Mesh(puckGeo, puckMaterials);
    puckGroup.add(puckMesh);

    // 7. Mecha de Algodón Trenzado con Curvatura Natural y Punta Tostada
    const wickSegments = 28;
    const wickRadialSegments = 14;
    const wickPoints = [
      new THREE.Vector3(0.02, H / 2 - 0.16, 0.03),
      new THREE.Vector3(0.05, H / 2 + 0.15, 0.06),
      new THREE.Vector3(0.12, H / 2 + 0.40, 0.10),
      new THREE.Vector3(0.20, H / 2 + 0.65, 0.07)
    ];
    const wickCurve = new THREE.CatmullRomCurve3(wickPoints);
    const wickGeo = new THREE.TubeGeometry(wickCurve, wickSegments, 0.085, wickRadialSegments, false);

    // Cerrar y redondear la punta de la mecha para que no sea un tubo hueco
    const wickPos = wickGeo.attributes.position;
    const lastRingStart = wickSegments * (wickRadialSegments + 1);
    const tipEnd = wickPoints[wickPoints.length - 1].clone().add(new THREE.Vector3(0.03, 0.05, -0.01));
    for (let j = 0; j <= wickRadialSegments; j++) {
      const idx = lastRingStart + j;
      if (idx < wickPos.count) {
        wickPos.setXYZ(idx, tipEnd.x, tipEnd.y, tipEnd.z);
      }
    }
    wickGeo.computeVertexNormals();

    const wickMaterial = new THREE.MeshStandardMaterial({
      map: wickAlbedo,
      normalMap: wickNormal,
      normalScale: new THREE.Vector2(1.0, 1.0),
      roughnessMap: wickRoughness,
      roughness: 0.92,
      metalness: 0.0
    });

    const wickMesh = new THREE.Mesh(wickGeo, wickMaterial);
    puckGroup.add(wickMesh);

    // 8. Sombra de Contacto Suave en el Suelo
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    sGrad.addColorStop(0, 'rgba(25, 20, 18, 0.46)');
    sGrad.addColorStop(0.35, 'rgba(32, 24, 20, 0.22)');
    sGrad.addColorStop(0.68, 'rgba(40, 30, 25, 0.05)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(3.4, 3.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -H / 2 - 0.16;
    scene.add(shadowMesh);

    // 9. Control de Rotación 360° Suave y Órbita
    let targetRotX = 0.30;  // Inclinación inicial natural
    let targetRotY = -0.42; // Ángulo inicial dinámico
    let currentRotX = targetRotX;
    let currentRotY = targetRotY;

    let isPointerDown = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let idleTime = 0;

    function onPointerDown(e) {
      isPointerDown = true;
      idleTime = 0;
      velocityX = 0;
      velocityY = 0;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      lastPointerX = clientX;
      lastPointerY = clientY;

      canvas.style.cursor = 'grabbing';
      hintBadge.classList.add('interacting');
    }

    function onPointerMove(e) {
      if (!isPointerDown) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - lastPointerX;
      const deltaY = clientY - lastPointerY;

      lastPointerX = clientX;
      lastPointerY = clientY;

      velocityX = deltaX * 0.0065;
      velocityY = deltaY * 0.0065;

      targetRotY += velocityX;
      targetRotX += velocityY;

      // Limitar pitch vertical para mantener siempre visible el producto
      targetRotX = Math.max(-0.25, Math.min(0.80, targetRotX));

      if (e.cancelable && e.touches) {
        e.preventDefault();
      }
    }

    function onPointerUp() {
      isPointerDown = false;
      canvas.style.cursor = 'grab';
      hintBadge.classList.remove('interacting');
    }

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp, { passive: true });

    canvas.style.cursor = 'grab';

    // 10. Redimensionamiento Responsivo
    function onResize() {
      const newRect = container.getBoundingClientRect();
      width = newRect.width || 540;
      height = newRect.height || 440;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', onResize);

    // 11. Optimización: Pausar Render cuando no esté visible en pantalla
    let isVisible = true;
    let animationFrameId = null;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animationFrameId) {
            animate();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(container);
    }

    // 12. Bucle de Animación a 60 FPS
    let clock = new THREE.Clock();

    function animate() {
      if (!isVisible) {
        animationFrameId = null;
        return;
      }
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      if (!isPointerDown) {
        idleTime += delta;

        if (Math.abs(velocityX) > 0.0001) {
          targetRotY += velocityX;
          velocityX *= 0.92;
        }
        if (Math.abs(velocityY) > 0.0001) {
          targetRotX += velocityY;
          velocityY *= 0.92;
          targetRotX = Math.max(-0.25, Math.min(0.80, targetRotX));
        }

        if (idleTime > 0.8) {
          targetRotY += delta * 0.30;
        }

        // Levitación vertical suave tipo respiración orgánica
        const floatY = Math.sin(time * 1.5) * 0.045;
        puckGroup.position.y = floatY;
        shadowMesh.scale.setScalar(1.0 - floatY * 0.7);
      }

      currentRotX += (targetRotX - currentRotX) * 0.09;
      currentRotY += (targetRotY - currentRotY) * 0.09;

      puckGroup.rotation.x = currentRotX;
      puckGroup.rotation.y = currentRotY;

      renderer.render(scene, camera);
    }

    animate();
  }
})();
