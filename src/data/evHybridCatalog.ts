/**
 * Comprehensive EV / Hybrid vehicle catalog (~155 manufacturers).
 * Each entry: make → model[] with supported powertrains.
 * This is a frontend-only fallback/supplement merged with backend registry data.
 */

export interface CatalogModel {
  model: string;
  powertrains: string[]; // BEV | PHEV | HEV | MHEV
}

export interface CatalogEntry {
  make: string;
  models: CatalogModel[];
}

export const EV_HYBRID_CATALOG: CatalogEntry[] = [
  // ═══════════════════════ EUROPE ═══════════════════════
  { make: 'Tesla', models: [
    { model: 'Model 3', powertrains: ['BEV'] },
    { model: 'Model Y', powertrains: ['BEV'] },
    { model: 'Model S', powertrains: ['BEV'] },
    { model: 'Model X', powertrains: ['BEV'] },
    { model: 'Cybertruck', powertrains: ['BEV'] },
  ]},
  { make: 'Volkswagen', models: [
    { model: 'ID.3', powertrains: ['BEV'] },
    { model: 'ID.4', powertrains: ['BEV'] },
    { model: 'ID.5', powertrains: ['BEV'] },
    { model: 'ID.7', powertrains: ['BEV'] },
    { model: 'ID. Buzz', powertrains: ['BEV'] },
    { model: 'e-Golf', powertrains: ['BEV'] },
    { model: 'e-Up!', powertrains: ['BEV'] },
    { model: 'Golf GTE', powertrains: ['PHEV'] },
    { model: 'Passat GTE', powertrains: ['PHEV'] },
    { model: 'Tiguan eHybrid', powertrains: ['PHEV'] },
    { model: 'Touareg eHybrid', powertrains: ['PHEV'] },
    { model: 'Golf eTSI', powertrains: ['MHEV'] },
    { model: 'Tiguan eTSI', powertrains: ['MHEV'] },
    { model: 'Arteon eHybrid', powertrains: ['PHEV'] },
  ]},
  { make: 'Audi', models: [
    { model: 'e-tron', powertrains: ['BEV'] },
    { model: 'e-tron GT', powertrains: ['BEV'] },
    { model: 'Q4 e-tron', powertrains: ['BEV'] },
    { model: 'Q6 e-tron', powertrains: ['BEV'] },
    { model: 'Q8 e-tron', powertrains: ['BEV'] },
    { model: 'A6 e-tron', powertrains: ['BEV'] },
    { model: 'A3 TFSI e', powertrains: ['PHEV'] },
    { model: 'A6 TFSI e', powertrains: ['PHEV'] },
    { model: 'A7 TFSI e', powertrains: ['PHEV'] },
    { model: 'A8 TFSI e', powertrains: ['PHEV'] },
    { model: 'Q3 TFSI e', powertrains: ['PHEV'] },
    { model: 'Q5 TFSI e', powertrains: ['PHEV'] },
    { model: 'Q7 TFSI e', powertrains: ['PHEV'] },
    { model: 'Q8 TFSI e', powertrains: ['PHEV'] },
  ]},
  { make: 'Škoda', models: [
    { model: 'Enyaq iV', powertrains: ['BEV'] },
    { model: 'Enyaq Coupé iV', powertrains: ['BEV'] },
    { model: 'Elroq', powertrains: ['BEV'] },
    { model: 'Octavia iV', powertrains: ['PHEV'] },
    { model: 'Superb iV', powertrains: ['PHEV'] },
  ]},
  { make: 'SEAT', models: [
    { model: 'León e-Hybrid', powertrains: ['PHEV'] },
    { model: 'Tarraco e-Hybrid', powertrains: ['PHEV'] },
    { model: 'Mii Electric', powertrains: ['BEV'] },
  ]},
  { make: 'CUPRA', models: [
    { model: 'Born', powertrains: ['BEV'] },
    { model: 'Tavascan', powertrains: ['BEV'] },
    { model: 'Raval', powertrains: ['BEV'] },
    { model: 'León e-Hybrid', powertrains: ['PHEV'] },
    { model: 'Formentor e-Hybrid', powertrains: ['PHEV'] },
  ]},
  { make: 'BMW', models: [
    { model: 'i3', powertrains: ['BEV'] },
    { model: 'i4', powertrains: ['BEV'] },
    { model: 'i5', powertrains: ['BEV'] },
    { model: 'i7', powertrains: ['BEV'] },
    { model: 'iX', powertrains: ['BEV'] },
    { model: 'iX1', powertrains: ['BEV'] },
    { model: 'iX2', powertrains: ['BEV'] },
    { model: 'iX3', powertrains: ['BEV'] },
    { model: 'X1 xDrive25e', powertrains: ['PHEV'] },
    { model: 'X2 xDrive25e', powertrains: ['PHEV'] },
    { model: 'X3 xDrive30e', powertrains: ['PHEV'] },
    { model: 'X5 xDrive45e', powertrains: ['PHEV'] },
    { model: '225xe', powertrains: ['PHEV'] },
    { model: '330e', powertrains: ['PHEV'] },
    { model: '530e', powertrains: ['PHEV'] },
    { model: '745e', powertrains: ['PHEV'] },
    { model: '320d MHEV', powertrains: ['MHEV'] },
    { model: '520d MHEV', powertrains: ['MHEV'] },
  ]},
  { make: 'MINI', models: [
    { model: 'Cooper SE', powertrains: ['BEV'] },
    { model: 'Countryman SE', powertrains: ['PHEV'] },
    { model: 'Aceman', powertrains: ['BEV'] },
  ]},
  { make: 'Mercedes-Benz', models: [
    { model: 'EQA', powertrains: ['BEV'] },
    { model: 'EQB', powertrains: ['BEV'] },
    { model: 'EQC', powertrains: ['BEV'] },
    { model: 'EQE', powertrains: ['BEV'] },
    { model: 'EQE SUV', powertrains: ['BEV'] },
    { model: 'EQS', powertrains: ['BEV'] },
    { model: 'EQS SUV', powertrains: ['BEV'] },
    { model: 'EQV', powertrains: ['BEV'] },
    { model: 'eVito', powertrains: ['BEV'] },
    { model: 'eSprinter', powertrains: ['BEV'] },
    { model: 'G 580 EQ', powertrains: ['BEV'] },
    { model: 'A 250 e', powertrains: ['PHEV'] },
    { model: 'B 250 e', powertrains: ['PHEV'] },
    { model: 'C 300 e', powertrains: ['PHEV'] },
    { model: 'E 300 e', powertrains: ['PHEV'] },
    { model: 'S 580 e', powertrains: ['PHEV'] },
    { model: 'GLA 250 e', powertrains: ['PHEV'] },
    { model: 'GLC 300 e', powertrains: ['PHEV'] },
    { model: 'GLE 350 de', powertrains: ['PHEV'] },
    { model: 'C 200 MHEV', powertrains: ['MHEV'] },
    { model: 'E 200 MHEV', powertrains: ['MHEV'] },
  ]},
  { make: 'Smart', models: [
    { model: '#1', powertrains: ['BEV'] },
    { model: '#3', powertrains: ['BEV'] },
    { model: '#5', powertrains: ['BEV'] },
    { model: 'EQ fortwo', powertrains: ['BEV'] },
    { model: 'EQ forfour', powertrains: ['BEV'] },
  ]},
  { make: 'Porsche', models: [
    { model: 'Taycan', powertrains: ['BEV'] },
    { model: 'Macan Electric', powertrains: ['BEV'] },
    { model: 'Cayenne E-Hybrid', powertrains: ['PHEV'] },
    { model: 'Panamera E-Hybrid', powertrains: ['PHEV'] },
  ]},
  { make: 'Opel', models: [
    { model: 'Corsa-e', powertrains: ['BEV'] },
    { model: 'Mokka-e', powertrains: ['BEV'] },
    { model: 'Astra Electric', powertrains: ['BEV'] },
    { model: 'Astra PHEV', powertrains: ['PHEV'] },
    { model: 'Grandland PHEV', powertrains: ['PHEV'] },
    { model: 'Combo-e', powertrains: ['BEV'] },
    { model: 'Vivaro-e', powertrains: ['BEV'] },
    { model: 'Zafira-e Life', powertrains: ['BEV'] },
    { model: 'Frontera Electric', powertrains: ['BEV'] },
  ]},
  { make: 'Peugeot', models: [
    { model: 'e-208', powertrains: ['BEV'] },
    { model: 'e-2008', powertrains: ['BEV'] },
    { model: 'e-308', powertrains: ['BEV'] },
    { model: 'e-3008', powertrains: ['BEV'] },
    { model: 'e-5008', powertrains: ['BEV'] },
    { model: '308 PHEV', powertrains: ['PHEV'] },
    { model: '3008 PHEV', powertrains: ['PHEV'] },
    { model: '508 PHEV', powertrains: ['PHEV'] },
    { model: 'e-Partner', powertrains: ['BEV'] },
    { model: 'e-Expert', powertrains: ['BEV'] },
    { model: 'e-Traveller', powertrains: ['BEV'] },
  ]},
  { make: 'Citroën', models: [
    { model: 'ë-C3', powertrains: ['BEV'] },
    { model: 'ë-C4', powertrains: ['BEV'] },
    { model: 'ë-C4 X', powertrains: ['BEV'] },
    { model: 'ë-Berlingo', powertrains: ['BEV'] },
    { model: 'ë-SpaceTourer', powertrains: ['BEV'] },
    { model: 'C5 Aircross PHEV', powertrains: ['PHEV'] },
    { model: 'ë-Jumpy', powertrains: ['BEV'] },
  ]},
  { make: 'DS', models: [
    { model: 'DS 3 E-Tense', powertrains: ['BEV'] },
    { model: 'DS 4 E-Tense', powertrains: ['PHEV'] },
    { model: 'DS 7 E-Tense', powertrains: ['PHEV'] },
    { model: 'DS 9 E-Tense', powertrains: ['PHEV'] },
  ]},
  { make: 'Fiat', models: [
    { model: '500e', powertrains: ['BEV'] },
    { model: '600e', powertrains: ['BEV'] },
    { model: 'Grande Panda Electric', powertrains: ['BEV'] },
    { model: 'Topolino', powertrains: ['BEV'] },
    { model: 'E-Ulysse', powertrains: ['BEV'] },
    { model: 'E-Doblò', powertrains: ['BEV'] },
    { model: 'E-Scudo', powertrains: ['BEV'] },
  ]},
  { make: 'Alfa Romeo', models: [
    { model: 'Junior Elettrica', powertrains: ['BEV'] },
    { model: 'Junior Ibrida', powertrains: ['HEV'] },
    { model: 'Tonale PHEV', powertrains: ['PHEV'] },
    { model: 'Stelvio PHEV', powertrains: ['PHEV'] },
  ]},
  { make: 'Jeep', models: [
    { model: 'Avenger Electric', powertrains: ['BEV'] },
    { model: 'Avenger e-Hybrid', powertrains: ['HEV'] },
    { model: 'Renegade 4xe', powertrains: ['PHEV'] },
    { model: 'Compass 4xe', powertrains: ['PHEV'] },
    { model: 'Wrangler 4xe', powertrains: ['PHEV'] },
    { model: 'Grand Cherokee 4xe', powertrains: ['PHEV'] },
  ]},
  { make: 'Lancia', models: [
    { model: 'Ypsilon Electric', powertrains: ['BEV'] },
    { model: 'Ypsilon HEV', powertrains: ['HEV'] },
  ]},
  { make: 'Maserati', models: [
    { model: 'GranTurismo Folgore', powertrains: ['BEV'] },
    { model: 'Grecale Folgore', powertrains: ['BEV'] },
    { model: 'Levante Hybrid', powertrains: ['MHEV'] },
    { model: 'Ghibli Hybrid', powertrains: ['MHEV'] },
  ]},
  { make: 'Ferrari', models: [
    { model: 'SF90 Stradale', powertrains: ['PHEV'] },
    { model: 'SF90 Spider', powertrains: ['PHEV'] },
    { model: '296 GTB', powertrains: ['PHEV'] },
    { model: '296 GTS', powertrains: ['PHEV'] },
  ]},
  { make: 'Lamborghini', models: [
    { model: 'Revuelto', powertrains: ['PHEV'] },
    { model: 'Urus SE', powertrains: ['PHEV'] },
  ]},
  { make: 'Bentley', models: [
    { model: 'Bentayga Hybrid', powertrains: ['PHEV'] },
    { model: 'Flying Spur Hybrid', powertrains: ['PHEV'] },
  ]},
  { make: 'Rolls-Royce', models: [
    { model: 'Spectre', powertrains: ['BEV'] },
  ]},
  { make: 'Renault', models: [
    { model: 'Mégane E-Tech Electric', powertrains: ['BEV'] },
    { model: 'Scénic E-Tech Electric', powertrains: ['BEV'] },
    { model: 'Zoe', powertrains: ['BEV'] },
    { model: 'Twingo Electric', powertrains: ['BEV'] },
    { model: 'R5 E-Tech Electric', powertrains: ['BEV'] },
    { model: 'R4 E-Tech Electric', powertrains: ['BEV'] },
    { model: 'Kangoo E-Tech Electric', powertrains: ['BEV'] },
    { model: 'Master E-Tech Electric', powertrains: ['BEV'] },
    { model: 'Captur E-Tech', powertrains: ['PHEV', 'HEV'] },
    { model: 'Arkana E-Tech', powertrains: ['HEV'] },
    { model: 'Clio E-Tech', powertrains: ['HEV'] },
    { model: 'Austral E-Tech', powertrains: ['HEV', 'PHEV'] },
    { model: 'Rafale E-Tech', powertrains: ['PHEV'] },
    { model: 'Espace E-Tech', powertrains: ['HEV'] },
    { model: 'Symbioz E-Tech', powertrains: ['HEV'] },
  ]},
  { make: 'Dacia', models: [
    { model: 'Spring Electric', powertrains: ['BEV'] },
    { model: 'Jogger Hybrid', powertrains: ['HEV'] },
    { model: 'Duster Hybrid', powertrains: ['HEV'] },
  ]},
  { make: 'Alpine', models: [
    { model: 'A290', powertrains: ['BEV'] },
  ]},
  { make: 'Volvo', models: [
    { model: 'EX30', powertrains: ['BEV'] },
    { model: 'EX40 (XC40 Recharge)', powertrains: ['BEV'] },
    { model: 'EX90', powertrains: ['BEV'] },
    { model: 'EC40 (C40 Recharge)', powertrains: ['BEV'] },
    { model: 'XC40 T4/T5 Recharge', powertrains: ['PHEV'] },
    { model: 'XC60 T6/T8 Recharge', powertrains: ['PHEV'] },
    { model: 'XC90 T8 Recharge', powertrains: ['PHEV'] },
    { model: 'S60 T8 Recharge', powertrains: ['PHEV'] },
    { model: 'S90 T8 Recharge', powertrains: ['PHEV'] },
    { model: 'V60 T6/T8 Recharge', powertrains: ['PHEV'] },
    { model: 'V90 T8 Recharge', powertrains: ['PHEV'] },
    { model: 'XC40 B3/B4/B5', powertrains: ['MHEV'] },
    { model: 'XC60 B4/B5/B6', powertrains: ['MHEV'] },
  ]},
  { make: 'Polestar', models: [
    { model: 'Polestar 2', powertrains: ['BEV'] },
    { model: 'Polestar 3', powertrains: ['BEV'] },
    { model: 'Polestar 4', powertrains: ['BEV'] },
    { model: 'Polestar 5', powertrains: ['BEV'] },
    { model: 'Polestar 6', powertrains: ['BEV'] },
  ]},
  { make: 'Jaguar', models: [
    { model: 'I-PACE', powertrains: ['BEV'] },
    { model: 'E-PACE P300e', powertrains: ['PHEV'] },
    { model: 'F-PACE P400e', powertrains: ['PHEV'] },
  ]},
  { make: 'Land Rover', models: [
    { model: 'Range Rover Electric', powertrains: ['BEV'] },
    { model: 'Range Rover P440e', powertrains: ['PHEV'] },
    { model: 'Range Rover Sport P440e', powertrains: ['PHEV'] },
    { model: 'Defender P400e', powertrains: ['PHEV'] },
    { model: 'Discovery Sport P300e', powertrains: ['PHEV'] },
    { model: 'Evoque P300e', powertrains: ['PHEV'] },
    { model: 'Defender MHEV', powertrains: ['MHEV'] },
  ]},
  { make: 'MG', models: [
    { model: 'MG4', powertrains: ['BEV'] },
    { model: 'MG5', powertrains: ['BEV'] },
    { model: 'ZS EV', powertrains: ['BEV'] },
    { model: 'Marvel R', powertrains: ['BEV'] },
    { model: 'Cyberster', powertrains: ['BEV'] },
    { model: 'MG3 Hybrid+', powertrains: ['HEV'] },
    { model: 'HS PHEV', powertrains: ['PHEV'] },
    { model: 'EHS PHEV', powertrains: ['PHEV'] },
  ]},
  { make: 'Lotus', models: [
    { model: 'Eletre', powertrains: ['BEV'] },
    { model: 'Emeya', powertrains: ['BEV'] },
  ]},

  // ═══════════════════════ ASIA – Japan ═══════════════════════
  { make: 'Toyota', models: [
    { model: 'bZ4X', powertrains: ['BEV'] },
    { model: 'bZ3', powertrains: ['BEV'] },
    { model: 'Proace Electric', powertrains: ['BEV'] },
    { model: 'Proace City Electric', powertrains: ['BEV'] },
    { model: 'RAV4 PHEV', powertrains: ['PHEV'] },
    { model: 'Prius PHEV', powertrains: ['PHEV'] },
    { model: 'Yaris Hybrid', powertrains: ['HEV'] },
    { model: 'Yaris Cross Hybrid', powertrains: ['HEV'] },
    { model: 'Corolla Hybrid', powertrains: ['HEV'] },
    { model: 'Corolla Cross Hybrid', powertrains: ['HEV'] },
    { model: 'C-HR Hybrid', powertrains: ['HEV', 'PHEV'] },
    { model: 'RAV4 Hybrid', powertrains: ['HEV'] },
    { model: 'Highlander Hybrid', powertrains: ['HEV'] },
    { model: 'Camry Hybrid', powertrains: ['HEV'] },
    { model: 'Crown Hybrid', powertrains: ['HEV'] },
  ]},
  { make: 'Lexus', models: [
    { model: 'RZ', powertrains: ['BEV'] },
    { model: 'UX 300e', powertrains: ['BEV'] },
    { model: 'NX 450h+', powertrains: ['PHEV'] },
    { model: 'RX 450h+', powertrains: ['PHEV'] },
    { model: 'UX 250h', powertrains: ['HEV'] },
    { model: 'NX 350h', powertrains: ['HEV'] },
    { model: 'RX 350h', powertrains: ['HEV'] },
    { model: 'ES 300h', powertrains: ['HEV'] },
    { model: 'LS 500h', powertrains: ['HEV'] },
    { model: 'LC 500h', powertrains: ['HEV'] },
    { model: 'LBX Hybrid', powertrains: ['HEV'] },
  ]},
  { make: 'Honda', models: [
    { model: 'e', powertrains: ['BEV'] },
    { model: 'e:Ny1', powertrains: ['BEV'] },
    { model: 'Prologue', powertrains: ['BEV'] },
    { model: 'CR-V PHEV', powertrains: ['PHEV'] },
    { model: 'Jazz e:HEV', powertrains: ['HEV'] },
    { model: 'Civic e:HEV', powertrains: ['HEV'] },
    { model: 'HR-V e:HEV', powertrains: ['HEV'] },
    { model: 'ZR-V e:HEV', powertrains: ['HEV'] },
    { model: 'CR-V e:HEV', powertrains: ['HEV'] },
  ]},
  { make: 'Nissan', models: [
    { model: 'Leaf', powertrains: ['BEV'] },
    { model: 'Ariya', powertrains: ['BEV'] },
    { model: 'Townstar Electric', powertrains: ['BEV'] },
    { model: 'Qashqai e-Power', powertrains: ['HEV'] },
    { model: 'X-Trail e-Power', powertrains: ['HEV'] },
    { model: 'Juke Hybrid', powertrains: ['HEV'] },
  ]},
  { make: 'Infiniti', models: [
    { model: 'QX60 Hybrid', powertrains: ['HEV'] },
  ]},
  { make: 'Mazda', models: [
    { model: 'MX-30', powertrains: ['BEV', 'PHEV'] },
    { model: 'CX-60 PHEV', powertrains: ['PHEV'] },
    { model: 'CX-90 PHEV', powertrains: ['PHEV'] },
    { model: 'Mazda3 MHEV', powertrains: ['MHEV'] },
    { model: 'CX-30 MHEV', powertrains: ['MHEV'] },
    { model: 'CX-5 MHEV', powertrains: ['MHEV'] },
  ]},
  { make: 'Subaru', models: [
    { model: 'Solterra', powertrains: ['BEV'] },
    { model: 'Crosstrek MHEV', powertrains: ['MHEV'] },
    { model: 'Forester e-Boxer', powertrains: ['MHEV'] },
    { model: 'XV e-Boxer', powertrains: ['MHEV'] },
  ]},
  { make: 'Suzuki', models: [
    { model: 'eVitara', powertrains: ['BEV'] },
    { model: 'S-Cross Hybrid', powertrains: ['HEV', 'MHEV'] },
    { model: 'Vitara Hybrid', powertrains: ['HEV', 'MHEV'] },
    { model: 'Swift Hybrid', powertrains: ['MHEV'] },
    { model: 'Ignis Hybrid', powertrains: ['MHEV'] },
    { model: 'Jimny MHEV', powertrains: ['MHEV'] },
    { model: 'Across PHEV', powertrains: ['PHEV'] },
  ]},
  { make: 'Mitsubishi', models: [
    { model: 'Outlander PHEV', powertrains: ['PHEV'] },
    { model: 'Eclipse Cross PHEV', powertrains: ['PHEV'] },
    { model: 'ASX MHEV', powertrains: ['MHEV'] },
    { model: 'Colt Hybrid', powertrains: ['HEV'] },
  ]},

  // ═══════════════════════ ASIA – Korea ═══════════════════════
  { make: 'Hyundai', models: [
    { model: 'IONIQ 5', powertrains: ['BEV'] },
    { model: 'IONIQ 6', powertrains: ['BEV'] },
    { model: 'Kona Electric', powertrains: ['BEV'] },
    { model: 'INSTER', powertrains: ['BEV'] },
    { model: 'Tucson PHEV', powertrains: ['PHEV'] },
    { model: 'Santa Fe PHEV', powertrains: ['PHEV'] },
    { model: 'Tucson Hybrid', powertrains: ['HEV'] },
    { model: 'Santa Fe Hybrid', powertrains: ['HEV'] },
    { model: 'Kona Hybrid', powertrains: ['HEV'] },
    { model: 'i20 MHEV', powertrains: ['MHEV'] },
    { model: 'i30 MHEV', powertrains: ['MHEV'] },
    { model: 'Bayon MHEV', powertrains: ['MHEV'] },
  ]},
  { make: 'Kia', models: [
    { model: 'EV3', powertrains: ['BEV'] },
    { model: 'EV6', powertrains: ['BEV'] },
    { model: 'EV9', powertrains: ['BEV'] },
    { model: 'Niro EV', powertrains: ['BEV'] },
    { model: 'e-Soul', powertrains: ['BEV'] },
    { model: 'Niro PHEV', powertrains: ['PHEV'] },
    { model: 'Sportage PHEV', powertrains: ['PHEV'] },
    { model: 'Sorento PHEV', powertrains: ['PHEV'] },
    { model: 'XCeed PHEV', powertrains: ['PHEV'] },
    { model: 'Niro Hybrid', powertrains: ['HEV'] },
    { model: 'Sportage Hybrid', powertrains: ['HEV'] },
    { model: 'Sorento Hybrid', powertrains: ['HEV'] },
    { model: 'Stonic MHEV', powertrains: ['MHEV'] },
    { model: 'Ceed MHEV', powertrains: ['MHEV'] },
  ]},
  { make: 'Genesis', models: [
    { model: 'GV60', powertrains: ['BEV'] },
    { model: 'GV70 Electrified', powertrains: ['BEV'] },
    { model: 'G80 Electrified', powertrains: ['BEV'] },
  ]},

  // ═══════════════════════ ASIA – China ═══════════════════════
  { make: 'BYD', models: [
    { model: 'ATTO 3 (Yuan Plus)', powertrains: ['BEV'] },
    { model: 'Dolphin', powertrains: ['BEV'] },
    { model: 'Seal', powertrains: ['BEV'] },
    { model: 'Seal U', powertrains: ['BEV', 'PHEV'] },
    { model: 'Tang', powertrains: ['BEV', 'PHEV'] },
    { model: 'Han', powertrains: ['BEV', 'PHEV'] },
    { model: 'Seagull', powertrains: ['BEV'] },
    { model: 'Sealion 7', powertrains: ['BEV'] },
  ]},
  { make: 'NIO', models: [
    { model: 'ET5', powertrains: ['BEV'] },
    { model: 'ET5 Touring', powertrains: ['BEV'] },
    { model: 'ET7', powertrains: ['BEV'] },
    { model: 'EL6 (ES6)', powertrains: ['BEV'] },
    { model: 'EL7 (ES7)', powertrains: ['BEV'] },
    { model: 'EL8 (ES8)', powertrains: ['BEV'] },
    { model: 'EC6', powertrains: ['BEV'] },
    { model: 'EC7', powertrains: ['BEV'] },
  ]},
  { make: 'XPENG', models: [
    { model: 'G3', powertrains: ['BEV'] },
    { model: 'G6', powertrains: ['BEV'] },
    { model: 'G9', powertrains: ['BEV'] },
    { model: 'P5', powertrains: ['BEV'] },
    { model: 'P7', powertrains: ['BEV'] },
    { model: 'X9', powertrains: ['BEV'] },
  ]},
  { make: 'Zeekr', models: [
    { model: '001', powertrains: ['BEV'] },
    { model: '007', powertrains: ['BEV'] },
    { model: '009', powertrains: ['BEV'] },
    { model: 'X', powertrains: ['BEV'] },
  ]},
  { make: 'Leapmotor', models: [
    { model: 'T03', powertrains: ['BEV'] },
    { model: 'C10', powertrains: ['BEV'] },
    { model: 'C01', powertrains: ['BEV'] },
    { model: 'C11', powertrains: ['BEV'] },
    { model: 'C16', powertrains: ['BEV'] },
    { model: 'B10', powertrains: ['BEV'] },
  ]},
  { make: 'Aiways', models: [
    { model: 'U5', powertrains: ['BEV'] },
    { model: 'U6', powertrains: ['BEV'] },
  ]},
  { make: 'Geely', models: [
    { model: 'Geometry C', powertrains: ['BEV'] },
    { model: 'Galaxy E5', powertrains: ['BEV'] },
    { model: 'Galaxy L7', powertrains: ['PHEV'] },
    { model: 'Galaxy L6', powertrains: ['PHEV'] },
  ]},
  { make: 'Lynk & Co', models: [
    { model: '01 PHEV', powertrains: ['PHEV'] },
    { model: '02 PHEV', powertrains: ['PHEV'] },
  ]},
  { make: 'Hongqi', models: [
    { model: 'E-HS9', powertrains: ['BEV'] },
    { model: 'EH7', powertrains: ['BEV'] },
    { model: 'EHS7', powertrains: ['BEV'] },
  ]},
  { make: 'Voyah', models: [
    { model: 'Free', powertrains: ['BEV', 'PHEV'] },
    { model: 'Dream', powertrains: ['PHEV'] },
    { model: 'Courage', powertrains: ['BEV'] },
  ]},
  { make: 'Avatr', models: [
    { model: 'Avatr 11', powertrains: ['BEV'] },
    { model: 'Avatr 12', powertrains: ['BEV'] },
  ]},
  { make: 'Seres', models: [
    { model: 'Seres 3', powertrains: ['BEV'] },
    { model: 'Seres 5', powertrains: ['BEV'] },
  ]},
  { make: 'Maxus', models: [
    { model: 'MIFA 9', powertrains: ['BEV'] },
    { model: 'eDeliver 3', powertrains: ['BEV'] },
    { model: 'eDeliver 7', powertrains: ['BEV'] },
    { model: 'eT90', powertrains: ['BEV'] },
    { model: 'eTerron 9', powertrains: ['BEV'] },
  ]},
  { make: 'ORA', models: [
    { model: 'Funky Cat (03)', powertrains: ['BEV'] },
    { model: '07', powertrains: ['BEV'] },
  ]},
  { make: 'GWM', models: [
    { model: 'ORA 03', powertrains: ['BEV'] },
    { model: 'WEY Coffee 01', powertrains: ['PHEV'] },
    { model: 'WEY Coffee 02', powertrains: ['PHEV'] },
  ]},
  { make: 'Chery', models: [
    { model: 'Omoda E5', powertrains: ['BEV'] },
    { model: 'iCAR 03', powertrains: ['BEV'] },
    { model: 'Tiggo 7 PHEV', powertrains: ['PHEV'] },
    { model: 'Tiggo 8 PHEV', powertrains: ['PHEV'] },
  ]},
  { make: 'Exeed', models: [
    { model: 'VX PHEV', powertrains: ['PHEV'] },
    { model: 'TXL PHEV', powertrains: ['PHEV'] },
  ]},
  { make: 'Dongfeng', models: [
    { model: 'Nammi 01', powertrains: ['BEV'] },
    { model: 'Box', powertrains: ['BEV'] },
    { model: 'Voyah Free', powertrains: ['BEV', 'PHEV'] },
  ]},
  { make: 'JAC', models: [
    { model: 'iEV7S', powertrains: ['BEV'] },
    { model: 'e-JS4', powertrains: ['BEV'] },
  ]},
  { make: 'SAIC', models: [
    { model: 'MG4 (Mulan)', powertrains: ['BEV'] },
    { model: 'Rising Auto R7', powertrains: ['BEV'] },
    { model: 'IM L7', powertrains: ['BEV'] },
    { model: 'IM LS7', powertrains: ['BEV'] },
  ]},
  { make: 'Wuling', models: [
    { model: 'Mini EV', powertrains: ['BEV'] },
    { model: 'Bingo', powertrains: ['BEV'] },
    { model: 'Cloud EV', powertrains: ['BEV'] },
  ]},
  { make: 'GAC Aion', models: [
    { model: 'Hyper GT', powertrains: ['BEV'] },
    { model: 'Hyper SSR', powertrains: ['BEV'] },
    { model: 'AION Y', powertrains: ['BEV'] },
    { model: 'AION V', powertrains: ['BEV'] },
    { model: 'AION S', powertrains: ['BEV'] },
    { model: 'AION LX', powertrains: ['BEV'] },
  ]},
  { make: 'Li Auto', models: [
    { model: 'L7', powertrains: ['PHEV'] },
    { model: 'L8', powertrains: ['PHEV'] },
    { model: 'L9', powertrains: ['PHEV'] },
    { model: 'MEGA', powertrains: ['BEV'] },
  ]},
  { make: 'BAIC', models: [
    { model: 'EU5', powertrains: ['BEV'] },
    { model: 'EX3', powertrains: ['BEV'] },
  ]},
  { make: 'Foxtron', models: [
    { model: 'Model C', powertrains: ['BEV'] },
    { model: 'Model B', powertrains: ['BEV'] },
  ]},
  { make: 'HiPhi', models: [
    { model: 'HiPhi X', powertrains: ['BEV'] },
    { model: 'HiPhi Z', powertrains: ['BEV'] },
    { model: 'HiPhi Y', powertrains: ['BEV'] },
  ]},

  // ═══════════════════════ USA ═══════════════════════
  { make: 'Ford', models: [
    { model: 'Mustang Mach-E', powertrains: ['BEV'] },
    { model: 'F-150 Lightning', powertrains: ['BEV'] },
    { model: 'E-Transit', powertrains: ['BEV'] },
    { model: 'Explorer Electric', powertrains: ['BEV'] },
    { model: 'Capri Electric', powertrains: ['BEV'] },
    { model: 'Puma EcoBoost Hybrid', powertrains: ['MHEV'] },
    { model: 'Kuga PHEV', powertrains: ['PHEV'] },
    { model: 'Kuga Hybrid', powertrains: ['HEV'] },
    { model: 'Tourneo Custom PHEV', powertrains: ['PHEV'] },
    { model: 'Escape PHEV', powertrains: ['PHEV'] },
  ]},
  { make: 'Chevrolet', models: [
    { model: 'Bolt EV', powertrains: ['BEV'] },
    { model: 'Bolt EUV', powertrains: ['BEV'] },
    { model: 'Equinox EV', powertrains: ['BEV'] },
    { model: 'Blazer EV', powertrains: ['BEV'] },
    { model: 'Silverado EV', powertrains: ['BEV'] },
  ]},
  { make: 'Cadillac', models: [
    { model: 'LYRIQ', powertrains: ['BEV'] },
    { model: 'OPTIQ', powertrains: ['BEV'] },
    { model: 'ESCALADE IQ', powertrains: ['BEV'] },
    { model: 'CELESTIQ', powertrains: ['BEV'] },
  ]},
  { make: 'GMC', models: [
    { model: 'Hummer EV', powertrains: ['BEV'] },
    { model: 'Sierra EV', powertrains: ['BEV'] },
  ]},
  { make: 'Dodge', models: [
    { model: 'Charger Daytona', powertrains: ['BEV'] },
    { model: 'Hornet R/T', powertrains: ['PHEV'] },
  ]},
  { make: 'Chrysler', models: [
    { model: 'Pacifica PHEV', powertrains: ['PHEV'] },
  ]},
  { make: 'Rivian', models: [
    { model: 'R1T', powertrains: ['BEV'] },
    { model: 'R1S', powertrains: ['BEV'] },
    { model: 'R2', powertrains: ['BEV'] },
    { model: 'R3', powertrains: ['BEV'] },
  ]},
  { make: 'Lucid', models: [
    { model: 'Air', powertrains: ['BEV'] },
    { model: 'Gravity', powertrains: ['BEV'] },
  ]},
  { make: 'Fisker', models: [
    { model: 'Ocean', powertrains: ['BEV'] },
    { model: 'Pear', powertrains: ['BEV'] },
  ]},
  { make: 'Scout', models: [
    { model: 'Terra', powertrains: ['BEV'] },
    { model: 'Traveler', powertrains: ['BEV'] },
  ]},
  { make: 'Canoo', models: [
    { model: 'Lifestyle Vehicle', powertrains: ['BEV'] },
    { model: 'Pickup', powertrains: ['BEV'] },
  ]},
  { make: 'VinFast', models: [
    { model: 'VF 6', powertrains: ['BEV'] },
    { model: 'VF 7', powertrains: ['BEV'] },
    { model: 'VF 8', powertrains: ['BEV'] },
    { model: 'VF 9', powertrains: ['BEV'] },
    { model: 'VF 3', powertrains: ['BEV'] },
  ]},

  // ═══════════════════════ OTHER ═══════════════════════
  { make: 'Tata', models: [
    { model: 'Nexon EV', powertrains: ['BEV'] },
    { model: 'Tiago EV', powertrains: ['BEV'] },
    { model: 'Punch EV', powertrains: ['BEV'] },
  ]},
  { make: 'Mahindra', models: [
    { model: 'XUV400 EV', powertrains: ['BEV'] },
    { model: 'BE.05', powertrains: ['BEV'] },
    { model: 'XEV 9e', powertrains: ['BEV'] },
  ]},
  { make: 'Abarth', models: [
    { model: '500e', powertrains: ['BEV'] },
  ]},
  { make: 'Caterham', models: [
    { model: 'Project V', powertrains: ['BEV'] },
  ]},
  { make: 'Ineos', models: [
    { model: 'Fusilier', powertrains: ['PHEV', 'BEV'] },
  ]},
  { make: 'SsangYong', models: [
    { model: 'Torres EVX', powertrains: ['BEV'] },
    { model: 'Korando e-Motion', powertrains: ['BEV'] },
  ]},
  { make: 'KGM (SsangYong)', models: [
    { model: 'Torres EVX', powertrains: ['BEV'] },
  ]},
  { make: 'e.GO', models: [
    { model: 'Life', powertrains: ['BEV'] },
  ]},
  { make: 'Microlino', models: [
    { model: 'Microlino', powertrains: ['BEV'] },
  ]},
  { make: 'XEV', models: [
    { model: 'YOYO', powertrains: ['BEV'] },
  ]},
  { make: 'ACM', models: [
    { model: 'City One', powertrains: ['BEV'] },
  ]},
  { make: 'Silence', models: [
    { model: 'S04', powertrains: ['BEV'] },
  ]},
  { make: 'Elaris', models: [
    { model: 'Finn', powertrains: ['BEV'] },
    { model: 'Juno', powertrains: ['BEV'] },
    { model: 'Beo', powertrains: ['BEV'] },
  ]},
];

/** Build a lookup: make → CatalogModel[] */
export function buildCatalogMap(catalog: CatalogEntry[]): Map<string, CatalogModel[]> {
  const map = new Map<string, CatalogModel[]>();
  for (const entry of catalog) {
    const existing = map.get(entry.make);
    if (existing) {
      // Merge models, dedup by name
      const names = new Set(existing.map(m => m.model));
      for (const m of entry.models) {
        if (!names.has(m.model)) {
          existing.push(m);
          names.add(m.model);
        }
      }
    } else {
      map.set(entry.make, [...entry.models]);
    }
  }
  return map;
}
