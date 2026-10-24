// Tutor'un Gemini çağrısı testlerde gerçek ağa gitmez: varsayılan olarak Sokratik bir yanıt döner.
// Bir test başka bir yanıt isterse cy.tutorYaniti("...") ile değiştirir.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      tutorYaniti(metin: string): Chainable<null>;
      profil(seviye: 'yeni' | 'orta' | 'deneyimli', rol?: 'gelistirici' | 'test' | 'urun', hedef?: 'mimari' | 'test' | 'kvkk'): Chainable<void>;
      sec(harf: 'A' | 'B'): Chainable<void>;
    }
  }
}

const gemini = (text: string) => ({
  candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP', index: 0 }],
  usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10, totalTokenCount: 20 },
});

Cypress.Commands.add('tutorYaniti', (metin: string) => {
  return cy.intercept({ method: 'POST', url: /generativelanguage\.googleapis\.com/ }, (req) => {
    if (/stream/i.test(req.url)) {
      req.reply({ statusCode: 200, headers: { 'content-type': 'text/event-stream' }, body: `data: ${JSON.stringify(gemini(metin))}\r\n\r\n` });
    } else {
      req.reply({ statusCode: 200, body: gemini(metin) });
    }
  }).as('gemini');
});

beforeEach(() => {
  cy.tutorYaniti('İyi bir başlangıç. Dün gece tam olarak neyin değiştiğini nereden öğrenebilirsin?');
});

Cypress.Commands.add('profil', (seviye, rol = 'gelistirici', hedef = 'test') => {
  cy.visit('/');
  cy.get('[data-testid=giris]').should('be.visible');
  cy.get(`[data-testid=seviye-${seviye}]`).click();
  cy.get(`[data-testid=rol-${rol}]`).click();
  cy.get(`[data-testid=hedef-${hedef}]`).click();
  cy.get('[data-testid=basla]').should('be.enabled').click();
  cy.get('[data-testid=krize-gir]').click();
});

Cypress.Commands.add('sec', (harf) => {
  cy.get(`[data-testid=secenek-${harf}]`).click();
  cy.get('[data-testid=sonuc]').should('be.visible');
  cy.get('[data-testid=ne-oldu]').should('not.be.empty');
  cy.get('[data-testid=neden-oldu]').should('not.be.empty');
  cy.get('[data-testid=devam]').click();
});

export {};
