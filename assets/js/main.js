/**
 * BIOFUEGO — JavaScript Principal Optimizado (Alto Rendimiento)
 * 60-120 FPS | Zero Layout Thrashing | Eventos Throttled & RAF Condicional
 */

document.addEventListener('DOMContentLoaded', () => {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // --------------------------------------------------------------------------
  // 1. Navegación & Menú Móvil Accesible (Throttled Scroll)
  // --------------------------------------------------------------------------
  const header = document.querySelector('.site-header');
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navBackdrop = document.querySelector('.nav-backdrop');
  const navLinks = document.querySelectorAll('.nav-link, .nav-menu-cta .btn');

  // Header scroll state desacoplado mediante requestAnimationFrame
  let lastScrolled = false;
  let scrollTicking = false;

  const handleScroll = () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        const isScrolled = window.scrollY > 20;
        if (isScrolled !== lastScrolled) {
          if (header) header.classList.toggle('scrolled', isScrolled);
          lastScrolled = isScrolled;
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Control del Menú Móvil
  const toggleMobileMenu = (open) => {
    const shouldOpen = typeof open === 'boolean' ? open : !navMenu.classList.contains('open');
    navMenu.classList.toggle('open', shouldOpen);
    if (navBackdrop) navBackdrop.classList.toggle('open', shouldOpen);
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    
    // Bloquear scroll de fondo de forma limpia
    document.documentElement.style.overflow = shouldOpen ? 'hidden' : '';
    document.body.style.overflow = shouldOpen ? 'hidden' : '';
    document.body.classList.toggle('menu-open', shouldOpen);
  };

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => toggleMobileMenu());

    if (navBackdrop) {
      navBackdrop.addEventListener('click', () => toggleMobileMenu(false));
    }

    navLinks.forEach(link => {
      link.addEventListener('click', () => toggleMobileMenu(false));
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        toggleMobileMenu(false);
        mobileToggle.focus();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. Desplazamiento Suave con Compensación de Altura de Header
  // --------------------------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerHeight = header ? header.offsetHeight : 76;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight + 6;

        window.scrollTo({
          top: targetPosition,
          behavior: isReducedMotion ? 'auto' : 'smooth'
        });
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. Hero Puck & Chips (Animación 100% GPU en Compositor Thread - Zero Main Thread Lag)
  // --------------------------------------------------------------------------
  // El escenario del producto flota con aceleración por hardware pura en CSS (translate3d),
  // liberando completamente el hilo principal y garantizando 60-120 FPS sin tirones por mouse.

  // --------------------------------------------------------------------------
  // 4. Revelación Progresiva al Scroll (Intersection Observer Instantáneo)
  // --------------------------------------------------------------------------
  const revealElements = document.querySelectorAll('.reveal-item, .reveal-scale');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.05,
      rootMargin: '0px 0px 60px 0px' // Revela antes de entrar en pantalla para fluidez total
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }

  // --------------------------------------------------------------------------
  // 5. Calculadora Interactiva de Pedido Rápido
  // --------------------------------------------------------------------------
  const btnMinus = document.getElementById('calc-minus');
  const btnPlus = document.getElementById('calc-plus');
  const calcQty = document.getElementById('calc-qty');
  const calcTotalPucks = document.getElementById('calc-total-pucks');
  const calcTotalMins = document.getElementById('calc-total-mins');
  const btnOrderWhatsapp = document.getElementById('btn-order-whatsapp');
  const btnOrderEmail = document.getElementById('btn-order-email');

  let packCount = 2;
  const PUCKS_PER_PACK = 5;
  const DURATION_PER_PUCK = 20;

  const updateCalculator = () => {
    if (calcQty) calcQty.textContent = packCount;
    if (calcTotalPucks) calcTotalPucks.textContent = packCount * PUCKS_PER_PACK;
    if (calcTotalMins) calcTotalMins.textContent = packCount * PUCKS_PER_PACK * DURATION_PER_PUCK;

    const phone = '5493755665852';
    const email = 'madereraferrari@yahoo.com.ar';
    const totalPastillas = packCount * PUCKS_PER_PACK;

    const waText = encodeURIComponent(
      `¡Hola Biofuego! Quiero hacer un pedido de ${packCount} pack(s) de iniciadores artesanales (${totalPastillas} pastillas en total). ¿Cómo coordinamos el envío?`
    );
    const mailSubject = encodeURIComponent(`Pedido Biofuego — ${packCount} pack(s)`);
    const mailBody = encodeURIComponent(
      `Hola equipo de Biofuego,\n\nQuisiera realizar un pedido de ${packCount} pack(s) de iniciadores de fuego artesanales (${totalPastillas} pastillas con mechas).\n\nPor favor indiquenme costos de envío y medios de pago.\n\nSaludos cordiales.`
    );

    if (btnOrderWhatsapp) {
      btnOrderWhatsapp.href = `https://wa.me/${phone}?text=${waText}`;
    }
    if (btnOrderEmail) {
      btnOrderEmail.href = `mailto:${email}?subject=${mailSubject}&body=${mailBody}`;
    }
  };

  if (btnMinus && btnPlus) {
    btnMinus.addEventListener('click', () => {
      if (packCount > 1) {
        packCount--;
        updateCalculator();
      }
    });

    btnPlus.addEventListener('click', () => {
      if (packCount < 50) {
        packCount++;
        updateCalculator();
      }
    });

    updateCalculator();
  }
});
