// Erişilebilirlik (WCAG 2.1 A/AA, axe-core): oyunun beş ekranında ihlal olmamalı.
// Sonuçlar cypress/results/axe-*.json olarak saklanır.
const ETIKET = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } };

function denetle(ekran: string) {
  cy.readFile('node_modules/axe-core/axe.min.js').then((kaynak: string) => {
    cy.window().then(async (win: any) => {
      win.eval(kaynak);
      const sonuc = await win.axe.run(win.document, ETIKET);
      const ozet = sonuc.violations.map((v: any) => ({ id: v.id, etki: v.impact, adet: v.nodes.length, ornek: v.nodes[0]?.target }));
      cy.writeFile(`cypress/results/axe-${ekran}.json`, { ekran, kural: sonuc.passes.length, ihlal: ozet });
      expect(ozet, `${ekran}: ${JSON.stringify(ozet)}`).to.have.length(0);
    });
  });
}

describe('Erişilebilirlik (axe-core, WCAG 2.1 AA)', () => {
  it('giriş, başlangıç, sahne, sonuç paneli, son ekranı', () => {
    cy.visit('/');
    cy.get('[data-testid=giris]').should('be.visible');
    denetle('1-giris');
    cy.get('[data-testid=seviye-yeni]').click();
    cy.get('[data-testid=rol-gelistirici]').click();
    cy.get('[data-testid=hedef-test]').click();
    cy.get('[data-testid=basla]').click();
    denetle('2-baslangic');
    cy.get('[data-testid=krize-gir]').click();
    denetle('3-sahne');
    cy.get('[data-testid=secenek-A]').click();
    denetle('4-sonuc');
    cy.get('[data-testid=devam]').click();
    cy.sec('A');
    cy.sec('B');
    cy.get('[data-testid=son]').should('be.visible');
    denetle('5-son');
  });
});
