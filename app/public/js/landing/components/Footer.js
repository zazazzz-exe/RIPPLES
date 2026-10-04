// Footer: navigation, official sources, sample-data notice and photo credits.
import { html } from '../../ui.js';
import { OFFICIAL } from '../copy.js';

export function render(vm) {
  return html`
    <footer class="footer">
      <div class="wrap">
        <div class="cols">
          <div>
            <a class="logo" href="#top"><img class="logo-img" src="/img/brand/ripples-logo.png" srcset="/img/brand/ripples-logo.png 1x, /img/brand/ripples-logo@2x.png 2x" alt="Ripples" width="119" height="40"><small>Climate defense map</small></a>
            <p>Making public climate-defense and infrastructure projects easy to find, follow and understand.</p>
          </div>
          <div><h4>Explore</h4><ul>
            <li><a href="#map" data-act="map">Project map</a></li><li><a href="/map">3D explorer</a></li>
            <li><a href="/ops">Transparency scorecard</a></li>
            <li><a href="/ledger">Record ledger</a></li></ul></div>
          <div><h4>Learn</h4><ul>
            <li><a href="#how">How it works</a></li><li><a href="#status">Project statuses</a></li>
            <li><a href="#about">About</a></li><li><a href="#faq">FAQ</a></li></ul></div>
          <div><h4>Official sources</h4><ul>${OFFICIAL.map((o) => html`<li><a href="${o.url}" target="_blank" rel="noopener">${o.name} ↗</a></li>`)}</ul></div>
        </div>
        <div class="legal">
          <p><b style="color:#fff">Sample data.</b> Every project, figure and report on this site is sample data that shows how Ripples works. Real city and office names are used for illustration only and do not describe the actual status of any LGU, DPWH, DENR or MMDA project. For warnings and evacuation orders, always follow PAGASA, NDRRMC and your local government.</p>
          <details><summary>Photo credits (${vm.credits.photos.length + vm.projectPhotos.length})</summary>
            <p style="margin:10px 0 0">${vm.credits.note}</p>
            <div class="credits">${vm.credits.photos.map((p) => html`<div>“${p.title}” by ${p.author || 'unknown'} · <a href="${p.license_url || p.source}" target="_blank" rel="noopener">${p.license}</a> · <a href="${p.source}" target="_blank" rel="noopener">source</a> · ${p.changes}</div>`)}
              ${vm.projectPhotos.map((p) => html`<div>Project reference: “${p.title}” · ${p.source} · ${p.license_url ? html`<a href="${p.license_url}" target="_blank" rel="noopener">${p.license_note}</a>` : p.license_note}${p.source_url ? html` · <a href="${p.source_url}" target="_blank" rel="noopener">source</a>` : ''} · Resized</div>`)}</div>
          </details>
        </div>
      </div>
    </footer>`;
}

export function enhance(root, _vm, ctx) {
  root.querySelector('.footer [data-act="map"]').addEventListener('click', (e) => { e.preventDefault(); ctx.goToMap(); });
}
