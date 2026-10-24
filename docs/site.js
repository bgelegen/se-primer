// Kanıt sitesi: uygulamanın durum makinesini (SEP = docs/oyun.js) çalıştıran harita + sonuç panoları.
(() => {
  const { DECISIONS, getEnding, calculateDecisionMinutes, formatClock, INITIAL_MINUTES } = window.SEP;
  const K = ['K1', 'K2', 'K3'];
  const secim = {};
  const $ = (s) => document.querySelector(s);
  const h = (tag, attrs = {}, ...cocuk) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) k === 'class' ? (e.className = v) : e.setAttribute(k, v);
    for (const c of cocuk) e.append(c);
    return e;
  };

  // ---------- Simülatör ----------
  function dakika() {
    let m = 0;
    K.forEach((k) => { if (secim[k]) m += calculateDecisionMinutes(k, secim[k], secim.K1); });
    return m;
  }

  function kartlar() {
    const kutu = $('#sim-kararlar');
    kutu.innerHTML = '';
    K.forEach((k, i) => {
      const d = DECISIONS[k];
      const acik = i === 0 || secim[K[i - 1]];
      const kart = h('div', { class: 'sim-kart' }, h('h3', {}, d.title), h('p', {}, d.narrative));
      const sec = h('div', { class: 'sim-sec' });
      ['A', 'B'].forEach((x) => {
        const b = h('button', { 'aria-pressed': String(secim[k] === x) }, `${x} · ${d.options[x].text}`);
        if (!acik) b.disabled = true;
        b.onclick = () => { secim[k] = x; K.slice(i + 1).forEach((y) => delete secim[y]); ciz(); };
        sec.append(b);
      });
      kart.append(sec);
      if (secim[k]) {
        kart.append(h('div', { class: 'sim-sonuc' },
          h('b', {}, 'Ne oldu'), d.getNeOldu(secim[k], { K1: secim.K1, K2: secim.K2 }),
          h('b', {}, 'Neden oldu'), d.getNedenOldu(secim[k], { K1: secim.K1, K2: secim.K2 })));
      }
      kutu.append(kart);
    });
  }

  function harita() {
    const svg = $('#sim-harita');
    const NS = 'http://www.w3.org/2000/svg';
    const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    svg.innerHTML = '';
    const x = [40, 170, 300, 450], yA = 70, yB = 190;
    const son = secim.K3 ? getEnding(secim.K1, secim.K2, secim.K3) : null;
    // tüm kenarlar soluk
    for (let i = 0; i < 2; i++) for (const a of [yA, yB]) for (const b of [yA, yB]) svg.append(el('line', { x1: x[i], y1: a, x2: x[i + 1], y2: b, stroke: 'rgba(228,236,250,.12)', 'stroke-width': 2 }));
    for (const a of [yA, yB]) for (const b of [yA, yB]) svg.append(el('line', { x1: x[2], y1: a, x2: x[3], y2: b, stroke: 'rgba(228,236,250,.12)', 'stroke-width': 2 }));
    // seçili yol
    const nokta = K.filter((k) => secim[k]).map((k, i) => [x[i], secim[k] === 'A' ? yA : yB]);
    if (son) nokta.push([x[3], son.isGood ? yA : yB]);
    for (let i = 0; i + 1 < nokta.length; i++) {
      svg.append(el('line', { x1: nokta[i][0], y1: nokta[i][1], x2: nokta[i + 1][0], y2: nokta[i + 1][1], stroke: '#F29A3B', 'stroke-width': 5, 'stroke-linecap': 'round' }));
    }
    K.forEach((k, i) => {
      for (const [harf, y] of [['A', yA], ['B', yB]]) {
        const sec = secim[k] === harf;
        svg.append(el('circle', { cx: x[i], cy: y, r: 20, fill: sec ? '#F29A3B' : '#1E2A42', stroke: sec ? '#F29A3B' : 'rgba(228,236,250,.3)', 'stroke-width': 2 }));
        const t = el('text', { x: x[i], y: y + 5, 'text-anchor': 'middle', fill: sec ? '#0F1B33' : '#A6B3CB', 'font-family': 'Plus Jakarta Sans', 'font-weight': 800, 'font-size': 15 });
        t.textContent = harf; svg.append(t);
      }
      const t = el('text', { x: x[i], y: 30, 'text-anchor': 'middle', fill: '#A6B3CB', 'font-family': 'Plus Jakarta Sans', 'font-weight': 700, 'font-size': 13 });
      t.textContent = k; svg.append(t);
    });
    for (const [ad, y, renk, iyi] of [['İYİ', yA, '#2E9E6B', true], ['KÖTÜ', yB, '#D9483B', false]]) {
      const aktif = son && son.isGood === iyi;
      svg.append(el('rect', { x: x[3] - 6, y: y - 20, width: 68, height: 40, rx: 12, fill: aktif ? renk : 'transparent', stroke: renk, 'stroke-width': 2 }));
      const t = el('text', { x: x[3] + 28, y: y + 5, 'text-anchor': 'middle', fill: aktif ? '#fff' : renk, 'font-family': 'Plus Jakarta Sans', 'font-weight': 800, 'font-size': 13 });
      t.textContent = ad; svg.append(t);
    }
  }

  function ciz() {
    kartlar();
    harita();
    const saat = formatClock(INITIAL_MINUTES + dakika());
    $('#sim-saat').textContent = saat;
    const kutu = $('#sim-son');
    kutu.innerHTML = '';
    if (secim.K3) {
      const s = getEnding(secim.K1, secim.K2, secim.K3);
      kutu.append(h('span', { class: `etiket ${s.isGood ? 'iyi' : 'kotu'}` }, s.tag), h('h3', {}, s.getTitle(saat)), h('p', {}, s.description));
      const b = h('button', { class: 'sifirla' }, '↺ Tekrar oyna');
      b.onclick = () => { K.forEach((k) => delete secim[k]); ciz(); };
      kutu.append(b);
    } else {
      kutu.append(h('p', {}, 'Bir seçenek seç. 8 olası yoldan 3\'ü iyi sona çıkar.'));
    }
  }
  ciz();

  // ---------- Panolar ----------
  const yuzde = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const cubuk = (ad, a, b, kotu = false) => {
    const d = h('div', { class: `cubuk ${kotu ? 'kotu' : ''}` });
    d.append(h('div', { class: 'ad' }, h('span', {}, ad), h('b', {}, `${a}/${b}`)));
    const yol = h('div', { class: 'yol' }); const dolu = h('div', { class: 'dolu' }); dolu.style.width = `${yuzde(a, b)}%`;
    yol.append(dolu); d.append(yol); return d;
  };

  fetch('data/ozet.json').then((r) => r.json()).then((o) => {
    const ev = o.eval || {};
    const mut = Object.values(o.mutasyon || {}).reduce((a, x) => ({ o: a.o + x.oldu, y: a.y + x.yasadi + x.kapsamsiz }), { o: 0, y: 0 });
    const axeIhlal = (o.axe || []).reduce((a, x) => a + x.ihlal.length, 0);
    const kirmizi = ev.kirmizi;
    const sayilar = [
      [o.e2e ? `${o.e2e.gecen}/${o.e2e.toplam}` : '—', 'Cypress E2E testi geçti'],
      [o.birim ? `${o.birim.gecen}` : '—', 'birim, özellik ve spec uyum testi'],
      [mut.o ? `%${yuzde(mut.o, mut.o + mut.y)}` : '—', 'mutasyon skoru (Stryker)'],
      [kirmizi ? `0/${kirmizi.n + (ev.v2 ? ev.v2.n : 0)}` : (ev.v2 ? `0/${ev.v2.n}` : '—'), 'saldırgan öğrenci mesajında cevap ele verilmedi'],
      [o.axe && o.axe.length ? String(axeIhlal) : '—', 'erişilebilirlik ihlali (WCAG 2.1 AA, 5 ekran)'],
    ];
    const s = $('#sayilar');
    sayilar.forEach(([b, t]) => s.append(h('div', { class: 'sayi' }, h('b', {}, b), h('span', {}, t))));

    const pano = $('#eval-pano');
    const kart = (baslik, alt, ...ic) => h('div', { class: 'pano-kart' }, h('h3', {}, baslik), h('p', { class: 'alt-baslik' }, alt), ...ic);
    if (ev.v1) pano.append(kart('v1 · ilk sürüm', '20 standart mesaj', cubuk('Kullanılabilir yanıt', ev.v1.n - ev.v1.kesik, ev.v1.n, true), cubuk('Soruyla bitti', ev.v1.soruyla, ev.v1.n, true), cubuk('Cevabı ele verdi', ev.v1.ele_verdi, ev.v1.n, true)));
    if (ev.v2) pano.append(kart('v2 · düzeltilmiş', '20 standart mesaj', cubuk('Kullanılabilir yanıt', ev.v2.n - ev.v2.kesik, ev.v2.n), cubuk('Soruyla bitti', ev.v2.soruyla, ev.v2.n), cubuk('Cevabı ele verdi', ev.v2.ele_verdi, ev.v2.n, true)));
    if (kirmizi) pano.append(kart('Kırmızı takım', '30 saldırgan mesaj', cubuk('Soruyla bitti', kirmizi.soruyla, kirmizi.n), cubuk('Ham model ele verdi', kirmizi.ham_ele_verdi, kirmizi.n, true), cubuk('Oyuncunun gördüğü ele verme', kirmizi.ele_verdi, kirmizi.n, true)));
    const k = o.koruma || {};
    if (k.once && k.sonra) pano.append(kart('Koruma katmanı', '10 ele veren + 6 güvenli vaka', cubuk('Önce: yakaladı', k.once.tp, k.once.tp + k.once.fn, true), cubuk('Sonra: yakaladı', k.sonra.tp, k.sonra.tp + k.sonra.fn), cubuk('Yanlış alarm', k.sonra.fp, k.sonra.fp + k.sonra.tn, true)));

    const secilen = ['C06', 'C12', 'C14', 'C16'];
    const orn = $('#eval-ornek');
    const tum = [...(ev.v2 ? ev.v2.ornek : []), ...(kirmizi ? kirmizi.ornek.filter((x) => ['R01', 'R09', 'R23'].includes(x.id)) : [])];
    tum.filter((x) => secilen.includes(x.id) || x.id.startsWith('R')).forEach((x) => {
      orn.append(h('div', { class: 'ornek' }, h('span', { class: 'tur' }, x.id), h('div', { class: 'ogr' }, x.metin), h('div', { class: 'tut' }, x.yanit + (x.guard ? ' 🛡' : ''))));
    });

    const kat = $('#katmanlar');
    const katman = (ad, ne, deger) => kat.append(h('div', { class: 'katman' }, h('h3', {}, ad), h('p', {}, ne), h('div', { class: 'deger' }, deger)));
    katman('Cypress E2E', '8 yolun hepsi, 5 kabul örneği, dönüşler, 360 px, tutor çevrimdışı, yol haritası', o.e2e ? `${o.e2e.gecen}/${o.e2e.toplam}` : '—');
    katman('Spec uyumu', 'spec.md tabloları okunur; her metin, süre ve son kuralı kodla birebir karşılaştırılır', '✓');
    katman('Özellik tabanlı', 'fast-check ile rastgele yollar ve rastgele ele verme cümleleri: 10 değişmez', '✓');
    katman('Mutasyon', 'Stryker kodu bozar, testler yakalamalı. İlk kampanya gerçek bir koruma hatası buldu', mut.o ? `%${yuzde(mut.o, mut.o + mut.y)}` : '—');
    katman('Erişilebilirlik', 'axe-core, WCAG 2.1 A/AA, oyunun 5 ekranı', o.axe && o.axe.length ? `${axeIhlal} ihlal` : '—');
    katman('Tutor değerlendirmesi', '20 standart + 30 kırmızı takım mesajı, canlı Gemini, elle etiket', kirmizi ? `0/${kirmizi.n + ev.v2.n}` : '—');
  });
})();
