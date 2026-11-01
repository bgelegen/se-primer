# Veri sözlüğü · `data/oturumlar.csv`

Her satır **bir karar**dır (bir oyunda 3 karar: K1 mimari, K2 test, K3 KVKK). Bir oturum = bir oyun.
Satırları uygulama üretir (`app/src/olcum.ts`, veri toplama modu `?toplama=1`); sentetik satırları
`tools/sentetik_uret.py` aynı tanımla üretir. `tools/veri_hazirla.py` satırları birleştirir, aralıkları
doğrular, yarım oturumları ve otomasyon satırlarını atar. Yayınlanan model (v2.0.0) yalnız `kaynak = gercek`
satırlarla eğitildi; sentetik satırlar yalnız denemelerde kullanıldı (`--sentetik`, DENEYLER.md).

**Gerçek oturumlar:** 60 oturum, uygulamanın veri toplama modunda kaydedildi; ölçümü uygulamanın kodu yaptı.
Ham dosyalar: `data/gercek/`. Kim oynadığı `oynayan` sütunundadır.

**Model girdisi** sütununda ✅ olanlar karar ekranı **açıldığı anda** bilinen değerlerdir ve
`model/config.json → features` sırasıyla modele girer. ❌ olanlar karar verildikten sonra bilinir;
modele girmez (girerse sızıntı olur), yalnız etiket ve analiz içindir.

| Sütun | Anlamı | Birim / değerler | Aralık | Model girdisi |
|-------|--------|------------------|--------|:---:|
| `oturum_id` | Oyunun rastgele kimliği. Her "Tekrar oyna"da yenilenir; kişiye bağlanamaz | 12 hex karakter (gerçek) · `s0000` (sentetik) | | ❌ |
| `kaynak` | Satırın kaynağı | `gercek` · `sentetik` (`otomasyon` olanlar eğitime girmez) | | ❌ |
| `oynayan` | Oyunu kim oynadı | `insan` · `yz_ajan` · `kural` (sentetik) | | ❌ |
| `uygulama_surumu` | Satırı üreten uygulama sürümü | `2.0.0` · `sentetik-1` | | ❌ |
| `rol` | Girişte seçilen rol | `gelistirici` · `test` · `urun` | | ❌ |
| `hedef` | Girişte seçilen hedef | `mimari` · `test` · `kvkk` | | ❌ |
| `karar_id` | Hangi karar | `K1` · `K2` · `K3` | | ❌ |
| `seviye_no` | Girişte beyan edilen seviye | 0 yeni başladım · 1 biraz deneyimliyim · 2 deneyimliyim | 0–2 | ✅ |
| `sahne_no` | Kararın sırası | 1–3 | 1–3 | ✅ |
| `hedef_bu_sahne` | Oyuncunun hedefi bu kararın konusu mu (K1↔mimari, K2↔test, K3↔kvkk) | 0/1 | 0–1 | ✅ |
| `giris_suresi_sn` | Giriş ekranı açılışından "Nöbete başla"ya kadar geçen süre | saniye, 0,1 çözünürlük | 0–600 | ✅ |
| `kriz_okuma_sn` | Kriz (S0) ekranından "Krize gir"e kadar geçen süre | saniye | 0–600 | ✅ |
| `onceki_riskli` | Bu oyunda önceki kararlarda B (hızlı/riskli) seçme sayısı | adet | 0–2 | ✅ |
| `onceki_ort_karar_sn` | Önceki kararların ortalama düşünme süresi; ilk kararda 0 | saniye | 0–120 | ✅ |
| `onceki_ipucu` | Önceki kararların kaçında ipucu görüldü (seviye "yeni"de ipucu hep açıktır) | adet | 0–2 | ✅ |
| `onceki_tutor` | Önceki kararlarda tutor'a yazılan mesaj sayısı (metin değil, sayı) | adet | 0–20 | ✅ |
| `onceki_sure_doldu` | Önceki kararların kaçında 60 sn doldu (yalnız deneyimli) | adet | 0–2 | ✅ |
| `secim` | Verilen karar | `A` · `B` | | ❌ |
| `riskli_secim` | **Etiket.** `secim = B` ise 1 (süre dolup B uygulandıysa da) | 0/1 | 0–1 | ❌ hedef |
| `karar_suresi_sn` | Karar ekranı açılışından seçime kadar geçen süre | saniye | 0–600 | ❌ |
| `sure_doldu` | Bu kararda süre doldu mu | 0/1 | 0–1 | ❌ |
| `ipucu_bu_sahne` | Bu kararda ipucu görüldü mü | 0/1 | 0–1 | ❌ |
| `tutor_bu_sahne` | Bu kararda tutor'a yazılan mesaj sayısı | adet | ≥ 0 | ❌ |
| `model_p` | O an çalışan modelin verdiği olasılık; veri toplama sırasında model yoktu → boş | 0–1 | | ❌ |
| `model_mudahale` | Nöbet Arkadaşı bu kararda devreye girdi mi | 0/1 | 0–1 | ❌ |

## Toplanmayanlar (KVKK)

Ad, e-posta, telefon, cihaz kimliği, IP, konum, tarayıcı bilgisi, tam zaman damgası ve tutor'a yazılan
metin **toplanmaz**. Veri yalnız oyuncunun cihazında (`localStorage`) durur; oyuncu "Veri" ekranından
CSV'yi kendisi indirip gönderir. Veri toplama modu kapalıyken hiçbir satır yazılmaz; açıkken giriş
ekranında bunu söyleyen bir not ve "Bu oyunu kaydet" kutusu vardır.

## Sentetik veri kuralı (yalnız denemeler)

`tools/sentetik_uret.py`, tohum **13**, 240 oturum (`--surum 1`: ilk kural, `--surum 2`: seviye varsayımı kaldırılmış). Her sanal oyuncunun gizli bir "acele" değeri
`a ~ N(0,1)` vardır; profil seçme ve okuma süreleri `a` arttıkça kısalır, riskli seçim olasılığı
`a`, önceki riskli seçimler ve bu kararın hedefle ilgisiyle değişir. Formüller dosyanın başında yazılı.
Sentetik satırlar modelin öğrenebileceği bir kural içerir; bu yüzden gerçek satırlar ayrıca ölçülür
(spec §13.4, E2).

## Ham gerçek veri

`data/gercek/*.csv`: uygulamanın "Veri" ekranından indirildiği gibi, değiştirilmeden saklanır.
