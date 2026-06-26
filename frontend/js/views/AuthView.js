// js/views/AuthView.js
import { BaseView } from './BaseView.js';
import { api } from '../services/api.js';
import { store } from '../services/store.js';

export class AuthView extends BaseView {
  constructor(container, param) {
    super(container, param);
    this.mode = 'login'; // 'login' | 'register'
    this.accountType = 'individual'; // 'individual' | 'organization'
  }

  render() {
    this.container.appendChild(this.buildForm());
  }

  buildForm() {
    const wrap = this.el('div', { class: 'auth-wrap' });

    const tabs = this.el('div', { class: 'auth-tabs' }, [
      this.el('button', {
        class: this.mode === 'login' ? 'tab active' : 'tab',
        onClick: () => { this.mode = 'login'; this.refresh(); },
      }, ['Log In']),
      this.el('button', {
        class: this.mode === 'register' ? 'tab active' : 'tab',
        onClick: () => { this.mode = 'register'; this.refresh(); },
      }, ['Sign Up']),
    ]);

    wrap.appendChild(this.el('div', { class: 'auth-logo' }, ['🌾 Farmers Connect']));
    wrap.appendChild(tabs);

    if (this.mode === 'login') wrap.appendChild(this.buildLoginForm());
    else wrap.appendChild(this.buildRegisterForm());

    return wrap;
  }

  refresh() {
    this.container.innerHTML = '';
    this.render();
  }

  buildLoginForm() {
    const email = this.el('input', { type: 'email', placeholder: 'Email', class: 'input', id: 'login-email' });
    const password = this.el('input', { type: 'password', placeholder: 'Password', class: 'input', id: 'login-password' });
    const submit = this.el('button', { class: 'btn btn-primary' }, ['Log In']);
    const error = this.el('div', { class: 'form-error' });

    submit.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const { token, user } = await api.login({ email: email.value, password: password.value });
        api.setToken(token);
        store.setUser(user);
        window.location.hash = '/feed';
        location.reload();
      } catch (err) {
        error.textContent = err.message;
      }
    });

    return this.el('form', { class: 'auth-form' }, [email, password, error, submit]);
  }

  buildRegisterForm() {
    const fullName = this.el('input', { class: 'input', placeholder: 'Full name', id: 'r-fullname' });
    const username = this.el('input', { class: 'input', placeholder: 'Username', id: 'r-username' });
    const email = this.el('input', { type: 'email', class: 'input', placeholder: 'Email', id: 'r-email' });
    const password = this.el('input', { type: 'password', class: 'input', placeholder: 'Password', id: 'r-password' });
    const location_ = this.el('input', { class: 'input', placeholder: 'Location (e.g. Nakuru, Kenya)', id: 'r-location' });

    // -- Account type selector: the key "identify yourself" requirement --
    const typeLabel = this.el('div', { class: 'field-label' }, ['I am registering as:']);
    const individualBtn = this.el('button', { type: 'button', class: 'choice-btn active', id: 'choice-individual' }, ['👤 Individual Farmer']);
    const orgBtn = this.el('button', { type: 'button', class: 'choice-btn', id: 'choice-org' }, ['🏢 Organization (NGO / Co-op / Agribusiness)']);

    const orgFields = this.el('div', { class: 'org-fields hidden', id: 'org-fields' });
    const orgCategory = this.el('select', { class: 'input' }, [
      this.el('option', { value: 'NGO' }, ['NGO']),
      this.el('option', { value: 'Cooperative' }, ['Cooperative']),
      this.el('option', { value: 'Government' }, ['Government Body']),
      this.el('option', { value: 'Agribusiness' }, ['Agribusiness']),
      this.el('option', { value: 'Other' }, ['Other']),
    ]);
    const orgWebsite = this.el('input', { class: 'input', placeholder: 'Organization website (optional)' });
    orgFields.appendChild(orgCategory);
    orgFields.appendChild(orgWebsite);

    individualBtn.addEventListener('click', () => {
      this.accountType = 'individual';
      individualBtn.classList.add('active');
      orgBtn.classList.remove('active');
      orgFields.classList.add('hidden');
    });
    orgBtn.addEventListener('click', () => {
      this.accountType = 'organization';
      orgBtn.classList.add('active');
      individualBtn.classList.remove('active');
      orgFields.classList.remove('hidden');
    });

    const submit = this.el('button', { class: 'btn btn-primary' }, ['Create account']);
    const error = this.el('div', { class: 'form-error' });

    submit.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          full_name: fullName.value,
          username: username.value,
          email: email.value,
          password: password.value,
          location: location_.value,
          account_type: this.accountType,
        };
        if (this.accountType === 'organization') {
          payload.org_category = orgCategory.value;
          payload.org_website = orgWebsite.value;
        }
        const { token, user } = await api.register(payload);
        api.setToken(token);
        store.setUser(user);
        window.location.hash = '/feed';
        location.reload();
      } catch (err) {
        error.textContent = err.message;
      }
    });

    return this.el('form', { class: 'auth-form' }, [
      fullName, username, email, password, location_,
      typeLabel,
      this.el('div', { class: 'choice-row' }, [individualBtn, orgBtn]),
      orgFields,
      error, submit,
    ]);
  }
}
