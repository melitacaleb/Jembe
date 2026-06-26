// js/views/FeedView.js
import { BaseView } from './BaseView.js';
import { api } from '../services/api.js';
import { store } from '../services/store.js';

export class FeedView extends BaseView {
  async render() {
    const wrap = this.el('div', { class: 'feed-wrap' });
    this.mount(wrap);

    wrap.appendChild(this.buildComposer());

    const list = this.el('div', { class: 'feed-list', id: 'feed-list' });
    wrap.appendChild(list);

    try {
      const { posts } = await api.getFeed();
      if (!posts.length) {
        list.appendChild(this.el('div', { class: 'empty-state' }, ['No posts yet. Be the first to share something with the community!']));
      }
      posts.forEach((post) => list.appendChild(this.buildPostCard(post)));
    } catch (err) {
      list.appendChild(this.el('div', { class: 'empty-state' }, [err.message]));
    }
  }

  buildComposer() {
    const user = store.getUser();
    const box = this.el('div', { class: 'composer' });
    const captionInput = this.el('textarea', { class: 'input', placeholder: `Share an update, ${user?.full_name || 'farmer'}...`, rows: '2' });
    const mediaInput = this.el('input', { class: 'input', placeholder: 'Image URL (e.g. from any image host)' });
    const locationInput = this.el('input', { class: 'input', placeholder: 'Location (optional)' });
    const postBtn = this.el('button', { class: 'btn btn-primary' }, ['Post']);
    const error = this.el('div', { class: 'form-error' });

    postBtn.addEventListener('click', async () => {
      if (!mediaInput.value.trim()) {
        error.textContent = 'Please add an image URL — Farmers Connect posts are photo/video first, like Instagram.';
        return;
      }
      try {
        await api.createPost({
          caption: captionInput.value,
          media_urls: [mediaInput.value.trim()],
          location: locationInput.value,
        });
        window.location.reload();
      } catch (err) {
        error.textContent = err.message;
      }
    });

    box.appendChild(captionInput);
    box.appendChild(mediaInput);
    box.appendChild(locationInput);
    box.appendChild(error);
    box.appendChild(postBtn);
    return box;
  }

  buildPostCard(post) {
    const card = this.el('article', { class: 'post-card' });

    const header = this.el('div', { class: 'post-header' }, [
      this.el('img', { src: post.avatar_url || 'icons/icon-192.png', class: 'avatar-sm' }),
      this.el('div', { class: 'post-header-meta' }, [
        this.el('span', { class: 'post-author' }, [post.full_name || post.username]),
        post.account_type === 'organization' ? this.el('span', { class: 'badge-org' }, ['ORG']) : '',
      ]),
    ]);

    const mediaUrl = (post.media_urls && post.media_urls[0]) || '';
    const media = this.el('img', { src: mediaUrl, class: 'post-media', alt: 'post media', onerror: '' });

    const likeBtn = this.el('button', { class: post.liked_by_viewer ? 'icon-btn liked' : 'icon-btn' }, [
      post.liked_by_viewer ? '❤️' : '🤍',
      ` ${post.like_count}`,
    ]);
    likeBtn.addEventListener('click', async () => {
      try {
        if (post.liked_by_viewer) { await api.unlikePost(post.id); }
        else { await api.likePost(post.id); }
        post.liked_by_viewer = !post.liked_by_viewer;
        post.like_count += post.liked_by_viewer ? 1 : -1;
        likeBtn.replaceWith(this.buildLikeBtn(post));
      } catch (err) { this.toast(err.message, 'error'); }
    });

    const actions = this.el('div', { class: 'post-actions' }, [likeBtn, this.el('span', { class: 'comment-count' }, [`💬 ${post.comment_count}`])]);

    const caption = this.el('div', { class: 'post-caption' }, [
      this.el('strong', {}, [post.full_name || post.username]), ' ', post.caption || '',
    ]);

    const meta = this.el('div', { class: 'post-meta' }, [
      post.location ? `${post.location} · ` : '',
      this.timeAgo(post.created_at),
    ]);

    card.appendChild(header);
    card.appendChild(media);
    card.appendChild(actions);
    card.appendChild(caption);
    card.appendChild(meta);
    return card;
  }

  buildLikeBtn(post) {
    const likeBtn = this.el('button', { class: post.liked_by_viewer ? 'icon-btn liked' : 'icon-btn' }, [
      post.liked_by_viewer ? '❤️' : '🤍', ` ${post.like_count}`,
    ]);
    likeBtn.addEventListener('click', async () => {
      try {
        if (post.liked_by_viewer) await api.unlikePost(post.id);
        else await api.likePost(post.id);
        post.liked_by_viewer = !post.liked_by_viewer;
        post.like_count += post.liked_by_viewer ? 1 : -1;
        likeBtn.replaceWith(this.buildLikeBtn(post));
      } catch (err) { this.toast(err.message, 'error'); }
    });
    return likeBtn;
  }
}
