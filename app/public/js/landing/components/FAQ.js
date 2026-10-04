// Accessible accordion: buttons with aria-expanded controlling answer regions.
import { html } from '../../ui.js';
import { FAQ } from '../copy.js';

export function render() {
  return html`
    <section class="section" id="faq" aria-labelledby="faqTitle">
      <div class="wrap">
        <p class="eyebrow" data-reveal style="justify-content:center">FAQ</p>
        <h2 id="faqTitle" data-reveal style="--d:80ms;text-align:center">Questions, answered plainly.</h2>
        <div class="faq">
          ${FAQ.map((f, i) => html`<div class="faq-item" data-reveal style="--d:${i * 50}ms">
            <h3><button class="faq-q" type="button" aria-expanded="false" aria-controls="faq-a${i}" id="faq-q${i}">${f.q}<span class="pm" aria-hidden="true"></span></button></h3>
            <div class="faq-a" id="faq-a${i}" role="region" aria-labelledby="faq-q${i}"><div><p>${f.a}</p></div></div>
          </div>`)}
        </div>
      </div>
    </section>`;
}

export function enhance(root) {
  root.querySelector('#faq .faq').addEventListener('click', (e) => {
    const q = e.target.closest('.faq-q');
    if (!q) return;
    const open = q.getAttribute('aria-expanded') !== 'true';
    q.setAttribute('aria-expanded', String(open));
    q.closest('.faq-item').classList.toggle('open', open);
  });
}
