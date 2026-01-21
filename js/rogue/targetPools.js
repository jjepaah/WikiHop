// Wikipedia article pools for rogue mode target generation
// Organized by stage difficulty

export const targetPools = {
    // Stages 1-3: Broad, well-known topics
    stage1_3: [
        "France", "Germany", "Japan", "Brazil", "Australia",
        "Basketball", "Football", "Tennis", "Swimming", "Chess",
        "Dog", "Cat", "Elephant", "Lion", "Eagle",
        "Pizza", "Chocolate", "Coffee", "Tea", "Rice",
        "Guitar", "Piano", "Violin", "Drums",
        "Mathematics", "Physics", "Chemistry", "Biology",
        "Leonardo da Vinci", "Albert Einstein", "William Shakespeare",
        "Mount Everest", "Pacific Ocean", "Amazon River",
        "Sun", "Moon", "Earth", "Mars"
    ],
    
    // Stages 4-6: Medium specificity
    stage4_6: [
        "Helsinki", "Barcelona", "Tokyo", "Sydney", "Cairo",
        "UEFA Champions League", "NBA", "Wimbledon Championships",
        "Golden Retriever", "Persian cat", "African elephant",
        "Margherita pizza", "Dark chocolate", "Espresso",
        "Electric guitar", "Grand piano", "Acoustic guitar",
        "Calculus", "Quantum mechanics", "Organic chemistry",
        "Michelangelo", "Marie Curie", "Charles Darwin",
        "Great Barrier Reef", "Sahara Desert", "Alps",
        "Solar eclipse", "Black hole", "Supernova"
    ],
    
    // Stages 7-10: High specificity
    stage7_10: [
        "Finnish language", "Flamenco", "Haiku", "Bauhaus",
        "Three-point field goal", "Offside (association football)",
        "Siberian Husky", "Ragdoll", "Blue whale",
        "Neapolitan pizza", "Belgian chocolate", "Cappuccino",
        "Fender Stratocaster", "Steinway & Sons", "Stradivarius",
        "Differential equation", "String theory", "DNA sequencing",
        "Vincent van Gogh", "Nikola Tesla", "Jane Austen",
        "Mariana Trench", "Atacama Desert", "K2",
        "Neutron star", "Higgs boson", "Exoplanet"
    ],
    
    // Stages 11+: Very specific/niche topics
    stage11plus: [
        "Uralic languages", "Twelve-tone technique", "Sonnet 18",
        "De Stijl", "Bauhaus Dessau", "Art Nouveau",
        "Pick and roll", "Tiki-taka", "Cruyff Turn",
        "Alaskan Malamute", "Birman", "Sperm whale",
        "San Marzano tomato", "Valrhona", "Flat white",
        "Gibson Les Paul", "Bösendorfer", "Guarneri",
        "Riemann hypothesis", "Loop quantum gravity", "CRISPR",
        "The Starry Night", "Alternating current", "Pride and Prejudice",
        "Challenger Deep", "Salar de Uyuni", "Kangchenjunga",
        "Magnetar", "Quark", "TRAPPIST-1"
    ]
};

// Get random target based on current stage
export function getTargetForStage(stageNumber) {
    let pool;
    
    if (stageNumber <= 3) {
        pool = targetPools.stage1_3;
    } else if (stageNumber <= 6) {
        pool = targetPools.stage4_6;
    } else if (stageNumber <= 10) {
        pool = targetPools.stage7_10;
    } else {
        pool = targetPools.stage11plus;
    }
    
    return pool[Math.floor(Math.random() * pool.length)];
}

// Get random start page (always from easy pool for consistency)
export function getRandomStartPage() {
    const pool = targetPools.stage1_3;
    return pool[Math.floor(Math.random() * pool.length)];
}
