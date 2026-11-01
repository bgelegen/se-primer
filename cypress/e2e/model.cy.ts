// spec §13.5 — Nöbet Arkadaşı: KÖ-7, KÖ-8, KÖ-9 (diferansiyel/parite testi) ve model yokken regresyon.
// Oyuncunun temposu cy.clock ile belirlenir (Date ve sayaç sahte, model indirmesi gerçek).
// Model, uygulamanın kullandığı yerden indirilir: Hugging Face'te commit'e sabit URL (app/src/model.ts).
// Oracle çıktısı (tests/parite.json) çalışma anında okunur: model yayınlanmadan dosya yoktur.

const MODEL_BEKLE = { timeout: 30_000 };
const pDegeri = () => cy.get('[data-cy=p]', MODEL_BEKLE).should(($p) => expect($p.text()).to.match(/^\d\.\d+$/)).invoke('text').then(Number);

function k2yeGel(seviye: 'orta' | 'deneyimli', giris: number, kriz: number, k1Sure: number, k1: 'A' | 'B') {
  cy.clock(Date.UTC(2026, 10, 1, 7, 0, 0), ['Date', 'setInterval', 'clearInterval']);
  cy.visit('/');
  cy.get(`[data-testid=seviye-${seviye}]`).click();
  cy.get('[data-testid=rol-gelistirici]').click();
  cy.get('[data-testid=hedef-mimari]').click();
  cy.tick(giris * 1000);
  cy.get('[data-testid=basla]').click();
  cy.tick(kriz * 1000);
  cy.get('[data-testid=krize-gir]').click();
  // K1 gölge mod: p hesaplanır ama oyun değişmez
  if (seviye === 'deneyimli') cy.get('[data-testid=geri-sayim]').should('contain', '60');
  else cy.get('[data-testid=ipucu-goster]').should('exist');
  cy.get('[data-cy=p]', MODEL_BEKLE).should(($p) => expect($p.text()).to.match(/^\d\.\d+$/));
  cy.get('[data-testid=nobet-arkadasi]').should('not.exist');
  cy.tick(k1Sure * 1000);
  cy.get(`[data-testid=secenek-${k1}]`).click();
  cy.get('[data-testid=devam]').click();
  cy.get('[data-testid=ilerleme]').should('contain', '2/3');
}

describe('Nöbet Arkadaşı (spec §13.5)', () => {
  before(function () {
    // Model yayınlanmadan (gerçek veri gelmeden) bu testler anlamsızdır: atlanır, CI bunu not eder.
    if (!Cypress.expose('modelYayinda')) this.skip();
  });

  it('KÖ-7 · Aceleci oyuncuya K2\'de Nöbet Arkadaşı: kart görünür, soruyla biter, ipucu kendiliğinden açık', () => {
    k2yeGel('orta', 8, 1.5, 4, 'B');
    pDegeri().should('be.gte', 0.5);
    cy.get('[data-testid=nobet-arkadasi]').should('be.visible').invoke('text').should('match', /\?\s*$/);
    cy.get('[data-testid=ipucu]').should('be.visible');
    cy.get('[data-testid=ipucu-goster]').should('not.exist');
  });

  it('KÖ-8 · Dikkatli oyuncuda K2 değişmez: kart yok, geri sayım 60', () => {
    k2yeGel('deneyimli', 40, 45, 30, 'A');
    pDegeri().should('be.lt', 0.5);
    cy.get('[data-testid=nobet-arkadasi]').should('not.exist');
    cy.get('[data-testid=geri-sayim]').should('contain', '60');
  });

  it('KÖ-9a · Diferansiyel test: uygulama (onnxruntime-web) = Python Oracle, |fark| < 1e-4', () => {
    cy.readFile('tests/parite_referanslar.json').then((referanslar: { id: string }[]) => {
      cy.readFile('tests/parite.json').then((parite) => {
        expect(parite.referanslar.map((r) => r.id), 'Oracle aynı referans girdileri kullanıyor').to.deep.equal(referanslar.map((r) => r.id));
        cy.visit('/?parite=1', { onBeforeLoad: (win) => ((win as any).__PARITE__ = parite.referanslar) });
        cy.get('[data-testid=parite][data-durum=hazir]', MODEL_BEKLE);
        cy.get('[data-cy=p]').should('have.length', parite.referanslar.length).each(($p, i) => {
          const r = parite.referanslar[i];
          const fark = Math.abs(Number($p.text()) - r.p_python);
          cy.log(`${r.id}: uygulama ${$p.text()} · python ${r.p_python} · fark ${fark.toExponential(2)}`);
          expect(fark, r.id).to.be.lessThan(parite.tolerans);
        });
        // Kanıt: iki tüketicinin değerleri yan yana
        cy.get('[data-cy=p]').then(($ps) => {
          const satirlar = parite.referanslar.map((r, i) => ({ id: r.id, p_python: r.p_python, p_uygulama: Number($ps[i].innerText), fark: Math.abs(Number($ps[i].innerText) - r.p_python) }));
          cy.writeFile('cypress/results/parite-uygulama.json', { tolerans: parite.tolerans, satirlar });
        });
      });
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
