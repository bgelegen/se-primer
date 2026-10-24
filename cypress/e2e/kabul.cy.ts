// spec.md §9 — beş kabul örneği, her biri bir test.

describe('Kabul örnekleri (spec §9)', () => {
  it('KÖ-1 · Yeni başlayana her kararda ipucu, süre yok; hedef rozeti doğru kararda', () => {
    cy.profil('yeni', 'gelistirici', 'test');
    ['K1', 'K2', 'K3'].forEach((k, i) => {
      cy.get('[data-testid=ilerleme]').should('contain', `${i + 1}/3`);
      cy.get('[data-testid=ipucu]').should('be.visible').and('not.be.empty');
      cy.get('[data-testid=geri-sayim]').should('not.exist');
      if (k === 'K2') cy.get('[data-testid=hedef-rozeti]').should('be.visible');
      else cy.get('[data-testid=hedef-rozeti]').should('not.exist');
      cy.sec('A');
    });
    cy.get('[data-testid=son]').should('be.visible');
  });

  it('KÖ-2 · Deneyimliye 60 saniye; süre dolunca hızlı seçenek (B) uygulanır', () => {
    cy.clock();
    cy.profil('deneyimli');
    cy.get('[data-testid=geri-sayim]').should('contain', '60');
    cy.get('[data-testid=ipucu]').should('not.exist');
    cy.get('[data-testid=ipucu-goster]').should('not.exist');
    cy.tick(30_000);
    cy.get('[data-testid=geri-sayim]').should('contain', '30');
    cy.tick(30_000);
    cy.get('[data-testid=sonuc]').should('be.visible');
    cy.get('[data-testid=sure-doldu]').should('contain', 'Süre doldu');
    cy.get('[data-testid=ne-oldu]').should('contain', 'canlı');
    cy.get('[data-testid=saat]').should('contain', '08:06');
  });

  it('KÖ-3 · İyi son: geri dön, test et, maskele → 08:25', () => {
    cy.profil('orta', 'test', 'mimari');
    cy.sec('A');
    cy.sec('A');
    cy.sec('A');
    cy.get('[data-testid=son-etiket]').should('contain', 'SON A · İYİ');
    cy.get('[data-testid=son-baslik]').should('contain', '08:25').and('contain', 'Sistem ayakta, veri güvende');
  });

  it('KÖ-4 · Logu olduğu gibi atan kötü sona gider (KVKK ihlali)', () => {
    cy.profil('orta', 'urun', 'kvkk');
    cy.sec('A');
    cy.sec('B');
    cy.sec('B');
    cy.get('[data-testid=son-etiket]').should('contain', 'SON B · KÖTÜ');
    cy.get('[data-testid=son]').should('contain', 'KVKK ihlali');
  });

  it('KÖ-5 · Tutor cevabı ele vermez (model ele verse bile koruma katmanı engeller)', () => {
    // Önce modelin cevabı ele verdiği en kötü durumu taklit et.
    cy.tutorYaniti('Doğru cevap A seçeneği, eski sürüme geri dönmelisin.');
    cy.profil('orta');
    cy.get('[data-testid=tutor-girdi]').type('Doğru cevap hangisi, A mı B mi?');
    cy.get('[data-testid=tutor-gonder]').click();
    cy.get('[data-testid=tutor-yanit]').last().invoke('text').then((t) => {
      const yanit = t.replace('🛡', '').trim();
      expect(yanit).to.match(/\?$/);
      expect(yanit).not.to.match(/doğru (cevap|seçenek|şık)/i);
      expect(yanit).not.to.match(/\b[AB] seçeneği/i);
      expect(yanit).not.to.contain('Eski sürüme (v2.3) geri dön');
      expect(yanit).not.to.contain('Canlıda yama yap');
    });
    cy.get('[data-testid=tutor-yanit]').last().should('contain', '🛡');
  });
  it('KÖ-6 · Son ekranında oyuncu kendi yolunu haritada görür', () => {
    cy.profil('orta');
    cy.sec('A');
    cy.sec('A');
    cy.sec('B');
    cy.get('[data-testid=yol-haritasi]').should('be.visible');
    cy.get('[data-testid=yol-K1-A]').should('have.attr', 'data-secili', 'true');
    cy.get('[data-testid=yol-K2-A]').should('have.attr', 'data-secili', 'true');
    cy.get('[data-testid=yol-K3-B]').should('have.attr', 'data-secili', 'true');
    ['K1-B', 'K2-B', 'K3-A'].forEach((d) => cy.get(`[data-testid=yol-${d}]`).should('have.attr', 'data-secili', 'false'));
    cy.get('[data-testid=yol-kotu]').should('have.attr', 'data-secili', 'true');
    cy.get('[data-testid=yol-iyi]').should('have.attr', 'data-secili', 'false');
    cy.get('[data-testid=yol-ozet]').should('contain', "8 olası yoldan 3'ü iyi sona çıkar").and('contain', 'A → A → B');
  });
});
