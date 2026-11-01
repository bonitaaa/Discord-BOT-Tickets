const CURATED_TRIVIA = [
  { level: 'easy', question: 'Quelle est la capitale de la France ?', answers: ['paris'] },
  { level: 'easy', question: 'Quelle est la capitale de l’Italie ?', answers: ['rome'] },
  { level: 'easy', question: 'Quelle est la capitale de l’Espagne ?', answers: ['madrid'] },
  { level: 'easy', question: 'Combien de côtés possède un triangle ?', answers: ['3', 'trois'] },
  { level: 'easy', question: 'Combien de jours compte une année bissextile ?', answers: ['366', 'trois cent soixante six'] },
  { level: 'easy', question: 'À quelle température l’eau gèle-t-elle en degrés Celsius ?', answers: ['0', 'zero', '0 degre', 'zero degre'] },
  { level: 'easy', question: 'Quelle planète est surnommée la planète rouge ?', answers: ['mars'] },
  { level: 'easy', question: 'Quelle planète possède des anneaux très visibles ?', answers: ['saturne'] },
  { level: 'easy', question: 'Quel est le plus grand mammifère du monde ?', answers: ['baleine bleue', 'la baleine bleue'] },
  { level: 'easy', question: 'Quel fruit sculpte-t-on traditionnellement pour Halloween ?', answers: ['citrouille', 'potiron'] },
  { level: 'easy', question: 'À quelle date fête-t-on Halloween ?', answers: ['31 octobre', 'le 31 octobre'] },
  { level: 'easy', question: 'Quel animal noir accompagne souvent les sorcières ?', answers: ['chat', 'chat noir', 'un chat noir'] },
  { level: 'easy', question: 'Combien de pattes possède une araignée ?', answers: ['8', 'huit'] },
  { level: 'easy', question: 'Quel monstre est enveloppé de bandelettes ?', answers: ['momie', 'une momie', 'la momie'] },
  { level: 'easy', question: 'Quelle créature possède de longues canines et boit du sang ?', answers: ['vampire', 'un vampire'] },
  { level: 'easy', question: 'Quel objet une sorcière utilise-t-elle traditionnellement pour voler ?', answers: ['balai', 'un balai'] },
  { level: 'easy', question: 'Comment appelle-t-on le squelette de la tête ?', answers: ['crane', 'le crane'] },
  { level: 'easy', question: 'Quelle couleur obtient-on en mélangeant du rouge et du jaune ?', answers: ['orange'] },
  { level: 'easy', question: 'Combien y a-t-il de mois dans une année ?', answers: ['12', 'douze'] },

  { level: 'medium', question: 'Quel est le plus grand océan du monde ?', answers: ['pacifique', 'ocean pacifique', 'le pacifique'] },
  { level: 'medium', question: 'Quelle est la capitale de l’Australie ?', answers: ['canberra'] },
  { level: 'medium', question: 'Quelle est la capitale du Canada ?', answers: ['ottawa'] },
  { level: 'medium', question: 'Quelle est la capitale de la Suisse ?', answers: ['berne'] },
  { level: 'medium', question: 'Quel est le symbole chimique de l’or ?', answers: ['au'] },
  { level: 'medium', question: 'Quel est le symbole chimique de l’oxygène ?', answers: ['o'] },
  { level: 'medium', question: 'Quelle planète est la plus proche du Soleil ?', answers: ['mercure'] },
  { level: 'medium', question: 'Combien de cavités possède le cœur humain ?', answers: ['4', 'quatre'] },
  { level: 'medium', question: 'Quel est le plus grand continent ?', answers: ['asie', 'l asie'] },
  { level: 'medium', question: 'Qui a peint La Joconde ?', answers: ['leonard de vinci', 'de vinci', 'leonardo da vinci'] },
  { level: 'medium', question: 'Qui a écrit Le Petit Prince ?', answers: ['antoine de saint exupery', 'saint exupery'] },
  { level: 'medium', question: 'Quelle langue parle-t-on principalement au Brésil ?', answers: ['portugais', 'le portugais'] },
  { level: 'medium', question: 'Quelle créature se transforme lors de la pleine lune ?', answers: ['loup garou', 'un loup garou'] },
  { level: 'medium', question: 'Quel vampire célèbre vit dans un château de Transylvanie ?', answers: ['dracula'] },
  { level: 'medium', question: 'Comment appelle-t-on la peur des araignées ?', answers: ['arachnophobie', 'l arachnophobie'] },
  { level: 'medium', question: 'Quel métal liquide trouve-t-on dans les anciens thermomètres ?', answers: ['mercure', 'le mercure'] },
  { level: 'medium', question: 'Combien de joueurs une équipe de football aligne-t-elle sur le terrain ?', answers: ['11', 'onze'] },
  { level: 'medium', question: 'Quel organe produit l’insuline ?', answers: ['pancreas', 'le pancreas'] },
  { level: 'medium', question: 'Dans quel pays se trouve la ville de Marrakech ?', answers: ['maroc', 'le maroc'] },
  { level: 'medium', question: 'Quel gaz les plantes absorbent-elles principalement ?', answers: ['dioxyde de carbone', 'co2'] },

  { level: 'hard', question: 'En quelle année ont eu lieu les premiers pas sur la Lune ?', answers: ['1969'] },
  { level: 'hard', question: 'Combien d’os possède généralement un adulte ?', answers: ['206', 'deux cent six'] },
  { level: 'hard', question: 'Quel ancien festival celtique est à l’origine d’Halloween ?', answers: ['samhain'] },
  { level: 'hard', question: 'Quel auteur a écrit le roman Dracula ?', answers: ['bram stoker', 'stoker'] },
  { level: 'hard', question: 'En quelle année débute la Révolution française ?', answers: ['1789'] },
  { level: 'hard', question: 'Quel élément chimique porte le numéro atomique 79 ?', answers: ['or', 'l or'] },
  { level: 'hard', question: 'Quelle est la capitale de la Mongolie ?', answers: ['oulan bator', 'ulaanbaatar', 'ulan bator'] },
  { level: 'hard', question: 'Quel est le plus petit pays du monde ?', answers: ['vatican', 'le vatican'] },
  { level: 'hard', question: 'Quelle fosse océanique est la plus profonde connue ?', answers: ['fosse des mariannes', 'mariannes', 'la fosse des mariannes'] },
  { level: 'hard', question: 'Quel scientifique a formulé les trois lois du mouvement ?', answers: ['isaac newton', 'newton'] },
  { level: 'hard', question: 'Quel peintre est l’auteur de La Nuit étoilée ?', answers: ['vincent van gogh', 'van gogh'] },
  { level: 'hard', question: 'Quel écrivain a créé le personnage de Sherlock Holmes ?', answers: ['arthur conan doyle', 'conan doyle'] },
  { level: 'hard', question: 'Quelle est la capitale du Bhoutan ?', answers: ['thimphou', 'thimphu'] },
  { level: 'hard', question: 'Quel est le nom du processus par lequel les plantes fabriquent leur énergie grâce à la lumière ?', answers: ['photosynthese', 'la photosynthese'] },
  { level: 'hard', question: 'Combien de chromosomes possède normalement une cellule humaine ?', answers: ['46', 'quarante six'] },
  { level: 'hard', question: 'Quel compositeur a écrit Les Quatre Saisons ?', answers: ['antonio vivaldi', 'vivaldi'] },
  { level: 'hard', question: 'Quelle civilisation a construit le Machu Picchu ?', answers: ['incas', 'les incas', 'inca'] },
  { level: 'hard', question: 'Quel est le nom scientifique de l’Homme moderne ?', answers: ['homo sapiens'] },
  { level: 'hard', question: 'Dans quelle couche de l’atmosphère se trouve la couche d’ozone ?', answers: ['stratosphere', 'la stratosphere'] },
  { level: 'hard', question: 'Quel philosophe a écrit Le Banquet ?', answers: ['platon'] },
];

const generatedQuestions = [];

// Les calculs ne représentent volontairement qu'une petite partie de la banque.
for (let left = 11; left <= 15; left += 1) {
  for (let right = 2; right <= 7; right += 1) {
    generatedQuestions.push({
      level: left + right <= 25 ? 'easy' : 'medium',
      question: `Combien font ${left} + ${right} ?`,
      answers: [String(left + right)],
    });
  }
}

for (let left = 3; left <= 7; left += 1) {
  for (let right = 3; right <= 8; right += 1) {
    generatedQuestions.push({
      level: left <= 6 && right <= 6 ? 'easy' : 'medium',
      question: `Combien font ${left} × ${right} ?`,
      answers: [String(left * right)],
    });
  }
}

const seasonalQuestions = [
  ['easy', 'Quelle saison vient juste après l’automne ?', ['hiver', "l hiver"]],
  ['easy', 'Quel mois ouvre généralement la saison d’hiver dans l’hémisphère Nord ?', ['decembre']],
  ['easy', 'Quel personnage en rouge distribue traditionnellement des cadeaux à Noël ?', ['pere noel', 'le pere noel']],
  ['easy', 'Comment appelle-t-on une boule faite avec de la neige ?', ['boule de neige', 'une boule de neige']],
  ['easy', 'Quel animal tire traditionnellement le traîneau du Père Noël ?', ['renne', 'un renne', 'les rennes']],
  ['easy', 'Quelle boisson chaude est souvent préparée avec du cacao ?', ['chocolat chaud', 'un chocolat chaud']],
  ['easy', 'Quel vêtement porte-t-on autour du cou quand il fait froid ?', ['echarpe', 'une echarpe']],
  ['easy', 'Quel objet de glace peut pendre du bord d’un toit ?', ['stalactite', 'stalactite de glace']],
  ['medium', 'Quel est le nom du sol gelé en permanence dans les régions polaires ?', ['pergelisol', 'permafrost']],
  ['medium', 'Comment appelle-t-on une forte tempête de neige accompagnée de vent ?', ['blizzard', 'un blizzard']],
  ['medium', 'Dans quel hémisphère Noël tombe-t-il pendant l’été ?', ['hemisphere sud', "l hemisphere sud"]],
  ['medium', 'Quel sport d’hiver se pratique avec une pierre et des balais ?', ['curling', 'le curling']],
  ['medium', 'Dans quel pays se trouve la ville de Rovaniemi, associée au Père Noël ?', ['finlande', 'la finlande']],
  ['hard', 'Quel phénomène lumineux est fréquent dans le ciel des régions polaires ?', ['aurore polaire', 'aurore boreale', 'une aurore boreale']],
  ['hard', 'Quel gaz rare donne souvent une teinte rouge orangée aux enseignes lumineuses ?', ['neon', 'le neon']],
  ['hard', 'Comment appelle-t-on la baisse dangereuse de la température corporelle ?', ['hypothermie', "l hypothermie"]],
  ['hard', 'Quel peuple autochtone vit notamment dans les régions arctiques du Canada et du Groenland ?', ['inuit', 'inuits', 'les inuits']],
  ['hard', 'Quel cercle imaginaire se situe vers 66,5 degrés de latitude nord ?', ['cercle polaire arctique', 'le cercle polaire arctique']],
].map(([level, question, answers]) => ({ level, question, answers }));

const geography = [
  ['France', 'Paris', 'Europe'], ['Italie', 'Rome', 'Europe'], ['Espagne', 'Madrid', 'Europe'],
  ['Portugal', 'Lisbonne', 'Europe'], ['Allemagne', 'Berlin', 'Europe'], ['Belgique', 'Bruxelles', 'Europe'],
  ['Suisse', 'Berne', 'Europe'], ['Autriche', 'Vienne', 'Europe'], ['Grèce', 'Athènes', 'Europe'],
  ['Irlande', 'Dublin', 'Europe'], ['Norvège', 'Oslo', 'Europe'], ['Suède', 'Stockholm', 'Europe'],
  ['Finlande', 'Helsinki', 'Europe'], ['Danemark', 'Copenhague', 'Europe'], ['Pologne', 'Varsovie', 'Europe'],
  ['Hongrie', 'Budapest', 'Europe'], ['Roumanie', 'Bucarest', 'Europe'], ['Bulgarie', 'Sofia', 'Europe'],
  ['Croatie', 'Zagreb', 'Europe'], ['Islande', 'Reykjavik', 'Europe'], ['Canada', 'Ottawa', 'Amérique du Nord'],
  ['États-Unis', 'Washington', 'Amérique du Nord'], ['Mexique', 'Mexico', 'Amérique du Nord'],
  ['Brésil', 'Brasilia', 'Amérique du Sud'], ['Argentine', 'Buenos Aires', 'Amérique du Sud'],
  ['Chili', 'Santiago', 'Amérique du Sud'], ['Pérou', 'Lima', 'Amérique du Sud'],
  ['Colombie', 'Bogota', 'Amérique du Sud'], ['Maroc', 'Rabat', 'Afrique'], ['Algérie', 'Alger', 'Afrique'],
  ['Tunisie', 'Tunis', 'Afrique'], ['Égypte', 'Le Caire', 'Afrique'], ['Sénégal', 'Dakar', 'Afrique'],
  ['Kenya', 'Nairobi', 'Afrique'], ['Éthiopie', 'Addis-Abeba', 'Afrique'], ['Japon', 'Tokyo', 'Asie'],
  ['Chine', 'Pékin', 'Asie'], ['Corée du Sud', 'Séoul', 'Asie'], ['Inde', 'New Delhi', 'Asie'],
  ['Thaïlande', 'Bangkok', 'Asie'], ['Vietnam', 'Hanoï', 'Asie'], ['Indonésie', 'Jakarta', 'Asie'],
  ['Philippines', 'Manille', 'Asie'], ['Mongolie', 'Oulan-Bator', 'Asie'], ['Népal', 'Katmandou', 'Asie'],
  ['Australie', 'Canberra', 'Océanie'], ['Nouvelle-Zélande', 'Wellington', 'Océanie'],
  ['Fidji', 'Suva', 'Océanie'], ['Turquie', 'Ankara', 'Asie'], ['Jordanie', 'Amman', 'Asie'],
];

for (const [country, capital, continent] of geography) {
  generatedQuestions.push(
    { level: 'medium', question: `Quelle est la capitale de ${country} ?`, answers: [capital] },
    { level: 'medium', question: `De quel pays ${capital} est-elle la capitale ?`, answers: [country] },
    { level: 'easy', question: `Sur quel continent se trouve ${country} ?`, answers: [continent] },
  );
}

const elements = [
  ['hydrogène', 'H'], ['hélium', 'He'], ['carbone', 'C'], ['azote', 'N'], ['oxygène', 'O'],
  ['sodium', 'Na'], ['magnésium', 'Mg'], ['aluminium', 'Al'], ['silicium', 'Si'], ['phosphore', 'P'],
  ['soufre', 'S'], ['chlore', 'Cl'], ['potassium', 'K'], ['calcium', 'Ca'], ['fer', 'Fe'],
  ['cuivre', 'Cu'], ['zinc', 'Zn'], ['argent', 'Ag'], ['or', 'Au'], ['mercure', 'Hg'],
  ['plomb', 'Pb'], ['étain', 'Sn'], ['iode', 'I'], ['néon', 'Ne'], ['argon', 'Ar'],
  ['lithium', 'Li'], ['béryllium', 'Be'], ['bore', 'B'], ['nickel', 'Ni'], ['cobalt', 'Co'],
];

for (const [element, symbol] of elements) {
  generatedQuestions.push(
    { level: 'medium', question: `Quel est le symbole chimique de l’élément ${element} ?`, answers: [symbol] },
    { level: 'hard', question: `Quel élément chimique porte le symbole ${symbol} ?`, answers: [element] },
  );
}

const books = [
  ['Le Petit Prince', 'Antoine de Saint-Exupéry'], ['Les Misérables', 'Victor Hugo'],
  ['L’Étranger', 'Albert Camus'], ['Germinal', 'Émile Zola'], ['Madame Bovary', 'Gustave Flaubert'],
  ['Le Rouge et le Noir', 'Stendhal'], ['Vingt Mille Lieues sous les mers', 'Jules Verne'],
  ['Le Comte de Monte-Cristo', 'Alexandre Dumas'], ['Les Fleurs du mal', 'Charles Baudelaire'],
  ['À la recherche du temps perdu', 'Marcel Proust'], ['Dracula', 'Bram Stoker'],
  ['Frankenstein', 'Mary Shelley'], ['1984', 'George Orwell'], ['Le Seigneur des anneaux', 'J. R. R. Tolkien'],
  ['Harry Potter', 'J. K. Rowling'], ['Don Quichotte', 'Miguel de Cervantes'],
  ['Roméo et Juliette', 'William Shakespeare'], ['Orgueil et Préjugés', 'Jane Austen'],
  ['L’Odyssée', 'Homère'], ['Le Nom de la rose', 'Umberto Eco'], ['Bel-Ami', 'Guy de Maupassant'],
  ['Le Père Goriot', 'Honoré de Balzac'], ['Candide', 'Voltaire'], ['Les Fourberies de Scapin', 'Molière'],
  ['Le Tour du monde en quatre-vingts jours', 'Jules Verne'],
];

for (const [book, author] of books) {
  generatedQuestions.push(
    { level: 'medium', question: `Qui a écrit « ${book} » ?`, answers: [author] },
    { level: 'hard', question: `« ${book} » est l’œuvre de quel écrivain ?`, answers: [author] },
  );
}

const animals = [
  ['lion', 'mammifère'], ['aigle', 'oiseau'], ['requin', 'poisson'], ['grenouille', 'amphibien'],
  ['crocodile', 'reptile'], ['dauphin', 'mammifère'], ['pieuvre', 'mollusque'], ['abeille', 'insecte'],
  ['araignée', 'arachnide'], ['manchot', 'oiseau'], ['baleine', 'mammifère'], ['serpent', 'reptile'],
  ['saumon', 'poisson'], ['papillon', 'insecte'], ['escargot', 'mollusque'], ['crabe', 'crustacé'],
  ['chauve-souris', 'mammifère'], ['autruche', 'oiseau'], ['tortue', 'reptile'], ['triton', 'amphibien'],
  ['fourmi', 'insecte'], ['scorpion', 'arachnide'], ['homard', 'crustacé'], ['orque', 'mammifère'],
  ['caméléon', 'reptile'], ['thon', 'poisson'], ['limace', 'mollusque'], ['libellule', 'insecte'],
  ['salamandre', 'amphibien'], ['pingouin', 'oiseau'],
];

for (const [animal, family] of animals) {
  generatedQuestions.push(
    { level: 'easy', question: `À quelle grande famille animale appartient le ${animal} ?`, answers: [family] },
    { level: 'medium', question: `Le ${animal} est-il classé comme mammifère, oiseau, reptile, poisson, amphibien, insecte, arachnide, mollusque ou crustacé ?`, answers: [family] },
  );
}

const antonyms = [
  ['chaud', 'froid'], ['grand', 'petit'], ['rapide', 'lent'], ['clair', 'sombre'], ['fort', 'faible'],
  ['jeune', 'vieux'], ['riche', 'pauvre'], ['proche', 'lointain'], ['facile', 'difficile'], ['plein', 'vide'],
  ['heureux', 'triste'], ['calme', 'agité'], ['propre', 'sale'], ['large', 'étroit'], ['haut', 'bas'],
  ['léger', 'lourd'], ['dur', 'mou'], ['sec', 'humide'], ['bruyant', 'silencieux'], ['ancien', 'nouveau'],
  ['ouvert', 'fermé'], ['possible', 'impossible'], ['présent', 'absent'], ['visible', 'invisible'], ['utile', 'inutile'],
  ['poli', 'impoli'], ['patient', 'impatient'], ['juste', 'injuste'], ['égal', 'différent'], ['début', 'fin'],
];

for (const [word, opposite] of antonyms) {
  generatedQuestions.push(
    { level: 'easy', question: `Quel est le contraire de « ${word} » ?`, answers: [opposite] },
    { level: 'easy', question: `Quel est le contraire de « ${opposite} » ?`, answers: [word] },
  );
}

const entertainmentQuestions = [
  ['easy', 'Combien de joueurs une équipe de football aligne-t-elle sur le terrain ?', ['11', 'onze']],
  ['easy', 'Dans quel sport utilise-t-on une raquette et un volant ?', ['badminton', 'le badminton']],
  ['easy', 'Quel pays a remporté la Coupe du monde de football 2018 ?', ['france', 'la france']],
  ['easy', 'Dans quel sport marque-t-on des paniers ?', ['basketball', 'basket', 'le basketball']],
  ['medium', 'Quel joueur est surnommé La Pulga ?', ['lionel messi', 'messi']],
  ['medium', 'Dans quel sport dispute-t-on le tournoi de Roland-Garros ?', ['tennis', 'le tennis']],
  ['medium', 'Quelle distance mesure un marathon officiel ?', ['42,195 km', '42.195 km', '42 kilometres 195']],
  ['medium', 'Quel pays est à l’origine du judo ?', ['japon', 'le japon']],
  ['hard', 'Quel athlète détient le record du monde du 100 mètres masculin établi en 2009 ?', ['usain bolt', 'bolt']],
  ['hard', 'Dans quelle ville les premiers Jeux olympiques modernes ont-ils eu lieu en 1896 ?', ['athenes', 'athènes']],
  ['easy', 'Quel est le prénom du héros principal de Naruto ?', ['naruto', 'naruto uzumaki']],
  ['easy', 'Dans One Piece, comment s’appelle le capitaine de l’équipage au Chapeau de paille ?', ['luffy', 'monkey d luffy']],
  ['easy', 'Quel Pokémon jaune accompagne Sacha ?', ['pikachu']],
  ['easy', 'Dans Dragon Ball, comment s’appelle le héros Saiyan élevé sur Terre ?', ['goku', 'son goku']],
  ['medium', 'Quel manga met en scène les frères Edward et Alphonse Elric ?', ['fullmetal alchemist']],
  ['medium', 'Dans Demon Slayer, comment s’appelle la sœur de Tanjiro ?', ['nezuko', 'nezuko kamado']],
  ['medium', 'Quel studio japonais a produit Le Voyage de Chihiro ?', ['studio ghibli', 'ghibli']],
  ['medium', 'Dans Death Note, quel est le nom du détective qui poursuit Light ?', ['l']],
  ['hard', 'Qui est l’auteur du manga Attack on Titan ?', ['hajime isayama', 'isayama']],
  ['hard', 'Quel réalisateur japonais a créé Your Name ?', ['makoto shinkai', 'shinkai']],
  ['easy', 'Dans Stranger Things, comment se nomme la jeune fille dotée de pouvoirs ?', ['onze', 'eleven', 'onze eleven']],
  ['easy', 'Quelle série met en scène la famille Addams et le personnage de Mercredi ?', ['mercredi', 'wednesday']],
  ['easy', 'Dans Squid Game, quel numéro porte Seong Gi-hun ?', ['456']],
  ['medium', 'Quelle série Netflix suit le braqueur surnommé le Professeur ?', ['la casa de papel', 'casa de papel']],
  ['medium', 'Dans The Witcher, comment se nomme le sorceleur principal ?', ['geralt de riv', 'geralt de rivia', 'geralt']],
  ['medium', 'Quelle série Netflix raconte la vie de la famille royale britannique ?', ['the crown']],
  ['medium', 'Dans Lupin, quel acteur interprète Assane Diop ?', ['omar sy']],
  ['hard', 'Qui a créé la série Black Mirror ?', ['charlie brooker', 'brooker']],
  ['hard', 'Dans Dark, quelle ville allemande fictive est au centre de l’intrigue ?', ['winden']],
  ['hard', 'Quel jeu vidéo est adapté dans la série Arcane ?', ['league of legends', 'lol']],
  ['easy', 'Quel chanteur est surnommé le Roi de la pop ?', ['michael jackson']],
  ['easy', 'Quel groupe britannique a chanté Bohemian Rhapsody ?', ['queen']],
  ['easy', 'Quel instrument possède généralement 88 touches ?', ['piano', 'le piano']],
  ['easy', 'Quelle chanteuse interprète Rolling in the Deep ?', ['adele']],
  ['medium', 'Quel duo français est connu pour les casques de robots et le titre Get Lucky ?', ['daft punk']],
  ['medium', 'Quel rappeur belge interprète Alors on danse ?', ['stromae']],
  ['medium', 'Quel groupe sud-coréen a sorti Dynamite en 2020 ?', ['bts']],
  ['medium', 'Qui interprète la chanson Blinding Lights ?', ['the weeknd', 'weeknd']],
  ['hard', 'Quel compositeur est devenu sourd à la fin de sa vie ?', ['ludwig van beethoven', 'beethoven']],
  ['hard', 'Quel album de Michael Jackson contient le titre Thriller ?', ['thriller']],
].map(([level, question, answers]) => ({ level, question, answers }));

const allQuestions = [...CURATED_TRIVIA, ...seasonalQuestions, ...entertainmentQuestions, ...generatedQuestions];
export const HALLOWEEN_TRIVIA = allQuestions.filter(
  ({ question }, index) => allQuestions.findIndex((candidate) => candidate.question === question) === index,
);
