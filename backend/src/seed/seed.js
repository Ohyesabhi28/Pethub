// seed/seed.js — idempotent seed of users, vets, medicines.
// Runs at boot if SEED_ON_BOOT=true and the medicines collection is empty.
// Set FORCE_RESEED=true in .env once to wipe old data and re-seed, then set back to false.
const { auth, db } = require('../firebase');
const log = require('../utils/logger');

// ── Demo accounts ────────────────────────────────────────────────────────────
const SEED_USERS = [
  { email: 'owner@pethub.local',  password: 'password123', name: 'Priya Sharma',       role: 'PetOwner',     approved: true  },
  { email: 'vet1@pethub.local',   password: 'password123', name: 'Dr. Anand Mehta',    role: 'Veterinarian', approved: true,  speciality: 'General Practice' },
  { email: 'vet2@pethub.local',   password: 'password123', name: 'Dr. Kavya Nair',     role: 'Veterinarian', approved: true,  speciality: 'Dermatology' },
  { email: 'vet3@pethub.local',   password: 'password123', name: 'Dr. Rajesh Patel',   role: 'Veterinarian', approved: true,  speciality: 'Surgery' },
  { email: 'vet4@pethub.local',   password: 'password123', name: 'Dr. Sneha Iyer',     role: 'Veterinarian', approved: true,  speciality: 'Cardiology' },
  { email: 'vet5@pethub.local',   password: 'password123', name: 'Dr. Vikram Singh',   role: 'Veterinarian', approved: false, speciality: 'Orthopedics' }, // pending
  { email: 'admin@pethub.local',  password: 'password123', name: 'Arjun Admin',        role: 'Admin',        approved: true  },
];

// ── Comprehensive Indian pet pharmacy — all prices in ₹ INR ─────────────────
// 90 medicines across 13 categories, all available in Indian market
const SEED_MEDICINES = [

  // ── ANTIBIOTICS (10) ──────────────────────────────────────────────────────
  {
    name: 'Zeniquin 25mg (Marbofloxacin)',
    category: 'Antibiotics', price: 620, stock: 50, requiresRx: true,
    description: 'Broad-spectrum fluoroquinolone antibiotic for skin, UTI and respiratory infections in dogs and cats.',
  },
  {
    name: 'Amoxycillin-Clavulanate 250mg (Synulox)',
    category: 'Antibiotics', price: 185, stock: 60, requiresRx: true,
    description: 'Penicillin-type antibiotic effective against resistant bacterial infections in pets.',
  },
  {
    name: 'Enrofloxacin 50mg (Baytril)',
    category: 'Antibiotics', price: 280, stock: 45, requiresRx: true,
    description: 'Fluoroquinolone antibiotic used for urinary, respiratory and skin infections.',
  },
  {
    name: 'Doxycycline 100mg',
    category: 'Antibiotics', price: 120, stock: 80, requiresRx: true,
    description: 'Tetracycline antibiotic for tick-borne diseases, Lyme disease and respiratory infections.',
  },
  {
    name: 'Metronidazole 400mg (Flagyl)',
    category: 'Antibiotics', price: 45, stock: 100, requiresRx: true,
    description: 'Antibiotic and antiprotozoal for giardia, colitis and anaerobic bacterial infections.',
  },
  {
    name: 'Cephalexin 500mg',
    category: 'Antibiotics', price: 160, stock: 70, requiresRx: true,
    description: 'First-generation cephalosporin for skin, bone and urinary tract infections.',
  },
  {
    name: 'Clindamycin 150mg (Antirobe)',
    category: 'Antibiotics', price: 220, stock: 40, requiresRx: true,
    description: 'Effective against anaerobic bacteria and toxoplasma; used for dental and deep skin infections.',
  },
  {
    name: 'Trimethoprim-Sulfa 480mg (Tribrissen)',
    category: 'Antibiotics', price: 85, stock: 90, requiresRx: true,
    description: 'Combination antibiotic for urinary, respiratory and gastrointestinal infections.',
  },
  {
    name: 'Tylosin 100mg Powder (Tylan)',
    category: 'Antibiotics', price: 380, stock: 35, requiresRx: true,
    description: 'Macrolide antibiotic particularly effective for chronic colitis and diarrhoea in dogs.',
  },
  {
    name: 'Azithromycin 250mg',
    category: 'Antibiotics', price: 95, stock: 55, requiresRx: true,
    description: 'Broad-spectrum macrolide antibiotic for respiratory and soft tissue infections.',
  },

  // ── DEWORMERS (8) ─────────────────────────────────────────────────────────
  {
    name: 'Drontal Plus (Dog)',
    category: 'Dewormers', price: 285, stock: 100, requiresRx: false,
    description: 'Broad-spectrum dewormer eliminating tapeworms, roundworms and hookworms in dogs.',
  },
  {
    name: 'Drontal Cat Tablet',
    category: 'Dewormers', price: 225, stock: 80, requiresRx: false,
    description: 'Dewormer for roundworms and tapeworms in cats. Single-tablet treatment.',
  },
  {
    name: 'Milbemax Small Dog',
    category: 'Dewormers', price: 320, stock: 60, requiresRx: true,
    description: 'Heartworm prevention and broad-spectrum intestinal worm treatment for small dogs.',
  },
  {
    name: 'Milbemax Large Dog',
    category: 'Dewormers', price: 460, stock: 45, requiresRx: true,
    description: 'Heartworm prevention and intestinal worm treatment for dogs over 5 kg.',
  },
  {
    name: 'Prazitel Plus (Cat)',
    category: 'Dewormers', price: 165, stock: 75, requiresRx: false,
    description: 'Effective against tapeworms and roundworms in cats. Easy to administer.',
  },
  {
    name: 'Fenbendazole 150mg (Panacur)',
    category: 'Dewormers', price: 180, stock: 65, requiresRx: false,
    description: 'Safe broad-spectrum dewormer for roundworms, hookworms, whipworms and giardia.',
  },
  {
    name: 'Ivermectin 1% Injection (10ml)',
    category: 'Dewormers', price: 65, stock: 40, requiresRx: true,
    description: 'Antiparasitic injection for mange, ear mites and intestinal worms. Vet-administered.',
  },
  {
    name: 'Profender Spot-On (Cat M)',
    category: 'Dewormers', price: 450, stock: 50, requiresRx: true,
    description: 'Topical dewormer for cats against tapeworms and roundworms. Applied to skin.',
  },

  // ── PARASITE CONTROL / FLEA & TICK (12) ──────────────────────────────────
  {
    name: 'Frontline Plus (Dog S — up to 10kg)',
    category: 'Parasite Control', price: 435, stock: 120, requiresRx: false,
    description: 'Topical flea and tick treatment for small dogs up to 10 kg. Lasts 1 month.',
  },
  {
    name: 'Frontline Plus (Dog M — 10–20kg)',
    category: 'Parasite Control', price: 475, stock: 110, requiresRx: false,
    description: 'Topical flea and tick treatment for medium dogs 10–20 kg. Lasts 1 month.',
  },
  {
    name: 'Frontline Plus (Dog L — 20–40kg)',
    category: 'Parasite Control', price: 510, stock: 90, requiresRx: false,
    description: 'Topical flea and tick treatment for large dogs 20–40 kg. Lasts 1 month.',
  },
  {
    name: 'Frontline Plus (Cat)',
    category: 'Parasite Control', price: 420, stock: 100, requiresRx: false,
    description: 'Monthly topical flea, tick and lice treatment safe for cats and kittens from 8 weeks.',
  },
  {
    name: 'NexGard Chew (Small Dog 2–3.5kg)',
    category: 'Parasite Control', price: 899, stock: 85, requiresRx: false,
    description: 'Monthly oral chewable for fleas and ticks in small dogs. Beef-flavoured.',
  },
  {
    name: 'NexGard Spectra (Medium Dog 7.5–15kg)',
    category: 'Parasite Control', price: 1099, stock: 70, requiresRx: false,
    description: 'Monthly chewable for fleas, ticks, heartworm and intestinal worms in medium dogs.',
  },
  {
    name: 'Bravecto Chew (Small Dog 4.5–10kg)',
    category: 'Parasite Control', price: 1849, stock: 30, requiresRx: true,
    description: '12-week flea and tick protection chewable. Single dose lasts 3 months.',
  },
  {
    name: 'Bravecto Spot-On (Cat 2.8–6.25kg)',
    category: 'Parasite Control', price: 1650, stock: 28, requiresRx: true,
    description: '12-week topical flea and tick treatment for cats.',
  },
  {
    name: 'Fiprofort Plus (Dog M)',
    category: 'Parasite Control', price: 320, stock: 95, requiresRx: false,
    description: 'Generic Frontline equivalent — fipronil + methoprene topical for medium dogs.',
  },
  {
    name: 'Seresto Flea & Tick Collar (Dog)',
    category: 'Parasite Control', price: 2200, stock: 25, requiresRx: false,
    description: '8-month continuous flea and tick protection collar for dogs.',
  },
  {
    name: 'Stronghold Spot-On (Cat)',
    category: 'Parasite Control', price: 680, stock: 40, requiresRx: true,
    description: 'Monthly topical treatment for fleas, ear mites and roundworms in cats.',
  },
  {
    name: 'Beaphar Anti-Parasite Spot-On (Dog)',
    category: 'Parasite Control', price: 350, stock: 60, requiresRx: false,
    description: 'Natural-ingredient spot-on repellent against fleas, ticks and mosquitoes.',
  },

  // ── VACCINES (7) ─────────────────────────────────────────────────────────
  {
    name: 'Nobivac DHPPi (Dog 5-in-1)',
    category: 'Vaccines', price: 350, stock: 50, requiresRx: true,
    description: 'Core canine vaccine: distemper, hepatitis, parvovirus and parainfluenza.',
  },
  {
    name: 'Nobivac Rabies (Dog/Cat)',
    category: 'Vaccines', price: 220, stock: 60, requiresRx: true,
    description: 'Annual rabies vaccination for dogs and cats. Legally required in India.',
  },
  {
    name: 'Nobivac KC (Kennel Cough)',
    category: 'Vaccines', price: 480, stock: 35, requiresRx: true,
    description: 'Intranasal vaccine for Bordetella bronchiseptica and parainfluenza protection.',
  },
  {
    name: 'Canigen CHPPi+L (Dog 6-in-1)',
    category: 'Vaccines', price: 420, stock: 40, requiresRx: true,
    description: 'Comprehensive canine vaccine including leptospirosis protection.',
  },
  {
    name: 'Felocell CVR (Cat 3-in-1)',
    category: 'Vaccines', price: 380, stock: 45, requiresRx: true,
    description: 'Core feline vaccine: calicivirus, rhinotracheitis and panleukopenia.',
  },
  {
    name: 'Felocell FeLV (Feline Leukemia)',
    category: 'Vaccines', price: 580, stock: 30, requiresRx: true,
    description: 'Feline leukemia virus vaccination for outdoor and multi-cat households.',
  },
  {
    name: 'Defensor 1 Rabies (Cat)',
    category: 'Vaccines', price: 200, stock: 50, requiresRx: true,
    description: 'Annual rabies vaccine specifically formulated for cats.',
  },

  // ── PAIN RELIEF & ANTI-INFLAMMATORY (7) ──────────────────────────────────
  {
    name: 'Meloxicam Oral Suspension 1mg/ml (Loxicom)',
    category: 'Pain Relief', price: 280, stock: 40, requiresRx: true,
    description: 'NSAID anti-inflammatory and pain relief for post-surgical and chronic pain in dogs and cats.',
  },
  {
    name: 'Carprofen 50mg (Rimadyl)',
    category: 'Pain Relief', price: 650, stock: 35, requiresRx: true,
    description: 'NSAID for arthritis, post-operative pain and soft tissue pain in dogs.',
  },
  {
    name: 'Prednisolone 5mg',
    category: 'Pain Relief', price: 45, stock: 90, requiresRx: true,
    description: 'Corticosteroid for allergic reactions, inflammation and immune suppression.',
  },
  {
    name: 'Dexamethasone 0.5mg',
    category: 'Pain Relief', price: 55, stock: 70, requiresRx: true,
    description: 'Potent corticosteroid for severe allergic reactions and inflammatory conditions.',
  },
  {
    name: 'Tramadol 50mg',
    category: 'Pain Relief', price: 120, stock: 45, requiresRx: true,
    description: 'Opioid analgesic for moderate to severe pain management in dogs.',
  },
  {
    name: 'Gabapentin 100mg',
    category: 'Pain Relief', price: 95, stock: 55, requiresRx: true,
    description: 'Neuropathic pain management and anti-seizure medication for dogs and cats.',
  },
  {
    name: 'Onsior 6mg (Robenacoxib)',
    category: 'Pain Relief', price: 420, stock: 30, requiresRx: true,
    description: 'COX-2 selective NSAID for acute pain and inflammation in cats. Cat-safe.',
  },

  // ── ALLERGY & SKIN (6) ────────────────────────────────────────────────────
  {
    name: 'Apoquel 16mg (Oclacitinib)',
    category: 'Allergy & Skin', price: 1250, stock: 40, requiresRx: true,
    description: 'Fast-acting JAK inhibitor for itch relief in dogs with allergic dermatitis.',
  },
  {
    name: 'Hydroxyzine 25mg',
    category: 'Allergy & Skin', price: 85, stock: 60, requiresRx: true,
    description: 'Antihistamine for allergic skin conditions, itching and mild sedation.',
  },
  {
    name: 'Cetirizine 5mg (for Pets)',
    category: 'Allergy & Skin', price: 35, stock: 100, requiresRx: false,
    description: 'Second-generation antihistamine with minimal sedation for allergic reactions.',
  },
  {
    name: 'Chlorpheniramine 4mg',
    category: 'Allergy & Skin', price: 25, stock: 120, requiresRx: false,
    description: 'Classic antihistamine for acute allergic reactions, insect bites and hives.',
  },
  {
    name: 'Himalaya Erina-EP Shampoo (200ml)',
    category: 'Allergy & Skin', price: 220, stock: 80, requiresRx: false,
    description: 'Herbal anti-parasitic shampoo with neem, eucalyptus and tea tree oil for dogs.',
  },
  {
    name: 'Virbac Episoothe Oatmeal Shampoo (250ml)',
    category: 'Allergy & Skin', price: 580, stock: 45, requiresRx: false,
    description: 'Soothing rehydrating shampoo for dogs with sensitive, dry or irritated skin.',
  },

  // ── EAR & EYE (6) ────────────────────────────────────────────────────────
  {
    name: 'Otomax Ear Ointment (14g)',
    category: 'Ear & Eye', price: 390, stock: 35, requiresRx: true,
    description: 'Antibiotic + antifungal + steroid ear ointment for bacterial and yeast ear infections.',
  },
  {
    name: 'Surolan Ear Drops (15ml)',
    category: 'Ear & Eye', price: 580, stock: 28, requiresRx: true,
    description: 'Miconazole + polymyxin B ear drops for otitis externa in dogs.',
  },
  {
    name: 'Posatex Ear Drops (7.5ml)',
    category: 'Ear & Eye', price: 750, stock: 22, requiresRx: true,
    description: 'Once-daily ear drops for otitis externa. Convenient 7-day treatment.',
  },
  {
    name: 'Ciprofloxacin 0.3% Eye Drops (5ml)',
    category: 'Ear & Eye', price: 65, stock: 60, requiresRx: true,
    description: 'Antibiotic eye drops for bacterial conjunctivitis and corneal ulcers.',
  },
  {
    name: 'Tobramycin 0.3% Eye Ointment (3.5g)',
    category: 'Ear & Eye', price: 120, stock: 45, requiresRx: true,
    description: 'Antibiotic eye ointment for bacterial eye infections in dogs and cats.',
  },
  {
    name: 'Genteal Lubricating Eye Drops (15ml)',
    category: 'Ear & Eye', price: 180, stock: 70, requiresRx: false,
    description: 'Lubricating eye drops for dry eyes and eye irritation in dogs and cats.',
  },

  // ── DIGESTIVE HEALTH (7) ──────────────────────────────────────────────────
  {
    name: 'Cerenia 16mg (Maropitant)',
    category: 'Digestive', price: 850, stock: 35, requiresRx: true,
    description: 'Anti-nausea and anti-vomiting medication for motion sickness and acute vomiting.',
  },
  {
    name: 'Probiotic Forte Sachet (10 sachets)',
    category: 'Digestive', price: 120, stock: 80, requiresRx: false,
    description: 'Multi-strain probiotic for restoring gut flora after antibiotics or diarrhoea.',
  },
  {
    name: 'Lactulose Syrup 200ml',
    category: 'Digestive', price: 95, stock: 50, requiresRx: false,
    description: 'Osmotic laxative for constipation and hepatic encephalopathy in dogs and cats.',
  },
  {
    name: 'Famotidine 10mg (Pepcid)',
    category: 'Digestive', price: 45, stock: 90, requiresRx: false,
    description: 'H2 blocker for acid reflux, gastric ulcers and gastrointestinal upset.',
  },
  {
    name: 'Omeprazole 10mg (Gastrogard)',
    category: 'Digestive', price: 65, stock: 70, requiresRx: false,
    description: 'Proton pump inhibitor for stomach ulcers and acid-related gastrointestinal issues.',
  },
  {
    name: 'Sucralfate 1g Sachet',
    category: 'Digestive', price: 35, stock: 60, requiresRx: true,
    description: 'Mucosal protective agent for stomach ulcers and gastrointestinal bleeding.',
  },
  {
    name: 'FortiFlora Probiotic (Dog — 30 sachets)',
    category: 'Digestive', price: 1450, stock: 30, requiresRx: false,
    description: 'Purina veterinary probiotic supplement for digestive health and immune support.',
  },

  // ── HEART & LIVER (5) ────────────────────────────────────────────────────
  {
    name: 'Enalapril 2.5mg (Enacard)',
    category: 'Heart & Liver', price: 85, stock: 50, requiresRx: true,
    description: 'ACE inhibitor for congestive heart failure and hypertension in dogs.',
  },
  {
    name: 'Furosemide 40mg (Lasix)',
    category: 'Heart & Liver', price: 35, stock: 60, requiresRx: true,
    description: 'Diuretic for fluid accumulation in congestive heart failure and pulmonary oedema.',
  },
  {
    name: 'Pimobendan 1.25mg (Vetmedin)',
    category: 'Heart & Liver', price: 980, stock: 25, requiresRx: true,
    description: 'Inodilator for dilated cardiomyopathy and mitral valve disease in dogs.',
  },
  {
    name: 'Silymarin 200mg (Livolin Forte)',
    category: 'Heart & Liver', price: 180, stock: 55, requiresRx: false,
    description: 'Milk thistle extract for liver protection, hepatitis and liver detox in pets.',
  },
  {
    name: 'SAMe 200mg (Denosyl)',
    category: 'Heart & Liver', price: 650, stock: 30, requiresRx: false,
    description: 'S-Adenosylmethionine for liver support and cognitive function in dogs and cats.',
  },

  // ── VITAMINS & SUPPLEMENTS (10) ───────────────────────────────────────────
  {
    name: 'Vetri-Science Canine Plus (60 tabs)',
    category: 'Vitamins', price: 890, stock: 40, requiresRx: false,
    description: 'Complete daily multivitamin with omega-3, minerals and antioxidants for dogs.',
  },
  {
    name: 'Cosequin DS Joint Supplement (60 tabs)',
    category: 'Vitamins', price: 1450, stock: 30, requiresRx: false,
    description: 'Glucosamine + chondroitin for hip and joint health in dogs.',
  },
  {
    name: 'Omega-3 Fish Oil Capsules (60 caps)',
    category: 'Vitamins', price: 380, stock: 60, requiresRx: false,
    description: 'High-potency fish oil for skin, coat, heart and joint health in dogs and cats.',
  },
  {
    name: 'PetCal Calcium + Vitamin D3 (100 tabs)',
    category: 'Vitamins', price: 180, stock: 70, requiresRx: false,
    description: 'Calcium and vitamin D3 supplement for bone strength, especially in puppies.',
  },
  {
    name: 'Biotin Plus Coat & Skin (50 tabs)',
    category: 'Vitamins', price: 290, stock: 55, requiresRx: false,
    description: 'Biotin, zinc and vitamin E supplement for healthy coat and skin in dogs.',
  },
  {
    name: 'Vitamin B Complex Syrup 100ml',
    category: 'Vitamins', price: 95, stock: 80, requiresRx: false,
    description: 'B-vitamin complex for appetite stimulation, energy and nervous system support.',
  },
  {
    name: 'Taurine 500mg (Cat Heart — 60 caps)',
    category: 'Vitamins', price: 450, stock: 35, requiresRx: false,
    description: 'Essential amino acid supplement for feline cardiac health and vision.',
  },
  {
    name: 'Lysine 500mg (Cat Immunity — 60 sachets)',
    category: 'Vitamins', price: 320, stock: 40, requiresRx: false,
    description: 'L-Lysine for managing herpesvirus-related upper respiratory infections in cats.',
  },
  {
    name: 'Iron + Folic Acid Supplement (30ml syrup)',
    category: 'Vitamins', price: 110, stock: 65, requiresRx: false,
    description: 'Haematinic supplement for anaemia recovery and post-surgery rehabilitation.',
  },
  {
    name: 'Zymase Enzyme Supplement (100ml)',
    category: 'Vitamins', price: 220, stock: 50, requiresRx: false,
    description: 'Digestive enzyme supplement for better nutrient absorption and gut health.',
  },

  // ── GROOMING (5) ──────────────────────────────────────────────────────────
  {
    name: 'Virbac Dentifrice Toothpaste (100g)',
    category: 'Grooming', price: 280, stock: 60, requiresRx: false,
    description: 'Enzymatic toothpaste in poultry flavour for daily dental hygiene in dogs.',
  },
  {
    name: "Vet's Best Dental Spray (118ml)",
    category: 'Grooming', price: 480, stock: 40, requiresRx: false,
    description: 'No-brush dental spray with tea tree oil for plaque and tartar control in pets.',
  },
  {
    name: 'Petkin Tick & Flea Spray (250ml)',
    category: 'Grooming', price: 350, stock: 55, requiresRx: false,
    description: 'Plant-based spray repellent against fleas, ticks and mosquitoes for dogs.',
  },
  {
    name: 'Wahl Pet Tearless Puppy Shampoo (250ml)',
    category: 'Grooming', price: 420, stock: 45, requiresRx: false,
    description: 'Mild tearless shampoo for puppies with lavender and chamomile extracts.',
  },
  {
    name: 'Beaphar Anti-Parasite Spray (400ml)',
    category: 'Grooming', price: 380, stock: 50, requiresRx: false,
    description: 'Environmental spray for treating home furnishings against flea larvae and eggs.',
  },

  // ── HORMONAL & ENDOCRINE (4) ──────────────────────────────────────────────
  {
    name: 'Vetoryl 30mg (Trilostane)',
    category: 'Hormonal', price: 2850, stock: 18, requiresRx: true,
    description: "Trilostane for Cushing's disease (hyperadrenocorticism) management in dogs.",
  },
  {
    name: 'Felimazole 5mg (Methimazole)',
    category: 'Hormonal', price: 420, stock: 25, requiresRx: true,
    description: 'Methimazole for feline hyperthyroidism. Long-term management tablet for cats.',
  },
  {
    name: 'Thyro-Tabs 0.1mg (Levothyroxine)',
    category: 'Hormonal', price: 180, stock: 35, requiresRx: true,
    description: 'Thyroid hormone replacement for hypothyroidism in dogs.',
  },
  {
    name: 'Caninsulin 40 IU/ml (2.5ml vial)',
    category: 'Hormonal', price: 1250, stock: 20, requiresRx: true,
    description: 'Porcine insulin for diabetes mellitus management in dogs and cats.',
  },

  // ── URINARY HEALTH (3) ────────────────────────────────────────────────────
  {
    name: 'Cranberry + D-Mannose (30 tabs)',
    category: 'Urinary', price: 380, stock: 50, requiresRx: false,
    description: 'Natural UTI prevention supplement for dogs with recurrent urinary infections.',
  },
  {
    name: 'Cystease (Feline Urinary — 30 caps)',
    category: 'Urinary', price: 850, stock: 30, requiresRx: false,
    description: 'N-acetyl glucosamine and palmitoylethanolamide for feline idiopathic cystitis.',
  },
  {
    name: 'Methionine 500mg (Urinary Acidifier)',
    category: 'Urinary', price: 120, stock: 45, requiresRx: false,
    description: 'Urinary acidifier to prevent struvite crystal formation in dogs and cats.',
  },

  // ── DIET & PRESCRIPTION FOOD (5) ─────────────────────────────────────────
  {
    name: 'Royal Canin Urinary S/O Dog (2kg)',
    category: 'Diet Food', price: 1480, stock: 20, requiresRx: false,
    description: 'Prescription diet dissolving struvite stones and preventing urinary crystals.',
  },
  {
    name: 'Royal Canin Renal Cat (2kg)',
    category: 'Diet Food', price: 1650, stock: 18, requiresRx: false,
    description: 'Low-phosphorus renal support diet for cats with chronic kidney disease.',
  },
  {
    name: "Hills k/d Kidney Care Dog (1.5kg)",
    category: 'Diet Food', price: 1850, stock: 15, requiresRx: false,
    description: 'Prescription renal diet formulated to support kidney health in dogs.',
  },
  {
    name: 'Purina ProPlan Veterinary EN (2kg)',
    category: 'Diet Food', price: 1350, stock: 20, requiresRx: false,
    description: 'Gastrointestinal health diet for dogs with sensitive digestion or acute diarrhoea.',
  },
  {
    name: 'Royal Canin Hypoallergenic Dog (2kg)',
    category: 'Diet Food', price: 1920, stock: 12, requiresRx: false,
    description: 'Hydrolysed protein diet for dogs with food allergies and adverse food reactions.',
  },

  // ── FIRST AID (5) ─────────────────────────────────────────────────────────
  {
    name: 'Povidone Iodine Solution 10% (100ml)',
    category: 'First Aid', price: 55, stock: 90, requiresRx: false,
    description: 'Antiseptic wound wash for cuts, wounds and minor skin infections in pets.',
  },
  {
    name: 'Chlorhexidine Wound Spray (150ml)',
    category: 'First Aid', price: 180, stock: 75, requiresRx: false,
    description: 'Broad-spectrum antiseptic spray for wound care and hot spots in pets.',
  },
  {
    name: 'Hydrogen Peroxide 3% Solution (100ml)',
    category: 'First Aid', price: 45, stock: 80, requiresRx: false,
    description: 'Antiseptic for minor wound cleaning. Do not use on deep wounds.',
  },
  {
    name: 'Self-Adhesive Cohesive Bandage (5cm x 4m)',
    category: 'First Aid', price: 85, stock: 100, requiresRx: false,
    description: 'Flexible self-adhesive bandage wrap for securing dressings on pet injuries.',
  },
  {
    name: 'Sterile Saline Eye/Wound Wash (20ml)',
    category: 'First Aid', price: 65, stock: 85, requiresRx: false,
    description: 'Sterile saline solution for flushing wounds and irrigating eyes in pets.',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function seedUser(u) {
  let rec;
  try {
    rec = await auth.createUser({ email: u.email, password: u.password, displayName: u.name });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      rec = await auth.getUserByEmail(u.email);
    } else {
      throw err;
    }
  }
  await auth.setCustomUserClaims(rec.uid, { role: u.role });
  await db.collection('users').doc(rec.uid).set({
    email: u.email, name: u.name, role: u.role, approved: u.approved,
    speciality: u.speciality || null,
    createdAt: new Date().toISOString(),
  }, { merge: true });
  return rec.uid;
}

async function alreadySeeded() {
  const snap = await db.collection('medicines').limit(1).get();
  return !snap.empty;
}

async function clearMedicines() {
  const snap = await db.collection('medicines').get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  log.info('seed: cleared existing medicines for re-seed');
}

async function seed() {
  const forceReseed = (process.env.FORCE_RESEED || '').toLowerCase() === 'true';

  if (!forceReseed && await alreadySeeded()) {
    log.info('seed: already populated, skipping. Set FORCE_RESEED=true to override.');
    return;
  }
  if (forceReseed) {
    log.info('seed: FORCE_RESEED=true — clearing old medicines');
    await clearMedicines();
  }

  log.info('seed: starting');
  for (const u of SEED_USERS) await seedUser(u);
  log.info('seed: users created');

  const batch = db.batch();
  SEED_MEDICINES.forEach((m, i) => {
    const ref = db.collection('medicines').doc(`med-${i + 1}`);
    batch.set(ref, { ...m, createdAt: new Date().toISOString() });
  });
  await batch.commit();
  log.info('seed: medicines created', { count: SEED_MEDICINES.length });
}

module.exports = { seed };

if (require.main === module) {
  seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
