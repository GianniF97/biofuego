/**
 * BIOFUEGO — Visor 3D Fotorrealista de la Pastilla Artesanal de Aserrín
 * Reproducción 3D exacta basada en la fotografía real del producto (puck-hero.png)
 *
 * Características:
 * - Malla paramétrica multicapa de alta densidad (144 segmentos radiales x 97 anillos)
 * - Desplazamiento 3D real en tiempo de carga extraído directamente de los píxeles de la fotografía
 *   para que cada astilla de madera, hendidura y cristal de cera tenga relieve geométrico real
 * - Perfil cónico exacto tipo molde de muffin/tartaleta (R_top = 1.52, R_bot = 0.98) con 11 lóbulos suaves
 * - Texturas PBR desproyectadas de la fotografía real con escala isotrópica 1:1 en cara superior y pared lateral (3x repeat)
 * - Mecha esculpida con radio variable, base acampanada en el cráter de cera, nudo orgánico lateral y punta redondeada
 * - Interacción 360° con ratón y pantallas táctiles a 60 FPS
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

    const pictureEl = container.querySelector('picture');
    if (pictureEl) {
      pictureEl.style.display = 'none';
    }

    const canvas = document.createElement('canvas');
    canvas.id = 'heroPuckCanvas';
    canvas.className = 'hero-puck-canvas';
    canvas.setAttribute('aria-label', 'Modelo 3D interactivo fotorrealista de la pastilla Biofuego');
    canvas.setAttribute('role', 'img');

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

    const rect = container.getBoundingClientRect();
    let width = rect.width || 540;
    let height = rect.height || 440;

    // 1. Escena y Cámara con el encuadre exacto de la fotografía real
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(27, width / height, 0.1, 50);
    camera.position.set(0, 0.58, 4.92);
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
      renderer.toneMappingExposure = 1.00;
    }

    // 3. Iluminación de Estudio Calibrada para Preservar el Tono Fotográfico Real
    const ambientLight = new THREE.AmbientLight(0xfffcf8, 0.78);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.52);
    keyLight.position.set(2.4, 4.2, 3.8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfaf3eb, 0.34);
    fillLight.position.set(-3.0, 1.6, 3.2);
    scene.add(fillLight);

    const frontCupLight = new THREE.DirectionalLight(0xfff9f2, 0.36);
    frontCupLight.position.set(0.3, -0.8, 4.5);
    scene.add(frontCupLight);

    const rimLight = new THREE.DirectionalLight(0xfff8ee, 0.22);
    rimLight.position.set(0.0, 2.6, -3.5);
    scene.add(rimLight);

    const groundBounce = new THREE.DirectionalLight(0xf0e6da, 0.28);
    groundBounce.position.set(0, -3.2, 2.0);
    scene.add(groundBounce);

    // 4. Grupo 3D Principal
    const puckGroup = new THREE.Group();
    scene.add(puckGroup);

    // 5. Texturas PBR Fotográficas Reales
    const textureLoader = new THREE.TextureLoader();

    const normalTop = textureLoader.load('assets/textures/puck_normal.webp');
    const roughnessTop = textureLoader.load('assets/textures/puck_roughness.webp');

    const albedoSide = textureLoader.load('assets/textures/puck_side_albedo.webp');
    albedoSide.encoding = THREE.sRGBEncoding;
    albedoSide.wrapS = THREE.RepeatWrapping;
    albedoSide.wrapT = THREE.ClampToEdgeWrapping;

    const normalSide = textureLoader.load('assets/textures/puck_side_normal.webp');
    normalSide.wrapS = THREE.RepeatWrapping;
    normalSide.wrapT = THREE.ClampToEdgeWrapping;

    const roughnessSide = textureLoader.load('assets/textures/puck_side_roughness.webp');
    roughnessSide.wrapS = THREE.RepeatWrapping;
    roughnessSide.wrapT = THREE.ClampToEdgeWrapping;

    const wickAlbedo = textureLoader.load('assets/textures/wick_albedo.webp');
    wickAlbedo.encoding = THREE.sRGBEncoding;
    wickAlbedo.wrapS = THREE.ClampToEdgeWrapping;
    wickAlbedo.wrapT = THREE.RepeatWrapping;

    const wickNormal = textureLoader.load('assets/textures/wick_normal.webp');
    wickNormal.wrapS = THREE.ClampToEdgeWrapping;
    wickNormal.wrapT = THREE.RepeatWrapping;

    const wickRoughness = textureLoader.load('assets/textures/wick_roughness.webp');
    wickRoughness.wrapS = THREE.ClampToEdgeWrapping;
    wickRoughness.wrapT = THREE.RepeatWrapping;

    // 6. Construcción de la Geometría Multicapa con Escala UV 1:1 en Cara Superior y Pared Lateral
    const R_top = 1.52;
    const R_bot = 0.98;
    const H_top = 0.44;
    const H_rim = 0.36;
    const H_bot = -0.44;
    const UV_RAD_MAX = 0.428; // Mantiene el muestreo dentro de r <= 0.85 de puck_albedo.webp (cero estiramiento radial)
    const SIDE_U_REPEATS = 3.0; // Escala física 1:1 exacta (circunferencia ~8.5 : altura 0.80)

    const radialSegs = 144;
    const topRings = 52;
    const sideRings = 36;
    const botRings = 8;
    const totalRings = topRings + 1 + sideRings + botRings;

    function chipNoise(angle, r) {
      return (
        Math.sin(angle * 13.0 + r * 10.0) * 0.40 +
        Math.cos(angle * 23.0 - r * 16.0) * 0.35 +
        Math.sin(angle * 37.0 + r * 24.0) * 0.25
      );
    }

    function rimContour(angle) {
      return (
        Math.sin(angle * 7.0) * 0.022 +
        Math.cos(angle * 13.0 + 0.8) * 0.018 +
        Math.sin(angle * 21.0 + 1.7) * 0.012 +
        Math.cos(angle * 31.0) * 0.008
      );
    }

    const puckGeo = new THREE.BufferGeometry();
    const stride = radialSegs + 1;
    const vertexCount = (totalRings + 1) * stride;

    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const baseCoords = new Float32Array(vertexCount * 3);

    let vIdx = 0;
    let uvIdx = 0;
    let bIdx = 0;

    const sideStartRing = topRings + 1;
    const botStartRing = sideStartRing + sideRings;

    for (let j = 0; j <= totalRings; j++) {
      for (let i = 0; i <= radialSegs; i++) {
        const uSeg = i / radialSegs;
        const angle = uSeg * Math.PI * 2.0;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        let x = 0, y = 0, z = 0;
        let u = 0.5, v = 0.5;
        let ringType = 0;
        let param = 0;

        if (j <= topRings) {
          // CARA SUPERIOR DE ASTILLAS PRENSADAS (j = 0 .. topRings)
          ringType = 0;
          const rNorm = j / topRings;
          param = rNorm;

          const rimIrr = Math.pow(rNorm, 2.0) * rimContour(angle);
          const r = rNorm * R_top + rimIrr;
          x = cosA * r;
          z = sinA * r;

          const crater = Math.max(0.0, 1.0 - (rNorm / 0.40));
          const craterDepth = Math.pow(crater, 1.7) * 0.048;
          const rimBevel = rNorm > 0.80 ? Math.pow((rNorm - 0.80) / 0.20, 1.85) * (H_top - H_rim) : 0.0;
          const microRelief = chipNoise(angle, rNorm * 3.0) * 0.018 * Math.sin(rNorm * Math.PI);

          y = H_top - craterDepth - rimBevel + microRelief;

          const uvRadius = UV_RAD_MAX * rNorm;
          u = 0.5 + cosA * uvRadius;
          v = 0.5 - sinA * uvRadius;

        } else if (j <= botStartRing) {
          // PARED LATERAL CÓNICA CON HOMBRO DE ASTILLAS Y BASE ENCERADA (j = sideStartRing .. botStartRing)
          ringType = 1;
          const sNorm = (j - sideStartRing) / sideRings; // 0 en H_rim, 1 en H_bot
          param = sNorm;

          const rProfile = R_top * (1.0 - sNorm) + R_bot * sNorm + Math.sin(sNorm * Math.PI) * 0.052;
          const lobes = (
            Math.cos(angle * 11.0) * 0.028 +
            Math.sin(angle * 5.0 + 1.2) * 0.018 +
            Math.cos(angle * 22.0) * 0.008
          ) * Math.sin(sNorm * Math.PI * 0.92);

          const rimBlend = Math.pow(1.0 - sNorm, 2.0) * rimContour(angle);
          const r = rProfile + lobes + rimBlend;
          x = cosA * r;
          z = sinA * r;

          const bottomWave = Math.cos(angle * 7.0 + 0.5) * 0.020 * Math.pow(sNorm, 2.0);
          y = H_rim * (1.0 - sNorm) + (H_bot + 0.038) * sNorm + bottomWave;

          // 3 repeticiones sin costura alrededor del perímetro para escala 1:1 de fibras y cristales de cera
          u = uSeg * SIDE_U_REPEATS;
          v = 1.0 - sNorm;

        } else {
          // BASE INFERIOR CERRADA
          ringType = 2;
          const bNorm = 1.0 - ((j - botStartRing) / botRings);
          param = bNorm;
          const r = bNorm * R_bot;
          x = cosA * r;
          z = sinA * r;
          y = H_bot + 0.038 * bNorm * bNorm;
          u = uSeg * SIDE_U_REPEATS;
          v = 0.02;
        }

        positions[vIdx++] = x;
        positions[vIdx++] = y;
        positions[vIdx++] = z;

        uvs[uvIdx++] = u;
        uvs[uvIdx++] = v;

        baseCoords[bIdx++] = param;
        baseCoords[bIdx++] = angle;
        baseCoords[bIdx++] = ringType;
      }
    }

    const indices = [];

    for (let j = 0; j < topRings; j++) {
      for (let i = 0; i < radialSegs; i++) {
        const a = j * stride + i;
        const b = (j + 1) * stride + i;
        const c = (j + 1) * stride + (i + 1);
        const d = j * stride + (i + 1);
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }
    const topIndexCount = indices.length;

    for (let j = sideStartRing; j < totalRings; j++) {
      for (let i = 0; i < radialSegs; i++) {
        const a = j * stride + i;
        const b = (j + 1) * stride + i;
        const c = (j + 1) * stride + (i + 1);
        const d = j * stride + (i + 1);
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }
    const sideIndexCount = indices.length - topIndexCount;

    puckGeo.setIndex(indices);
    puckGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    puckGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    puckGeo.addGroup(0, topIndexCount, 0);
    puckGeo.addGroup(topIndexCount, sideIndexCount, 1);
    puckGeo.computeVertexNormals();

    // Desplazamiento 3D en tiempo de carga basado en la luminancia real de puck_albedo.webp
    const albedoTop = textureLoader.load('assets/textures/puck_albedo.webp', function (tex) {
      try {
        const img = tex.image;
        const offCanvas = document.createElement('canvas');
        const cw = 256, ch = 256;
        offCanvas.width = cw;
        offCanvas.height = ch;
        const ctx = offCanvas.getContext('2d');
        ctx.filter = 'blur(2.2px)';
        ctx.drawImage(img, 0, 0, cw, ch);
        const imgData = ctx.getImageData(0, 0, cw, ch).data;

        const posAttr = puckGeo.attributes.position;

        for (let k = 0; k < vertexCount; k++) {
          const rType = baseCoords[k * 3 + 2];
          const param = baseCoords[k * 3];
          const ang = baseCoords[k * 3 + 1];

          if (rType === 0) {
            const rN = param;
            const uvRad = UV_RAD_MAX * rN;
            const uVal = 0.5 + Math.cos(ang) * uvRad;
            const vVal = 0.5 - Math.sin(ang) * uvRad;

            const px = Math.max(0, Math.min(cw - 1, Math.floor(uVal * cw)));
            const py = Math.max(0, Math.min(ch - 1, Math.floor((1.0 - vVal) * ch)));
            const pIdx = (py * cw + px) * 4;

            const lum = (imgData[pIdx] * 0.299 + imgData[pIdx + 1] * 0.587 + imgData[pIdx + 2] * 0.114) / 255.0;
            const heightOffset = (lum - 0.48) * 0.052 * Math.min(1.0, rN * 3.0);
            posAttr.setY(k, posAttr.getY(k) + heightOffset);

            if (rN > 0.75) {
              const radialPush = (lum - 0.46) * 0.024 * ((rN - 0.75) / 0.25);
              posAttr.setX(k, posAttr.getX(k) + Math.cos(ang) * radialPush);
              posAttr.setZ(k, posAttr.getZ(k) + Math.sin(ang) * radialPush);
            }
          } else if (rType === 1 && param < 0.24) {
            const blend = 1.0 - (param / 0.24);
            const uVal = 0.5 + Math.cos(ang) * UV_RAD_MAX;
            const vVal = 0.5 - Math.sin(ang) * UV_RAD_MAX;

            const px = Math.max(0, Math.min(cw - 1, Math.floor(uVal * cw)));
            const py = Math.max(0, Math.min(ch - 1, Math.floor((1.0 - vVal) * ch)));
            const pIdx = (py * cw + px) * 4;

            const lum = (imgData[pIdx] * 0.299 + imgData[pIdx + 1] * 0.587 + imgData[pIdx + 2] * 0.114) / 255.0;
            const heightOffset = (lum - 0.48) * 0.052 * blend;
            const radialPush = (lum - 0.46) * 0.024 * blend;

            posAttr.setY(k, posAttr.getY(k) + heightOffset);
            posAttr.setX(k, posAttr.getX(k) + Math.cos(ang) * radialPush);
            posAttr.setZ(k, posAttr.getZ(k) + Math.sin(ang) * radialPush);
          }
        }
        posAttr.needsUpdate = true;
        puckGeo.computeVertexNormals();
      } catch (err) {
        console.warn('Biofuego 3D: No se pudo extraer mapa de desplazamiento en canvas.', err);
      }
    });
    albedoTop.encoding = THREE.sRGBEncoding;

    // Materiales PBR Fotográficos
    const topMaterial = new THREE.MeshStandardMaterial({
      map: albedoTop,
      normalMap: normalTop,
      normalScale: new THREE.Vector2(1.50, 1.50),
      roughnessMap: roughnessTop,
      roughness: 0.85,
      metalness: 0.0
    });

    const sideMaterial = new THREE.MeshStandardMaterial({
      map: albedoSide,
      normalMap: normalSide,
      normalScale: new THREE.Vector2(1.35, 1.35),
      roughnessMap: roughnessSide,
      roughness: 0.76,
      metalness: 0.0
    });

    const puckMesh = new THREE.Mesh(puckGeo, [topMaterial, sideMaterial]);
    puckGroup.add(puckMesh);

    // 7. Mecha Esculpida Fiel a la Fotografía (Con base acampanada en cera, nudo lateral e inclinación real)
    const wickHeightSegs = 32;
    const wickRadSegs = 24;
    const wickGeo = new THREE.BufferGeometry();
    const wStride = wickRadSegs + 1;
    const wVertCount = (wickHeightSegs + 1) * wStride;
    const wPositions = new Float32Array(wVertCount * 3);
    const wUvs = new Float32Array(wVertCount * 2);

    let wvIdx = 0;
    let wuvIdx = 0;

    for (let j = 0; j <= wickHeightSegs; j++) {
      const t = j / wickHeightSegs;

      const spineX = 0.01 + Math.pow(t, 1.35) * 0.16;
      const spineY = (H_top - 0.058) + t * 0.64;
      const spineZ = -0.02 - Math.sin(t * Math.PI) * 0.02;

      let rad = 0.112 * (1.0 - t * 0.34);
      if (t < 0.18) {
        const flare = (0.18 - t) / 0.18;
        rad += flare * flare * 0.075;
      } else if (t > 0.86) {
        const tipT = (t - 0.86) / 0.14;
        rad *= Math.sqrt(Math.max(0.0, 1.0 - tipT * tipT));
      }

      for (let i = 0; i <= wickRadSegs; i++) {
        const uW = i / wickRadSegs;
        const theta = uW * Math.PI * 2.0;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const knotDist = Math.abs(t - 0.52);
        const leftLump = (knotDist < 0.22 && cosT < 0)
          ? Math.pow(1.0 - knotDist / 0.22, 2.0) * Math.pow(-cosT, 1.5) * 0.036
          : 0.0;

        const fiberBump = (Math.sin(theta * 5.0 + t * 14.0) * 0.005 + Math.cos(theta * 3.0 - t * 9.0) * 0.004) * (1.0 - Math.pow(t, 4.0));
        const localR = Math.max(0.0, rad + leftLump + fiberBump);

        wPositions[wvIdx++] = spineX + cosT * localR;
        wPositions[wvIdx++] = spineY;
        wPositions[wvIdx++] = spineZ + sinT * localR;

        wUvs[wuvIdx++] = t;
        wUvs[wuvIdx++] = 0.5 + uW;
      }
    }

    const wIndices = [];
    for (let j = 0; j < wickHeightSegs; j++) {
      for (let i = 0; i < wickRadSegs; i++) {
        const a = j * wStride + i;
        const b = (j + 1) * wStride + i;
        const c = (j + 1) * wStride + (i + 1);
        const d = j * wStride + (i + 1);
        wIndices.push(a, b, d);
        wIndices.push(b, c, d);
      }
    }

    wickGeo.setIndex(wIndices);
    wickGeo.setAttribute('position', new THREE.BufferAttribute(wPositions, 3));
    wickGeo.setAttribute('uv', new THREE.BufferAttribute(wUvs, 2));
    wickGeo.computeVertexNormals();

    const wickMaterial = new THREE.MeshStandardMaterial({
      map: wickAlbedo,
      normalMap: wickNormal,
      normalScale: new THREE.Vector2(1.0, 1.0),
      roughnessMap: wickRoughness,
      roughness: 0.56,
      metalness: 0.0
    });

    const wickMesh = new THREE.Mesh(wickGeo, wickMaterial);
    puckGroup.add(wickMesh);

    // 8. Sombra de Contacto Suave en el Suelo
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 120);
    sGrad.addColorStop(0, 'rgba(28, 20, 15, 0.52)');
    sGrad.addColorStop(0.38, 'rgba(35, 25, 19, 0.24)');
    sGrad.addColorStop(0.72, 'rgba(42, 30, 24, 0.05)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = H_bot - 0.13;
    scene.add(shadowMesh);

    // 9. Ángulo Inicial Alineado Exactamente con la Fotografía de Referencia
    let targetRotX = 0.34;
    let targetRotY = 0.0;
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

      targetRotX = Math.max(-0.20, Math.min(0.85, targetRotX));

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

    // 11. Optimización por IntersectionObserver
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
    const clock = new THREE.Clock();

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
          targetRotX = Math.max(-0.20, Math.min(0.85, targetRotX));
        }

        if (idleTime > 1.8) {
          targetRotY += delta * 0.24;
        }

        const floatY = Math.sin(time * 1.5) * 0.035;
        puckGroup.position.y = floatY;
        shadowMesh.scale.setScalar(1.0 - floatY * 0.65);
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
