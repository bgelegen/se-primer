/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Seviye = 'yeni' | 'orta' | 'deneyimli';
export type Rol = 'gelistirici' | 'test' | 'urun';
export type Hedef = 'mimari' | 'test' | 'kvkk';
export type SecenekId = 'A' | 'B';
export type KararId = 'K1' | 'K2' | 'K3';

export interface OptionContent {
  id: SecenekId;
  text: string;
  minutes: number;
}

export interface DecisionContent {
  id: KararId;
  stepNum: number;
  title: string;
  narrative: string;
  roleLines: Record<Rol, string>;
  options: {
    A: OptionContent;
    B: OptionContent;
  };
  hint: string;
  tutorOpeningQuestion: string;
  targetGoal: Hedef;
  deepenText: string;
  getNeOldu: (choice: SecenekId, prevDecisions: { K1?: SecenekId; K2?: SecenekId }) => string;
  getNedenOldu: (choice: SecenekId, prevDecisions: { K1?: SecenekId; K2?: SecenekId }) => string;
}

export const ROLES: Record<Rol, { label: string; icon: string; intro: string }> = {
  gelistirici: {
    label: 'Geliştirici',
    icon: 'developer_mode',
    intro: 'Terminalin açık; deploy logları önünde akıyor.',
  },
  test: {
    label: 'Test mühendisi',
    icon: 'bug_report',
    intro: 'Dün geceki sürümün test raporu hâlâ ekranında: 212 test, 3\'ü "atlandı".',
  },
  urun: {
    label: 'Ürün yöneticisi',
    icon: 'account_tree',
    intro: 'Telefonun çalıyor: başhekim yardımcısı arıyor.',
  },
};

export const LEVELS: Record<Seviye, { label: string; icon: string; description: string }> = {
  yeni: {
    label: 'Yeni başladım',
    icon: 'lightbulb',
    description: 'İpuçları açık, süre baskısı yok',
  },
  orta: {
    label: 'Biraz deneyimliyim',
    icon: 'code',
    description: 'İpuçları isteğe bağlı, süre baskısı yok',
  },
  deneyimli: {
    label: 'Deneyimliyim',
    icon: 'lan',
    description: 'İpucu yok, karar başına 60 saniye',
  },
};

export const GOALS: Record<Hedef, { label: string; icon: string; targetDecision: KararId; lesson: string }> = {
  mimari: {
    label: 'Mimari kararları öğrenmek',
    icon: 'architecture',
    targetDecision: 'K1',
    lesson: 'Geri dönüş bir mimari özelliktir; kriz anında değil, tasarım anında kazanılır.',
  },
  test: {
    label: 'Test alışkanlığı kazanmak',
    icon: 'rule',
    targetDecision: 'K2',
    lesson: 'Kriz anında en az test edilen kod, en hızlı yazılan koddur.',
  },
  kvkk: {
    label: 'KVKK ve veri güvenliği',
    icon: 'security',
    targetDecision: 'K3',
    lesson: '"Sistem ayakta" ile "iş bitti" aynı şey değildir; veri de sistemin parçasıdır.',
  },
};

export const S0_CONTENT = {
  title: '08:00 · Randevu sistemi çöktü. Nöbetçi sensin.',
  narrative:
    'Dün gece 23:40\'ta RandevuNet\'in yeni sürümü (v2.4) yayına alındı. Bu sabah poliklinik ekranları boş, bekleme salonunda 300 hasta var.',
  buttonText: 'Krize gir',
};

export const DECISIONS: Record<KararId, DecisionContent> = {
  K1: {
    id: 'K1',
    stepNum: 1,
    title: 'Karar 1 · Mimari',
    narrative: 'Loglarda v2.4 ile gelen randevu servisinin her istekte hata verdiğini görüyorsun. Ne yaparsın?',
    roleLines: {
      gelistirici:
        'Dünkü commit\'lerin listesi önünde: 14 dosya, 1 veritabanı göçü (migration) var mı yok mu, henüz bakmadın.',
      test: 'Atlanan 3 testten biri "randevu oluştur" akışıydı.',
      urun: 'Ekip iki yol sunuyor; kararı senden bekliyorlar.',
    },
    options: {
      A: {
        id: 'A',
        text: 'Eski sürüme (v2.3) geri dön',
        minutes: 12,
      },
      B: {
        id: 'B',
        text: 'Canlıda yama yap',
        minutes: 6,
      },
    },
    hint: 'Dün gece neyin değiştiğini düşün: yalnızca kod mu, veri yapısı da mı?',
    tutorOpeningQuestion: 'Geri dönmeden önce veritabanı şemasının değişip değişmediğini nasıl anlarsın?',
    targetGoal: 'mimari',
    deepenText:
      'Geri dönüşün güvenli olması için sürümler arasında veritabanı şeması geriye uyumlu olmalı. Bu yüzden göçler (migration) "önce ekle, sonra kaldır" diye iki sürüme bölünür.',
    getNeOldu: (choice) => {
      if (choice === 'A') {
        return "v2.3'e döndün; servis 12 dakikada yeniden ayağa kalktı.";
      }
      return 'Hatalı satırı buldun ve canlı sistemde düzelttin; 6 dakika sürdü.';
    },
    getNedenOldu: (choice) => {
      if (choice === 'A') {
        return 'Geri dönüş, en son çalıştığı bilinen sürüme dönmektir: değişikliğin riskini sıfırlar ama yeni özelliği de geri alır. Dün gece veritabanı şeması değiştiyse eski sürüm yeni şemayı okuyamayabilir.';
      }
      return 'Canlıda yama hızlıdır ama denenmemiş bir değişikliği en kritik ortama koyar. Kriz anında yazılan kod, en az test edilmiş koddur.';
    },
  },
  K2: {
    id: 'K2',
    stepNum: 2,
    title: 'Karar 2 · Test',
    narrative: 'Değişiklik hazır. Bekleme salonu doluyor; "ne zaman açılıyor?" sorusu her dakika yeniden geliyor.',
    roleLines: {
      gelistirici: 'Değişikliği sen yazdın; "bende çalışıyordu" demek için iyi bir an değil.',
      test: 'Duman testi senaryoların hazır; koşturmak senin elinde.',
      urun: 'Başhekim yardımcısı ikinci kez arıyor: "On dakika daha mı?"',
    },
    options: {
      A: {
        id: 'A',
        text: 'Önce kısa test koş (randevu al, iptal et, listele)',
        minutes: 10,
      },
      B: {
        id: 'B',
        text: 'Hemen yayına al',
        minutes: 2, // If K1=B, becomes +32 in game logic
      },
    },
    hint: 'Hasta için en kritik üç işlem hangisi? Onları denemek kaç dakika sürer?',
    tutorOpeningQuestion: 'Yayına almadan önce sistemin çalıştığını gösteren en küçük kanıt ne olurdu?',
    targetGoal: 'test',
    deepenText:
      'Duman testi her şeyi değil, en kritik yolları dener: randevu al, iptal et, listele. Amaç hatasızlığı değil, "çalışmıyor" durumunu hızlı yakalamaktır.',
    getNeOldu: (choice, prev) => {
      if (choice === 'A') {
        if (prev.K1 === 'A') {
          return 'Duman testi 10 dakika sürdü; geri dönülen sürüm üç temel akışta da çalıştı.';
        }
        return 'Duman testi 10 dakika sürdü ve yamanın tarih alanını boş bıraktığını yakaladı; düzeltip yeniden koştun.';
      }
      // choice === 'B'
      if (prev.K1 === 'A') {
        return 'Eski sürüm doğrudan yayına girdi ve çalıştı — bu sefer.';
      }
      return 'Yama yayına girdi; 2 dakika sonra sistem ikinci kez çöktü: yama tarih alanını boş bırakıyordu. 30 dakika daha kaybettin.';
    },
    getNedenOldu: (choice, prev) => {
      if (choice === 'A') {
        return 'Kısa bir duman testi en kritik yolların çalıştığını yayından önce gösterir: dakika kaybettirir, saat kazandırır.';
      }
      // choice === 'B'
      if (prev.K1 === 'A') {
        return 'Testi atlamak bir bahistir: kazanırsan hız, kaybedersen ikinci kesinti. Şanslıydın; dün geceki sürüm şemayı değiştirmemişti. Değiştirseydi bunu canlıda öğrenecektin.';
      }
      return 'Testi atlamak bir bahistir: kazanırsan hız, kaybedersen ikinci kesinti.';
    },
  },
  K3: {
    id: 'K3',
    stepNum: 3,
    title: 'Karar 3 · KVKK',
    narrative:
      'Sistem ayakta. Hatanın kökünü bulmak için hata kaydını (log) ekiple paylaşman gerekiyor ama logda hasta adları ve T.C. kimlik numaraları var.',
    roleLines: {
      gelistirici: 'Logu en hızlı sen okursun ama paylaşmadan önce içinde ne olduğuna bakan da sensin.',
      test: 'Hata kaydı test ortamına değil, canlıdan geliyor; içinde gerçek kişi verisi olabilir.',
      urun: 'Ekip logu hemen istiyor; paylaşım kuralını koyan sensin.',
    },
    options: {
      A: {
        id: 'A',
        text: 'Kişisel verileri maskele, sonra paylaş',
        minutes: 3,
      },
      B: {
        id: 'B',
        text: 'Ekibe olduğu gibi at',
        minutes: 1,
      },
    },
    hint: 'Ekibin hatayı bulması için hastanın adını bilmesi gerekir mi?',
    tutorOpeningQuestion: 'Hatayı bulmak için logdaki hangi bilgiye gerçekten ihtiyaç var?',
    targetGoal: 'kvkk',
    deepenText:
      '6698 sayılı KVKK\'ya göre sağlık verisi özel nitelikli kişisel veridir. Hata ayıklamak için kimliğe değil, hata kalıbına ihtiyaç vardır: maskele, gerekeni paylaş.',
    getNeOldu: (choice) => {
      if (choice === 'A') {
        return 'Adları ve kimlik numaralarını *** ile maskeledin; 3 dakika sürdü. Ekip hatayı yine buldu.';
      }
      return 'Log, hasta adları ve kimlik numaralarıyla 14 kişilik sohbet grubuna gitti.';
    },
    getNedenOldu: (choice) => {
      if (choice === 'A') {
        return 'Hata ayıklamak için hastanın kim olduğunu bilmek gerekmez. KVKK kişisel verinin amaçla sınırlı ve ölçülü işlenmesini ister; sağlık verisi özel nitelikli veridir.';
      }
      return 'Sağlık verisi özel nitelikli kişisel veridir. Gerekmeyen kişilere açmak, sistem ayakta olsa bile bir veri ihlalidir.';
    },
  },
};

export interface EndingContent {
  tag: 'SON A · İYİ' | 'SON B · KÖTÜ';
  isGood: boolean;
  getTitle: (timeStr: string) => string;
  description: string;
}

export function getEnding(k1: SecenekId, k2: SecenekId, k3: SecenekId): EndingContent {
  const isSecondOutage = k1 === 'B' && k2 === 'B';
  const isKvkkBreach = k3 === 'B';

  if (!isKvkkBreach && !isSecondOutage) {
    return {
      tag: 'SON A · İYİ',
      isGood: true,
      getTitle: (timeStr: string) => `${timeStr} · Sistem ayakta, veri güvende`,
      description: '300 hasta randevusunu aldı; log maskelenerek paylaşıldı.',
    };
  }

  if (isKvkkBreach && !isSecondOutage) {
    return {
      tag: 'SON B · KÖTÜ',
      isGood: false,
      getTitle: () => 'Sistem ayakta ama KVKK ihlali',
      description: 'Sağlık verisi gereksiz kişilere gitti.',
    };
  }

  if (!isKvkkBreach && isSecondOutage) {
    return {
      tag: 'SON B · KÖTÜ',
      isGood: false,
      getTitle: () => 'Sistem ayakta ama ikinci kesinti yaşandı',
      description: 'Test edilmemiş yama sistemi yeniden çökertti; 300 hasta 30 dakika daha bekledi.',
    };
  }

  // Both
  return {
    tag: 'SON B · KÖTÜ',
    isGood: false,
    getTitle: () => 'İkinci kesinti ve KVKK ihlali',
    description: 'Test edilmemiş yama sistemi yeniden çökertti; 300 hasta 30 dakika daha bekledi. Sağlık verisi gereksiz kişilere gitti.',
  };
}
