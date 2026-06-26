// js/app.js
import { Router } from './services/router.js';
import { api } from './services/api.js';
import { store } from './services/store.js';
import { AuthView } from './views/AuthView.js';
import { FeedView } from './views/FeedView.js';
import { MarketplaceView } from './views/MarketplaceView.js';
import { EducationView } from './views/EducationView.js';
import { ProfileView } from './views/ProfileView.js';
import { NavView } from './views/NavView.js';

async function bootstrap() {
  const router = new Router('#app');
  router
    .register('/auth', AuthView)
    .register('/feed', FeedView)
    .register('/marketplace', MarketplaceView)
    .register('/education', EducationView)
    .register('/profile', ProfileView);

  const bottomNav = document.getElementById('bottomNav');
  const nav = new NavView(bottomNav, router);

  // If we have a token, try to load the current user before deciding what to show.
  if (api.token) {
    try {
      const { user } = await api.me();
      store.setUser(user);
    } catch (_) {
      api.setToken(null);
    }
  }

  if (!store.getUser()) {
    bottomNav.classList.add('hidden');
    if (!window.location.hash || window.location.hash === '#/feed') {
      window.location.hash = '/auth';
    }
    router.register('/feed', AuthView); // guard: redirect feed to auth when logged out
  } else {
    bottomNav.classList.remove('hidden');
    nav.render();
  }

  router.start();

  // Register service worker for PWA/offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW registration failed', err));
  }
}

bootstrap();
