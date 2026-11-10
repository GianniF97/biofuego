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
      renderer.toneMappingExposure = 1.05;
    }

    // 3. Iluminación Cálida y Equilibrada de Estudio (Tonos Madera, Resina & Fuego)
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.52);
    scene.add(ambientLight);

    // Luz principal (Key Light) desde arriba a la derecha
    const keyLight = new THREE.DirectionalLight(0xfffaf0, 1.10);
    keyLight.position.set(3.2, 4.0, 3.5);
    scene.add(keyLight);

    // Luz de relleno lateral (Madera cálida)
    const fillLight = new THREE.DirectionalLight(0xffcfa0, 0.42);
    fillLight.position.set(-3.2, 1.5, 2.2);
    scene.add(fillLight);

    // Luz de contorno Biofuego (Naranja fuego en el borde)
    const rimLight = new THREE.DirectionalLight(0xf15625, 1.35);
    rimLight.position.set(-2.6, 2.6, -3.2);
    scene.add(rimLight);

    // Reflejo cálido desde abajo
    const groundBounce = new THREE.DirectionalLight(0xff8833, 0.30);
    groundBounce.position.set(0, -2.5, 1.5);
    scene.add(groundBounce);

    // 4. Grupo 3D de la Pastilla
    const puckGroup = new THREE.Group();
    scene.add(puckGroup);

    // 5. Carga de Texturas PBR con Mapeos Separados para Caras y Lateral
    const textureLoader = new THREE.TextureLoader();

    // Textura para la cara superior e inferior (1:1 cenital)
    const albedoTop = textureLoader.load('assets/textures/puck_albedo.webp');
    albedoTop.encoding = THREE.sRGBEncoding;
    const normalTop = textureLoader.load('assets/textures/puck_normal.webp');
    const roughnessTop = textureLoader.load('assets/textures/puck_roughness.webp');

    // Textura para la pared lateral (4 repeticiones continuas alrededor del cilindro)
    const albedoSide = textureLoader.load('assets/textures/puck_albedo.webp');
    albedoSide.encoding = THREE.sRGBEncoding;
    albedoSide.wrapS = THREE.RepeatWrapping;
    albedoSide.wrapT = THREE.RepeatWrapping;
    albedoSide.repeat.set(4.0, 1.0);

    const normalSide = textureLoader.load('assets/textures/puck_normal.webp');
    normalSide.wrapS = THREE.RepeatWrapping;
    normalSide.wrapT = THREE.RepeatWrapping;
    normalSide.repeat.set(4.0, 1.0);

    const roughnessSide = textureLoader.load('assets/textures/puck_roughness.webp');
    roughnessSide.wrapS = THREE.RepeatWrapping;
    roughnessSide.wrapT = THREE.RepeatWrapping;
    roughnessSide.repeat.set(4.0, 1.0);

    // Textura para la mecha
    const wickAlbedo = textureLoader.load('assets/textures/wick_albedo.webp');
    wickAlbedo.encoding = THREE.sRGBEncoding;
    const wickNormal = textureLoader.load('assets/textures/wick_normal.webp');

    // 6. Geometría de Cilindro Biselado (Pastilla de Aserrín Prensado)
    const R = 1.46;
    const H = 0.86;
    const segRadial = 64;
    const segHeight = 16;

    const puckGeo = new THREE.CylinderGeometry(R, R * 0.98, H, segRadial, segHeight);

    // Redondear suavemente las aristas superior e inferior (Bisel artesanal continuo)
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

      // Micro-rugosidad artesanal de virutas prensadas
      const n1 = Math.sin(angle * 14.0) * Math.cos(y * 12.0) * 0.008;
      const n2 = Math.cos(angle * 22.0 + y * 9.0) * 0.005;
      const disp = n1 + n2;

      pos.setX(i, pos.getX(i) + norm.getX(i) * disp);
      pos.setY(i, pos.getY(i) + norm.getY(i) * disp);
      pos.setZ(i, pos.getZ(i) + norm.getZ(i) * disp);
    }

    puckGeo.computeVertexNormals();

    // Materiales PBR con fino barniz de cera ecológica
    const sideMaterial = new THREE.MeshPhysicalMaterial({
      map: albedoSide,
      normalMap: normalSide,
      normalScale: new THREE.Vector2(1.7, 1.7),
      roughnessMap: roughnessSide,
      roughness: 0.65,
      metalness: 0.0,
      clearcoat: 0.28,
      clearcoatRoughness: 0.35,
      reflectivity: 0.42
    });

    const topMaterial = new THREE.MeshPhysicalMaterial({
      map: albedoTop,
      normalMap: normalTop,
      normalScale: new THREE.Vector2(1.7, 1.7),
      roughnessMap: roughnessTop,
      roughness: 0.65,
      metalness: 0.0,
      clearcoat: 0.28,
      clearcoatRoughness: 0.35,
      reflectivity: 0.42
    });

    const bottomMaterial = topMaterial.clone();

    // Array de materiales: [0: Lateral, 1: Superior, 2: Inferior]
    const puckMaterials = [sideMaterial, topMaterial, bottomMaterial];
    const puckMesh = new THREE.Mesh(puckGeo, puckMaterials);
    puckGroup.add(puckMesh);

    // 7. Mecha de Algodón Trenzado con Curvatura Natural y Punta Tostada
    const wickPoints = [
      new THREE.Vector3(0.02, H / 2 - 0.03, 0.03),
      new THREE.Vector3(0.06, H / 2 + 0.22, 0.07),
      new THREE.Vector3(0.14, H / 2 + 0.46, 0.11),
      new THREE.Vector3(0.22, H / 2 + 0.70, 0.08)
    ];
    const wickCurve = new THREE.CatmullRomCurve3(wickPoints);
    const wickGeo = new THREE.TubeGeometry(wickCurve, 28, 0.080, 14, false);

    const wickMaterial = new THREE.MeshStandardMaterial({
      map: wickAlbedo,
      normalMap: wickNormal,
      normalScale: new THREE.Vector2(1.3, 1.3),
      roughness: 0.82,
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
