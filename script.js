(() => {
  const video = document.querySelector('.video-wrap .video');
  if (!video) return;

  const mobileQuery = window.matchMedia('(max-width: 768px)');
  const ua = navigator.userAgent || '';
  const isInstagram = ua.includes('Instagram');
  const isFBWebView = ua.includes('FBAN') || ua.includes('FBAV');
  const isWebView = isInstagram || isFBWebView;

  const setVideoSource = () => {
    const nextSrc = isWebView
      ? (video.dataset.srcWebview || video.dataset.srcMobile || video.dataset.srcDesktop)
      : (mobileQuery.matches ? video.dataset.srcMobile : video.dataset.srcDesktop);
    if (!nextSrc) return;
    if (video.getAttribute('src') === nextSrc) return;

    video.setAttribute('src', nextSrc);
    video.load();
  };

  setVideoSource();

  if (typeof mobileQuery.addEventListener === 'function') {
    mobileQuery.addEventListener('change', setVideoSource);
  } else if (typeof mobileQuery.addListener === 'function') {
    mobileQuery.addListener(setVideoSource);
  }
})();

/* ============================================================
   Scroll Hint (Seta de “arraste”) — versão insistente
   - Ao entrar na tela: espera 2s sem interação e mostra a seta
   - Clique/toque (sem arrastar): some e volta após 8s
   - Scroll/arrasto horizontal na galeria: some e NÃO volta nesta página
   ============================================================ */

(() => {
  const galleries = document.querySelectorAll('.project .galeria');

  const SHOW_AFTER_MS = 2000;  // 2s parado
  const REAPPEAR_MS   = 8000;  // 8s após clique sem swipe

  function isScrollableX(el) {
    return el.scrollWidth > el.clientWidth + 2;
  }

  function getHintEl(galeria) {
    return galeria.parentElement.querySelector('.scroll-hint');
  }

  function showHint(galeria) {
    const hint = getHintEl(galeria);
    if (!hint) return;
    hint.classList.add('is-on');
  }

  function hideHint(galeria) {
    const hint = getHintEl(galeria);
    if (!hint) return;
    hint.classList.remove('is-on');
  }

  function clearTimers(galeria) {
    clearTimeout(galeria._hintTimer);
    clearTimeout(galeria._reappearTimer);
    galeria._hintTimer = null;
    galeria._reappearTimer = null;
  }

  function scheduleInitialShow(galeria) {
    if (galeria._learned) return;
    if (!galeria._isVisible) return;
    if (!isScrollableX(galeria)) return;

    clearTimeout(galeria._hintTimer);
    galeria._hintTimer = setTimeout(() => {
      if (!galeria._learned && galeria._isVisible) showHint(galeria);
    }, SHOW_AFTER_MS);
  }

  function scheduleReappear(galeria) {
    if (galeria._learned) return;
    if (!galeria._isVisible) return;
    if (!isScrollableX(galeria)) return;

    clearTimeout(galeria._reappearTimer);
    galeria._reappearTimer = setTimeout(() => {
      if (!galeria._learned && galeria._isVisible) showHint(galeria);
    }, REAPPEAR_MS);
  }

  // Observa visibilidade da galeria (pra não mostrar fora da tela)
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const galeria = entry.target;
      galeria._isVisible = entry.isIntersecting;

      if (!entry.isIntersecting) {
        hideHint(galeria);
        clearTimers(galeria);
        return;
      }

      // Entrou na tela: arma o “após 2s”
      scheduleInitialShow(galeria);
    });
  }, { threshold: 0.6 });

  galleries.forEach(galeria => {
    galeria._learned = false;
    galeria._isVisible = false;

    io.observe(galeria);

    // Se o usuário fizer scroll na galeria (swipe real), consideramos que ele entendeu.
    galeria.addEventListener('scroll', () => {
      galeria._learned = true;
      hideHint(galeria);
      clearTimers(galeria);
    }, { passive: true });

    // Clique/toque: some, mas volta depois de 8s (se ainda não houve swipe)
    galeria.addEventListener('pointerdown', () => {
      if (galeria._learned) return;
      hideHint(galeria);
      scheduleReappear(galeria);
    }, { passive: true });

    galeria.addEventListener('touchstart', () => {
      if (galeria._learned) return;
      hideHint(galeria);
      scheduleReappear(galeria);
    }, { passive: true });
  });
})();

(() => {
  const ua = navigator.userAgent || "";
  const isInstagram = ua.includes("Instagram");
  const isFBWebView = ua.includes("FBAN") || ua.includes("FBAV");
  const isWebView = isInstagram || isFBWebView;

  if (!isWebView) return;

  document.documentElement.classList.add("is-webview");

  // Pausa o vídeo para reduzir jank no scroll
  const v = document.querySelector(".video-wrap video");
  if (v) {
    try {
      v.setAttribute("playsinline", "");
      v.setAttribute("muted", "");
      v.setAttribute("autoplay", "");
      v.setAttribute("loop", "");
      v.muted = true;

      const tryPlay = () => {
        const playPromise = v.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      };

      if (v.readyState >= 1) {
        tryPlay();
      } else {
        v.addEventListener("loadedmetadata", tryPlay, { once: true });
      }
    } catch (e) {}
  }
})();
 /* ============================================================
   Toggle Shop (link único abaixo do email)
   - Clica em "shop": esconde work e mostra shop
   - O texto vira "← back"
   - Clica em "← back": volta pro work
   ============================================================ */
(() => {
  const toggle = document.getElementById('shopToggle');
  const work = document.getElementById('work');
  const shop = document.getElementById('shop');
  const workVideo = document.getElementById('work-video');

  if (!toggle || !work || !shop) return;

  const setMode = (mode) => {
    const isShop = mode === 'shop';

    // alterna visibilidade
    shop.style.display = isShop ? '' : 'none';
    work.style.display = isShop ? 'none' : '';
    if (workVideo) workVideo.style.display = isShop ? 'none' : '';

    // alterna texto/link
    toggle.textContent = isShop ? '← back' : 'shop';
    toggle.setAttribute('href', isShop ? '#work' : '#shop');
    toggle.setAttribute('aria-expanded', String(isShop));

    // evita ficar perdido no meio do scroll ao trocar
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // estado inicial pelo hash (se abrir com #shop, já entra em shop)
  const initial = (location.hash || '').toLowerCase() === '#shop' ? 'shop' : 'work';
  setMode(initial);

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const nowIsShop = shop.style.display !== 'none';
    const next = nowIsShop ? 'work' : 'shop';
    history.replaceState(null, '', next === 'shop' ? '#shop' : '#work');
    setMode(next);
  });

  // se o usuário usar voltar/avançar e mudar hash
  window.addEventListener('hashchange', () => {
    const mode = (location.hash || '').toLowerCase() === '#shop' ? 'shop' : 'work';
    setMode(mode);
  });
})();





