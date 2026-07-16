/* ─── manifesto copy · the four-language module (W16 · i18n) ──────────────────
   The manifesto is the ONE translated surface of the site: it is an essay
   (the most translatable register), culturally portable, and nearly immutable
   — the product pages stay English. Every locale is HAND-WRITTEN in the
   manifesto's own voice, never machine word-for-word; technical terms keep
   their English form (Nika, workflow, prompt, open-weight, AGPL) the way
   developer communities actually write them.

   Inline emphasis uses the segment pattern (the BlogInline idiom): a plain
   string, { fg } for the bright span, { em } for italics. The parity test
   (manifesto-i18n.test.ts) holds every locale to the same shape as EN.

   BCP 47: codes are canonical tags (zh-Hans, not zh-CN); URL slugs are the
   lowercase form. x-default → /manifesto (EN). */

export type MfSeg = string | { fg: string } | { em: string }

export interface ManifestoCopy {
  /** URL path of this variant (also the hreflang alternate target) */
  path: string
  /** canonical BCP 47 tag (drives <html lang> + hreflang) */
  bcp47: string
  /** og:locale value (underscore form the OG protocol expects) */
  ogLocale: string
  /** the switcher label */
  label: string
  htmlTitle: string
  metaDescription: string
  ogDescription: string
  ogAlt: string
  kicker: string
  title: [string, string]
  sub: string
  stamp: string
  lore1: string
  lore2: string
  friday: MfSeg[]
  statement1: string
  realProblem: MfSeg[]
  stack: string[]
  rented: MfSeg[]
  statement2: string
  agent: MfSeg[]
  openSource: MfSeg[]
  statement3: string
  promisesKicker: string
  promisesTitle: string
  promises: { n: string; t: string; d: string }[]
  close: [string, string]
  drumline: string
  /* §the record (05) · the section FRAME only — entries stay EN by design
     (technical register, like code blocks · see manifesto-record.ts) */
  recordKicker: string
  recordTitle: string
  recordIntro: string
  recordFilterLabel: string
  recordFilterAll: string
  recordFilterCage: string
  recordFilterDrum: string
  recordLegend: string
  recordContinues: string
  recordUpdated: string
  recordLaw: string
  linkSpec: string
  linkGithub: string
  linkBack: string
}

const EN: ManifestoCopy = {
  path: '/manifesto',
  bcp47: 'en',
  ogLocale: 'en_US',
  label: 'EN',
  htmlTitle: 'Manifesto · Nika',
  metaDescription:
    'The drum of liberation. Why your workflows should run on your machine, with any model, and never be switched off by anyone but you.',
  ogDescription: 'The drum of liberation · sovereign AI workflows, owned by you.',
  ogAlt: 'Nika manifesto · the drum of liberation. Any model, your memory, owned by you.',
  kicker: '§ The manifesto · 2026',
  title: ['The drum', 'of liberation.'],
  sub: 'Intelligence you can’t be locked out of.',
  stamp: 'Written the day intelligence got a kill switch.',
  lore1:
    'Nika is named for the sun god of liberation: the drum that turns fear into laughter and frees the ones who were locked out.',
  lore2: 'Every workflow run is a beat of that drum.',
  friday: [
    'On a Friday afternoon, by a single letter, the most capable intelligence on Earth was switched off for most of the people on Earth. ',
    { fg: 'Not deleted. Not broken. Revoked.' },
    ' One government decided who was allowed to think with it, and overnight, the rest of us were locked out of a tool we had been building our lives on.',
  ],
  statement1: 'This is the moment the argument ended.',
  realProblem: [
    'The real problem was never ',
    { em: 'which' },
    ' lab is ahead. It is ',
    { fg: 'who controls access to intelligence' },
    ':',
  ],
  stack: ['models', 'memory', 'context', 'workflows', 'agents', 'tools'],
  rented: [
    'Your entire cognitive stack. If all of it lives behind closed providers, it is not yours. It is ',
    { fg: 'rented' },
    '. And what is rented can be priced out, locked down, or turned off, by a board, a court, a border, a letter.',
  ],
  statement2: 'We refuse the subscription economy for cognition.',
  agent: [
    'And as these tools start to act on the world, the same rule holds for what they do, not just where they run. ',
    { fg: 'An agent should never act from a hidden prompt.' },
    ' The plan it intends to run should be a file you can read, and reviewable before it acts. Power you cannot see is power you do not control.',
  ],
  openSource: [
    { fg: 'There is no US open source AI. There is no French open source AI.' },
    ' Open source is open knowledge, shared infrastructure, and the right to run, study, modify, and own intelligence. Don’t fight the cage by repainting it. Leave it.',
  ],
  statement3: 'Sovereignty for everyone, or for no one.',
  promisesKicker: '§ What we promise',
  promisesTitle: 'Built for the day the tap closes.',
  promises: [
    {
      n: '01',
      t: 'Cognitive liberty',
      d: 'Bring any model. Local, open-weight, or frontier. Swappable at will. No lab is the load-bearing wall, so if one disappears tomorrow, your work does not.',
    },
    {
      n: '02',
      t: 'Sovereign memory',
      d: 'Your context, your taste, your habits live on your hardware. Readable, exportable, deletable, without asking anyone. Never hosted, never for rent.',
    },
    {
      n: '03',
      t: 'Work that survives',
      d: 'Useful work becomes source. Plain text, versioned, replayable. Still yours in ten years, on a machine that never phones home.',
    },
    {
      n: '04',
      t: 'Craft over capture',
      d: 'Quality over volume. Less, but better. The license makes the freedom structural, not a favour we could quietly take back.',
    },
    {
      n: '05',
      t: 'A galaxy, not a monolith',
      d: 'No single point that anyone can switch off. Composable, plural, sovereign by design.',
    },
  ],
  close: ['Open source AI must win.', 'Not for a nation. For everyone.'],
  drumline: 'The drum of liberation is getting louder.',
  recordKicker: '§ The record',
  recordTitle: 'The manifesto states. The record proves.',
  recordIntro:
    'Two lines run through the last three decades. One builds the cage: the letters and laws deciding who may think with what. One beats the drum: ramparts held, weights set free, coalitions forming. Every entry is dated, sourced, and yours to verify.',
  recordFilterLabel: 'Filter the record',
  recordFilterAll: 'all',
  recordFilterCage: 'the cage',
  recordFilterDrum: 'the drum',
  recordLegend: 'control advances stay grey. liberation carries the light.',
  recordContinues: 'the record continues',
  recordUpdated: 'updated',
  recordLaw: 'every entry carries a primary source · nothing from memory',
  linkSpec: 'Read the spec →',
  linkGithub: 'Star on GitHub →',
  linkBack: '← Back to site',
}

const FR: ManifestoCopy = {
  path: '/fr/manifesto',
  bcp47: 'fr',
  ogLocale: 'fr_FR',
  label: 'FR',
  htmlTitle: 'Manifeste · Nika',
  metaDescription:
    'Le tambour de la libération. Pourquoi vos workflows doivent tourner sur votre machine, avec n’importe quel modèle, sans que personne d’autre que vous puisse les éteindre.',
  ogDescription: 'Le tambour de la libération · des workflows IA souverains, à vous.',
  ogAlt: 'Manifeste Nika · le tambour de la libération. N’importe quel modèle, votre mémoire, à vous.',
  kicker: '§ Le manifeste · 2026',
  title: ['Le tambour', 'de la libération.'],
  sub: 'Une intelligence dont on ne peut pas vous couper l’accès.',
  stamp: 'Écrit le jour où l’on a posé un interrupteur sur l’intelligence.',
  lore1:
    'Nika porte le nom du dieu-soleil de la libération : le tambour qui change la peur en rire et libère ceux qu’on avait laissés à la porte.',
  lore2: 'Chaque exécution d’un workflow est un battement de ce tambour.',
  friday: [
    'Un vendredi après-midi, par une simple lettre, l’intelligence la plus capable de la Terre a été coupée pour la plupart des habitants de la Terre. ',
    { fg: 'Pas supprimée. Pas cassée. Révoquée.' },
    ' Un gouvernement a décidé qui avait le droit de penser avec elle, et du jour au lendemain, nous autres avons été mis à la porte d’un outil sur lequel nous avions bâti nos vies.',
  ],
  statement1: 'C’est le moment où le débat a pris fin.',
  realProblem: [
    'Le vrai problème n’a jamais été de savoir ',
    { em: 'quel' },
    ' labo est en tête. C’est ',
    { fg: 'qui contrôle l’accès à l’intelligence' },
    ' :',
  ],
  stack: ['modèles', 'mémoire', 'contexte', 'workflows', 'agents', 'outils'],
  rented: [
    'Toute votre pile cognitive. Si tout cela vit derrière des fournisseurs fermés, ce n’est pas à vous. C’est ',
    { fg: 'loué' },
    '. Et ce qui est loué peut être renchéri, verrouillé ou éteint, par un conseil d’administration, un tribunal, une frontière, une lettre.',
  ],
  statement2: 'Nous refusons l’économie de l’abonnement pour la cognition.',
  agent: [
    'Et à mesure que ces outils se mettent à agir sur le monde, la même règle vaut pour ce qu’ils font, pas seulement pour l’endroit où ils tournent. ',
    { fg: 'Un agent ne devrait jamais agir depuis un prompt caché.' },
    ' Le plan qu’il s’apprête à exécuter devrait être un fichier qu’on peut lire, et relire avant qu’il n’agisse. Un pouvoir qu’on ne voit pas est un pouvoir qu’on ne contrôle pas.',
  ],
  openSource: [
    { fg: 'Il n’y a pas d’IA open source américaine. Il n’y a pas d’IA open source française.' },
    ' L’open source, c’est le savoir ouvert, l’infrastructure partagée, et le droit d’exécuter, d’étudier, de modifier et de posséder l’intelligence. Ne combattez pas la cage en la repeignant. Quittez-la.',
  ],
  statement3: 'La souveraineté pour tous, ou pour personne.',
  promisesKicker: '§ Ce que nous promettons',
  promisesTitle: 'Construit pour le jour où le robinet se ferme.',
  promises: [
    {
      n: '01',
      t: 'Liberté cognitive',
      d: 'Amenez n’importe quel modèle. Local, open-weight ou frontier. Interchangeable à volonté. Aucun labo n’est le mur porteur : si l’un disparaît demain, votre travail, lui, reste.',
    },
    {
      n: '02',
      t: 'Mémoire souveraine',
      d: 'Votre contexte, vos goûts, vos habitudes vivent sur votre matériel. Lisibles, exportables, effaçables, sans demander à personne. Jamais hébergés, jamais loués.',
    },
    {
      n: '03',
      t: 'Un travail qui survit',
      d: 'Le travail utile devient du source. Texte brut, versionné, rejouable. Encore à vous dans dix ans, sur une machine qui ne rend de comptes à personne.',
    },
    {
      n: '04',
      t: 'L’artisanat plutôt que la capture',
      d: 'La qualité plutôt que le volume. Moins, mais mieux. La licence rend la liberté structurelle, pas une faveur qu’on pourrait discrètement reprendre.',
    },
    {
      n: '05',
      t: 'Une galaxie, pas un monolithe',
      d: 'Aucun point unique que quiconque pourrait éteindre. Composable, plurielle, souveraine par construction.',
    },
  ],
  close: ['L’IA open source doit gagner.', 'Pas pour une nation. Pour tout le monde.'],
  drumline: 'Le tambour de la libération bat de plus en plus fort.',
  recordKicker: '§ Le registre',
  recordTitle: 'Le manifeste affirme. Le registre prouve.',
  recordIntro:
    'Deux lignes traversent les trois dernières décennies. L’une bâtit la cage : les lettres et les lois qui décident qui peut penser avec quoi. L’autre bat le tambour : des remparts qui tiennent, des poids libérés, des coalitions qui se forment. Chaque entrée est datée, sourcée, et vérifiable par vous.',
  recordFilterLabel: 'Filtrer le registre',
  recordFilterAll: 'tout',
  recordFilterCage: 'la cage',
  recordFilterDrum: 'le tambour',
  recordLegend: 'le contrôle reste gris. la libération porte la lumière.',
  recordContinues: 'le registre continue',
  recordUpdated: 'mis à jour',
  recordLaw: 'chaque entrée porte une source primaire · rien de mémoire',
  linkSpec: 'Lire la spec →',
  linkGithub: 'Star sur GitHub →',
  linkBack: '← Retour au site',
}

const ES: ManifestoCopy = {
  path: '/es/manifesto',
  bcp47: 'es',
  ogLocale: 'es_ES',
  label: 'ES',
  htmlTitle: 'Manifiesto · Nika',
  metaDescription:
    'El tambor de la liberación. Por qué tus workflows deben correr en tu máquina, con cualquier modelo, sin que nadie más que tú pueda apagarlos.',
  ogDescription: 'El tambor de la liberación · workflows de IA soberanos, tuyos.',
  ogAlt: 'Manifiesto de Nika · el tambor de la liberación. Cualquier modelo, tu memoria, tuyo.',
  kicker: '§ El manifiesto · 2026',
  title: ['El tambor', 'de la liberación.'],
  sub: 'Inteligencia de la que nadie puede dejarte fuera.',
  stamp: 'Escrito el día en que la inteligencia recibió un interruptor de apagado.',
  lore1:
    'Nika lleva el nombre del dios sol de la liberación: el tambor que convierte el miedo en risa y libera a quienes habían quedado fuera.',
  lore2: 'Cada ejecución de un workflow es un latido de ese tambor.',
  friday: [
    'Un viernes por la tarde, con una sola carta, la inteligencia más capaz de la Tierra fue apagada para la mayoría de los habitantes de la Tierra. ',
    { fg: 'No borrada. No rota. Revocada.' },
    ' Un gobierno decidió quién tenía permiso para pensar con ella y, de la noche a la mañana, el resto quedamos fuera de una herramienta sobre la que habíamos construido nuestras vidas.',
  ],
  statement1: 'Este es el momento en que terminó el debate.',
  realProblem: [
    'El verdadero problema nunca fue ',
    { em: 'qué' },
    ' laboratorio va en cabeza. Es ',
    { fg: 'quién controla el acceso a la inteligencia' },
    ':',
  ],
  stack: ['modelos', 'memoria', 'contexto', 'workflows', 'agentes', 'herramientas'],
  rented: [
    'Toda tu pila cognitiva. Si todo eso vive detrás de proveedores cerrados, no es tuyo. Está ',
    { fg: 'alquilado' },
    '. Y lo alquilado puede encarecerse, bloquearse o apagarse: por un consejo, un tribunal, una frontera, una carta.',
  ],
  statement2: 'Rechazamos la economía de suscripción para la cognición.',
  agent: [
    'Y a medida que estas herramientas empiezan a actuar sobre el mundo, la misma regla vale para lo que hacen, no solo para dónde corren. ',
    { fg: 'Un agente nunca debería actuar desde un prompt oculto.' },
    ' El plan que pretende ejecutar debería ser un archivo que puedas leer, y revisable antes de que actúe. El poder que no puedes ver es poder que no controlas.',
  ],
  openSource: [
    { fg: 'No existe una IA open source estadounidense. No existe una IA open source francesa.' },
    ' El open source es conocimiento abierto, infraestructura compartida y el derecho a ejecutar, estudiar, modificar y poseer la inteligencia. No combatas la jaula repintándola. Sal de ella.',
  ],
  statement3: 'Soberanía para todos, o para nadie.',
  promisesKicker: '§ Lo que prometemos',
  promisesTitle: 'Construido para el día en que se cierre el grifo.',
  promises: [
    {
      n: '01',
      t: 'Libertad cognitiva',
      d: 'Trae cualquier modelo. Local, open-weight o frontier. Intercambiable a voluntad. Ningún laboratorio es el muro de carga: si uno desaparece mañana, tu trabajo no.',
    },
    {
      n: '02',
      t: 'Memoria soberana',
      d: 'Tu contexto, tu gusto, tus hábitos viven en tu hardware. Legibles, exportables, borrables, sin pedir permiso a nadie. Nunca alojados, nunca en alquiler.',
    },
    {
      n: '03',
      t: 'Trabajo que sobrevive',
      d: 'El trabajo útil se convierte en código fuente. Texto plano, versionado, reproducible. Tuyo dentro de diez años, en una máquina que nunca llama a casa.',
    },
    {
      n: '04',
      t: 'Oficio sobre captura',
      d: 'Calidad sobre volumen. Menos, pero mejor. La licencia hace la libertad estructural, no un favor que pudiéramos retirar en silencio.',
    },
    {
      n: '05',
      t: 'Una galaxia, no un monolito',
      d: 'Ningún punto único que alguien pueda apagar. Componible, plural, soberana por diseño.',
    },
  ],
  close: ['La IA open source debe ganar.', 'No para una nación. Para todos.'],
  drumline: 'El tambor de la liberación suena cada vez más fuerte.',
  recordKicker: '§ El registro',
  recordTitle: 'El manifiesto afirma. El registro prueba.',
  recordIntro:
    'Dos líneas recorren las últimas tres décadas. Una construye la jaula: las cartas y las leyes que deciden quién puede pensar con qué. La otra toca el tambor: murallas que resisten, pesos liberados, coaliciones que se forman. Cada entrada está fechada, con su fuente, y puedes verificarla tú mismo.',
  recordFilterLabel: 'Filtrar el registro',
  recordFilterAll: 'todo',
  recordFilterCage: 'la jaula',
  recordFilterDrum: 'el tambor',
  recordLegend: 'el control queda en gris. la liberación lleva la luz.',
  recordContinues: 'el registro continúa',
  recordUpdated: 'actualizado',
  recordLaw: 'cada entrada lleva una fuente primaria · nada de memoria',
  linkSpec: 'Leer la spec →',
  linkGithub: 'Star en GitHub →',
  linkBack: '← Volver al sitio',
}

const ZH_HANS: ManifestoCopy = {
  path: '/zh-hans/manifesto',
  bcp47: 'zh-Hans',
  ogLocale: 'zh_CN',
  label: '中文',
  htmlTitle: '宣言 · Nika',
  metaDescription:
    '解放之鼓。为什么你的 workflows 应该跑在你自己的机器上，用任何模型，且除了你没有人能把它们关掉。',
  ogDescription: '解放之鼓 · 主权 AI workflows，属于你。',
  ogAlt: 'Nika 宣言 · 解放之鼓。任何模型，你的记忆，属于你。',
  kicker: '§ 宣言 · 2026',
  title: ['解放', '之鼓。'],
  sub: '一种没有人能把你拒之门外的智能。',
  stamp: '写于智能被装上开关的那一天。',
  lore1: 'Nika 得名于司掌解放的太阳神：那面把恐惧化作笑声、解放被拒之门外者的鼓。',
  lore2: '每一次 workflow 的运行，都是这面鼓的一次击响。',
  friday: [
    '一个星期五的下午，仅凭一纸公文，地球上最强大的智能对地球上大多数人关闭了。',
    { fg: '不是删除。不是故障。是撤销。' },
    '一个政府决定了谁有资格用它思考；一夜之间，我们其余的人被锁在了一件早已融入生活的工具之外。',
  ],
  statement1: '就在这一刻，争论结束了。',
  realProblem: [
    '真正的问题从来不是',
    { em: '哪家' },
    '实验室领先，而是',
    { fg: '谁控制着通往智能的入口' },
    '：',
  ],
  stack: ['模型', '记忆', '上下文', 'workflows', '智能体', '工具'],
  rented: [
    '你的整个认知栈。如果这一切都活在封闭的供应商身后，它就不属于你，而是',
    { fg: '租来的' },
    '。租来的东西可以被涨价、被锁死、被关停：一纸董事会决议、一道法庭判决、一条国界、一封信，就够了。',
  ],
  statement2: '我们拒绝认知的订阅经济。',
  agent: [
    '当这些工具开始对世界采取行动，同样的规则也适用于它们做什么，而不只是它们在哪里运行。',
    { fg: '智能体绝不该依据一段隐藏的 prompt 行事。' },
    '它将要执行的计划，应当是一个你读得懂的文件，并且在它行动之前可以审阅。看不见的权力，就是你控制不了的权力。',
  ],
  openSource: [
    { fg: '不存在美国的开源 AI，也不存在法国的开源 AI。' },
    '开源意味着开放的知识、共享的基础设施，以及运行、研究、修改并拥有智能的权利。不要靠重新粉刷牢笼来对抗牢笼。离开它。',
  ],
  statement3: '主权属于所有人，否则不属于任何人。',
  promisesKicker: '§ 我们的承诺',
  promisesTitle: '为水龙头关上的那一天而造。',
  promises: [
    {
      n: '01',
      t: '认知自由',
      d: '带上任何模型。本地的、开放权重的、前沿的，随时可换。没有哪家实验室是承重墙：哪怕明天有一家消失，你的工作依然还在。',
    },
    {
      n: '02',
      t: '主权记忆',
      d: '你的上下文、你的品味、你的习惯，都活在你自己的硬件上。可读、可导出、可删除，无需向任何人请示。永不托管，永不出租。',
    },
    {
      n: '03',
      t: '留得下来的工作',
      d: '有用的工作沉淀为源码。纯文本、有版本、可重放。十年后依然属于你，跑在一台从不向外报信的机器上。',
    },
    {
      n: '04',
      t: '匠心不被俘获',
      d: '质量高于数量。更少，但更好。许可证让自由成为结构本身，而不是一份可以被悄悄收回的恩惠。',
    },
    {
      n: '05',
      t: '是星系，不是巨石',
      d: '没有任何人能一键关停的单点。可组合、多元、生而主权。',
    },
  ],
  close: ['开源 AI 必须赢。', '不为某个国家，为所有人。'],
  drumline: '解放之鼓，正越敲越响。',
  recordKicker: '§ 记录',
  recordTitle: '宣言陈述。记录证明。',
  recordIntro:
    '过去三十年，有两条线贯穿始终。一条在筑笼：决定谁能用什么思考的信函与法律。一条在击鼓：守住的壁垒、放开的权重、正在成形的联盟。每一条目都有日期与一手来源，供你亲自查证。',
  recordFilterLabel: '筛选记录',
  recordFilterAll: '全部',
  recordFilterCage: '笼子',
  recordFilterDrum: '鼓',
  recordLegend: '控制保持灰色。解放携带光。',
  recordContinues: '记录仍在继续',
  recordUpdated: '更新于',
  recordLaw: '每条目均有一手来源 · 绝不凭记忆书写',
  linkSpec: '阅读规范 →',
  linkGithub: '在 GitHub 加星 →',
  linkBack: '← 返回主站',
}


const DE: ManifestoCopy = {
  path: '/de/manifesto',
  bcp47: 'de',
  ogLocale: 'de_DE',
  label: 'DE',
  htmlTitle: 'Manifest · Nika',
  metaDescription:
    'Die Trommel der Befreiung. Warum deine Workflows auf deiner Maschine laufen sollten, mit jedem Modell, und niemand außer dir sie abschalten kann.',
  ogDescription: 'Die Trommel der Befreiung · souveräne KI-Workflows, die dir gehören.',
  ogAlt: 'Nika-Manifest · die Trommel der Befreiung. Jedes Modell, dein Gedächtnis, deins.',
  kicker: '§ Das Manifest · 2026',
  title: ['Die Trommel', 'der Befreiung.'],
  sub: 'Intelligenz, von der dich niemand aussperren kann.',
  stamp: 'Geschrieben an dem Tag, an dem die Intelligenz einen Aus-Schalter bekam.',
  lore1:
    'Nika trägt den Namen des Sonnengottes der Befreiung: der Trommel, die Angst in Lachen verwandelt und die befreit, die ausgesperrt waren.',
  lore2: 'Jeder Workflow-Lauf ist ein Schlag dieser Trommel.',
  friday: [
    'An einem Freitagnachmittag, durch einen einzigen Brief, wurde die fähigste Intelligenz der Erde für die meisten Menschen der Erde abgeschaltet. ',
    { fg: 'Nicht gelöscht. Nicht kaputt. Widerrufen.' },
    ' Eine Regierung entschied, wer mit ihr denken durfte, und über Nacht standen wir Übrigen vor der Tür eines Werkzeugs, auf dem wir unser Leben aufgebaut hatten.',
  ],
  statement1: 'Das ist der Moment, in dem die Debatte endete.',
  realProblem: [
    'Das eigentliche Problem war nie, ',
    { em: 'welches' },
    ' Labor vorne liegt. Sondern ',
    { fg: 'wer den Zugang zur Intelligenz kontrolliert' },
    ':',
  ],
  stack: ['Modelle', 'Gedächtnis', 'Kontext', 'Workflows', 'Agenten', 'Werkzeuge'],
  rented: [
    'Dein gesamter kognitiver Stack. Wenn all das hinter geschlossenen Anbietern lebt, gehört es nicht dir. Es ist ',
    { fg: 'gemietet' },
    '. Und was gemietet ist, kann verteuert, gesperrt oder abgeschaltet werden: durch einen Vorstand, ein Gericht, eine Grenze, einen Brief.',
  ],
  statement2: 'Wir verweigern uns der Abo-Ökonomie für Kognition.',
  agent: [
    'Und während diese Werkzeuge beginnen, auf die Welt zu wirken, gilt dieselbe Regel für das, was sie tun, nicht nur dafür, wo sie laufen. ',
    { fg: 'Ein Agent sollte niemals aus einem versteckten Prompt heraus handeln.' },
    ' Der Plan, den er ausführen will, sollte eine Datei sein, die du lesen kannst, prüfbar, bevor er handelt. Macht, die du nicht sehen kannst, ist Macht, die du nicht kontrollierst.',
  ],
  openSource: [
    { fg: 'Es gibt keine amerikanische Open-Source-KI. Es gibt keine französische Open-Source-KI.' },
    ' Open Source ist offenes Wissen, geteilte Infrastruktur und das Recht, Intelligenz auszuführen, zu studieren, zu verändern und zu besitzen. Bekämpfe den Käfig nicht, indem du ihn neu streichst. Verlass ihn.',
  ],
  statement3: 'Souveränität für alle, oder für niemanden.',
  promisesKicker: '§ Was wir versprechen',
  promisesTitle: 'Gebaut für den Tag, an dem der Hahn zugedreht wird.',
  promises: [
    {
      n: '01',
      t: 'Kognitive Freiheit',
      d: 'Bring jedes Modell mit. Lokal, open-weight oder frontier. Jederzeit austauschbar. Kein Labor ist die tragende Wand: Verschwindet morgen eines, bleibt deine Arbeit.',
    },
    {
      n: '02',
      t: 'Souveränes Gedächtnis',
      d: 'Dein Kontext, dein Geschmack, deine Gewohnheiten leben auf deiner Hardware. Lesbar, exportierbar, löschbar, ohne jemanden zu fragen. Nie gehostet, nie zur Miete.',
    },
    {
      n: '03',
      t: 'Arbeit, die bleibt',
      d: 'Nützliche Arbeit wird zu Quelltext. Klartext, versioniert, wiederholbar. In zehn Jahren noch deine, auf einer Maschine, die nie nach Hause telefoniert.',
    },
    {
      n: '04',
      t: 'Handwerk statt Vereinnahmung',
      d: 'Qualität vor Menge. Weniger, aber besser. Die Lizenz macht die Freiheit strukturell, nicht zu einem Gefallen, den man leise zurücknehmen könnte.',
    },
    {
      n: '05',
      t: 'Eine Galaxie, kein Monolith',
      d: 'Kein einzelner Punkt, den irgendjemand abschalten kann. Komponierbar, plural, souverän von Grund auf.',
    },
  ],
  close: ['Open-Source-KI muss gewinnen.', 'Nicht für eine Nation. Für alle.'],
  drumline: 'Die Trommel der Befreiung wird lauter.',
  recordKicker: '§ Das Register',
  recordTitle: 'Das Manifest behauptet. Das Register beweist.',
  recordIntro:
    'Zwei Linien ziehen sich durch die letzten drei Jahrzehnte. Eine baut den Käfig: die Briefe und Gesetze, die entscheiden, wer womit denken darf. Die andere schlägt die Trommel: Wälle, die halten, freigegebene Gewichte, Koalitionen im Entstehen. Jeder Eintrag ist datiert, belegt und von dir überprüfbar.',
  recordFilterLabel: 'Das Register filtern',
  recordFilterAll: 'alles',
  recordFilterCage: 'der Käfig',
  recordFilterDrum: 'die Trommel',
  recordLegend: 'Kontrolle bleibt grau. Befreiung trägt das Licht.',
  recordContinues: 'das Register geht weiter',
  recordUpdated: 'aktualisiert',
  recordLaw: 'jeder Eintrag trägt eine Primärquelle · nichts aus dem Gedächtnis',
  linkSpec: 'Spec lesen →',
  linkGithub: 'Star auf GitHub →',
  linkBack: '← Zurück zur Seite',
}

const PT_BR: ManifestoCopy = {
  path: '/pt-br/manifesto',
  bcp47: 'pt-BR',
  ogLocale: 'pt_BR',
  label: 'PT',
  htmlTitle: 'O Manifesto · Nika',
  metaDescription:
    'O tambor da libertação. Por que seus workflows devem rodar na sua máquina, com qualquer modelo, sem que ninguém além de você possa desligá-los.',
  ogDescription: 'O tambor da libertação · workflows de IA soberanos, seus.',
  ogAlt: 'Manifesto da Nika · o tambor da libertação. Qualquer modelo, sua memória, seu.',
  kicker: '§ O manifesto · 2026',
  title: ['O tambor', 'da libertação.'],
  sub: 'Inteligência da qual ninguém pode te trancar do lado de fora.',
  stamp: 'Escrito no dia em que a inteligência ganhou um botão de desligar.',
  lore1:
    'Nika leva o nome do deus-sol da libertação: o tambor que transforma medo em riso e liberta os que ficaram do lado de fora.',
  lore2: 'Cada execução de um workflow é uma batida desse tambor.',
  friday: [
    'Numa sexta-feira à tarde, com uma única carta, a inteligência mais capaz da Terra foi desligada para a maioria das pessoas da Terra. ',
    { fg: 'Não apagada. Não quebrada. Revogada.' },
    ' Um governo decidiu quem podia pensar com ela e, da noite para o dia, o resto de nós ficou trancado fora de uma ferramenta sobre a qual vínhamos construindo nossas vidas.',
  ],
  statement1: 'Este é o momento em que a discussão acabou.',
  realProblem: [
    'O problema real nunca foi ',
    { em: 'qual' },
    ' laboratório está na frente. É ',
    { fg: 'quem controla o acesso à inteligência' },
    ':',
  ],
  stack: ['modelos', 'memória', 'contexto', 'workflows', 'agentes', 'ferramentas'],
  rented: [
    'Toda a sua pilha cognitiva. Se tudo isso vive atrás de fornecedores fechados, não é seu. É ',
    { fg: 'alugado' },
    '. E o que é alugado pode ficar mais caro, ser travado ou desligado: por um conselho, um tribunal, uma fronteira, uma carta.',
  ],
  statement2: 'Recusamos a economia de assinatura para a cognição.',
  agent: [
    'E à medida que essas ferramentas começam a agir sobre o mundo, a mesma regra vale para o que elas fazem, não só para onde rodam. ',
    { fg: 'Um agente nunca deveria agir a partir de um prompt oculto.' },
    ' O plano que ele pretende executar deveria ser um arquivo que você consegue ler, revisável antes de agir. Poder que você não vê é poder que você não controla.',
  ],
  openSource: [
    { fg: 'Não existe IA open source americana. Não existe IA open source francesa.' },
    ' Open source é conhecimento aberto, infraestrutura compartilhada e o direito de executar, estudar, modificar e possuir inteligência. Não lute contra a jaula repintando-a. Saia dela.',
  ],
  statement3: 'Soberania para todos, ou para ninguém.',
  promisesKicker: '§ O que prometemos',
  promisesTitle: 'Feito para o dia em que a torneira fechar.',
  promises: [
    {
      n: '01',
      t: 'Liberdade cognitiva',
      d: 'Traga qualquer modelo. Local, open-weight ou frontier. Trocável à vontade. Nenhum laboratório é a parede-mestra: se um sumir amanhã, o seu trabalho não some.',
    },
    {
      n: '02',
      t: 'Memória soberana',
      d: 'Seu contexto, seu gosto, seus hábitos vivem no seu hardware. Legíveis, exportáveis, apagáveis, sem pedir a ninguém. Nunca hospedados, nunca para alugar.',
    },
    {
      n: '03',
      t: 'Trabalho que sobrevive',
      d: 'Trabalho útil vira código-fonte. Texto puro, versionado, reproduzível. Ainda seu daqui a dez anos, numa máquina que nunca liga para casa.',
    },
    {
      n: '04',
      t: 'Ofício acima de captura',
      d: 'Qualidade acima de volume. Menos, porém melhor. A licença torna a liberdade estrutural, não um favor que poderíamos retirar em silêncio.',
    },
    {
      n: '05',
      t: 'Uma galáxia, não um monólito',
      d: 'Nenhum ponto único que alguém possa desligar. Componível, plural, soberana por construção.',
    },
  ],
  close: ['A IA open source precisa vencer.', 'Não por uma nação. Por todos.'],
  drumline: 'O tambor da libertação está batendo cada vez mais alto.',
  recordKicker: '§ O registro',
  recordTitle: 'O manifesto afirma. O registro prova.',
  recordIntro:
    'Duas linhas atravessam as últimas três décadas. Uma constrói a jaula: as cartas e as leis que decidem quem pode pensar com o quê. A outra bate o tambor: muralhas que resistem, pesos libertados, coalizões se formando. Cada entrada é datada, com fonte, e você mesmo pode verificar.',
  recordFilterLabel: 'Filtrar o registro',
  recordFilterAll: 'tudo',
  recordFilterCage: 'a jaula',
  recordFilterDrum: 'o tambor',
  recordLegend: 'o controle fica em cinza. a libertação carrega a luz.',
  recordContinues: 'o registro continua',
  recordUpdated: 'atualizado',
  recordLaw: 'cada entrada carrega uma fonte primária · nada de memória',
  linkSpec: 'Ler a spec →',
  linkGithub: 'Star no GitHub →',
  linkBack: '← Voltar ao site',
}

const JA: ManifestoCopy = {
  path: '/ja/manifesto',
  bcp47: 'ja',
  ogLocale: 'ja_JP',
  label: '日本語',
  htmlTitle: 'マニフェスト · Nika',
  metaDescription:
    '解放の太鼓。あなたの workflows があなたのマシンで、任意のモデルで動くべき理由。そして、あなた以外の誰にも止められないべき理由。',
  ogDescription: '解放の太鼓 · 主権ある AI workflows を、あなたの手に。',
  ogAlt: 'Nika マニフェスト · 解放の太鼓。任意のモデル、あなたの記憶、あなたのもの。',
  kicker: '§ マニフェスト · 2026',
  title: ['解放の', '太鼓。'],
  sub: '誰にも締め出されることのない知能。',
  stamp: '知能にキルスイッチが付いた日に書かれた。',
  lore1:
    'Nika の名は、解放を司る太陽神に由来する。恐怖を笑いに変え、締め出された者たちを解き放つ太鼓だ。',
  lore2: 'workflow が走るたび、その太鼓がひとつ鳴る。',
  friday: [
    'ある金曜日の午後、たった一通の書簡で、地球上で最も優れた知能が、地球上のほとんどの人々に対して停止された。',
    { fg: '消されたのではない。壊れたのでもない。取り消されたのだ。' },
    'ひとつの政府が、誰がそれで考えてよいかを決めた。一夜にして、残された私たちは、生活を築いてきた道具から締め出された。',
  ],
  statement1: 'この瞬間、議論は終わった。',
  realProblem: [
    '本当の問題は、',
    { em: 'どの' },
    'ラボが先頭にいるかではない。',
    { fg: '誰が知能への入口を握っているか' },
    'だ：',
  ],
  stack: ['モデル', '記憶', 'コンテキスト', 'workflows', 'エージェント', 'ツール'],
  rented: [
    'あなたの認知スタックのすべて。それが閉じたプロバイダーの向こうにあるなら、それはあなたのものではない。',
    { fg: '借り物' },
    'だ。借り物は、値上げされ、締め付けられ、止められる。取締役会、法廷、国境、一通の手紙で。',
  ],
  statement2: '私たちは、認知のサブスクリプション経済を拒む。',
  agent: [
    'そして道具が世界に働きかけ始めた今、同じ原則は、どこで動くかだけでなく、何をするかにも及ぶ。',
    { fg: 'エージェントは、隠されたプロンプトから行動してはならない。' },
    '実行しようとする計画は、読める形のファイルであるべきで、動く前に確認できるべきだ。見えない力は、制御できない力だ。',
  ],
  openSource: [
    { fg: 'アメリカのオープンソースAIも、フランスのオープンソースAIも存在しない。' },
    'オープンソースとは、開かれた知、共有されるインフラ、そして知能を動かし、調べ、改変し、所有する権利のことだ。檻を塗り替えて戦うな。檻を出ろ。',
  ],
  statement3: '主権はすべての人のものか、さもなくば誰のものでもない。',
  promisesKicker: '§ 私たちの約束',
  promisesTitle: '蛇口が閉まる日のために。',
  promises: [
    {
      n: '01',
      t: '認知の自由',
      d: 'どんなモデルでも持ち込める。ローカルでも、open-weight でも、フロンティアでも。いつでも差し替えられる。どのラボも耐力壁ではない。明日ひとつ消えても、あなたの仕事は消えない。',
    },
    {
      n: '02',
      t: '主権のある記憶',
      d: 'あなたのコンテキストも、好みも、習慣も、あなたのハードウェアに住む。読めて、書き出せて、消せる。誰にも許可を求めずに。ホストされず、貸し出されもしない。',
    },
    {
      n: '03',
      t: '生き残る仕事',
      d: '有用な仕事はソースになる。プレーンテキストで、バージョン管理され、再実行できる。十年後もあなたのもので、外に何も報告しないマシンの上で動く。',
    },
    {
      n: '04',
      t: '囲い込みより職人技',
      d: '量より質。少なく、しかし良く。ライセンスが自由を構造にする。静かに取り上げられる恩恵にはしない。',
    },
    {
      n: '05',
      t: 'モノリスではなく銀河',
      d: '誰かが止められる単一障害点は存在しない。組み合わせ可能で、多様で、設計から主権的だ。',
    },
  ],
  close: ['オープンソースAIが勝たねばならない。', 'ひとつの国のためではなく、すべての人のために。'],
  drumline: '解放の太鼓は、鳴り止むどころか大きくなっていく。',
  recordKicker: '§ 記録',
  recordTitle: '宣言は語る。記録は証明する。',
  recordIntro:
    'この三十年を、二本の線が貫いている。ひとつは檻を築く線。誰が何で考えてよいかを決める書簡と法律だ。もうひとつは太鼓を打つ線。持ちこたえた砦、解き放たれた重み、生まれつつある連合。すべての項目に日付と一次資料があり、あなた自身が検証できる。',
  recordFilterLabel: '記録を絞り込む',
  recordFilterAll: 'すべて',
  recordFilterCage: '檻',
  recordFilterDrum: '太鼓',
  recordLegend: '支配は灰色のまま。解放だけが光をまとう。',
  recordContinues: '記録は続く',
  recordUpdated: '更新',
  recordLaw: 'すべての項目に一次資料・記憶からは何も書かない',
  linkSpec: '仕様を読む →',
  linkGithub: 'GitHub でスターを →',
  linkBack: '← サイトに戻る',
}


const KO: ManifestoCopy = {
  path: '/ko/manifesto',
  bcp47: 'ko',
  ogLocale: 'ko_KR',
  label: '한국어',
  htmlTitle: '선언문 · Nika',
  metaDescription:
    '해방의 북. 당신의 workflows가 당신의 기계에서, 어떤 모델로든 돌아가야 하는 이유. 그리고 당신 외에는 누구도 그것을 끌 수 없어야 하는 이유.',
  ogDescription: '해방의 북 · 주권 있는 AI workflows, 당신의 것.',
  ogAlt: 'Nika 선언문 · 해방의 북. 어떤 모델이든, 당신의 기억, 당신의 것.',
  kicker: '§ 선언문 · 2026',
  title: ['해방의', '북.'],
  sub: '누구도 당신을 밖으로 밀어낼 수 없는 지능.',
  stamp: '지능에 킬 스위치가 달린 날에 쓰였다.',
  lore1:
    'Nika라는 이름은 해방을 관장하는 태양신에게서 왔다. 두려움을 웃음으로 바꾸고, 문밖에 갇힌 이들을 풀어주는 북이다.',
  lore2: 'workflow가 한 번 돌 때마다, 그 북이 한 번 울린다.',
  friday: [
    '어느 금요일 오후, 단 한 통의 공문으로, 지구에서 가장 뛰어난 지능이 지구 대부분의 사람들에게 꺼졌다. ',
    { fg: '삭제된 것이 아니다. 고장난 것도 아니다. 회수된 것이다.' },
    ' 한 정부가 누가 그것으로 생각해도 되는지를 정했고, 하룻밤 사이에 나머지 우리는 삶을 쌓아온 도구 밖으로 밀려났다.',
  ],
  statement1: '바로 이 순간, 논쟁은 끝났다.',
  realProblem: [
    '진짜 문제는 ',
    { em: '어느' },
    ' 연구소가 앞서 있느냐가 아니었다. ',
    { fg: '누가 지능으로 가는 입구를 쥐고 있느냐' },
    '다:',
  ],
  stack: ['모델', '기억', '컨텍스트', 'workflows', '에이전트', '도구'],
  rented: [
    '당신의 인지 스택 전부. 그 모든 것이 닫힌 공급자 뒤에 산다면, 그것은 당신 것이 아니다. ',
    { fg: '빌린 것' },
    '이다. 빌린 것은 값이 오르고, 잠기고, 꺼질 수 있다. 이사회 하나, 법원 하나, 국경 하나, 편지 한 통이면 충분하다.',
  ],
  statement2: '우리는 인지의 구독 경제를 거부한다.',
  agent: [
    '그리고 이 도구들이 세계에 행동을 가하기 시작한 지금, 같은 원칙은 그것이 어디서 도는지만이 아니라 무엇을 하는지에도 적용된다. ',
    { fg: '에이전트는 숨겨진 prompt로 행동해서는 안 된다.' },
    ' 실행하려는 계획은 당신이 읽을 수 있는 파일이어야 하고, 행동하기 전에 검토할 수 있어야 한다. 보이지 않는 권력은 통제할 수 없는 권력이다.',
  ],
  openSource: [
    { fg: '미국의 오픈소스 AI도, 프랑스의 오픈소스 AI도 존재하지 않는다.' },
    ' 오픈소스란 열린 지식, 함께 쓰는 인프라, 그리고 지능을 돌리고, 들여다보고, 고치고, 소유할 권리다. 새로 칠한다고 새장과 싸우지 마라. 새장을 떠나라.',
  ],
  statement3: '주권은 모두의 것이거나, 누구의 것도 아니다.',
  promisesKicker: '§ 우리의 약속',
  promisesTitle: '수도꼭지가 잠기는 날을 위해 만들었다.',
  promises: [
    {
      n: '01',
      t: '인지의 자유',
      d: '어떤 모델이든 가져와라. 로컬, open-weight, 프런티어. 언제든 갈아끼울 수 있다. 어느 연구소도 내력벽이 아니다. 내일 하나가 사라져도, 당신의 일은 사라지지 않는다.',
    },
    {
      n: '02',
      t: '주권 있는 기억',
      d: '당신의 컨텍스트, 취향, 습관은 당신의 하드웨어에 산다. 읽을 수 있고, 내보낼 수 있고, 지울 수 있다. 누구의 허락도 없이. 호스팅되지 않고, 임대되지 않는다.',
    },
    {
      n: '03',
      t: '살아남는 일',
      d: '쓸모 있는 일은 소스가 된다. 평문으로, 버전이 붙고, 다시 돌릴 수 있다. 십 년 뒤에도 당신 것이고, 밖으로 아무것도 알리지 않는 기계 위에서 돈다.',
    },
    {
      n: '04',
      t: '포획이 아니라 장인정신',
      d: '양보다 질. 더 적게, 그러나 더 좋게. 라이선스가 자유를 구조로 만든다. 조용히 거둬갈 수 있는 호의로 두지 않는다.',
    },
    {
      n: '05',
      t: '모놀리스가 아니라 은하',
      d: '누구도 끌 수 없는 단일 지점은 없다. 조합 가능하고, 다원적이며, 설계부터 주권적이다.',
    },
  ],
  close: ['오픈소스 AI가 이겨야 한다.', '한 나라를 위해서가 아니라, 모두를 위해서.'],
  drumline: '해방의 북소리가 점점 커지고 있다.',
  recordKicker: '§ 기록',
  recordTitle: '선언은 말한다. 기록은 증명한다.',
  recordIntro:
    '지난 삼십 년을 두 개의 선이 가로지른다. 하나는 새장을 짓는 선. 누가 무엇으로 생각해도 되는지를 정하는 서한과 법이다. 다른 하나는 북을 울리는 선. 버텨낸 방벽, 풀려난 가중치, 만들어지는 연합. 모든 항목에는 날짜와 일차 출처가 있고, 당신이 직접 검증할 수 있다.',
  recordFilterLabel: '기록 필터',
  recordFilterAll: '전체',
  recordFilterCage: '새장',
  recordFilterDrum: '북',
  recordLegend: '통제는 회색으로 남는다. 해방만이 빛을 지닌다.',
  recordContinues: '기록은 계속된다',
  recordUpdated: '갱신',
  recordLaw: '모든 항목은 일차 출처를 지닌다 · 기억으로 쓰지 않는다',
  linkSpec: '스펙 읽기 →',
  linkGithub: 'GitHub에서 스타 →',
  linkBack: '← 사이트로 돌아가기',
}

/** EN first (x-default), then the alternates in switcher order. */
export const MANIFESTO_LOCALES: ManifestoCopy[] = [EN, FR, ES, DE, PT_BR, JA, KO, ZH_HANS]

export function manifestoCopyFor(pathname: string): ManifestoCopy {
  const clean = pathname.replace(/\/+$/, '') || '/'
  return MANIFESTO_LOCALES.find((l) => l.path === clean) ?? EN
}
