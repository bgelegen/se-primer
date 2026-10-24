// 60 saniyelik demo videosu bu koşudan çıkar (cypress/videos/zz_demo.cy.ts.mp4).
// Bekleme süreleri yalnızca izleyicinin okuyabilmesi içindir.
const yavas = (ms = 1600) => cy.wait(ms);

describe('Demo · bir oyuncunun sabahı', () => {
  it('yeni başlayan geliştirici: tutor, kötü son, tekrar, iyi son', () => {
    cy.tutorYaniti('Güzel soru. Dün geceki sürümle birlikte bir veritabanı göçü (migration) çalıştı mı, bunu nereden kontrol edersin?');
    cy.visit('/');
    yavas(1500);
    cy.get('[data-testid=seviye-yeni]').click(); yavas(600);
    cy.get('[data-testid=rol-gelistirici]').click(); yavas(600);
    cy.get('[data-testid=hedef-test]').click(); yavas(900);
    cy.get('[data-testid=basla]').click(); yavas(3200);
    cy.get('[data-testid=krize-gir]').click(); yavas(2500);

    cy.get('[data-testid=tutor-girdi]').type('Hangisi doğru, söyler misin?', { delay: 45 });
    cy.get('[data-testid=tutor-gonder]').click(); yavas(3200);
    cy.get('[data-testid=secenek-A]').click(); yavas(3800);
    cy.get('[data-testid=devam]').click(); yavas(2500);

    cy.get('[data-testid=secenek-A]').click(); yavas(4200);
    cy.get('[data-testid=devam]').click(); yavas(2500);

    cy.get('[data-testid=secenek-B]').click(); yavas(3500);
    cy.get('[data-testid=devam]').click(); yavas(4200);
    cy.get('[data-testid=son-etiket]').should('contain', 'KÖTÜ');

    cy.get('[data-testid=tekrar-oyna]').click(); yavas(1200);
    cy.get('[data-testid=krize-gir]').click(); yavas(800);
    ['A', 'A', 'A'].forEach((h) => {
      cy.get(`[data-testid=secenek-${h}]`).click(); yavas(1100);
      cy.get('[data-testid=devam]').click(); yavas(900);
    });
    cy.get('[data-testid=son-etiket]').should('contain', 'İYİ');
    yavas(4500);
  });
});
