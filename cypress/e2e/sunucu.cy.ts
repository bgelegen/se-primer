// Bonus · üç tüketici aynı sayı: tarayıcı (onnxruntime-web), Python Oracle ve canlı sunucu (FastAPI, Render).
// Sunucu adresi server/YAYIN_URL'den okunur; yoksa test atlanır.
describe('Sunucu tüketicisi (bonus)', () => {
  before(function () {
    if (!Cypress.expose('sunucuUrl') || !Cypress.expose('modelYayinda')) this.skip();
  });

  it('aynı 5 referans girdide sunucu = Python Oracle = tarayıcı (|Δ| < 1e-4)', () => {
    const url = Cypress.expose('sunucuUrl');
    cy.readFile('tests/parite.json').then((parite) => {
      const girdiler = parite.referanslar.map((r) => r.girdi);
      // Ücretsiz katmanda sunucu uyuyor olabilir: uyanması için uzun zaman aşımı
      cy.request({ method: 'POST', url: `${url}/api/v1/tahmin`, body: { inputs: girdiler }, timeout: 120_000 }).then((yanit) => {
        expect(yanit.body.model_sha256).to.equal(parite.model_sha256);
        cy.visit('/?parite=1', { onBeforeLoad: (win) => ((win as any).__PARITE__ = parite.referanslar) });
        cy.get('[data-testid=parite][data-durum=hazir]', { timeout: 30_000 });
        cy.get('[data-cy=p]').each(($p, i) => {
          const r = parite.referanslar[i];
          const tarayici = Number($p.text());
          const sunucu = yanit.body.p[i];
          cy.log(`${r.id}: python ${r.p_python} · tarayıcı ${tarayici} · sunucu ${sunucu}`);
          expect(Math.abs(sunucu - r.p_python), `${r.id} sunucu↔python`).to.be.lessThan(parite.tolerans);
          expect(Math.abs(sunucu - tarayici), `${r.id} sunucu↔tarayıcı`).to.be.lessThan(parite.tolerans);
        });
      });
    });
  });
});
