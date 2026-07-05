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
  linkSpec: '阅读规范 →',
  linkGithub: '在 GitHub 加星 →',
  linkBack: '← 返回主站',
}

/** EN first (x-default), then the alternates in switcher order. */
export const MANIFESTO_LOCALES: ManifestoCopy[] = [EN, FR, ES, ZH_HANS]

export function manifestoCopyFor(pathname: string): ManifestoCopy {
  const clean = pathname.replace(/\/+$/, '') || '/'
  return MANIFESTO_LOCALES.find((l) => l.path === clean) ?? EN
}
