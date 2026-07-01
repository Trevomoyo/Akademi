import { Subject, Topic } from '../types';

const placeholder = (id: string, subjectId: string, title: string): Topic => ({
  id, subjectId, title,
  summary: "Full notes are being authored. Practice questions coming soon.",
  readXP: 10,
  contentMarkdown: `### ${title}\n\nFull lesson coming soon.`,
  mcqs: [],
});

export const SUBJECTS_DB: Subject[] = [
  // ── O-LEVEL: CHEMISTRY ──────────────────────────────────
  {
    id: "chemistry", name: "Chemistry", code: "5070", level: "o", themeColor: "#7C3AED",
    vibeText: "Understanding the elements that make up our world.",
    topics: [
      {
        id: "chem-benzene", subjectId: "chemistry",
        title: "Organic Chemistry: Benzene & Aromatic Compounds",
        summary: "The stable ring structure of benzene, resonance, and electrophilic substitution.",
        readXP: 10, hasThreeDModel: "benzene",
        contentMarkdown: `## Benzene & Aromatic Compounds\n\n### 1. Structure of Benzene\n\nBenzene (C₆H₆) has six carbon atoms in a planar hexagonal ring. All C–C bond lengths are equal at 139 pm — between a single (154 pm) and double (134 pm) bond.\n\n> **Key point:** Benzene is stabilised by delocalisation of π electrons across all six carbons — this is the **delocalisation energy** of 152 kJ/mol.\n\n### 2. Electrophilic Substitution\n\nBenzene undergoes **substitution** (not addition) to preserve its aromatic system.\n\n**Nitration** (conc. HNO₃ + conc. H₂SO₄, 55°C):\n\n$$ C_6H_6 + HNO_3 \\rightarrow C_6H_5NO_2 + H_2O $$\n\nThe electrophile is the nitronium ion NO₂⁺.\n\n### 3. Why Not Addition?\n\nUnlike cyclohexene, benzene does not decolourise bromine water — its delocalised system is too stable to donate electrons without a Lewis acid catalyst (e.g. FeBr₃).`,
        mcqs: [
          { question: "Molecular formula of benzene?", options: ["C₆H₁₂","C₆H₆","C₆H₁₀","C₆H₁₄"], correctIndex: 1, explanation: "Benzene: 6 carbons, 6 hydrogens = C₆H₆." },
          { question: "Why is benzene unusually stable?", options: ["Alternating double bonds","High bond energy","Delocalisation of π electrons","It is non-polar"], correctIndex: 2, explanation: "π electrons spread over all 6 carbons lower overall energy — delocalisation." },
          { question: "Bond angle in benzene?", options: ["109.5°","120°","180°","90°"], correctIndex: 1, explanation: "sp² carbon gives 120° bond angles — perfect hexagon." },
          { question: "Benzene typically undergoes which reaction type?", options: ["Addition","Elimination","Electrophilic substitution","Free radical addition"], correctIndex: 2, explanation: "Substitution preserves the aromatic ring; addition would destroy it." },
          { question: "Electrophile in nitration of benzene?", options: ["NO₃⁻","NO₂⁺","H⁺","SO₃"], correctIndex: 1, explanation: "NO₂⁺ (nitronium ion) is generated from HNO₃ + H₂SO₄ and attacks the ring." }
        ],
        essayPrompt: "Explain the experimental evidence that led to rejection of the Kekulé model for benzene.",
        essayRubric: ["Equal bond lengths (all 139 pm)","Enthalpy of hydrogenation anomaly (152 kJ/mol)","Resistance to bromine water addition"]
      },
      {
        id: "chem-atomic", subjectId: "chemistry",
        title: "Atomic Structure & Electron Configuration",
        summary: "Shells, subshells and the three filling rules.",
        readXP: 10, hasThreeDModel: "electronconfiguration",
        contentMarkdown: `## Atomic Structure\n\n### 1. Inside the Atom\n\nProtons and neutrons form the nucleus; electrons occupy shells around it.\n\n> **Key point:** Atomic number Z = number of protons = number of electrons in a neutral atom.\n\n### 2. Subshells\n\n| Subshell | Max electrons |\n|----------|---------------|\n| s | 2 |\n| p | 6 |\n| d | 10 |\n| f | 14 |\n\n### 3. Filling Rules\n\n**Aufbau** — fill lowest energy first: 1s→2s→2p→3s→3p→4s→3d…\n\n**Pauli** — max 2 electrons per orbital, opposite spins.\n\n**Hund** — half-fill a subshell before pairing.\n\n### 4. Example: Iron (Z=26)\n\n$$ 1s^2\\;2s^2\\;2p^6\\;3s^2\\;3p^6\\;4s^2\\;3d^6 $$`,
        mcqs: [
          { question: "Which principle: fill lowest energy orbitals first?", options: ["Hund's","Pauli","Aufbau","Le Chatelier's"], correctIndex: 2, explanation: "Aufbau (German 'building up') — electrons fill from lowest energy upward." },
          { question: "Max electrons in a 3d subshell?", options: ["2","6","10","14"], correctIndex: 2, explanation: "5 orbitals × 2 electrons = 10." },
          { question: "Electron config of Na (Z=11)?", options: ["1s²2s²2p⁶3s¹","1s²2s²2p⁵3s²","1s²2s²2p⁶","1s²2s²2p⁴3s²3p¹"], correctIndex: 0, explanation: "2+2+6+1 = 11 electrons." },
          { question: "Which element has config [Ar]3d⁵4s¹?", options: ["Fe","Mn","Cr","Cu"], correctIndex: 2, explanation: "Chromium — half-filled d subshell is exceptionally stable." },
          { question: "How many orbitals in the p subshell?", options: ["1","2","3","5"], correctIndex: 2, explanation: "3 p-orbitals (px, py, pz) × 2 electrons each = 6 max." }
        ]
      },
      {
        id: "chem-bonding", subjectId: "chemistry",
        title: "Chemical Bonding: Ionic, Covalent & Metallic",
        summary: "How atoms bond and VSEPR shapes.",
        readXP: 10,
        contentMarkdown: `## Chemical Bonding\n\n### 1. Ionic Bonding\n\nMetal loses electrons → cation; non-metal gains electrons → anion. Giant lattice structure — high melting point, conducts when molten/dissolved.\n\n$$ Na \\rightarrow Na^+ + e^- \\qquad Cl + e^- \\rightarrow Cl^- $$\n\n### 2. Covalent Bonding\n\nNon-metals share electron pairs. Single (1 pair), double (2 pairs), triple (3 pairs).\n\n### 3. Metallic Bonding\n\nSea of delocalised electrons around positive ions — explains conductivity, malleability, ductility.\n\n### 4. VSEPR Shapes\n\n| Shape | Example | Angle |\n|-------|---------|-------|\n| Linear | CO₂ | 180° |\n| Trigonal planar | BF₃ | 120° |\n| Tetrahedral | CH₄ | 109.5° |\n| Bent | H₂O | 104.5° |\n\n> **Key point:** Lone pairs repel more than bonding pairs, compressing bond angles.`,
        mcqs: [
          { question: "Bond type between Na and Cl?", options: ["Covalent","Metallic","Ionic","Hydrogen"], correctIndex: 2, explanation: "Metal + non-metal = ionic bonding via electron transfer." },
          { question: "Bond angle in CH₄?", options: ["120°","180°","104.5°","109.5°"], correctIndex: 3, explanation: "4 bonding pairs, no lone pairs — tetrahedral, 109.5°." },
          { question: "Number of shared pairs in N≡N?", options: ["1","2","3","6"], correctIndex: 2, explanation: "Triple bond = 3 shared electron pairs." },
          { question: "Shape of H₂O?", options: ["Linear","Tetrahedral","Bent","Trigonal planar"], correctIndex: 2, explanation: "2 lone pairs on O compress H–O–H to 104.5° — bent/V-shaped." },
          { question: "Which property is NOT explained by metallic bonding?", options: ["Conductivity","Malleability","High m.p. of NaCl","Ductility"], correctIndex: 2, explanation: "NaCl's high melting point is ionic lattice energy, not metallic bonding." }
        ]
      },
      {
        id: "chem-kinetics", subjectId: "chemistry",
        title: "Rates of Reaction & Collision Theory",
        summary: "Factors affecting rate, activation energy and Maxwell-Boltzmann distribution.",
        readXP: 10,
        contentMarkdown: `## Rates of Reaction\n\n### 1. Collision Theory\n\nReactions occur when particles collide with energy ≥ activation energy Eₐ AND correct orientation.\n\n> **Key point:** Any factor increasing the frequency of successful collisions increases the rate.\n\n### 2. Factors\n\n- **Concentration** — more particles per volume → more collisions\n- **Temperature** — more particles exceed Eₐ (Maxwell-Boltzmann shifts right)\n- **Surface area** — more exposed particles (powder reacts faster than lumps)\n- **Catalyst** — provides alternative pathway with lower Eₐ\n\n### 3. Rate Expression\n\n$$ \\text{Rate} = \\frac{\\Delta[\\text{concentration}]}{\\Delta t} $$\n\n### 4. Measuring Rate\n\n- Volume of gas produced / time\n- Mass loss / time\n- Colour change (colorimetry)`,
        mcqs: [
          { question: "Which does NOT increase reaction rate?", options: ["↑ temperature","Add catalyst","↓ surface area","↑ concentration"], correctIndex: 2, explanation: "Decreasing surface area reduces particle exposure — slower rate." },
          { question: "A catalyst works by:", options: ["Increasing Eₐ","Decreasing Eₐ","Increasing temperature","Adding more reactant"], correctIndex: 1, explanation: "Catalyst provides an alternative lower-Eₐ pathway." },
          { question: "Successful collision requires:", options: ["Any energy","Energy ≥ Eₐ AND correct orientation","High speed only","Low pressure"], correctIndex: 1, explanation: "Both sufficient energy AND correct orientation are needed." },
          { question: "Powdered marble reacts faster with HCl than chips because:", options: ["Higher concentration","Greater surface area","It acts as catalyst","Higher temperature"], correctIndex: 1, explanation: "Powder has greater surface area — more CaCO₃ exposed to acid." },
          { question: "Area under Maxwell-Boltzmann curve represents:", options: ["Total pressure","Total number of molecules","Activation energy","Reaction rate"], correctIndex: 1, explanation: "The area represents the total number of molecules in the sample." }
        ]
      },
      {
        id: "chem-equilibrium", subjectId: "chemistry",
        title: "Chemical Equilibrium & Le Chatelier's Principle",
        summary: "Reversible reactions, Kc and shifting equilibrium.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Chemical Equilibrium\n\n### 1. Dynamic Equilibrium\n\nIn a closed system, when rate forward = rate reverse, concentrations remain constant.\n\n$$ A + B \\rightleftharpoons C + D $$\n\n### 2. Equilibrium Constant Kc\n\n$$ K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b} $$\n\nKc > 1 → products favoured; Kc < 1 → reactants favoured.\n\n### 3. Le Chatelier's Principle\n\n> **Key point:** A system at equilibrium shifts to oppose any imposed change.\n\n| Change | Shift |\n|--------|-------|\n| ↑ reactant concentration | → (right) |\n| ↑ temperature (exothermic rxn) | ← (left) |\n| ↑ pressure | toward fewer gas moles |\n| Add catalyst | no shift — faster equilibrium |\n\n### 4. Haber Process\n\n$$ N_2 + 3H_2 \\rightleftharpoons 2NH_3 \\quad \\Delta H = -92\\;\\text{kJ/mol} $$\n\n450°C, 200 atm, Fe catalyst — a compromise between rate and yield.`,
        mcqs: [
          { question: "At dynamic equilibrium:", options: ["No reactions occur","Forward rate = reverse rate","Concentrations are equal","Reaction is complete"], correctIndex: 1, explanation: "Both reactions continue at equal rates — concentrations stay constant but not necessarily equal." },
          { question: "Kc = 0.001 indicates:", options: ["Products favoured","Reactants favoured","Equal amounts","Complete reaction"], correctIndex: 1, explanation: "Kc < 1 → equilibrium lies left → reactants favoured." },
          { question: "Increasing temperature for an exothermic reaction:", options: ["Increases yield","No effect","Decreases yield","Increases Kc"], correctIndex: 2, explanation: "Le Chatelier's: system shifts left to absorb added heat — less product." },
          { question: "Adding catalyst to equilibrium:", options: ["Shifts right","Increases Kc","Reaches equilibrium faster, no position change","Shifts left"], correctIndex: 2, explanation: "Catalyst lowers Eₐ equally for both directions — equilibrium position unchanged." },
          { question: "High pressure favours NH₃ in Haber because:", options: ["It heats the gas","4 mol gas → 2 mol gas (fewer moles on product side)","It lowers Eₐ","N₂ is more reactive"], correctIndex: 1, explanation: "High pressure shifts toward fewer gas moles — the product side (2 mol NH₃)." }
        ]
      },
      {
        id: "chem-electrochemistry", subjectId: "chemistry",
        title: "Electrochemistry: Electrolysis & Cells",
        summary: "Electrode reactions, electrolysis of brine, electroplating and Faraday's laws.",
        readXP: 10,
        contentMarkdown: `## Electrochemistry\n\n### 1. Electrolysis\n\n- **Cathode** (−): reduction — $M^{n+} + ne^- \\rightarrow M$\n- **Anode** (+): oxidation — $M \\rightarrow M^{n+} + ne^-$\n\n> **Key point:** OIL RIG — Oxidation Is Loss, Reduction Is Gain.\n\n### 2. Electrolysis of Brine\n\n- Cathode: H₂ gas\n- Anode: Cl₂ gas\n- Remaining: NaOH solution\n\n### 3. Electroplating\n\nObject to plate = cathode; pure metal block = anode; metal salt solution = electrolyte.\n\n### 4. Faraday's Laws\n\n$$ m = \\frac{ItM}{nF} $$\n\nI = current (A), t = time (s), M = molar mass, n = electrons, F = 96500 C/mol.`,
        mcqs: [
          { question: "Where does reduction occur?", options: ["Anode","Cathode","Both","Neither"], correctIndex: 1, explanation: "Cathode is negative — cations gain electrons here (reduction)." },
          { question: "Product at cathode during electrolysis of dilute H₂SO₄?", options: ["O₂","H₂","S","H₂O"], correctIndex: 1, explanation: "2H⁺ + 2e⁻ → H₂ at the cathode." },
          { question: "To electroplate an object with silver, the object is:", options: ["The anode","The cathode","The electrolyte","Not in circuit"], correctIndex: 1, explanation: "Object = cathode; Ag⁺ ions deposit onto it by reduction." },
          { question: "OIL RIG stands for:", options: ["Only In Liquids, Reactions In Gas","Oxidation Is Loss, Reduction Is Gain","Oxygen In Lab, Reduction Is Gained","Only Ions Leave, Reactions Involve Gains"], correctIndex: 1, explanation: "OIL RIG: Oxidation Is Loss of electrons, Reduction Is Gain." },
          { question: "Three products of industrial brine electrolysis?", options: ["Na, Cl₂, H₂O","H₂, Cl₂, NaOH","NaCl, H₂, O₂","Na, H₂, Cl₂"], correctIndex: 1, explanation: "H₂ (cathode) + Cl₂ (anode) + NaOH (remaining solution)." }
        ]
      },
      {
        id: "chem-inorganic", subjectId: "chemistry",
        title: "Acids, Bases & Salts",
        summary: "pH, neutralisation, salt preparation and titration calculations.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Acids, Bases & Salts\n\n### 1. Definitions\n\n**Brønsted-Lowry:** Acid = H⁺ donor; Base = H⁺ acceptor.\n\n### 2. pH Scale\n\n$$ pH = -\\log_{10}[H^+] $$\n\npH 0–6 = acidic; 7 = neutral; 8–14 = alkaline.\n\n### 3. Salt Preparation\n\n| Type | Method |\n|------|--------|\n| Soluble from metal + acid | Excess metal + acid, filter |\n| Insoluble | Precipitation |\n| Soluble from acid + alkali | Titration |\n\n### 4. Titration Worked Example\n\n25.0 cm³ NaOH requires 20.0 cm³ of 0.10 mol/dm³ HCl.\n\n$$ n(HCl) = 0.10 \\times \\frac{20.0}{1000} = 0.002\\;\\text{mol} $$\n\n$$ [NaOH] = \\frac{0.002}{0.025} = 0.08\\;\\text{mol/dm}^3 $$`,
        mcqs: [
          { question: "Brønsted-Lowry acid is:", options: ["H⁺ acceptor","Electron donor","H⁺ donor","Substance dissolving in water"], correctIndex: 2, explanation: "BL acids donate H⁺ (protons) to a base." },
          { question: "pH of neutral solution at 25°C?", options: ["0","7","14","1"], correctIndex: 1, explanation: "[H⁺] = 10⁻⁷ → pH = 7." },
          { question: "Method for insoluble salt?", options: ["Acid + alkali titration","Precipitation","Dissolving in water","Heating"], correctIndex: 1, explanation: "Mix two solutions whose ions form an insoluble precipitate." },
          { question: "If [H⁺] = 0.01 mol/dm³, pH = ?", options: ["1","2","0.01","100"], correctIndex: 1, explanation: "pH = -log(10⁻²) = 2." },
          { question: "Neutralisation always produces salt plus:", options: ["O₂","CO₂","Water","H₂"], correctIndex: 2, explanation: "Acid + Base → Salt + Water." }
        ]
      },
      {
        id: "chem-metals", subjectId: "chemistry",
        title: "Metals: Reactivity Series & Extraction",
        summary: "Reactivity series, displacement reactions and extraction methods.",
        readXP: 10,
        contentMarkdown: `## Metals\n\n### 1. Reactivity Series\n\n**K > Na > Ca > Mg > Al > Zn > Fe > Sn > Pb > H > Cu > Ag > Au**\n\n> **Key point:** More reactive metals displace less reactive ones from solutions.\n\n### 2. Displacement Reactions\n\n$$ Fe(s) + CuSO_4(aq) \\rightarrow FeSO_4(aq) + Cu(s) $$\n\n### 3. Extraction Methods\n\n| Metal | Method |\n|-------|--------|\n| K, Na, Ca, Mg, Al | Electrolysis |\n| Zn, Fe, Sn, Pb | Carbon reduction |\n| Cu, Ag, Au | Found native / heat |\n\n### 4. Blast Furnace\n\n$$ Fe_2O_3 + 3CO \\rightarrow 2Fe + 3CO_2 $$\n\nCO is the reducing agent. Limestone removes acidic slag.`,
        mcqs: [
          { question: "Most reactive metal?", options: ["Gold","Copper","Potassium","Iron"], correctIndex: 2, explanation: "K is at the top — reacts explosively with water." },
          { question: "Why is Al extracted by electrolysis not carbon reduction?", options: ["Al is expensive","Al is more reactive than carbon","Al melts easily","Carbon is rare"], correctIndex: 1, explanation: "Al is above carbon — carbon cannot displace it." },
          { question: "Zn added to CuSO₄ solution:", options: ["No reaction","Cu displaces Zn","Zn displaces Cu","Both dissolve"], correctIndex: 2, explanation: "Zn more reactive: Zn + CuSO₄ → ZnSO₄ + Cu." },
          { question: "Reducing agent in blast furnace?", options: ["Iron oxide","Limestone","CO","Coke"], correctIndex: 2, explanation: "CO reduces Fe₂O₃: Fe₂O₃ + 3CO → 2Fe + 3CO₂." },
          { question: "Gold found uncombined because:", options: ["Too heavy","Very unreactive","High m.p.","Radioactive"], correctIndex: 1, explanation: "Au is at the bottom of reactivity — doesn't react with air or water." }
        ]
      },
      {
        id: "chem-organic-reactions", subjectId: "chemistry",
        title: "Organic Chemistry: Alkanes, Alkenes & Polymers",
        summary: "Hydrocarbons, functional groups, addition and substitution reactions.",
        readXP: 10,
        contentMarkdown: `## Alkanes, Alkenes & Polymers\n\n### 1. Homologous Series\n\n**Alkanes** — saturated, general formula CₙH₂ₙ₊₂\n\n**Alkenes** — unsaturated (one C=C), general formula CₙH₂ₙ\n\n> **Key point:** Unsaturated compounds decolourise bromine water; saturated do not.\n\n### 2. Alkane Reactions\n\n**Complete combustion:** CH₄ + 2O₂ → CO₂ + 2H₂O\n\n**Free radical substitution** (UV light): CH₄ + Cl₂ → CH₃Cl + HCl\n\n### 3. Alkene Reactions\n\n**Hydrogenation:** C₂H₄ + H₂ → C₂H₆ (Ni, 150°C)\n\n**Hydration:** C₂H₄ + H₂O → C₂H₅OH (H₃PO₄, 300°C)\n\n**Addition polymerisation:** n(CH₂=CH₂) → (–CH₂–CH₂–)ₙ\n\n### 4. Common Polymers\n\n| Monomer | Polymer | Use |\n|---------|---------|-----|\n| Ethene | Poly(ethene) | Plastic bags |\n| Chloroethene | PVC | Pipes |\n| Tetrafluoroethene | PTFE | Non-stick pans |`,
        mcqs: [
          { question: "General formula for alkenes?", options: ["CₙH₂ₙ₊₂","CₙH₂ₙ","CₙH₂ₙ₋₂","CₙHₙ"], correctIndex: 1, explanation: "One C=C double bond gives CₙH₂ₙ." },
          { question: "How to distinguish alkene from alkane in lab?", options: ["Litmus test","Add bromine water — alkene decolourises","Burn — alkenes brighter","Dissolve in water"], correctIndex: 1, explanation: "Alkenes undergo addition with Br₂, decolourising orange bromine water." },
          { question: "Ethene → polyethene by:", options: ["Substitution","Elimination","Addition polymerisation","Condensation"], correctIndex: 2, explanation: "C=C double bonds open to form the polymer chain." },
          { question: "Catalyst for alkene hydrogenation?", options: ["Iron","Nickel","Platinum","V₂O₅"], correctIndex: 1, explanation: "Ni at ~150°C catalyses H₂ addition across C=C." },
          { question: "Complete combustion always gives:", options: ["CO + H₂O","CO₂ + H₂O","C + H₂O","CO₂ + H₂"], correctIndex: 1, explanation: "Excess oxygen → complete combustion → CO₂ + H₂O." }
        ]
      },
      {
        id: "chem-stoichiometry", subjectId: "chemistry",
        title: "Stoichiometry & Mole Calculations",
        summary: "The mole, empirical formulas, molar volume and percentage yield.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Stoichiometry\n\n### 1. The Mole\n\n$$ n = \\frac{m}{M_r} $$\n\n1 mole contains 6.02 × 10²³ particles (Avogadro's number).\n\n### 2. Molar Volume of Gas (STP)\n\n$$ n = \\frac{V}{22.4} \\quad (\\text{dm}^3) $$\n\n### 3. Empirical Formula Example\n\n40% C, 6.7% H, 53.3% O:\n\nC: 40/12 = 3.33; H: 6.7/1 = 6.7; O: 53.3/16 = 3.33\n\nRatio = 1:2:1 → **CH₂O**\n\n### 4. Percentage Yield\n\n$$ \\%\\;\\text{yield} = \\frac{\\text{actual}}{\\text{theoretical}} \\times 100\\% $$\n\nAlways < 100% due to incomplete reactions, side reactions, transfer losses.`,
        mcqs: [
          { question: "Moles in 44 g CO₂ (M = 44)?", options: ["0.5","1","2","44"], correctIndex: 1, explanation: "n = 44/44 = 1 mol." },
          { question: "Avogadro's number ≈ ?", options: ["6.02×10²³","3.14×10²³","6.02×10¹²","9.8×10²³"], correctIndex: 0, explanation: "Nₐ = 6.02 × 10²³ particles per mole." },
          { question: "Volume of 2 mol gas at STP?", options: ["11.2 dm³","22.4 dm³","44.8 dm³","2 dm³"], correctIndex: 2, explanation: "2 × 22.4 = 44.8 dm³." },
          { question: "Actual yield 15 g, theoretical 20 g. % yield?", options: ["133%","75%","25%","300%"], correctIndex: 1, explanation: "(15/20) × 100 = 75%." },
          { question: "Compound: 75% C, 25% H. Empirical formula?", options: ["CH","CH₂","CH₃","CH₄"], correctIndex: 2, explanation: "C: 75/12=6.25; H: 25/1=25; ratio 1:4 → CH₄. Wait — 25/6.25 = 4. Empirical formula CH₄." }
        ]
      },
    ]
  },
  // ── O-LEVEL: MATHEMATICS ────────────────────────────────
  {
    id: "mathematics", name: "Mathematics", code: "4028", level: "o", themeColor: "#0D7A6E",
    vibeText: "The universal language of numbers, patterns, and logic.",
    topics: [
      {
        id: "math-coordinate", subjectId: "mathematics",
        title: "Coordinate Geometry: Lines & Planes",
        summary: "Gradients, midpoints, distances and equations of straight lines.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Coordinate Geometry\n\n### 1. Straight Line Equation\n\n$$ y = mx + c $$\n\nm = gradient, c = y-intercept.\n\n> **Key point:** Perpendicular lines: m₁ × m₂ = −1.\n\n### 2. Distance Formula\n\n$$ d = \\sqrt{(x_2-x_1)^2+(y_2-y_1)^2} $$\n\n### 3. Midpoint Formula\n\n$$ M = \\left(\\frac{x_1+x_2}{2},\\;\\frac{y_1+y_2}{2}\\right) $$\n\n**Worked Example:** Distance A(1,2) to B(4,6):\n\n$$ d = \\sqrt{9+16} = 5 $$`,
        mcqs: [
          { question: "'m' in y = mx + c represents:", options: ["y-intercept","x-intercept","Gradient","Distance"], correctIndex: 2, explanation: "m is the gradient (slope) of the line." },
          { question: "Gradient perpendicular to m = 3?", options: ["3","−3","1/3","−1/3"], correctIndex: 3, explanation: "m₁×m₂ = −1 → m₂ = −1/3." },
          { question: "Midpoint of (2,4) and (6,8)?", options: ["(4,6)","(4,4)","(3,5)","(8,12)"], correctIndex: 0, explanation: "M = ((2+6)/2,(4+8)/2) = (4,6)." },
          { question: "Distance between (0,0) and (3,4)?", options: ["5","7","12","6"], correctIndex: 0, explanation: "√(9+16) = 5 — classic 3-4-5 triangle." },
          { question: "y-intercept of y = 2x − 7?", options: ["2","7","−7","−2"], correctIndex: 2, explanation: "c = −7 in y = mx + c." }
        ],
        essayPrompt: "Explain real-world applications of coordinate geometry in urban planning.",
        essayRubric: ["Mentions map grids/GPS","Refers to distance/midpoint concepts","Includes local example (Harare CBD road layout)"]
      },
      {
        id: "math-quadratic", subjectId: "mathematics",
        title: "Quadratic Equations",
        summary: "Factorisation, completing the square, quadratic formula and the discriminant.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Quadratic Equations\n\n### 1. Standard Form\n\n$$ ax^2 + bx + c = 0 $$\n\n### 2. Three Methods\n\n**Factorisation:** x² − 5x + 6 = (x−2)(x−3) = 0\n\n**Quadratic Formula (always works):**\n$$ x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a} $$\n\n### 3. Discriminant Δ = b² − 4ac\n\n| Δ | Roots |\n|---|-------|\n| > 0 | 2 real distinct |\n| = 0 | 1 repeated |\n| < 0 | No real roots |\n\n**Worked Example:** 2x² + 3x − 2 = 0\n\n$$ x = \\frac{-3 \\pm 5}{4} \\Rightarrow x = \\tfrac{1}{2}\\;\\text{or}\\;x=-2 $$`,
        mcqs: [
          { question: "Discriminant of x² − 4x + 4 = 0?", options: ["0","8","−8","16"], correctIndex: 0, explanation: "Δ = 16 − 16 = 0 → one repeated root." },
          { question: "Roots of x² − 5x + 6 = 0?", options: ["1,6","2,3","−2,−3","5,1"], correctIndex: 1, explanation: "(x−2)(x−3) = 0 → x = 2 or 3." },
          { question: "Δ < 0 means:", options: ["Two real roots","One repeated root","No real roots","Infinite roots"], correctIndex: 2, explanation: "Negative discriminant → imaginary roots → no real solutions." },
          { question: "Sum of roots of ax² + bx + c = 0?", options: ["c/a","b/a","−b/a","−c/a"], correctIndex: 2, explanation: "Vieta's formulas: sum = −b/a." },
          { question: "Roots of x² + 2x − 3 = 0?", options: ["1,−3","−1,3","3,−3","1,3"], correctIndex: 0, explanation: "x = (−2 ± √16)/2 = (−2 ± 4)/2 → x = 1 or x = −3." }
        ]
      },
      {
        id: "math-matrices", subjectId: "mathematics",
        title: "Matrices: Operations & Transformations",
        summary: "Determinants, inverses and geometric transformation matrices.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Matrices\n\n### 1. Determinant\n\n$$ \\det\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix} = ad - bc $$\n\n> **Key point:** det = 0 → singular matrix (no inverse).\n\n### 2. Inverse\n\n$$ A^{-1} = \\frac{1}{ad-bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix} $$\n\n### 3. Transformation Matrices\n\n| Transformation | Matrix |\n|---------------|--------|\n| Reflection in x-axis | [[1,0],[0,−1]] |\n| Reflection in y-axis | [[−1,0],[0,1]] |\n| Rotation 90° CCW | [[0,−1],[1,0]] |\n| Enlargement scale k | [[k,0],[0,k]] |`,
        mcqs: [
          { question: "det[[3,1],[2,4]] = ?", options: ["10","14","8","12"], correctIndex: 0, explanation: "3×4 − 1×2 = 12 − 2 = 10." },
          { question: "A matrix with det = 0 is called:", options: ["Identity","Singular","Diagonal","Symmetric"], correctIndex: 1, explanation: "Singular matrices have no inverse." },
          { question: "Reflection in y-axis matrix?", options: ["[[1,0],[0,1]]","[[−1,0],[0,1]]","[[1,0],[0,−1]]","[[0,1],[1,0]]"], correctIndex: 1, explanation: "Negates x-coordinate: [[−1,0],[0,1]]." },
          { question: "90° clockwise rotation matrix?", options: ["[[0,−1],[1,0]]","[[0,1],[−1,0]]","[[−1,0],[0,−1]]","[[1,0],[0,1]]"], correctIndex: 1, explanation: "90° CW: [[0,1],[−1,0]]." },
          { question: "[[2,0],[0,2]] represents:", options: ["Rotation","Reflection","Enlargement scale 2","Shear"], correctIndex: 2, explanation: "k×Identity = enlargement by factor k." }
        ]
      },
      {
        id: "math-trigonometry", subjectId: "mathematics",
        title: "Trigonometry: Ratios, Sine & Cosine Rules",
        summary: "SOHCAHTOA, sine rule, cosine rule and triangle area.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Trigonometry\n\n### 1. Basic Ratios (SOHCAHTOA)\n\n$$ \\sin\\theta=\\frac{opp}{hyp},\\quad\\cos\\theta=\\frac{adj}{hyp},\\quad\\tan\\theta=\\frac{opp}{adj} $$\n\n### 2. Sine Rule\n\n$$ \\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} $$\n\n### 3. Cosine Rule\n\n$$ a^2 = b^2 + c^2 - 2bc\\cos A $$\n\n### 4. Area of Triangle\n\n$$ \\text{Area} = \\tfrac{1}{2}ab\\sin C $$\n\n**Worked Example:** a=7, b=5, C=60°. Find c.\n\n$$ c^2 = 49+25-35 = 39 \\Rightarrow c \\approx 6.24 $$`,
        mcqs: [
          { question: "sin 30° = ?", options: ["√3/2","1/2","1/√2","1"], correctIndex: 1, explanation: "sin 30° = 0.5 — standard exact value." },
          { question: "Rule to use when given two sides and included angle?", options: ["Sine rule","Pythagoras","Cosine rule","SOHCAHTOA"], correctIndex: 2, explanation: "Cosine rule applies to SAS (two sides and included angle)." },
          { question: "Area of triangle: a=6, b=8, C=90°?", options: ["48","24","14","12"], correctIndex: 1, explanation: "½ × 6 × 8 × sin90° = ½ × 48 × 1 = 24." },
          { question: "cos 60° = ?", options: ["√3/2","1/2","1","0"], correctIndex: 1, explanation: "cos 60° = 0.5." },
          { question: "If sin θ = 0.6, cos θ = ? (using identity)", options: ["0.4","0.64","0.8","0.36"], correctIndex: 2, explanation: "cos²θ = 1 − 0.36 = 0.64 → cosθ = 0.8." }
        ]
      },
      {
        id: "math-probability", subjectId: "mathematics",
        title: "Statistics & Probability",
        summary: "Probability laws, tree diagrams, mean, median, mode and standard deviation.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Probability & Statistics\n\n### 1. Basic Probability\n\n$$ P(A) = \\frac{\\text{favourable outcomes}}{\\text{total outcomes}} $$\n\n### 2. Combined Events\n\n**Mutually exclusive:** P(A or B) = P(A) + P(B)\n\n**Independent:** P(A and B) = P(A) × P(B)\n\n### 3. Central Tendency\n\n**Mean** = Σx / n\n\n**Median** = middle value when sorted\n\n**Mode** = most frequent value\n\n### 4. Standard Deviation\n\n$$ \\sigma = \\sqrt{\\frac{\\sum(x-\\bar{x})^2}{n}} $$\n\nSmall σ → data clustered; large σ → data spread.`,
        mcqs: [
          { question: "P(rolling 6 on fair die)?", options: ["1/6","1/3","1/2","1"], correctIndex: 0, explanation: "1 favourable out of 6 equally likely outcomes." },
          { question: "P(A and B), P(A)=0.4, P(B)=0.5, independent?", options: ["0.9","0.2","0.1","0.45"], correctIndex: 1, explanation: "Independent: P(A∩B) = 0.4 × 0.5 = 0.2." },
          { question: "Mean of {2,4,6,8,10}?", options: ["5","6","7","8"], correctIndex: 1, explanation: "Sum = 30, n = 5, mean = 6." },
          { question: "Median of {3,1,7,4,2}?", options: ["3","4","7","1"], correctIndex: 0, explanation: "Sorted: {1,2,3,4,7} — middle = 3." },
          { question: "P(A)=0.3, P(B)=0.4, mutually exclusive. P(A or B)?", options: ["0.12","0.7","0.1","1.0"], correctIndex: 1, explanation: "Mutually exclusive: P(A∪B) = 0.3 + 0.4 = 0.7." }
        ]
      },
      {
        id: "math-sets", subjectId: "mathematics",
        title: "Sets, Venn Diagrams & Laws of Indices",
        summary: "Set notation, Venn diagrams, number types and index laws.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Sets & Indices\n\n### 1. Set Notation\n\n$A \\cup B$ = union; $A \\cap B$ = intersection; $A'$ = complement\n\n$$ n(A \\cup B) = n(A) + n(B) - n(A \\cap B) $$\n\n### 2. Number Types\n\n$\\mathbb{N}$ natural; $\\mathbb{Z}$ integers; $\\mathbb{Q}$ rational; $\\mathbb{R}$ real\n\n### 3. Laws of Indices\n\n$$ a^m \\times a^n = a^{m+n} $$\n$$ (a^m)^n = a^{mn} $$\n$$ a^{-n} = \\frac{1}{a^n} $$\n$$ a^{1/n} = \\sqrt[n]{a} $$`,
        mcqs: [
          { question: "A={1,2,3,4}, B={3,4,5,6}. A∩B = ?", options: ["{1,2,3,4,5,6}","{3,4}","{1,2}","{5,6}"], correctIndex: 1, explanation: "Intersection = elements in BOTH sets = {3,4}." },
          { question: "Simplify 2³ × 2⁴?", options: ["2⁷","2¹²","4⁷","2¹"], correctIndex: 0, explanation: "2³⁺⁴ = 2⁷." },
          { question: "16^(1/2) = ?", options: ["4","8","2","256"], correctIndex: 0, explanation: "16^(1/2) = √16 = 4." },
          { question: "n(A)=10, n(B)=8, n(A∩B)=3. n(A∪B)?", options: ["21","18","15","11"], correctIndex: 2, explanation: "n(A∪B) = 10 + 8 − 3 = 15." },
          { question: "Which is irrational?", options: ["0.5","√9","√7","−3"], correctIndex: 2, explanation: "√7 is non-terminating, non-repeating — irrational." }
        ]
      },
      {
        id: "math-sequences", subjectId: "mathematics",
        title: "Sequences & Series: AP and GP",
        summary: "nth term formulas, sums of arithmetic and geometric progressions.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Sequences & Series\n\n### 1. Arithmetic Progression (AP)\n\nCommon difference d.\n\n$T_n = a + (n-1)d$\n\n$S_n = \\dfrac{n}{2}[2a + (n-1)d]$\n\n### 2. Geometric Progression (GP)\n\nCommon ratio r.\n\n$T_n = ar^{n-1}$\n\n$S_n = \\dfrac{a(1-r^n)}{1-r}$\n\n**Worked Example:** AP: 3, 7, 11, 15 … (a=3, d=4)\n\n$T_{10} = 3 + 9(4) = 39$\n\n$S_{10} = 5[6+36] = 210$`,
        mcqs: [
          { question: "5th term of AP: 2,5,8,11…?", options: ["13","14","15","17"], correctIndex: 1, explanation: "T₅ = 2 + 4(3) = 14." },
          { question: "Common ratio of GP: 3,6,12,24?", options: ["2","3","4","6"], correctIndex: 0, explanation: "r = 6/3 = 2." },
          { question: "Sum of 1+3+5+7+9?", options: ["15","20","25","30"], correctIndex: 2, explanation: "S₅ = 5/2 × [2+4×2] = 5/2 × 10 = 25." },
          { question: "nth term of 4,7,10,13…?", options: ["3n+1","4n","n+3","2n+2"], correctIndex: 0, explanation: "a=4, d=3. Tₙ = 4+(n−1)(3) = 3n+1." },
          { question: "3rd term of GP: 2,6,18,54?", options: ["18","12","36","54"], correctIndex: 0, explanation: "T₃ = 2×3² = 18." }
        ]
      },
      {
        id: "math-vectors", subjectId: "mathematics",
        title: "Vectors & Vector Geometry",
        summary: "Vector addition, scalar multiplication, magnitude and geometric proofs.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Vectors\n\n### 1. Definition\n\nVectors have magnitude AND direction (scalars have only magnitude).\n\nColumn notation: $\\mathbf{v} = \\begin{pmatrix}x\\\\y\\end{pmatrix}$\n\n### 2. Operations\n\n$|\\mathbf{v}| = \\sqrt{x^2+y^2}$\n\nIf $\\vec{AB} = k\\vec{CD}$, then AB ∥ CD.\n\n### 3. Midpoint\n\n$\\vec{OM} = \\tfrac{1}{2}(\\mathbf{a}+\\mathbf{b})$ (M midpoint of AB)\n\n**Collinear** points: one vector is a scalar multiple of another AND they share a point.`,
        mcqs: [
          { question: "Magnitude of (3,4)?", options: ["7","5","12","25"], correctIndex: 1, explanation: "√(9+16) = 5." },
          { question: "p=(2,1), q=(5,4). p+q?", options: ["(7,5)","(3,3)","(10,4)","(2,4)"], correctIndex: 0, explanation: "(2+5, 1+4) = (7,5)." },
          { question: "If AB = 3CD, then:", options: ["AB ⊥ CD","AB ∥ CD","AB = CD","Cannot determine"], correctIndex: 1, explanation: "Scalar multiple → parallel." },
          { question: "Vector from A(1,2) to B(4,6)?", options: ["(5,8)","(3,4)","(−3,−4)","(4,6)"], correctIndex: 1, explanation: "AB = B − A = (3,4)." },
          { question: "OA=a, OB=3a. O, A, B are:", options: ["Form a triangle","Collinear","OA⊥OB","Cannot determine"], correctIndex: 1, explanation: "OB = 3OA → same line through O → collinear." }
        ]
      },
      {
        id: "math-calculus-intro", subjectId: "mathematics",
        title: "Introduction to Calculus: Differentiation",
        summary: "Power rule, stationary points and applications of differentiation.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Calculus: Differentiation\n\n### 1. Power Rule\n\n$$ \\frac{d}{dx}(x^n) = nx^{n-1} $$\n\nExamples: d/dx(x³) = 3x²; d/dx(7) = 0.\n\n### 2. Stationary Points\n\nWhere dy/dx = 0.\n\n- d²y/dx² > 0 → **minimum**\n- d²y/dx² < 0 → **maximum**\n\n**Worked Example:** y = x³ − 3x² + 2\n\n$\\frac{dy}{dx} = 3x^2-6x = 3x(x-2) = 0 \\Rightarrow x=0\\;(\\text{max}),\\;x=2\\;(\\text{min})$`,
        mcqs: [
          { question: "dy/dx of y = x⁴?", options: ["4x³","4x⁵","x³","4x"], correctIndex: 0, explanation: "Power rule: 4x³." },
          { question: "Gradient of y = 3x² − 2x at x = 2?", options: ["10","8","6","12"], correctIndex: 0, explanation: "dy/dx = 6x−2. At x=2: 10." },
          { question: "At a maximum, d²y/dx² is:", options: ["Positive","Zero","Negative","Undefined"], correctIndex: 2, explanation: "Negative second derivative = concave down = maximum." },
          { question: "Stationary points occur when:", options: ["y=0","dy/dx=0","d²y/dx²=0","x=0"], correctIndex: 1, explanation: "Zero gradient = stationary point." },
          { question: "Differentiate y = 5 (constant).", options: ["5","0","5x","1"], correctIndex: 1, explanation: "Constant has zero gradient." }
        ]
      },
      {
        id: "math-mensuration", subjectId: "mathematics",
        title: "Mensuration: Areas, Volumes & Circle Theorems",
        summary: "Areas and volumes of 3D shapes, arc length, sector area and circle theorems.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Mensuration\n\n### 1. Key Formulas\n\n| Shape | Area | Volume |\n|-------|------|--------|\n| Cylinder | 2πr(r+h) | πr²h |\n| Sphere | 4πr² | 4/3 πr³ |\n| Cone | πr(r+l) | 1/3 πr²h |\n\n### 2. Arc Length & Sector Area\n\n$$ \\text{Arc length} = \\frac{\\theta}{360} \\times 2\\pi r $$\n\n$$ \\text{Sector area} = \\frac{\\theta}{360} \\times \\pi r^2 $$\n\n### 3. Key Circle Theorems\n\n- Angle at centre = 2 × angle at circumference (same arc)\n- Angles in same segment are equal\n- Opposite angles in cyclic quadrilateral sum to 180°\n- Tangent ⊥ radius at point of contact\n- Angles in a semicircle = 90°`,
        mcqs: [
          { question: "Volume of cylinder r=3, h=5?", options: ["45π","30π","15π","90π"], correctIndex: 0, explanation: "V = πr²h = π(9)(5) = 45π." },
          { question: "Sector area with r=6, θ=60°?", options: ["6π","3π","2π","12π"], correctIndex: 0, explanation: "60/360 × π × 36 = 1/6 × 36π = 6π." },
          { question: "Volume of sphere r=3?", options: ["4π","12π","36π","9π"], correctIndex: 2, explanation: "V = 4/3 π(27) = 36π." },
          { question: "Angle in semicircle is:", options: ["45°","90°","180°","60°"], correctIndex: 1, explanation: "Angles in a semicircle always equal 90°." },
          { question: "Opposite angles of cyclic quadrilateral sum to:", options: ["90°","180°","360°","270°"], correctIndex: 1, explanation: "Opposite angles in a cyclic quadrilateral are supplementary (sum = 180°)." }
        ]
      },
    ]
  },
  // ── O-LEVEL: PHYSICS ────────────────────────────────────
  {
    id: "physics", name: "Physics", code: "5054", level: "o", themeColor: "#1A56DB",
    vibeText: "Understanding forces, energy, and the laws of the universe.",
    topics: [
      {
        id: "phys-circuits", subjectId: "physics",
        title: "Electrical Circuits & Ohm's Law",
        summary: "Ohm's law, series and parallel circuits, ammeter and voltmeter placement.",
        readXP: 10, hasThreeDModel: "voltmeter-circuit",
        contentMarkdown: `## Electrical Circuits\n\n### 1. Ohm's Law\n\n$$ V = IR $$\n\nV = voltage (V), I = current (A), R = resistance (Ω). Valid at constant temperature.\n\n### 2. Series Circuits\n\nSame I throughout; V adds up; R_total = R₁ + R₂.\n\n### 3. Parallel Circuits\n\nSame V across branches; I adds up; 1/R_total = 1/R₁ + 1/R₂.\n\n> **Key point:** Adding resistors in parallel REDUCES total resistance.\n\n### 4. Meter Placement\n\n- **Ammeter** — in **series** (measures current through)\n- **Voltmeter** — in **parallel** (measures voltage across)`,
        mcqs: [
          { question: "Current through 10Ω at 5V?", options: ["2A","0.5A","50A","15A"], correctIndex: 1, explanation: "I = V/R = 5/10 = 0.5 A." },
          { question: "Two 4Ω resistors in series. Total R?", options: ["2Ω","4Ω","8Ω","16Ω"], correctIndex: 2, explanation: "R_total = 4+4 = 8Ω." },
          { question: "Two 6Ω resistors in parallel. Total R?", options: ["12Ω","6Ω","3Ω","1Ω"], correctIndex: 2, explanation: "1/R = 1/6+1/6 = 1/3 → R = 3Ω." },
          { question: "Voltmeter must be connected:", options: ["In series","In parallel","Before ammeter","Between earth and component"], correctIndex: 1, explanation: "High-resistance voltmeter must be in parallel to not affect the circuit." },
          { question: "Quantity same throughout a series circuit?", options: ["Voltage","Resistance","Power","Current"], correctIndex: 3, explanation: "In series, same current flows through every component." }
        ]
      },
      {
        id: "phys-waves", subjectId: "physics",
        title: "Waves & the Electromagnetic Spectrum",
        summary: "Wave properties, the wave equation and the EM spectrum.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Waves\n\n### 1. Wave Properties\n\n- **Transverse** — oscillation ⊥ travel direction (light, water)\n- **Longitudinal** — oscillation ∥ travel direction (sound)\n\nKey quantities: amplitude A, wavelength λ, frequency f, period T = 1/f.\n\n### 2. Wave Equation\n\n$$ v = f\\lambda $$\n\n### 3. Electromagnetic Spectrum\n\nRadio → Microwave → Infrared → **Visible** → UV → X-ray → Gamma\n\n> **Key point:** All EM waves travel at c = 3×10⁸ m/s in vacuum.\n\n| Wave | Key use |\n|------|---------|\n| Microwave | Satellite comms |\n| Infrared | TV remotes |\n| UV | Sterilisation |\n| X-ray | Medical imaging |\n| Gamma | Radiotherapy |`,
        mcqs: [
          { question: "v if f=50 Hz, λ=4 m?", options: ["12.5","54","200","0.08"], correctIndex: 2, explanation: "v = fλ = 50×4 = 200 m/s." },
          { question: "Sound is a __ wave?", options: ["Transverse","Longitudinal","Electromagnetic","Stationary"], correctIndex: 1, explanation: "Sound particles vibrate parallel to wave direction." },
          { question: "Shortest wavelength in EM spectrum?", options: ["Radio","Infrared","Visible","Gamma"], correctIndex: 3, explanation: "Gamma rays have the shortest λ and highest energy." },
          { question: "Speed of all EM waves in vacuum?", options: ["3×10⁸ km/s","3×10⁸ m/s","330 m/s","1.5×10⁸ m/s"], correctIndex: 1, explanation: "c = 3×10⁸ m/s for all EM radiation in vacuum." },
          { question: "Period of a 25 Hz wave?", options: ["25s","0.04s","4s","0.4s"], correctIndex: 1, explanation: "T = 1/f = 1/25 = 0.04 s." }
        ]
      },
      {
        id: "phys-newton", subjectId: "physics",
        title: "Forces & Newton's Laws of Motion",
        summary: "Newton's three laws, weight, friction and conservation of momentum.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Newton's Laws\n\n### 1. First Law (Inertia)\n\nAn object stays at rest or uniform motion unless a resultant force acts on it.\n\n### 2. Second Law\n\n$$ F = ma $$\n\n### 3. Third Law\n\nEvery action has an equal and opposite reaction (on different objects).\n\n### 4. Weight vs Mass\n\n$$ W = mg \\quad (g = 10\\;\\text{m/s}^2) $$\n\n### 5. Momentum\n\n$$ p = mv \\qquad \\text{Impulse} = F\\Delta t = \\Delta p $$\n\nMomentum is conserved in a closed system.`,
        mcqs: [
          { question: "5 kg box, a = 3 m/s². Force?", options: ["1.67N","15N","8N","0.6N"], correctIndex: 1, explanation: "F = 5×3 = 15N." },
          { question: "Weight of 70 kg on Earth (g=10)?", options: ["70N","700N","7N","70kg"], correctIndex: 1, explanation: "W = 70×10 = 700N." },
          { question: "Rocket moves because of Newton's:", options: ["1st","2nd","3rd","Conservation of energy"], correctIndex: 2, explanation: "Gas expelled backward (action) → forward thrust (reaction)." },
          { question: "Constant velocity means:", options: ["Zero mass","Increasing force","Zero resultant force","Increasing momentum"], correctIndex: 2, explanation: "a = 0 means F_net = 0 (Newton's 1st law)." },
          { question: "Momentum of 2 kg at 5 m/s?", options: ["10 kg m/s","2.5 kg m/s","10N","7 kg m/s"], correctIndex: 0, explanation: "p = mv = 2×5 = 10 kg m/s." }
        ]
      },
      {
        id: "phys-energy", subjectId: "physics",
        title: "Energy, Work & Power",
        summary: "KE, GPE, work done, conservation of energy, power and efficiency.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Energy, Work & Power\n\n### 1. Work Done\n\n$$ W = Fs\\cos\\theta $$\n\n### 2. Energy Forms\n\n$$ E_k = \\tfrac{1}{2}mv^2 \\qquad E_p = mgh $$\n\n### 3. Conservation\n\n$mgh = \\tfrac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2gh}$\n\n### 4. Power & Efficiency\n\n$$ P = \\frac{W}{t} $$\n\n$$ \\text{efficiency} = \\frac{\\text{useful output}}{\\text{total input}} \\times 100\\% $$`,
        mcqs: [
          { question: "KE of 4 kg at 6 m/s?", options: ["24J","48J","72J","144J"], correctIndex: 2, explanation: "½ × 4 × 36 = 72J." },
          { question: "Work lifting 10 kg by 3 m (g=10)?", options: ["13J","30J","300J","3000J"], correctIndex: 2, explanation: "W = mgs = 10×10×3 = 300J." },
          { question: "600W motor for 10s. Energy used?", options: ["60J","610J","6000J","0.06J"], correctIndex: 2, explanation: "W = Pt = 600×10 = 6000J." },
          { question: "Efficiency: 400J input, 200J useful output?", options: ["200%","50%","25%","75%"], correctIndex: 1, explanation: "(200/400) × 100 = 50%." },
          { question: "At highest point of a throw, which is maximum?", options: ["Kinetic","Heat","Gravitational potential","Sound"], correctIndex: 2, explanation: "Max height → v=0 → KE=0 → all energy is GPE." }
        ]
      },
      {
        id: "phys-thermal", subjectId: "physics",
        title: "Thermal Physics: Heat Transfer & Gas Laws",
        summary: "Conduction, convection, radiation, specific heat capacity and the gas laws.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Thermal Physics\n\n### 1. Heat Transfer\n\n- **Conduction** — solids, via particle vibration\n- **Convection** — fluids, density-driven currents\n- **Radiation** — EM waves, works in vacuum\n\n> **Key point:** Only radiation travels through vacuum — how the Sun heats Earth.\n\n### 2. Specific Heat Capacity\n\n$$ Q = mc\\Delta T $$\n\nExample: Heat 2 kg water by 50°C (c=4200):\n$Q = 2×4200×50 = 420\\,000\\;\\text{J}$\n\n### 3. Gas Laws\n\n**Boyle's:** $P_1V_1 = P_2V_2$\n\n**Charles's:** $V_1/T_1 = V_2/T_2$\n\n**Pressure Law:** $P_1/T_1 = P_2/T_2$\n\n(T in Kelvin: K = °C + 273)`,
        mcqs: [
          { question: "Heat transfer in vacuum?", options: ["Conduction","Convection","Radiation","All three"], correctIndex: 2, explanation: "Only radiation (EM waves) can travel through a vacuum." },
          { question: "Q to heat 1 kg water by 10°C (c=4200)?", options: ["420J","4200J","42000J","42J"], correctIndex: 2, explanation: "Q = 1×4200×10 = 42,000J." },
          { question: "Gas: 2 atm, 3L. Compressed to 1L (const T). New P?", options: ["1 atm","4 atm","6 atm","2 atm"], correctIndex: 2, explanation: "P₁V₁ = P₂V₂ → 2×3 = P₂×1 → P₂ = 6 atm." },
          { question: "27°C in Kelvin?", options: ["300K","27K","246K","373K"], correctIndex: 0, explanation: "K = 27+273 = 300K." },
          { question: "Best emitter of radiation?", options: ["Shiny white","Smooth silver","Dull black","Polished gold"], correctIndex: 2, explanation: "Dark, matte surfaces are best emitters and absorbers of IR." }
        ]
      },
      {
        id: "phys-nuclear", subjectId: "physics",
        title: "Nuclear Physics: Radioactivity & Half-Life",
        summary: "Alpha, beta, gamma radiation, nuclear equations and half-life calculations.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Nuclear Physics\n\n### 1. Radiation Types\n\n| Type | Charge | Penetration |\n|------|--------|-------------|\n| Alpha (⁴₂α) | +2 | Paper |\n| Beta (⁰₋₁β) | −1 | 3 mm Al |\n| Gamma (γ) | 0 | Thick Pb |\n\n> **Key point:** All three are ionising.\n\n### 2. Nuclear Equations\n\nAlpha: A decreases by 4, Z by 2.\n\n$^{226}_{88}Ra \\rightarrow\\; ^{222}_{86}Rn + ^{4}_{2}\\alpha$\n\n### 3. Half-Life\n\n$$ N = N_0 \\times \\left(\\frac{1}{2}\\right)^n $$\n\nAfter 3 half-lives: N = N₀/8.`,
        mcqs: [
          { question: "Greatest penetrating radiation?", options: ["Alpha","Beta","Gamma","All equal"], correctIndex: 2, explanation: "Gamma rays require thick lead to significantly reduce them." },
          { question: "Alpha particle charge?", options: ["−1","0","+1","+2"], correctIndex: 3, explanation: "Alpha = ⁴₂He = 2 protons → charge +2." },
          { question: "After 2 half-lives, fraction remaining?", options: ["1/2","1/4","1/8","3/4"], correctIndex: 1, explanation: "Each half-life halves it: 1/2 → 1/4." },
          { question: "Alpha decay: atomic number decreases by?", options: ["1","2","4","0"], correctIndex: 1, explanation: "Alpha removes 2 protons → Z decreases by 2." },
          { question: "Beta decay: a neutron converts to:", options: ["2 neutrons","Proton + electron","Proton + alpha","Gamma"], correctIndex: 1, explanation: "n → p + e⁻ (beta particle)." }
        ]
      },
      {
        id: "phys-motion", subjectId: "physics",
        title: "Linear Motion: SUVAT & Kinematics",
        summary: "Speed, velocity, acceleration, motion graphs and SUVAT equations.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Linear Motion\n\n### 1. SUVAT Variables\n\ns = displacement; u = initial velocity; v = final velocity; a = acceleration; t = time\n\n$$ v = u + at $$\n$$ s = ut + \\tfrac{1}{2}at^2 $$\n$$ v^2 = u^2 + 2as $$\n\n### 2. Motion Graphs\n\n**d-t graph:** gradient = speed\n\n**v-t graph:** gradient = acceleration; area = distance\n\n**Worked Example:** Car from rest, a=3 m/s², t=4s:\n\n$v = 12\\;\\text{m/s} \\qquad s = \\tfrac{1}{2}(3)(16) = 24\\;\\text{m}$`,
        mcqs: [
          { question: "Car: rest, a=5 m/s², t=3s. Final velocity?", options: ["15m/s","8m/s","0.6m/s","45m/s"], correctIndex: 0, explanation: "v = 0+5(3) = 15 m/s." },
          { question: "Area under v-t graph represents:", options: ["Acceleration","Speed","Distance","Force"], correctIndex: 2, explanation: "Area = displacement (distance if one direction)." },
          { question: "s when u=0, a=10, t=3?", options: ["45m","30m","15m","90m"], correctIndex: 0, explanation: "s = ½(10)(9) = 45 m." },
          { question: "Gradient of d-t graph gives:", options: ["Acceleration","Force","Speed","Momentum"], correctIndex: 2, explanation: "Speed = distance/time = gradient of d-t graph." },
          { question: "Free fall: speed after 2s (g=10)?", options: ["20m/s","10m/s","5m/s","40m/s"], correctIndex: 0, explanation: "v = 0+10(2) = 20 m/s." }
        ]
      },
      {
        id: "phys-pressure", subjectId: "physics",
        title: "Pressure: Fluids & Hydraulics",
        summary: "Pressure calculations, Pascal's law and atmospheric pressure.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Pressure\n\n### 1. Formula\n\n$$ P = \\frac{F}{A} \\quad\\text{(Pa)} $$\n\n### 2. Fluid Pressure\n\n$$ P = \\rho g h $$\n\nExample: 5m depth in water (ρ=1000, g=10):\n$P = 1000×10×5 = 50\\,000\\;\\text{Pa}$\n\n### 3. Pascal's Principle\n\n$$ \\frac{F_1}{A_1} = \\frac{F_2}{A_2} $$\n\nPressure in enclosed fluid transmitted equally — used in hydraulic brakes and lifts.`,
        mcqs: [
          { question: "Force 200N on area 0.5m². Pressure?", options: ["100Pa","400Pa","0.0025Pa","1000Pa"], correctIndex: 1, explanation: "P = 200/0.5 = 400 Pa." },
          { question: "Pressure increases with depth because:", options: ["Water molecules grow","More water above = greater weight","Temperature increases","Density decreases"], correctIndex: 1, explanation: "Greater depth → more water above → P = ρgh increases." },
          { question: "Hydraulic: small A=0.01m², large A=0.1m². Force 100N on small piston →", options: ["10N","100N","1000N","1N"], correctIndex: 2, explanation: "P = 100/0.01 = 10000Pa. F₂ = 10000×0.1 = 1000N." },
          { question: "At altitude, atmospheric pressure:", options: ["Increases","Same","Decreases","Doubles"], correctIndex: 2, explanation: "Less air above at altitude → lower atmospheric pressure." },
          { question: "Pressure at 10m depth (ρ=1000, g=10)?", options: ["1000Pa","10000Pa","100000Pa","1Pa"], correctIndex: 2, explanation: "P = 1000×10×10 = 100,000Pa." }
        ]
      },
      {
        id: "phys-magnetism", subjectId: "physics",
        title: "Magnetism & Electromagnetism",
        summary: "Magnetic fields, motor effect, Fleming's rules and electromagnetic induction.",
        readXP: 10,
        contentMarkdown: `## Magnetism & Electromagnetism\n\n### 1. Magnetic Fields\n\nField lines: North → South outside magnet. A solenoid carrying current acts like a bar magnet.\n\n> **Key point:** Right-hand rule — wrap fingers in current direction; thumb points to North.\n\n### 2. Motor Effect\n\n$$ F = BIL $$\n\n**Fleming's Left-Hand Rule:** Thumb = Force, Index = Field, Middle = Current.\n\n### 3. DC Motor\n\nCurrent-carrying coil rotates in a magnetic field. Split-ring commutator reverses current every half-turn to maintain continuous rotation.\n\n### 4. Electromagnetic Induction\n\nMoving conductor in a field induces EMF. Lenz's law: induced current opposes the change causing it.`,
        mcqs: [
          { question: "Field lines outside a magnet go:", options: ["S to N","N to S","No fixed direction","Always circular"], correctIndex: 1, explanation: "Convention: field lines go from North to South outside the magnet." },
          { question: "More turns in solenoid:", options: ["Weaker field","No effect","Stronger field","Reverses polarity"], correctIndex: 2, explanation: "More loops = more field contributions = stronger field." },
          { question: "Fleming's Left-Hand Rule gives direction of:", options: ["Induced EMF","Solenoid field","Force on current in field","Generator current"], correctIndex: 2, explanation: "Left-Hand Rule (FBI) → force on current-carrying conductor in a field." },
          { question: "What keeps a DC motor rotating one way?", options: ["Armature","Brushes","Split-ring commutator","Solenoid"], correctIndex: 2, explanation: "Commutator reverses current every half-turn." },
          { question: "Lenz's Law: induced current:", options: ["Aids the change","Always clockwise","Opposes the change","Has no direction"], correctIndex: 2, explanation: "Lenz's Law = conservation of energy: induced current opposes the change." }
        ]
      },
      {
        id: "phys-light", subjectId: "physics",
        title: "Light: Reflection, Refraction & Lenses",
        summary: "Laws of reflection, Snell's law, total internal reflection and lens equations.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Light\n\n### 1. Reflection\n\nAngle of incidence = angle of reflection (measured from normal).\n\n### 2. Refraction & Snell's Law\n\n$$ n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2 $$\n\nLight bends toward the normal entering a denser medium.\n\n### 3. Total Internal Reflection (TIR)\n\nOccurs when light travels from dense → less dense medium at an angle ≥ the critical angle.\n\n$$ \\sin C = \\frac{1}{n} $$\n\nApplications: optical fibres (communications), endoscopes.\n\n### 4. Lenses\n\n**Converging (convex):** focuses parallel rays to a focal point. Used in magnifying glasses, cameras, eyes.\n\n**Lens equation:**\n\n$$ \\frac{1}{v} - \\frac{1}{u} = \\frac{1}{f} $$`,
        mcqs: [
          { question: "Law of reflection states:", options: ["i > r always","i = r","i + r = 90°","n₁sinθ₁ = n₂sinθ₂"], correctIndex: 1, explanation: "Angle of incidence = angle of reflection (measured from normal)." },
          { question: "Light entering a denser medium:", options: ["Speeds up","Bends away from normal","Bends toward normal","Reflects completely"], correctIndex: 2, explanation: "In denser medium, light slows and bends toward the normal." },
          { question: "Critical angle C for glass (n=1.5)?", options: ["42°","30°","60°","45°"], correctIndex: 0, explanation: "sin C = 1/1.5 = 0.667 → C ≈ 42°." },
          { question: "Optical fibres use:", options: ["Refraction","Diffraction","Total internal reflection","Absorption"], correctIndex: 2, explanation: "TIR traps light inside the fibre so it travels long distances with minimal loss." },
          { question: "A converging lens is also called:", options: ["Concave","Plane","Convex","Diverging"], correctIndex: 2, explanation: "Converging = convex lens — thicker in the middle, focuses parallel rays." }
        ]
      },
    ]
  },

  // ── O-LEVEL: BIOLOGY ────────────────────────────────────
  {
    id: "biology", name: "Biology", code: "5090", level: "o", themeColor: "#1A7A3C",
    vibeText: "The study of life, natural systems, and ecosystems.",
    topics: [
      {
        id: "bio-cells", subjectId: "biology",
        title: "Cell Structure & Organelles",
        summary: "Animal vs plant cells, organelle functions and levels of organisation.",
        readXP: 10, hasThreeDModel: "dna-helix",
        contentMarkdown: `## Cell Structure\n\n### 1. Animal vs Plant Cells\n\n| Feature | Animal | Plant |\n|---------|--------|-------|\n| Cell wall | ✗ | ✓ (cellulose) |\n| Chloroplasts | ✗ | ✓ |\n| Large vacuole | ✗ | ✓ |\n| Mitochondria | ✓ | ✓ |\n\n> **Key point:** Plant cells have cell wall, chloroplasts and large vacuole — absent in animal cells.\n\n### 2. Key Organelles\n\n- **Nucleus** — controls cell, contains DNA\n- **Mitochondria** — aerobic respiration (ATP)\n- **Ribosomes** — protein synthesis\n- **Chloroplasts** — photosynthesis\n- **Cell membrane** — selectively permeable\n\n### 3. Levels of Organisation\n\nCell → Tissue → Organ → Organ system → Organism`,
        mcqs: [
          { question: "Site of aerobic respiration?", options: ["Nucleus","Ribosome","Mitochondria","Chloroplast"], correctIndex: 2, explanation: "Mitochondria produce ATP via aerobic respiration." },
          { question: "Present in plant cells but NOT animal cells?", options: ["Cell membrane","Nucleus","Mitochondria","Cell wall"], correctIndex: 3, explanation: "Cellulose cell wall is unique to plant cells." },
          { question: "Which organelle contains DNA?", options: ["Mitochondria only","Nucleus","Ribosome","Both nucleus and mitochondria"], correctIndex: 3, explanation: "Both nucleus (chromosomal DNA) and mitochondria (small circular DNA) contain DNA." },
          { question: "Ribosomes are the site of:", options: ["Photosynthesis","Respiration","Protein synthesis","DNA replication"], correctIndex: 2, explanation: "Ribosomes translate mRNA into proteins." },
          { question: "Cell membrane is 'selectively permeable' because:", options: ["Made of protein","Only water passes","Controls which molecules pass","Can stretch"], correctIndex: 2, explanation: "Only molecules of correct size/charge can pass through." }
        ]
      },
      {
        id: "bio-photosynthesis", subjectId: "biology",
        title: "Photosynthesis & Limiting Factors",
        summary: "The equation, light/dark reactions and factors that limit the rate.",
        readXP: 10,
        contentMarkdown: `## Photosynthesis\n\n### 1. Overall Equation\n\n$$ 6CO_2 + 6H_2O \\xrightarrow{\\text{light + chlorophyll}} C_6H_{12}O_6 + 6O_2 $$\n\n### 2. Where It Happens\n\nIn **chloroplasts**: light reactions in thylakoid membranes; Calvin cycle in stroma.\n\nChlorophyll absorbs **red and blue** light, reflects green.\n\n### 3. Limiting Factors\n\n- **Light intensity** — linear increase at low light\n- **CO₂ concentration** — more CO₂, faster rate\n- **Temperature** — optimum ~25–30°C; enzymes denature above ~40°C\n\n### 4. Testing for Starch\n\nBoil in water → boil in ethanol → rinse → add iodine. **Blue-black** = starch present.`,
        mcqs: [
          { question: "Gas released by photosynthesis?", options: ["CO₂","O₂","N₂","H₂"], correctIndex: 1, explanation: "O₂ is released when water is split in the light reactions." },
          { question: "Chlorophyll absorbs which light?", options: ["Green","Yellow","Red and blue","White only"], correctIndex: 2, explanation: "Red and blue absorbed for photosynthesis; green reflected (why leaves look green)." },
          { question: "Limiting factor on a cold, bright day?", options: ["Light","Temperature","CO₂","Wind"], correctIndex: 1, explanation: "Cold slows enzyme reactions in the Calvin cycle." },
          { question: "Iodine turns blue-black in presence of?", options: ["Glucose","Starch","Protein","Chlorophyll"], correctIndex: 1, explanation: "Iodine solution tests for starch." },
          { question: "Light reactions occur in:", options: ["Stroma","Cell membrane","Thylakoid membranes","Cytoplasm"], correctIndex: 2, explanation: "Chlorophyll in thylakoid membranes absorbs light for the light-dependent reactions." }
        ]
      },
      {
        id: "bio-respiration", subjectId: "biology",
        title: "Aerobic & Anaerobic Respiration",
        summary: "Energy release from glucose, aerobic vs anaerobic and the role of ATP.",
        readXP: 10,
        contentMarkdown: `## Respiration\n\n> **Key point:** Respiration ≠ breathing. Respiration is the controlled release of energy from glucose in cells.\n\n### 1. Aerobic Respiration\n\n$$ C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + \\text{ATP} $$\n\n~36-38 ATP per glucose. Occurs in cytoplasm (glycolysis) + mitochondria.\n\n### 2. Anaerobic Respiration\n\n**In animals:** Glucose → Lactic acid (+ 2 ATP)\n\n**In yeast:** Glucose → Ethanol + CO₂ (+ 2 ATP)\n\n> Basis of bread-making and brewing.\n\n### 3. Comparison\n\n| | Aerobic | Anaerobic |\n|--|---------|----------|\n| O₂ needed? | Yes | No |\n| ATP yield | ~38 | 2 |\n| Products | CO₂ + H₂O | Lactic acid or ethanol + CO₂ |`,
        mcqs: [
          { question: "Anaerobic respiration product in animals?", options: ["Ethanol","Lactic acid","Glucose","CO₂ only"], correctIndex: 1, explanation: "Lactic acid builds up in muscles during anaerobic exercise." },
          { question: "After glycolysis, aerobic respiration continues in:", options: ["Nucleus","Chloroplast","Mitochondria","Cell wall"], correctIndex: 2, explanation: "Krebs cycle and ETC occur in mitochondria." },
          { question: "Which produces more ATP per glucose?", options: ["Anaerobic","Aerobic","Both equal","Fermentation"], correctIndex: 1, explanation: "Aerobic: ~38 ATP; anaerobic: only 2 ATP." },
          { question: "Yeast anaerobic products?", options: ["Lactic acid + O₂","CO₂ + water","Ethanol + CO₂","Glucose + ATP"], correctIndex: 2, explanation: "Yeast fermentation → ethanol + CO₂ — used in baking and brewing." },
          { question: "Respiration differs from breathing in that it:", options: ["Happens in lungs only","Is movement of air","Releases energy in cells","Needs a diaphragm"], correctIndex: 2, explanation: "Respiration = cellular energy release. Breathing = ventilation." }
        ]
      },
      {
        id: "bio-genetics", subjectId: "biology",
        title: "Genetics & Inheritance",
        summary: "Alleles, Mendelian crosses, Punnett squares and DNA structure.",
        readXP: 10,
        contentMarkdown: `## Genetics\n\n### 1. Key Terms\n\n**Gene** — DNA section coding for a protein.\n\n**Allele** — a version of a gene (e.g. T = tall, t = short).\n\n**Dominant** — expressed with one copy (capital letter).\n\n**Recessive** — only expressed with two copies (lowercase).\n\n**Homozygous** — TT or tt; **Heterozygous** — Tt.\n\n### 2. Monohybrid Cross: Tt × Tt\n\n| | T | t |\n|--|---|---|\n| T | TT | Tt |\n| t | Tt | tt |\n\nRatio: 3 tall : 1 short\n\n### 3. DNA Structure\n\nDouble helix of nucleotides. Base pairs: **A–T; G–C**.`,
        mcqs: [
          { question: "Tt × tt offspring ratio?", options: ["All tall","3:1","1 tall:1 short","All short"], correctIndex: 2, explanation: "Tt × tt → 50% Tt (tall), 50% tt (short) = 1:1." },
          { question: "RR genotype is:", options: ["Heterozygous recessive","Homozygous dominant","Heterozygous dominant","Homozygous recessive"], correctIndex: 1, explanation: "Two identical dominant alleles = homozygous dominant." },
          { question: "In DNA, A pairs with:", options: ["G","C","T","Another A"], correctIndex: 2, explanation: "A–T and G–C are the complementary base pairs." },
          { question: "Pp × Pp: % homozygous recessive?", options: ["25%","50%","75%","0%"], correctIndex: 0, explanation: "PP:Pp:Pp:pp = 1:2:1 → 25% pp." },
          { question: "mRNA carries genetic code from nucleus to:", options: ["DNA","tRNA","Ribosome","ATP"], correctIndex: 2, explanation: "mRNA carries codons from nucleus to ribosomes for protein synthesis." }
        ]
      },
      {
        id: "bio-enzymes", subjectId: "biology",
        title: "Enzymes: Structure, Function & Factors",
        summary: "Lock-and-key model, denaturation, effects of pH and temperature.",
        readXP: 10,
        contentMarkdown: `## Enzymes\n\n### 1. Properties\n\nEnzymes are **biological protein catalysts** — specific, reusable, sensitive to conditions.\n\n**Active site** — specific shape complementary to substrate.\n\n### 2. Lock-and-Key Model\n\nSubstrate (key) fits active site (lock) → enzyme-substrate complex → products released.\n\n> **Key point:** If enzyme shape changes (denaturation), substrate can no longer fit.\n\n### 3. Factors\n\n**Temperature:** Rate ↑ to optimum (~37°C for human enzymes). Above optimum → denaturation.\n\n**pH:** Each enzyme has an optimum pH. Deviation distorts active site.\n- Pepsin: optimum pH 2\n- Amylase: optimum pH 7\n\n**Substrate concentration:** Rate ↑ until all active sites are occupied (Vmax).`,
        mcqs: [
          { question: "Enzymes are made of:", options: ["Carbohydrates","Lipids","Proteins","Nucleic acids"], correctIndex: 2, explanation: "Enzymes are globular proteins — their 3D shape creates the active site." },
          { question: "Above optimum temperature, enzyme activity:", options: ["Increases","Stays constant","Decreases — denaturation","Increases slowly"], correctIndex: 2, explanation: "High heat breaks bonds maintaining enzyme shape → denaturation." },
          { question: "Substrate binds to enzyme's:", options: ["Cell wall","Active site","Nucleus","Ribosome"], correctIndex: 1, explanation: "The active site has a specific shape complementary to the substrate." },
          { question: "Salivary amylase at pH 2 (stomach):", options: ["Works faster","Works same","Denatures","Changes substrate"], correctIndex: 2, explanation: "Wrong pH distorts active site ionic bonds → denaturation." },
          { question: "When all active sites are occupied, adding more substrate:", options: ["Increases rate","Decreases rate","Has no effect on rate","Denatures enzyme"], correctIndex: 2, explanation: "At saturation (Vmax), rate cannot increase further." }
        ]
      },
      {
        id: "bio-transport", subjectId: "biology",
        title: "Transport in Organisms: The Circulatory System",
        summary: "Double circulation, heart structure, blood components and vessels.",
        readXP: 10,
        contentMarkdown: `## Circulatory System\n\n### 1. Double Circulation\n\n- **Pulmonary:** Right heart → lungs → left heart\n- **Systemic:** Left heart → body → right heart\n\n> **Key point:** Left ventricle has thicker wall — pumps blood to the entire body.\n\n### 2. Blood Components\n\n| Component | Function |\n|-----------|----------|\n| RBCs | Carry O₂ (haemoglobin) |\n| WBCs | Immune defence |\n| Platelets | Clotting |\n| Plasma | Transports glucose, CO₂, hormones, urea |\n\n### 3. Blood Vessels\n\n| Vessel | Key feature |\n|--------|-------------|\n| Artery | Thick wall, narrow lumen, away from heart |\n| Vein | Valves, wide lumen, toward heart |\n| Capillary | 1-cell thick — exchange with tissues |`,
        mcqs: [
          { question: "Vessel carrying oxygenated blood from lungs to heart?", options: ["Pulmonary artery","Aorta","Pulmonary vein","Vena cava"], correctIndex: 2, explanation: "Pulmonary vein: lungs → left atrium (oxygenated)." },
          { question: "Left ventricle has thicker wall because:", options: ["Holds more blood","Pumps to whole body (higher pressure)","Receives from lungs","Contains valves"], correctIndex: 1, explanation: "Systemic circuit requires more force than pulmonary circuit." },
          { question: "Blood component responsible for clotting?", options: ["RBCs","Plasma","Platelets","Lymphocytes"], correctIndex: 2, explanation: "Platelets release clotting factors forming fibrin mesh." },
          { question: "Valves in veins prevent:", options: ["Blood entering","Backflow","High pressure","Oxygen loss"], correctIndex: 1, explanation: "Pocket valves open toward heart; close to prevent backflow." },
          { question: "Capillaries allow exchange because they are:", options: ["Large","Very long","One cell thick","Under high pressure"], correctIndex: 2, explanation: "One-cell thickness gives short diffusion distance for gas/nutrient exchange." }
        ]
      },
      {
        id: "bio-nutrition", subjectId: "biology",
        title: "Nutrition & Digestion",
        summary: "Balanced diet, digestive system, enzymes, absorption and food tests.",
        readXP: 10,
        contentMarkdown: `## Nutrition & Digestion\n\n### 1. Balanced Diet\n\nCarbohydrates (energy), Proteins (growth/repair), Fats (energy storage), Vitamins, Minerals, Water, Fibre.\n\n### 2. Digestive System\n\n**Mouth** — amylase starts starch digestion.\n\n**Stomach** — pepsin (protease) at pH 2.\n\n**Small intestine** — lipase, protease, amylase (pancreas); villi absorb nutrients.\n\n**Large intestine** — water reabsorbed.\n\n### 3. Villi Adaptations\n\n- Large surface area (villi + microvilli)\n- One-cell thick epithelium\n- Rich blood supply\n- Lacteals for fatty acids\n\n### 4. Food Tests\n\n| Test | Reagent | Positive |\n|------|---------|----------|\n| Starch | Iodine | Blue-black |\n| Glucose | Benedict's | Brick-red |\n| Protein | Biuret | Purple |\n| Fat | Sudan III | Red |\n`,
        mcqs: [
          { question: "Enzyme in saliva?", options: ["Pepsin","Lipase","Amylase","Trypsin"], correctIndex: 2, explanation: "Salivary amylase breaks starch into maltose." },
          { question: "Benedict's reagent tests for?", options: ["Starch","Reducing sugars","Proteins","Fats"], correctIndex: 1, explanation: "Brick-red precipitate with glucose (reducing sugar)." },
          { question: "Villi increase efficiency of absorption by:", options: ["Producing enzymes","Increasing surface area","Containing amylase","Pumping nutrients"], correctIndex: 1, explanation: "Greater surface area = more absorption per unit time." },
          { question: "Proteins are digested by:", options: ["Amylase","Lipase","Protease","Bile"], correctIndex: 2, explanation: "Proteases (pepsin, trypsin) break peptide bonds in proteins." },
          { question: "Water mainly reabsorbed in?", options: ["Stomach","Small intestine","Large intestine","Oesophagus"], correctIndex: 2, explanation: "The large intestine (colon) reabsorbs most water." }
        ]
      },
      {
        id: "bio-ecology", subjectId: "biology",
        title: "Ecology: Ecosystems, Food Webs & Conservation",
        summary: "Energy flow, food chains, pyramids of biomass and conservation.",
        readXP: 10,
        contentMarkdown: `## Ecology\n\n### 1. Key Terms\n\n**Population** — one species in an area.\n\n**Community** — all species in an area.\n\n**Ecosystem** — community + abiotic environment.\n\n### 2. Food Chains\n\n$$ \\text{Grass} \\rightarrow \\text{Locust} \\rightarrow \\text{Guinea fowl} \\rightarrow \\text{Hawk} $$\n\n> **Key point:** Only ~10% of energy passes to the next trophic level — rest lost as heat and respiration.\n\n### 3. Carbon Cycle\n\n- Photosynthesis removes CO₂\n- Respiration + combustion release CO₂\n- Decomposition releases CO₂ and nutrients\n\n### 4. Conservation\n\n**In-situ** — in natural habitat (Hwange, Gonarezhou NPs)\n\n**Ex-situ** — outside habitat (zoos, seed banks)`,
        mcqs: [
          { question: "Energy source for almost all food chains?", options: ["Decomposers","Sun","Water","Minerals"], correctIndex: 1, explanation: "Solar energy captured by producers (plants) via photosynthesis." },
          { question: "% energy transferred between trophic levels?", options: ["90%","50%","10%","100%"], correctIndex: 2, explanation: "~10% passes on; 90% lost as heat, respiration and waste." },
          { question: "Hwange National Park is example of:", options: ["Ex-situ","In-situ","Seed bank","Captive breeding"], correctIndex: 1, explanation: "In-situ conservation = natural habitat protection." },
          { question: "Process removing CO₂ from atmosphere?", options: ["Respiration","Combustion","Photosynthesis","Decomposition"], correctIndex: 2, explanation: "Photosynthesis fixes CO₂ into glucose." },
          { question: "Animal eating plants, eaten by hawk, is a:", options: ["Producer","Decomposer","Primary consumer","Tertiary consumer"], correctIndex: 2, explanation: "Eats producers → primary consumer (herbivore)." }
        ]
      },
      {
        id: "bio-disease", subjectId: "biology",
        title: "Disease, Immunity & Health",
        summary: "Pathogens, the immune system, vaccination and communicable diseases.",
        readXP: 10,
        contentMarkdown: `## Disease & Immunity\n\n### 1. Types of Pathogens\n\n| Pathogen | Example disease |\n|----------|-----------------|\n| Bacteria | Cholera, TB |\n| Virus | HIV/AIDS, measles |\n| Fungus | Tinea (ringworm) |\n| Protozoan | Malaria |\n\n### 2. The Immune System\n\n**Phagocytes** — engulf and destroy pathogens (phagocytosis).\n\n**Lymphocytes** — produce **antibodies** specific to antigen on pathogen.\n\n> **Key point:** Memory cells remain after infection — faster response on re-exposure (immunity).\n\n### 3. Vaccination\n\nIntroduces antigens (weakened/dead pathogen) → stimulates antibody production → memory cells formed → protection without full disease.\n\n### 4. Transmission of Malaria\n\nMalaria caused by *Plasmodium* (protozoan); transmitted by female *Anopheles* mosquito bite.\n\nControl: mosquito nets, insecticides, draining stagnant water.`,
        mcqs: [
          { question: "Which pathogen causes malaria?", options: ["Bacterium","Virus","Protozoan","Fungus"], correctIndex: 2, explanation: "Malaria is caused by Plasmodium — a protozoan parasite." },
          { question: "Antibodies are produced by:", options: ["Phagocytes","Red blood cells","Lymphocytes","Platelets"], correctIndex: 2, explanation: "B-lymphocytes produce specific antibodies against antigens." },
          { question: "How do phagocytes destroy pathogens?", options: ["Produce antibodies","Engulf and digest (phagocytosis)","Release hormones","Produce memory cells"], correctIndex: 1, explanation: "Phagocytes engulf pathogens and digest them with enzymes." },
          { question: "Vaccination works by:", options: ["Killing all bacteria","Introducing antibiotics","Stimulating memory cell production","Raising body temperature"], correctIndex: 2, explanation: "Vaccine antigens trigger immune response → memory cells → faster future response." },
          { question: "Malaria is transmitted by:", options: ["Contaminated water","Airborne droplets","Female Anopheles mosquito","Direct contact"], correctIndex: 2, explanation: "Female Anopheles mosquitoes inject Plasmodium sporozoites when feeding." }
        ]
      },
      {
        id: "bio-diffusion-osmosis", subjectId: "biology",
        title: "Diffusion, Osmosis & Active Transport",
        summary: "Movement of substances across membranes: diffusion, osmosis and active transport.",
        readXP: 10,
        contentMarkdown: `## Diffusion, Osmosis & Active Transport\n\n### 1. Diffusion\n\nNet movement of particles from **high to low concentration** (down a gradient) — passive, no energy needed.\n\nFactors increasing diffusion rate:\n- ↑ concentration gradient\n- ↑ temperature\n- ↑ surface area\n- ↓ diffusion distance\n\n### 2. Osmosis\n\nDiffusion of **water molecules** through a **selectively permeable membrane** from high water potential (dilute) to low water potential (concentrated).\n\n> **Key point:** Plant cells become **turgid** in dilute solution (water enters) and **plasmolysed** in concentrated solution (water leaves).\n\n### 3. Active Transport\n\nMovement of molecules **against** the concentration gradient — requires **energy (ATP)** and carrier proteins.\n\nExamples: root hair cells absorbing mineral ions; gut absorbing glucose.`,
        mcqs: [
          { question: "Diffusion moves particles:", options: ["Against concentration gradient","From low to high concentration","From high to low concentration","Requiring ATP"], correctIndex: 2, explanation: "Diffusion is passive — particles move down their concentration gradient." },
          { question: "Osmosis specifically involves movement of:", options: ["All molecules","Water molecules","Glucose molecules","Ion molecules"], correctIndex: 1, explanation: "Osmosis = movement of water through a selectively permeable membrane." },
          { question: "Plant cell in dilute solution becomes:", options: ["Plasmolysed","Turgid","Flaccid","Lysed"], correctIndex: 1, explanation: "Water enters by osmosis → cell contents expand → turgid (firm)." },
          { question: "Active transport differs from diffusion because it:", options: ["Moves particles down gradient","Needs no energy","Moves particles against gradient using ATP","Occurs only in animals"], correctIndex: 2, explanation: "Active transport requires ATP and carrier proteins to move against the gradient." },
          { question: "Increasing surface area of a membrane:", options: ["Decreases diffusion rate","Has no effect","Increases diffusion rate","Requires more ATP"], correctIndex: 2, explanation: "More surface = more membrane available for particle crossing = faster diffusion." }
        ]
      },
    ]
  },
  // ── O-LEVEL: ENGLISH, LITERATURE, HERITAGE ──────────────
  {
    id: "english-language", name: "English Language", code: "1123", level: "o", themeColor: "#3730A3",
    vibeText: "Mastering communication, comprehension, and expression.",
    topics: [
      placeholder("eng-comp", "english-language", "Comprehension & Summary"),
      placeholder("eng-essay", "english-language", "Narrative & Descriptive Writing"),
      placeholder("eng-argumentative", "english-language", "Argumentative & Discursive Writing"),
      placeholder("eng-directed", "english-language", "Directed Writing: Letters, Reports & Speeches"),
    ]
  },
  {
    id: "english-lit", name: "English Literature", code: "2059", level: "o", themeColor: "#5B21B6",
    vibeText: "Analyzing prose, poetry, and drama.",
    topics: [
      {
        id: "lit-fading-sun", subjectId: "english-lit",
        title: "The Fading Sun — David Mungoshi",
        summary: "Motifs of motherhood, symbolism and narrative in Mungoshi's novel.",
        readXP: 10,
        contentMarkdown: `## The Fading Sun\n\n### 1. Context\n\nDavid Mungoshi's novel explores an elderly woman reflecting on life, illness and mortality.\n\n> **Key point:** Mungoshi uses fragmented narrative to mirror the protagonist's deteriorating memory.\n\n### 2. Theme: Resilience\n\nEndurance through poverty and loss — shown through quiet perseverance, not dramatic action.\n\n### 3. Symbolism\n\nThe **fading sun** = end of day AND metaphorically end of life — central motif throughout.`,
        mcqs: [],
        essayPrompt: "Discuss how Mungoshi portrays the theme of resilience in The Fading Sun.",
        essayRubric: ["Analyses narrative structure","Cites specific motifs (motherhood, sun)","Discusses the protagonist's mindset"]
      },
      placeholder("lit-poetry", "english-lit", "Poetry Analysis"),
      placeholder("lit-drama", "english-lit", "Drama: Structure & Stagecraft"),
    ]
  },
  {
    id: "heritage-studies", name: "Heritage Studies", code: "1020", level: "o", themeColor: "#065F46",
    vibeText: "Understanding our history, identity, and the Zimbabwean nation.",
    topics: [
      placeholder("heritage-societies", "heritage-studies", "Development of Zimbabwean Societies"),
      placeholder("heritage-struggle", "heritage-studies", "The Armed Struggle & Independence"),
      placeholder("heritage-identity", "heritage-studies", "National Identity & Governance"),
      placeholder("heritage-economic", "heritage-studies", "Economic Development in Zimbabwe"),
    ]
  },

  // ── REMAINING O-LEVEL (placeholder) ─────────────────────
  { id: "combined-science", name: "Combined Science", code: "5129", level: "o", themeColor: "#059669", vibeText: "General science fundamentals.", topics: [placeholder("comb-1","combined-science","Matter & Particles"), placeholder("comb-2","combined-science","Forces & Energy")] },
  { id: "history", name: "History", code: "2158", level: "o", themeColor: "#92400E", vibeText: "The study of our past events.", topics: [placeholder("hist-1","history","Colonial Period"), placeholder("hist-2","history","Cold War & Decolonisation")] },
  { id: "geography", name: "Geography", code: "2217", level: "o", themeColor: "#0F766E", vibeText: "Physical environments and human habitats.", topics: [placeholder("geo-1","geography","Plate Tectonics & Landforms"), placeholder("geo-2","geography","Population & Settlement")] },
  { id: "accounts", name: "Accounts", code: "7110", level: "o", themeColor: "#A16207", vibeText: "Principles of financial tracking.", topics: [placeholder("acc-1","accounts","Double-Entry Bookkeeping"), placeholder("acc-2","accounts","Final Accounts")] },
  { id: "commerce", name: "Commerce", code: "7100", level: "o", themeColor: "#B45309", vibeText: "Trade and business operations.", topics: [placeholder("com-1","commerce","Trade & Exchange"), placeholder("com-2","commerce","Banking & Finance")] },
  { id: "business-enterprise", name: "Business Enterprise Skills", code: "7115", level: "o", themeColor: "#1A6B5A", vibeText: "Entrepreneurship fundamentals.", topics: [placeholder("be-1","business-enterprise","Business Idea Generation"), placeholder("be-2","business-enterprise","Marketing & Sales")] },
  { id: "economics", name: "Economics", code: "2281", level: "o", themeColor: "#6D28D9", vibeText: "Markets, production, and wealth distribution.", topics: [placeholder("eco-1","economics","Supply & Demand"), placeholder("eco-2","economics","Macroeconomics: Inflation & GDP")] },
  { id: "agriculture", name: "Agriculture", code: "5038", level: "o", themeColor: "#166534", vibeText: "Farming and food production.", topics: [placeholder("agr-1","agriculture","Soil Science & Fertility"), placeholder("agr-2","agriculture","Crop Production")] },
  { id: "computer-science", name: "Computer Science", code: "2210", level: "o", themeColor: "#0C4A6E", vibeText: "Computing, programming, and algorithms.", topics: [placeholder("compsc-1","computer-science","Data Representation & Logic Gates"), placeholder("compsc-2","computer-science","Algorithms & Pseudocode")] },
  { id: "chishona", name: "ChiShona", code: "6021", level: "o", themeColor: "#7C2D12", vibeText: "Lulwimi rwedu.", topics: [placeholder("shn-1","chishona","Tsinhanhema"), placeholder("shn-2","chishona","Mazwi Nezipikirwa")] },
  { id: "ndebele", name: "Ndebele", code: "6022", level: "o", themeColor: "#6B21A8", vibeText: "Izilimi zethu.", topics: [placeholder("ndb-1","ndebele","Izingqikithi"), placeholder("ndb-2","ndebele","Izaga")] },
  { id: "family-religious", name: "Family & Religious Studies", code: "2048", level: "o", themeColor: "#78350F", vibeText: "Beliefs and society.", topics: [placeholder("frs-1","family-religious","Marriage & Family"), placeholder("frs-2","family-religious","Religious Beliefs in Zimbabwe")] },
  { id: "home-management", name: "Home Management & Design", code: "6065", level: "o", themeColor: "#BE185D", vibeText: "Life and home skills.", topics: [placeholder("hm-1","home-management","Nutrition & Meal Planning"), placeholder("hm-2","home-management","Home Design & Textiles")] },

  // ── A-LEVEL: PURE MATHEMATICS (10 full topics) ───────────
  {
    id: "a-pure-maths", name: "Pure Mathematics", code: "6042", level: "a", themeColor: "#0B6B8A",
    vibeText: "Advanced algebra, calculus and trigonometry.",
    topics: [
      {
        id: "pm-differentiation", subjectId: "a-pure-maths",
        title: "Differentiation: Rules & Applications",
        summary: "Power, chain, product and quotient rules with applications.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Differentiation\n\n### 1. Core Rules\n\n**Power:** $\\frac{d}{dx}(x^n) = nx^{n-1}$\n\n**Chain:** $\\frac{dy}{dx} = \\frac{dy}{du}\\cdot\\frac{du}{dx}$\n\n**Product:** $\\frac{d}{dx}(uv) = uv' + vu'$\n\n**Quotient:** $\\frac{d}{dx}\\left(\\frac{u}{v}\\right) = \\frac{vu'-uv'}{v^2}$\n\n### 2. Standard Derivatives\n\n$\\frac{d}{dx}(\\sin x) = \\cos x \\qquad \\frac{d}{dx}(e^x) = e^x \\qquad \\frac{d}{dx}(\\ln x) = \\frac{1}{x}$\n\n### 3. Applications\n\nGradient of tangent at x=a: $m = f'(a)$\n\nGradient of normal: $-1/f'(a)$`,
        mcqs: [
          { question: "Differentiate y = 5x³ − 3x² + 7", options: ["15x²−6x","15x²−3x+7","15x²−6x+1","5x²−6x"], correctIndex: 0, explanation: "dy/dx = 15x² − 6x." },
          { question: "dy/dx of y = sin(3x)?", options: ["3sin(3x)","cos(3x)","3cos(3x)","−3cos(3x)"], correctIndex: 2, explanation: "Chain rule: cos(3x)×3 = 3cos(3x)." },
          { question: "d/dx(eˣ) = ?", options: ["xeˣ⁻¹","eˣ","e","0"], correctIndex: 1, explanation: "eˣ is its own derivative." },
          { question: "Gradient of y = x² + 2x at x = 3?", options: ["11","8","6","15"], correctIndex: 1, explanation: "dy/dx = 2x+2. At x=3: 8." },
          { question: "Stationary x-values of y = x³ − 3x?", options: ["x=0 only","x=±1","x=3","x=±√3"], correctIndex: 1, explanation: "dy/dx = 3x²−3 = 0 → x = ±1." }
        ]
      },
      {
        id: "pm-integration-parts", subjectId: "a-pure-maths",
        title: "Integration by Parts",
        summary: "IBP formula, LIATE rule and worked examples.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Integration by Parts\n\n$$ \\int u\\,dv = uv - \\int v\\,du $$\n\n**LIATE rule:** choose u as: Logarithm → Inverse trig → Algebraic → Trig → Exponential\n\n**Example 1:** $\\int xe^x dx$\n\nu=x, dv=eˣdx → $= xe^x - e^x + C = e^x(x-1)+C$\n\n**Example 2:** $\\int x\\ln x\\,dx$\n\nu=ln x, dv=x dx → $= \\frac{x^2}{2}\\ln x - \\frac{x^2}{4} + C$`,
        mcqs: [
          { question: "In ∫xeˣdx, which should be u?", options: ["eˣ","x","xeˣ","1"], correctIndex: 1, explanation: "LIATE: Algebraic (x) before Exponential (eˣ)." },
          { question: "∫xeˣdx = ?", options: ["xeˣ+C","eˣ(x−1)+C","x²eˣ+C","eˣ/x+C"], correctIndex: 1, explanation: "IBP: xeˣ − eˣ + C = eˣ(x−1) + C." },
          { question: "IBP is needed for:", options: ["x+3","sin x alone","x·cos x","eˣ alone"], correctIndex: 2, explanation: "IBP is used for products like x·cosx, x·ln x, x²·eˣ." },
          { question: "∫ln x dx = ?", options: ["x ln x+C","x ln x−x+C","1/x+C","x/ln x+C"], correctIndex: 1, explanation: "Let u=ln x, dv=dx: ∫ln x dx = x ln x − x + C." },
          { question: "v when dv/dx = cos x?", options: ["−sin x","sin x","−cos x","cos²x"], correctIndex: 1, explanation: "∫cos x dx = sin x." }
        ]
      },
      {
        id: "pm-binomial", subjectId: "a-pure-maths",
        title: "Binomial Theorem & Expansion",
        summary: "Binomial expansion, Pascal's triangle and specific term selection.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Binomial Theorem\n\n$$ (a+b)^n = \\sum_{r=0}^{n}\\binom{n}{r}a^{n-r}b^r $$\n\n**(r+1)th term:** $T_{r+1} = \\binom{n}{r}a^{n-r}b^r$\n\n**Worked Example:** 3rd term in $(2x+3)^5$:\n\n$T_3 = \\binom{5}{2}(2x)^3(3)^2 = 10\\cdot 8x^3\\cdot 9 = 720x^3$\n\n**Approximation** ($|x|<1$):\n\n$(1+x)^n \\approx 1 + nx + \\frac{n(n-1)}{2!}x^2 + \\ldots$`,
        mcqs: [
          { question: "Coefficient of x² in (1+x)⁵?", options: ["5","10","15","20"], correctIndex: 1, explanation: "C(5,2) = 10." },
          { question: "4th term in (a+b)⁶ (r=3)?", options: ["C(6,3)a³b³","C(6,4)a²b⁴","C(6,3)a³b²","C(6,2)a³b³"], correctIndex: 0, explanation: "T₄: r=3 → C(6,3)a³b³." },
          { question: "C(6,2) = ?", options: ["12","15","30","36"], correctIndex: 1, explanation: "6!/(2!4!) = 15." },
          { question: "(1+x)⁻¹ ≈ ? for small x?", options: ["1+x","1−x","1−x+x²","x−1"], correctIndex: 1, explanation: "Binomial approx: 1−x." },
          { question: "Constant term in (x + 1/x)⁶?", options: ["1","10","20","15"], correctIndex: 2, explanation: "Need x^(6-r) × x^(-r) = x^0: r=3. T₄ = C(6,3) = 20." }
        ]
      },
      {
        id: "pm-trigonometry-a", subjectId: "a-pure-maths",
        title: "Advanced Trigonometry: Identities & Equations",
        summary: "Pythagorean identities, compound angles, double angles and solving equations.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Advanced Trigonometry\n\n### 1. Pythagorean Identities\n\n$\\sin^2\\theta + \\cos^2\\theta = 1$\n\n$1+\\tan^2\\theta = \\sec^2\\theta$\n\n### 2. Compound Angles\n\n$\\sin(A\\pm B) = \\sin A\\cos B \\pm \\cos A\\sin B$\n\n$\\cos(A\\pm B) = \\cos A\\cos B \\mp \\sin A\\sin B$\n\n### 3. Double Angles\n\n$\\sin 2A = 2\\sin A\\cos A$\n\n$\\cos 2A = 1-2\\sin^2 A = 2\\cos^2 A - 1$`,
        mcqs: [
          { question: "sin²θ + cos²θ = ?", options: ["0","2","1","sin 2θ"], correctIndex: 2, explanation: "Fundamental Pythagorean identity = 1." },
          { question: "sin 2A = ?", options: ["2sinA","2sinAcosA","sin²A−cos²A","2sin²A"], correctIndex: 1, explanation: "sin 2A = 2 sin A cos A." },
          { question: "cos(A+B) = ?", options: ["cosAcosB+sinAsinB","cosAcosB−sinAsinB","sinAcosB+cosAsinB","sinAcosB−cosAsinB"], correctIndex: 1, explanation: "cos(A+B) = cosAcosB − sinAsinB." },
          { question: "1 + tan²θ = ?", options: ["sec²θ","cos²θ","csc²θ","1"], correctIndex: 0, explanation: "Divide sin²+cos²=1 by cos²: tan²+1 = sec²." },
          { question: "cos 2θ in terms of sin θ only?", options: ["cos²θ−sin²θ","1−2sin²θ","2cos²θ−1","2sinθcosθ"], correctIndex: 1, explanation: "cos 2θ = 1 − 2sin²θ." }
        ]
      },
      {
        id: "pm-vectors-3d", subjectId: "a-pure-maths",
        title: "Vectors in 3D: Dot Product & Lines",
        summary: "3D vectors, scalar product, angle between vectors and line equations.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## 3D Vectors\n\n### 1. Dot Product\n\n$$ \\mathbf{a}\\cdot\\mathbf{b} = a_1b_1+a_2b_2+a_3b_3 = |\\mathbf{a}||\\mathbf{b}|\\cos\\theta $$\n\n> **Key point:** $\\mathbf{a}\\cdot\\mathbf{b}=0$ → vectors are **perpendicular**.\n\n### 2. Angle Between Vectors\n\n$$ \\cos\\theta = \\frac{\\mathbf{a}\\cdot\\mathbf{b}}{|\\mathbf{a}||\\mathbf{b}|} $$\n\n### 3. Line Equation\n\n$$ \\mathbf{r} = \\mathbf{a} + t\\mathbf{d} $$\n\na = point on line, d = direction vector, t = scalar parameter.`,
        mcqs: [
          { question: "(1,2,3)·(4,5,6) = ?", options: ["15","32","9","12"], correctIndex: 1, explanation: "4+10+18 = 32." },
          { question: "a·b = 0 means:", options: ["Parallel","Perpendicular","Equal","Collinear"], correctIndex: 1, explanation: "cosθ = 0 → θ = 90°." },
          { question: "|{3,4,0}| = ?", options: ["7","5","25","√7"], correctIndex: 1, explanation: "√(9+16+0) = 5." },
          { question: "In r = a + td, t is:", options: ["Direction vector","Scalar parameter","Position vector","Angle"], correctIndex: 1, explanation: "t is a scalar — varying it moves you along the line." },
          { question: "Formula for angle between vectors?", options: ["sinθ=a·b/(|a||b|)","cosθ=a·b/(|a||b|)","tanθ=a×b/(|a||b|)","θ=a·b"], correctIndex: 1, explanation: "cosθ = a·b / (|a||b|)." }
        ]
      },
      {
        id: "pm-complex", subjectId: "a-pure-maths",
        title: "Complex Numbers & the Argand Diagram",
        summary: "Imaginary unit, modulus-argument form and De Moivre's theorem.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Complex Numbers\n\n$i = \\sqrt{-1},\\quad i^2 = -1$\n\n$z = x + iy$ — real part x, imaginary part y.\n\n### 1. Modulus & Argument\n\n$|z| = \\sqrt{x^2+y^2} \\qquad \\arg(z) = \\tan^{-1}(y/x)$\n\n$z = r(\\cos\\theta + i\\sin\\theta) = re^{i\\theta}$\n\n### 2. De Moivre's Theorem\n\n$$ (re^{i\\theta})^n = r^n(\\cos n\\theta + i\\sin n\\theta) $$`,
        mcqs: [
          { question: "i² = ?", options: ["1","−1","i","0"], correctIndex: 1, explanation: "By definition, i² = −1." },
          { question: "|3+4i| = ?", options: ["7","5","12","25"], correctIndex: 1, explanation: "√(9+16) = 5." },
          { question: "Conjugate of 2−3i?", options: ["−2+3i","2+3i","3−2i","2+3"], correctIndex: 1, explanation: "Conjugate negates imaginary part: 2+3i." },
          { question: "(1+i)² = ?", options: ["2i","2","1+2i","−1+2i"], correctIndex: 0, explanation: "1+2i+i² = 1+2i−1 = 2i." },
          { question: "(cosθ + i sinθ)³ = ?", options: ["cos3θ+i sin3θ","3cosθ+3i sinθ","cos³θ+i sin³θ","3(cosθ+i sinθ)"], correctIndex: 0, explanation: "De Moivre's: raise angle by factor n." }
        ]
      },
      {
        id: "pm-series", subjectId: "a-pure-maths",
        title: "Maclaurin & Taylor Series Expansions",
        summary: "Power series of eˣ, sin x, cos x and ln(1+x), and approximations.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Series Expansions\n\n$$ f(x) = f(0) + f'(0)x + \\frac{f''(0)}{2!}x^2 + \\ldots $$\n\n### Standard Series\n\n$e^x = 1+x+\\frac{x^2}{2!}+\\frac{x^3}{3!}+\\ldots$\n\n$\\sin x = x-\\frac{x^3}{3!}+\\frac{x^5}{5!}-\\ldots$\n\n$\\cos x = 1-\\frac{x^2}{2!}+\\frac{x^4}{4!}-\\ldots$\n\n$\\ln(1+x) = x-\\frac{x^2}{2}+\\frac{x^3}{3}-\\ldots\\quad(|x|\\leq 1)$`,
        mcqs: [
          { question: "First 3 terms of eˣ Maclaurin?", options: ["1+x+x²","1+x+x²/2","x+x²/2+x³/6","1+x+2x²"], correctIndex: 1, explanation: "eˣ = 1 + x + x²/2! + ..." },
          { question: "sin x series starts:", options: ["1−x²/2!+…","x+x³/3!+…","x−x³/3!+…","1+x+x³/3!+…"], correctIndex: 2, explanation: "sin x = x − x³/3! + x⁵/5! − … (odd powers)." },
          { question: "ln(1+x) first two terms?", options: ["x+x²/2","x−x²/2","1+x","x−x²"], correctIndex: 1, explanation: "ln(1+x) = x − x²/2 + …" },
          { question: "cos(0) — first term of Maclaurin?", options: ["0","1","x","−1"], correctIndex: 1, explanation: "cos(0) = 1." },
          { question: "ln(1+x) series valid for:", options: ["|x|<2","|x|≤1","x>0 only","All x"], correctIndex: 1, explanation: "Converges only for |x| ≤ 1." }
        ]
      },
      {
        id: "pm-differential-equations", subjectId: "a-pure-maths",
        title: "Differential Equations",
        summary: "Separation of variables and integrating factor for first-order ODEs.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Differential Equations\n\n### 1. Separation of Variables\n\nFor $\\frac{dy}{dx} = f(x)g(y)$:\n\n$\\frac{1}{g(y)}dy = f(x)dx$ then integrate both sides.\n\n**Example:** $\\frac{dy}{dx} = xy$\n\n$\\ln|y| = \\frac{x^2}{2}+C \\Rightarrow y = Ae^{x^2/2}$\n\n### 2. Integrating Factor\n\nFor $\\frac{dy}{dx}+P(x)y = Q(x)$:\n\nMultiply by $\\mu = e^{\\int P\\,dx}$:\n\n$\\frac{d}{dx}(\\mu y) = \\mu Q(x)$`,
        mcqs: [
          { question: "Method for dy/dx = x·y?", options: ["Integrating factor","Separation of variables","Substitution only","Numerical only"], correctIndex: 1, explanation: "Separable: dy/y = x dx." },
          { question: "Solve dy/dx = 2x. General solution?", options: ["y=x²+C","y=2+C","y=x+C","y=2x²+C"], correctIndex: 0, explanation: "∫dy = ∫2x dx → y = x² + C." },
          { question: "Integrating factor for dy/dx + 2y = eˣ?", options: ["e²ˣ","eˣ","e⁻ˣ","2x"], correctIndex: 0, explanation: "P=2, μ = e^∫2dx = e^(2x)." },
          { question: "dy/dx = xy² is:", options: ["Linear first-order","Separable","Second-order","Non-separable"], correctIndex: 1, explanation: "dy/y² = x dx — separable." },
          { question: "General solution of dy/dx = 3y?", options: ["y=3x+C","y=Ce^(3x)","y=3eˣ+C","y=x³+C"], correctIndex: 1, explanation: "dy/y = 3dx → ln|y| = 3x+C → y = Ce^(3x)." }
        ]
      },
      {
        id: "pm-coordinate-a", subjectId: "a-pure-maths",
        title: "Coordinate Geometry: Circles & Conics",
        summary: "Circle equations, tangents, parametric form and introductory conics.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Circles\n\n### 1. Circle Equation\n\nCentre $(a,b)$, radius $r$:\n\n$$ (x-a)^2+(y-b)^2 = r^2 $$\n\n### 2. Tangent\n\nAt point $(x_1,y_1)$, tangent ⊥ radius. Gradient of radius = $\\frac{y_1-b}{x_1-a}$, so tangent gradient = $-\\frac{x_1-a}{y_1-b}$.\n\n### 3. Completing the Square Example\n\nFind centre and radius of $x^2+y^2-6x+4y-3=0$:\n\n$(x-3)^2+(y+2)^2 = 16$\n\nCentre (3,−2), radius 4.`,
        mcqs: [
          { question: "Centre of (x−2)²+(y+3)²=25?", options: ["(2,3)","(−2,3)","(2,−3)","(−2,−3)"], correctIndex: 2, explanation: "(x−a)²+(y−b)²=r² → centre (2,−3)." },
          { question: "Radius of (x−1)²+(y−1)²=9?", options: ["9","3","√3","81"], correctIndex: 1, explanation: "r²=9 → r=3." },
          { question: "Circle through origin, centre (3,4). Radius?", options: ["5","7","25","12"], correctIndex: 0, explanation: "r = √(9+16) = 5." },
          { question: "Tangent to circle at any point is:", options: ["Parallel to radius","Perpendicular to radius","Equal to chord","Through centre"], correctIndex: 1, explanation: "Tangent always ⊥ radius at point of tangency." },
          { question: "x=5cosθ, y=5sinθ represents:", options: ["Parabola","Circle radius 5","Ellipse","Hyperbola"], correctIndex: 1, explanation: "x²+y² = 25cos²θ+25sin²θ = 25." }
        ]
      },
      {
        id: "pm-numerical", subjectId: "a-pure-maths",
        title: "Numerical Methods",
        summary: "Root finding by sign change, Newton-Raphson iteration and the trapezium rule.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Numerical Methods\n\n### 1. Sign Change\n\nIf f(a) and f(b) have opposite signs → root between a and b.\n\n### 2. Newton-Raphson\n\n$$ x_{n+1} = x_n - \\frac{f(x_n)}{f'(x_n)} $$\n\nFast convergence near a root.\n\n### 3. Fixed-Point Iteration\n\nRearrange f(x)=0 as x=g(x). Iterate $x_{n+1}=g(x_n)$. Converges when |g'(x)|<1.\n\n### 4. Trapezium Rule\n\n$$ \\int_a^b f(x)dx \\approx \\frac{h}{2}[y_0+2(y_1+\\ldots+y_{n-1})+y_n] $$`,
        mcqs: [
          { question: "Root between x=1 and x=2 if:", options: ["f(1)=f(2)","f(1) and f(2) have opposite signs","f(1)=0","f(1)·f(2)>0"], correctIndex: 1, explanation: "Sign change theorem." },
          { question: "Newton-Raphson formula?", options: ["xₙ₊₁=xₙ−f/f'","xₙ₊₁=f/f'","xₙ₊₁=xₙ+f","xₙ₊₁=−f/f'"], correctIndex: 0, explanation: "xₙ₊₁ = xₙ − f(xₙ)/f'(xₙ)." },
          { question: "Trapezium rule gives:", options: ["Exact integral","Approximation","Derivative","Root"], correctIndex: 1, explanation: "Numerical approximation to ∫f(x)dx using trapezoids." },
          { question: "Fixed-point converges when:", options: ["|g'|>1","|g'|=1","|g'|<1","g'=0"], correctIndex: 2, explanation: "|g'(x)| < 1 near root → convergence." },
          { question: "More strips in trapezium rule gives:", options: ["Less accuracy","Greater accuracy","No change","Exact result"], correctIndex: 1, explanation: "Smaller h → trapezoids fit curve better → greater accuracy." }
        ]
      },
    ]
  },

  // ── A-LEVEL: STATISTICS ──────────────────────────────────
  {
    id: "a-statistics", name: "Statistics", code: "6046", level: "a", themeColor: "#0D7A6E",
    vibeText: "Data analysis, probability, and distributions.",
    topics: [
      placeholder("stat-probability", "a-statistics", "Probability — Laws & Conditional Probability"),
      {
        id: "stat-crv", subjectId: "a-statistics",
        title: "Continuous Random Variables & E(X)",
        summary: "PDF properties, expected value and variance using calculus.",
        readXP: 10, hasMathEquations: true,
        contentMarkdown: `## Continuous Random Variables\n\n### 1. Valid PDF\n\n$f(x)\\geq 0$ and $\\int_{-\\infty}^{\\infty}f(x)\\,dx = 1$\n\n$P(a\\leq X\\leq b) = \\int_a^b f(x)\\,dx$\n\n### 2. Expected Value\n\n$$ E(X) = \\int_{-\\infty}^{\\infty}x\\cdot f(x)\\,dx $$\n\n### 3. Variance\n\n$$ Var(X) = E(X^2) - [E(X)]^2 $$`,
        mcqs: [
          { question: "∫f(x)dx over domain must equal?", options: ["0","∞","1","f(0)"], correctIndex: 2, explanation: "Total probability = 1." },
          { question: "P(X < k) for CRV?", options: ["f(k)","∫f(x)dx from −∞ to k","kf(k)","f'(k)"], correctIndex: 1, explanation: "CDF: P(X<k) = ∫f(x)dx up to k." },
          { question: "E(X) for CRV is:", options: ["Σx·P(X=x)","∫x·f(x)dx","f'(x)","∫f(x)dx"], correctIndex: 1, explanation: "Continuous analogue of discrete expected value." },
          { question: "Var(X) = E(X²) − [E(X)]² is the:", options: ["Chebyshev's theorem","Computational variance formula","Bayes' theorem","MGF"], correctIndex: 1, explanation: "Computational formula avoids squaring deviations directly." },
          { question: "P(X = exactly 5) for continuous rv?", options: ["f(5)","F(5)","0","0.5"], correctIndex: 2, explanation: "Single point has zero area → probability = 0." }
        ]
      },
      placeholder("stat-hypothesis","a-statistics","Hypothesis Testing"),
      placeholder("stat-distributions","a-statistics","Binomial & Poisson Distributions"),
      placeholder("stat-normal","a-statistics","Normal Distribution & Standardisation"),
    ]
  },

  // ── REMAINING A-LEVEL (placeholder) ─────────────────────
  { id: "a-mechanics", name: "Mechanical Mathematics", code: "6021", level: "a", themeColor: "#1A56DB", vibeText: "Applying mathematics to forces and motion.", topics: [placeholder("mech-forces","a-mechanics","Forces & Equilibrium"), placeholder("mech-kinematics","a-mechanics","Kinematics — SUVAT & Graphs")] },
  { id: "a-further-maths", name: "Additional Mathematics", code: "6002", level: "a", themeColor: "#0E5E7A", vibeText: "The hardest math module at A-Level.", topics: [placeholder("fm-complex","a-further-maths","Complex Numbers & Argand Diagram"), placeholder("fm-matrices","a-further-maths","Matrices — Determinants & Inverses")] },
  { id: "a-chemistry", name: "Chemistry", code: "6031", level: "a", themeColor: "#7C3AED", vibeText: "Advanced reactions and quantum chemistry.", topics: [placeholder("ach-1","a-chemistry","Atomic Structure & Bonding"), placeholder("ach-2","a-chemistry","Kinetics & Equilibrium")] },
  { id: "a-physics", name: "Physics", code: "6032", level: "a", themeColor: "#1A56DB", vibeText: "Deeper dives into modern physics.", topics: [placeholder("aph-1","a-physics","Circular Motion & Gravitation"), placeholder("aph-2","a-physics","Electromagnetism")] },
  { id: "a-biology", name: "Biology", code: "6030", level: "a", themeColor: "#1A7A3C", vibeText: "Advanced cell biology.", topics: [placeholder("abio-1","a-biology","Cell Division & Genetics"), placeholder("abio-2","a-biology","Ecology & Evolution")] },
  { id: "a-economics", name: "Economics", code: "6073", level: "a", themeColor: "#6D28D9", vibeText: "Macro and microeconomic modelling.", topics: [placeholder("aeco-1","a-economics","Microeconomics"), placeholder("aeco-2","a-economics","Macroeconomics")] },
  { id: "a-accounting", name: "Accounting", code: "6001", level: "a", themeColor: "#A16207", vibeText: "Corporate reporting.", topics: [placeholder("aacc-1","a-accounting","Financial Statements"), placeholder("aacc-2","a-accounting","Management Accounting")] },
  { id: "a-business", name: "Business Studies", code: "6025", level: "a", themeColor: "#C2410C", vibeText: "Corporate structure and strategy.", topics: [placeholder("abus-1","a-business","Business Structure"), placeholder("abus-2","a-business","Marketing Strategy")] },
  { id: "a-business-ent", name: "Business Enterprise", code: "6004", level: "a", themeColor: "#B91C1C", vibeText: "Practical business creation.", topics: [placeholder("abe-1","a-business-ent","Entrepreneurship"), placeholder("abe-2","a-business-ent","Business Planning")] },
  { id: "a-history", name: "History", code: "6006", level: "a", themeColor: "#92400E", vibeText: "Critical past events.", topics: [placeholder("ahis-1","a-history","African Nationalism"), placeholder("ahis-2","a-history","Cold War")] },
  { id: "a-geography", name: "Geography", code: "6037", level: "a", themeColor: "#0F766E", vibeText: "Advanced human and physical geography.", topics: [placeholder("ageo-1","a-geography","Geomorphology"), placeholder("ageo-2","a-geography","Development Geography")] },
  // ── A-LEVEL: COMPUTER SCIENCE ──────────────────────────────────
{
  id: "a-computer-science",
  name: "Computer Science",
  code: "6023",
  level: "a",
  themeColor: "#0EA5E9",
  vibeText: "Data representation, floating point arithmetic, and computer architecture.",
  topics: [
    // ── TOPIC 1: Fixed Point Integer Representation ────────────
    {
      id: "acs-fixed-point-int",
      subjectId: "a-computer-science",
      title: "Fixed Point Integer Representation",
      summary: "Understanding how integers are represented in binary, including positive and negative number ranges.",
      readXP: 15,
      hasMathEquations: true,
      contentMarkdown: `
## Fixed Point Integer Representation

### 1. Basic Concept

In fixed point representation, there is **no memory space for the decimal point**. Computers represent a finite number of digits, which allows us to evaluate the maximum and minimum possible numbers that can be represented.

> **Key point:** The binary point is fixed at one position — its presence is assumed based on whether the number stored is a fraction or an integer.

### 2. Range of Signed Integers (8‑bit two's complement)

| Type | Binary | Denary |
|------|--------|--------|
| Maximum Positive | 01111111 | +127 |
| Minimum Positive | 00000001 | +1 |
| Smallest Magnitude Negative | 11111111 | -1 |
| Largest Magnitude Negative | 10000000 | -128 |

**General formula for n bits:**  
Range: $-2^{n-1}$ to $2^{n-1} - 1$

### 3. Why This Matters

The fixed number of bits limits the range. For example, an 8‑bit system cannot store 128 or -129.

**Example:**  
$$ 01111111_2 = +127_{10} $$  
$$ 10000000_2 = -128_{10} $$

### 4. Unsigned Integers

For unsigned integers (all bits used for magnitude):

- Range: $0$ to $2^n - 1$
- 8‑bit: 0 to 255
- 16‑bit: 0 to 65,535

> **Key point:** The leftmost bit (MSB) determines sign in signed representation: 0 = positive, 1 = negative.

---
### Exercise
1. What is the range of a 10‑bit signed integer?
2. Why can't an 8‑bit signed integer represent 128?
`,
      mcqs: [],
      essayPrompt: undefined
    },

    // ── TOPIC 2: Fixed Point Binary & Two's Complement ──────────
    {
      id: "acs-fixed-point-binary",
      subjectId: "a-computer-science",
      title: "Fixed Point Binary & Two's Complement",
      summary: "Converting between denary and binary, and representing negative numbers using two's complement.",
      readXP: 15,
      hasMathEquations: true,
      contentMarkdown: `
## Fixed Point Binary & Two's Complement

### 1. Converting Denary to Fixed Point Binary

**Example:** Convert 6.1875 to binary

**Step 1:** Convert whole number part (6):  
$$ 6_{10} = 110_2 $$

**Step 2:** Convert fractional part (0.1875):

| Operation | Result | Bit |
|-----------|--------|-----|
| 0.1875 × 2 | 0.375 | 0 |
| 0.375 × 2 | 0.75 | 0 |
| 0.75 × 2 | 1.5 | 1 |
| 0.5 × 2 | 1.0 | 1 |

$$ 0.1875_{10} = 0011_2 $$

**Result:**  
$$ 6.1875_{10} = 0110.0011_2 $$

### 2. Converting Fixed Point Binary to Denary

**Example:** Convert 0110.1100 to denary

| 0 | 1 | 1 | 0 | . | 1 | 1 | 0 | 0 |
|---|---|---|---|---|---|---|---|---|
| 0 | 4 | 2 | 0 |   | ½ | ¼ | 0 | 0 |

$$ = 4 + 2 + \\tfrac{1}{2} + \\tfrac{1}{4} = 6.75 $$

### 3. Two's Complement for Negative Numbers

**Steps to convert a positive binary number to negative:**

1. Write the positive number in binary
2. Invert all bits (0→1, 1→0)
3. Add 1 to the result

**Example:** Convert -3.1875 to binary

**Step 1:** $3.1875 = 0011.0011$

**Step 2:** Invert: $1100.1100$

**Step 3:** Add 1:

$$ \\begin{array}{r}
  1100.1100 \\\\
+ \\quad 0000.0001 \\\\
\\hline
  1100.1101
\\end{array} $$

**Result:** $-3.1875 = 1100.1101$

### 4. Converting Signed Fixed Point Binary to Denary

**Example:** Convert 1100.1101 to denary

| 1 | 1 | 0 | 0 | . | 1 | 1 | 0 | 1 |
|---|---|---|---|---|---|---|---|---|
| -8 | 4 | 0 | 0 |   | ½ | ¼ | 0 | 1/16 |

$$ = -8 + 4 + \\tfrac{1}{2} + \\tfrac{1}{4} + \\tfrac{1}{16} = -3.1875 $$

### 5. Advantages & Disadvantages of Fixed Point

| Advantage | Disadvantage |
|-----------|--------------|
| Simple arithmetic (same as integer) | Limited range |
| Faster processing | Precision vs range trade‑off |
| No complex hardware needed | Increasing bits after decimal reduces range |

---
### Exercise
1. Convert 13.625 to binary.
2. Convert 1011.1010 to denary.
3. Represent -5.5 in 8‑bit fixed point binary.
`,
      mcqs: [],
      essayPrompt: undefined
    },

    // ── TOPIC 3: Floating Point Representation ──────────────────
    {
      id: "acs-floating-point",
      subjectId: "a-computer-science",
      title: "Floating Point Representation",
      summary: "Understanding mantissa, exponent, and how floating point numbers extend the range of representable values.",
      readXP: 15,
      hasMathEquations: true,
      contentMarkdown: `
## Floating Point Representation

### 1. Why Floating Point?

Fixed point has limited range. Even with 32 bits (8 bits for fractional part), the largest number is just over 8 million.

Floating point uses **scientific notation** in binary:

$$ \\text{Number} = \\text{Mantissa} \\times 2^{\\text{Exponent}} $$

### 2. Structure

A floating point number is divided into:

- **Mantissa (Significand):** Holds the significant digits
- **Exponent:** Defines where to place the binary point

**Example:** 16‑bit representation (10‑bit mantissa, 6‑bit exponent)

| Mantissa (10 bits) | Exponent (6 bits) |
|--------------------|-------------------|
| 0 110100000 | 000011 |

**Interpretation:**  
$$ 0.1101 \\times 2^3 = 110.1_2 = 6.5_{10} $$

> **Key point:** The binary point starts between the sign bit and the first mantissa bit.

### 3. Converting Floating Point to Denary

**Rules:**

1. Place the point between the sign bit and the first mantissa digit
2. Convert the exponent to decimal (positive or negative)
3. Move the point right (positive exponent) or left (negative exponent)
4. Convert the resulting binary number to denary

**Example 1:**  
0 100000000 11111110 (10‑bit mantissa, 8‑bit exponent)

$$ 0.100000000 \\times 2^{-2} = 0.001_2 = 0.125_{10} $$

**Example 2 (negative mantissa):**  
1 100000000 11111110

$$ 1.100000000 \\times 2^{-2} = 1.111_2 $$

$$ = -1 + \\tfrac{1}{2} + \\tfrac{1}{4} + \\tfrac{1}{8} = -0.125 $$

### 4. Exercise

Convert the following floating point binary numbers to denary (10‑bit mantissa, 6‑bit exponent):

(i) 0 101000000 111111  
(ii) 1 101000000 111111  
(iii) 1 001101000 000110  
(iv) 1 001101000 000110
`,
      mcqs: [],
      essayPrompt: undefined
    },

    // ── TOPIC 4: Normalisation ──────────────────────────────────
    {
      id: "acs-normalisation",
      subjectId: "a-computer-science",
      title: "Normalisation of Floating Point Numbers",
      summary: "Normalising floating point numbers for maximum precision and standard representation.",
      readXP: 15,
      hasMathEquations: true,
      contentMarkdown: `
## Normalisation of Floating Point Numbers

### 1. What is Normalisation?

Normalisation ensures **maximum precision** for a given number of bits. A normalised number always starts with **2 bits that are different** (01 or 10).

> **Key point:** 0.001101 × 2³ is NOT normalised. 0.1101 × 2¹ IS normalised.

### 2. Why Normalise?

- Maximum precision for a given number of bits
- Only one representation for each number (standardisation)
- Maximum possible accuracy
- Can detect error conditions (underflow/overflow)
- Maximises the range of numbers

### 3. Rules for Normalisation

1. Place the point between the sign bit and the first mantissa digit
2. Convert the exponent to decimal
3. Shift the point right or left to achieve normalised state
   - Add the number of places moved to the left to the exponent
   - Subtract if the point was moved to the right
4. Convert the exponent back to binary
5. Pad the mantissa with 0s on the right to maintain bit count

### 4. Examples

**Example 1:** Normalise 0 000110101 000010 (10‑bit mantissa, 6‑bit exponent)

$$ 0.000110101 \\times 2^2 $$

Move point 3 places right:

$$ 0.110101 \\times 2^{-1} $$

**Normalised:** 0 110101000 111111

**Example 2:** Normalise 1 111100100 000011

$$ 1.111100100 \\times 2^3 $$

Move point 4 places right:

$$ 1.001100 \\times 2^{-1} $$

**Normalised:** 1 001000000 111111

### 5. Exercise

Normalise the following numbers (10‑bit mantissa, 6‑bit exponent):

(i) 0 00000110 000111  
(ii) 0 00010111 000110  
(iii) 1 11110111 000000  
(iv) 1 11111101 000011

### 6. Normalising Decimal Numbers

**Example:** Normalise 3.1875 (8‑bit mantissa, 4‑bit exponent)

$$ 3.1875 = 0011.0011 $$

$$ 0011.0011 \\times 2^0 $$

Move point 2 places left:

$$ 0.110011 \\times 2^2 $$

**Normalised:** 0 1100110 0010
`,
      mcqs: [],
      essayPrompt: undefined
    },

    // ── TOPIC 5: Range, Precision & Arithmetic Errors ───────────
    {
      id: "acs-range-precision",
      subjectId: "a-computer-science",
      title: "Range, Precision & Arithmetic Errors",
      summary: "Understanding overflow, underflow, and the trade-off between range and precision.",
      readXP: 15,
      hasMathEquations: true,
      contentMarkdown: `
## Range, Precision & Arithmetic Errors

### 1. Range vs Precision Trade‑off

- **Exponent size** determines the **range** of numbers
- **Mantissa size** determines the **precision** (accuracy)

| Change | Effect |
|--------|--------|
| ↑ Exponent bits | ↑ Range, ↓ Precision |
| ↓ Exponent bits | ↓ Range, ↑ Precision |
| ↑ Mantissa bits | ↑ Precision, ↓ Range |
| ↓ Mantissa bits | ↓ Precision, ↑ Range |

**Only way to increase both:** Use more bits (single‑precision → double‑precision)

### 2. Number Ranges (8‑bit Mantissa, 8‑bit Exponent)

| Number | Mantissa | Exponent | Result |
|--------|----------|----------|--------|
| Largest +ve | 0.1111111 | 0.1111111 | $1 \\times 2^{127} = 2^{127}$ |
| Smallest +ve | 0.1000000 | 1.0000000 | $0.5 \\times 2^{-128}$ |
| Largest -ve | 1.0111111 | 1.0000000 | $-0.5 \\times 2^{-128}$ |
| Smallest -ve | 1.0000000 | 0.1111111 | $-1 \\times 2^{127}$ |

### 3. Overflow

Overflow occurs when a calculation produces a result exceeding the capacity of the result register.

**Example:** 16‑bit integers (range: -32768 to 32767)

$$ 2000 + 2000 = 4000 $$

In binary:  
$$ 0100111000100000 + 0100111000100000 = 1001110001000000 $$

The 16th bit contains a '1' → interpreted as negative! Result = -25536 instead of 4000.

**Floating point overflow:** Exponent becomes too large to represent.

### 4. Underflow

Underflow occurs when a result is too small to represent (exponent too negative).

**Example:** A number smaller than $2^{-128}$ cannot be represented.

The computer treats it as 0.

> **Key point:** Underflow is less serious than overflow — it results in loss of precision, not an incorrect sign.

### 5. Summary of Errors

| Error | Cause | Example |
|-------|-------|---------|
| Overflow | Result too large | 255 + 1 = 0 (8‑bit) |
| Underflow | Result too small | Tiny number → 0 |
| Rounding | Limited precision | 1/3 = 0.333... |
`,
      mcqs: [],
      essayPrompt: undefined
    }
  ]
},
  { id: "a-sociology", name: "Sociology", code: "6043", level: "a", themeColor: "#0F766E", vibeText: "Study of society.", topics: [placeholder("asoc-1","a-sociology","Social Stratification"), placeholder("asoc-2","a-sociology","Sociological Theories")] },
  { id: "a-family-religious", name: "Family & Religious Studies", code: "6074", level: "a", themeColor: "#78350F", vibeText: "Advanced societal beliefs.", topics: [placeholder("afrs-1","a-family-religious","Marriage & Family"), placeholder("afrs-2","a-family-religious","Religious Ethics")] },
  { id: "a-heritage", name: "Heritage Studies", code: "6081", level: "a", themeColor: "#065F46", vibeText: "Advanced national identity.", topics: [placeholder("aher-1","a-heritage","Zimbabwean Heritage"), placeholder("aher-2","a-heritage","Conservation")] },
  { id: "a-lit-english", name: "Literature in English", code: "6039", level: "a", themeColor: "#5B21B6", vibeText: "Advanced literary analysis.", topics: [placeholder("alite-1","a-lit-english","Prose Analysis"), placeholder("alite-2","a-lit-english","Drama & Poetry")] },
  { id: "a-lit-shona", name: "Literature in Shona", code: "6007", level: "a", themeColor: "#7C2D12", vibeText: "Advanced Shona literature.", topics: [placeholder("alits-1","a-lit-shona","Nganonyorwa"), placeholder("alits-2","a-lit-shona","Nhetembo")] },
  { id: "a-lit-ndebele", name: "Literature in Ndebele", code: "6008", level: "a", themeColor: "#6B21A8", vibeText: "Advanced Ndebele literature.", topics: [placeholder("alitn-1","a-lit-ndebele","Amanoveli"), placeholder("alitn-2","a-lit-ndebele","Izinkondlo")] },
  { id: "a-economic-history", name: "Economic History", code: "6034", level: "a", themeColor: "#92400E", vibeText: "History of economics.", topics: [placeholder("aeh-1","a-economic-history","Industrialisation"), placeholder("aeh-2","a-economic-history","Trade Policy")] },
  { id: "a-agriculture-eng", name: "Agriculture Engineering", code: "6048", level: "a", themeColor: "#166534", vibeText: "Farming machinery.", topics: [placeholder("aae-1","a-agriculture-eng","Farm Machinery"), placeholder("aae-2","a-agriculture-eng","Irrigation Systems")] },
  { id: "a-crop-science", name: "Crop Science", code: "6049", level: "a", themeColor: "#15803D", vibeText: "Advanced plant biology.", topics: [placeholder("acs3-1","a-crop-science","Plant Physiology"), placeholder("acs3-2","a-crop-science","Crop Protection")] },
  { id: "a-animal-science", name: "Animal Science", code: "6028", level: "a", themeColor: "#15803D", vibeText: "Advanced zoology.", topics: [placeholder("aas-1","a-animal-science","Animal Nutrition"), placeholder("aas-2","a-animal-science","Livestock Management")] },
  { id: "a-horticulture", name: "Horticulture", code: "6024", level: "a", themeColor: "#166534", vibeText: "Garden cultivation.", topics: [placeholder("ahor-1","a-horticulture","Vegetable Production"), placeholder("ahor-2","a-horticulture","Floriculture")] },
  { id: "a-food-tech", name: "Food Technology & Design", code: "6036", level: "a", themeColor: "#A16207", vibeText: "Advanced food science.", topics: [placeholder("aft-1","a-food-tech","Food Preservation"), placeholder("aft-2","a-food-tech","Food Quality Control")] },
  { id: "a-home-management", name: "Home Management & Design", code: "6038", level: "a", themeColor: "#BE185D", vibeText: "Advanced home management.", topics: [placeholder("ahm-1","a-home-management","Interior Design"), placeholder("ahm-2","a-home-management","Consumer Education")] },
  { id: "a-software-eng", name: "Software Engineering", code: "6044", level: "a", themeColor: "#0C4A6E", vibeText: "Software creation.", topics: [placeholder("ase-1","a-software-eng","Software Development Lifecycle"), placeholder("ase-2","a-software-eng","Testing & Debugging")] },
  { id: "a-french", name: "French", code: "6068", level: "a", themeColor: "#1E40AF", vibeText: "Le Français.", topics: [placeholder("afr-1","a-french","French Grammar"), placeholder("afr-2","a-french","French Literature")] },
];
