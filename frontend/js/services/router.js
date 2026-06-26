// js/services/router.js
// Minimal hash-based router. Each route maps to a View class with a render(container) method.

class Router {
  constructor(mountSelector) {
    this.routes = {};
    this.mount = document.querySelector(mountSelector);
    window.addEventListener('hashchange', () => this.resolve());
  }

  register(path, ViewClass) {
    this.routes[path] = ViewClass;
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/feed';
    const [path, param] = hash.split('/').filter(Boolean).reduce(
      (acc, part, i) => (i === 0 ? [`/${part}`, acc[1]] : [acc[0], part]),
      ['/feed', null]
    );
    const ViewClass = this.routes[path] || this.routes['/feed'];
    this.mount.innerHTML = '';
    const view = new ViewClass(this.mount, param);
    view.render();
    document.dispatchEvent(new CustomEvent('route:changed', { detail: { path } }));
  }

  start() {
    this.resolve();
  }
}

export { Router };
