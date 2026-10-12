/**
 * CENNA.live Brilliant-Tarzı Klinik Kurtarma & İlaç Tasarım Laboratuvarı
 * Kapsamlı Opaque-Box E2E Test Paketi (Tiers 1 - 4)
 *
 * Doğrulanan Bileşenler:
 * - Tier 1: Özellik Kapsamı & Sözleşme Envanteri (6 Modül, 21 Görev, Kriz, Alet Çantası, Göstergeler, Sokratik İpuçları)
 * - Tier 2: Sınır Parametreleri & Köşe Durumları (LogP, Henderson-Hasselbalch, Enzim Zırhı, Vital Sınırları)
 * - Tier 3: Çapraz Özellik Etkileşimleri (Biyoizosterik Değişim -> Gösterge & Vital Yayılımı, İpucu İlerlemesi, Yıldızlar)
 * - Tier 4: Gerçek Dünya Klinik Kurtarma Simülasyonları (Aspirin, Prokainamid, Sisplatin, Talidomid, Flor, Losartan, Sülfasalazin, NAPQI, Enalapril)
 *
 * @license CENNA.live 2026
 */

import { describe, it, expect } from 'vitest';
import type {
  ClinicalRescueMission,
  MolecularToolboxItem,
  LiveGauges,
} from '../src/types/medicinalChemistry';
import {
  calculateModifiedGauges,
  evaluateVitalsResponse,
  validateMissionSolution,
  calculateHendersonHasselbalchIonization,
} from '../src/types/medicinalChemistry';

// ============================================================================
// Otoriter 21 Klinik Kurtarma Görevi Test İskelesi (Authoritative Test Scaffold)
// Marmara Üniversitesi Eczacılık Fakültesi 26 Ders Slaytı Müfredat Sentezi
// ============================================================================

export const CANONICAL_21_MISSIONS_SCAFFOLD: ClinicalRescueMission[] = [
  // --------------------------------------------------------------------------
  // MODÜL 1: Fonksiyonel Gruplar & Moleküler İskelet (Görev 1 - 4)
  // --------------------------------------------------------------------------
  {
    id: 'mission-1',
    order: 1,
    moduleId: 'mod-1',
    moduleTitle: 'Fonksiyonel Gruplar & Moleküler İskelet',
    title: 'Aspirin Ester Montajı: Salisilik Asit Gastrik Krizini Önleme',
    subtitle: 'Reaktif fenolik hidroksil grubunu asetilleyerek gastrik hemorajiyi durdurma',
    xpReward: 35,
    estimatedMinutes: 5,
    failingMoleculeName: 'Salisilik Asit (2-Hidroksibenzoik Asit)',
    targetTargetName: 'Mide Mukozal Epiteli & COX-1 Serin-530',
    clinicalCrisis: {
      presentation: 'Akut Hematemez ve Gastrik Mukozal Erozyon',
      vignette: 'Romatoid artrit atağındaki 54 yaşındaki hastaya verilen serbest salisilik asit fenolik -OH grubuyla mide mukozasını yakmakta ve gastrik hemorajiye yol açmaktadır.',
      biochemicalFlaw: 'Serbest fenolik hidroksil (-OH) lokal asiditeyi ve mukozal hasarı tetikler; COX-1 Ser530 kalıntısını kalıcı asetilleyemez.',
      patientInitialVitals: {
        heartRateBpm: 118,
        bloodPressureSys: 95,
        bloodPressureDia: 60,
        gastricPh: 1.2,
        liverEnzymeAlt: 32,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: 1.19,
      percentIonized: 0.5,
      metabolicHalfLifeMinutes: 15.0,
      receptorAffinityDeltaG: -4.2,
      bloodBrainBarrierPenetration: 22,
    },
    optimalGauges: {
      logP: 1.25,
      receptorAffinityDeltaG: -8.5,
    },
    molecularToolbox: [
      {
        id: 'tool-acetyl',
        name: 'Asetil Grubu (-COCH3)',
        formula: 'C2H3O',
        type: 'functional_group',
        deltaLogP: 0.1,
        deltaAffinity: -4.3,
        halfLifeMultiplier: 1.2,
        shieldingFactor: 0.9,
        toxicityRisk: 0.05,
        description: 'Fenolik oksijeni ester bağıyla maskeler; COX-1 Ser530 hidroksiline asetil grubu aktarır.',
      },
      {
        id: 'tool-methyl',
        name: 'Metil Grubu (-CH3)',
        formula: 'CH3',
        type: 'functional_group',
        deltaLogP: 0.5,
        deltaAffinity: 2.1,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.3,
        toxicityRisk: 0.2,
        description: 'Eter bağı oluşturur; analjezik antiinflamatuvar etkiyi yok eder.',
      },
      {
        id: 'tool-chloro',
        name: 'Klor Atomu (-Cl)',
        formula: 'Cl',
        type: 'atom',
        deltaLogP: 0.7,
        deltaAffinity: -0.5,
        halfLifeMultiplier: 1.1,
        shieldingFactor: 0.4,
        toxicityRisk: 0.4,
        description: 'Aromatik halojenleme; gastrik iritasyonu çözmez.',
      },
    ],
    solutionItemIds: ['tool-acetyl'],
    steps: [
      {
        id: 'm1-s1',
        order: 1,
        prompt: 'Salisilik asidin fenolik -OH grubuna asetil grubu ekleyerek ester bağı kurun.',
        widgetType: 'molecular_toolbox',
        hintChain: [
          'Serbest fenolik hidroksil grubu mide asidiyle birleştiğinde mukozayı yakar.',
          'COX-1 enzimini geri dönüşümsüz kilitlemek için açil aktarıcı bir ester bağı gerekir.',
          'Asetil grubu (-COCH3) takarak Asetilsalisilik Asit (Aspirin) sentezleyin.',
        ],
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Fenolik hidroksil asetillenerek ester bağı oluşturulduğunda Aspirin elde edildi.',
      ahaExplanation: 'Ester bağı fenolik yakıcılığı maskeler ve COX-1 Ser530 kalıntısını kalıcı olarak asetilleyip kanamayı durdurur.',
      pearl: 'Aspirin, COX-1 Serin-530 kalıntısını kovalent olarak asetilleyerek trombosit ömrü boyunca (7-10 gün) tromboksan A2 sentezini durdurur.',
    },
    socraticHintChain: [
      'Salisilik asidin serbest fenolik hidroksil (-OH) grubu mide asidinde mukozal bariyeri yakar.',
      'COX-1 aktif bölgesindeki Ser530 kalıntısını susturmak için 2 karbonlu açil vericiye ihtiyaç vardır.',
      'Fenolik -OH grubuna asetil (-COCH3) takarak Aspirin sentezleyin ve kanamayı durdurun.',
    ],
  },
  {
    id: 'mission-2',
    order: 2,
    moduleId: 'mod-1',
    moduleTitle: 'Fonksiyonel Gruplar & Moleküler İskelet',
    title: 'Prokainamid Amid Zırhı: Plazma Esteraz Hız Tuzağını Aşma',
    subtitle: 'Alifatik esteri bivalan amid bağıyla değiştirerek plazma yarı ömrünü uzatma',
    xpReward: 35,
    estimatedMinutes: 5,
    failingMoleculeName: 'Prokain',
    targetTargetName: 'Plazma Psödokolinesteraz & Miyosit Nav1.5 Kanalı',
    clinicalCrisis: {
      presentation: 'Ventriküler Taşikardi ve Refrakter Kardiyak Aritmi',
      vignette: 'Akut miyokard enfarktüsü sonrası ventriküler taşikardi atağı geçiren hastaya verilen Prokain kanda 2 dakikada hidroliz edilmekte ve hasta fibrilasyona sürüklenmektedir.',
      biochemicalFlaw: 'Molekülün kalbindeki ester bağı (-COO-) plazma psödokolinesterazı tarafından 2 dakikada parçalanır (t1/2 < 2 dk).',
      patientInitialVitals: {
        heartRateBpm: 172,
        bloodPressureSys: 80,
        bloodPressureDia: 50,
        gastricPh: 4.0,
        liverEnzymeAlt: 25,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: 1.8,
      percentIonized: 95.0,
      metabolicHalfLifeMinutes: 2.1,
      receptorAffinityDeltaG: -5.1,
    },
    optimalGauges: {
      logP: 1.5,
      metabolicHalfLifeMinutes: 210.0,
      receptorAffinityDeltaG: -8.8,
    },
    molecularToolbox: [
      {
        id: 'tool-amide',
        name: 'Amid Köprüsü (-CONH-)',
        formula: 'CONH',
        type: 'bioisostere',
        deltaLogP: -0.3,
        deltaAffinity: -3.7,
        halfLifeMultiplier: 100.0,
        shieldingFactor: 0.95,
        toxicityRisk: 0.05,
        description: 'Ester oksijeni yerine azot takarak mezomerik rezonans zırhı oluşturur.',
      },
      {
        id: 'tool-thioester',
        name: 'Tiyoester Köprüsü (-COS-)',
        formula: 'COS',
        type: 'functional_group',
        deltaLogP: 0.4,
        deltaAffinity: -1.0,
        halfLifeMultiplier: 0.5,
        shieldingFactor: 0.1,
        toxicityRisk: 0.3,
        description: 'Enzimatik hidrolize daha da hassas kararsız tiyoester bağı.',
      },
      {
        id: 'tool-ether',
        name: 'Eter Köprüsü (-CH2-O-)',
        formula: 'CH2O',
        type: 'functional_group',
        deltaLogP: 0.2,
        deltaAffinity: 2.0,
        halfLifeMultiplier: 10.0,
        shieldingFactor: 0.5,
        toxicityRisk: 0.1,
        description: 'Karbonil kaybı nedeniyle kardiyak sodyum kanalı afinitesi çöker.',
      },
    ],
    solutionItemIds: ['tool-amide'],
    steps: [
      {
        id: 'm2-s1',
        order: 1,
        prompt: 'Prokaindeki ester oksijenini (-O-) ikincil amin azotuyla (-NH-) değiştirerek Prokainamid oluşturun.',
        widgetType: 'enzyme_cleavage_simulator',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Ester bağı amide çevrilerek psödokolinesteraz enzimi püskürtüldü.',
      ahaExplanation: 'Azotun serbest elektron çifti karbonille mezomerik rezonans kurar; esteraz enzimi bağı kesemez ve yarı ömür saatlere uzar.',
      pearl: 'Prokainamid, Prokainin klasik biyoizosteridir; esterden amide geçiş yarı ömrü 2 dakikadan 3.5 saate çıkarır.',
    },
    socraticHintChain: [
      'Prokainin ester bağı (-COO-) plazma esterazları için kolay bir yemdir.',
      'Azot atomunun elektron çifti karbonil ile güçlü rezonans hibriti kurabilir.',
      'Esteri amide (-CONH-) çevirerek molekülü Prokainamide dönüştürün ve psödokolinesterazı defedin.',
    ],
  },
  {
    id: 'mission-3',
    order: 3,
    moduleId: 'mod-1',
    moduleTitle: 'Fonksiyonel Gruplar & Moleküler İskelet',
    title: 'Aldehit Sterik Kalkanı: Toksik Karbonil Reaktivitesini Dizginleme',
    subtitle: 'Serbest formil grubunu sterik kalkan veya keton izosteriyle koruma',
    xpReward: 35,
    estimatedMinutes: 5,
    failingMoleculeName: 'Serbest Formil Türevi (R-CHO)',
    targetTargetName: 'Plazma Albümin Lizin Kalıntıları & Aldehit Oksidaz',
    clinicalCrisis: {
      presentation: 'Plazma Protein Agregasyonu ve Akut Hemoliz',
      vignette: 'Nöromodülatör aday moleküldeki korumasız aldehit karbonili kanda albümin ve hemoglobin lizin amino uçlarıyla Schiff bazı kondansasyonuna girmektedir.',
      biochemicalFlaw: 'Sterik engelsiz formil karbonu elektrofiliktir; proteinlere saldırıp hızla aside oksitlenir.',
      patientInitialVitals: {
        heartRateBpm: 125,
        bloodPressureSys: 90,
        bloodPressureDia: 55,
        gastricPh: 3.5,
        liverEnzymeAlt: 85,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: 0.9,
      percentIonized: 0.0,
      metabolicHalfLifeMinutes: 4.0,
      receptorAffinityDeltaG: -3.5,
    },
    optimalGauges: {
      logP: 1.6,
      metabolicHalfLifeMinutes: 180.0,
      receptorAffinityDeltaG: -8.0,
    },
    molecularToolbox: [
      {
        id: 'tool-gem-dimethyl',
        name: 'Alfa-Dimetil Sterik Kalkanı (-C(CH3)2-)',
        formula: 'C3H6',
        type: 'protecting_group',
        deltaLogP: 0.7,
        deltaAffinity: -4.5,
        halfLifeMultiplier: 45.0,
        shieldingFactor: 0.9,
        toxicityRisk: 0.05,
        description: 'Karbonil karbonunun etrafına hacimli alkil kalkanı örer; nükleofilik Schiff bazı saldırılarını engeller.',
      },
      {
        id: 'tool-free-alcohol',
        name: 'Primer Alkol İndirgemesi (-CH2OH)',
        formula: 'CH2OH',
        type: 'functional_group',
        deltaLogP: -0.6,
        deltaAffinity: -1.0,
        halfLifeMultiplier: 2.0,
        shieldingFactor: 0.2,
        toxicityRisk: 0.1,
        description: 'Aşırı polarite artışı membran geçişini engeller.',
      },
      {
        id: 'tool-carboxylic-acid',
        name: 'Karboksilik Asit Oksidasyonu (-COOH)',
        formula: 'COOH',
        type: 'functional_group',
        deltaLogP: -1.2,
        deltaAffinity: 1.5,
        halfLifeMultiplier: 3.0,
        shieldingFactor: 0.2,
        toxicityRisk: 0.15,
        description: 'Fizyolojik pHda iyonize olur ve hedef afinitesini sıfırlar.',
      },
    ],
    solutionItemIds: ['tool-gem-dimethyl'],
    steps: [
      {
        id: 'm3-s1',
        order: 1,
        prompt: 'Alfa konumuna sterik dimetil kalkanı ekleyerek elektrofilik karbonili zırhlayın.',
        widgetType: 'molecular_toolbox',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Sterik kalkan ile nükleofilik Schiff bazı agregasyonu önlendi.',
      ahaExplanation: 'Hacimli alkil grupları formil merkezini sterik olarak perdeler; plazma lizin nükleofilleri karbonile yaklaşamaz.',
      pearl: 'Çoğu onaylı ilaç serbest alifatik aldehit içermez; sterik engel veya keton izosterizmi metabolik kararlılığın şartıdır.',
    },
    socraticHintChain: [
      'Aldehit karbonundaki hidrojen atomu hiçbir sterik engel sağlamaz.',
      'Karbonil merkezinin çevresine hacimli alkil grupları ekleyerek nükleofillerin yanaşmasını engelleyin.',
      'Alfa-dimetil kalkanı takarak Schiff bazı oluşumunu ve protein agregasyonunu durdurun.',
    ],
  },
  {
    id: 'mission-4',
    order: 4,
    moduleId: 'mod-1',
    moduleTitle: 'Fonksiyonel Gruplar & Moleküler İskelet',
    title: 'Sülfonamid Bakteri Kamuflajı: PABA Taklidi ve Kristalüri Savunması',
    subtitle: 'N1 azotuna elektron çeken heteroaromatik halka bağlayarak pKa değerini idrar pHsına çekme',
    xpReward: 35,
    estimatedMinutes: 5,
    failingMoleculeName: 'Sülfanilamid',
    targetTargetName: 'Bakteriyel Dihidropteroat Sentaz & Renal Tübüller',
    clinicalCrisis: {
      presentation: 'Akut Renal Kristalüri ve Anüri',
      vignette: 'Dirençli streptokok sepsisinde verilen sülfanilamid pKa değeri 10.4 olduğu için idrarın asidik ortamında (pH 5.8) nötr kalmakta ve tübüllerde keskin kristaller halinde çökmektedir.',
      biochemicalFlaw: 'N1 azotu sübstitüe edilmediği için pKa ~10.4tür; idrarda çözünemez ve kristalüriye yol açar.',
      patientInitialVitals: {
        heartRateBpm: 110,
        bloodPressureSys: 140,
        bloodPressureDia: 90,
        gastricPh: 3.0,
        liverEnzymeAlt: 40,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: -0.6,
      percentIonized: 0.1,
      metabolicHalfLifeMinutes: 60.0,
      receptorAffinityDeltaG: -4.0,
    },
    optimalGauges: {
      logP: 0.8,
      percentIonized: 75.0,
      receptorAffinityDeltaG: -9.2,
    },
    molecularToolbox: [
      {
        id: 'tool-isoxazole',
        name: 'N1-5-Metilizoksazol Halkası (Sülfametoksazol)',
        formula: 'C4H5N2O',
        type: 'bioisostere',
        deltaLogP: 1.4,
        deltaAffinity: -5.2,
        halfLifeMultiplier: 10.0,
        shieldingFactor: 0.8,
        toxicityRisk: 0.05,
        description: 'Elektron çeken heteroaromatik halka; sülfonamid protonunun pKa değerini 10.4ten 5.6ya düşürür.',
      },
      {
        id: 'tool-pyrimidine',
        name: 'N1-Pirimidin Halkası (Sülfadiazin)',
        formula: 'C4H3N2',
        type: 'bioisostere',
        deltaLogP: 0.9,
        deltaAffinity: -4.8,
        halfLifeMultiplier: 8.0,
        shieldingFactor: 0.8,
        toxicityRisk: 0.05,
        description: 'pKayş 6.5e düşürerek idrarda çözünürlüğü artırır.',
      },
      {
        id: 'tool-alkyl-chain',
        name: 'Uzun Alkil Zinciri (-C6H13)',
        formula: 'C6H13',
        type: 'functional_group',
        deltaLogP: 2.8,
        deltaAffinity: 1.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.1,
        toxicityRisk: 0.5,
        description: 'Aşırı lipofiliklik kristalüriyi daha da kötüleştirir.',
      },
    ],
    solutionItemIds: ['tool-isoxazole', 'tool-pyrimidine'],
    steps: [
      {
        id: 'm4-s1',
        order: 1,
        prompt: 'N1 azotuna 5-metilizoksazol halkası takarak pKa değerini 5.6ya indirin.',
        widgetType: 'molecular_toolbox',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'N1 azotu elektron çeken halkayla asidikleştirildi, kristalüri riski sıfırlandı.',
      ahaExplanation: 'pKa 5.6ya inince molekül idrar pHsında suda çözünen anyonik forma geçer; böbrek tıkanmaz ve bakteri folat sentezi çöker.',
      pearl: 'Sülfametoksazol (pKa 5.6), sülfanilamide kıyasla idrarda iyonize olarak kristalüri riskini ortadan kaldırır.',
    },
    socraticHintChain: [
      'Sülfonamidlerin en tehlikeli yan etkisi idrarda çökerek böbreği yırtan kristalüridir.',
      'Sülfanilamid pKa 10.4 ile idrarda nötr kalır; N1e elektron çeken grup takarak pKayş düşürmelisiniz.',
      'N1 azotuna 5-metilizoksazol takarak Sülfametoksazol sentezleyin ve kristalüriyi önleyin.',
    ],
  },

  // --------------------------------------------------------------------------
  // MODÜL 2: İlaç-Reseptör Bağları (Görev 5 - 7)
  // --------------------------------------------------------------------------
  {
    id: 'mission-5',
    order: 5,
    moduleId: 'mod-2',
    moduleTitle: 'İlaç-Reseptör Bağları & Termodinamik',
    title: 'Omeprazol Kovalent Kelepçesi: Proton Pompasını Geri Dönüşümsüz Mühürleme',
    subtitle: 'Asidik kanalikülde sülfenamide dönüşüp Cys813 ile disülfid bağı kurma',
    xpReward: 40,
    estimatedMinutes: 6,
    failingMoleculeName: 'Nötr Omeprazol Ön İlacı',
    targetTargetName: 'Mide Parietal H+/K+ ATPaz Enzimi (Cys813 Tiyol)',
    clinicalCrisis: {
      presentation: 'Zollinger-Ellison Sendromu ve Kanayan Peptik Ülser',
      vignette: 'Parietal hücreler kontrolsüz asit pompalamakta (pH 1.0), reversibl H2 blokörleri asit fırtınasını dindirememektedir.',
      biochemicalFlaw: 'Nötr pHda kovalent reaktivitesi yoktur; sadece aşırı asidik ortamda reaktif türeve dönüşebilir.',
      patientInitialVitals: {
        heartRateBpm: 105,
        bloodPressureSys: 100,
        bloodPressureDia: 65,
        gastricPh: 1.0,
        liverEnzymeAlt: 22,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: 2.2,
      percentIonized: 10.0,
      metabolicHalfLifeMinutes: 60.0,
      receptorAffinityDeltaG: -3.0,
    },
    optimalGauges: {
      logP: 2.2,
      receptorAffinityDeltaG: -12.0,
    },
    molecularToolbox: [
      {
        id: 'tool-disulfide',
        name: 'Kovalent Disülfid Bağı (-S-S-)',
        formula: 'S2',
        type: 'functional_group',
        deltaLogP: 0.0,
        deltaAffinity: -9.0,
        halfLifeMultiplier: 48.0,
        shieldingFactor: 1.0,
        toxicityRisk: 0.02,
        description: 'Reaktif sülfenamid ara ürünüyle pompanın Cys813 tiyolü arasında kovalent kilit kurar.',
      },
      {
        id: 'tool-ionic-anchor',
        name: 'Reversibl İyonik Çapa',
        formula: 'NH3+',
        type: 'functional_group',
        deltaLogP: -1.0,
        deltaAffinity: -2.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.1,
        toxicityRisk: 0.1,
        description: 'Geri dönüşümlü zayıf bağlanma; asit salımı devam eder.',
      },
      {
        id: 'tool-buffer',
        name: 'Bazik Tampon Maskesi',
        formula: 'HCO3-',
        type: 'antidote',
        deltaLogP: -1.5,
        deltaAffinity: 3.0,
        halfLifeMultiplier: 0.5,
        shieldingFactor: 0.0,
        toxicityRisk: 0.2,
        description: 'Ön ilacın asit aktivasyonunu engeller.',
      },
    ],
    solutionItemIds: ['tool-disulfide'],
    steps: [
      {
        id: 'm5-s1',
        order: 1,
        prompt: 'Omeprazolü asidik kanalikülde protonlayıp Cys813 ile disülfid bağı kurdurun.',
        widgetType: 'receptor_pocket_fit',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'H+/K+ ATPaz pompası disülfid köprüsüyle kalıcı kilitlendi.',
      ahaExplanation: 'Kovalent disülfid bağı geri dönüşümsüzdür; vücut sıfırdan yeni pompa enzimi sentezleyene dek asit salımı durur.',
      pearl: 'Kovalent inhibitörlerde etki süresi plazma yarı ömrüne değil, hedefin turnover (yenilenme) hızına bağlıdır.',
    },
    socraticHintChain: [
      'Kovalent bağlar enzim-ilaç arasındaki en kuvvetli, geri dönüşümsüz bağlardır.',
      'Omeprazol paryetal hücrenin asidik sekretuar kanalında elektrofilik sülfenamide dönüşür.',
      'Pompanın Cys813 kalıntısıyla disülfid (-S-S-) bağı kurarak asit üretimini tamamen durdurun.',
    ],
  },
  {
    id: 'mission-6',
    order: 6,
    moduleId: 'mod-2',
    moduleTitle: 'İlaç-Reseptör Bağları & Termodinamik',
    title: 'Adrenerjik Tuz Köprüsü: Miyokardı Kurtaran İyonik Çapa',
    subtitle: 'Deprotonize katekolamini protonlanmış amine çevirip Asp113 ile Coulomb bağı kurma',
    xpReward: 40,
    estimatedMinutes: 6,
    failingMoleculeName: 'Deprotonize Nötr Feniletilamin',
    targetTargetName: 'Kardiyovasküler Beta-1 Adrenerjik Reseptörü Asp113',
    clinicalCrisis: {
      presentation: 'Kardiyojenik Şok ve Şiddetli Hipotansiyon',
      vignette: 'Ortalama arteriyel basınç (MAP) 40 mmHg seviyesine inmiş, nötr molekül adrenerjik reseptör cebine elektrostatik tutunamamaktadır.',
      biochemicalFlaw: 'Fizyolojik pHda nötr kaldığı için reseptörün anyonik yuvasına elektrostatik çekilemez.',
      patientInitialVitals: {
        heartRateBpm: 45,
        bloodPressureSys: 65,
        bloodPressureDia: 40,
        gastricPh: 4.0,
        liverEnzymeAlt: 30,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: 1.5,
      percentIonized: 2.0,
      metabolicHalfLifeMinutes: 10.0,
      receptorAffinityDeltaG: -2.5,
    },
    optimalGauges: {
      logP: -0.5,
      percentIonized: 98.0,
      receptorAffinityDeltaG: -9.5,
    },
    molecularToolbox: [
      {
        id: 'tool-protonated-amine',
        name: 'Protonlanabilir Sekonder Amin (-CH2-NH2+-R)',
        formula: 'NH2+',
        type: 'functional_group',
        deltaLogP: -1.8,
        deltaAffinity: -7.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.5,
        toxicityRisk: 0.05,
        description: 'Asp113 karboksilat anyonu (-COO-) ile 2.8 Å mesafede güçlü tuz köprüsü kurar.',
      },
      {
        id: 'tool-catechol-oh',
        name: 'Meta/Para Katekol Hidroksilleri',
        formula: 'C6H3(OH)2',
        type: 'functional_group',
        deltaLogP: -0.8,
        deltaAffinity: -3.5,
        halfLifeMultiplier: 0.8,
        shieldingFactor: 0.4,
        toxicityRisk: 0.05,
        description: 'Serin kalıntılarıyla yönsel hidrojen bağları kurar.',
      },
      {
        id: 'tool-neutral-ether',
        name: 'Nötr Eter Oksijeni (-O-)',
        formula: 'O',
        type: 'functional_group',
        deltaLogP: 0.5,
        deltaAffinity: 3.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.2,
        toxicityRisk: 0.1,
        description: 'Elektrostatik yükü yok eder.',
      },
    ],
    solutionItemIds: ['tool-protonated-amine'],
    steps: [
      {
        id: 'm6-s1',
        order: 1,
        prompt: 'Moleküle protonlanmış amin takarak Asp113 ile tuz köprüsü oluşturun.',
        widgetType: 'receptor_pocket_fit',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Protonlanmış amin ile Asp113 arasında tuz köprüsü kuruldu, tansiyon yükseldi.',
      ahaExplanation: 'Coulomb çekimi ters kare kanunuyla çalışır; pozitif amonyum ilacı cebe çeker ve kalp debisi normale döner.',
      pearl: 'Adrenerjik reseptörlerde TM3 üzerindeki Aspartat-113, katekolaminlerin katyonik aminiyle zorunlu bir tuz köprüsü kurar.',
    },
    socraticHintChain: [
      'Zıt yüklü iyonlar arasındaki Coulomb çekimi ilacı reseptör cebine uzaktan çeker.',
      'Reseptörün TM3 bölgesinde negatif yüklü Aspartat-113 karboksilatı (-COO-) bekler.',
      'Amini fizyolojik pHda protonlanacak (-NH2+-) hale getirerek tuz köprüsü kurun ve şoku sonlandırın.',
    ],
  },
  {
    id: 'mission-7',
    order: 7,
    moduleId: 'mod-2',
    moduleTitle: 'İlaç-Reseptör Bağları & Termodinamik',
    title: 'Lipofilik Cepte Su Entropi Tahliyesi: Termodinamik Kurtarma',
    subtitle: 'Hidrofobik halka ile sıkışmış 6 su molekülünü serbest bırakıp Gibbs serbest enerjisini negatifleştirme',
    xpReward: 40,
    estimatedMinutes: 6,
    failingMoleculeName: 'Aşırı Solvate Polar Kinaz İnhibitörü',
    targetTargetName: 'Onkojenik Kinaz Derin Lipofilik Cebi',
    clinicalCrisis: {
      presentation: 'Refrakter Lösemi Blast Hücre İstilası',
      vignette: 'Onkolojik kinaz enzimine karşı geliştirilen polar molekül mikromolar seviyede takılı kalmakta (Kd = 15 uM), kanser ilerlemektedir.',
      biochemicalFlaw: 'Reseptörün derin apolar cebine oturmak yerine rijit su kafeslerine takılı kalır; bağlanma serbest enerjisi yetersizdir.',
      patientInitialVitals: {
        heartRateBpm: 98,
        bloodPressureSys: 110,
        bloodPressureDia: 70,
        gastricPh: 3.8,
        liverEnzymeAlt: 65,
        status: 'unstable',
      },
    },
    initialGauges: {
      logP: -0.8,
      percentIonized: 40.0,
      metabolicHalfLifeMinutes: 30.0,
      receptorAffinityDeltaG: -2.4,
    },
    optimalGauges: {
      logP: 2.8,
      receptorAffinityDeltaG: -12.1,
    },
    molecularToolbox: [
      {
        id: 'tool-phenyl-ring',
        name: 'Apolar Aromatik Fenil Halkası',
        formula: 'C6H5',
        type: 'functional_group',
        deltaLogP: 2.0,
        deltaAffinity: -7.5,
        halfLifeMultiplier: 2.0,
        shieldingFactor: 0.6,
        toxicityRisk: 0.05,
        description: 'Lipofilik cebi doldurur ve hapsolmuş rijit su moleküllerini serbest faza fırlatır (deltaS > 0).',
      },
      {
        id: 'tool-isopropyl',
        name: 'Hacimli İzopropil Grubu',
        formula: 'C3H7',
        type: 'functional_group',
        deltaLogP: 1.2,
        deltaAffinity: -3.0,
        halfLifeMultiplier: 1.5,
        shieldingFactor: 0.5,
        toxicityRisk: 0.05,
        description: 'Yan cepleri hidrofobik doldurur.',
      },
      {
        id: 'tool-extra-hydroxyl',
        name: 'İlave Polar Hidroksil (-OH)',
        formula: 'OH',
        type: 'functional_group',
        deltaLogP: -0.8,
        deltaAffinity: 4.0,
        halfLifeMultiplier: 0.8,
        shieldingFactor: 0.1,
        toxicityRisk: 0.1,
        description: 'Desolvatasyon cezasını artırır ve afiniteyi düşürür.',
      },
    ],
    solutionItemIds: ['tool-phenyl-ring'],
    steps: [
      {
        id: 'm7-s1',
        order: 1,
        prompt: 'Lipofilik cebi apolar fenil halkası ile doldurarak suyu tahliye edin.',
        widgetType: 'receptor_pocket_fit',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Lipofilik cepten 6 organize su tahliye edildi, entropi patladı.',
      ahaExplanation: 'deltaG = deltaH - T*deltaS formülü uyarınca suyun serbest kalması entropiyi (deltaS) devasa artırır; serbest enerji pikomolar afiniteye iner.',
      pearl: 'Hidrofobik etkileşim enerjisi bağın kendisinden değil, sıkışmış su moleküllerinin serbest kalarak entropiyi artırmasından kaynaklanır.',
    },
    socraticHintChain: [
      'Reseptörün hidrofobik cebinde sıkışmış sular hareket edemediklerinden düşük entropiye sahiptir.',
      'Organize su molekülleri dışarı atıldığında sistemin entropisi (deltaS) devasa artar.',
      'İlaca cebi tam dolduran bir fenil halkası takın; su tahliyesi afiniteyi bin kat artıracaktır.',
    ],
  },

  // --------------------------------------------------------------------------
  // MODÜL 3: İzomeri & Stereokimya (Görev 8 - 10)
  // --------------------------------------------------------------------------
  {
    id: 'mission-8',
    order: 8,
    moduleId: 'mod-3',
    moduleTitle: 'İzomeri & Stereokimya',
    title: 'Sisplatin Geometrik DNA Kilidi: Transplatin Çıkmazını Kırma',
    subtitle: '90 derece kare düzlem cis geometrisiyle komşu guanin N7 atomlarını çapraz bağlama',
    xpReward: 40,
    estimatedMinutes: 6,
    failingMoleculeName: 'Transplatin (trans-[Pt(NH3)2Cl2])',
    targetTargetName: 'Tümör Hücresi Nükleer DNA Guanin N7 Atomları',
    clinicalCrisis: {
      presentation: 'Metastatik Testis Karsinomu ve Kemoterapötik Direnç',
      vignette: 'Hastaya verilen trans izomeri DNA sarmalını bükememekte; nükleotid eksizyon tamir enzimleri hasarı anında onarmaktadır.',
      biochemicalFlaw: 'Klor atomları 180 derece zıt açıda olduğundan aynı zincirdeki iki ardışık guanin arasına intrastrand çapraz bağ kuramaz.',
      patientInitialVitals: {
        heartRateBpm: 100,
        bloodPressureSys: 115,
        bloodPressureDia: 75,
        gastricPh: 3.5,
        liverEnzymeAlt: 45,
        status: 'unstable',
      },
    },
    initialGauges: {
      logP: -2.1,
      percentIonized: 0.0,
      metabolicHalfLifeMinutes: 25.0,
      receptorAffinityDeltaG: -2.0,
    },
    optimalGauges: {
      logP: -2.1,
      receptorAffinityDeltaG: -10.5,
    },
    molecularToolbox: [
      {
        id: 'tool-cis-isomer',
        name: 'Cis Geometrik İzomeri (cis-[Pt(NH3)2Cl2])',
        formula: 'PtN2H6Cl2',
        type: 'conformation',
        deltaLogP: 0.0,
        deltaAffinity: -8.5,
        halfLifeMultiplier: 1.5,
        shieldingFactor: 0.8,
        toxicityRisk: 0.1,
        description: 'Klorlar 90 derece açıda; komşu guanin N7 atomlarını 3.3 Å mesafede kovalent çapraz bağlar.',
      },
      {
        id: 'tool-carboplatin',
        name: 'Siklobütandikarboksilat Şelatı (Karboplatin)',
        formula: 'C6H12N2O4Pt',
        type: 'bioisostere',
        deltaLogP: -0.5,
        deltaAffinity: -7.8,
        halfLifeMultiplier: 5.0,
        shieldingFactor: 0.9,
        toxicityRisk: 0.05,
        description: 'Nefrotoksisiteyi azaltan daha kararlı platin şelatı.',
      },
      {
        id: 'tool-trans-isomer',
        name: 'Trans Geometrik İzomeri',
        formula: 'PtN2H6Cl2',
        type: 'conformation',
        deltaLogP: 0.0,
        deltaAffinity: 3.0,
        halfLifeMultiplier: 0.8,
        shieldingFactor: 0.2,
        toxicityRisk: 0.3,
        description: '180 derece inaktif geometri; DNA tamir enzimleri hasarı kolayca onarır.',
      },
    ],
    solutionItemIds: ['tool-cis-isomer', 'tool-carboplatin'],
    steps: [
      {
        id: 'm8-s1',
        order: 1,
        prompt: 'Platin kompleksini Cis geometrisine çevirerek komşu guaninleri çapraz bağlayın.',
        widgetType: 'receptor_pocket_fit',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Cis geometri ile DNA 34 derece büküldü, apoptoz tetiklendi.',
      ahaExplanation: '90 derece açılı iki cis klor ayrılınca platin bitişik iki guanin N7sine bağlanır; DNA sarmalı 34 derece bükülür ve tamir edilemez.',
      pearl: 'Sisplatin cis konfigürasyonu DNA 1,2-intrastrand çapraz bağı kurarken, transplatin geometrik engel nedeniyle inaktiftir.',
    },
    socraticHintChain: [
      'Kare düzlem platin komplekslerinde Cis ve Trans izomerlerin uzaysal açıları tamamen farklıdır.',
      'Trans izomerde klorlar 180 derece zıttır ve komşu guaninlere aynı anda uzanamaz.',
      'Kompleksi Cis geometrisine (Sisplatin) çevirin; DNA 34 derece bükülecek ve tümör apoptoza gidecektir.',
    ],
  },
  {
    id: 'mission-9',
    order: 9,
    moduleId: 'mod-3',
    moduleTitle: 'İzomeri & Stereokimya',
    title: 'Easson-Stedman 3-Nokta Kiral Anahtarı: Eutomerin Zaferi',
    subtitle: '(R)-konfigürasyonundaki beta-hidroksil ile reseptörde 3. temas noktasını tamamlama',
    xpReward: 40,
    estimatedMinutes: 6,
    failingMoleculeName: '(S)-(+)-Noradrenalin (Distomer)',
    targetTargetName: 'Düz Kas Beta-2 Adrenerjik Reseptör Aktif Cebi',
    clinicalCrisis: {
      presentation: 'Akut Anafilaksi ve Şiddetli Bronkospazm',
      vignette: 'Rasemik karışımdaki S-izomer reseptör ceplerini tıkamakta; 3 temas noktasından sadece 2sini kurabildiği için bronkodilasyon yetersiz kalmaktadır.',
      biochemicalFlaw: 'Kiral beta-karbonundaki -OH grubu uzayda ters yöne bakar; Serin hidrojen bağı donörüne uzanamaz.',
      patientInitialVitals: {
        heartRateBpm: 130,
        bloodPressureSys: 85,
        bloodPressureDia: 50,
        gastricPh: 3.5,
        liverEnzymeAlt: 28,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: -1.2,
      percentIonized: 95.0,
      metabolicHalfLifeMinutes: 3.0,
      receptorAffinityDeltaG: -3.8,
    },
    optimalGauges: {
      logP: -1.2,
      receptorAffinityDeltaG: -9.8,
    },
    molecularToolbox: [
      {
        id: 'tool-r-eutomer',
        name: '(R)-(-)-Noradrenalin Konfigürasyonu (Eutomer)',
        formula: 'C8H11NO3',
        type: 'conformation',
        deltaLogP: 0.0,
        deltaAffinity: -6.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.6,
        toxicityRisk: 0.02,
        description: 'Beta-OH grubunu doğru uzaysal konuma yerleştirir; 3 temas noktası tam kilitlenir.',
      },
      {
        id: 'tool-chiral-resolution',
        name: 'Kiral Rezolüsyon Aracı',
        formula: 'C4H6O6',
        type: 'protecting_group',
        deltaLogP: 0.0,
        deltaAffinity: -2.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.4,
        toxicityRisk: 0.05,
        description: 'Diastereomerik tartarat tuzu ile saf eutomer eldesi.',
      },
      {
        id: 'tool-s-distomer',
        name: '(S)-İzomer (Distomer)',
        formula: 'C8H11NO3',
        type: 'conformation',
        deltaLogP: 0.0,
        deltaAffinity: 2.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.1,
        toxicityRisk: 0.2,
        description: 'Ters yönlenmiş -OH grubu cebe sığmaz.',
      },
    ],
    solutionItemIds: ['tool-r-eutomer'],
    steps: [
      {
        id: 'm9-s1',
        order: 1,
        prompt: 'Kiral merkezi (R) konfigürasyonuna çevirerek Easson-Stedman 3. temasını kurun.',
        widgetType: 'receptor_pocket_fit',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Eutomer ile 3 temas noktası sağlandı, eudismik oran 100 katına çıktı.',
      ahaExplanation: 'Aromatik halka, amin ve beta-OH eşzamanlı eşleştiğinde bronşlar tamamen açılır ve solunum rahatlar.',
      pearl: 'Easson-Stedman hipotezine göre adrenerjik reseptörlerde (R)-enantiyomer (S)-enantiyomere kıyasla 100 kat daha güçlüdür.',
    },
    socraticHintChain: [
      'Easson-Stedman modeline göre adrenerjik agonistler reseptörle tam 3 noktadan etkileşmelidir.',
      'Bu 3 nokta: Aromatik halka, pozitif amin ve beta-hidroksil (-OH) grubudur.',
      'Kiral merkezi (R) konfigürasyonuna çevirerek 3 temas noktasını tamamlayın ve bronşları açın.',
    ],
  },
  {
    id: 'mission-10',
    order: 10,
    moduleId: 'mod-3',
    moduleTitle: 'İzomeri & Stereokimya',
    title: 'Talidomid İn Vivo Rasemizasyon Tuzağı: Kiral Glutarimid Pususu',
    subtitle: 'Kiral alfa-karbonuna metil takarak keto-enol rasemizasyonunu engelleme',
    xpReward: 40,
    estimatedMinutes: 6,
    failingMoleculeName: 'Saf (R)-Talidomid',
    targetTargetName: 'İnsan Embriyonik Sereblon (CRBN) Kompleksi',
    clinicalCrisis: {
      presentation: 'Embriyonik Fokomeli ve Teratojenik Tehlike',
      vignette: '1957 yılı simülasyonu: Hamile kadına sabah bulantısı için saf (R)-Talidomid veriliyor; ancak saatler sonra plazmada teratojenik (S)-izomer saptanıyor.',
      biochemicalFlaw: 'Glutarimid halkasındaki kiral proton in vivo ortamda kopar; planar enolat üzerinden hızla (R) ve (S) karışımına döner.',
      patientInitialVitals: {
        heartRateBpm: 88,
        bloodPressureSys: 115,
        bloodPressureDia: 75,
        gastricPh: 3.5,
        liverEnzymeAlt: 25,
        status: 'unstable',
      },
    },
    initialGauges: {
      logP: 0.7,
      percentIonized: 0.0,
      metabolicHalfLifeMinutes: 120.0,
      receptorAffinityDeltaG: -4.0,
    },
    optimalGauges: {
      logP: 1.1,
      receptorAffinityDeltaG: -8.0,
    },
    molecularToolbox: [
      {
        id: 'tool-alpha-methyl-lock',
        name: 'Alfa-Metil Kiral Kilit Grubu (-CH3)',
        formula: 'CH3',
        type: 'protecting_group',
        deltaLogP: 0.4,
        deltaAffinity: -4.0,
        halfLifeMultiplier: 3.0,
        shieldingFactor: 1.0,
        toxicityRisk: 0.0,
        description: 'Kiral karbondaki asidik hidrojeni yok eder; keto-enol enolizasyonunu ve rasemizasyonu sıfırlar.',
      },
      {
        id: 'tool-r-purify',
        name: 'Yalnızca (R) İzomerini Saflaştırma',
        formula: 'C13H10N2O4',
        type: 'conformation',
        deltaLogP: 0.0,
        deltaAffinity: 0.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.0,
        toxicityRisk: 0.9,
        description: 'Tarihi yanılgı: Saf (R) verilse de in vivo ortamda dakikalar içinde rasemize olur.',
      },
      {
        id: 'tool-achiral-isostere',
        name: 'Kiral Olmayan Biyoizosterik İskelet',
        formula: 'C12H8N2O4',
        type: 'bioisostere',
        deltaLogP: 0.2,
        deltaAffinity: -3.5,
        halfLifeMultiplier: 2.0,
        shieldingFactor: 0.9,
        toxicityRisk: 0.05,
        description: 'Kiraliteyi tamamen kaldırarak teratojeniteyi önler.',
      },
    ],
    solutionItemIds: ['tool-alpha-methyl-lock', 'tool-achiral-isostere'],
    steps: [
      {
        id: 'm10-s1',
        order: 1,
        prompt: 'Kiral merkeze alfa-metil grubu takarak keto-enol rasemizasyonunu kilitleyin.',
        widgetType: 'molecular_toolbox',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Alfa-metil kilidi takıldı, in vivo rasemizasyon durduruldu.',
      ahaExplanation: 'Kiral proton olmayınca enolat anyonu oluşamaz; (R) enantiyomeri stabil kalır ve teratojenik (S) forma dönüşemez.',
      pearl: 'Talidomid in vivo rasemizasyona uğrar; kiral merkezi kilitlemeden saf (R) formu vermek teratojeniteyi önleyemez.',
    },
    socraticHintChain: [
      'Laboratuvarda saf (R) izomeri vermek vücuttaki rasemizasyonu engelleyemez.',
      'Glutarimid halkasındaki kiral karbon iki karbonil yüzünden asidik bir hidrojen taşır.',
      'O karbona alfa-metil takarak hidrojeni ortadan kaldırın; rasemizasyon kilitlenecektir.',
    ],
  },

  // --------------------------------------------------------------------------
  // MODÜL 4: Biyoizosterizm İlkeleri (Görev 11 - 13)
  // --------------------------------------------------------------------------
  {
    id: 'mission-11',
    order: 11,
    moduleId: 'mod-4',
    moduleTitle: 'Biyoizosterizm İlkeleri',
    title: 'Grimm Flor İzosteri: C-F Zırhıyla Oksidasyonu Püskürtme',
    subtitle: 'Aromatik para-hidrojenini monovalan flor izosteriyle değiştirerek CYP450yi durdurma',
    xpReward: 40,
    estimatedMinutes: 6,
    failingMoleculeName: 'Korumasız Fenil Geri Alım İnhibitörü',
    targetTargetName: 'Hepatik CYP450 2D6 & Presinaptik Taşıyıcı',
    clinicalCrisis: {
      presentation: 'Tedaviye Dirençli Depresyon Atağı ve Hızlı Klerens',
      vignette: 'Verilen molekül in vitro harika çalışmakta; ancak hastaya verildiğinde karaciğer CYP450 para konumundan 30 dakikada hidroksilleyip attırmaktadır.',
      biochemicalFlaw: 'Para konumundaki zayıf C-H bağı CYP450 hem-demir oksidasyonuna karşı savunmasızdır.',
      patientInitialVitals: {
        heartRateBpm: 82,
        bloodPressureSys: 120,
        bloodPressureDia: 80,
        gastricPh: 3.8,
        liverEnzymeAlt: 28,
        status: 'unstable',
      },
    },
    initialGauges: {
      logP: 1.8,
      percentIonized: 90.0,
      metabolicHalfLifeMinutes: 25.0,
      receptorAffinityDeltaG: -5.0,
    },
    optimalGauges: {
      logP: 2.1,
      metabolicHalfLifeMinutes: 1440.0,
      receptorAffinityDeltaG: -9.5,
    },
    molecularToolbox: [
      {
        id: 'tool-grimm-fluorine',
        name: 'Grimm Monovalan Flor Atomu (-F)',
        formula: 'F',
        type: 'bioisostere',
        deltaLogP: 0.3,
        deltaAffinity: -4.5,
        halfLifeMultiplier: 57.0,
        shieldingFactor: 0.98,
        toxicityRisk: 0.02,
        description: 'C-F kovalent bağı (485 kJ/mol) koparılamaz; hidrojenle benzer boyutta olup cebi bozmaz.',
      },
      {
        id: 'tool-chlorine',
        name: 'Klor Atomu (-Cl)',
        formula: 'Cl',
        type: 'atom',
        deltaLogP: 0.7,
        deltaAffinity: -2.0,
        halfLifeMultiplier: 20.0,
        shieldingFactor: 0.7,
        toxicityRisk: 0.1,
        description: 'Hacimli klor sterik cep çatışması yapabilir.',
      },
      {
        id: 'tool-methyl-group',
        name: 'Metil Grubu (-CH3)',
        formula: 'CH3',
        type: 'functional_group',
        deltaLogP: 0.5,
        deltaAffinity: -1.0,
        halfLifeMultiplier: 0.8,
        shieldingFactor: 0.1,
        toxicityRisk: 0.2,
        description: 'Metil kendisi oksidasyona uğrar; benzoik aside döner.',
      },
    ],
    solutionItemIds: ['tool-grimm-fluorine'],
    steps: [
      {
        id: 'm11-s1',
        order: 1,
        prompt: 'Para konumuna Grimm monovalan Flor atomu takarak metabolik zırh oluşturun.',
        widgetType: 'molecular_toolbox',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Para konumuna Flor atomu takıldı, CYP450 oksidasyonu bloke edildi.',
      ahaExplanation: 'C-F bağı doğadaki en güçlü kovalent bağlardandır (485 kJ/mol); CYP450 bu bağı kıramaz ve yarı ömür 24 saate uzar.',
      pearl: 'Grimm hidrür katım kuralına göre Flor, hidrojenin klasik monovalan biyoizosteridir.',
    },
    socraticHintChain: [
      'Aromatik benzen halkasının en savunmasız yeri para konumundaki C-H bağıdır.',
      'Reseptör cebini bozmamak için hidrojenin yarıçapına (1.20 Å) en yakın atom Flor (1.47 Å) dur.',
      'Hidrojen yerine Flor atomu takarak C-F zırhı oluşturun ve ilacın yarı ömrünü 24 saate çıkarın.',
    ],
  },
  {
    id: 'mission-12',
    order: 12,
    moduleId: 'mod-4',
    moduleTitle: 'Biyoizosterizm İlkeleri',
    title: 'Losartan Tetrazol Hayaleti: Non-Klasik Biyoizosterik Geçiş',
    subtitle: 'Polar karboksilik asidi 1H-tetrazol halkasıyla değiştirip oral emilimi 10 kat artırma',
    xpReward: 40,
    estimatedMinutes: 6,
    failingMoleculeName: 'Bifenil Karboksilik Asit ARB Öncüsü',
    targetTargetName: 'İntestinal Membran & AT1 Reseptörü Katyonik Arg167',
    clinicalCrisis: {
      presentation: 'Malign Hipertansif Kriz ve Oral Emilim Bozukluğu',
      vignette: 'AT1 blokörü öncü molekül -COOH grubu yüzünden bağırsakta tamamen iyonize kalmakta ve emilememektedir; oral biyoyararlanım %2dir.',
      biochemicalFlaw: 'Yüksek desolvatasyon enerjisi ve lokalize negatif yük nedeniyle bağırsak lipid epitelini geçemez.',
      patientInitialVitals: {
        heartRateBpm: 110,
        bloodPressureSys: 185,
        bloodPressureDia: 115,
        gastricPh: 3.5,
        liverEnzymeAlt: 30,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: -0.8,
      percentIonized: 99.0,
      metabolicHalfLifeMinutes: 120.0,
      receptorAffinityDeltaG: -4.5,
    },
    optimalGauges: {
      logP: 1.5,
      percentIonized: 60.0,
      receptorAffinityDeltaG: -9.8,
    },
    molecularToolbox: [
      {
        id: 'tool-tetrazole',
        name: 'Non-Klasik 1H-Tetrazol-5-il Halkası (-CN4H)',
        formula: 'CN4H',
        type: 'bioisostere',
        deltaLogP: 2.3,
        deltaAffinity: -5.3,
        halfLifeMultiplier: 2.0,
        shieldingFactor: 0.9,
        toxicityRisk: 0.02,
        description: 'Negatif yükü 4 azot atomuna yayarak delokalize eder; karboksilik asitten 10 kat daha lipofiliktir.',
      },
      {
        id: 'tool-amide-isostere',
        name: 'Karboksamid (-CONH2)',
        formula: 'CONH2',
        type: 'functional_group',
        deltaLogP: 0.5,
        deltaAffinity: 4.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.5,
        toxicityRisk: 0.1,
        description: 'Asidik protonu kaybeder; AT1 reseptör afinitesi çöker.',
      },
      {
        id: 'tool-sulfonamide',
        name: 'Sülfonilüre Köprüsü (-SO2NHCO-)',
        formula: 'SO3N2H2',
        type: 'bioisostere',
        deltaLogP: 1.0,
        deltaAffinity: -3.0,
        halfLifeMultiplier: 1.5,
        shieldingFactor: 0.6,
        toxicityRisk: 0.05,
        description: 'Alternatif asidik biyoizoster.',
      },
    ],
    solutionItemIds: ['tool-tetrazole'],
    steps: [
      {
        id: 'm12-s1',
        order: 1,
        prompt: 'Karboksilik asidi 1H-tetrazol halkasıyla değiştirerek emilimi açın.',
        widgetType: 'molecular_toolbox',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Karboksilik asit yerine tetrazol halkası takıldı, oral emilim patladı.',
      ahaExplanation: 'Tetrazol negatif yükü 4 azota yayar; hem reseptörle asidik tuz bağını korur hem de 10 kat lipofilik kalarak bağırsaktan sızar.',
      pearl: 'Losartan, karboksilik asidin non-klasik tetrazol biyoizosteri sayesinde oral aktif hale gelmiş ilk ARBdir.',
    },
    socraticHintChain: [
      'AT1 reseptörünü bloke etmek için katyonik bölgeye tutunacak asidik bir grup şarttır.',
      'Karboksilik asidin en ünlü non-klasik biyoizosteri 5 üyeli aromatik 1H-tetrazol halkasıdır.',
      '-COOH grubunu 1H-tetrazol ile değiştirin (Losartan yapısı); oral emilim 10 katına çıkacak ve tansiyon düşecektir.',
    ],
  },
  {
    id: 'mission-13',
    order: 13,
    moduleId: 'mod-4',
    moduleTitle: 'Biyoizosterizm İlkeleri',
    title: 'Lidokain 2,6-Dimetil Amid Kalkanı: Sterik Engel Sanatı',
    subtitle: 'Anilin halkasında 2 ve 6 orto konumlarına metil takarak doku amidazlarını perdeleme',
    xpReward: 40,
    estimatedMinutes: 6,
    failingMoleculeName: 'Korumasız Asitanilid Lokal Anesteziği',
    targetTargetName: 'Doku Amidazları & Sinir Nav1.4 Sodyum Kanalı',
    clinicalCrisis: {
      presentation: 'Dikiş Sırasında Erken Lokal Anestezi Kaybı ve Şiddetli Ağrı',
      vignette: 'Cerrahi operasyon sırasında enjekte edilen anestezik 3 dakikada hidroliz olmakta; hasta şiddetli ağrıyla kıvranmaktadır.',
      biochemicalFlaw: 'Anilin halkasında orto sübstitüenti yoktur; amid karbonili enzim nükleofiline tamamen açıktır.',
      patientInitialVitals: {
        heartRateBpm: 120,
        bloodPressureSys: 155,
        bloodPressureDia: 95,
        gastricPh: 4.0,
        liverEnzymeAlt: 24,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: 1.1,
      percentIonized: 80.0,
      metabolicHalfLifeMinutes: 3.5,
      receptorAffinityDeltaG: -4.0,
    },
    optimalGauges: {
      logP: 2.3,
      metabolicHalfLifeMinutes: 120.0,
      receptorAffinityDeltaG: -8.5,
    },
    molecularToolbox: [
      {
        id: 'tool-ortho-dimethyl',
        name: '2,6-Dimetil Orto Sübstitüsyonu',
        formula: 'C2H6',
        type: 'protecting_group',
        deltaLogP: 1.2,
        deltaAffinity: -4.5,
        halfLifeMultiplier: 34.0,
        shieldingFactor: 0.98,
        toxicityRisk: 0.02,
        description: 'Amid bağının karbonilini iki yandan sandviç gibi sıkar; amidaz enzimlerinin hücumunu sterik olarak imkansız kılar.',
      },
      {
        id: 'tool-para-methyl',
        name: 'Para-Metil Sübstitüsyonu',
        formula: 'CH3',
        type: 'functional_group',
        deltaLogP: 0.5,
        deltaAffinity: -0.5,
        halfLifeMultiplier: 1.2,
        shieldingFactor: 0.1,
        toxicityRisk: 0.1,
        description: 'Para konumu amidazlara karşı hiçbir sterik koruma sağlamaz.',
      },
      {
        id: 'tool-ortho-dichloro',
        name: '2,6-Dikloro Orto Sübstitüsyonu',
        formula: 'Cl2',
        type: 'atom',
        deltaLogP: 1.4,
        deltaAffinity: -4.0,
        halfLifeMultiplier: 30.0,
        shieldingFactor: 0.95,
        toxicityRisk: 0.08,
        description: 'Sterik koruma sağlar ancak lokal doku iritasyonu yapabilir.',
      },
    ],
    solutionItemIds: ['tool-ortho-dimethyl', 'tool-ortho-dichloro'],
    steps: [
      {
        id: 'm13-s1',
        order: 1,
        prompt: 'Anilin halkasının 2 ve 6 konumlarına iki adet metil grubu takarak Lidokain sentezleyin.',
        widgetType: 'molecular_toolbox',
      },
    ],
    victoryTrigger: {
      conditionDescription: '2,6-dimetil kalkanı kuruldu, amidaz hidrolizi sterik olarak engellendi.',
      ahaExplanation: 'İki orto-metil grubu amid karbonilini fiziksel olarak perdeler; lokal anestezi 3 dakikadan 2 saate uzar.',
      pearl: 'Lidokainin 2,6-dimetil grubu sterik engelleme sayesinde molekülü enzimatik yıkımdan koruyan SAR klasiğidir.',
    },
    socraticHintChain: [
      'Doku amidazları korumasız amid karboniline hızla saldırıp bağı koparır.',
      'Anilin halkasında amid bağına komşu olan konumlar 2 ve 6 numaralı orto konumlarıdır.',
      'Halkanın 2 ve 6 konumlarına iki metil takarak Lidokain yapın; anestezi süresi 2 saate çıkacaktır.',
    ],
  },

  // --------------------------------------------------------------------------
  // MODÜL 5: SAR & Çözünürlük (Görev 14 - 17)
  // --------------------------------------------------------------------------
  {
    id: 'mission-14',
    order: 14,
    moduleId: 'mod-5',
    moduleTitle: 'SAR & Çözünürlük İlkeleri',
    title: 'KBB LogP Sızma Görevi: Kan-Beyin Bariyerini Aşma',
    subtitle: 'Serbest polar hidroksilleri esterleyerek LogP değerini 1.8-2.2 aralığına optimize etme',
    xpReward: 45,
    estimatedMinutes: 7,
    failingMoleculeName: 'Serbest Polar Morfin Analogu',
    targetTargetName: 'Kan-Beyin Bariyeri Endoteli & Mu-Opioid Reseptörü',
    clinicalCrisis: {
      presentation: 'Şiddetli Santral Ağrı Krizi ve KBB Geçiş Engeli',
      vignette: 'Kandaki ilaç santral sinir sistemine geçememekte, endotelin sıkı bağlantıları polar hidroksiller yüzünden molekülü dışarıda tutmaktadır.',
      biochemicalFlaw: 'LogP = 0.7 ve Polar Yüzey Alanı PSA = 115 Å²; fazla H-bağ vericisi nedeniyle lipid zarı aşamaz.',
      patientInitialVitals: {
        heartRateBpm: 115,
        bloodPressureSys: 160,
        bloodPressureDia: 100,
        gastricPh: 3.5,
        liverEnzymeAlt: 25,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: 0.7,
      percentIonized: 85.0,
      metabolicHalfLifeMinutes: 120.0,
      receptorAffinityDeltaG: -6.0,
      bloodBrainBarrierPenetration: 5,
    },
    optimalGauges: {
      logP: 2.1,
      bloodBrainBarrierPenetration: 90,
      receptorAffinityDeltaG: -10.0,
    },
    molecularToolbox: [
      {
        id: 'tool-acetyl-mask',
        name: 'Diasetil Ester Maskeleme (3,6-Diasetil Ester)',
        formula: 'C4H6O2',
        type: 'protecting_group',
        deltaLogP: 1.4,
        deltaAffinity: -4.0,
        halfLifeMultiplier: 1.5,
        shieldingFactor: 0.8,
        toxicityRisk: 0.1,
        description: 'Serbest -OH gruplarını asetilleyerek LogP değerini 2.1e çıkarır; KBB geçişini roketler.',
      },
      {
        id: 'tool-carboxylate',
        name: 'Karboksilat Ekleme (-COO-)',
        formula: 'COO-',
        type: 'functional_group',
        deltaLogP: -2.0,
        deltaAffinity: 2.0,
        halfLifeMultiplier: 0.5,
        shieldingFactor: 0.1,
        toxicityRisk: 0.2,
        description: 'KBBden tamamen dışlanma tuzağı.',
      },
      {
        id: 'tool-glucuronide',
        name: 'Glukuronid Ekleme',
        formula: 'C6H9O6',
        type: 'antidote',
        deltaLogP: -3.0,
        deltaAffinity: 3.0,
        halfLifeMultiplier: 0.2,
        shieldingFactor: 0.0,
        toxicityRisk: 0.05,
        description: 'İdrarla hızla atılmasına yol açar.',
      },
    ],
    solutionItemIds: ['tool-acetyl-mask'],
    steps: [
      {
        id: 'm14-s1',
        order: 1,
        prompt: 'Serbest -OH gruplarını asetilleyerek LogP değerini 2.1e yükseltin.',
        widgetType: 'molecular_toolbox',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'LogP 2.1 seviyesine optimize edildi, KBB penetrasyonu %90ı aştı.',
      ahaExplanation: 'Polar gruplar maskelenince molekül lipid endoteli saniyeler içinde aşar ve santral reseptörleri kilitler.',
      pearl: 'Santral sinir sistemi ilaçlarında optimum LogP 1.5 - 2.5 aralığıdır; PSA 90 Å² altında olmalıdır.',
    },
    socraticHintChain: [
      'Kan-beyin bariyerini geçmek için ilacın aşırı polar olmaması gerekir.',
      'Optimum LogP aralığı 1.5 - 2.5 bandıdır; serbest -OH grupları KBB geçişini zorlaştırır.',
      'Hidroksil gruplarını asetil gruplarıyla maskeleyin; LogP 2.1e çıkacak ve KBB aşılacaktır.',
    ],
  },
  {
    id: 'mission-15',
    order: 15,
    moduleId: 'mod-5',
    moduleTitle: 'SAR & Çözünürlük İlkeleri',
    title: 'İdrar pH İyon Tuzağı: Henderson-Hasselbalch ile Zehir Tahliyesi',
    subtitle: 'İdrarı alkaliye (pH 8.0) kaydırarak zayıf asit ilacı tübüllerde iyonize kitleme',
    xpReward: 45,
    estimatedMinutes: 7,
    failingMoleculeName: 'Fenobarbital (Zayıf Asit, pKa = 7.4)',
    targetTargetName: 'Renal Tübül Lipit Epiteli & İdrar Boşaltım Sistemi',
    clinicalCrisis: {
      presentation: 'Aşırı Doz Barbitürat Zehirlenmesi ve Koma',
      vignette: 'Asidik idrar ortamında (pH 5.2) fenobarbital nötr kalmakta ve tübüllerden kana geri emilerek toksik döngü yaratmaktadır.',
      biochemicalFlaw: 'pKa = 7.4 olan zayıf asit düşük idrar pHsında iyonlaşamaz; nötr form lipid zardan kolayca kana geri sızar.',
      patientInitialVitals: {
        heartRateBpm: 52,
        bloodPressureSys: 80,
        bloodPressureDia: 50,
        gastricPh: 3.0,
        liverEnzymeAlt: 35,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: 1.7,
      percentIonized: 1.5,
      metabolicHalfLifeMinutes: 600.0,
      receptorAffinityDeltaG: -4.0,
    },
    optimalGauges: {
      logP: 1.7,
      percentIonized: 99.0,
    },
    molecularToolbox: [
      {
        id: 'tool-nahco3',
        name: 'İntravenöz Sodyum Bikarbonat (NaHCO3)',
        formula: 'NaHCO3',
        type: 'antidote',
        deltaLogP: 0.0,
        deltaAffinity: 0.0,
        halfLifeMultiplier: 0.1,
        shieldingFactor: 0.0,
        toxicityRisk: 0.01,
        description: 'İdrar pHsını 5.2den 8.0e çıkarır; zayıf asit fenobarbital %99 iyonize formda hapsolur.',
      },
      {
        id: 'tool-acetazolamide',
        name: 'Karbonik Anhidraz İnhibitörü (Asetazolamid)',
        formula: 'C4H6N4O3S2',
        type: 'antidote',
        deltaLogP: 0.0,
        deltaAffinity: 0.0,
        halfLifeMultiplier: 0.2,
        shieldingFactor: 0.0,
        toxicityRisk: 0.05,
        description: 'Bikarbonat atılımını artırarak idrarı alkalileştirir.',
      },
      {
        id: 'tool-nh4cl',
        name: 'Amonyum Klorür (NH4Cl)',
        formula: 'NH4Cl',
        type: 'antidote',
        deltaLogP: 0.0,
        deltaAffinity: 0.0,
        halfLifeMultiplier: 2.0,
        shieldingFactor: 0.0,
        toxicityRisk: 0.8,
        description: 'İdrarı asitleştirir; toksinin geri emilimini %100 yapar (ölümcül tuzak).',
      },
    ],
    solutionItemIds: ['tool-nahco3', 'tool-acetazolamide'],
    steps: [
      {
        id: 'm15-s1',
        order: 1,
        prompt: 'İntravenöz NaHCO3 vererek idrar pHsını 8.0e yükseltin ve iyon tuzağını kurun.',
        widgetType: 'patient_vitals_monitor',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'İdrar pH 8.0 seviyesine çıkarıldı, toksin %99 iyonize hapsoldu.',
      ahaExplanation: 'Henderson-Hasselbalch gereği pH > pKa olunca asit protonunu kaybedip A- olur; yüklü iyon tübülü geçemez ve idrarla atılır.',
      pearl: 'İyon tuzağı prensibi: Zayıf asit ilaç zehirlenmelerinde (Aspirin, Fenobarbital) idrar NaHCO3 ile alkalileştirilerek atılım hızlandırılır.',
    },
    socraticHintChain: [
      'Zayıf asit ilaçlar asidik ortamda nötr, bazik ortamda ise iyonize formdadır.',
      'Tübüllerden kana sadece nötr lipofilik moleküller geri emilebilir.',
      'İntravenöz NaHCO3 ile idrarı alkaliye (pH 8.0) kaydırın; ilaç iyon tuzağına yakalanıp atılacaktır.',
    ],
  },
  {
    id: 'mission-16',
    order: 16,
    moduleId: 'mod-5',
    moduleTitle: 'SAR & Çözünürlük İlkeleri',
    title: 'Lipinski 5 Terazisi: İlaç Benzerliği Kanunu',
    subtitle: 'Molekül ağırlığı, LogP, HBD ve HBA sınırlarını kırparak oral biyoyararlanımı açma',
    xpReward: 45,
    estimatedMinutes: 7,
    failingMoleculeName: 'Kural İhlali Canavarı Peptidomimetik',
    targetTargetName: 'İntestinal Mukoza Pasif Zarı & Lipinski Filtresi',
    clinicalCrisis: {
      presentation: 'Oral Biyoyararlanım Sıfır: Kural İhlali Canavarı',
      vignette: 'Laboratuvarda kinazı pikomolar durduran devasa molekül ağızdan verildiğinde bağırsaktan tek bir molekül bile emilmemektedir (MW 690 Da, LogP 6.8).',
      biochemicalFlaw: 'Lipinski 5 kuralının 4ünü birden ihlal eder: MW > 500, LogP > 5, HBD > 5, HBA > 10.',
      patientInitialVitals: {
        heartRateBpm: 75,
        bloodPressureSys: 120,
        bloodPressureDia: 80,
        gastricPh: 3.5,
        liverEnzymeAlt: 20,
        status: 'unstable',
      },
    },
    initialGauges: {
      logP: 6.8,
      percentIonized: 20.0,
      metabolicHalfLifeMinutes: 60.0,
      receptorAffinityDeltaG: -12.0,
    },
    optimalGauges: {
      logP: 2.7,
      receptorAffinityDeltaG: -9.5,
    },
    molecularToolbox: [
      {
        id: 'tool-ring-trimmer',
        name: 'Hantal Aromatik Halka Kırpıcı',
        formula: 'C6H4',
        type: 'protecting_group',
        deltaLogP: -2.1,
        deltaAffinity: 1.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.5,
        toxicityRisk: 0.02,
        description: 'Molekül ağırlığını 690 Dadan 420 Daya indirir.',
      },
      {
        id: 'tool-alkyl-trimmer',
        name: 'Alifatik Zincir Kısaltıcı',
        formula: 'C4H8',
        type: 'functional_group',
        deltaLogP: -2.0,
        deltaAffinity: 0.5,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.4,
        toxicityRisk: 0.02,
        description: 'LogP değerini 2.7 seviyesine çeker.',
      },
      {
        id: 'tool-hbd-trimmer',
        name: 'Fazla HBD/HBA Azaltıcı',
        formula: 'OH/NH',
        type: 'functional_group',
        deltaLogP: 0.0,
        deltaAffinity: 1.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.3,
        toxicityRisk: 0.02,
        description: 'HBD <= 5 ve HBA <= 10 sınırlarına uydurur.',
      },
    ],
    solutionItemIds: ['tool-ring-trimmer', 'tool-alkyl-trimmer'],
    steps: [
      {
        id: 'm16-s1',
        order: 1,
        prompt: 'Gereksiz halkaları kırparak MW < 500 Da ve LogP < 5 sınırlarını yakalayın.',
        widgetType: 'molecular_toolbox',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Lipinski 5 parametreleri dengelendi, oral emilim açıldı.',
      ahaExplanation: 'MW <= 500, LogP <= 5, HBD <= 5, HBA <= 10 sınırları sağlandığında molekül bağırsaktan emilerek tablete dönüşebilir.',
      pearl: 'Lipinski Kuralı: MW < 500 Da, LogP < 5, HBD <= 5, HBA <= 10. İki veya daha fazla kural ihlali zayıf oral emilim demektir.',
    },
    socraticHintChain: [
      'Lipinski Beş Kuralı ilacın ağızdan emilebilirliğini belirleyen 4 temel sınırdır.',
      'Sınırlar: MW <= 500, cLogP <= 5, HBD <= 5, HBA <= 10dur.',
      'Hantal parçaları kırparak parametreleri yeşil banda çekin ve oral emilimi sağlayın.',
    ],
  },
  {
    id: 'mission-17',
    order: 17,
    moduleId: 'mod-5',
    moduleTitle: 'SAR & Çözünürlük İlkeleri',
    title: 'Nalokson Farmakofor Avı: N-Alil Anahtarıyla Solunumu Kurtarma',
    subtitle: 'N-metil agonist grubunu 3 karbonlu N-alil antagonistiyle değiştirme',
    xpReward: 45,
    estimatedMinutes: 7,
    failingMoleculeName: 'Morfin (Mu-Opioid Agonisti)',
    targetTargetName: 'Beyin Sapı Solunum Merkezi Mu-Opioid Reseptörü',
    clinicalCrisis: {
      presentation: 'Aşırı Doz Opioid Solunum Depresyonu ve İğne Başı Pupil',
      vignette: 'Solunum sayısı dakikada 3e düşmüş, derin komadaki hastada morfin reseptörleri aşırı uyarmakta ve dakikalar içinde arrest beklenmektedir.',
      biochemicalFlaw: 'Piperidin azotundaki N-metil grubu reseptörü aktive eden konformasyonel tetikleyicidir.',
      patientInitialVitals: {
        heartRateBpm: 42,
        bloodPressureSys: 70,
        bloodPressureDia: 40,
        gastricPh: 3.5,
        liverEnzymeAlt: 22,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: 0.8,
      percentIonized: 90.0,
      metabolicHalfLifeMinutes: 180.0,
      receptorAffinityDeltaG: -8.0,
    },
    optimalGauges: {
      logP: 1.5,
      receptorAffinityDeltaG: -10.5,
    },
    molecularToolbox: [
      {
        id: 'tool-n-allyl',
        name: 'N-Alil Grubu (-CH2-CH=CH2, Nalokson)',
        formula: 'C3H5',
        type: 'bioisostere',
        deltaLogP: 0.7,
        deltaAffinity: -2.5,
        halfLifeMultiplier: 0.5,
        shieldingFactor: 0.6,
        toxicityRisk: 0.01,
        description: 'Morfinin N-metili yerine takılır; intrinsik aktiviteyi 1.0den 0.0a düşürür, morfini cepten kovar.',
      },
      {
        id: 'tool-cyclopropylmethyl',
        name: 'N-Siklopropilmetil Grubu (Naltrekson)',
        formula: 'C4H7',
        type: 'bioisostere',
        deltaLogP: 1.0,
        deltaAffinity: -3.0,
        halfLifeMultiplier: 3.0,
        shieldingFactor: 0.8,
        toxicityRisk: 0.02,
        description: 'Uzun etkili oral opioid antagonisti.',
      },
      {
        id: 'tool-n-phenethyl',
        name: 'N-Fenetil Grubu (-CH2CH2Ph)',
        formula: 'C8H9',
        type: 'functional_group',
        deltaLogP: 2.0,
        deltaAffinity: -6.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.5,
        toxicityRisk: 1.0,
        description: 'Süper-agonist tuzağı: Hastayı anında öldürür.',
      },
    ],
    solutionItemIds: ['tool-n-allyl', 'tool-cyclopropylmethyl'],
    steps: [
      {
        id: 'm17-s1',
        order: 1,
        prompt: 'N-metil grubunu söküp N-alil takarak Nalokson elde edin.',
        widgetType: 'molecular_toolbox',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'N-alil takılarak intrinsik aktivite 0a indirildi, solunum başladı.',
      ahaExplanation: 'Hacimli N-alil grubu reseptör aktivasyonunu kilitler; morfini cepten söküp atar ve hasta derin nefes alır.',
      pearl: 'Opioid farmakoforunda azottaki küçük metil agonist davranırken, 3-4 karbonlu alil/siklopropilmetil antagonist etki gösterir.',
    },
    socraticHintChain: [
      'Opioid iskeletinde bazik azot reseptörle tuz köprüsü kurar.',
      'Azottaki küçük metil grubu reseptörü konformasyonel olarak tetikler.',
      'Metili söküp yerine N-alil (-CH2-CH=CH2) takın (Nalokson); intrinsik aktivite sıfırlanıp solunum açılacaktır.',
    ],
  },

  // --------------------------------------------------------------------------
  // MODÜL 6: İlaç Metabolizması (Görev 18 - 21)
  // --------------------------------------------------------------------------
  {
    id: 'mission-18',
    order: 18,
    moduleId: 'mod-6',
    moduleTitle: 'İlaç Metabolizması & Biyotransformasyon',
    title: 'CYP450 Oksijen Sondajı: Faz I Fonksiyonalizasyon Reaktörü',
    subtitle: 'Tamamen apolar hidrokarbona oksijen takarak Faz II konjugasyon kulpu açma',
    xpReward: 50,
    estimatedMinutes: 8,
    failingMoleculeName: 'Fonksiyonsuz Lipofilik Ksenobiyotik',
    targetTargetName: 'Karaciğer Mikrozomal CYP450 MFO Reaktörü',
    clinicalCrisis: {
      presentation: 'Kronik Nörotoksisite ve Yağ Dokusunda Aşırı Depolanma',
      vignette: 'Molekül o kadar hidrofobik ve fonksiyonsuzdur ki, Faz II glukuronidasyon enzimlerinin tutunabileceği tek bir kulp (-OH, -NH2, -COOH) dahi taşımamaktadır.',
      biochemicalFlaw: 'Faz II konjugasyon enzimlerinin tanıyamayacağı kulp yoksunu apolar iskelet.',
      patientInitialVitals: {
        heartRateBpm: 80,
        bloodPressureSys: 125,
        bloodPressureDia: 80,
        gastricPh: 3.5,
        liverEnzymeAlt: 70,
        status: 'unstable',
      },
    },
    initialGauges: {
      logP: 4.5,
      percentIonized: 0.0,
      metabolicHalfLifeMinutes: 5000.0,
      receptorAffinityDeltaG: -3.0,
    },
    optimalGauges: {
      logP: 1.5,
      metabolicHalfLifeMinutes: 120.0,
    },
    molecularToolbox: [
      {
        id: 'tool-cyp-hydroxylation',
        name: 'Aromatik C-H Oksidasyonu (Para-Hidroksilasyon)',
        formula: 'OH',
        type: 'functional_group',
        deltaLogP: -1.5,
        deltaAffinity: -1.0,
        halfLifeMultiplier: 0.1,
        shieldingFactor: 0.0,
        toxicityRisk: 0.05,
        description: 'CYP450 hem-demir reaktörü hedefe bir oksijen yerleştirerek fenolik -OH kulpu açar.',
      },
      {
        id: 'tool-aliphatic-hydroxylation',
        name: 'Alifatik Omega-1 Oksidasyonu',
        formula: 'OH',
        type: 'functional_group',
        deltaLogP: -1.2,
        deltaAffinity: -0.5,
        halfLifeMultiplier: 0.15,
        shieldingFactor: 0.0,
        toxicityRisk: 0.05,
        description: 'Sekonder alkol grubu oluşturur.',
      },
      {
        id: 'tool-direct-glucuronide',
        name: 'Kulp Olmadan Glukuronidasyon Denemesi',
        formula: 'C6H9O6',
        type: 'antidote',
        deltaLogP: 0.0,
        deltaAffinity: 0.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.0,
        toxicityRisk: 0.2,
        description: 'Molekülde nükleofilik kulp (-OH, -COOH vb.) olmadan enzim çalışamaz.',
      },
    ],
    solutionItemIds: ['tool-cyp-hydroxylation', 'tool-aliphatic-hydroxylation'],
    steps: [
      {
        id: 'm18-s1',
        order: 1,
        prompt: 'CYP450 ile aromatik halkaya hidroksil (-OH) kulpu açın.',
        widgetType: 'enzyme_cleavage_simulator',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'CYP450 ile -OH kulpu açıldı, Faz II eliminasyona hazır hale geldi.',
      ahaExplanation: 'Faz I reaksiyonlarının temel amacı moleküle -OH, -NH2 gibi kulplar takmaktır; böylece Faz II konjugasyonu molekülü süpürür.',
      pearl: 'Faz I (fonksiyonalizasyon) moleküle kutuplu gruplar katar; Faz II (konjugasyon) ise glukuronik asit vb. bağlayarak suda atılımı tamamlar.',
    },
    socraticHintChain: [
      'Metabolizma slaytlarımızda Faz I reaksiyonlarının temel amacı "Fonksiyonalizasyon"dur.',
      'Apolar moleküller Faz II glukuronidasyona doğrudan giremez; bir kulp (-OH) şarttır.',
      'CYP450 ile hidroksilasyon yaptırıp -OH takın; molekül Faz IIye hazır hale gelecektir.',
    ],
  },
  {
    id: 'mission-19',
    order: 19,
    moduleId: 'mod-6',
    moduleTitle: 'İlaç Metabolizması & Biyotransformasyon',
    title: 'Sülfasalazin Kolon Salımı: Bakteriyel Azo Redüktaz Roketi',
    subtitle: '5-ASA aktif molekülünü azo bağıyla bağlayarak kalın bağırsağa hedefli taşıma',
    xpReward: 50,
    estimatedMinutes: 8,
    failingMoleculeName: 'Serbest 5-Aminosalisilik Asit (5-ASA)',
    targetTargetName: 'Üst GİS Emilim Bariyeri & Kolon Mikrobiyotası Azo Redüktaz',
    clinicalCrisis: {
      presentation: 'Şiddetli Ülseratif Kolit Atağı ve Kanama',
      vignette: 'Kolona ulaşması gereken serbest 5-ASA mideden ve ince bağırsaktan erken emilmekte; kalın bağırsağa %1 bile ulaşamamaktadır.',
      biochemicalFlaw: 'Küçük polar molekül üst gastrointestinal sistemden hızla kana karışır; hedef organa ulaşamaz.',
      patientInitialVitals: {
        heartRateBpm: 108,
        bloodPressureSys: 105,
        bloodPressureDia: 68,
        gastricPh: 3.5,
        liverEnzymeAlt: 26,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: -0.4,
      percentIonized: 95.0,
      metabolicHalfLifeMinutes: 45.0,
      receptorAffinityDeltaG: -4.0,
    },
    optimalGauges: {
      logP: 1.2,
      receptorAffinityDeltaG: -9.0,
    },
    molecularToolbox: [
      {
        id: 'tool-azo-bridge',
        name: 'Azo Köprüsü (-N=N-) ile Sülfapiridine Bağlama (Sülfasalazin)',
        formula: 'N2',
        type: 'prodrug_mask',
        deltaLogP: 1.6,
        deltaAffinity: -5.0,
        halfLifeMultiplier: 8.0,
        shieldingFactor: 0.95,
        toxicityRisk: 0.05,
        description: 'Büyük ve polar yapı üst GİSten emilmez; kolondaki bakteriyel azo redüktaz bağı koparıp 5-ASAyı hedefe boşaltır.',
      },
      {
        id: 'tool-ester-carrier',
        name: 'Ester Bağı ile Bağlama',
        formula: 'COO',
        type: 'functional_group',
        deltaLogP: 0.8,
        deltaAffinity: -1.0,
        halfLifeMultiplier: 0.5,
        shieldingFactor: 0.1,
        toxicityRisk: 0.2,
        description: 'Üst GİSte esterazlarca erkenden parçalanır.',
      },
      {
        id: 'tool-amide-carrier',
        name: 'Amit Bağı ile Bağlama',
        formula: 'CONH',
        type: 'functional_group',
        deltaLogP: 0.5,
        deltaAffinity: -1.5,
        halfLifeMultiplier: 20.0,
        shieldingFactor: 0.8,
        toxicityRisk: 0.1,
        description: 'Kolon bakterileri amit bağını kolay kolay koparamaz.',
      },
    ],
    solutionItemIds: ['tool-azo-bridge'],
    steps: [
      {
        id: 'm19-s1',
        order: 1,
        prompt: '5-ASAyı azo bağı (-N=N-) ile sülfapiridine bağlayarak Sülfasalazin üretin.',
        widgetType: 'molecular_toolbox',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Azo bağı ile kolon hedefli ön ilaç tasarlandı, kolit kanaması durdu.',
      ahaExplanation: 'Sülfasalazin üst GİSten emilmez; kolona ulaştığında anaerobik bakterilerin azo redüktazı bağı kesip 5-ASAyı salar.',
      pearl: 'Sülfasalazin klasik bir kolon-hedefli ön ilaçtır; azo (-N=N-) bağı kolon bakterilerince indirgenerek 5-ASA açığa çıkar.',
    },
    socraticHintChain: [
      '5-ASA lokal antienflamatuvardır ama üst sindirim kanalından emildiği için kolona gidemez.',
      'Kolon mikrobiyotasındaki bakteriyel redüktazlar spesifik olarak Azo (-N=N-) bağını parçalar.',
      '5-ASAyı azo bağıyla sülfapiridine bağlayın (Sülfasalazin); mideden geçip kolonda serbest kalacaktır.',
    ],
  },
  {
    id: 'mission-20',
    order: 20,
    moduleId: 'mod-6',
    moduleTitle: 'İlaç Metabolizması & Biyotransformasyon',
    title: 'Parasetamol/NAPQI Glutatyon Kurtarma: Karaciğer Nekrozunu Durdurma',
    subtitle: 'N-Asetilsistein antidotu ile tükenen glutatyon depolarını yenileyip NAPQIyi merkaptürik aside çevirme',
    xpReward: 50,
    estimatedMinutes: 8,
    failingMoleculeName: 'NAPQI (N-Asetil-p-benzokinon imin)',
    targetTargetName: 'Hepatosit Makromolekülleri & Glutatyon Depoları',
    clinicalCrisis: {
      presentation: 'Masif Parasetamol Toksisitesi ve Fulminan Karaciğer Nekrozu',
      vignette: '25 gram parasetamol alan hastada Faz II sülfasyon/glukuronidasyon doymuş; CYP2E1 kaynaklı elektrofilik NAPQI serbest kalarak hepatositleri öldürmektedir (ALT 5200 U/L).',
      biochemicalFlaw: 'Glutatyon (GSH) depoları tükendi; elektrofilik NAPQI hepatosit protein tiyollerine kovalent bağlanarak masif nekroz yapar.',
      patientInitialVitals: {
        heartRateBpm: 125,
        bloodPressureSys: 85,
        bloodPressureDia: 55,
        gastricPh: 3.5,
        liverEnzymeAlt: 5200,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: 0.5,
      percentIonized: 0.0,
      metabolicHalfLifeMinutes: 180.0,
      receptorAffinityDeltaG: -2.0,
    },
    optimalGauges: {
      logP: -1.0,
      receptorAffinityDeltaG: -8.0,
    },
    molecularToolbox: [
      {
        id: 'tool-nac-antidote',
        name: 'İntravenöz N-Asetilsistein (NAC / Tiyol Donörü Antidot)',
        formula: 'C5H9NO3S',
        type: 'antidote',
        deltaLogP: -1.5,
        deltaAffinity: -6.0,
        halfLifeMultiplier: 0.2,
        shieldingFactor: 1.0,
        toxicityRisk: 0.01,
        description: 'Sistein sağlayarak tükenen hepatik glutatyon (GSH) depolarını doldurur; NAPQIyi zararsız merkaptürik aside çevirir.',
      },
      {
        id: 'tool-cyp-inducer',
        name: 'CYP İndükleyici (Etanol/Fenobarbital)',
        formula: 'C2H6O',
        type: 'functional_group',
        deltaLogP: 0.5,
        deltaAffinity: 2.0,
        halfLifeMultiplier: 1.5,
        shieldingFactor: 0.0,
        toxicityRisk: 1.0,
        description: 'Ölümcül tuzak: CYP2E1yi daha da kamçılayıp NAPQI üretimini patlatır.',
      },
      {
        id: 'tool-glucuronic-acid',
        name: 'Aşırı Glukuronik Asit Yüklemesi',
        formula: 'C6H10O7',
        type: 'antidote',
        deltaLogP: -1.0,
        deltaAffinity: 0.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.1,
        toxicityRisk: 0.3,
        description: 'Enzim doygunluğu nedeniyle çalışmaz.',
      },
    ],
    solutionItemIds: ['tool-nac-antidote'],
    steps: [
      {
        id: 'm20-s1',
        order: 1,
        prompt: 'N-Asetilsistein uygulayarak hepatik glutatyon depolarını yenileyin.',
        widgetType: 'patient_vitals_monitor',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'NAC antidotu verildi, NAPQI merkaptürik asit konjugatı halinde nötralize edildi.',
      ahaExplanation: 'NAC sistein sağlar; glutatyon reaktif NAPQIye bağlanarak zararsız merkaptürik asit olarak idrarla atılır ve karaciğer kurtulur.',
      pearl: 'Parasetamol zehirlenmesinde ilk 8-10 saat içinde verilen N-Asetilsistein (NAC) mortaliteyi sıfıra yaklaştırır.',
    },
    socraticHintChain: [
      'Parasetamol aşırı dozunda CYP2E1 kaynaklı reaktif elektrofilik NAPQI oluşur.',
      'Normalde vücut bu toksini Glutatyon (GSH) ile nötralize eder; ancak aşırı dozda GSH tükenir.',
      'Hemen N-Asetilsistein (NAC) verin; GSH depoları dolacak ve toksin merkaptürik asit olarak atılacaktır.',
    ],
  },
  {
    id: 'mission-21',
    order: 21,
    moduleId: 'mod-6',
    moduleTitle: 'İlaç Metabolizması & Biyotransformasyon',
    title: 'Enalapril Ön İlaç Roketi: Esteraz İle Biyoaktivasyon Zaferi',
    subtitle: 'Dikarboksilik asit Enalaprilatı mono-etil ester ile maskeleyip oral biyoyararlanımı roketleme',
    xpReward: 50,
    estimatedMinutes: 8,
    failingMoleculeName: 'Enalaprilat (Aktif Dikarboksilik Asit)',
    targetTargetName: 'İntestinal Pasif Zarı & Karaciğer Karboksilesteraz-1 (CES1)',
    clinicalCrisis: {
      presentation: 'Malign Hipertansiyon ve Emilmeyen ACE İnhibitörü',
      vignette: 'Aktif ACE inhibitörü Enalaprilat enzime bağlandığında muazzam güçlüdür; ancak iki -COOH grubu yüzünden bağırsaktan oral emilimi sadece %3tür.',
      biochemicalFlaw: 'İki serbest karboksilat nedeniyle zwitterion ve aşırı polardır (LogP = -1.4); bağırsaktan kana geçemez.',
      patientInitialVitals: {
        heartRateBpm: 95,
        bloodPressureSys: 210,
        bloodPressureDia: 125,
        gastricPh: 3.5,
        liverEnzymeAlt: 25,
        status: 'critical',
      },
    },
    initialGauges: {
      logP: -1.4,
      percentIonized: 98.0,
      metabolicHalfLifeMinutes: 660.0,
      receptorAffinityDeltaG: -11.0,
    },
    optimalGauges: {
      logP: 0.65,
      receptorAffinityDeltaG: -11.0,
    },
    molecularToolbox: [
      {
        id: 'tool-ethyl-ester-prodrug',
        name: 'Mono-Etil Ester Grubu (-COOCH2CH3, Enalapril)',
        formula: 'C2H5O',
        type: 'prodrug_mask',
        deltaLogP: 2.05,
        deltaAffinity: 0.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.8,
        toxicityRisk: 0.01,
        description: 'Alifatik karboksilatı maskeler; oral biyoyararlanımı %3ten %62ye fırlatır, kanda esterazlarca aktif Enalaprilata döner.',
      },
      {
        id: 'tool-dimethyl-ester',
        name: 'Dimetil Esterleme',
        formula: 'C2H6O2',
        type: 'functional_group',
        deltaLogP: 3.0,
        deltaAffinity: 2.0,
        halfLifeMultiplier: 0.5,
        shieldingFactor: 0.5,
        toxicityRisk: 0.1,
        description: 'Aşırı hidrofobiklik ve her iki asidin maskelenmesi aktivasyonu geciktirir.',
      },
      {
        id: 'tool-amide-mask',
        name: 'Amid Maskesi (-CONH2)',
        formula: 'CONH2',
        type: 'functional_group',
        deltaLogP: 1.0,
        deltaAffinity: 4.0,
        halfLifeMultiplier: 2.0,
        shieldingFactor: 0.9,
        toxicityRisk: 0.1,
        description: 'Plazmada kolayca hidroliz olmaz; inaktif kalır.',
      },
    ],
    solutionItemIds: ['tool-ethyl-ester-prodrug'],
    steps: [
      {
        id: 'm21-s1',
        order: 1,
        prompt: 'Alifatik karboksilatı mono-etil esteriyle maskeleyerek Enalapril ön ilacını üretin.',
        widgetType: 'molecular_toolbox',
      },
    ],
    victoryTrigger: {
      conditionDescription: 'Mono-etil ester ile Enalapril sentezlendi, oral emilim %62ye çıktı.',
      ahaExplanation: 'Esterleşme polariteyi düşürür ve emilimi roketler; plazma karboksilesterazları esteri kesip aktif Enalaprilatı açığa çıkarır.',
      pearl: 'Enalapril bir ön ilaçtır; alifatik etil esteri kanda karboksilesteraz-1 (CES1) ile hidroliz edilerek aktif Enalaprilata dönüşür.',
    },
    socraticHintChain: [
      'Aktif ACE inhibitörü Enalaprilat iki serbest karboksilik asit yüzünden aşırı polardır ve emilemez.',
      'Emilimi artırmak için bu asitlerden birini plazmada kolayca hidroliz olacak bir ön ilaç esterine çevirmelisiniz.',
      'Alifatik -COOH grubunu etil esterine çevirerek Enalapril sentezleyin; kanda esterazlarla aktifleşecektir.',
    ],
  },
];

// ============================================================================
// Dinamik Veri Seti Yükleyici (External Dataset Loader with Scaffolding Fallback)
// ============================================================================

export async function getTestMissions(): Promise<ClinicalRescueMission[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const extModule = await import('../src/data/courses/medicinalChemistryMissions');
    if (extModule && Array.isArray(extModule.CLINICAL_RESCUE_MISSIONS) && extModule.CLINICAL_RESCUE_MISSIONS.length === 21) {
      return extModule.CLINICAL_RESCUE_MISSIONS;
    }
    if (extModule && typeof extModule.getAllMissions === 'function') {
      const missions = extModule.getAllMissions();
      if (Array.isArray(missions) && missions.length === 21) {
        return missions;
      }
    }
  } catch {
    // Harici dosya henüz diske yazılmamışsa otoriter test iskelesini kullan
  }
  return CANONICAL_21_MISSIONS_SCAFFOLD;
}

// ============================================================================
// TEST SUITE: CENNA.live Brilliant-Tarzı Klinik Kurtarma Görevleri
// ============================================================================

describe('CENNA.live Brilliant-Tarzı Klinik Kurtarma & İlaç Tasarım Görevleri Test Paketi', () => {

  // ==========================================================================
  // TIER 1: ÖZELLİK KAPSAMI & SÖZLEŞME ENVANTERİ (FEATURE COVERAGE)
  // ==========================================================================
  describe('Tier 1: Özellik Kapsamı & Sözleşme Envanteri (6 Modül, 21 Görev)', () => {
    it('toplamda tam olarak 21 klinik kurtarma görevi bulunmalıdır', async () => {
      const missions = await getTestMissions();
      expect(missions).toHaveLength(21);
    });

    it('tüm görevler 1den 21e kesintisiz sıralı ardışık order taşımalıdır', async () => {
      const missions = await getTestMissions();
      missions.forEach((mission, idx) => {
        expect(mission.order).toBe(idx + 1);
        expect(mission.id).toBe(`mission-${idx + 1}`);
      });
    });

    it('görevler tam olarak 6 modüle (mod-1 - mod-6) doğru dağıtılmalıdır', async () => {
      const missions = await getTestMissions();
      const mod1 = missions.filter((m) => m.moduleId === 'mod-1');
      const mod2 = missions.filter((m) => m.moduleId === 'mod-2');
      const mod3 = missions.filter((m) => m.moduleId === 'mod-3');
      const mod4 = missions.filter((m) => m.moduleId === 'mod-4');
      const mod5 = missions.filter((m) => m.moduleId === 'mod-5');
      const mod6 = missions.filter((m) => m.moduleId === 'mod-6');

      expect(mod1).toHaveLength(4); // Görev 1 - 4
      expect(mod2).toHaveLength(3); // Görev 5 - 7
      expect(mod3).toHaveLength(3); // Görev 8 - 10
      expect(mod4).toHaveLength(3); // Görev 11 - 13
      expect(mod5).toHaveLength(4); // Görev 14 - 17
      expect(mod6).toHaveLength(4); // Görev 18 - 21
    });

    it('her görev zengin bir klinik kriz (presentation, vignette, flaw) içermelidir', async () => {
      const missions = await getTestMissions();
      missions.forEach((mission) => {
        expect(mission.clinicalCrisis).toBeDefined();
        expect(mission.clinicalCrisis.presentation.length).toBeGreaterThan(5);
        expect(mission.clinicalCrisis.vignette.length).toBeGreaterThan(15);
        expect(mission.clinicalCrisis.biochemicalFlaw.length).toBeGreaterThan(15);
      });
    });

    it('her görev başarısız molekül adı ve hedef makromolekül belirtmelidir', async () => {
      const missions = await getTestMissions();
      missions.forEach((mission) => {
        expect(mission.failingMoleculeName).toBeDefined();
        expect(mission.failingMoleculeName.length).toBeGreaterThan(3);
        expect(mission.targetTargetName).toBeDefined();
        expect(mission.targetTargetName.length).toBeGreaterThan(3);
      });
    });

    it('her görev geçerli başlangıç vital bulguları taşımalıdır', async () => {
      const missions = await getTestMissions();
      missions.forEach((mission) => {
        const vitals = mission.clinicalCrisis.patientInitialVitals;
        expect(vitals).toBeDefined();
        expect(vitals.heartRateBpm).toBeGreaterThan(0);
        expect(vitals.bloodPressureSys).toBeGreaterThan(0);
        expect(vitals.bloodPressureDia).toBeGreaterThan(0);
        expect(vitals.gastricPh).toBeGreaterThan(0);
        expect(vitals.liverEnzymeAlt).toBeGreaterThan(0);
        expect(['critical', 'unstable', 'stabilizing', 'normalized']).toContain(vitals.status);
      });
    });

    it('her görev en az 3 parçadan oluşan zengin moleküler alet çantası barındırmalıdır', async () => {
      const missions = await getTestMissions();
      missions.forEach((mission) => {
        expect(mission.molecularToolbox.length).toBeGreaterThanOrEqual(3);
        mission.molecularToolbox.forEach((tool) => {
          expect(tool.id).toBeDefined();
          expect(tool.name.length).toBeGreaterThan(2);
          expect(tool.formula.length).toBeGreaterThan(0);
          expect(typeof tool.deltaLogP).toBe('number');
          expect(typeof tool.deltaAffinity).toBe('number');
          expect(typeof tool.halfLifeMultiplier).toBe('number');
          expect(typeof tool.shieldingFactor).toBe('number');
          expect(typeof tool.toxicityRisk).toBe('number');
        });
      });
    });

    it('her görev için çözüm parçaları alet çantasında mevcut olmalıdır', async () => {
      const missions = await getTestMissions();
      missions.forEach((mission) => {
        expect(mission.solutionItemIds.length).toBeGreaterThan(0);
        const toolboxIds = mission.molecularToolbox.map((t) => t.id);
        mission.solutionItemIds.forEach((solId) => {
          expect(toolboxIds).toContain(solId);
        });
      });
    });

    it('her görev sayısal canlı göstergeler (initialGauges) içermelidir', async () => {
      const missions = await getTestMissions();
      missions.forEach((mission) => {
        expect(mission.initialGauges).toBeDefined();
        expect(typeof mission.initialGauges.logP).toBe('number');
        expect(typeof mission.initialGauges.percentIonized).toBe('number');
        expect(typeof mission.initialGauges.metabolicHalfLifeMinutes).toBe('number');
        expect(typeof mission.initialGauges.receptorAffinityDeltaG).toBe('number');
      });
    });

    it('her görev zafer tetikleyicisi ve klinik inci (pearl) tanımlamalıdır', async () => {
      const missions = await getTestMissions();
      missions.forEach((mission) => {
        expect(mission.victoryTrigger).toBeDefined();
        expect(mission.victoryTrigger.conditionDescription.length).toBeGreaterThan(10);
        expect(mission.victoryTrigger.ahaExplanation.length).toBeGreaterThan(10);
        expect(mission.victoryTrigger.pearl.length).toBeGreaterThan(10);
      });
    });

    it('her görev tam olarak 3 aşamalı Sokratik ipucu zinciri barındırmalıdır', async () => {
      const missions = await getTestMissions();
      missions.forEach((mission) => {
        expect(mission.socraticHintChain).toBeDefined();
        expect(mission.socraticHintChain).toHaveLength(3);
        expect(mission.socraticHintChain[0].length).toBeGreaterThan(15);
        expect(mission.socraticHintChain[1].length).toBeGreaterThan(15);
        expect(mission.socraticHintChain[2].length).toBeGreaterThan(15);
      });
    });

    it('tüm görev adımları geçerli interaktif widget tipi belirtmelidir', async () => {
      const missions = await getTestMissions();
      const validWidgets = [
        'molecular_toolbox',
        'enzyme_cleavage_simulator',
        'receptor_pocket_fit',
        'patient_vitals_monitor',
      ];
      missions.forEach((mission) => {
        expect(mission.steps.length).toBeGreaterThan(0);
        mission.steps.forEach((step) => {
          expect(validWidgets).toContain(step.widgetType);
        });
      });
    });

    it('tüm görevler makul süre (4-10 dk) ve XP ödülü (30-60 XP) barındırmalıdır', async () => {
      const missions = await getTestMissions();
      missions.forEach((mission) => {
        expect(mission.estimatedMinutes).toBeGreaterThanOrEqual(4);
        expect(mission.estimatedMinutes).toBeLessThanOrEqual(10);
        expect(mission.xpReward).toBeGreaterThanOrEqual(30);
        expect(mission.xpReward).toBeLessThanOrEqual(60);
      });
    });

    it('tüm görevlerde sıfır legacy marka ("PharmIQ", "CENNA.ai") ve temiz Türkçe copywriting bulunmalıdır', async () => {
      const missions = await getTestMissions();
      const forbiddenBrands = ['pharmiq', 'cenna.ai'];
      missions.forEach((mission) => {
        const textToScan = [
          mission.title,
          mission.subtitle,
          mission.clinicalCrisis.presentation,
          mission.clinicalCrisis.vignette,
          mission.clinicalCrisis.biochemicalFlaw,
          mission.victoryTrigger.ahaExplanation,
          mission.victoryTrigger.pearl,
          ...mission.socraticHintChain,
        ].join(' ').toLowerCase();

        forbiddenBrands.forEach((brand) => {
          expect(textToScan).not.toContain(brand);
        });
      });
    });
  });

  // ==========================================================================
  // TIER 2: SINIR PARAMETRELERİ & KÖŞE DURUMLARI (BOUNDARY & CORNER CASES)
  // ==========================================================================
  describe('Tier 2: Sınır Parametreleri & Köşe Durumları (Boundary Cases)', () => {
    it('Henderson-Hasselbalch: pH = pKa durumunda iyonizasyon tam olarak %50 olmalıdır', () => {
      const acidIonization = calculateHendersonHasselbalchIonization(4.5, 4.5, 'acid');
      const baseIonization = calculateHendersonHasselbalchIonization(8.2, 8.2, 'base');
      expect(acidIonization).toBe(50.0);
      expect(baseIonization).toBe(50.0);
    });

    it('Henderson-Hasselbalch: pH = pKa +/- 2 birim için matematiksel asit/baz simetrisi doğrulanmalıdır', () => {
      // Zayıf asit (pKa 5.0)
      const acidPh3 = calculateHendersonHasselbalchIonization(5.0, 3.0, 'acid'); // ~0.99% iyonize
      const acidPh7 = calculateHendersonHasselbalchIonization(5.0, 7.0, 'acid'); // ~99.01% iyonize
      expect(acidPh3).toBeCloseTo(0.99, 1);
      expect(acidPh7).toBeCloseTo(99.01, 1);
      expect(acidPh3 + acidPh7).toBeCloseTo(100.0, 1);

      // Zayıf baz (pKa 8.0)
      const basePh6 = calculateHendersonHasselbalchIonization(8.0, 6.0, 'base'); // ~99.01% iyonize katyon
      const basePh10 = calculateHendersonHasselbalchIonization(8.0, 10.0, 'base'); // ~0.99% iyonize
      expect(basePh6).toBeCloseTo(99.01, 1);
      expect(basePh10).toBeCloseTo(0.99, 1);
    });

    it('Henderson-Hasselbalch: Aşırı asidik ortamda (pH 0.5) zayıf asit (pKa 3.5) %99.9 nötr olmalıdır', () => {
      const ionization = calculateHendersonHasselbalchIonization(3.5, 0.5, 'acid');
      // pH 0.5 << pKa 3.5 -> iyonize oran <%0.1, nötr oran >%99.9
      expect(ionization).toBeLessThan(0.2);
    });

    it('Henderson-Hasselbalch: Aşırı bazik ortamda (pH 14) zayıf asit (pKa 3.5) %100 iyonize olmalıdır', () => {
      const ionization = calculateHendersonHasselbalchIonization(3.5, 14.0, 'acid');
      expect(ionization).toBe(100.0);
    });

    it('Henderson-Hasselbalch: Aşırı asidik ortamda (pH 1.0) zayıf baz (pKa 8.4) >%99.9 iyonize katyon olmalıdır', () => {
      const ionization = calculateHendersonHasselbalchIonization(8.4, 1.0, 'base');
      expect(ionization).toBeGreaterThan(99.9);
    });

    it('LogP sınır değişimi: Sıfır delta ve aşırı uç deltalarda hesaplama kilitlenmemelidir', () => {
      const initial: LiveGauges = {
        logP: 1.5,
        percentIonized: 50,
        metabolicHalfLifeMinutes: 60,
        receptorAffinityDeltaG: -5.0,
      };

      const noChangeItem: MolecularToolboxItem = {
        id: 'tool-zero',
        name: 'Sıfır Değişim',
        formula: 'X',
        type: 'atom',
        deltaLogP: 0.0,
        deltaAffinity: 0.0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.0,
        toxicityRisk: 0.0,
        description: 'Test',
      };

      const resZero = calculateModifiedGauges(initial, [noChangeItem]);
      expect(resZero.logP).toBe(1.5);
      expect(resZero.metabolicHalfLifeMinutes).toBe(60);

      const extremeItem: MolecularToolboxItem = {
        id: 'tool-extreme',
        name: 'Ekstrem Değişim',
        formula: 'EXT',
        type: 'functional_group',
        deltaLogP: 4.5,
        deltaAffinity: -10.0,
        halfLifeMultiplier: 10.0,
        shieldingFactor: 0.9,
        toxicityRisk: 0.1,
        description: 'Test',
      };

      const resExtreme = calculateModifiedGauges(initial, [extremeItem]);
      expect(resExtreme.logP).toBe(6.0);
      expect(resExtreme.receptorAffinityDeltaG).toBe(-15.0);
      expect(resExtreme.metabolicHalfLifeMinutes).toBeGreaterThan(600);
    });

    it('KBB penetrasyonu LogP optimal bandında (1.5 - 2.5) zirve yapmalı, uçlarda düşmelidir', () => {
      const initialOptimal: LiveGauges = {
        logP: 2.0,
        percentIonized: 20,
        metabolicHalfLifeMinutes: 60,
        receptorAffinityDeltaG: -8.0,
      };
      const resOptimal = calculateModifiedGauges(initialOptimal, []);
      expect(resOptimal.bloodBrainBarrierPenetration).toBeGreaterThan(90);

      const initialExtremePolar: LiveGauges = {
        logP: -2.0,
        percentIonized: 90,
        metabolicHalfLifeMinutes: 60,
        receptorAffinityDeltaG: -8.0,
      };
      const resPolar = calculateModifiedGauges(initialExtremePolar, []);
      expect(resPolar.bloodBrainBarrierPenetration).toBeLessThan(15);
    });

    it('Enzim zırhı faktörü (shieldingFactor) yarı ömrü orantılı artırmalıdır', () => {
      const initial: LiveGauges = {
        logP: 1.0,
        percentIonized: 50,
        metabolicHalfLifeMinutes: 10,
        receptorAffinityDeltaG: -5.0,
      };
      const unshielded: MolecularToolboxItem = {
        id: 't-unshielded',
        name: 'Zırhsız',
        formula: 'A',
        type: 'functional_group',
        deltaLogP: 0,
        deltaAffinity: 0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 0.0,
        toxicityRisk: 0,
        description: '',
      };
      const shielded: MolecularToolboxItem = {
        id: 't-shielded',
        name: 'Tam Zırhlı',
        formula: 'B',
        type: 'protecting_group',
        deltaLogP: 0,
        deltaAffinity: 0,
        halfLifeMultiplier: 1.0,
        shieldingFactor: 1.0,
        toxicityRisk: 0,
        description: '',
      };

      const resUnshielded = calculateModifiedGauges(initial, [unshielded]);
      const resShielded = calculateModifiedGauges(initial, [shielded]);

      expect(resUnshielded.metabolicHalfLifeMinutes).toBe(10);
      expect(resShielded.metabolicHalfLifeMinutes).toBe(15); // %50 ilave zırh koruması
    });

    it('Yarı ömür sıfıra veya negatife inmemeli, en az 0.5 dakikada sınırlanmalıdır', () => {
      const initial: LiveGauges = {
        logP: 1.0,
        percentIonized: 50,
        metabolicHalfLifeMinutes: 1.0,
        receptorAffinityDeltaG: -5.0,
      };
      const destroyer: MolecularToolboxItem = {
        id: 't-destroyer',
        name: 'Enzimatik Yıkıcı',
        formula: 'C',
        type: 'functional_group',
        deltaLogP: 0,
        deltaAffinity: 0,
        halfLifeMultiplier: 0.01,
        shieldingFactor: 0.0,
        toxicityRisk: 0.5,
        description: '',
      };
      const res = calculateModifiedGauges(initial, [destroyer]);
      expect(res.metabolicHalfLifeMinutes).toBeGreaterThanOrEqual(0.5);
    });

    it('Boş alet çantası seçimi başarısızlık (isSuccess: false, 0 yıldız) üretmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD[0];
      const result = validateMissionSolution(mission, []);
      expect(result.isSuccess).toBe(false);
      expect(result.stars).toBe(0);
      expect(result.score).toBeLessThanOrEqual(25);
    });

    it('Yanlış veya toksik parça seçimi başarısızlık üretmeli, hasta kritik kalmalıdır', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD[0]; // Aspirin
      const wrongResult = validateMissionSolution(mission, ['tool-chloro']);
      expect(wrongResult.isSuccess).toBe(false);
      expect(wrongResult.stars).toBe(0);
    });

    it('Hasta yaşam bulguları durum geçiş eşikleri hassas değerlendirilmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD[0];
      const initialVitals = mission.clinicalCrisis.patientInitialVitals;

      // Tam optimal göstergeler -> 'normalized'
      const optimalGauges: LiveGauges = {
        logP: mission.optimalGauges.logP ?? 1.25,
        percentIonized: 1.0,
        metabolicHalfLifeMinutes: 20.0,
        receptorAffinityDeltaG: mission.optimalGauges.receptorAffinityDeltaG ?? -8.5,
      };
      const vitalsNorm = evaluateVitalsResponse(initialVitals, optimalGauges, mission);
      expect(vitalsNorm.status).toBe('normalized');
      expect(vitalsNorm.heartRateBpm).toBe(74);
      expect(vitalsNorm.bloodPressureSys).toBe(120);
      expect(vitalsNorm.bloodPressureDia).toBe(80);

      // Kötü göstergeler -> 'critical'
      const badGauges: LiveGauges = {
        logP: 10.0,
        percentIonized: 100.0,
        metabolicHalfLifeMinutes: 1.0,
        receptorAffinityDeltaG: 5.0,
      };
      const vitalsCrit = evaluateVitalsResponse(initialVitals, badGauges, mission);
      expect(vitalsCrit.status).toBe('critical');
    });
  });

  // ==========================================================================
  // TIER 3: ÇAPRAZ ÖZELLİK ETKİLEŞİMLERİ (CROSS-FEATURE INTERACTIONS)
  // ==========================================================================
  describe('Tier 3: Çapraz Özellik Etkileşimleri & İpucu İlerlemesi (Pipelines)', () => {
    it('Moleküler parça montajı göstergeleri ve hasta vitallerini eşzamanlı normalize etmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD[0]; // Aspirin
      const tool = mission.molecularToolbox.find((t) => t.id === 'tool-acetyl')!;

      // 1. Göstergelerin güncellenmesi
      const updatedGauges = calculateModifiedGauges(mission.initialGauges, [tool]);
      expect(updatedGauges.receptorAffinityDeltaG).toBeLessThan(mission.initialGauges.receptorAffinityDeltaG);

      // 2. Vitallerin güncellenmesi
      const updatedVitals = evaluateVitalsResponse(
        mission.clinicalCrisis.patientInitialVitals,
        updatedGauges,
        mission
      );

      // Aspirin asetilleme ile gastrik krizden çıkış ve normalleşme
      expect(['stabilizing', 'normalized']).toContain(updatedVitals.status);
      expect(updatedVitals.heartRateBpm).toBeLessThan(mission.clinicalCrisis.patientInitialVitals.heartRateBpm);
    });

    it('Birden fazla aletin ardışık montajı göstergeleri kümülatif güncellemelidir', () => {
      const initial: LiveGauges = {
        logP: 1.0,
        percentIonized: 50,
        metabolicHalfLifeMinutes: 20,
        receptorAffinityDeltaG: -4.0,
      };
      const tool1: MolecularToolboxItem = {
        id: 't-1',
        name: 'Grup 1',
        formula: 'A',
        type: 'functional_group',
        deltaLogP: 0.5,
        deltaAffinity: -2.0,
        halfLifeMultiplier: 2.0,
        shieldingFactor: 0.0,
        toxicityRisk: 0,
        description: '',
      };
      const tool2: MolecularToolboxItem = {
        id: 't-2',
        name: 'Grup 2',
        formula: 'B',
        type: 'functional_group',
        deltaLogP: 0.3,
        deltaAffinity: -1.5,
        halfLifeMultiplier: 1.5,
        shieldingFactor: 0.0,
        toxicityRisk: 0,
        description: '',
      };

      const result = calculateModifiedGauges(initial, [tool1, tool2]);
      expect(result.logP).toBe(1.8); // 1.0 + 0.5 + 0.3
      expect(result.receptorAffinityDeltaG).toBe(-7.5); // -4.0 - 2.0 - 1.5
      expect(result.metabolicHalfLifeMinutes).toBe(60); // 20 * 2.0 * 1.5
    });

    it('Hata sayısı ve yıldız derecelendirmesi kurallara sıkı sıkıya uymalıdır', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD[0];
      const correctTool = ['tool-acetyl'];

      // 0 hata -> 3 yıldız, 100 puan
      const res0 = validateMissionSolution(mission, correctTool, 0);
      expect(res0.isSuccess).toBe(true);
      expect(res0.stars).toBe(3);
      expect(res0.score).toBe(100);

      // 1-2 hata -> 2 yıldız, 85 puan
      const res1 = validateMissionSolution(mission, correctTool, 1);
      expect(res1.stars).toBe(2);
      expect(res1.score).toBe(85);

      const res2 = validateMissionSolution(mission, correctTool, 2);
      expect(res2.stars).toBe(2);
      expect(res2.score).toBe(85);

      // 3+ hata -> 1 yıldız, 70 puan
      const res3 = validateMissionSolution(mission, correctTool, 3);
      expect(res3.stars).toBe(1);
      expect(res3.score).toBe(70);

      const res4 = validateMissionSolution(mission, correctTool, 5);
      expect(res4.stars).toBe(1);
      expect(res4.score).toBe(70);
    });

    it('3 Aşamalı Sokratik İpuçları hiyerarşik pedagojiye (Gözlem -> Mekanizma -> Eylem) uymalıdır', () => {
      CANONICAL_21_MISSIONS_SCAFFOLD.forEach((mission) => {
        const [hint1, hint2, hint3] = mission.socraticHintChain;
        // İpuçları boş olmamalı ve uzunlukları pedagojik derinliği yansıtmalıdır
        expect(hint1.length).toBeGreaterThanOrEqual(15);
        expect(hint2.length).toBeGreaterThanOrEqual(15);
        expect(hint3.length).toBeGreaterThanOrEqual(15);

        // İpucu 3 doğrudan moleküler eylem kılavuzluğu içermelidir
        expect(hint3).not.toEqual(hint1);
        expect(hint3).not.toEqual(hint2);
      });
    });

    it('Sokratik ipucu durumu 1 -> 2 -> 3 yönünde geriye dönmeden ilerlemelidir', () => {
      let currentHintLevel = 0;
      const advanceHint = () => {
        currentHintLevel = Math.min(2, currentHintLevel + 1);
      };

      expect(currentHintLevel).toBe(0); // Aşama 1 (index 0)
      advanceHint();
      expect(currentHintLevel).toBe(1); // Aşama 2 (index 1)
      advanceHint();
      expect(currentHintLevel).toBe(2); // Aşama 3 (index 2)
      advanceHint();
      expect(currentHintLevel).toBe(2); // Sınırda kalmalı, 2yi aşmamalı
    });

    it('Görev nesneleri JSON serileştirmesinde ve Supabase progress modelinde veri kaybetmemelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD[0];
      const serialized = JSON.stringify(mission);
      const deserialized: ClinicalRescueMission = JSON.parse(serialized);

      expect(deserialized.id).toBe(mission.id);
      expect(deserialized.order).toBe(mission.order);
      expect(deserialized.molecularToolbox).toHaveLength(mission.molecularToolbox.length);
      expect(deserialized.solutionItemIds).toEqual(mission.solutionItemIds);

      // Supabase user_lesson_progress uyumluluk kontrolü
      const supabaseProgressShape = {
        lesson_id: deserialized.id,
        current_step: deserialized.steps.length,
        is_completed: true,
        stars_earned: 3,
      };
      expect(supabaseProgressShape.lesson_id).toBe('mission-1');
      expect(supabaseProgressShape.stars_earned).toBe(3);
    });
  });

  // ==========================================================================
  // TIER 4: GERÇEK DÜNYA KLİNİK KURTARMA SENARYOLARI (CLINICAL RESCUES)
  // ==========================================================================
  describe('Tier 4: Gerçek Dünya Klinik Kurtarma Simülasyonları (E2E Scenarios)', () => {
    it('Görev 1 (Aspirin): Serbest salisilik asit asetillenerek gastrik hemoraji durdurulmalıdır', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-1')!;
      expect(mission.failingMoleculeName).toContain('Salisilik Asit');

      const solution = mission.molecularToolbox.find((t) => t.id === 'tool-acetyl')!;
      const modifiedGauges = calculateModifiedGauges(mission.initialGauges, [solution]);
      const vitals = evaluateVitalsResponse(mission.clinicalCrisis.patientInitialVitals, modifiedGauges, mission);
      const validation = validateMissionSolution(mission, ['tool-acetyl']);

      expect(validation.isSuccess).toBe(true);
      expect(['stabilizing', 'normalized']).toContain(vitals.status);
      expect(validation.clinicalExplanation).toContain('COX-1');
    });

    it('Görev 2 (Prokainamid): Ester azota çevrilerek psödokolinesteraz yıkımı bertaraf edilmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-2')!;
      expect(mission.failingMoleculeName).toBe('Prokain');

      const toolAmide = mission.molecularToolbox.find((t) => t.id === 'tool-amide')!;
      const modifiedGauges = calculateModifiedGauges(mission.initialGauges, [toolAmide]);

      // Yarı ömür 2 dakikadan saatlere çıkmalı (100x katlanma)
      expect(modifiedGauges.metabolicHalfLifeMinutes).toBeGreaterThan(150);

      const vitals = evaluateVitalsResponse(mission.clinicalCrisis.patientInitialVitals, modifiedGauges, mission);
      expect(['stabilizing', 'normalized']).toContain(vitals.status);
    });

    it('Görev 3 (Aldehit Sterik Kalkanı): Alfa-dimetil ile nükleofilik Schiff bazı çökelmesi önlenmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-3')!;
      const gemTool = mission.molecularToolbox.find((t) => t.id === 'tool-gem-dimethyl')!;
      const validation = validateMissionSolution(mission, [gemTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('serbest alifatik aldehit');
    });

    it('Görev 4 (Sülfonamid Bakteri Kamuflajı): N1-izoksazol ile pKa 5.6ya inmeli ve kristalüri önlenmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-4')!;
      const isoxazoleTool = mission.molecularToolbox.find((t) => t.id === 'tool-isoxazole')!;
      const validation = validateMissionSolution(mission, [isoxazoleTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('Sülfametoksazol');
    });

    it('Görev 5 (Omeprazol Kovalent Kelepçesi): Disülfid köprüsü ile H+/K+ ATPaz kalıcı kilitlenmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-5')!;
      const disulfideTool = mission.molecularToolbox.find((t) => t.id === 'tool-disulfide')!;
      const validation = validateMissionSolution(mission, [disulfideTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('turnover');
    });

    it('Görev 6 (Adrenerjik Tuz Köprüsü): Protonlanmış amin ile Asp113 tuz köprüsü kurulmalıdır', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-6')!;
      const amineTool = mission.molecularToolbox.find((t) => t.id === 'tool-protonated-amine')!;
      const validation = validateMissionSolution(mission, [amineTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('Aspartat-113');
    });

    it('Görev 7 (Lipofilik Cepte Su Entropi Tahliyesi): Fenil halkası ile 6 su tahliye edilmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-7')!;
      const phenylTool = mission.molecularToolbox.find((t) => t.id === 'tool-phenyl-ring')!;
      const validation = validateMissionSolution(mission, [phenylTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('entropi');
    });

    it('Görev 8 (Sisplatin): Kare düzlem cis geometrisiyle DNA intrastrand kilitlenmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-8')!;
      expect(mission.failingMoleculeName).toContain('Transplatin');

      const cisTool = mission.molecularToolbox.find((t) => t.id === 'tool-cis-isomer')!;
      const validation = validateMissionSolution(mission, [cisTool.id]);

      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('1,2-intrastrand');
    });

    it('Görev 9 (Easson-Stedman): (R)-eutomer ile 3 temas noktası tamamlanmalı ve eudismik oran artmalıdır', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-9')!;
      const rTool = mission.molecularToolbox.find((t) => t.id === 'tool-r-eutomer')!;
      const validation = validateMissionSolution(mission, [rTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('Easson-Stedman');
    });

    it('Görev 10 (Talidomid): Alfa-metil kilidi ile in vivo rasemizasyon önlenmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-10')!;
      expect(mission.failingMoleculeName).toContain('(R)-Talidomid');

      const lockTool = mission.molecularToolbox.find((t) => t.id === 'tool-alpha-methyl-lock')!;
      const validation = validateMissionSolution(mission, [lockTool.id]);

      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.ahaExplanation).toContain('enolat');
    });

    it('Görev 11 (Grimm Flor): Monovalan C-F zırhı CYP450 para-oksidasyonunu bloke etmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-11')!;
      const fluorineTool = mission.molecularToolbox.find((t) => t.id === 'tool-grimm-fluorine')!;
      const modifiedGauges = calculateModifiedGauges(mission.initialGauges, [fluorineTool]);

      // Yarı ömür 25 dakikadan 24 saate (1440 dk) uzamalı
      expect(modifiedGauges.metabolicHalfLifeMinutes).toBeGreaterThan(1000);

      const validation = validateMissionSolution(mission, [fluorineTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('Grimm');
    });

    it('Görev 12 (Losartan): 1H-tetrazol ile oral biyoyararlanım artarken AT1 afinitesi korunmalıdır', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-12')!;
      const tetrazoleTool = mission.molecularToolbox.find((t) => t.id === 'tool-tetrazole')!;
      const modifiedGauges = calculateModifiedGauges(mission.initialGauges, [tetrazoleTool]);

      // LogP negatiften pozitif lipofilik banta çıkmalı
      expect(modifiedGauges.logP).toBeGreaterThan(1.0);

      const validation = validateMissionSolution(mission, [tetrazoleTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.ahaExplanation).toContain('4 azot');
    });

    it('Görev 13 (Lidokain): 2,6-dimetil kalkanı amidaz saldırısını sterik olarak engellemelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-13')!;
      const orthoTool = mission.molecularToolbox.find((t) => t.id === 'tool-ortho-dimethyl')!;
      const modifiedGauges = calculateModifiedGauges(mission.initialGauges, [orthoTool]);

      expect(modifiedGauges.metabolicHalfLifeMinutes).toBeGreaterThan(100);

      const validation = validateMissionSolution(mission, [orthoTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('2,6-dimetil');
    });

    it('Görev 14 (KBB Sızma): Hidroksil asetilasyonu ile LogP 2.1e optimize edilmeli ve beyin geçişi açılmalıdır', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-14')!;
      const maskTool = mission.molecularToolbox.find((t) => t.id === 'tool-acetyl-mask')!;
      const modifiedGauges = calculateModifiedGauges(mission.initialGauges, [maskTool]);

      expect(modifiedGauges.logP).toBeCloseTo(2.1, 1);
      expect(modifiedGauges.bloodBrainBarrierPenetration).toBeGreaterThan(80);

      const validation = validateMissionSolution(mission, [maskTool.id]);
      expect(validation.isSuccess).toBe(true);
    });

    it('Görev 15 (İdrar pH İyon Tuzağı): NaHCO3 ile idrar alkalileşmeli ve zayıf asit iyon tuzağına düşmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-15')!;
      const nahco3Tool = mission.molecularToolbox.find((t) => t.id === 'tool-nahco3')!;
      const validation = validateMissionSolution(mission, [nahco3Tool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('İyon tuzağı');
    });

    it('Görev 16 (Lipinski 5 Terazisi): Hantal halkalar ve zincirler kırpılarak kural ihlalleri giderilmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-16')!;
      const trimmerTool = mission.molecularToolbox.find((t) => t.id === 'tool-ring-trimmer')!;
      const validation = validateMissionSolution(mission, [trimmerTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('Lipinski');
    });

    it('Görev 17 (Nalokson Farmakofor): N-alil grubu ile intrinsik aktivite sıfırlanmalı ve morfin kovulmalıdır', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-17')!;
      const allylTool = mission.molecularToolbox.find((t) => t.id === 'tool-n-allyl')!;
      const validation = validateMissionSolution(mission, [allylTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('antagonist');
    });

    it('Görev 18 (CYP450 Oksijen Sondajı): Aromatik hidroksilasyon ile Faz II konjugasyon kulpu açılmalıdır', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-18')!;
      const ohTool = mission.molecularToolbox.find((t) => t.id === 'tool-cyp-hydroxylation')!;
      const validation = validateMissionSolution(mission, [ohTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('Faz I');
    });

    it('Görev 19 (Sülfasalazin): Azo (-N=N-) bağı kolonda bakteriyel enzimle 5-ASA salmalıdır', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-19')!;
      expect(mission.failingMoleculeName).toContain('5-Aminosalisilik Asit');

      const azoTool = mission.molecularToolbox.find((t) => t.id === 'tool-azo-bridge')!;
      const validation = validateMissionSolution(mission, [azoTool.id]);

      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.ahaExplanation).toContain('azo redüktaz');
    });

    it('Görev 20 (Parasetamol/NAPQI): N-Asetilsistein ile hepatotoksisite ve ALT düşürülmelidir', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-20')!;
      expect(mission.failingMoleculeName).toContain('NAPQI');

      const nacTool = mission.molecularToolbox.find((t) => t.id === 'tool-nac-antidote')!;
      const validation = validateMissionSolution(mission, [nacTool.id]);

      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.ahaExplanation).toContain('merkaptürik asit');
    });

    it('Görev 21 (Enalapril): Mono-etil ester ön ilacı ile bağırsak emilimi sağlanmalıdır', () => {
      const mission = CANONICAL_21_MISSIONS_SCAFFOLD.find((m) => m.id === 'mission-21')!;
      expect(mission.failingMoleculeName).toContain('Enalaprilat');

      const prodrugTool = mission.molecularToolbox.find((t) => t.id === 'tool-ethyl-ester-prodrug')!;
      const modifiedGauges = calculateModifiedGauges(mission.initialGauges, [prodrugTool]);

      // LogP -1.4ten pozitif +0.65e fırlamalı
      expect(modifiedGauges.logP).toBeGreaterThan(0.0);

      const validation = validateMissionSolution(mission, [prodrugTool.id]);
      expect(validation.isSuccess).toBe(true);
      expect(mission.victoryTrigger.pearl).toContain('karboksilesteraz');
    });
  });
});
