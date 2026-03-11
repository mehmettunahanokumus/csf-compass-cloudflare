-- Consolidated Questions for Vendor Self-Assessment
-- Instead of 106 individual subcategory questions, vendors answer 25 category-level questions.
-- Each answer is expanded to all mapped subcategories.

-- ============================================================================
-- CONSOLIDATED QUESTIONS TABLE (25 rows - one per CSF category)
-- ============================================================================

CREATE TABLE IF NOT EXISTS consolidated_questions (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_text_tr TEXT,
  guidance_text TEXT,
  guidance_text_tr TEXT,
  min_tier TEXT DEFAULT 'low',
  sort_order INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now')*1000)
);

CREATE TABLE IF NOT EXISTS consolidated_question_mappings (
  id TEXT PRIMARY KEY,
  consolidated_question_id TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  weight REAL DEFAULT 1.0
);

CREATE INDEX IF NOT EXISTS idx_cq_category ON consolidated_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_cq_tier ON consolidated_questions(min_tier);
CREATE INDEX IF NOT EXISTS idx_cqm_question ON consolidated_question_mappings(consolidated_question_id);
CREATE INDEX IF NOT EXISTS idx_cqm_subcategory ON consolidated_question_mappings(subcategory_id);

-- ============================================================================
-- SEED: 25 Consolidated Questions (one per category)
-- ============================================================================

-- GOVERN (GV) - 6 categories
INSERT INTO consolidated_questions (id, category_id, question_text, question_text_tr, guidance_text, guidance_text_tr, min_tier, sort_order) VALUES
('CQ-GV.OC', 'GV.OC',
 'How well does your organization understand its mission, stakeholder expectations, and legal/regulatory requirements in the context of cybersecurity risk management?',
 'Kurulusunuz siber guvenlik risk yonetimi baglaminda misyonunu, paydas beklentilerini ve yasal/duzenleyici gereklilikleri ne olcude anliyor?',
 'Consider: organizational mission alignment, stakeholder identification, legal/regulatory compliance, critical service dependencies, and supply chain understanding.',
 'Degerlendirilecekler: Kurumsal misyon uyumu, paydas tespiti, yasal/duzenleyici uyumluluk, kritik hizmet bagimliliklari ve tedarik zinciri anlayisi.',
 'low', 1),

('CQ-GV.RM', 'GV.RM',
 'How mature is your organization''s cybersecurity risk management strategy, including risk appetite, tolerance, and integration with enterprise risk management?',
 'Kurulusunuzun siber guvenlik risk yonetimi stratejisi, risk istahi, toleransi ve kurumsal risk yonetimiyle entegrasyonu ne kadar olgun?',
 'Consider: risk objectives, risk appetite/tolerance statements, enterprise risk integration, risk communication channels, and risk calculation methods.',
 'Degerlendirilecekler: Risk hedefleri, risk istahi/tolerans beyanlari, kurumsal risk entegrasyonu, risk iletisim kanallari ve risk hesaplama yontemleri.',
 'low', 2),

('CQ-GV.RR', 'GV.RR',
 'How well are cybersecurity roles, responsibilities, and authorities established, communicated, and resourced across your organization?',
 'Kurulusunuzda siber guvenlik rolleri, sorumluluklar ve yetkiler ne olcude belirlenmis, iletilmis ve kaynak saglanmis durumda?',
 'Consider: leadership accountability, role definition and communication, resource allocation, and HR practices for cybersecurity.',
 'Degerlendirilecekler: Liderlik hesap verebilirligi, rol tanimlama ve iletisim, kaynak tahsisi ve siber guvenlik icin IK uygulamalari.',
 'low', 3),

('CQ-GV.PO', 'GV.PO',
 'How established and maintained is your organization''s cybersecurity policy framework?',
 'Kurulusunuzun siber guvenlik politika cercevesi ne olcude olusturulmus ve surduruluyor?',
 'Consider: policy establishment, regular review and updates, communication, and enforcement mechanisms.',
 'Degerlendirilecekler: Politika olusturma, duzenli gozden gecirme ve guncelleme, iletisim ve uygulama mekanizmalari.',
 'low', 4),

('CQ-GV.OV', 'GV.OV',
 'How effectively does your organization oversee and adjust its cybersecurity risk management activities based on performance results?',
 'Kurulusunuz performans sonuclarina dayali olarak siber guvenlik risk yonetimi faaliyetlerini ne kadar etkili bir sekilde denetliyor ve ayarliyor?',
 'Consider: risk outcome communication to leadership, strategy review processes, and performance evaluation mechanisms.',
 'Degerlendirilecekler: Liderlige risk sonucu iletisimi, strateji gozden gecirme surecleri ve performans degerlendirme mekanizmalari.',
 'medium', 5),

('CQ-GV.SC', 'GV.SC',
 'How mature is your cybersecurity supply chain risk management program, including supplier assessment, monitoring, and incident coordination?',
 'Tedarikci degerlendirmesi, izleme ve olay koordinasyonu dahil olmak uzere siber guvenlik tedarik zinciri risk yonetim programiniz ne kadar olgun?',
 'Consider: SCRM program establishment, supplier prioritization, contractual requirements, due diligence, ongoing monitoring, and incident coordination with suppliers.',
 'Degerlendirilecekler: SCRM program olusturma, tedarikci onceliklendirme, sozlesme gereklilikleri, durum tespiti, surekli izleme ve tedarikcilerle olay koordinasyonu.',
 'low', 6);

-- IDENTIFY (ID) - 5 categories
INSERT INTO consolidated_questions (id, category_id, question_text, question_text_tr, guidance_text, guidance_text_tr, min_tier, sort_order) VALUES
('CQ-ID.AM', 'ID.AM',
 'How comprehensively does your organization identify, inventory, and manage its assets (hardware, software, data, services) based on their criticality?',
 'Kurulusunuz varliklarini (donanim, yazilim, veri, hizmetler) kritikliklerine gore ne kadar kapsamli bir sekilde tanimliyor, envanterliyor ve yonetiyor?',
 'Consider: hardware/software inventories, network flow documentation, supplier service tracking, asset prioritization, data inventories, lifecycle management, and credential management.',
 'Degerlendirilecekler: Donanim/yazilim envanterleri, ag akis dokumantasyonu, tedarikci hizmet takibi, varlik onceliklendirme, veri envanterleri, yasam dongusu yonetimi ve kimlik bilgisi yonetimi.',
 'low', 7),

('CQ-ID.RA', 'ID.RA',
 'How thorough is your organization''s cybersecurity risk assessment process, including vulnerability identification, threat analysis, and risk response planning?',
 'Guvenlik acigi tespiti, tehdit analizi ve risk mudahale planlamasi dahil olmak uzere kurulusunuzun siber guvenlik risk degerlendirme sureci ne kadar kapsamli?',
 'Consider: vulnerability identification, threat intelligence, threat recording, impact/likelihood analysis, risk-informed decisions, risk response tracking, change management, and vulnerability disclosure processes.',
 'Degerlendirilecekler: Guvenlik acigi tespiti, tehdit istihbarati, tehdit kaydi, etki/olasilik analizi, risk bilgili kararlar, risk mudahale takibi, degisiklik yonetimi ve guvenlik acigi ifsa surecleri.',
 'low', 8),

('CQ-ID.IM', 'ID.IM',
 'How systematically does your organization identify and implement improvements to its cybersecurity risk management processes?',
 'Kurulusunuz siber guvenlik risk yonetimi sureclerindeki iyilestirmeleri ne kadar sistematik bir sekilde belirliyor ve uyguluyor?',
 'Consider: evaluation-based improvements, security test findings, operational process improvements, and incident response plan updates.',
 'Degerlendirilecekler: Degerlendirme tabanli iyilestirmeler, guvenlik testi bulgulari, operasyonel surec iyilestirmeleri ve olay mudahale plani guncellemeleri.',
 'medium', 9),

('CQ-ID.GV', 'ID.GV',
 'How well is your organization''s cybersecurity risk management program established and managed within the broader governance structure?',
 'Kurulusunuzun siber guvenlik risk yonetimi programi daha genis yonetisim yapisi icinde ne kadar iyi bir sekilde olusturulmus ve yonetiliyor?',
 'Consider: program establishment, governance integration, continuous monitoring, and reporting.',
 'Degerlendirilecekler: Program olusturma, yonetisim entegrasyonu, surekli izleme ve raporlama.',
 'medium', 10),

('CQ-ID.SC', 'ID.SC',
 'How well does your organization identify its supply chain and assess and manage supply chain risks?',
 'Kurulusunuz tedarik zincirini ne kadar iyi tanimliyor ve tedarik zinciri risklerini degerlendirip yonetiyor?',
 'Consider: supply chain identification, risk assessment, and ongoing management.',
 'Degerlendirilecekler: Tedarik zinciri tespiti, risk degerlendirmesi ve surekli yonetim.',
 'medium', 11);

-- PROTECT (PR) - 5 categories
INSERT INTO consolidated_questions (id, category_id, question_text, question_text_tr, guidance_text, guidance_text_tr, min_tier, sort_order) VALUES
('CQ-PR.AA', 'PR.AA',
 'How effectively does your organization manage identities, authentication, and access control for users, services, and hardware?',
 'Kurulusunuz kullanicilar, hizmetler ve donanim icin kimlikleri, kimlik dogrulamayi ve erisim kontrolunu ne kadar etkili yonetiyor?',
 'Consider: credential management, identity proofing, authentication mechanisms, identity assertion protection, least privilege/separation of duties, and physical access control.',
 'Degerlendirilecekler: Kimlik bilgisi yonetimi, kimlik dogrulama, kimlik dogrulama mekanizmalari, kimlik beyan korumasi, en az ayricalik/gorev ayriligi ve fiziksel erisim kontrolu.',
 'low', 12),

('CQ-PR.AT', 'PR.AT',
 'How comprehensive is your organization''s cybersecurity awareness and training program for all personnel, including those in specialized roles?',
 'Ozel rollerdekiler dahil tum personel icin kurulusunuzun siber guvenlik farkindalik ve egitim programi ne kadar kapsamli?',
 'Consider: general cybersecurity awareness training and role-specific training for administrators, developers, and security engineers.',
 'Degerlendirilecekler: Genel siber guvenlik farkindalik egitimi ve yoneticiler, gelistiriciler ve guvenlik muhendisleri icin role ozel egitim.',
 'low', 13),

('CQ-PR.DS', 'PR.DS',
 'How well does your organization protect data confidentiality, integrity, and availability across its lifecycle (at-rest, in-transit, in-use)?',
 'Kurulusunuz yasam dongusu boyunca (duragan, aktarimda, kulanimda) veri gizliligini, butunlugunu ve kullanilabilirligini ne kadar iyi koruyor?',
 'Consider: data-at-rest/in-transit/in-use protection, backup practices, asset disposition, capacity management, data leak prevention, integrity checking, environment separation, hardware integrity, and inventory management.',
 'Degerlendirilecekler: Duragan/aktarimda/kullanidaki veri korumasi, yedekleme uygulamalari, varlik elden cikarma, kapasite yonetimi, veri sizintisi onleme, butunluk kontrolu, ortam ayirma, donanim butunlugu ve envanter yonetimi.',
 'low', 14),

('CQ-PR.PS', 'PR.PS',
 'How effectively does your organization manage platform security, including configuration management and software lifecycle management?',
 'Kurulusunuz yapilandirma yonetimi ve yazilim yasam dongusu yonetimi dahil platform guvenligini ne kadar etkili yonetiyor?',
 'Consider: configuration management practices and software maintenance/replacement/removal processes.',
 'Degerlendirilecekler: Yapilandirma yonetimi uygulamalari ve yazilim bakim/degistirme/kaldirma surecleri.',
 'medium', 15),

('CQ-PR.IR', 'PR.IR',
 'How resilient is your technology infrastructure against unauthorized access, environmental threats, and capacity issues?',
 'Teknoloji altyapiniz yetkisiz erisme, cevresel tehditlere ve kapasite sorunlarina karsi ne kadar dayanikli?',
 'Consider: network access protection, environmental threat protection, resilience mechanisms, and capacity management.',
 'Degerlendirilecekler: Ag erisim korumasi, cevresel tehdit korumasi, dayaniklilik mekanizmalari ve kapasite yonetimi.',
 'low', 16);

-- DETECT (DE) - 3 categories
INSERT INTO consolidated_questions (id, category_id, question_text, question_text_tr, guidance_text, guidance_text_tr, min_tier, sort_order) VALUES
('CQ-DE.CM', 'DE.CM',
 'How comprehensive is your organization''s continuous monitoring capability for detecting adverse events across networks, systems, and personnel activity?',
 'Kurulusunuzun aglar, sistemler ve personel faaliyetleri genelinde olumsuz olaylari tespit etmek icin surekli izleme yetenegi ne kadar kapsamli?',
 'Consider: network monitoring, physical environment monitoring, personnel activity monitoring, external service provider monitoring, computing environment monitoring, malware detection, unauthorized access detection, and vulnerability scanning.',
 'Degerlendirilecekler: Ag izleme, fiziksel ortam izleme, personel faaliyet izleme, dis hizmet saglayici izleme, bilisim ortami izleme, kotu amacli yazilim tespiti, yetkisiz erisim tespiti ve guvenlik acigi taramasi.',
 'low', 17),

('CQ-DE.AE', 'DE.AE',
 'How effectively does your organization analyze potentially adverse events, correlate information from multiple sources, and declare incidents?',
 'Kurulusunuz potansiyel olarak olumsuz olaylari ne kadar etkili analiz ediyor, birden fazla kaynaktan gelen bilgileri iliskilendiriyor ve olaylari ilan ediyor?',
 'Consider: event analysis, information correlation, impact/scope assessment, information sharing with authorized staff, threat intelligence integration, and incident declaration criteria.',
 'Degerlendirilecekler: Olay analizi, bilgi iliskilendirme, etki/kapsam degerlendirmesi, yetkili personelle bilgi paylasimi, tehdit istihbarati entegrasyonu ve olay ilan kriterleri.',
 'low', 18),

('CQ-DE.DP', 'DE.DP',
 'How well-defined and tested are your organization''s detection processes, including roles, compliance, testing, communication, and continuous improvement?',
 'Kurulusunuzun roller, uyumluluk, test, iletisim ve surekli iyilestirme dahil tespit surecleri ne kadar iyi tanimlanmis ve test edilmis?',
 'Consider: detection role assignment, compliance with requirements, process testing, event communication, and continuous improvement of detection capabilities.',
 'Degerlendirilecekler: Tespit rolu atama, gerekliliklere uyumluluk, surec testi, olay iletisimi ve tespit yeteneklerinin surekli iyilestirilmesi.',
 'medium', 19);

-- RESPOND (RS) - 3 categories
INSERT INTO consolidated_questions (id, category_id, question_text, question_text_tr, guidance_text, guidance_text_tr, min_tier, sort_order) VALUES
('CQ-RS.MA', 'RS.MA',
 'How well does your organization manage incident response, including plan execution, triage, categorization, escalation, and recovery initiation?',
 'Kurulusunuz plan yurutme, onceliklendirme, kategorizasyon, eskalasyon ve kurtarma baslatma dahil olay mudahalesini ne kadar iyi yonetiyor?',
 'Consider: incident response plan execution, report triage and validation, incident categorization/prioritization, escalation procedures, and recovery initiation criteria.',
 'Degerlendirilecekler: Olay mudahale plani yurutme, rapor onceliklendirme ve dogrulama, olay kategorizasyonu/onceliklendirme, eskalasyon prosedürleri ve kurtarma baslatma kriterleri.',
 'low', 20),

('CQ-RS.AN', 'RS.AN',
 'How thorough is your organization''s incident analysis capability, including root cause analysis, evidence preservation, and magnitude estimation?',
 'Kok neden analizi, kanit koruma ve buyukluk tahmini dahil kurulusunuzun olay analizi yetenegi ne kadar kapsamli?',
 'Consider: root cause analysis, investigation record keeping, data/metadata collection and integrity, and incident magnitude estimation.',
 'Degerlendirilecekler: Kok neden analizi, sorusturma kayit tutma, veri/metadata toplama ve butunluk ve olay buyuklugu tahmini.',
 'low', 21),

('CQ-RS.CO', 'RS.CO',
 'How effectively does your organization coordinate incident response reporting and communication with internal and external stakeholders?',
 'Kurulusunuz ic ve dis paydaşlarla olay mudahale raporlamasini ve iletisimini ne kadar etkili koordine ediyor?',
 'Consider: stakeholder notification, information sharing protocols, and coordination with response plans.',
 'Degerlendirilecekler: Paydas bildirimi, bilgi paylasim protokolleri ve mudahale planlariyla koordinasyon.',
 'low', 22);

-- RECOVER (RC) - 3 categories
INSERT INTO consolidated_questions (id, category_id, question_text, question_text_tr, guidance_text, guidance_text_tr, min_tier, sort_order) VALUES
('CQ-RC.RP', 'RC.RP',
 'How well-established are your organization''s recovery planning and execution capabilities for restoring systems and assets after cybersecurity incidents?',
 'Siber guvenlik olaylarindan sonra sistemleri ve varliklari geri yuklemek icin kurulusunuzun kurtarma planlama ve yurutme yetenekleri ne kadar iyi olusturulmus?',
 'Consider: recovery plan execution, recovery action prioritization, and backup/restoration asset integrity verification.',
 'Degerlendirilecekler: Kurtarma plani yurutme, kurtarma eylemi onceliklendirme ve yedek/restorasyon varlik butunlugu dogrulamasi.',
 'low', 23),

('CQ-RC.IM', 'RC.IM',
 'How systematically does your organization incorporate lessons learned into recovery plans and update recovery strategies?',
 'Kurulusunuz ogrenilen dersleri kurtarma planlarina ne kadar sistematik bir sekilde dahil ediyor ve kurtarma stratejilerini guncelliyor?',
 'Consider: lessons learned incorporation and recovery strategy/plan updates.',
 'Degerlendirilecekler: Ogrenilen derslerin dahil edilmesi ve kurtarma stratejisi/plan guncellemeleri.',
 'high', 24),

('CQ-RC.CO', 'RC.CO',
 'How effectively does your organization manage communications during and after recovery, including public relations and stakeholder coordination?',
 'Kurulusunuz halkla iliskiler ve paydas koordinasyonu dahil olmak uzere kurtarma sirasinda ve sonrasinda iletisimleri ne kadar etkili yonetiyor?',
 'Consider: public relations management, reputation repair, and recovery activity communication to stakeholders.',
 'Degerlendirilecekler: Halkla iliskiler yonetimi, itibar onarimi ve paydaslara kurtarma faaliyeti iletisimi.',
 'medium', 25);

-- ============================================================================
-- SEED: Consolidated Question Mappings (106 rows - each subcategory maps to its parent category's CQ)
-- ============================================================================

-- GV.OC subcategories (5)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-GV.OC-01', 'CQ-GV.OC', 'GV.OC-01', 1.0),
('CQM-GV.OC-02', 'CQ-GV.OC', 'GV.OC-02', 1.0),
('CQM-GV.OC-03', 'CQ-GV.OC', 'GV.OC-03', 1.0),
('CQM-GV.OC-04', 'CQ-GV.OC', 'GV.OC-04', 1.0),
('CQM-GV.OC-05', 'CQ-GV.OC', 'GV.OC-05', 1.0);

-- GV.RM subcategories (7)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-GV.RM-01', 'CQ-GV.RM', 'GV.RM-01', 1.0),
('CQM-GV.RM-02', 'CQ-GV.RM', 'GV.RM-02', 1.0),
('CQM-GV.RM-03', 'CQ-GV.RM', 'GV.RM-03', 1.0),
('CQM-GV.RM-04', 'CQ-GV.RM', 'GV.RM-04', 1.0),
('CQM-GV.RM-05', 'CQ-GV.RM', 'GV.RM-05', 1.0),
('CQM-GV.RM-06', 'CQ-GV.RM', 'GV.RM-06', 1.0),
('CQM-GV.RM-07', 'CQ-GV.RM', 'GV.RM-07', 1.0);

-- GV.RR subcategories (4)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-GV.RR-01', 'CQ-GV.RR', 'GV.RR-01', 1.0),
('CQM-GV.RR-02', 'CQ-GV.RR', 'GV.RR-02', 1.0),
('CQM-GV.RR-03', 'CQ-GV.RR', 'GV.RR-03', 1.0),
('CQM-GV.RR-04', 'CQ-GV.RR', 'GV.RR-04', 1.0);

-- GV.PO subcategories (3)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-GV.PO-01', 'CQ-GV.PO', 'GV.PO-01', 1.0),
('CQM-GV.PO-02', 'CQ-GV.PO', 'GV.PO-02', 1.0),
('CQM-GV.PO-03', 'CQ-GV.PO', 'GV.PO-03', 1.0);

-- GV.OV subcategories (3)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-GV.OV-01', 'CQ-GV.OV', 'GV.OV-01', 1.0),
('CQM-GV.OV-02', 'CQ-GV.OV', 'GV.OV-02', 1.0),
('CQM-GV.OV-03', 'CQ-GV.OV', 'GV.OV-03', 1.0);

-- GV.SC subcategories (10)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-GV.SC-01', 'CQ-GV.SC', 'GV.SC-01', 1.0),
('CQM-GV.SC-02', 'CQ-GV.SC', 'GV.SC-02', 1.0),
('CQM-GV.SC-03', 'CQ-GV.SC', 'GV.SC-03', 1.0),
('CQM-GV.SC-04', 'CQ-GV.SC', 'GV.SC-04', 1.0),
('CQM-GV.SC-05', 'CQ-GV.SC', 'GV.SC-05', 1.0),
('CQM-GV.SC-06', 'CQ-GV.SC', 'GV.SC-06', 1.0),
('CQM-GV.SC-07', 'CQ-GV.SC', 'GV.SC-07', 1.0),
('CQM-GV.SC-08', 'CQ-GV.SC', 'GV.SC-08', 1.0),
('CQM-GV.SC-09', 'CQ-GV.SC', 'GV.SC-09', 1.0),
('CQM-GV.SC-10', 'CQ-GV.SC', 'GV.SC-10', 1.0);

-- ID.AM subcategories (8)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-ID.AM-01', 'CQ-ID.AM', 'ID.AM-01', 1.0),
('CQM-ID.AM-02', 'CQ-ID.AM', 'ID.AM-02', 1.0),
('CQM-ID.AM-03', 'CQ-ID.AM', 'ID.AM-03', 1.0),
('CQM-ID.AM-04', 'CQ-ID.AM', 'ID.AM-04', 1.0),
('CQM-ID.AM-05', 'CQ-ID.AM', 'ID.AM-05', 1.0),
('CQM-ID.AM-07', 'CQ-ID.AM', 'ID.AM-07', 1.0),
('CQM-ID.AM-08', 'CQ-ID.AM', 'ID.AM-08', 1.0),
('CQM-ID.AM-09', 'CQ-ID.AM', 'ID.AM-09', 1.0);

-- ID.RA subcategories (10)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-ID.RA-01', 'CQ-ID.RA', 'ID.RA-01', 1.0),
('CQM-ID.RA-02', 'CQ-ID.RA', 'ID.RA-02', 1.0),
('CQM-ID.RA-03', 'CQ-ID.RA', 'ID.RA-03', 1.0),
('CQM-ID.RA-04', 'CQ-ID.RA', 'ID.RA-04', 1.0),
('CQM-ID.RA-05', 'CQ-ID.RA', 'ID.RA-05', 1.0),
('CQM-ID.RA-06', 'CQ-ID.RA', 'ID.RA-06', 1.0),
('CQM-ID.RA-07', 'CQ-ID.RA', 'ID.RA-07', 1.0),
('CQM-ID.RA-08', 'CQ-ID.RA', 'ID.RA-08', 1.0),
('CQM-ID.RA-09', 'CQ-ID.RA', 'ID.RA-09', 1.0),
('CQM-ID.RA-10', 'CQ-ID.RA', 'ID.RA-10', 1.0);

-- ID.IM subcategories (4)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-ID.IM-01', 'CQ-ID.IM', 'ID.IM-01', 1.0),
('CQM-ID.IM-02', 'CQ-ID.IM', 'ID.IM-02', 1.0),
('CQM-ID.IM-03', 'CQ-ID.IM', 'ID.IM-03', 1.0),
('CQM-ID.IM-04', 'CQ-ID.IM', 'ID.IM-04', 1.0);

-- PR.AA subcategories (6)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-PR.AA-01', 'CQ-PR.AA', 'PR.AA-01', 1.0),
('CQM-PR.AA-02', 'CQ-PR.AA', 'PR.AA-02', 1.0),
('CQM-PR.AA-03', 'CQ-PR.AA', 'PR.AA-03', 1.0),
('CQM-PR.AA-04', 'CQ-PR.AA', 'PR.AA-04', 1.0),
('CQM-PR.AA-05', 'CQ-PR.AA', 'PR.AA-05', 1.0),
('CQM-PR.AA-06', 'CQ-PR.AA', 'PR.AA-06', 1.0);

-- PR.AT subcategories (2)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-PR.AT-01', 'CQ-PR.AT', 'PR.AT-01', 1.0),
('CQM-PR.AT-02', 'CQ-PR.AT', 'PR.AT-02', 1.0);

-- PR.DS subcategories (11)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-PR.DS-01', 'CQ-PR.DS', 'PR.DS-01', 1.0),
('CQM-PR.DS-02', 'CQ-PR.DS', 'PR.DS-02', 1.0),
('CQM-PR.DS-10', 'CQ-PR.DS', 'PR.DS-10', 1.0),
('CQM-PR.DS-11', 'CQ-PR.DS', 'PR.DS-11', 1.0),
('CQM-PR.DS-03', 'CQ-PR.DS', 'PR.DS-03', 1.0),
('CQM-PR.DS-04', 'CQ-PR.DS', 'PR.DS-04', 1.0),
('CQM-PR.DS-05', 'CQ-PR.DS', 'PR.DS-05', 1.0),
('CQM-PR.DS-06', 'CQ-PR.DS', 'PR.DS-06', 1.0),
('CQM-PR.DS-07', 'CQ-PR.DS', 'PR.DS-07', 1.0),
('CQM-PR.DS-08', 'CQ-PR.DS', 'PR.DS-08', 1.0),
('CQM-PR.DS-09', 'CQ-PR.DS', 'PR.DS-09', 1.0);

-- PR.PS subcategories (2)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-PR.PS-01', 'CQ-PR.PS', 'PR.PS-01', 1.0),
('CQM-PR.PS-02', 'CQ-PR.PS', 'PR.PS-02', 1.0);

-- PR.IR subcategories (4)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-PR.IR-01', 'CQ-PR.IR', 'PR.IR-01', 1.0),
('CQM-PR.IR-02', 'CQ-PR.IR', 'PR.IR-02', 1.0),
('CQM-PR.IR-03', 'CQ-PR.IR', 'PR.IR-03', 1.0),
('CQM-PR.IR-04', 'CQ-PR.IR', 'PR.IR-04', 1.0);

-- DE.CM subcategories (9)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-DE.CM-01', 'CQ-DE.CM', 'DE.CM-01', 1.0),
('CQM-DE.CM-02', 'CQ-DE.CM', 'DE.CM-02', 1.0),
('CQM-DE.CM-03', 'CQ-DE.CM', 'DE.CM-03', 1.0),
('CQM-DE.CM-06', 'CQ-DE.CM', 'DE.CM-06', 1.0),
('CQM-DE.CM-09', 'CQ-DE.CM', 'DE.CM-09', 1.0),
('CQM-DE.CM-04', 'CQ-DE.CM', 'DE.CM-04', 1.0),
('CQM-DE.CM-07', 'CQ-DE.CM', 'DE.CM-07', 1.0),
('CQM-DE.CM-08', 'CQ-DE.CM', 'DE.CM-08', 1.0),
('CQM-DE.CM-05', 'CQ-DE.CM', 'DE.CM-05', 1.0);

-- DE.AE subcategories (7)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-DE.AE-02', 'CQ-DE.AE', 'DE.AE-02', 1.0),
('CQM-DE.AE-03', 'CQ-DE.AE', 'DE.AE-03', 1.0),
('CQM-DE.AE-04', 'CQ-DE.AE', 'DE.AE-04', 1.0),
('CQM-DE.AE-06', 'CQ-DE.AE', 'DE.AE-06', 1.0),
('CQM-DE.AE-07', 'CQ-DE.AE', 'DE.AE-07', 1.0),
('CQM-DE.AE-08', 'CQ-DE.AE', 'DE.AE-08', 1.0),
('CQM-DE.AE-01', 'CQ-DE.AE', 'DE.AE-01', 1.0);

-- DE.DP subcategories (5)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-DE.DP-01', 'CQ-DE.DP', 'DE.DP-01', 1.0),
('CQM-DE.DP-02', 'CQ-DE.DP', 'DE.DP-02', 1.0),
('CQM-DE.DP-03', 'CQ-DE.DP', 'DE.DP-03', 1.0),
('CQM-DE.DP-04', 'CQ-DE.DP', 'DE.DP-04', 1.0),
('CQM-DE.DP-05', 'CQ-DE.DP', 'DE.DP-05', 1.0);

-- RS.MA subcategories (5)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-RS.MA-01', 'CQ-RS.MA', 'RS.MA-01', 1.0),
('CQM-RS.MA-02', 'CQ-RS.MA', 'RS.MA-02', 1.0),
('CQM-RS.MA-03', 'CQ-RS.MA', 'RS.MA-03', 1.0),
('CQM-RS.MA-04', 'CQ-RS.MA', 'RS.MA-04', 1.0),
('CQM-RS.MA-05', 'CQ-RS.MA', 'RS.MA-05', 1.0);

-- RS.AN subcategories (4)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-RS.AN-03', 'CQ-RS.AN', 'RS.AN-03', 1.0),
('CQM-RS.AN-06', 'CQ-RS.AN', 'RS.AN-06', 1.0),
('CQM-RS.AN-07', 'CQ-RS.AN', 'RS.AN-07', 1.0),
('CQM-RS.AN-08', 'CQ-RS.AN', 'RS.AN-08', 1.0);

-- RS.CO subcategories (3)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-RS.CO-02', 'CQ-RS.CO', 'RS.CO-02', 1.0),
('CQM-RS.CO-03', 'CQ-RS.CO', 'RS.CO-03', 1.0),
('CQM-RS.CO-04', 'CQ-RS.CO', 'RS.CO-04', 1.0);

-- RC.RP subcategories (3)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-RC.RP-01', 'CQ-RC.RP', 'RC.RP-01', 1.0),
('CQM-RC.RP-02', 'CQ-RC.RP', 'RC.RP-02', 1.0),
('CQM-RC.RP-03', 'CQ-RC.RP', 'RC.RP-03', 1.0);

-- RC.IM subcategories (2)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-RC.IM-01', 'CQ-RC.IM', 'RC.IM-01', 1.0),
('CQM-RC.IM-02', 'CQ-RC.IM', 'RC.IM-02', 1.0);

-- RC.CO subcategories (3)
INSERT INTO consolidated_question_mappings (id, consolidated_question_id, subcategory_id, weight) VALUES
('CQM-RC.CO-01', 'CQ-RC.CO', 'RC.CO-01', 1.0),
('CQM-RC.CO-02', 'CQ-RC.CO', 'RC.CO-02', 1.0),
('CQM-RC.CO-03', 'CQ-RC.CO', 'RC.CO-03', 1.0);
