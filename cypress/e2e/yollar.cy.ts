// spec.md §6–§7 — 8 yolun tamamı: son ve saat.
const YOLLAR: Array<[string, 'İYİ' | 'KÖTÜ', string, string?]> = [
  ['AAA', 'İYİ', '08:25'],
  ['AAB', 'KÖTÜ', '08:23', 'KVKK ihlali'],
  ['ABA', 'İYİ', '08:17'],
  ['ABB', 'KÖTÜ', '08:15', 'KVKK ihlali'],
  ['BAA', 'İYİ', '08:19'],
  ['BAB', 'KÖTÜ', '08:17', 'KVKK ihlali'],
  ['BBA', 'KÖTÜ', '08:41', 'ikinci kesinti'],
  ['BBB', 'KÖTÜ', '08:39', 'İkinci kesinti ve KVKK ihlali'],
];

describe('Tüm yollar (8 yol × 2 son)', () => {
  YOLLAR.forEach(([yol, son, saat, neden]) => {
    it(`${yol} → ${son} · ${saat}`, () => {
      cy.profil('orta', 'gelistirici', 'mimari');
      [...yol].forEach((h) => cy.sec(h as 'A' | 'B'));
      cy.get('[data-testid=son-etiket]').should('contain', son === 'İYİ' ? 'SON A · İYİ' : 'SON B · KÖTÜ');
      cy.get('[data-testid=saat]').should('contain', saat);
      if (neden) cy.get('[data-testid=son]').should('contain', neden);
      // "Senin yolun" haritası: yalnızca izlenen düğümler ve ulaşılan son seçili
      [...yol].forEach((h, i) => {
        const k = `K${i + 1}`;
        const diger = h === 'A' ? 'B' : 'A';
        cy.get(`[data-testid=yol-${k}-${h}]`).should('have.attr', 'data-secili', 'true');
        cy.get(`[data-testid=yol-${k}-${diger}]`).should('have.attr', 'data-secili', 'false');
      });
      cy.get(`[data-testid=yol-${son === 'İYİ' ? 'iyi' : 'kotu'}]`).should('have.attr', 'data-secili', 'true');
      cy.get(`[data-testid=yol-${son === 'İYİ' ? 'kotu' : 'iyi'}]`).should('have.attr', 'data-secili', 'false');
      cy.get('[data-testid=yol-ozet]').should('contain', [...yol].join(' → '));
    });
  });

  it('BB yolunda K2 sonucu ikinci çöküşü anlatır', () => {
    cy.profil('orta');
    cy.sec('B');
    cy.get('[data-testid=secenek-B]').click();
    cy.get('[data-testid=ne-oldu]').should('contain', 'ikinci kez çöktü');
  });
});

describe('Giriş ve dönüşler', () => {
  it('üç seçim yapılmadan "Nöbete başla" pasif', () => {
    cy.visit('/');
    cy.get('[data-testid=basla]').should('be.disabled');
    cy.get('[data-testid=seviye-yeni]').click();
    cy.get('[data-testid=rol-test]').click();
    cy.get('[data-testid=basla]').should('be.disabled');
    cy.get('[data-testid=hedef-kvkk]').click();
    cy.get('[data-testid=basla]').should('be.enabled');
  });

  it('rol anlatıyı değiştirir', () => {
    cy.profil('orta', 'test', 'test');
    cy.get('[data-testid=rol-satiri]').should('contain', 'Atlanan 3 testten biri');
    cy.visit('/');
    cy.profil('orta', 'urun', 'test');
    cy.get('[data-testid=rol-satiri]').should('contain', 'kararı senden bekliyorlar');
  });

  it('orta seviyede ipucu düğmenin arkasında', () => {
    cy.profil('orta');
    cy.get('[data-testid=ipucu]').should('not.exist');
    cy.get('[data-testid=ipucu-goster]').click();
    cy.get('[data-testid=ipucu]').should('be.visible');
  });

  it('hedefe göre Derinleş paragrafı ve Bugünün dersi', () => {
    cy.profil('orta', 'gelistirici', 'kvkk');
    cy.sec('A');
    cy.sec('A');
    cy.get('[data-testid=hedef-rozeti]').should('be.visible');
    cy.get('[data-testid=secenek-A]').click();
    cy.get('[data-testid=derinles]').should('contain', '6698');
    cy.get('[data-testid=devam]').click();
    cy.get('[data-testid=son-ders]').should('contain', 'veri de sistemin parçasıdır');
  });

  it('Tekrar oyna profili korur, Profili değiştir girişe döner', () => {
    cy.profil('yeni');
    cy.sec('A'); cy.sec('A'); cy.sec('A');
    cy.get('[data-testid=tekrar-oyna]').click();
    cy.get('[data-testid=krize-gir]').click();
    cy.get('[data-testid=ipucu]').should('be.visible');
    cy.get('[data-testid=saat]').should('contain', '08:00');
    cy.sec('A'); cy.sec('A'); cy.sec('A');
    cy.get('[data-testid=profili-degistir]').click();
    cy.get('[data-testid=giris]').should('be.visible');
    cy.get('[data-testid=basla]').should('be.disabled');
  });

  it('tutor çevrimdışıyken yedek soru gelir ve oyun sürer', () => {
    cy.intercept({ method: 'POST', url: /generativelanguage\.googleapis\.com/ }, { forceNetworkError: true });
    cy.profil('orta');
    cy.get('[data-testid=tutor-girdi]').type('Şema değişti mi nasıl anlarım?');
    cy.get('[data-testid=tutor-gonder]').click();
    cy.get('[data-testid=tutor-yanit]').last().should('contain', 'veritabanı şemasının');
    cy.sec('A');
    cy.get('[data-testid=ilerleme]').should('contain', '2/3');
  });

  it('360 px genişlikte yatay kaydırma yok', () => {
    cy.viewport(360, 740);
    cy.profil('yeni');
    cy.document().then((d) => expect(d.documentElement.scrollWidth).to.be.at.most(360));
  });
});
