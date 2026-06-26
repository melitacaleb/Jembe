// js/views/NavView.js
// Controls the persistent bottom navigation bar (Instagram-style icons).

export class NavView {
  constructor(navEl, router) {
    this.navEl = navEl;
    this.router = router;
    this.items = [
      { path: '/feed', icon: '🏠', label: 'Feed' },
      { path: '/marketplace', icon: '🛒', label: 'Market' },
      { path: '/education', icon: '📚', label: 'Learn' },
      { path: '/profile', icon: '👤', label: 'Profile' },
    ];
  }

  render() {
    this.navEl.innerHTML = '';
    this.items.forEach((item) => {
      const btn = document.createElement('button');
      btn.className = 'nav-item';
      btn.innerHTML = `<span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span>`;
      btn.addEventListener('click', () => this.router.navigate(item.path));
      this.navEl.appendChild(btn);
    });
    this.highlight();
    document.addEventListener('route:changed', () => this.highlight());
  }

  highlight() {
    const current = window.location.hash.slice(1).split('/').filter(Boolean)[0];
    const currentPath = current ? `/${current}` : '/feed';
    Array.from(this.navEl.children).forEach((btn, i) => {
      btn.classList.toggle('active', this.items[i].path === currentPath);
    });
  }
}
