-- Migration 0007: Add Turkish translations for NIST CSF 2.0 controls
-- Adds name_tr and description_tr columns to csf_functions, csf_categories, and csf_subcategories

-- ============================================================================
-- ADD COLUMNS
-- ============================================================================

ALTER TABLE csf_functions ADD COLUMN name_tr TEXT;
ALTER TABLE csf_functions ADD COLUMN description_tr TEXT;

ALTER TABLE csf_categories ADD COLUMN name_tr TEXT;
ALTER TABLE csf_categories ADD COLUMN description_tr TEXT;

ALTER TABLE csf_subcategories ADD COLUMN name_tr TEXT;
ALTER TABLE csf_subcategories ADD COLUMN description_tr TEXT;

-- ============================================================================
-- CSF FUNCTIONS - Turkish Translations
-- ============================================================================

UPDATE csf_functions SET name_tr = 'Yonetisim', description_tr = 'Kurumsal siber guvenlik risk yonetim stratejisi, beklentiler ve politikalar olusturulur, iletilir ve izlenir.' WHERE id = 'GV';
UPDATE csf_functions SET name_tr = 'Tanimlama', description_tr = 'Kurulusun mevcut siber guvenlik riskleri anlasilir.' WHERE id = 'ID';
UPDATE csf_functions SET name_tr = 'Koruma', description_tr = 'Kurulusun siber guvenlik risklerini yonetmek icin guvenlik onlemleri kullanilir.' WHERE id = 'PR';
UPDATE csf_functions SET name_tr = 'Tespit', description_tr = 'Olasi siber guvenlik saldirilari ve ihlalleri tespit edilir ve analiz edilir.' WHERE id = 'DE';
UPDATE csf_functions SET name_tr = 'Mudahale', description_tr = 'Tespit edilen siber guvenlik olaylarina yonelik aksiyonlar alinir.' WHERE id = 'RS';
UPDATE csf_functions SET name_tr = 'Kurtarma', description_tr = 'Siber guvenlik olayindan etkilenen varliklar ve operasyonlar yeniden hizmete alinir.' WHERE id = 'RC';

-- ============================================================================
-- CSF CATEGORIES - Turkish Translations
-- ============================================================================

-- GOVERN (GV) categories
UPDATE csf_categories SET name_tr = 'Organizasyonel Baglam', description_tr = 'Kurulusun siber guvenlik risk yonetimi kararlarina iliskin kosullar - misyon, paydas beklentileri, bagimliliklar ve yasal/duzenleyici gereksinimler - anlasilir.' WHERE id = 'GV.OC';
UPDATE csf_categories SET name_tr = 'Risk Yonetim Stratejisi', description_tr = 'Kurulusun oncelikleri, kisitlamalari, risk toleransi ve risk istahi beyanlari ile varsayimlari belirlenir, iletilir ve operasyonel risk kararlarini desteklemek icin kullanilir.' WHERE id = 'GV.RM';
UPDATE csf_categories SET name_tr = 'Roller, Sorumluluklar ve Yetkiler', description_tr = 'Hesap verebilirlik, performans degerlendirmesi ve surekli iyilestirmeyi desteklemek icin siber guvenlik rolleri, sorumluluklari ve yetkileri belirlenir ve iletilir.' WHERE id = 'GV.RR';
UPDATE csf_categories SET name_tr = 'Politika', description_tr = 'Kurumsal siber guvenlik politikasi olusturulur, iletilir ve uygulanir.' WHERE id = 'GV.PO';
UPDATE csf_categories SET name_tr = 'Denetim ve Gozetim', description_tr = 'Kurum genelinde siber guvenlik risk yonetimi faaliyetlerinin ve performansinin sonuclari, risk yonetim stratejisini bilgilendirmek, iyilestirmek ve ayarlamak icin kullanilir.' WHERE id = 'GV.OV';
UPDATE csf_categories SET name_tr = 'Siber Guvenlik Tedarik Zinciri Risk Yonetimi', description_tr = 'Siber tedarik zinciri risk yonetim surecleri kurumsal paydaslar tarafindan tanimlanir, olusturulur, yonetilir, izlenir ve iyilestirilir.' WHERE id = 'GV.SC';

-- IDENTIFY (ID) categories
UPDATE csf_categories SET name_tr = 'Varlik Yonetimi', description_tr = 'Kurulusun is amaclarini gerceklestirmesini saglayan varliklar (veri, donanim, yazilim, sistemler, tesisler, hizmetler, kisiler) tanimlanir ve kurumsal hedeflere ve risk stratejisine gore yonetilir.' WHERE id = 'ID.AM';
UPDATE csf_categories SET name_tr = 'Risk Degerlendirmesi', description_tr = 'Kurulusa, varliklara ve bireylere yonelik siber guvenlik riski kurulus tarafindan anlasilir.' WHERE id = 'ID.RA';
UPDATE csf_categories SET name_tr = 'Iyilestirme', description_tr = 'Kurumsal siber guvenlik risk yonetimi surecleri, prosedurler ve faaliyetlerdeki iyilestirmeler tum CSF Fonksiyonlarinda tanimlanir.' WHERE id = 'ID.IM';
UPDATE csf_categories SET name_tr = 'Yonetisim', description_tr = 'Kurulusun siber guvenlik risk yonetim programi olusturulur ve yonetilir.' WHERE id = 'ID.GV';
UPDATE csf_categories SET name_tr = 'Tedarik Zinciri Risk Yonetimi', description_tr = 'Kurulusun tedarik zinciri tanimlanir, tedarik zinciri riski degerlendirilir ve yonetilir.' WHERE id = 'ID.SC';

-- PROTECT (PR) categories
UPDATE csf_categories SET name_tr = 'Kimlik Yonetimi, Kimlik Dogrulama ve Erisim Kontrolu', description_tr = 'Fiziksel ve mantiksal varliklara erisim, yetkili kullanicilar, hizmetler ve donanim ile sinirlandirilir ve yetkisiz erisim riskine uygun sekilde yonetilir.' WHERE id = 'PR.AA';
UPDATE csf_categories SET name_tr = 'Farkindalik ve Egitim', description_tr = 'Kurulus personeline siber guvenlik farkindalik ve egitimi saglanir, boylece siber guvenlikle ilgili gorevlerini yerine getirebilirler.' WHERE id = 'PR.AT';
UPDATE csf_categories SET name_tr = 'Veri Guvenligi', description_tr = 'Veriler, bilginin gizliligini, butunlugunu ve erisilebilirligini korumak icin kurulusun risk stratejisine uygun sekilde yonetilir.' WHERE id = 'PR.DS';
UPDATE csf_categories SET name_tr = 'Platform Guvenligi', description_tr = 'Fiziksel ve sanal platformlarin donanim, yazilim ve hizmetleri kurulusun risk stratejisine uygun sekilde yonetilerek gizlilik, butunluk ve erisilebilirlikleri korunur.' WHERE id = 'PR.PS';
UPDATE csf_categories SET name_tr = 'Teknoloji Altyapisi Dayanikliligi', description_tr = 'Guvenlik mimarileri, varlik gizliligi, butunlugu ve erisilebilirligi ile kurumsal dayanikliligi korumak icin kurulusun risk stratejisine uygun sekilde yonetilir.' WHERE id = 'PR.IR';

-- DETECT (DE) categories
UPDATE csf_categories SET name_tr = 'Surekli Izleme', description_tr = 'Varliklar, anomalileri, ihlal gostergelerini ve diger potansiyel olumsuz olaylari bulmak icin izlenir.' WHERE id = 'DE.CM';
UPDATE csf_categories SET name_tr = 'Olumsuz Olay Analizi', description_tr = 'Anomaliler, ihlal gostergeleri ve diger potansiyel olumsuz olaylar, olaylari karakterize etmek ve siber guvenlik olaylarini tespit etmek icin analiz edilir.' WHERE id = 'DE.AE';
UPDATE csf_categories SET name_tr = 'Tespit Surecleri', description_tr = 'Tespit surecleri ve prosedurler, anormal olaylarin farkindaligin saglanmasi icin surduruulur ve test edilir.' WHERE id = 'DE.DP';

-- RESPOND (RS) categories
UPDATE csf_categories SET name_tr = 'Olay Yonetimi', description_tr = 'Tespit edilen siber guvenlik olaylarina verilen yanit yonetilir.' WHERE id = 'RS.MA';
UPDATE csf_categories SET name_tr = 'Olay Analizi', description_tr = 'Etkili mudahaleyi saglamak ve adli bilisim ile kurtarma faaliyetlerini desteklemek icin sorusturmalar yurutulur.' WHERE id = 'RS.AN';
UPDATE csf_categories SET name_tr = 'Olay Mudahale Raporlama ve Iletisim', description_tr = 'Mudahale faaliyetleri, yasalar, duzenlemeler veya politikalarin gerektirdigi sekilde ic ve dis paydaslarla koordine edilir.' WHERE id = 'RS.CO';

-- RECOVER (RC) categories
UPDATE csf_categories SET name_tr = 'Kurtarma Planlamasi', description_tr = 'Kurtarma surecleri ve prosedurler, siber guvenlik olaylarindan etkilenen sistem veya varliklarin yeniden hizmete alinmasini saglamak icin yurutulur ve surduruulur.' WHERE id = 'RC.RP';
UPDATE csf_categories SET name_tr = 'Iyilestirmeler', description_tr = 'Kurtarma planlamasi ve surecleri, alinan derslerin gelecekteki faaliyetlere dahil edilmesiyle iyilestirilir.' WHERE id = 'RC.IM';
UPDATE csf_categories SET name_tr = 'Iletisim', description_tr = 'Yeniden hizmete alma faaliyetleri ic ve dis taraflarla koordine edilir.' WHERE id = 'RC.CO';

-- ============================================================================
-- CSF SUBCATEGORIES - Turkish Translations
-- ============================================================================

-- GOVERN: Organizational Context (GV.OC)
UPDATE csf_subcategories SET name_tr = 'Kurumsal Misyon', description_tr = 'Kurumsal misyon anlasilir ve siber guvenlik risk yonetimini yonlendirir.' WHERE id = 'GV.OC-01';
UPDATE csf_subcategories SET name_tr = 'Paydas Beklentileri', description_tr = 'Ic ve dis paydaslar anlasilir, siber guvenlik risk yonetimine iliskin ihtiyac ve beklentileri degerlendirilir ve dikkate alinir.' WHERE id = 'GV.OC-02';
UPDATE csf_subcategories SET name_tr = 'Yasal ve Duzenleyici Gereksinimler', description_tr = 'Siber guvenlige iliskin yasal, duzenleyici ve sozlesmesel gereksinimler - gizlilik ve sivil ozgurluk yukumlulukleri dahil - anlasilir ve yonetilir.' WHERE id = 'GV.OC-03';
UPDATE csf_subcategories SET name_tr = 'Kritik Hedefler ve Hizmetler', description_tr = 'Paydaslarin kurulusa bagimli oldugu veya beklentisi olan kritik hedefler, yetenekler ve hizmetler anlasilir ve iletilir.' WHERE id = 'GV.OC-04';
UPDATE csf_subcategories SET name_tr = 'Dis Bagimliliklar', description_tr = 'Kurulusun bagimli oldugu sonuclar, yetenekler ve hizmetler anlasilir ve iletilir.' WHERE id = 'GV.OC-05';

-- GOVERN: Risk Management Strategy (GV.RM)
UPDATE csf_subcategories SET name_tr = 'Risk Yonetim Hedefleri', description_tr = 'Risk yonetim hedefleri belirlenir ve kurumsal paydaSlarca uzerinde uzlasilir.' WHERE id = 'GV.RM-01';
UPDATE csf_subcategories SET name_tr = 'Risk Istahi ve Toleransi', description_tr = 'Risk istahi ve risk toleransi beyanlari olusturulur, iletilir ve surduruulur.' WHERE id = 'GV.RM-02';
UPDATE csf_subcategories SET name_tr = 'Kurumsal Risk Yonetimine Entegrasyon', description_tr = 'Siber guvenlik risk yonetimi faaliyetleri ve sonuclari kurumsal risk yonetim sureclerine dahil edilir.' WHERE id = 'GV.RM-03';
UPDATE csf_subcategories SET name_tr = 'Stratejik Yon', description_tr = 'Uygun risk mudahale seceneklerini tanimlayan stratejik yon belirlenir ve iletilir.' WHERE id = 'GV.RM-04';
UPDATE csf_subcategories SET name_tr = 'Iletisim Kanallari', description_tr = 'Tedarikci ve ucuncu taraf riskleri dahil olmak uzere siber guvenlik riskleri icin kurum genelinde iletisim kanallari olusturulur.' WHERE id = 'GV.RM-05';
UPDATE csf_subcategories SET name_tr = 'Risk Hesaplama Yontemi', description_tr = 'Siber guvenlik risklerini hesaplamak, belgelemek, siniflandirmak ve onceliklendirmek icin standart bir yontem olusturulur ve iletilir.' WHERE id = 'GV.RM-06';
UPDATE csf_subcategories SET name_tr = 'Stratejik Firsatlar', description_tr = 'Stratejik firsatlar (pozitif riskler) tanimlanir ve kurumsal siber guvenlik risk tartismalarina dahil edilir.' WHERE id = 'GV.RM-07';

-- GOVERN: Roles, Responsibilities, and Authorities (GV.RR)
UPDATE csf_subcategories SET name_tr = 'Liderlik Sorumlulugu', description_tr = 'Kurumsal liderlik siber guvenlik riskinden sorumludur ve risk bilincine sahip, etik ve surekli gelisen bir kultur olusturur.' WHERE id = 'GV.RR-01';
UPDATE csf_subcategories SET name_tr = 'Rol ve Sorumluluklar', description_tr = 'Siber guvenlik risk yonetimiyle ilgili roller, sorumluluklar ve yetkiler belirlenir, iletilir, anlasilir ve uygulanir.' WHERE id = 'GV.RR-02';
UPDATE csf_subcategories SET name_tr = 'Kaynak Tahsisi', description_tr = 'Siber guvenlik risk stratejisi, roller, sorumluluklar ve politikalarla orantili yeterli kaynaklar tahsis edilir.' WHERE id = 'GV.RR-03';
UPDATE csf_subcategories SET name_tr = 'Insan Kaynaklari Uygulamalari', description_tr = 'Siber guvenlik, insan kaynaklari uygulamalarina (personel taramasi, ise alim, isten ayrilma, degisiklik bildirimi) dahil edilir.' WHERE id = 'GV.RR-04';

-- GOVERN: Policy (GV.PO)
UPDATE csf_subcategories SET name_tr = 'Politika Olusturma', description_tr = 'Siber guvenlik risklerini yonetme politikasi, kurumsal baglam, siber guvenlik stratejisi ve onceliklere dayali olarak olusturulur, iletilir ve uygulanir.' WHERE id = 'GV.PO-01';
UPDATE csf_subcategories SET name_tr = 'Politika Guncelleme', description_tr = 'Siber guvenlik risk yonetimi politikasi, gereksinimler, tehditler, teknoloji ve kurumsal misyondaki degisiklikleri yansitmak uzere gozden gecirilir, guncellenir, iletilir ve uygulanir.' WHERE id = 'GV.PO-02';
UPDATE csf_subcategories SET name_tr = 'Politika Gozden Gecirme', description_tr = 'Siber guvenlik politikasi, planlanmis araliklarla ve risk ortamindaki onemli degisikliklere yanit olarak gozden gecirilir, guncellenir ve uygulanir.' WHERE id = 'GV.PO-03';

-- GOVERN: Oversight (GV.OV)
UPDATE csf_subcategories SET name_tr = 'Ust Yonetime Raporlama', description_tr = 'Siber guvenlik risk yonetimi sonuclari ve faaliyetleri ust yonetime ve kurumsal paydaslara iletilir.' WHERE id = 'GV.OV-01';
UPDATE csf_subcategories SET name_tr = 'Strateji Gozden Gecirme', description_tr = 'Siber guvenlik risk yonetim stratejisi, kurumsal gereksinimleri ve riskleri kapsadiginden emin olmak icin gozden gecirilir ve ayarlanir.' WHERE id = 'GV.OV-02';
UPDATE csf_subcategories SET name_tr = 'Performans Degerlendirmesi', description_tr = 'Kurumsal siber guvenlik risk yonetimi performansi degerlendirilir ve gerekli ayarlamalar icin gozden gecirilir.' WHERE id = 'GV.OV-03';

-- GOVERN: Supply Chain Risk Management (GV.SC)
UPDATE csf_subcategories SET name_tr = 'Tedarik Zinciri Programi', description_tr = 'Siber guvenlik tedarik zinciri risk yonetim programi, stratejisi, hedefleri, politikalari ve surecleri olusturulur ve kurumsal paydaslarca uzerinde uzlasilir.' WHERE id = 'GV.SC-01';
UPDATE csf_subcategories SET name_tr = 'Tedarikci Rolleri', description_tr = 'Tedarikci, musteri ve is ortaklari icin siber guvenlik rolleri ve sorumluluklari belirlenir, iletilir ve ic-dis koordinasyon saglanir.' WHERE id = 'GV.SC-02';
UPDATE csf_subcategories SET name_tr = 'Tedarik Zinciri Entegrasyonu', description_tr = 'Siber guvenlik tedarik zinciri risk yonetimi, siber guvenlik ve kurumsal risk yonetimi, risk degerlendirmesi ve iyilestirme sureclerine entegre edilir.' WHERE id = 'GV.SC-03';
UPDATE csf_subcategories SET name_tr = 'Tedarikci Onceliklendirme', description_tr = 'Tedarikciler kritiklik duzeylerine gore bilinir ve onceliklendirilir.' WHERE id = 'GV.SC-04';
UPDATE csf_subcategories SET name_tr = 'Tedarik Zinciri Sozlesmeleri', description_tr = 'Tedarik zincirindeki siber guvenlik risklerini ele alma gereksinimleri belirlenir, onceliklendirilir ve tedarikci sozlesmelerine entegre edilir.' WHERE id = 'GV.SC-05';
UPDATE csf_subcategories SET name_tr = 'Tedarikci Durum Tespiti', description_tr = 'Resmi tedarikci veya ucuncu taraf iliskilerine girmeden once riskleri azaltmak icin planlama ve durum tespiti yapilir.' WHERE id = 'GV.SC-06';
UPDATE csf_subcategories SET name_tr = 'Tedarikci Risk Izleme', description_tr = 'Tedarikci, urunleri, hizmetleri ve ucuncu taraflarin olusturdugu riskler iliski boyunca anlasilir, kaydedilir, onceliklendirilir, degerlendirilir, yanit verilir ve izlenir.' WHERE id = 'GV.SC-07';
UPDATE csf_subcategories SET name_tr = 'Tedarikci Olay Mudahalesi', description_tr = 'Ilgili tedarikciler ve ucuncu taraflar olay planlama, mudahale ve kurtarma faaliyetlerine dahil edilir.' WHERE id = 'GV.SC-08';
UPDATE csf_subcategories SET name_tr = 'Tedarik Zinciri Guvenlik Uygulamalari', description_tr = 'Tedarik zinciri guvenlik uygulamalari siber guvenlik ve kurumsal risk yonetim programlarina entegre edilir ve performanslari urun/hizmet yasam dongusu boyunca izlenir.' WHERE id = 'GV.SC-09';
UPDATE csf_subcategories SET name_tr = 'Ortaklik Sonrasi Planlama', description_tr = 'Siber guvenlik tedarik zinciri risk yonetim planlari, ortaklik veya hizmet sozlesmesinin sona ermesinden sonraki faaliyetler icin hukumler icerir.' WHERE id = 'GV.SC-10';

-- IDENTIFY: Asset Management (ID.AM)
UPDATE csf_subcategories SET name_tr = 'Donanim Envanteri', description_tr = 'Kurulus tarafindan yonetilen donanim envanterleri tutulur.' WHERE id = 'ID.AM-01';
UPDATE csf_subcategories SET name_tr = 'Yazilim ve Sistem Envanteri', description_tr = 'Kurulus tarafindan yonetilen yazilim, hizmet ve sistem envanterleri tutulur.' WHERE id = 'ID.AM-02';
UPDATE csf_subcategories SET name_tr = 'Ag Iletisim Haritalari', description_tr = 'Kurulusun yetkili ag iletisimi ile ic ve dis ag veri akislarinin temsilleri tutulur.' WHERE id = 'ID.AM-03';
UPDATE csf_subcategories SET name_tr = 'Tedarikci Hizmet Envanteri', description_tr = 'Tedarikciler tarafindan saglanan hizmetlerin envanterleri tutulur.' WHERE id = 'ID.AM-04';
UPDATE csf_subcategories SET name_tr = 'Varlik Onceliklendirme', description_tr = 'Varliklar, siniflandirma, kritiklik, kaynaklar ve misyona etkisine gore onceliklendirilir.' WHERE id = 'ID.AM-05';
UPDATE csf_subcategories SET name_tr = 'Veri Envanteri', description_tr = 'Kurumsal veriler ve ilgili meta veriler icin envanterler tutulur.' WHERE id = 'ID.AM-07';
UPDATE csf_subcategories SET name_tr = 'Yasam Dongusu Yonetimi', description_tr = 'Sistemler, donanim, yazilim, hizmetler ve veriler yasam donguleri boyunca yonetilir.' WHERE id = 'ID.AM-08';
UPDATE csf_subcategories SET name_tr = 'Kimlik ve Erisim Yonetimi', description_tr = 'Bireyler, gruplar ve sistemler benzersiz kimlik bilgilerine sahiptir ve varliklara erisim icin dogrulanir.' WHERE id = 'ID.AM-09';

-- IDENTIFY: Risk Assessment (ID.RA)
UPDATE csf_subcategories SET name_tr = 'Zafiyet Tespiti', description_tr = 'Varliklardaki guvenlik aciklari tanimlanir, dogrulanir ve kaydedilir.' WHERE id = 'ID.RA-01';
UPDATE csf_subcategories SET name_tr = 'Tehdit Istihbarati', description_tr = 'Siber tehdit istihbarati, bilgi paylasim forumlari ve kaynaklardan alinir.' WHERE id = 'ID.RA-02';
UPDATE csf_subcategories SET name_tr = 'Tehdit Tanimlama', description_tr = 'Kurulusa yonelik ic ve dis tehditler tanimlanir ve kaydedilir.' WHERE id = 'ID.RA-03';
UPDATE csf_subcategories SET name_tr = 'Etki ve Olasilik Analizi', description_tr = 'Tehditlerin guvenlik aciklarini kullanmasinin potansiyel etkileri ve olasiliklari tanimlanir ve kaydedilir.' WHERE id = 'ID.RA-04';
UPDATE csf_subcategories SET name_tr = 'Risk Degerlendirme ve Karar', description_tr = 'Tehditler, guvenlik aciklari, olasiliklar ve etkiler, dogan riski anlamak ve risk mudahale kararlarini bilgilendirmek icin kullanilir.' WHERE id = 'ID.RA-05';
UPDATE csf_subcategories SET name_tr = 'Risk Mudahale Planlama', description_tr = 'Risk mudahaleleri secilir, onceliklendirilir, planlanir, izlenir ve iletilir.' WHERE id = 'ID.RA-06';
UPDATE csf_subcategories SET name_tr = 'Degisiklik ve Istisna Yonetimi', description_tr = 'Degisiklikler ve istisnalar yonetilir, risk etkisi icin degerlendirilir, kaydedilir ve izlenir.' WHERE id = 'ID.RA-07';
UPDATE csf_subcategories SET name_tr = 'Zafiyet Bildirimi Surecleri', description_tr = 'Guvenlik acigi bildirimlerini alma, analiz etme ve yanit verme surecleri olusturulur.' WHERE id = 'ID.RA-08';
UPDATE csf_subcategories SET name_tr = 'Donanim/Yazilim Dogrulama', description_tr = 'Donanim ve yazilimin ozgunlugu ve butunlugu, satin alma ve kullanim oncesinde degerlendirilir.' WHERE id = 'ID.RA-09';
UPDATE csf_subcategories SET name_tr = 'Kurumsal Risk Raporlama', description_tr = 'Siber guvenlik riskleri ve risk mudahale bilgileri kurumsal risk yonetimi tartismalarina ve raporlamasina dahil edilir.' WHERE id = 'ID.RA-10';

-- IDENTIFY: Improvement (ID.IM)
UPDATE csf_subcategories SET name_tr = 'Degerlendirmelerden Iyilestirme', description_tr = 'Iyilestirmeler degerlendirmelerden tanimlanir.' WHERE id = 'ID.IM-01';
UPDATE csf_subcategories SET name_tr = 'Testlerden Iyilestirme', description_tr = 'Iyilestirmeler, tedarikciler ve ilgili ucuncu taraflarla koordineli olarak yapilan guvenlik testleri ve tatbikatlarindan tanimlanir.' WHERE id = 'ID.IM-02';
UPDATE csf_subcategories SET name_tr = 'Operasyonel Iyilestirme', description_tr = 'Iyilestirmeler, operasyonel sureclerin, prosedurler ve faaliyetlerin yurutulmesinden tanimlanir.' WHERE id = 'ID.IM-03';
UPDATE csf_subcategories SET name_tr = 'Olay Mudahale Planlari', description_tr = 'Operasyonlari etkileyen olay mudahale planlari ve diger siber guvenlik planlari olusturulur, iletilir, surduruulur ve iyilestirilir.' WHERE id = 'ID.IM-04';

-- PROTECT: Identity Management, Authentication and Access Control (PR.AA)
UPDATE csf_subcategories SET name_tr = 'Kimlik ve Kimlik Bilgisi Yonetimi', description_tr = 'Yetkili kullanicilar, hizmetler ve donanim icin kimlikler ve kimlik bilgileri kurulus tarafindan yonetilir.' WHERE id = 'PR.AA-01';
UPDATE csf_subcategories SET name_tr = 'Kimlik Dogrulama ve Baglama', description_tr = 'Kimlikler, etkilesim baglamina dayali olarak dogrulanir ve kimlik bilgilerine baglanir.' WHERE id = 'PR.AA-02';
UPDATE csf_subcategories SET name_tr = 'Kimlik Dogrulama Islemi', description_tr = 'Kullanicilar, hizmetler ve donanim kimlik dogrulamasi yapilir.' WHERE id = 'PR.AA-03';
UPDATE csf_subcategories SET name_tr = 'Kimlik Beyanlari', description_tr = 'Kimlik beyanlari korunur, iletilir ve dogrulanir.' WHERE id = 'PR.AA-04';
UPDATE csf_subcategories SET name_tr = 'Erisim Izinleri ve Yetkilendirme', description_tr = 'Erisim izinleri, yetkileri ve yetkilendirmeler politika cercevesinde tanimlanir, yonetilir, uygulanir, gozden gecirilir ve en az yetki ile gorev ayriligi ilkeleri uygulanir.' WHERE id = 'PR.AA-05';
UPDATE csf_subcategories SET name_tr = 'Fiziksel Erisim Kontrolu', description_tr = 'Varliklara fiziksel erisim, riske uygun sekilde yonetilir, izlenir ve uygulanir.' WHERE id = 'PR.AA-06';

-- PROTECT: Awareness and Training (PR.AT)
UPDATE csf_subcategories SET name_tr = 'Siber Guvenlik Farkindalik Egitimi', description_tr = 'Personele siber guvenlik farkindalik ve egitimi saglanarak siber guvenlikle ilgili gorevlerini yerine getirebilmeleri saglanir.' WHERE id = 'PR.AT-01';
UPDATE csf_subcategories SET name_tr = 'Uzmanlik Alani Egitimi', description_tr = 'Uzmanlasmis rollerdeki bireylere, role ozel siber guvenlik farkindalik ve egitimi saglanir (orn. yoneticiler, gelistiriciler, guvenlik muhendisleri).' WHERE id = 'PR.AT-02';

-- PROTECT: Data Security (PR.DS)
UPDATE csf_subcategories SET name_tr = 'Duragan Veri Korumasi', description_tr = 'Duragan verilerin gizliligi, butunlugu ve erisilebilirligi korunur.' WHERE id = 'PR.DS-01';
UPDATE csf_subcategories SET name_tr = 'Iletim Halindeki Veri Korumasi', description_tr = 'Iletim halindeki verilerin gizliligi, butunlugu ve erisilebilirligi korunur.' WHERE id = 'PR.DS-02';
UPDATE csf_subcategories SET name_tr = 'Kullanim Halindeki Veri Korumasi', description_tr = 'Kullanim halindeki verilerin gizliligi, butunlugu ve erisilebilirligi korunur.' WHERE id = 'PR.DS-10';
UPDATE csf_subcategories SET name_tr = 'Veri Yedekleme', description_tr = 'Verilerin yedekleri olusturulur, korunur, surduruulur ve test edilir.' WHERE id = 'PR.DS-11';
UPDATE csf_subcategories SET name_tr = 'Varlik Tasima ve Imha', description_tr = 'Varliklar, kaldirilma, transfer ve imha sureclerinde resmi olarak yonetilir.' WHERE id = 'PR.DS-03';
UPDATE csf_subcategories SET name_tr = 'Kapasite Yonetimi', description_tr = 'Erisilebilirligin saglanmasi icin yeterli kapasite surduruulur.' WHERE id = 'PR.DS-04';
UPDATE csf_subcategories SET name_tr = 'Veri Sizintisi Onleme', description_tr = 'Veri sizintilari tespit edilir ve onlenir.' WHERE id = 'PR.DS-05';
UPDATE csf_subcategories SET name_tr = 'Butunluk Dogrulama', description_tr = 'Yazilim, urun yazilimi ve bilgi butunlugunu dogrulamak icin butunluk kontrol mekanizmalari kullanilir.' WHERE id = 'PR.DS-06';
UPDATE csf_subcategories SET name_tr = 'Ortam Ayirimi', description_tr = 'Gelistirme ve test ortamlari uretim ortamindan ayrilir.' WHERE id = 'PR.DS-07';
UPDATE csf_subcategories SET name_tr = 'Donanim Butunlugu', description_tr = 'Donanim butunlugu korunur.' WHERE id = 'PR.DS-08';
UPDATE csf_subcategories SET name_tr = 'Donanim/Yazilim Envanter Surekliligi', description_tr = 'Donanim ve yazilim envanteri sistem yasam dongusu boyunca kullanilir ve surduruulur.' WHERE id = 'PR.DS-09';

-- PROTECT: Platform Security (PR.PS)
UPDATE csf_subcategories SET name_tr = 'Konfigruasyon Yonetimi', description_tr = 'Konfigruasyon yonetimi uygulamalari olusturulur ve uygulanir.' WHERE id = 'PR.PS-01';
UPDATE csf_subcategories SET name_tr = 'Yazilim Yasam Dongusu', description_tr = 'Yazilim, riske uygun sekilde bakimi yapilir, degistirilir ve kaldirilir.' WHERE id = 'PR.PS-02';

-- PROTECT: Technology Infrastructure Resilience (PR.IR)
UPDATE csf_subcategories SET name_tr = 'Ag Erisim Korumasi', description_tr = 'Aglar ve ortamlar yetkisiz mantiksal erisim ve kullanimdan korunur.' WHERE id = 'PR.IR-01';
UPDATE csf_subcategories SET name_tr = 'Cevresel Tehdit Korumasi', description_tr = 'Kurulusun teknoloji varliklari cevresel tehditlerden korunur.' WHERE id = 'PR.IR-02';
UPDATE csf_subcategories SET name_tr = 'Dayaniklilik Mekanizmalari', description_tr = 'Normal ve olumsuz durumlarda dayaniklilik gereksinimlerini karsilamak icin mekanizmalar uygulanir.' WHERE id = 'PR.IR-03';
UPDATE csf_subcategories SET name_tr = 'Kaynak Kapasite Yonetimi', description_tr = 'Erisilebilirligin saglanmasi icin yeterli kaynak kapasitesi surduruulur.' WHERE id = 'PR.IR-04';

-- DETECT: Continuous Monitoring (DE.CM)
UPDATE csf_subcategories SET name_tr = 'Ag Izleme', description_tr = 'Aglar ve ag hizmetleri, potansiyel olumsuz olaylari bulmak icin izlenir.' WHERE id = 'DE.CM-01';
UPDATE csf_subcategories SET name_tr = 'Fiziksel Ortam Izleme', description_tr = 'Fiziksel ortam, potansiyel olumsuz olaylari bulmak icin izlenir.' WHERE id = 'DE.CM-02';
UPDATE csf_subcategories SET name_tr = 'Personel ve Teknoloji Izleme', description_tr = 'Personel faaliyetleri ve teknoloji kullanimi, potansiyel olumsuz olaylari bulmak icin izlenir.' WHERE id = 'DE.CM-03';
UPDATE csf_subcategories SET name_tr = 'Dis Hizmet Saglayici Izleme', description_tr = 'Dis hizmet saglayici faaliyetleri ve hizmetleri, potansiyel olumsuz olaylari bulmak icin izlenir.' WHERE id = 'DE.CM-06';
UPDATE csf_subcategories SET name_tr = 'Bilgi Islem Ortami Izleme', description_tr = 'Bilgisayar donanimmi, yazilimi, calisma ortamlari ve verileri, potansiyel olumsuz olaylari bulmak icin izlenir.' WHERE id = 'DE.CM-09';
UPDATE csf_subcategories SET name_tr = 'Zararli Yazilim Tespiti', description_tr = 'Zararli yazilim tespit edilir.' WHERE id = 'DE.CM-04';
UPDATE csf_subcategories SET name_tr = 'Yetkisiz Erisim Izleme', description_tr = 'Yetkisiz personel, baglantilar, cihazlar ve yazilimlar icin izleme yapilir.' WHERE id = 'DE.CM-07';
UPDATE csf_subcategories SET name_tr = 'Zafiyet Taramasi', description_tr = 'Guvenlik acigi taramalari gerceklestirilir.' WHERE id = 'DE.CM-08';
UPDATE csf_subcategories SET name_tr = 'Yetkisiz Mobil Kod Tespiti', description_tr = 'Yetkisiz mobil kod tespit edilir.' WHERE id = 'DE.CM-05';

-- DETECT: Adverse Event Analysis (DE.AE)
UPDATE csf_subcategories SET name_tr = 'Olumsuz Olay Analizi', description_tr = 'Potansiyel olumsuz olaylar, iliskili faaliyetleri daha iyi anlamak icin analiz edilir.' WHERE id = 'DE.AE-02';
UPDATE csf_subcategories SET name_tr = 'Bilgi Korelasyonu', description_tr = 'Birden fazla kaynaktan gelen bilgiler iliskilendirilir.' WHERE id = 'DE.AE-03';
UPDATE csf_subcategories SET name_tr = 'Etki ve Kapsam Degerlendirmesi', description_tr = 'Olumsuz olaylarin tahmini etkisi ve kapsami anlasilir.' WHERE id = 'DE.AE-04';
UPDATE csf_subcategories SET name_tr = 'Olay Bilgisi Paylasimi', description_tr = 'Olumsuz olaylara iliskin bilgiler yetkili personel ve araclara saglanir.' WHERE id = 'DE.AE-06';
UPDATE csf_subcategories SET name_tr = 'Tehdit Istihbarati Entegrasyonu', description_tr = 'Siber tehdit istihbarati ve diger baglamsal bilgiler analize entegre edilir.' WHERE id = 'DE.AE-07';
UPDATE csf_subcategories SET name_tr = 'Olay Ilan Kriterleri', description_tr = 'Olumsuz olaylar tanimlanmis olay kriterlerini karsiladiginda olay ilan edilir.' WHERE id = 'DE.AE-08';
UPDATE csf_subcategories SET name_tr = 'Ag Operasyon Temeli', description_tr = 'Kullanicilar, hizmetler ve sistemler icin ag operasyonlari ve beklenen veri akislarinin temeli olusturulur ve yonetilir.' WHERE id = 'DE.AE-01';

-- DETECT: Detection Processes (DE.DP)
UPDATE csf_subcategories SET name_tr = 'Tespit Rolleri ve Sorumluluklari', description_tr = 'Hesap verebilirligin saglanmasi icin tespit faaliyetleri icin roller ve sorumluluklar atanir.' WHERE id = 'DE.DP-01';
UPDATE csf_subcategories SET name_tr = 'Tespit Uyumlulugu', description_tr = 'Tespit faaliyetleri tum gecerli gereksinimlere uyar.' WHERE id = 'DE.DP-02';
UPDATE csf_subcategories SET name_tr = 'Tespit Surec Testleri', description_tr = 'Tespit surecleri test edilir.' WHERE id = 'DE.DP-03';
UPDATE csf_subcategories SET name_tr = 'Olay Tespit Bilgisi Iletisimi', description_tr = 'Olay tespit bilgileri iletilir.' WHERE id = 'DE.DP-04';
UPDATE csf_subcategories SET name_tr = 'Surekli Surec Iyilestirme', description_tr = 'Tespit surecleri surekli olarak iyilestirilir.' WHERE id = 'DE.DP-05';

-- RESPOND: Incident Management (RS.MA)
UPDATE csf_subcategories SET name_tr = 'Olay Mudahale Plani Yurutme', description_tr = 'Olay ilan edildikten sonra olay mudahale plani ilgili ucuncu taraflarla koordineli olarak yurutulur.' WHERE id = 'RS.MA-01';
UPDATE csf_subcategories SET name_tr = 'Olay Raporlari Degerlendirme', description_tr = 'Olay raporlari siniflandirilir ve dogrulanir.' WHERE id = 'RS.MA-02';
UPDATE csf_subcategories SET name_tr = 'Olay Siniflandirma ve Onceliklendirme', description_tr = 'Olaylar siniflandirilir ve onceliklendirilir.' WHERE id = 'RS.MA-03';
UPDATE csf_subcategories SET name_tr = 'Olay Eskalasyonu', description_tr = 'Olaylar gerektiginde ust makamlara iletilir.' WHERE id = 'RS.MA-04';
UPDATE csf_subcategories SET name_tr = 'Kurtarma Baslama Kriterleri', description_tr = 'Olay kurtarma baslatma kriterleri uygulanir.' WHERE id = 'RS.MA-05';

-- RESPOND: Incident Analysis (RS.AN)
UPDATE csf_subcategories SET name_tr = 'Kok Neden Analizi', description_tr = 'Olay sirasinda neler oldugunu ve olayin kok nedenini belirlemek icin analiz yapilir.' WHERE id = 'RS.AN-03';
UPDATE csf_subcategories SET name_tr = 'Sorusturma Kayitlari', description_tr = 'Sorusturma sirasinda gerceklestirilen eylemler kaydedilir ve kayitlarin butunlugu ve kokeni korunur.' WHERE id = 'RS.AN-06';
UPDATE csf_subcategories SET name_tr = 'Olay Veri Toplama', description_tr = 'Olay verileri ve meta verileri toplanir, butunlukleri ve kokenleri korunur.' WHERE id = 'RS.AN-07';
UPDATE csf_subcategories SET name_tr = 'Olay Buyuklugu Tahmin', description_tr = 'Olayin buyuklugu tahmin edilir ve dogrulanir.' WHERE id = 'RS.AN-08';

-- RESPOND: Incident Response Reporting and Communication (RS.CO)
UPDATE csf_subcategories SET name_tr = 'Paydas Bildirimi', description_tr = 'Ic ve dis paydaslar olaylar hakkinda bilgilendirilir.' WHERE id = 'RS.CO-02';
UPDATE csf_subcategories SET name_tr = 'Bilgi Paylasimi', description_tr = 'Bilgiler, belirlenmis ic ve dis paydaSlarla paylasilir.' WHERE id = 'RS.CO-03';
UPDATE csf_subcategories SET name_tr = 'Paydas Koordinasyonu', description_tr = 'Paydaslarla koordinasyon mudahale planlarina uygun sekilde gerceklestirilir.' WHERE id = 'RS.CO-04';

-- RECOVER: Recovery Planning (RC.RP)
UPDATE csf_subcategories SET name_tr = 'Kurtarma Plani Yurutme', description_tr = 'Olay mudahale plani, olay mudahale surecindan baslatildiktan sonra kurtarma kismi yurutulur.' WHERE id = 'RC.RP-01';
UPDATE csf_subcategories SET name_tr = 'Kurtarma Eylemleri', description_tr = 'Kurtarma eylemleri secilir, kapsamlandirilir, onceliklendirilir ve gerceklestirilir.' WHERE id = 'RC.RP-02';
UPDATE csf_subcategories SET name_tr = 'Yedek Butunluk Dogrulama', description_tr = 'Yedeklerin ve diger geri yukleme varliklarinin butunlugu, geri yukleme icin kullanilmadan once dogrulanir.' WHERE id = 'RC.RP-03';

-- RECOVER: Improvements (RC.IM)
UPDATE csf_subcategories SET name_tr = 'Alinan Dersler', description_tr = 'Kurtarma planlari alinan dersleri icerir.' WHERE id = 'RC.IM-01';
UPDATE csf_subcategories SET name_tr = 'Kurtarma Strateji Guncellemesi', description_tr = 'Kurtarma stratejileri ve planlari guncellenir.' WHERE id = 'RC.IM-02';

-- RECOVER: Communications (RC.CO)
UPDATE csf_subcategories SET name_tr = 'Halkla Iliskiler Yonetimi', description_tr = 'Halkla iliskiler yonetilir.' WHERE id = 'RC.CO-01';
UPDATE csf_subcategories SET name_tr = 'Itibar Onarimi', description_tr = 'Olay sonrasinda kurulusun itibari onarilir.' WHERE id = 'RC.CO-02';
UPDATE csf_subcategories SET name_tr = 'Kurtarma Iletisimi', description_tr = 'Kurtarma faaliyetleri ic ve dis paydaslar ile yonetim ekiplerine iletilir.' WHERE id = 'RC.CO-03';
