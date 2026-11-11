/**
 * BIOFUEGO — Visor 3D Fotorrealista de la Pastilla Artesanal de Aserrín
 * Basado fielmente en la fotografía real del producto Biofuego
 * 
 * Características Fotorrealistas:
 * - Geometría de molde artesanal tipo muffin/tartaleta (conicidad, estrías verticales y borde irregular)
 * - Cráter central con menisco de cera vegetal solidificada y cristales translúcidos
 * - InstancedMesh de virutas y astillas 3D reales que rompen la silueta y aportan relieve físico
 * - Texturas PBR fotográficas extraídas directamente del producto real (Albedo, Normal, Roughness)
 * - Mecha gruesa de cordón de algodón impregnada en cera natural con punta orgánica cerrada
 * - Iluminación de estudio fotográfico suave y sombra de contacto realista
 * - Interacción 360° táctil y de ratón con inercia física suave
 * - Optimización por IntersectionObserver (0% CPU fuera de vista, 60 FPS estables)
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
    canvas.setAttribute('aria-label', 'Modelo 3D interactivo fotorrealista de la pastilla Biofuego');
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

    // 1. Escena y Cámara con perspectiva idéntica a la fotografía de producto
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(26, width / height, 0.1, 50);
    camera.position.set(0, 0.85, 5.4);
    camera.lookAt(0, -0.04, 0);

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
      renderer.toneMappingExposure = 1.0;
    }

    // 3. Iluminación de Estudio Fotográfico Profesional
    const ambientLight = new THREE.AmbientLight(0xfdfbf7, 0.62);
    scene.add(ambientLight);

    // Luz principal (Key Softbox) desde arriba a la derecha (reproduce las luces del producto real)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(3.4, 4.5, 3.6);
    scene.add(keyLight);

    // Luz de relleno lateral (Fill Softbox) suave y neutra
    const fillLight = new THREE.DirectionalLight(0xf5ebe0, 0.42);
    fillLight.position.set(-3.2, 2.0, 2.2);
    scene.add(fillLight);

    // Luz de contorno neutra suave (Rim Light) para definir el volumen tridimensional
    const rimLight = new THREE.DirectionalLight(0xfff7ec, 0.32);
    rimLight.position.set(-2.4, 3.0, -3.2);
    scene.add(rimLight);

    // Reflejo suave desde el suelo (Tonos madera clara / arena)
    const groundBounce = new THREE.DirectionalLight(0xeee4d8, 0.18);
    groundBounce.position.set(0, -2.5, 1.5);
    scene.add(groundBounce);

    // 4. Grupo 3D Principal de la Pastilla
    const puckGroup = new THREE.Group();
    scene.add(puckGroup);

    // 5. Carga de Texturas PBR de Aserrín Prensado Real
    const textureLoader = new THREE.TextureLoader();

    // Texturas de la cara superior (Mapeo cenital 1:1 sin costuras)
    const albedoTop = textureLoader.load('assets/textures/puck_albedo.webp');
    albedoTop.encoding = THREE.sRGBEncoding;
    const normalTop = textureLoader.load('assets/textures/puck_normal.webp');
    const roughnessTop = textureLoader.load('assets/textures/puck_roughness.webp');

    // Texturas del lateral estriado compactado (Escala 1:1 idéntica a la cara superior)
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

    // Texturas de la mecha de algodón
    const wickAlbedo = textureLoader.load('assets/textures/wick_albedo.webp');
    wickAlbedo.encoding = THREE.sRGBEncoding;
    const wickNormal = textureLoader.load('assets/textures/wick_normal.webp');
    const wickRoughness = textureLoader.load('assets/textures/wick_roughness.webp');

    // 6. Geometría Esculpida Fiel a la Fotografía Real
    // Forma de tartaleta/muffin artesanal con suave conicidad, estrías y cráter central
    const R_top = 1.46;
    const R_bot = 1.18;
    const H = 0.86;
    const segRadial = 80;
    const segHeight = 24;

    const puckGeo = new THREE.CylinderGeometry(R_top, R_bot, H, segRadial, segHeight);
    const pos = puckGeo.attributes.position;
    const norm = puckGeo.attributes.normal;

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      const r = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x);
      const v = (y + H / 2) / H; // 0 = base, 1 = cima

      // A) Ondulaciones suaves del molde artesanal (16 estrías suaves en el cuerpo inferior)
      if (r > 0.35 && v < 0.90) {
        const fluteWeight = Math.pow(1.0 - Math.min(1.0, v * 1.1), 0.8);
        const fluting = Math.sin(angle * 16.0) * 0.016 * fluteWeight;
        const profileBulge = Math.sin(v * Math.PI) * 0.024;
        const deltaR = fluting + profileBulge;
        x += Math.cos(angle) * deltaR;
        z += Math.sin(angle) * deltaR;
      }

      // B) Borde superior redondeado con micro-irregularidades orgánicas
      if (y > H / 2 - 0.15 && r > R_top - 0.24) {
        const factor = (y - (H / 2 - 0.15)) / 0.15;
        const rimNoise = (Math.sin(angle * 14.0) * 0.012 + Math.cos(angle * 28.0) * 0.008);
        x -= Math.cos(angle) * (factor * 0.09 - rimNoise);
        z -= Math.sin(angle) * (factor * 0.09 - rimNoise);
        y -= (factor * factor * 0.045);
      }

      // C) Borde inferior redondeado
      if (y < -H / 2 + 0.14 && r > R_bot - 0.22) {
        const factor = (-y - (H / 2 - 0.14)) / 0.14;
        x -= Math.cos(angle) * (factor * 0.09);
        z -= Math.sin(angle) * (factor * 0.09);
        y += (factor * factor * 0.045);
      }

      // D) Cara superior: suave depresión central y relieve de virutas prensadas
      if (y > H / 2 - 0.10) {
        const crater = Math.max(0, 1.0 - (r / 0.88));
        const craterDepth = Math.pow(crater, 1.6) * 0.048;

        const clump1 = Math.sin(x * 14.0 + z * 9.0) * Math.cos(z * 13.0 - x * 7.0) * 0.010;
        const clump2 = Math.cos(x * 28.0 - z * 22.0) * 0.006;

        y += clump1 + clump2 - craterDepth;
      }

      // E) Micro-rugosidad de virutas en los laterales
      if (v < 0.92 && v > 0.08) {
        const sideNoise = (Math.sin(angle * 22.0 + y * 14.0) * 0.004 + Math.cos(angle * 44.0 - y * 24.0) * 0.002);
        x += norm.getX(i) * sideNoise;
        z += norm.getZ(i) * sideNoise;
      }

      pos.setXYZ(i, x, y, z);
    }

    puckGeo.computeVertexNormals();

    // Materiales PBR
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

    const bottomMaterial = sideMaterial.clone();

    // [0: Lateral estriado, 1: Cara superior con virutas, 2: Base]
    const puckMesh = new THREE.Mesh(puckGeo, [sideMaterial, topMaterial, bottomMaterial]);
    puckGroup.add(puckMesh);

    // 7. InstancedMesh de Virutas y Astillas 3D Reales (Profundidad Geométrica Física)
    // Función matemática para fijar cada viruta exactamente sobre el relieve de la superficie
    function getTopSurfaceY(r, x, z) {
      let y = H / 2;
      if (r > R_top - 0.24) {
        const factor = (r - (R_top - 0.24)) / 0.24;
        y -= factor * factor * 0.045;
      }
      const crater = Math.max(0, 1.0 - (r / 0.88));
      const craterDepth = Math.pow(crater, 1.6) * 0.048;
      const clump1 = Math.sin(x * 14.0 + z * 9.0) * Math.cos(z * 13.0 - x * 7.0) * 0.010;
      const clump2 = Math.cos(x * 28.0 - z * 22.0) * 0.006;
      return y - craterDepth + clump1 + clump2;
    }

    const chipCount = 180;
    const chipGeo = new THREE.PlaneGeometry(0.026, 0.075, 2, 2);
    chipGeo.rotateX(-Math.PI / 2); // Hacerlas horizontales paralelas a la superficie
    const cPos = chipGeo.attributes.position;
    for (let k = 0; k < cPos.count; k++) {
      const cx = cPos.getX(k);
      const cz = cPos.getZ(k);
      // Curvatura sutil de astilla de madera
      cPos.setY(k, (cx * cx * 2.0 + cz * cz * 1.5) * 0.015);
    }
    chipGeo.computeVertexNormals();

    const chipMat = new THREE.MeshStandardMaterial({
      map: albedoTop,
      roughness: 0.90,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    const chipsMesh = new THREE.InstancedMesh(chipGeo, chipMat, chipCount);
    const dummy = new THREE.Object3D();
    const chipColors = [
      new THREE.Color(0xd2b48c), // Rubio pino natural
      new THREE.Color(0xc4996b), // Cedro tostado cálido
      new THREE.Color(0xdfc8a5), // Fibra de madera clara
      new THREE.Color(0xb38250), // Hendidura tostada
      new THREE.Color(0xe6dac5)  // Viruta con velo de cera
    ];

    // Distribución orgánica sobre la superficie superior y borde
    for (let j = 0; j < chipCount; j++) {
      let rInst, angleInst;
      if (j > 130) {
        // En la corona perimetral (dentro del borde superior, perfectamente integrada)
        angleInst = Math.random() * Math.PI * 2.0;
        rInst = R_top - 0.22 + Math.random() * 0.16;
      } else {
        // En el cuerpo de la cara superior
        angleInst = Math.random() * Math.PI * 2.0;
        rInst = 0.22 + Math.sqrt(Math.random()) * (R_top - 0.44);
      }

      const xInst = Math.cos(angleInst) * rInst;
      const zInst = Math.sin(angleInst) * rInst;
      // Posición Y exacta en la superficie del aserrín
      const yInst = getTopSurfaceY(rInst, xInst, zInst) + 0.002;

      dummy.position.set(xInst, yInst, zInst);

      // Inclinación sutil casi plana
      const pitch = (Math.random() - 0.5) * 0.14;
      const roll = (Math.random() - 0.5) * 0.14;
      const yaw = Math.random() * Math.PI * 2.0;
      dummy.rotation.set(pitch, yaw, roll);

      // Escala variable
      const scaleRand = 0.65 + Math.random() * 0.55;
      dummy.scale.set(scaleRand, 1.0, scaleRand * (0.8 + Math.random() * 0.4));
      dummy.updateMatrix();

      chipsMesh.setMatrixAt(j, dummy.matrix);
      const chosenColor = chipColors[Math.floor(Math.random() * chipColors.length)];
      chipsMesh.setColorAt(j, chosenColor);
    }
    chipsMesh.instanceMatrix.needsUpdate = true;
    if (chipsMesh.instanceColor) chipsMesh.instanceColor.needsUpdate = true;
    puckGroup.add(chipsMesh);

    // 8. Cera vegetal translúcida impregnada en el fondo del cráter
    const waxPoolGeo = new THREE.CylinderGeometry(0.30, 0.36, 0.015, 24);
    const wpPos = waxPoolGeo.attributes.position;
    for (let i = 0; i < wpPos.count; i++) {
      const ang = Math.atan2(wpPos.getZ(i), wpPos.getX(i));
      const rMod = 1.0 + Math.sin(ang * 5.0) * 0.10 + Math.cos(ang * 7.0) * 0.06;
      wpPos.setX(i, wpPos.getX(i) * rMod);
      wpPos.setZ(i, wpPos.getZ(i) * rMod);
    }
    waxPoolGeo.computeVertexNormals();

    const waxPoolMat = new THREE.MeshStandardMaterial({
      color: 0xdec6a2, // Tono ámbar/miel vegetal suave de la cera fundida en aserrín
      roughness: 0.35,
      metalness: 0.0,
      transparent: true,
      opacity: 0.42
    });
    const waxPool = new THREE.Mesh(waxPoolGeo, waxPoolMat);
    waxPool.position.set(0.01, H / 2 - 0.046, 0.02);
    puckGroup.add(waxPool);

    // 9. Mecha Artesanal de Algodón Grueso Impregnada en Cera
    const wickSegments = 24;
    const wickRadialSegments = 16;
    const wickPoints = [
      new THREE.Vector3(0.01, H / 2 - 0.15, 0.02),
      new THREE.Vector3(0.03, H / 2 + 0.12, 0.04),
      new THREE.Vector3(0.06, H / 2 + 0.32, 0.06),
      new THREE.Vector3(0.09, H / 2 + 0.50, 0.05),
      new THREE.Vector3(0.10, H / 2 + 0.56, 0.04)
    ];
    const wickCurve = new THREE.CatmullRomCurve3(wickPoints);
    const wickGeo = new THREE.TubeGeometry(wickCurve, wickSegments, 0.082, wickRadialSegments, false);

    // Redondear suavemente el domo de la punta de la mecha
    const wickPos = wickGeo.attributes.position;
    const lastRingStart = wickSegments * (wickRadialSegments + 1);
    const tipEnd = wickPoints[wickPoints.length - 1].clone().add(new THREE.Vector3(0.01, 0.03, -0.005));
    for (let j = 0; j <= wickRadialSegments; j++) {
      const idx = lastRingStart + j;
      if (idx < wickPos.count) {
        const origX = wickPos.getX(idx);
        const origZ = wickPos.getZ(idx);
        wickPos.setXYZ(
          idx,
          origX * 0.35 + tipEnd.x * 0.65,
          tipEnd.y + 0.01,
          origZ * 0.35 + tipEnd.z * 0.65
        );
      }
    }
    wickGeo.computeVertexNormals();

    const wickMaterial = new THREE.MeshStandardMaterial({
      map: wickAlbedo,
      normalMap: wickNormal,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughnessMap: wickRoughness,
      roughness: 0.62,
      metalness: 0.0
    });

    const wickMesh = new THREE.Mesh(wickGeo, wickMaterial);
    puckGroup.add(wickMesh);

    // 10. Sombra de Contacto Suave en el Suelo
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    sGrad.addColorStop(0, 'rgba(28, 22, 18, 0.44)');
    sGrad.addColorStop(0.35, 'rgba(35, 26, 21, 0.20)');
    sGrad.addColorStop(0.68, 'rgba(42, 32, 26, 0.04)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -H / 2 - 0.16;
    scene.add(shadowMesh);

    // 11. Control de Rotación 360° Suave y Perspectiva
    // Inclinación inicial idéntica a la fotografía real (38° pitch, ángulo dinámico natural)
    let targetRotX = 0.38;
    let targetRotY = -0.35;
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

    // 12. Redimensionamiento Responsivo
    function onResize() {
      const newRect = container.getBoundingClientRect();
      width = newRect.width || 540;
      height = newRect.height || 440;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', onResize);

    // 13. Optimización: Pausar Render cuando no esté visible en pantalla
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

    // 14. Bucle de Animación a 60 FPS
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
          targetRotY += delta * 0.28;
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
