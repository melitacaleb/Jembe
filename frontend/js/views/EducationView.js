// js/views/EducationView.js
import { BaseView } from './BaseView.js';
import { api } from '../services/api.js';
import { store } from '../services/store.js';

const CATEGORIES = ['Soil Health', 'Irrigation', 'Livestock', 'Crop Protection', 'Finance & Markets', 'Climate Resilience', 'General'];

export class EducationView extends BaseView {
  async render() {
    const wrap = this.el('div', { class: 'education-wrap' });
    this.mount(wrap);

    wrap.appendChild(this.el('h2', { class: 'section-title' }, ['📚 Education']));
    wrap.appendChild(this.el('p', { class: 'section-sub' }, [
      'Learn directly from NGOs, cooperatives, and agricultural organizations.',
    ]));

    const user = store.getUser();
    if (user && user.account_type === 'organization') {
      wrap.appendChild(this.buildCourseForm());
    }

    const grid = this.el('div', { class: 'course-grid', id: 'course-grid' });
    wrap.appendChild(grid);

    try {
      const { courses } = await api.getCourses();
      if (!courses.length) grid.appendChild(this.el('div', { class: 'empty-state' }, ['No courses published yet.']));
      courses.forEach((c) => grid.appendChild(this.buildCourseCard(c)));
    } catch (err) {
      grid.appendChild(this.el('div', { class: 'empty-state' }, [err.message]));
    }
  }

  buildCourseForm() {
    const box = this.el('div', { class: 'composer' });
    box.appendChild(this.el('div', { class: 'field-label' }, ['Publish a course (organization account)']));
    const title = this.el('input', { class: 'input', placeholder: 'Course title' });
    const category = this.el('select', { class: 'input' }, CATEGORIES.map((c) => this.el('option', { value: c }, [c])));
    const cover = this.el('input', { class: 'input', placeholder: 'Cover image URL' });
    const content = this.el('input', { class: 'input', placeholder: 'Content URL (video / PDF / article link)' });
    const desc = this.el('textarea', { class: 'input', placeholder: 'Description', rows: '2' });
    const error = this.el('div', { class: 'form-error' });
    const submit = this.el('button', { class: 'btn btn-primary' }, ['Publish Course']);

    submit.addEventListener('click', async () => {
      try {
        await api.createCourse({
          title: title.value, category: category.value,
          cover_url: cover.value, content_url: content.value, description: desc.value,
        });
        window.location.reload();
      } catch (err) {
        error.textContent = err.message;
      }
    });

    [title, category, cover, content, desc, error, submit].forEach((n) => box.appendChild(n));
    return box;
  }

  buildCourseCard(c) {
    const card = this.el('div', { class: 'course-card' });
    const img = this.el('img', { src: c.cover_url || 'icons/icon-192.png', class: 'course-img' });
    const cat = this.el('span', { class: 'badge-cat' }, [c.category]);
    const title = this.el('div', { class: 'course-title' }, [c.title]);
    const provider = this.el('div', { class: 'course-provider' }, [`By ${c.provider_name}`]);
    const desc = this.el('p', { class: 'course-desc' }, [c.description || '']);

    const enrollBtn = this.el('button', { class: 'btn btn-secondary btn-sm' }, ['Enroll']);
    enrollBtn.addEventListener('click', async () => {
      try {
        await api.enrollCourse(c.id);
        this.toast('Enrolled! Find it under your learning progress.', 'success');
      } catch (err) { this.toast(err.message, 'error'); }
    });

    const openBtn = this.el('a', { href: c.content_url, target: '_blank', class: 'btn btn-link btn-sm' }, ['View material']);

    card.appendChild(img);
    card.appendChild(cat);
    card.appendChild(title);
    card.appendChild(provider);
    card.appendChild(desc);
    card.appendChild(enrollBtn);
    card.appendChild(openBtn);
    return card;
  }
}
