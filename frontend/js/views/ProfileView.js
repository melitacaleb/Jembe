// js/views/ProfileView.js
import { BaseView } from './BaseView.js';
import { api } from '../services/api.js';
import { store } from '../services/store.js';

export class ProfileView extends BaseView {
  async render() {
    const userId = this.param || store.getUser()?.id;
    const wrap = this.el('div', { class: 'profile-wrap' });
    this.mount(wrap);

    try {
      const { user, counts, posts } = await api.getProfile(userId);
      const isSelf = store.getUser()?.id === user.id;

      const header = this.el('div', { class: 'profile-header' }, [
        this.el('img', { src: user.avatar_url || 'icons/icon-192.png', class: 'avatar-lg' }),
        this.el('div', {}, [
          this.el('h2', {}, [user.full_name, user.account_type === 'organization' ? this.el('span', { class: 'badge-org' }, ['ORG']) : '']),
          this.el('div', { class: 'profile-username' }, [`@${user.username}`]),
          this.el('div', { class: 'profile-bio' }, [user.bio || '']),
          this.el('div', { class: 'profile-location' }, [user.location || '']),
          this.el('div', { class: 'profile-stats' }, [
            this.el('span', {}, [`${counts.followers} followers`]),
            this.el('span', {}, [`${counts.following} following`]),
          ]),
        ]),
      ]);
      wrap.appendChild(header);

      if (!isSelf) {
        const followBtn = this.el('button', { class: 'btn btn-primary btn-sm' }, ['Follow']);
        followBtn.addEventListener('click', async () => {
          try { await api.follow(user.id); this.toast('Following!', 'success'); }
          catch (err) { this.toast(err.message, 'error'); }
        });
        wrap.appendChild(followBtn);
      } else {
        const logoutBtn = this.el('button', { class: 'btn btn-secondary btn-sm' }, ['Log out']);
        logoutBtn.addEventListener('click', () => {
          api.setToken(null);
          window.location.hash = '/auth';
          location.reload();
        });
        wrap.appendChild(logoutBtn);
      }

      const grid = this.el('div', { class: 'profile-grid' });
      posts.forEach((p) => {
        grid.appendChild(this.el('img', { src: (p.media_urls && p.media_urls[0]) || 'icons/icon-192.png', class: 'grid-thumb' }));
      });
      wrap.appendChild(grid);
    } catch (err) {
      wrap.appendChild(this.el('div', { class: 'empty-state' }, [err.message]));
    }
  }
}
