// spec §13.5 — Nöbet Arkadaşı: KÖ-7, KÖ-8, KÖ-9 (diferansiyel/parite testi) ve model yokken regresyon.
// Oyuncunun temposu cy.clock ile belirlenir (Date ve sayaç sahte, model indirmesi gerçek).
// Model, uygulamanın kullandığı yerden indirilir: Hugging Face'te commit'e sabit URL (app/src/model.ts).
import referanslar from '../../tests/parite_referanslar.json';
import parite from '../../tests/parite.json';

const MODEL_BEKLE = { timeout: 30_000 };
const pDegeri = () => cy.get('[data-cy=p]', MODEL_BEKLE).should(($p) => expect($p.text()).to.match(/^\d\.\d+$/)).invoke('text').then(Number);

function k2yeGel(giris: number, kriz: number, k1Sure: number, k1: 'A' | 'B') {
  cy.clock(Date.UTC(2026, 10, 1, 7, 0, 0), ['Date', 'setInterval', 'clearInterval']);
  cy.visit('/');
  cy.get('[data-testid=seviye-deneyimli]').click();
  cy.get('[data-testid=rol-gelistirici]').click();
  cy.get('[data-testid=hedef-mimari]').click();
  cy.tick(giris * 1000);
  cy.get('[data-testid=basla]').click();
  cy.tick(kriz * 1000);
  cy.get('[data-testid=krize-gir]').click();
  // K1 gölge mod: p hesaplanır ama oyun değişmez (KÖ-2 ile aynı ekran)
  cy.get('[data-testid=geri-sayim]').should('contain', '60');
  cy.get('[data-testid=nobet-arkadasi]').should('not.exist');
  cy.tick(k1Sure * 1000);
  cy.get(`[data-testid=secenek-${k1}]`).click();
  cy.get('[data-testid=devam]').click();
  cy.get('[data-testid=ilerleme]').should('contain', '2/3');
}

describe('Nöbet Arkadaşı (spec §13.5)', () => {
  it('KÖ-7 · Aceleci oyuncuya K2\'de Nöbet Arkadaşı: kart görünür, soruyla biter, geri sayım kalkar', () => {
    k2yeGel(3, 2, 4, 'B');
    pDegeri().should('be.gte', 0.5);
    cy.get('[data-testid=nobet-arkadasi]').should('be.visible').invoke('text').should('match', /\?\s*(Süre sayacını durdurdum; acele etme\.)?$/);
    cy.get('[data-testid=geri-sayim]').should('not.exist');
  });

  it('KÖ-8 · Dikkatli oyuncuda K2 değişmez: kart yok, geri sayım 60', () => {
    k2yeGel(40, 45, 30, 'A');
    pDegeri().should('be.lt', 0.5);
    cy.get('[data-testid=nobet-arkadasi]').should('not.exist');
    cy.get('[data-testid=geri-sayim]').should('contain', '60');
  });

  it('KÖ-9a · Diferansiyel test: uygulama (onnxruntime-web) = Python Oracle, |fark| < 1e-4', () => {
    expect(parite.referanslar.map((r) => r.id)).to.deep.equal(referanslar.map((r) => r.id));
    cy.visit('/?parite=1', { onBeforeLoad: (win) => ((win as any).__PARITE__ = parite.referanslar) });
    cy.get('[data-testid=parite][data-durum=hazir]', MODEL_BEKLE);
    cy.get('[data-cy=p]').should('have.length', parite.referanslar.length).each(($p, i) => {
      const r = parite.referanslar[i];
      const fark = Math.abs(Number($p.text()) - r.p_python);
      cy.log(`${r.id}: uygulama ${$p.text()} · python ${r.p_python} · fark ${fark.toExponential(2)}`);
      expect(fark, r.id).to.be.lessThan(parite.tolerans);
    });
  });

  it('KÖ-9b · Model indirilemezse oyun v1 kurallarıyla sonuna kadar oynanır ve p "—" gösterilir', () => {
    cy.intercept({ url: /huggingface\.co/ }, { forceNetworkError: true });
    cy.profil('deneyimli', 'gelistirici', 'mimari');
    cy.get('[data-cy=p]').should('have.text', '—');
    cy.get('[data-testid=secenek-B]').click();
    cy.get('[data-testid=devam]').click();
    cy.get('[data-testid=geri-sayim]').should('exist');
    cy.get('[data-testid=nobet-arkadasi]').should('not.exist');
    cy.get('[data-cy=p]').should('have.text', '—');
    cy.sec('B');
    cy.sec('B');
    cy.get('[data-testid=son-etiket]').should('contain', 'SON B · KÖTÜ');
  });
});
