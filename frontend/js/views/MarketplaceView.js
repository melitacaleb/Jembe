// js/views/MarketplaceView.js
import { BaseView } from './BaseView.js';
import { api } from '../services/api.js';

const CATEGORIES = ['Seeds', 'Livestock', 'Produce', 'Equipment', 'Fertilizer', 'Other'];

export class MarketplaceView extends BaseView {
  async render() {
    const wrap = this.el('div', { class: 'marketplace-wrap' });
    this.mount(wrap);

    wrap.appendChild(this.el('h2', { class: 'section-title' }, ['🛒 Marketplace']));
    wrap.appendChild(this.buildListingForm());

    const filterRow = this.el('div', { class: 'filter-row' });
    const search = this.el('input', { class: 'input', placeholder: 'Search products...' });
    const catSelect = this.el('select', { class: 'input' }, [
      this.el('option', { value: '' }, ['All categories']),
      ...CATEGORIES.map((c) => this.el('option', { value: c }, [c])),
    ]);
    const searchBtn = this.el('button', { class: 'btn btn-secondary' }, ['Search']);
    filterRow.appendChild(search);
    filterRow.appendChild(catSelect);
    filterRow.appendChild(searchBtn);
    wrap.appendChild(filterRow);

    const grid = this.el('div', { class: 'product-grid', id: 'product-grid' });
    wrap.appendChild(grid);

    const loadProducts = async () => {
      grid.innerHTML = '';
      const params = new URLSearchParams();
      if (search.value) params.set('search', search.value);
      if (catSelect.value) params.set('category', catSelect.value);
      try {
        const { products } = await api.getProducts(`?${params.toString()}`);
        if (!products.length) grid.appendChild(this.el('div', { class: 'empty-state' }, ['No listings found.']));
        products.forEach((p) => grid.appendChild(this.buildProductCard(p)));
      } catch (err) {
        grid.appendChild(this.el('div', { class: 'empty-state' }, [err.message]));
      }
    };

    searchBtn.addEventListener('click', loadProducts);
    await loadProducts();
  }

  buildListingForm() {
    const box = this.el('div', { class: 'composer' });
    box.appendChild(this.el('div', { class: 'field-label' }, ['List a product for sale']));
    const title = this.el('input', { class: 'input', placeholder: 'Product title (e.g. "50kg Maize - Grade 1")' });
    const category = this.el('select', { class: 'input' }, CATEGORIES.map((c) => this.el('option', { value: c }, [c])));
    const price = this.el('input', { type: 'number', class: 'input', placeholder: 'Price' });
    const currency = this.el('input', { class: 'input', placeholder: 'Currency (e.g. KES)', value: 'KES' });
    const quantity = this.el('input', { type: 'number', class: 'input', placeholder: 'Quantity', value: '1' });
    const unit = this.el('input', { class: 'input', placeholder: 'Unit (kg, bag, head...)' });
    const location = this.el('input', { class: 'input', placeholder: 'Location' });
    const media = this.el('input', { class: 'input', placeholder: 'Image URL' });
    const desc = this.el('textarea', { class: 'input', placeholder: 'Description', rows: '2' });
    const error = this.el('div', { class: 'form-error' });
    const submit = this.el('button', { class: 'btn btn-primary' }, ['List Product']);

    submit.addEventListener('click', async () => {
      try {
        await api.createProduct({
          title: title.value, category: category.value, price: Number(price.value),
          currency: currency.value, quantity: Number(quantity.value), unit: unit.value,
          location: location.value, description: desc.value,
          media_urls: media.value ? [media.value.trim()] : [],
        });
        window.location.reload();
      } catch (err) {
        error.textContent = err.message;
      }
    });

    [title, category, price, currency, quantity, unit, location, media, desc, error, submit]
      .forEach((node) => box.appendChild(node));
    return box;
  }

  buildProductCard(p) {
    const card = this.el('div', { class: 'product-card' });
    const img = this.el('img', { src: (p.media_urls && p.media_urls[0]) || 'icons/icon-192.png', class: 'product-img' });
    const title = this.el('div', { class: 'product-title' }, [p.title]);
    const price = this.el('div', { class: 'product-price' }, [`${p.currency} ${Number(p.price).toLocaleString()} / ${p.unit}`]);
    const seller = this.el('div', { class: 'product-seller' }, [
      `${p.full_name || p.username}`,
      p.account_type === 'organization' ? this.el('span', { class: 'badge-org' }, ['ORG']) : '',
    ]);
    const loc = this.el('div', { class: 'product-loc' }, [p.location || '']);

    const orderBtn = this.el('button', { class: 'btn btn-secondary btn-sm' }, ['Order']);
    orderBtn.addEventListener('click', async () => {
      try {
        await api.orderProduct(p.id, 1);
        this.toast('Order placed! The seller will be notified.', 'success');
      } catch (err) {
        this.toast(err.message, 'error');
      }
    });

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(price);
    card.appendChild(seller);
    card.appendChild(loc);
    card.appendChild(orderBtn);
    return card;
  }
}
