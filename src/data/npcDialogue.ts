import type { DialogueNode } from '../japanese/types';

export const NPC_DIALOGUE: Record<string, DialogueNode> = {
  elder: {
    id: 'elder_intro',
    speaker: '先生',
    speakerWordId: 'w_sensei',
    lines: [
      {
        japanese: 'こんにちは！',
        english: 'Hello!',
        segments: [
          { text: 'こんにちは', wordId: 'w_konnichiwa', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
      {
        japanese: '私は先生です。',
        english: 'I am the teacher.',
        segments: [
          { text: '私', wordId: 'w_watashi', type: 'word' },
          { text: 'は', type: 'particle' },
          { text: '先生', wordId: 'w_sensei', type: 'word' },
          { text: 'です。', type: 'grammar' },
        ],
      },
      {
        japanese: 'ここは変です。',
        english: 'This place is strange.',
        segments: [
          { text: 'ここ', wordId: 'w_koko', type: 'word' },
          { text: 'は', type: 'particle' },
          { text: '変', wordId: 'w_hen', type: 'word' },
          { text: 'です。', type: 'grammar' },
        ],
      },
      {
        japanese: '大丈夫ですか？',
        english: 'Are you okay?',
        segments: [
          { text: '大丈夫', wordId: 'w_daijoubu', type: 'word' },
          { text: 'です', type: 'grammar' },
          { text: 'か', type: 'particle' },
          { text: '？', type: 'punctuation' },
        ],
      },
    ],
  },

  suspicious_clerk: {
    id: 'suspicious_clerk_intro',
    speaker: '???',
    combatTrigger: 'bakemono_clerk',
    lines: [
      {
        japanese: 'いらっしゃいませ...',
        english: 'Welcome...',
        segments: [
          { text: 'いらっしゃいませ', wordId: 'w_irasshaimase', type: 'word' },
          { text: '...', type: 'punctuation' },
        ],
      },
      {
        japanese: '...変だ！',
        english: '...Something is strange!',
        segments: [
          { text: '...', type: 'punctuation' },
          { text: '変', wordId: 'w_hen', type: 'word' },
          { text: 'だ！', type: 'grammar' },
        ],
      },
    ],
  },

  okaasan_welcome: {
    id: 'okaasan_welcome',
    speaker: '田中さん',
    quizId: 'quiz_fixer_greeting',
    quizBonus: 50,
    lines: [
      {
        japanese: 'こんにちは！ ようこそ 化け町へ！',
        english: 'Hello! Welcome to Bakemachi!',
        segments: [
          { text: 'こんにちは', wordId: 'w_konnichiwa', type: 'word' },
          { text: '！ ', type: 'punctuation' },
          { text: 'ようこそ', wordId: 'w_youkoso', type: 'word' },
          { text: ' ', type: 'punctuation' },
          { text: '化け町', wordId: 'w_bakemachi', type: 'word' },
          { text: 'へ！', type: 'particle' },
        ],
      },
    ],
    choices: [
      {
        japanese: 'こんにちは',
        english: 'Hello',
        segments: [{ text: 'こんにちは', wordId: 'w_konnichiwa', type: 'word' }],
        leadsTo: 'okaasan_greeting_correct',
        isCorrect: true,
      },
      {
        japanese: 'さようなら',
        english: 'Goodbye',
        segments: [{ text: 'さようなら', wordId: 'w_sayounara', type: 'word' }],
        leadsTo: 'okaasan_welcome',
        isCorrect: false,
      },
    ],
  },

  okaasan_greeting_correct: {
    id: 'okaasan_greeting_correct',
    speaker: '田中さん',
    lines: [
      {
        japanese: 'すごい！ You know にほんご! だいじょうぶ ですか？',
        english: 'Amazing! You know Japanese! Are you okay?',
        segments: [
          { text: 'すごい！', type: 'punctuation' },
          { text: ' You know ', type: 'punctuation' },
          { text: 'にほんご', wordId: 'w_nihongo', type: 'word' },
          { text: '! ', type: 'punctuation' },
          { text: 'だいじょうぶ', wordId: 'w_daijoubu', type: 'word' },
          { text: ' ですか？', type: 'grammar' },
        ],
      },
    ],
  },

  okaasan_waiting: {
    id: 'okaasan_waiting',
    speaker: '田中さん',
    lines: [
      {
        japanese: 'This way! だいじょうぶ, follow me!',
        english: "This way! It's okay, follow me!",
        segments: [
          { text: 'This way! ', type: 'punctuation' },
          { text: 'だいじょうぶ', wordId: 'w_daijoubu', type: 'word' },
          { text: ', follow me!', type: 'punctuation' },
        ],
      },
    ],
  },

  food_stall: {
    id: 'food_stall',
    speaker: '店員',
    menuTrigger: 'food_stall',
    lines: [
      {
        japanese: 'いらっしゃいませ！',
        english: 'Welcome!',
        segments: [
          { text: 'いらっしゃいませ', wordId: 'w_irasshaimase', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
      {
        japanese: 'なにが いい？',
        english: 'What would you like?',
        segments: [
          { text: 'なにが', type: 'grammar' },
          { text: ' ', type: 'punctuation' },
          { text: 'いい', type: 'grammar' },
          { text: '？', type: 'punctuation' },
        ],
      },
    ],
  },

  vending_machine: {
    id: 'vending_machine',
    speaker: 'じどうはんばいき',
    menuTrigger: 'vending_machine',
    lines: [
      {
        japanese: '... ピッ!',
        english: '... Beep!',
        segments: [
          { text: '... ピッ!', type: 'punctuation' },
        ],
      },
    ],
  },

  douzo_response: {
    id: 'douzo_response',
    speaker: '',
    lines: [
      {
        japanese: 'どうぞ！',
        english: 'Here you go!',
        segments: [
          { text: 'どうぞ', wordId: 'w_douzo', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
    ],
  },

  player_hungry: {
    id: 'player_hungry',
    speaker: 'あなた',
    lines: [
      {
        japanese: 'おなか すいた！',
        english: "I'm hungry!",
        segments: [
          { text: 'おなか', wordId: 'w_onaka', type: 'word' },
          { text: ' ', type: 'punctuation' },
          { text: 'すいた', wordId: 'w_suita', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
    ],
  },

  fixer_food_prompt: {
    id: 'fixer_food_prompt',
    speaker: '田中さん',
    lines: [
      {
        japanese: 'Before we go to おうち, let\'s grab たべもの and 飲み物!',
        english: "Before we go home, let's grab food and a drink!",
        segments: [
          { text: "Before we go to ", type: 'punctuation' },
          { text: 'おうち', wordId: 'w_ouchi', type: 'word' },
          { text: ", let's grab ", type: 'punctuation' },
          { text: 'たべもの', wordId: 'w_tabemono', type: 'word' },
          { text: ' and ', type: 'punctuation' },
          { text: '飲み物', wordId: 'w_nomimono', type: 'word' },
          { text: '!', type: 'punctuation' },
        ],
      },
      {
        japanese: 'Get 飲み物 from the vending machines, and たべもの from the food stall!',
        english: 'Get a drink from the vending machines, and food from the food stall!',
        segments: [
          { text: 'Get ', type: 'punctuation' },
          { text: '飲み物', wordId: 'w_nomimono', type: 'word' },
          { text: ' from the vending machines, and ', type: 'punctuation' },
          { text: 'たべもの', wordId: 'w_tabemono', type: 'word' },
          { text: ' from the food stall!', type: 'punctuation' },
        ],
      },
    ],
  },

  fixer_food_reminder: {
    id: 'fixer_food_reminder',
    speaker: '田中さん',
    lines: [
      {
        japanese: 'We still need たべもの and 飲み物! Go check the food stall and vending machines!',
        english: "We still need food and a drink! Go check the food stall and vending machines!",
        segments: [
          { text: 'We still need ', type: 'punctuation' },
          { text: 'たべもの', wordId: 'w_tabemono', type: 'word' },
          { text: ' and ', type: 'punctuation' },
          { text: '飲み物', wordId: 'w_nomimono', type: 'word' },
          { text: '! Go check the food stall and vending machines!', type: 'punctuation' },
        ],
      },
    ],
  },

  fixer_food_done: {
    id: 'fixer_food_done',
    speaker: '田中さん',
    lines: [
      {
        japanese: 'よし！ Let\'s go to おうち!',
        english: "Great! Let's go home!",
        segments: [
          { text: 'よし！ ', type: 'punctuation' },
          { text: "Let's go to ", type: 'punctuation' },
          { text: 'おうち', wordId: 'w_ouchi', type: 'word' },
          { text: '!', type: 'punctuation' },
        ],
      },
    ],
  },

  fixer_omiyage_prompt: {
    id: 'fixer_omiyage_prompt',
    speaker: '田中さん',
    lines: [
      {
        japanese: 'よし！ Before we go, let\'s get おみやげ for せんせい!',
        english: "Great! Before we go, let's get a souvenir for sensei!",
        segments: [
          { text: 'よし！ ', type: 'punctuation' },
          { text: "Before we go, let's get ", type: 'punctuation' },
          { text: 'おみやげ', wordId: 'w_omiyage', type: 'word' },
          { text: ' for ', type: 'punctuation' },
          { text: 'せんせい', wordId: 'w_sensei', type: 'word' },
          { text: '!', type: 'punctuation' },
        ],
      },
      {
        japanese: 'Go to the おみやげ shop over there!',
        english: 'Go to the souvenir shop over there!',
        segments: [
          { text: 'Go to the ', type: 'punctuation' },
          { text: 'おみやげ', wordId: 'w_omiyage', type: 'word' },
          { text: ' shop over there!', type: 'punctuation' },
        ],
      },
    ],
  },

  fixer_omiyage_reminder: {
    id: 'fixer_omiyage_reminder',
    speaker: '田中さん',
    lines: [
      {
        japanese: 'Don\'t forget the おみやげ for せんせい!',
        english: "Don't forget the souvenir for sensei!",
        segments: [
          { text: "Don't forget the ", type: 'punctuation' },
          { text: 'おみやげ', wordId: 'w_omiyage', type: 'word' },
          { text: ' for ', type: 'punctuation' },
          { text: 'せんせい', wordId: 'w_sensei', type: 'word' },
          { text: '!', type: 'punctuation' },
        ],
      },
    ],
  },

  omiyage_vendor: {
    id: 'omiyage_vendor',
    speaker: 'てんいん',
    scrambleTrigger: 'omiyage_shop',
    lines: [
      {
        japanese: 'いらっしゃいませ！',
        english: 'Welcome!',
        segments: [
          { text: 'いらっしゃいませ', wordId: 'w_irasshaimase', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
      {
        japanese: 'おみやげ ですか？ We have many おみやげ for your せんせい!',
        english: 'A souvenir? We have many souvenirs for your teacher!',
        segments: [
          { text: 'おみやげ', wordId: 'w_omiyage', type: 'word' },
          { text: ' ', type: 'punctuation' },
          { text: 'ですか', type: 'particle' },
          { text: '？ We have many ', type: 'punctuation' },
          { text: 'おみやげ', wordId: 'w_omiyage', type: 'word' },
          { text: ' for your ', type: 'punctuation' },
          { text: 'せんせい', wordId: 'w_sensei', type: 'word' },
          { text: '!', type: 'punctuation' },
        ],
      },
      {
        japanese: 'But... I only speak にほんご! Can you order in にほんご?',
        english: 'But... I only speak Japanese! Can you order in Japanese?',
        segments: [
          { text: 'But... I only speak ', type: 'punctuation' },
          { text: 'にほんご', wordId: 'w_nihongo', type: 'word' },
          { text: '! Can you order in ', type: 'punctuation' },
          { text: 'にほんご', wordId: 'w_nihongo', type: 'word' },
          { text: '?', type: 'punctuation' },
        ],
      },
      {
        japanese: 'Put the ことば in the right order! がんばって！',
        english: 'Put the words in the right order! Good luck!',
        segments: [
          { text: 'Put the ', type: 'punctuation' },
          { text: 'ことば', wordId: 'w_kotoba', type: 'word' },
          { text: ' in the right order! ', type: 'punctuation' },
          { text: 'がんばって', wordId: 'w_ganbatte', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
    ],
  },

  omiyage_vendor_generic: {
    id: 'omiyage_vendor_generic',
    speaker: 'てんいん',
    lines: [
      {
        japanese: 'いらっしゃいませ！おみやげ たくさん ありますよ！',
        english: 'Welcome! We have lots of souvenirs!',
        segments: [
          { text: 'いらっしゃいませ', wordId: 'w_irasshaimase', type: 'word' },
          { text: '！', type: 'punctuation' },
          { text: 'おみやげ', wordId: 'w_omiyage', type: 'word' },
          { text: ' ', type: 'punctuation' },
          { text: 'たくさん', type: 'word' },
          { text: ' ', type: 'punctuation' },
          { text: 'ありますよ', type: 'grammar' },
          { text: '！', type: 'punctuation' },
        ],
      },
    ],
  },

  fixer_omiyage_done: {
    id: 'fixer_omiyage_done',
    speaker: '田中さん',
    lines: [
      {
        japanese: 'すごい！ せんせい will love the おみやげ!',
        english: 'Amazing! Sensei will love the souvenir!',
        segments: [
          { text: 'すごい！ ', type: 'punctuation' },
          { text: 'せんせい', wordId: 'w_sensei', type: 'word' },
          { text: ' will love the ', type: 'punctuation' },
          { text: 'おみやげ', wordId: 'w_omiyage', type: 'word' },
          { text: '!', type: 'punctuation' },
        ],
      },
    ],
  },

  // ── Gift shop vendor ──

  gift_shop_generic: {
    id: 'gift_shop_generic',
    speaker: 'てんいん',
    lines: [
      {
        japanese: 'いらっしゃいませ！',
        english: 'Welcome!',
        segments: [
          { text: 'いらっしゃいませ', wordId: 'w_irasshaimase', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
    ],
  },

  gift_shop_active: {
    id: 'gift_shop_active',
    speaker: 'てんいん',
    scrambleTrigger: 'sister_present',
    lines: [
      {
        japanese: 'いらっしゃいませ！おもちゃ ですか？',
        english: 'Welcome! Looking for a toy?',
        segments: [
          { text: 'いらっしゃいませ', wordId: 'w_irasshaimase', type: 'word' },
          { text: '！', type: 'punctuation' },
          { text: 'おもちゃ', wordId: 'w_omocha', type: 'word' },
          { text: ' ', type: 'punctuation' },
          { text: 'ですか', type: 'grammar' },
          { text: '？', type: 'punctuation' },
        ],
      },
      {
        japanese: 'Put the ことば in the right order! がんばって！',
        english: 'Put the words in the right order! Good luck!',
        segments: [
          { text: 'Put the ', type: 'punctuation' },
          { text: 'ことば', wordId: 'w_kotoba', type: 'word' },
          { text: ' in the right order! ', type: 'punctuation' },
          { text: 'がんばって', wordId: 'w_ganbatte', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
    ],
  },

  // ── Postcard shop vendor ──

  postcard_shop_generic: {
    id: 'postcard_shop_generic',
    speaker: 'てんいん',
    lines: [
      {
        japanese: 'いらっしゃいませ！',
        english: 'Welcome!',
        segments: [
          { text: 'いらっしゃいませ', wordId: 'w_irasshaimase', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
    ],
  },

  postcard_shop_active: {
    id: 'postcard_shop_active',
    speaker: 'てんいん',
    readingTrigger: 'postcard_grandma',
    lines: [
      {
        japanese: 'いらっしゃいませ！はがき ですか？',
        english: 'Welcome! Looking for a postcard?',
        segments: [
          { text: 'いらっしゃいませ', wordId: 'w_irasshaimase', type: 'word' },
          { text: '！', type: 'punctuation' },
          { text: 'はがき', wordId: 'w_hagaki', type: 'word' },
          { text: ' ', type: 'punctuation' },
          { text: 'ですか', type: 'grammar' },
          { text: '？', type: 'punctuation' },
        ],
      },
    ],
  },

  // ── Town flavor NPCs ──

  cart_woman: {
    id: 'cart_woman',
    speaker: 'おばさん',
    lines: [
      {
        japanese: 'こんにちは! Nice day for a walk!',
        english: 'Hello! Nice day for a walk!',
        segments: [
          { text: 'こんにちは', wordId: 'w_konnichiwa', type: 'word' },
          { text: '! Nice day for a walk!', type: 'punctuation' },
        ],
      },
    ],
  },

  npc_businessman: {
    id: 'npc_businessman',
    speaker: 'サラリーマン',
    lines: [
      {
        japanese: 'すみません, I\'m in a hurry!',
        english: 'Excuse me, I\'m in a hurry!',
        segments: [
          { text: 'すみません', wordId: 'w_sumimasen', type: 'word' },
          { text: ", I'm in a hurry!", type: 'punctuation' },
        ],
      },
    ],
  },

  npc_businesswoman: {
    id: 'npc_businesswoman',
    speaker: 'OL',
    lines: [
      {
        japanese: 'This まち is pretty, isn\'t it?',
        english: 'This town is pretty, isn\'t it?',
        segments: [
          { text: 'This ', type: 'punctuation' },
          { text: 'まち', wordId: 'w_machi', type: 'word' },
          { text: " is pretty, isn't it?", type: 'punctuation' },
        ],
      },
    ],
  },

  npc_phone_person: {
    id: 'npc_phone_person',
    speaker: '...',
    lines: [
      {
        japanese: '... はい... はい... はい...',
        english: '... yes... yes... yes...',
        segments: [
          { text: '... ', type: 'punctuation' },
          { text: 'はい', wordId: 'w_hai', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'はい', wordId: 'w_hai', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'はい', wordId: 'w_hai', type: 'word' },
          { text: '...', type: 'punctuation' },
        ],
      },
    ],
  },

  npc_phone_person2: {
    id: 'npc_phone_person2',
    speaker: '...',
    lines: [
      {
        japanese: '... ちょっとまって...',
        english: '... wait a moment...',
        segments: [
          { text: '... ', type: 'punctuation' },
          { text: 'ちょっとまって', wordId: 'w_chotto_matte', type: 'word' },
          { text: '...', type: 'punctuation' },
        ],
      },
    ],
  },

  npc_student: {
    id: 'npc_student',
    speaker: 'がくせい',
    speakerWordId: 'w_gakusei',
    lines: [
      {
        japanese: 'がっこう is so boring today...',
        english: 'School is so boring today...',
        segments: [
          { text: 'がっこう', wordId: 'w_gakkou', type: 'word' },
          { text: ' is so boring today...', type: 'punctuation' },
        ],
      },
    ],
  },

  shopkeeper: {
    id: 'shopkeeper_intro',
    speaker: '店員',
    lines: [
      {
        japanese: 'いらっしゃいませ！',
        english: 'Welcome!',
        segments: [
          { text: 'いらっしゃいませ', wordId: 'w_irasshaimase', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
      {
        japanese: 'ここはコンビニです。',
        english: 'This is a convenience store.',
        segments: [
          { text: 'ここ', wordId: 'w_koko', type: 'word' },
          { text: 'は', type: 'particle' },
          { text: 'コンビニ', wordId: 'w_konbini', type: 'word' },
          { text: 'です。', type: 'grammar' },
        ],
      },
      {
        japanese: '水がありますよ。',
        english: 'We have water.',
        segments: [
          { text: '水', wordId: 'w_mizu', type: 'word' },
          { text: 'が', type: 'particle' },
          { text: 'あります', type: 'grammar' },
          { text: 'よ。', type: 'punctuation' },
        ],
      },
    ],
  },

  // Cowlick-glasses NPC — first combat encounter
  npc_cowlick_glasses: {
    id: 'npc_cowlick_glasses',
    speaker: 'メガネくん',
    lines: [
      {
        japanese: 'あ... すみません... あたま が...',
        english: 'Ah... excuse me... my head...',
        segments: [
          { text: 'あ... ', type: 'punctuation' },
          { text: 'すみません', wordId: 'w_sumimasen', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'あたま', wordId: 'w_atama', type: 'word' },
          { text: ' が', type: 'particle' },
          { text: '...', type: 'punctuation' },
        ],
      },
      {
        japanese: 'にほんご... にほんご...！！',
        english: 'Japanese... Japanese...!!',
        segments: [
          { text: 'にほんご', wordId: 'w_nihongo', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'にほんご', wordId: 'w_nihongo', type: 'word' },
          { text: '...！！', type: 'punctuation' },
        ],
      },
      {
        japanese: '＊ばけもの に なった！＊',
        english: '*He turned into a monster!*',
        segments: [
          { text: '＊', type: 'punctuation' },
          { text: 'ばけもの', wordId: 'w_bakemono', type: 'word' },
          { text: ' に ', type: 'particle' },
          { text: 'なった', wordId: 'w_natta', type: 'word' },
          { text: '！＊', type: 'punctuation' },
        ],
      },
    ],
    nextDialogue: {
      id: 'player_cowlick_reaction',
      speaker: 'あなた',
      speakerPortrait: '/assets/ui/portraits/main-character-male-scared.png',
      combatTrigger: 'cowlick_npc',
      lines: [
        {
          japanese: 'ばけもの！？ たたかう！',
          english: 'A monster!? I have to fight!',
          segments: [
            { text: 'ばけもの', wordId: 'w_bakemono', type: 'word' },
            { text: '！？ ', type: 'punctuation' },
            { text: 'たたかう', wordId: 'w_tatakau', type: 'word' },
            { text: '！', type: 'punctuation' },
          ],
        },
      ],
    },
  },

  // Post-battle: cowlick NPC doesn't remember what happened
  post_battle_cowlick_npc: {
    id: 'post_battle_cowlick_npc',
    speaker: 'メガネくん',
    lines: [
      {
        japanese: '...あれ？ ここ は どこ？',
        english: '...Huh? Where am I?',
        segments: [
          { text: '...', type: 'punctuation' },
          { text: 'あれ', wordId: 'w_are', type: 'word' },
          { text: '？ ', type: 'punctuation' },
          { text: 'ここ', wordId: 'w_koko', type: 'word' },
          { text: ' は ', type: 'particle' },
          { text: 'どこ', wordId: 'w_doko', type: 'word' },
          { text: '？', type: 'punctuation' },
        ],
      },
      {
        japanese: 'ぼく... なに を してた...？',
        english: "I... what was I doing...?",
        segments: [
          { text: 'ぼく', wordId: 'w_boku', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'なに', wordId: 'w_nani', type: 'word' },
          { text: ' を ', type: 'particle' },
          { text: 'してた', wordId: 'w_shiteta', type: 'word' },
          { text: '...？', type: 'punctuation' },
        ],
      },
      {
        japanese: 'すみません... あたま が いたい です...',
        english: 'Sorry... my head hurts...',
        segments: [
          { text: 'すみません', wordId: 'w_sumimasen', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'あたま', wordId: 'w_atama', type: 'word' },
          { text: ' が ', type: 'particle' },
          { text: 'いたい', wordId: 'w_itai', type: 'word' },
          { text: ' です...', type: 'grammar' },
        ],
      },
    ],
  },

  tanaka_lets_go_home: {
    id: 'tanaka_lets_go_home',
    speaker: '田中さん',
    lines: [
      {
        japanese: 'よし！ かえりましょう！',
        english: "Alright! Let's go home!",
        segments: [
          { text: 'よし！ ', type: 'punctuation' },
          { text: 'かえりましょう', wordId: 'w_kaerimashou', type: 'word' },
          { text: '！', type: 'punctuation' },
        ],
      },
    ],
  },

  // Cutscene version of cowlick transformation — no combatTrigger (cutscene handles combat manually)
  cowlick_cutscene_transform: {
    id: 'cowlick_cutscene_transform',
    speaker: 'メガネくん',
    lines: [
      {
        japanese: 'あ... すみません... あたま が...',
        english: 'Ah... excuse me... my head...',
        segments: [
          { text: 'あ... ', type: 'punctuation' },
          { text: 'すみません', wordId: 'w_sumimasen', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'あたま', wordId: 'w_atama', type: 'word' },
          { text: ' が', type: 'particle' },
          { text: '...', type: 'punctuation' },
        ],
      },
      {
        japanese: 'にほんご... にほんご...！！',
        english: 'Japanese... Japanese...!!',
        segments: [
          { text: 'にほんご', wordId: 'w_nihongo', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'にほんご', wordId: 'w_nihongo', type: 'word' },
          { text: '...！！', type: 'punctuation' },
        ],
      },
      {
        japanese: '＊ばけもの に なった！＊',
        english: '*He turned into a monster!*',
        segments: [
          { text: '＊', type: 'punctuation' },
          { text: 'ばけもの', wordId: 'w_bakemono', type: 'word' },
          { text: ' に ', type: 'particle' },
          { text: 'なった', wordId: 'w_natta', type: 'word' },
          { text: '！＊', type: 'punctuation' },
        ],
      },
    ],
    nextDialogue: {
      id: 'player_cowlick_cutscene_reaction',
      speaker: 'あなた',
      speakerPortrait: '/assets/ui/portraits/main-character-male-scared.png',
      // NO combatTrigger — cutscene handles combat manually
      lines: [
        {
          japanese: 'ばけもの！？ たたかう！',
          english: 'A monster!? I have to fight!',
          segments: [
            { text: 'ばけもの', wordId: 'w_bakemono', type: 'word' },
            { text: '！？ ', type: 'punctuation' },
            { text: 'たたかう', wordId: 'w_tatakau', type: 'word' },
            { text: '！', type: 'punctuation' },
          ],
        },
      ],
    },
  },

  player_what_was_that: {
    id: 'player_what_was_that',
    speaker: 'あなた',
    speakerPortrait: '/assets/ui/portraits/main-character-male-scared.png',
    lines: [
      {
        japanese: '...なに？ いま の は なに？',
        english: '...What? What was that just now?',
        segments: [
          { text: '...', type: 'punctuation' },
          { text: 'なに', wordId: 'w_nani', type: 'word' },
          { text: '？ ', type: 'punctuation' },
          { text: 'いま', wordId: 'w_ima', type: 'word' },
          { text: ' の は ', type: 'particle' },
          { text: 'なに', wordId: 'w_nani', type: 'word' },
          { text: '？', type: 'punctuation' },
        ],
      },
    ],
  },

  // ── Phone call scene (triggers after cowlick fight at station exits) ──

  phone_call_thought: {
    id: 'phone_call_thought',
    speaker: 'You',
    speakerPortrait: '/assets/ui/portraits/main-character-male.png',
    lines: [
      {
        japanese: 'Oh wait... I should call Mom and let her know I made it here safely.',
        english: 'Oh wait... I should call Mom and let her know I made it here safely.',
        segments: [
          { text: 'Oh wait... I should call Mom and let her know I made it here safely.', type: 'punctuation' },
        ],
      },
    ],
    nextDialogue: {
      id: 'phone_call_mom_1',
      speaker: 'Mom',
      lines: [
        {
          japanese: 'Hello? Sweetie! Did you make it to Bakemachi safely?',
          english: 'Hello? Sweetie! Did you make it to Bakemachi safely?',
          segments: [
            { text: 'Hello? Sweetie! Did you make it to Bakemachi safely?', type: 'punctuation' },
          ],
        },
      ],
      nextDialogue: {
        id: 'phone_call_player_1',
        speaker: 'You',
        lines: [
          {
            japanese: "Yeah! I'm at the train station. Tanaka-san picked me up — he's really nice!",
            english: "Yeah! I'm at the train station. Tanaka-san picked me up — he's really nice!",
            segments: [
              { text: "Yeah! I'm at the train station. Tanaka-san picked me up \u2014 he's really nice!", type: 'punctuation' },
            ],
          },
        ],
        nextDialogue: {
          id: 'phone_call_mom_2',
          speaker: 'Mom',
          lines: [
            {
              japanese: "Oh wonderful! And how's the town?",
              english: "Oh wonderful! And how's the town?",
              segments: [
                { text: "Oh wonderful! And how's the town?", type: 'punctuation' },
              ],
            },
          ],
          nextDialogue: {
            id: 'phone_call_player_2',
            speaker: 'You',
            lines: [
              {
                japanese: "It's... interesting. Seems really nice, actually. A little strange, though...",
                english: "It's... interesting. Seems really nice, actually. A little strange, though...",
                segments: [
                  { text: "It's... interesting. Seems really nice, actually. A little strange, though...", type: 'punctuation' },
                ],
              },
            ],
            nextDialogue: {
              id: 'phone_call_mom_3',
              speaker: 'Mom',
              lines: [
                {
                  japanese: 'Strange? How so?',
                  english: 'Strange? How so?',
                  segments: [
                    { text: 'Strange? How so?', type: 'punctuation' },
                  ],
                },
              ],
              nextDialogue: {
                id: 'phone_call_player_3',
                speaker: 'You',
                lines: [
                  {
                    japanese: "I can't really explain it. Just... different. But in a good way, I think!",
                    english: "I can't really explain it. Just... different. But in a good way, I think!",
                    segments: [
                      { text: "I can't really explain it. Just... different. But in a good way, I think!", type: 'punctuation' },
                    ],
                  },
                ],
                nextDialogue: {
                  id: 'phone_call_mom_4',
                  speaker: 'Mom',
                  lines: [
                    {
                      japanese: "Well, you'll be meeting your sensei soon. I'm sure they'll help you settle in.",
                      english: "Well, you'll be meeting your sensei soon. I'm sure they'll help you settle in.",
                      segments: [
                        { text: "Well, you'll be meeting your sensei soon. I'm sure they'll help you settle in.", type: 'punctuation' },
                      ],
                    },
                  ],
                  nextDialogue: {
                    id: 'phone_call_mom_5',
                    speaker: 'Mom',
                    lines: [
                      {
                        japanese: 'Oh! Before I forget — your sister has been bugging me non-stop. You know how she is about those monster collecting games...',
                        english: 'Oh! Before I forget — your sister has been bugging me non-stop. You know how she is about those monster collecting games...',
                        segments: [
                          { text: 'Oh! Before I forget \u2014 your sister has been bugging me non-stop. You know how she is about those monster collecting games...', type: 'punctuation' },
                        ],
                      },
                    ],
                    nextDialogue: {
                      id: 'phone_call_mom_6',
                      speaker: 'Mom',
                      lines: [
                        {
                          japanese: 'Can you find her something from one of the shops there? A keychain or a toy or something?',
                          english: 'Can you find her something from one of the shops there? A keychain or a toy or something?',
                          segments: [
                            { text: 'Can you find her something from one of the shops there? A keychain or a toy or something?', type: 'punctuation' },
                          ],
                        },
                      ],
                      nextDialogue: {
                        id: 'phone_call_player_4',
                        speaker: 'You',
                        lines: [
                          {
                            japanese: "Haha, of course. I'll see what I can find.",
                            english: "Haha, of course. I'll see what I can find.",
                            segments: [
                              { text: "Haha, of course. I'll see what I can find.", type: 'punctuation' },
                            ],
                          },
                        ],
                        nextDialogue: {
                          id: 'phone_call_mom_7',
                          speaker: 'Mom',
                          lines: [
                            {
                              japanese: "And your grandmother would love a postcard! She's so proud of you for studying abroad.",
                              english: "And your grandmother would love a postcard! She's so proud of you for studying abroad.",
                              segments: [
                                { text: "And your grandmother would love a postcard! She's so proud of you for studying abroad.", type: 'punctuation' },
                              ],
                            },
                          ],
                          nextDialogue: {
                            id: 'phone_call_player_5',
                            speaker: 'You',
                            lines: [
                              {
                                japanese: "I'll pick one out for her. There's got to be a shop around here somewhere.",
                                english: "I'll pick one out for her. There's got to be a shop around here somewhere.",
                                segments: [
                                  { text: "I'll pick one out for her. There's got to be a shop around here somewhere.", type: 'punctuation' },
                                ],
                              },
                            ],
                            nextDialogue: {
                              id: 'phone_call_mom_8',
                              speaker: 'Mom',
                              lines: [
                                {
                                  japanese: 'Take care, sweetie. Call me anytime, okay?',
                                  english: 'Take care, sweetie. Call me anytime, okay?',
                                  segments: [
                                    { text: 'Take care, sweetie. Call me anytime, okay?', type: 'punctuation' },
                                  ],
                                },
                              ],
                              nextDialogue: {
                                id: 'phone_call_player_6',
                                speaker: 'You',
                                lines: [
                                  {
                                    japanese: 'Thanks, Mom. Love you!',
                                    english: 'Thanks, Mom. Love you!',
                                    segments: [
                                      { text: 'Thanks, Mom. Love you!', type: 'punctuation' },
                                    ],
                                  },
                                ],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// ── Random Encounter Dialogues ──

/** Pre-combat dialogue variations for random encounters.
 *  A random person approaches the player and transforms into a monster.
 *  The OverworldScene picks one at random and starts combat after it ends. */
export const RANDOM_ENCOUNTER_PRE_COMBAT: DialogueNode[] = [
  // Variation 1: headache
  {
    id: 'random_pre_combat_1',
    speaker: '???',
    lines: [
      {
        japanese: 'あ... すみません...',
        english: 'Ah... excuse me...',
        segments: [
          { text: 'あ... ', type: 'punctuation' },
          { text: 'すみません', wordId: 'w_sumimasen', type: 'word' },
          { text: '...', type: 'punctuation' },
        ],
      },
      {
        japanese: 'あたま が... にほんご...！',
        english: 'My head... Japanese...!',
        segments: [
          { text: 'あたま', type: 'word' },
          { text: ' が... ', type: 'punctuation' },
          { text: 'にほんご', wordId: 'w_nihongo', type: 'word' },
          { text: '...！', type: 'punctuation' },
        ],
      },
      {
        japanese: '＊ばけもの に なった！＊',
        english: '*Turned into a monster!*',
        segments: [
          { text: '＊', type: 'punctuation' },
          { text: 'ばけもの', wordId: 'w_bakemono', type: 'word' },
          { text: ' に ', type: 'punctuation' },
          { text: 'なった', type: 'word' },
          { text: '！＊', type: 'punctuation' },
        ],
      },
    ],
  },
  // Variation 2: lost
  {
    id: 'random_pre_combat_2',
    speaker: '???',
    lines: [
      {
        japanese: 'ここ は... どこ？',
        english: 'Where... is this?',
        segments: [
          { text: 'ここ', type: 'word' },
          { text: ' は... ', type: 'punctuation' },
          { text: 'どこ', type: 'word' },
          { text: '？', type: 'punctuation' },
        ],
      },
      {
        japanese: '＊ばけもの に なった！＊',
        english: '*Turned into a monster!*',
        segments: [
          { text: '＊', type: 'punctuation' },
          { text: 'ばけもの', wordId: 'w_bakemono', type: 'word' },
          { text: ' に ', type: 'punctuation' },
          { text: 'なった', type: 'word' },
          { text: '！＊', type: 'punctuation' },
        ],
      },
    ],
  },
  // Variation 3: sudden
  {
    id: 'random_pre_combat_3',
    speaker: '???',
    lines: [
      {
        japanese: 'すみません... ちょっと...',
        english: 'Excuse me... a moment...',
        segments: [
          { text: 'すみません', wordId: 'w_sumimasen', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'ちょっと', wordId: 'w_chotto_matte', type: 'word' },
          { text: '...', type: 'punctuation' },
        ],
      },
      {
        japanese: 'にほんご... にほんご...！！',
        english: 'Japanese... Japanese...!!',
        segments: [
          { text: 'にほんご', wordId: 'w_nihongo', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'にほんご', wordId: 'w_nihongo', type: 'word' },
          { text: '...！！', type: 'punctuation' },
        ],
      },
      {
        japanese: '＊ばけもの に なった！＊',
        english: '*Turned into a monster!*',
        segments: [
          { text: '＊', type: 'punctuation' },
          { text: 'ばけもの', wordId: 'w_bakemono', type: 'word' },
          { text: ' に ', type: 'punctuation' },
          { text: 'なった', type: 'word' },
          { text: '！＊', type: 'punctuation' },
        ],
      },
    ],
  },
  // Variation 4: polite then snap
  {
    id: 'random_pre_combat_4',
    speaker: '???',
    lines: [
      {
        japanese: 'こんにちは...',
        english: 'Hello...',
        segments: [
          { text: 'こんにちは', wordId: 'w_konnichiwa', type: 'word' },
          { text: '...', type: 'punctuation' },
        ],
      },
      {
        japanese: '...！ にほんご...！！',
        english: '...! Japanese...!!',
        segments: [
          { text: '...！ ', type: 'punctuation' },
          { text: 'にほんご', wordId: 'w_nihongo', type: 'word' },
          { text: '...！！', type: 'punctuation' },
        ],
      },
      {
        japanese: '＊ばけもの に なった！＊',
        english: '*Turned into a monster!*',
        segments: [
          { text: '＊', type: 'punctuation' },
          { text: 'ばけもの', wordId: 'w_bakemono', type: 'word' },
          { text: ' に ', type: 'punctuation' },
          { text: 'なった', type: 'word' },
          { text: '！＊', type: 'punctuation' },
        ],
      },
    ],
  },
];

/** Post-combat dialogue variations for random encounters.
 *  The NPC is confused after being defeated and returning to normal.
 *  The OverworldScene picks one at random to show after combat ends. */
export const RANDOM_ENCOUNTER_POST_COMBAT: DialogueNode[] = [
  // Variation 1
  {
    id: 'random_post_combat_1',
    speaker: '???',
    lines: [
      {
        japanese: '...あれ？ ここ は どこ？',
        english: '...Huh? Where am I?',
        segments: [
          { text: '...あれ？ ', type: 'punctuation' },
          { text: 'ここ', type: 'word' },
          { text: ' は ', type: 'punctuation' },
          { text: 'どこ', type: 'word' },
          { text: '？', type: 'punctuation' },
        ],
      },
    ],
  },
  // Variation 2
  {
    id: 'random_post_combat_2',
    speaker: '???',
    lines: [
      {
        japanese: 'いたい... なに が あった...？',
        english: 'Ouch... what happened...?',
        segments: [
          { text: 'いたい', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'なに', type: 'word' },
          { text: ' が あった...？', type: 'punctuation' },
        ],
      },
    ],
  },
  // Variation 3
  {
    id: 'random_post_combat_3',
    speaker: '???',
    lines: [
      {
        japanese: 'すみません... あたま が いたい...',
        english: 'Sorry... my head hurts...',
        segments: [
          { text: 'すみません', wordId: 'w_sumimasen', type: 'word' },
          { text: '... ', type: 'punctuation' },
          { text: 'あたま', type: 'word' },
          { text: ' が ', type: 'punctuation' },
          { text: 'いたい', type: 'word' },
          { text: '...', type: 'punctuation' },
        ],
      },
    ],
  },
  // Variation 4
  {
    id: 'random_post_combat_4',
    speaker: '???',
    lines: [
      {
        japanese: 'なに を してた...？',
        english: 'What was I doing...?',
        segments: [
          { text: 'なに', type: 'word' },
          { text: ' を してた...？', type: 'punctuation' },
        ],
      },
      {
        japanese: 'すみません...',
        english: 'Sorry...',
        segments: [
          { text: 'すみません', wordId: 'w_sumimasen', type: 'word' },
          { text: '...', type: 'punctuation' },
        ],
      },
    ],
  },
];
