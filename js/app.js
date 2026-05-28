/**
 * Explore Three Cities — Main Application Controller
 * SPA with tab navigation, category filtering, favorites, and scroll animations.
 */

window.App = window.App || {};

(function () {
  'use strict';

  /* ─── State ────────────────────────── */
  const state = {
    city: 'london',
    category: 'all',
    view: 'explore', // 'explore' | 'favorites'
  };

  let observer = null;
  let deferredInstallPrompt = null;

  /* ─── Selectors ────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ─── Init ─────────────────────────── */
  function init() {
    renderTabBar();
    renderView();
    setupScrollObserver();
    setupInstallPrompt();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  /* ─── Tab Bar ──────────────────────── */
  function renderTabBar() {
    const tabBar = $('#tab-bar');
    const favCount = App.Favorites.count();

    tabBar.innerHTML = `
      ${App.CITY_ORDER.map(cityId => {
        const city = App.CITIES[cityId];
        const isActive = state.view === 'explore' && state.city === cityId;
        return `
          <button class="tab-btn ${isActive ? 'tab-btn--active' : ''}"
                  data-city="${cityId}"
                  aria-label="Explore ${city.name}"
                  id="tab-${cityId}">
            <span class="tab-btn__emoji">${city.emoji}</span>
            <span class="tab-btn__label">${city.name}</span>
          </button>`;
      }).join('')}
      <button class="tab-btn ${state.view === 'favorites' ? 'tab-btn--active' : ''}"
              data-view="favorites"
              aria-label="Your Favorites"
              id="tab-favorites">
        <span class="tab-btn__emoji">❤️</span>
        <span class="tab-btn__label">Saved</span>
        <span class="tab-btn__badge ${favCount > 0 ? 'tab-btn__badge--visible' : ''}"
              id="fav-badge">${favCount}</span>
      </button>
    `;

    // Attach tab events
    $$('.tab-btn', tabBar).forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.view === 'favorites') {
          state.view = 'favorites';
        } else {
          state.view = 'explore';
          state.city = btn.dataset.city;
          state.category = 'all';
        }
        updateCityTheme();
        renderTabBar();
        renderView();
        scrollToTop();
      });
    });
  }

  /* ─── Theme ────────────────────────── */
  function updateCityTheme() {
    document.documentElement.setAttribute('data-city', state.city);
  }

  /* ─── Render View ──────────────────── */
  function renderView() {
    const content = $('#content');
    content.innerHTML = '';

    if (state.view === 'favorites') {
      renderFavorites(content);
    } else {
      renderCityView(content);
    }

    // Trigger entrance animation
    content.classList.remove('view-enter');
    void content.offsetWidth; // force reflow
    content.classList.add('view-enter');

    // Observe new cards
    requestAnimationFrame(() => {
      observeCards();
    });
  }

  /* ─── City View ────────────────────── */
  function renderCityView(container) {
    const city = App.CITIES[state.city];
    const places = getFilteredPlaces();

    container.innerHTML = `
      <section class="city-hero" aria-label="${city.name}">
        <span class="city-hero__emoji">${city.emoji}</span>
        <h1 class="city-hero__name">${city.name}</h1>
        <p class="city-hero__tagline">${city.tagline}</p>
        <p class="city-hero__count">${city.description}</p>
      </section>

      ${renderCategoryPills()}

      <div id="install-banner-slot"></div>

      ${places.length > 0
        ? `<div class="places-grid" role="list">${places.map(renderPlaceCard).join('')}</div>`
        : renderEmptyState('🔍', 'No places found', 'Try selecting a different category')
      }

      ${state.city === 'gosport' ? renderContactCard() : ''}
    `;

    attachCardEvents(container);
    showInstallBanner();
  }

  /* ─── Category Pills ───────────────── */
  function renderCategoryPills() {
    // Only show categories that have places in this city
    const cityPlaces = App.PLACES.filter(p => p.city === state.city);
    const availableCategories = new Set(cityPlaces.map(p => p.category));

    return `
      <nav class="categories" aria-label="Filter by category">
        ${App.CATEGORIES
          .filter(cat => cat.id === 'all' || availableCategories.has(cat.id))
          .map(cat => `
            <button class="category-pill ${state.category === cat.id ? 'category-pill--active' : ''}"
                    data-category="${cat.id}"
                    aria-pressed="${state.category === cat.id}"
                    id="cat-${cat.id}">
              <span class="category-pill__emoji">${cat.emoji}</span>
              ${cat.name}
            </button>
          `).join('')}
      </nav>
    `;
  }

  /* ─── Favorites View ───────────────── */
  function renderFavorites(container) {
    const favIds = App.Favorites.getAll();
    const favPlaces = App.PLACES.filter(p => favIds.includes(p.id));

    container.innerHTML = `
      <header class="favorites-header">
        <span class="favorites-header__emoji">❤️</span>
        <h1 class="favorites-header__title">Your Saved Places</h1>
        <p class="favorites-header__count">${favPlaces.length} place${favPlaces.length !== 1 ? 's' : ''} saved</p>
      </header>

      ${favPlaces.length > 0
        ? `<div class="places-grid" role="list">${favPlaces.map(p => renderPlaceCard(p, true)).join('')}</div>`
        : renderEmptyState('💝', 'No saved places yet', 'Tap the heart on any place to save it here')
      }
    `;

    attachCardEvents(container);
  }

  /* ─── Place Card ───────────────────── */
  function renderPlaceCard(place, showCity = false) {
    const isFav = App.Favorites.isFavorite(place.id);
    const gradient = App.CATEGORY_GRADIENTS[place.category] || App.CATEGORY_GRADIENTS.gems;
    const category = App.CATEGORIES.find(c => c.id === place.category);
    const cityName = App.CITIES[place.city]?.name || '';
    const mapsUrl = getDirectionsUrl(place);

    return `
      <article class="place-card" role="listitem" data-id="${place.id}">
        <div class="card-visual" style="background: ${gradient}">
          <span class="card-visual__emoji">${place.emoji}</span>
          <button class="favorite-btn ${isFav ? 'favorite-btn--active' : ''}"
                  data-place-id="${place.id}"
                  aria-label="${isFav ? 'Remove from' : 'Add to'} favorites"
                  id="fav-${place.id}">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="card-body">
          <h3 class="card-title">
            ${place.name}
            ${showCity ? `<span class="card-city-badge">${cityName}</span>` : ''}
          </h3>
          <span class="card-category-badge">${category ? category.emoji + ' ' + category.name : ''}</span>
          <p class="card-description">${place.description}</p>
          <div class="card-meta">
            <div class="card-meta__item">
              <span class="card-meta__icon">🕐</span>
              <span>${place.hours}</span>
            </div>
            <div class="card-meta__item">
              <span class="card-meta__icon">💷</span>
              <span>${place.price}</span>
            </div>
          </div>
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
             class="directions-btn" id="dir-${place.id}">
            <span class="directions-btn__icon">📍</span>
            Get Directions
          </a>
        </div>
      </article>
    `;
  }

  /* ─── Empty State ──────────────────── */
  function renderEmptyState(emoji, title, description) {
    return `
      <div class="empty-state">
        <span class="empty-state__emoji">${emoji}</span>
        <h2 class="empty-state__title">${title}</h2>
        <p class="empty-state__description">${description}</p>
      </div>
    `;
  }

  /* ─── Contact Info Card ────────────── */
  function renderContactCard() {
    return `
      <section class="contact-card" id="contact-card">
        <div class="contact-card__header">
          <span class="contact-card__icon">🏠</span>
          <h2 class="contact-card__title">Cousin's Address</h2>
        </div>
        <div class="contact-card__body">
          <address class="contact-card__address">
            <strong>14 Charnwood</strong><br>
            <strong>Gosport</strong><br>
            <strong>PO13 0ZF</strong><br>
            <strong>Hampshire, UK</strong>
          </address>
        </div>
        <a href="https://maps.google.com/maps?q=14+Charnwood,+Gosport+PO13+0ZF"
           target="_blank" rel="noopener noreferrer"
           class="directions-btn contact-card__btn"
           id="dir-cousin-house">
          <span class="directions-btn__icon">📍</span>
          Get Directions to Cousin's House
        </a>
      </section>
    `;
  }

  /* ─── Card Events ──────────────────── */
  function attachCardEvents(container) {
    // Category pills
    $$('.category-pill', container).forEach(pill => {
      pill.addEventListener('click', () => {
        state.category = pill.dataset.category;
        renderView();
      });
    });

    // Favorite buttons
    $$('.favorite-btn', container).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const placeId = btn.dataset.placeId;
        const isNowFav = App.Favorites.toggle(placeId);

        // Update button visuals
        btn.classList.toggle('favorite-btn--active', isNowFav);
        btn.innerHTML = isNowFav ? '❤️' : '🤍';
        btn.setAttribute('aria-label', `${isNowFav ? 'Remove from' : 'Add to'} favorites`);

        // Re-trigger animation
        if (isNowFav) {
          btn.classList.remove('favorite-btn--active');
          void btn.offsetWidth;
          btn.classList.add('favorite-btn--active');
        }

        // Update badge
        updateFavBadge();

        // If in favorites view and unfavorited, re-render
        if (state.view === 'favorites' && !isNowFav) {
          setTimeout(() => renderView(), 300);
        }
      });
    });
  }

  /* ─── Helpers ──────────────────────── */
  function getFilteredPlaces() {
    return App.PLACES.filter(p => {
      if (p.city !== state.city) return false;
      if (state.category !== 'all' && p.category !== state.category) return false;
      return true;
    });
  }

  function getDirectionsUrl(place) {
    const dest = `${place.lat},${place.lng}`;
    const name = encodeURIComponent(place.name);
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=${name}&travelmode=walking`;
  }

  function updateFavBadge() {
    const badge = $('#fav-badge');
    if (!badge) return;
    const count = App.Favorites.count();
    badge.textContent = count;
    badge.classList.toggle('tab-btn__badge--visible', count > 0);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ─── Scroll Animation Observer ────── */
  function setupScrollObserver() {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
  }

  function observeCards() {
    $$('.place-card').forEach(card => {
      card.classList.remove('visible');
      observer.observe(card);
    });
  }

  /* ─── PWA Install Prompt ───────────── */
  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      showInstallBanner();
    });
  }

  function showInstallBanner() {
    const slot = $('#install-banner-slot');
    if (!slot || !deferredInstallPrompt) return;

    // Don't show if dismissed this session
    if (sessionStorage.getItem('install_dismissed')) return;

    slot.innerHTML = `
      <div class="install-banner" id="install-banner">
        <span class="install-banner__icon">📲</span>
        <div class="install-banner__text">
          <div class="install-banner__title">Add to Home Screen</div>
          <div class="install-banner__description">Use like a native app — works offline!</div>
        </div>
        <button class="install-banner__btn" id="install-btn">Install</button>
        <button class="install-banner__close" id="install-close" aria-label="Dismiss">✕</button>
      </div>
    `;

    $('#install-btn').addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const result = await deferredInstallPrompt.userChoice;
        if (result.outcome === 'accepted') {
          deferredInstallPrompt = null;
          $('#install-banner')?.remove();
        }
      }
    });

    $('#install-close').addEventListener('click', () => {
      $('#install-banner')?.remove();
      sessionStorage.setItem('install_dismissed', '1');
    });
  }

  /* ─── Boot ─────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Set initial theme
  updateCityTheme();
})();
