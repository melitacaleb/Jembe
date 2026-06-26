// js/services/store.js
// Tiny observable store — holds the logged-in user so every view can react.

class Store {
  constructor() {
    this.state = { user: null };
    this.listeners = [];
  }

  setUser(user) {
    this.state.user = user;
    this.listeners.forEach((fn) => fn(this.state));
  }

  getUser() {
    return this.state.user;
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter((l) => l !== fn); };
  }
}

export const store = new Store();
