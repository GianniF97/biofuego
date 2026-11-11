/**
 * BIOFUEGO — Sistema de Gestión de Consentimiento de Cookies y Privacidad
 * Cumplimiento Ley 25.326 (Argentina) y estándares internacionales de privacidad.
 * Ligero, accesible (WAI-ARIA), sin dependencias externas y sin patrones oscuros.
 */

(function () {
  'use strict';

  const CONSENT_STORAGE_KEY = 'biofuego_cookie_consent';
  const CONSENT_COOKIE_NAME = 'biofuego_cookie_consent';
  const PREF_CALC_KEY = 'biofuego_calc_packs';
  const CONSENT_VERSION = '1.0';
  const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 días

  /**
   * Lee el consentimiento guardado en localStorage o cookie técnica.
   */
  function getStoredConsent() {
    try {
      const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === CONSENT_VERSION && typeof parsed.necessary === 'boolean') {
          return parsed;
        }
      }
    } catch (e) {
      // Ignorar errores de acceso a localStorage en modo privado restringido
    }

    // Fallback: verificar cookie técnica de primera parte
    try {
      const match = document.cookie.match(new RegExp('(?:^|; )' + CONSENT_COOKIE_NAME + '=([^;]*)'));
      if (match && match[1]) {
        const decoded = JSON.parse(decodeURIComponent(match[1]));
        if (decoded && decoded.version === CONSENT_VERSION) {
          return decoded;
        }
      }
    } catch (e) {
      // Ignorar errores de parseo
    }

    return null;
  }

  /**
   * Persiste la decisión del usuario en localStorage y cookie técnica de primera parte.
   */
  function persistConsent(preferences) {
    const payload = {
      version: CONSENT_VERSION,
      necessary: true,
      preferences: Boolean(preferences.preferences),
      analytics: Boolean(preferences.analytics),
      marketing: Boolean(preferences.marketing),
      updatedAt: new Date().toISOString()
    };

    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // Continuar con cookie si localStorage no está disponible
    }

    try {
      const cookieVal = encodeURIComponent(JSON.stringify({
        version: payload.version,
        necessary: true,
        preferences: payload.preferences,
        analytics: payload.analytics,
        marketing: payload.marketing
      }));
      const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${CONSENT_COOKIE_NAME}=${cookieVal}; max-age=${CONSENT_MAX_AGE_SECONDS}; path=/; SameSite=Lax${secureFlag}`;
    } catch (e) {
      // Ignorar si cookies están bloqueadas por el navegador
    }

    applyConsentEffects(payload);
    return payload;
  }

  /**
   * Aplica las políticas activas: limpia almacenamiento opcional si fue rechazado
   * y habilita scripts condicionales únicamente para categorías aceptadas.
   */
  function applyConsentEffects(consent) {
    if (!consent) return;

    // Si el usuario no autorizó "Preferencias", eliminar cualquier preferencia guardada
    if (!consent.preferences) {
      try {
        window.localStorage.removeItem(PREF_CALC_KEY);
      } catch (e) {
        // Ignorar
      }
    }

    // Activar scripts diferidos por categoría (<script type="text/plain" data-cookie-category="...">)
    const deferredScripts = document.querySelectorAll('script[type="text/plain"][data-cookie-category]');
    deferredScripts.forEach((scriptEl) => {
      const category = scriptEl.getAttribute('data-cookie-category');
      if (category && consent[category] === true && !scriptEl.hasAttribute('data-cookie-executed')) {
        const activeScript = document.createElement('script');
        Array.from(scriptEl.attributes).forEach((attr) => {
          if (attr.name !== 'type' && attr.name !== 'data-cookie-category') {
            activeScript.setAttribute(attr.name, attr.value);
          }
        });
        activeScript.type = 'text/javascript';
        if (scriptEl.src) {
          activeScript.src = scriptEl.src;
        } else {
          activeScript.textContent = scriptEl.textContent;
        }
        scriptEl.setAttribute('data-cookie-executed', 'true');
        scriptEl.parentNode.insertBefore(activeScript, scriptEl.nextSibling);
      }
    });

    // Emitir evento personalizado para que otros módulos del sitio reaccionen
    try {
      window.dispatchEvent(new CustomEvent('biofuego:cookie-consent-updated', { detail: consent }));
    } catch (e) {
      // Ignorar
    }
  }

  /**
   * Construye e inyecta el Banner y el Modal de Configuración de Cookies en el DOM.
   */
  function buildCookieUI() {
    if (document.getElementById('biofuego-cookie-banner')) return;

    // 1. Banner Inferior
    const banner = document.createElement('aside');
    banner.id = 'biofuego-cookie-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Aviso de privacidad y uso de cookies');
    banner.setAttribute('aria-hidden', 'true');

    banner.innerHTML = `
      <div class="cookie-banner-inner">
        <div class="cookie-banner-content">
          <div class="cookie-banner-title">
            <svg viewBox="0 0 41 45" aria-hidden="true">
              <path d="M 5.939 14.790 C 0 17.672 0 44.108 22.573 44.300 C 30.206 44.365 38.903 39.563 39.794 31.920 C 40.685 24.277 36.959 20.434 36.959 20.434 C 36.959 20.434 34.751 26.374 31.335 26.820 C 31.335 26.820 34.239 19.079 27.853 12.396 C 21.466 5.713 23.238 0 23.238 0 C 23.238 0 9.123 7.691 12.771 21.919 C 12.771 21.919 8.464 20.073 5.939 14.790 Z"/>
            </svg>
            <span>Tu privacidad en Biofuego</span>
          </div>
          <p class="cookie-banner-text">
            Utilizamos cookies técnicas propias y almacenamiento local estrictamente necesarios para recordar tus preferencias de privacidad y garantizar el funcionamiento del sitio. Opcionalmente, podés autorizar cookies de preferencias para recordar tu selección en la calculadora de pedidos. No utilizamos cookies ocultas ni rastreadores publicitarios. Conocé más en nuestra
            <a href="/politica-de-cookies">Política de Cookies</a> y
            <a href="/politica-de-privacidad">Política de Privacidad</a>.
          </p>
        </div>
        <div class="cookie-banner-actions">
          <button type="button" class="cookie-btn cookie-btn-accept" id="cookie-accept-all">
            Aceptar todas
          </button>
          <button type="button" class="cookie-btn cookie-btn-reject" id="cookie-reject-optional">
            Rechazar opcionales
          </button>
          <button type="button" class="cookie-btn cookie-btn-config" id="cookie-open-preferences">
            Configurar preferencias
          </button>
        </div>
      </div>
    `;

    // 2. Modal de Configuración Detallada
    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'biofuego-cookie-modal-backdrop';
    modalBackdrop.className = 'cookie-modal-backdrop';
    modalBackdrop.setAttribute('role', 'dialog');
    modalBackdrop.setAttribute('aria-modal', 'true');
    modalBackdrop.setAttribute('aria-labelledby', 'cookie-modal-title');
    modalBackdrop.setAttribute('aria-hidden', 'true');

    modalBackdrop.innerHTML = `
      <div class="cookie-modal" role="document">
        <div class="cookie-modal-header">
          <div class="cookie-modal-title-wrap">
            <h2 id="cookie-modal-title">Configuración de Preferencias de Cookies</h2>
            <p>Administrá de forma transparente qué categorías de cookies y almacenamiento local permitís en Biofuego.</p>
          </div>
          <button type="button" class="cookie-modal-close" id="cookie-modal-close" aria-label="Cerrar panel de preferencias de cookies">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="cookie-modal-body">
          <p class="cookie-modal-intro">
            En <strong>BIOFUEGO</strong> respetamos tu privacidad conforme a la Ley N.° 25.326 de Protección de los Datos Personales. Podés activar o desactivar libremente las categorías opcionales en cualquier momento. Más detalles en nuestra <a href="/politica-de-cookies">Política de Cookies</a>.
          </p>

          <!-- Categoría 1: Necesarias -->
          <div class="cookie-category-card">
            <div class="cookie-category-top">
              <div class="cookie-category-title-group">
                <span class="cookie-category-title">1. Cookies técnicas o necesarias</span>
                <span class="cookie-badge-always">Siempre activas</span>
              </div>
              <label class="cookie-switch" aria-label="Cookies técnicas o necesarias (siempre activas)">
                <input type="checkbox" checked disabled id="toggle-cookie-necessary">
                <span class="cookie-slider"></span>
              </label>
            </div>
            <p class="cookie-category-desc">
              Son indispensables para el funcionamiento básico y seguro del sitio web. Permiten guardar tu decisión sobre el uso de cookies (<code>biofuego_cookie_consent</code>) para no volver a mostrarte el aviso en cada visita. No recopilan información con fines publicitarios.
            </p>
          </div>

          <!-- Categoría 2: Preferencias -->
          <div class="cookie-category-card">
            <div class="cookie-category-top">
              <div class="cookie-category-title-group">
                <span class="cookie-category-title">2. Cookies de preferencias</span>
              </div>
              <label class="cookie-switch" for="toggle-cookie-preferences">
                <input type="checkbox" id="toggle-cookie-preferences">
                <span class="cookie-slider"></span>
              </label>
            </div>
            <p class="cookie-category-desc">
              Permiten que el sitio recuerde opciones personalizadas durante tu navegación, como la cantidad de packs de iniciadores seleccionada en nuestra calculadora de pedidos (<code>biofuego_calc_packs</code>). Si las desactivás, la calculadora funcionará normalmente con su valor inicial por defecto.
            </p>
          </div>

          <!-- Categoría 3: Analíticas -->
          <div class="cookie-category-card">
            <div class="cookie-category-top">
              <div class="cookie-category-title-group">
                <span class="cookie-category-title">3. Cookies analíticas</span>
              </div>
              <label class="cookie-switch" for="toggle-cookie-analytics">
                <input type="checkbox" id="toggle-cookie-analytics">
                <span class="cookie-slider"></span>
              </label>
            </div>
            <p class="cookie-category-desc">
              Permiten medir de forma estadística y agregada el uso del sitio web para mejorar su rendimiento. <strong>Actualmente Biofuego no tiene instaladas herramientas de analítica de terceros</strong> (como Google Analytics); esta opción permanece desactivada por defecto y sólo tendría efecto si se incorporaran métricas en el futuro con tu consentimiento previo.
            </p>
          </div>

          <!-- Categoría 4: Marketing -->
          <div class="cookie-category-card">
            <div class="cookie-category-top">
              <div class="cookie-category-title-group">
                <span class="cookie-category-title">4. Cookies de marketing</span>
              </div>
              <label class="cookie-switch" for="toggle-cookie-marketing">
                <input type="checkbox" id="toggle-cookie-marketing">
                <span class="cookie-slider"></span>
              </label>
            </div>
            <p class="cookie-category-desc">
              Se utilizan para mostrar anuncios relevantes o medir campañas publicitarias en plataformas externas. <strong>Actualmente Biofuego no utiliza píxeles publicitarios ni cookies de seguimiento comercial</strong> (como Meta Pixel o Google Ads).
            </p>
          </div>
        </div>

        <div class="cookie-modal-footer">
          <div class="cookie-modal-footer-left">
            <button type="button" class="cookie-btn cookie-btn-reject" id="modal-reject-optional">
              Rechazar opcionales
            </button>
            <button type="button" class="cookie-btn cookie-btn-config" id="modal-accept-all">
              Aceptar todas
            </button>
          </div>
          <button type="button" class="cookie-btn cookie-btn-accept" id="modal-save-preferences">
            Guardar preferencias
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);
    document.body.appendChild(modalBackdrop);

    // Referencias de controles
    const btnAcceptAll = document.getElementById('cookie-accept-all');
    const btnRejectOptional = document.getElementById('cookie-reject-optional');
    const btnOpenPrefs = document.getElementById('cookie-open-preferences');

    const btnModalClose = document.getElementById('cookie-modal-close');
    const btnModalReject = document.getElementById('modal-reject-optional');
    const btnModalAcceptAll = document.getElementById('modal-accept-all');
    const btnModalSave = document.getElementById('modal-save-preferences');

    const chkPreferences = document.getElementById('toggle-cookie-preferences');
    const chkAnalytics = document.getElementById('toggle-cookie-analytics');
    const chkMarketing = document.getElementById('toggle-cookie-marketing');

    let lastFocusedElement = null;

    function showBanner() {
      banner.classList.add('is-visible');
      banner.setAttribute('aria-hidden', 'false');
    }

    function hideBanner() {
      banner.classList.remove('is-visible');
      banner.setAttribute('aria-hidden', 'true');
    }

    function syncModalCheckboxes() {
      const current = getStoredConsent();
      if (current) {
        chkPreferences.checked = Boolean(current.preferences);
        chkAnalytics.checked = Boolean(current.analytics);
        chkMarketing.checked = Boolean(current.marketing);
      } else {
        chkPreferences.checked = false;
        chkAnalytics.checked = false;
        chkMarketing.checked = false;
      }
    }

    function openModal() {
      lastFocusedElement = document.activeElement;
      syncModalCheckboxes();
      modalBackdrop.classList.add('is-open');
      modalBackdrop.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        if (btnModalClose) btnModalClose.focus();
      }, 50);
    }

    function closeModal() {
      modalBackdrop.classList.remove('is-open');
      modalBackdrop.setAttribute('aria-hidden', 'true');
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }

    function handleAcceptAll() {
      persistConsent({
        preferences: true,
        analytics: true,
        marketing: true
      });
      hideBanner();
      closeModal();
    }

    function handleRejectOptional() {
      persistConsent({
        preferences: false,
        analytics: false,
        marketing: false
      });
      hideBanner();
      closeModal();
    }

    function handleSaveCustom() {
      persistConsent({
        preferences: chkPreferences.checked,
        analytics: chkAnalytics.checked,
        marketing: chkMarketing.checked
      });
      hideBanner();
      closeModal();
    }

    // Eventos del Banner
    if (btnAcceptAll) btnAcceptAll.addEventListener('click', handleAcceptAll);
    if (btnRejectOptional) btnRejectOptional.addEventListener('click', handleRejectOptional);
    if (btnOpenPrefs) btnOpenPrefs.addEventListener('click', openModal);

    // Eventos del Modal
    if (btnModalClose) btnModalClose.addEventListener('click', closeModal);
    if (btnModalReject) btnModalReject.addEventListener('click', handleRejectOptional);
    if (btnModalAcceptAll) btnModalAcceptAll.addEventListener('click', handleAcceptAll);
    if (btnModalSave) btnModalSave.addEventListener('click', handleSaveCustom);

    // Cerrar al hacer clic fuera del cuadro de diálogo
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBackdrop.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Vincular todos los botones de la página con [data-open-cookie-modal]
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-cookie-modal]');
      if (trigger) {
        e.preventDefault();
        openModal();
      }
    });

    // Exponer API pública para otros componentes de Biofuego
    window.BiofuegoCookies = {
      getConsent: getStoredConsent,
      hasConsent: function (category) {
        if (category === 'necessary') return true;
        const c = getStoredConsent();
        return Boolean(c && c[category] === true);
      },
      openModal: openModal,
      closeModal: closeModal,
      acceptAll: handleAcceptAll,
      rejectOptional: handleRejectOptional
    };

    // Comprobar si es la primera visita o si ya existe consentimiento
    const existingConsent = getStoredConsent();
    if (!existingConsent) {
      // Mostrar banner tras una breve pausa para no interferir con el LCP inicial
      setTimeout(showBanner, 350);
    } else {
      applyConsentEffects(existingConsent);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildCookieUI);
  } else {
    buildCookieUI();
  }
})();

