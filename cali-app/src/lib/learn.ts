/**
 * The Learn tab's library: real articles and videos from around the web, each with a
 * breakdown written for Cali in our own words, and a link back to the original.
 *
 * Images live in assets/learn and are mapped in src/components/learnMedia.ts so this
 * file stays plain data (and testable without a bundler).
 */

export type LearnCategory = 'basics' | 'pull' | 'balance' | 'statics' | 'core' | 'legs' | 'mobility' | 'recovery';

export const CATEGORIES: { id: LearnCategory; label: string; color: string }[] = [
  { id: 'basics', label: 'Basics', color: '#E4E4E6' },
  { id: 'pull', label: 'Pull', color: '#8FD3AE' },
  { id: 'balance', label: 'Balance', color: '#8AB4FF' },
  { id: 'statics', label: 'Statics', color: '#E3C77A' },
  { id: 'core', label: 'Core', color: '#B9A4FF' },
  { id: 'legs', label: 'Legs', color: '#FF9A8A' },
  { id: 'mobility', label: 'Mobility', color: '#6FD6C8' },
  { id: 'recovery', label: 'Recovery', color: '#F5B971' },
];

export const categoryOf = (id: LearnCategory) => CATEGORIES.find((c) => c.id === id)!;

export interface LearnStep {
  name: string;
  how: string;
  /** What "good enough to move on" looks like, when the source gives one. */
  pass?: string;
}

export interface Article {
  id: string;
  title: string;
  source: string;
  author: string;
  /** ISO date (or year-month) the source shows. */
  published: string;
  updated?: string;
  url: string;
  category: LearnCategory;
  /** Skill ladder in Cali this article feeds, if any. */
  skillId?: string;
  minutes: number;
  /** One-line hook shown on cards. */
  dek: string;
  /** "The short version": two or three short paragraphs. */
  summary: string[];
  stepsTitle?: string;
  steps?: LearnStep[];
  mistakes?: { name: string; fix: string }[];
  takeaways: string[];
  /** How to turn the article into a session in Cali. */
  caliTip: string;
  /** Caveats about the source itself (paywall, sponsored bits, age). */
  note?: string;
  /** Set when the cover photo is not the article's own (the original was removed). */
  photoCredit?: { text: string; license: string; url: string };
}

export interface Video {
  id: string;
  title: string;
  channel: string;
  /** "m:ss" or "h:mm:ss". */
  length: string;
  views: number;
  /** As YouTube showed it when we added the video. */
  age: string;
  category: LearnCategory;
  skillId?: string;
  short?: boolean;
}

export const ARTICLES: Article[] = [
  {
    id: 'pull-progression',
    title: 'Pull-up Progression: From Beginner to Advanced',
    source: 'FreeGym: The Bible of Calisthenics',
    author: 'Abhinav',
    published: '2023-08-20',
    url: 'https://bibleofcalisthenics.substack.com/p/pull-up-progression-from-beginner',
    category: 'pull',
    skillId: 'muscle-up',
    minutes: 9,
    dek: 'Five rungs from hanging still to your first clean pull-up, each with a test you pass before moving on.',
    summary: [
      'The pull-up is treated as a ladder, not a single test. You start by learning to hang with your shoulders switched on, then teach the shoulder blades to move on their own, then build strength on the way down before you ever need it on the way up.',
      'Every rung comes with a pass mark, and the guide asks you to hit it in three separate workouts before you climb. That repetition is the point: it stops one good day from rushing you into a step your shoulders are not ready for.',
    ],
    stepsTitle: 'The ladder',
    steps: [
      {
        name: 'Active hang',
        how: 'Hang with straight arms, then pull the shoulder blades down and together so your neck gets longer. Arms stay straight; your body rises a little.',
        pass: '30–60 s without shrugging, in 3 separate sessions',
      },
      {
        name: 'Scapular pull-ups',
        how: 'From the active hang, squeeze the shoulder blades down and back, then let them spread again. Elbows never bend. The movement is small; the feeling is the point.',
        pass: '3 × 8–12 controlled reps',
      },
      {
        name: 'Negative pull-ups',
        how: 'Jump or step to chin-over-bar, then lower yourself as slowly as you can to a full hang. Step back up and repeat.',
        pass: '5–7 s descents, rep after rep',
      },
      {
        name: 'Band-assisted pull-ups',
        how: 'Loop a band over the bar, put a knee or foot in it and do full reps. Move to thinner bands as you get stronger.',
        pass: '3 × 8 with a light band',
      },
      {
        name: 'The pull-up',
        how: 'Hands a bit wider than shoulders, start from the shoulder blades, pull until the chin clears the bar, lower all the way down.',
        pass: '3 × 10 with ease, then go weighted, archer or typewriter',
      },
    ],
    mistakes: [
      { name: 'Half reps', fix: 'Finish every rep at full arm extension. Partial reps hide the hardest part.' },
      { name: 'Kicking or swinging', fix: 'Start each rep from a still hang. Momentum is borrowed strength.' },
      { name: 'Dropping down', fix: 'Lower under control. Free-falling into the bottom is hard on elbows and shoulders.' },
      { name: 'Very wide grip', fix: 'A grip just outside the shoulders works the lats best; very wide grips strain the shoulder.' },
    ],
    takeaways: [
      'Grip giving out before your back? Add hangs before adding pull-up volume.',
      'Underhand and neutral grips are fine variations, not cheats.',
      'An arched upper back is not dangerous in a pull-up; there is no load pressing on the spine.',
      'Crossing your legs adds stability; straight legs make your core work harder.',
    ],
    caliTip: 'Your Muscle-up ladder starts with a 30 s dead hang and 10 Australian rows. Log hangs as a hold and Cali ticks the first step for you.',
  },
  {
    id: 'pull-cavaliere',
    title: 'Jeff Cavaliere’s 4-Step Beginner Plan for Pull-ups',
    source: 'Fitness Volt',
    author: 'Doug Murray',
    published: '2026-06-09',
    url: 'https://www.fitnessvolt.com/jeff-cavaliere-beginner-plan-for-pullups/',
    category: 'pull',
    skillId: 'muscle-up',
    minutes: 5,
    dek: 'A chair, a bar and 28 days: isometric holds at three heights to break your sticking point.',
    summary: [
      'ATHLEAN-X coach Jeff Cavaliere’s idea is simple: if you cannot move through a range, hold it. Isometric holds at different heights build strength exactly where the pull-up usually stalls, and you only need a chair to get into position.',
      'He claims the plan adds three to six reps in 28 days. Treat the number as a promise from a coach rather than a study result, but the logic of training every part of the range is sound.',
    ],
    stepsTitle: 'The four holds',
    steps: [
      { name: 'Top hold', how: 'Step up so your chin is over the bar, hold as long as you can, then fight the way down as slowly as possible. That counts as one rep.' },
      { name: 'Head-at-bar hold', how: 'From the edge of the chair, hold with your head against the bar, then lower slowly. Holding at a second angle spreads the strength you gain.' },
      { name: 'Mid-range hold', how: 'Hold with elbows bent somewhere between 90° and straight. This is the hardest part of the pull, where most people stall.' },
      { name: 'Scapular pull', how: 'From a dead hang, pull your shoulders away from your ears and slightly back. This gives the shoulder a stable base to pull from.' },
    ],
    takeaways: [
      'Isometrics only make you strong close to the angle you hold, so train several angles.',
      'The bottom of the pull, starting from a dead stop, is where most beginners are weakest.',
      'Every hold finishes with a slow lowering, so you train the eccentric too.',
    ],
    caliTip: 'Note your best top hold in seconds each session. When the slow negatives feel solid, log real Pull-up reps: your first one unlocks Muscle-up step 3.',
    note: 'A news write-up of a YouTube video. The 3–6 extra reps are the coach’s claim, not a measured result.',
  },
  {
    id: 'muscle-up-steps',
    title: '5 Steps to Nailing Your First Muscle-Up',
    source: 'BarBend',
    author: 'Mike Dewar',
    published: '2019-06-06',
    updated: '2023-07-26',
    url: 'https://barbend.com/steps-for-muscle-up',
    category: 'pull',
    skillId: 'muscle-up',
    minutes: 5,
    dek: 'Prerequisites first, then holds, transitions and the kip, then put it all together.',
    summary: [
      'The muscle-up is a pull, a transition and a dip glued together, and each piece needs its own strength. The guide is strict about entry: 10–15 strict pull-ups and 10–15 strict ring dips before you start, because skipping that is how shoulders, elbows and wrists get hurt.',
      'From there it isolates the hard parts. Hold the positions until they feel stable, rehearse the transition with your feet on the floor, then learn how much kip is enough before chaining it together.',
    ],
    stepsTitle: 'The progression',
    steps: [
      { name: 'Build bodyweight strength', how: 'Strict pull-ups, chin-ups, dips, L-sits and planks. Add tempo and pauses once the basics feel easy.', pass: 'Start at 3–4 sets of pull-ups and ring dips' },
      { name: 'Hold the positions', how: 'Timed support holds at the bottom and top of the dip, using muscle rather than hanging on the joints.', pass: '20–30 s at each position' },
      { name: 'Assisted transitions', how: 'Practise the turnover on low rings, seated or standing, with a band or a partner. Make it harder by removing floor contact.' },
      { name: 'Learn the kip', how: 'Build a controlled kip swing, then add a row at the top so chest and hips face up. That lie-back sets up the transition.' },
      { name: 'Put it together', how: 'Chain pull, transition and dip, ideally with a coach watching the first attempts.' },
    ],
    mistakes: [
      { name: 'Losing tension in the swing', fix: 'An aggressive kip makes you go soft through the middle. Build the kip slowly and stay rigid.' },
      { name: 'Rushing past the prerequisites', fix: 'Without the pull-up and dip numbers, the transition loads joints instead of muscles.' },
    ],
    takeaways: [
      'Next levels: strict muscle-ups, complexes (1 muscle-up + 5 dips) and light weighted reps of 5–15 lb.',
      'Rings and bar both work. Do the holds on whichever you plan to muscle-up on.',
    ],
    caliTip: 'Muscle-up step 5 is 10 pull-ups, and step 7 is 10 straight bar dips. Hit both in a logged set and Cali unlocks your first muscle-up attempt.',
  },
  {
    id: 'hs-freestanding',
    title: 'How to Work Up to a Freestanding Handstand',
    source: 'Breaking Muscle',
    author: 'Logan Christopher',
    published: '2014-02-03',
    updated: '2021-11-22',
    url: 'https://breakingmuscle.com/how-to-work-up-to-a-freestanding-handstand/',
    category: 'balance',
    skillId: 'handstand',
    minutes: 7,
    dek: 'Stop kicking up and falling. Four lead-up stunts teach the balance in smaller, safer pieces.',
    summary: [
      'Most people chase the freestanding handstand by kicking up over and over. The author did too, and calls it the long way round. Balancing on your hands is a fine-motor skill, and you would not try a 500 lb squat on day one either.',
      'The fix is “lead-up stunts”, borrowed from hand balancer Professor Orlick: positions that teach the same hand balance with a lower centre of gravity or a bigger base. Get a one-minute hold in each before you seriously work the freestanding handstand.',
    ],
    stepsTitle: 'Lead-up stunts',
    steps: [
      { name: 'Wall handstand', how: 'With the wall doing the balancing, focus on hands, arms, body, legs and head being in the right place, and build endurance for longer practice.', pass: '60 s hold' },
      { name: 'Frog stand (crow)', how: 'Squat, hands shoulder-width, knees on the backs of bent elbows, tip forward onto the hands. Balance by pressing or easing off the fingertips.', pass: '60 s hold' },
      { name: 'Tripod headstand', how: 'Hands and head make a triangle. Press and release through the hands while the body stays stiff. Start near a wall.', pass: '60 s hold' },
      { name: 'Forearm stand', how: 'Forearms parallel on the floor, head just off it, kick up from a sprinter’s stance. Needs some back arch.', pass: '60 s hold' },
    ],
    takeaways: [
      'Balance comes from the hands: fingertips push you back, the heel of the hand lets you go.',
      'The author has seen students reach a 30 s freestanding handstand in a few months this way.',
      'A bigger base (headstand, forearms) is easier; shrink it as you improve.',
    ],
    caliTip: 'Your Handstand ladder has a 30 s wall handstand at step 3. Log wall holds as you build up; the freestanding steps unlock once you hit 10 s off the wall.',
    photoCredit: { text: 'Handstand on the city, Jacob Ekaineck', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Handstand_on_the_city.jpg' },
  },
  {
    id: 'hs-fall-less',
    title: 'How to Learn a Handstand and Fall Less',
    source: 'Breaking Muscle',
    author: 'Solly Muwaniri',
    published: '2021-01-04',
    updated: '2021-11-22',
    url: 'https://breakingmuscle.com/how-to-learn-a-handstand-and-fall-less/',
    category: 'balance',
    skillId: 'handstand',
    minutes: 7,
    dek: 'Strong wrists, a little every day, and real time on your hands instead of an hour of failed kick-ups.',
    summary: [
      'Progress upside down depends on how strong your joints and tendons get, because they carry every bit of the load. The author starts everyone with one or two weeks of wrist preparation before going inverted.',
      'Then two things decide everything: consistency (a short dose daily, like a baby learning to stand) and time actually balancing. Failing to kick up teaches you very little, so practise on or near the wall and spend the time on your hands.',
    ],
    stepsTitle: 'The approach',
    steps: [
      { name: 'Prep the wrists', how: '5–15 minutes a day, tied to a habit like before a meal or after a shower. Improvements show within a few weeks.' },
      { name: 'Go upside down daily', how: 'Even one set a day, on top of 2–3 longer sessions a week for drills and weak spots.' },
      { name: 'Live on your hands', how: 'Work on or near the wall so a fall is caught. Feel your hands constantly correcting.' },
      { name: 'Explore wrong shapes', how: 'Spend time in a banana (arched) and a pike handstand. Knowing what “off” feels like is how you learn to correct it.' },
    ],
    mistakes: [
      { name: 'Bailing if not perfectly straight', fix: 'The author used to abort any crooked kick-up and never learned to adjust. Hold whatever shape you land in, then fix it.' },
      { name: 'Comparing to social media', fix: 'You are training for yourself. A “perfect” handstand is a pro’s job, not your requirement.' },
    ],
    takeaways: [
      'Some wrist discomfort early on is normal; pain is not.',
      'Five minutes of handstand on boring breaks adds up faster than one long weekly session.',
      'Bad days happen at every level. Read your body and adjust.',
    ],
    caliTip: 'Make a five-minute “hands” session part of your day and log each hold. The week strip on Home shows whether you are really doing it daily.',
    photoCredit: { text: 'AcroDanceHandstand, Jim Lamberson', license: 'CC BY 3.0', url: 'https://commons.wikimedia.org/wiki/File:AcroDanceHandstand.jpg' },
  },
  {
    id: 'wrist-prep',
    title: 'Get Ready for Handstands: Wrist Prep',
    source: 'Breaking Muscle',
    author: 'Justin Lind',
    published: '2017-08-15',
    updated: '2021-11-22',
    url: 'https://breakingmuscle.com/get-ready-for-handstands-wrist-prep/',
    category: 'mobility',
    skillId: 'handstand',
    minutes: 2,
    dek: 'Part one of a nine-part handstand series: a wrist circuit to run before any wrist-heavy session.',
    summary: [
      'Handstands sit on the hands and wrists, so this series starts there. The circuit builds the strength to hold a freestanding position and the mobility to stack your wrists, shoulders and hips in one line.',
      'Use it two ways: as a longer strength session, or as a quick warm-up before anything that loads your wrists.',
    ],
    stepsTitle: 'How to run it',
    steps: [
      { name: 'Go to your end ranges', how: 'Do not just go through the motions. Press into the stretch and notice how each position feels.' },
      { name: 'Vary the hand', how: 'Try slightly different hand positions and finger spacing to find where your wrist is strongest.' },
      { name: 'Grip the floor', how: 'Keep your fingers active, as if palming a giant basketball. Balance later depends on these same fingers.' },
    ],
    takeaways: [
      'The rest of the series covers shoulders, thoracic mobility, core position, strength, inversion, hand balance and the kick-up.',
      'Active fingers are a balance tool, not just a comfort tip.',
    ],
    caliTip: 'Run the circuit before every handstand or planche session. Two minutes now saves weeks of sore wrists later.',
    note: 'The original is a short follow-along video post; the steps above are its key cues.',
    photoCredit: { text: 'Handstand-yoga, ATHLETICULT', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Handstand-yoga.png' },
  },
  {
    id: 'wrist-stretches',
    title: '10 Wrist Stretches to Warm Up for Handstand',
    source: 'Alo Moves',
    author: 'Alo Moves (Patrick Beach & Carling Harps)',
    published: '2021-11-11',
    updated: '2024-07-24',
    url: 'https://blog.alomoves.com/movement/10-wrist-stretches-to-warm-up-for-handstand',
    category: 'mobility',
    skillId: 'handstand',
    minutes: 3,
    dek: 'Ten quick moves from two yoga teachers. Do them before every inversion, or daily.',
    summary: [
      'Your feet carry your weight all day; your wrists almost never do. This routine wakes them up gradually: loose circles first, then weight in tabletop, then strength through the fingertips.',
    ],
    stepsTitle: 'The 10 moves',
    steps: [
      { name: 'Figure 8s', how: 'Interlace your fingers and roll the wrists in a figure 8, then reverse.' },
      { name: 'Wrist flicks', how: 'Shake the hands out as if flicking water off them.' },
      { name: 'Tabletop circles', how: 'On hands and knees, circle the body both ways. Claw the mat; press through the index knuckle and the base of the thumb.' },
      { name: 'Tabletop rocks', how: 'Hands turned out to the sides, shift side to side. Find your edge; no big movements.' },
      { name: 'Backwards wrist stretch', how: 'Fingertips facing your knees, lean back just enough to feel the top of the forearm.' },
      { name: 'Open and close', how: 'Sit back on your heels, reach up, open and close the hands.', pass: '20 reps' },
      { name: 'Fingertip push-ups', how: 'In tabletop with straight arms, press up onto the fingertips and lower. Knees further back makes it harder.', pass: '10 reps' },
      { name: 'Wrist and calf stretch', how: 'Fingers facing the knees, step one leg back and press the heel down. Switch sides.' },
      { name: 'Backwards wrist plank', how: 'Fingers facing the knees, step both legs back into a plank with soft elbows, hands shoulder-width.' },
      { name: 'Fist rolls', how: 'Sit back, make fists, roll the wrists both ways.' },
    ],
    takeaways: ['Gentle first, loaded last. The order matters.', 'Done daily, it keeps wrists mobile even on rest days.'],
    caliTip: 'Pair this with Handstand or Planche days. It takes about five minutes.',
  },
  {
    id: 'front-lever',
    title: 'Front Lever: Progression, How to Do It and Muscles Worked',
    source: 'Fitness Volt',
    author: 'Fitness Volt',
    published: '2026-10',
    url: 'https://fitnessvolt.com/calisthenics/front-lever/',
    category: 'statics',
    skillId: 'front-lever',
    minutes: 6,
    dek: 'Six steps from strict pull-ups to a full lever, each with a hard number to pass first.',
    summary: [
      'A front lever is a straight-arm hold under the bar with your body face-up and level with the floor. The lats do most of the work, the core keeps you in one line. It is one of the three classic levers, alongside the back lever and the planche.',
      'The ladder makes the lever shorter or longer by tucking or opening the legs. Pass each step with strict form before spending time on the next.',
    ],
    stepsTitle: 'The ladder',
    steps: [
      { name: 'Pull-ups and active hangs', how: 'Learn to pull the shoulders down and back with straight arms. That is the lever’s shoulder action.', pass: '8 strict pull-ups' },
      { name: 'Tuck front lever', how: 'Elbows locked, knees to chest, back level. Push the bar down toward your hips.', pass: '30 s' },
      { name: 'Advanced tuck', how: 'Open the hips so the thighs sit at a right angle to the torso, and flatten the back.', pass: '10 s, flat back' },
      { name: 'One-leg front lever', how: 'One leg straight, the other tucked. Swap legs each set.', pass: '10 s each side' },
      { name: 'Straddle front lever', how: 'Legs straight and apart. Wider is easier; narrow it as you get stronger.', pass: '5 s' },
      { name: 'Full front lever', how: 'Legs together, glutes squeezed, toes pointed.', pass: '5 s' },
    ],
    mistakes: [
      { name: 'Hips sag', fix: 'Shorten the lever (tuck more or straddle wider) until you can hold a straight line.' },
      { name: 'Bent elbows', fix: 'That turns the hold into a row. Lock the elbows and push the bar down.' },
      { name: 'Swinging up', fix: 'Start from a still hang, or lower into the position from above.' },
      { name: 'Forcing holds too early', fix: 'Do slow negatives into each step before pausing in it.' },
    ],
    takeaways: [
      'Straight-arm holds load the elbows and biceps tendon. Add time slowly.',
      'Keep the head neutral; tipping it back strains the neck.',
      'Muscles: lats and teres major, rear delts and lower traps, abs, lower back and glutes.',
    ],
    caliTip: 'Your Front lever ladder ticks at a 10 s and a 20 s tuck, then a 3 s full lever. Log Tuck front lever holds in seconds and it moves on its own.',
  },
  {
    id: 'front-lever-wiki',
    title: 'Front lever',
    source: 'Wikipedia',
    author: 'Wikipedia contributors',
    published: '2008-05-24',
    updated: '2026-08-29',
    url: 'https://en.wikipedia.org/wiki/Front_lever',
    category: 'statics',
    skillId: 'front-lever',
    minutes: 3,
    dek: 'Where the lever comes from, how gymnastics scores it, and the harder moves built on top of it.',
    summary: [
      'In gymnastics the front lever is usually done on rings: lower from an inverted hang until the body is straight and horizontal, face up. Strong gymnasts can also pull straight into it from a dead hang. It is rated A, the easiest grade, in today’s code of points; in the 1960s it was a B.',
      'Height matters. A longer body makes a longer lever, which is part of why world-class gymnasts today are shorter than in the 1950s.',
    ],
    stepsTitle: 'Progressions',
    steps: [
      { name: 'Tuck', how: 'Knees pulled in. The shortest lever.' },
      { name: 'Advanced tuck', how: 'Back kept flat.' },
      { name: 'Single leg', how: 'One leg extended.' },
      { name: 'Straddle', how: 'Both legs straight and apart.' },
      { name: 'Half lay', how: 'Knees bent, hips open.' },
      { name: 'Full', how: 'Straight body, legs together.' },
    ],
    takeaways: [
      'Front lever pull-ups: stay horizontal and pull until the elbows pass the shoulders.',
      'Ice cream makers: rock from the lever to the top of a pull-up and back.',
      'Lever raises: lift from dead hang to the lever with straight arms.',
    ],
    caliTip: 'Front lever rows at your current tuck are a great accessory between your hold sets.',
    note: 'The cover photo is John Gill holding a front lever in 1962.',
  },
  {
    id: 'planche',
    title: 'Planche (exercise)',
    source: 'Wikipedia',
    author: 'Wikipedia contributors',
    published: '2008-09-17',
    updated: '2026-05-26',
    url: 'https://en.wikipedia.org/wiki/Planche_(exercise)',
    category: 'statics',
    skillId: 'planche',
    minutes: 2,
    dek: 'The body held flat above the floor on locked arms, and the standard steps that lead to it.',
    summary: [
      'Planche is French for “plank”: the body is held parallel to the ground, supported only by straight arms. It takes a lot of strength and balance, and the arms stay locked the whole time.',
      'Gymnastics only scores two versions, the straddle and the full planche, held for at least two seconds. On rings the straddle is an A skill and the full planche a C.',
    ],
    stepsTitle: 'The standard progression',
    steps: [
      { name: 'Frog stand', how: 'Knees on the backs of the arms, balancing on the hands.' },
      { name: 'Tuck planche', how: 'Knees tucked, hips up, arms locked.' },
      { name: 'Advanced tuck', how: 'Back flat, knees further from the chest.' },
      { name: 'Straddle planche', how: 'Legs straight and apart.' },
      { name: 'Full planche', how: 'Legs together, body flat.' },
    ],
    mistakes: [
      { name: 'Too much too soon', fix: 'Common injuries include torn arm tendons (especially the distal biceps), and wrist, elbow and shoulder strain. Progress slowly.' },
    ],
    takeaways: [
      'Muscles used include the front delts, biceps, triceps, lats, chest, serratus anterior, traps, abs and the wrist flexors.',
      'Records: longest planche on parallel bars, 47 s (Michele Esposito, 2023); most consecutive full planche presses, 17 (Viktor Kamenov).',
    ],
    caliTip: 'Your Planche ladder starts with a 60 s plank and a 20 s lean before the tuck. Warm the wrists first, every time.',
  },
  {
    id: 'lsit-barbend',
    title: 'L-Sit Hold Progression for Beginners',
    source: 'BarBend',
    author: 'Mike Dewar',
    published: '2018-01-18',
    updated: '2023-08-09',
    url: 'https://barbend.com/l-sit-hold-progression-for-beginners/',
    category: 'core',
    skillId: 'l-sit',
    minutes: 4,
    dek: 'Support hold, one leg, tuck, then both legs: build it on the floor before bars and rings.',
    summary: [
      'The L-sit builds isometric core strength and body awareness, and leads into ring work and L-sit pull-ups. Feet point away, knees locked, legs at hip height or higher. Below that is a “low” L-sit, which is where most people start.',
      'Train every step on the floor first, then on parallettes or bars, then on rings. Each surface asks for more stability.',
    ],
    stepsTitle: 'The progression',
    steps: [
      { name: 'Support hold', how: 'Straight arms, shoulders pushed down. Builds upper-back and triceps stability.' },
      { name: 'Single-leg raise in support', how: 'Feet on the floor or a low bench, lift one foot to hip height.' },
      { name: 'Tucked support', how: 'Knees to chest, hips and feet off the floor, all weight on the arms.' },
      { name: 'Alternating leg raise from tuck', how: 'From the tuck, extend one leg at a time so you can focus on one side.' },
      { name: 'L-sit', how: 'Extend both legs. Low at first, then up to hip height.' },
    ],
    takeaways: [
      'Hanging knee raises build the core while needing less hip-flexor strength.',
      'Toes-to-bar builds hip-flexor and abdominal endurance.',
      'Weighted planks teach locked elbows and a braced trunk.',
    ],
    caliTip: 'Your L-sit ladder ticks at 10, 20 and 30 s. Work the support and tuck steps until a full L appears, then log it as an L-sit hold.',
    photoCredit: { text: 'Annie Thorisdottir does an L-sit, Anthony Topper', license: 'CC BY 2.0', url: 'https://commons.wikimedia.org/wiki/File:Annie_Thorisdottir_does_an_l-sit.jpg' },
  },
  {
    id: 'lsit-fv',
    title: 'L-Sit: How to Do It, Progression and Muscles Worked',
    source: 'Fitness Volt',
    author: 'Fitness Volt',
    published: '2026-10',
    url: 'https://fitnessvolt.com/l-sit-exercise-guide/',
    category: 'core',
    skillId: 'l-sit',
    minutes: 5,
    dek: 'Pass marks for every step, and why two equally strong people can take very different times.',
    summary: [
      'An L-sit works the arms, core and hip flexors at once, and many people cannot even lift off the floor at first. Support strength, hip-flexor strength, hamstring flexibility, technique and body proportions all play a part.',
      'There is no honest timeline. Arm length, hamstrings and the surface you use change the difficulty a lot.',
    ],
    stepsTitle: 'Pass marks',
    steps: [
      { name: 'Support hold', how: 'On bars, chairs or parallettes: arms locked, shoulders pushed down away from the ears.' },
      { name: 'Tuck L-sit', how: 'Hips and both feet off the floor, knees pulled up. Lift one foot at a time if both will not go.' },
      { name: 'One-leg L-sit', how: 'One leg straight and level, the other tucked. Straighten the knee slowly from the tuck.', pass: '5 s each side' },
      { name: 'Full L-sit', how: 'Both legs straight and level, toes pointed, chest up.', pass: '10 s' },
    ],
    mistakes: [
      { name: 'Hanging on the shoulders', fix: 'Push down until your neck looks long.' },
      { name: 'Bent knees', fix: 'That is a tuck. Use the one-leg step until both legs stay straight.' },
      { name: 'Throwing the legs up', fix: 'It lasts a second. Build the hold from the tuck.' },
      { name: 'Hip-flexor cramps', fix: 'Common early on. Shake it out and use shorter holds.' },
    ],
    takeaways: [
      'Leaning forward makes the legs harder to lift; keep the chest up.',
      'Hands too low to lift off? Use yoga blocks or parallettes.',
      'Helpers: boat hold, plank, hollow body hold, L-sit pull-ups, toes-to-bar.',
    ],
    caliTip: 'Two sturdy chairs are enough. Weigh the seats down if they tip.',
  },
  {
    id: 'pistol-barbend',
    title: 'Pistol Squat Progression for Beginners: 7 Exercises',
    source: 'BarBend',
    author: 'Mike Dewar',
    published: '2017-10-23',
    updated: '2023-08-08',
    url: 'https://barbend.com/pistol-squat-progression-for-beginners/',
    category: 'legs',
    skillId: 'pistol',
    minutes: 4,
    dek: 'Mobility first, then box pistols, slow negatives and assisted reps down to the floor.',
    summary: [
      'Pistols need real ankle, knee and hip mobility. Forcing a body into a deep range it has not earned leads to injury or bad habits, so check your mobility first.',
      'Knees caving in at any step means a lack of strength or control. Stay at that step until they track over the toes.',
    ],
    stepsTitle: 'From easiest to hardest',
    steps: [
      { name: 'Deep bodyweight squat', how: 'Full depth with control and balance before going single-leg.' },
      { name: 'Rocking box pistol', how: 'Sit to a box on one leg and rock to gain momentum. A lower box is harder.' },
      { name: 'Box pistol', how: 'Same, with no rocking. Pair with slow negatives.' },
      { name: 'Eccentric pistol to box', how: 'From standing, lower slowly onto the box. Go lower over time.' },
      { name: 'Assisted pistol', how: 'Hold a rack, straps or a beam, offset so the free leg clears it.' },
      { name: 'Assisted pistol with bottom hold', how: 'Add a pause at the bottom to learn foot balance there.' },
      { name: 'Rolling pistol', how: 'Roll back, then roll up into the pistol. Teaches control at speed.' },
    ],
    takeaways: [
      'One coach’s point: control on the way down is the hard part; standing up is easy for most.',
      'Use assistance to reach the bottom, then rely on it less as you stand.',
    ],
    caliTip: 'Step 2 of your Pistol ladder is the assisted pistol: tap Mark done once you own it. Your first unassisted rep, logged as Pistol squat, unlocks step 3.',
    photoCredit: { text: 'Sólheimajökull Glacier Pistol Squat, FeldBum', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:S%C3%B3lheimaj%C3%B6kull-Glacier-Pistol-Squat.jpg' },
  },
  {
    id: 'pistol-bm',
    title: 'What’s Preventing You From Doing Pistol Squats?',
    source: 'Breaking Muscle',
    author: 'Chris Garay',
    published: '2014-01-09',
    updated: '2022-04-26',
    url: 'https://breakingmuscle.com/whats-preventing-you-from-doing-pistol-squats-how-to-progress-pistols/',
    category: 'legs',
    skillId: 'pistol',
    minutes: 4,
    dek: 'A nine-step path plus a troubleshooting guide for the five ways a pistol usually fails.',
    summary: [
      'A user’s manual for the pistol, pulling from Carl Paoli, Al Kavadlo, Ido Portal and others. It starts with plain squats and ends with heel and box tricks you can use at any stage.',
      'Its best part is the troubleshooting: each common failure gets a quick fix for today and a long-term fix for next month.',
    ],
    stepsTitle: 'The path',
    steps: [
      { name: 'Bodyweight squats', how: 'Shoulder-width, full depth, moving toward hip-width over time.', pass: '20 clean reps' },
      { name: 'Feet-together squat', how: 'All the way down with a very narrow stance.' },
      { name: 'Bottom hold on a pole', how: 'Squat down holding something sturdy, stick one leg out and hold. Switch.' },
      { name: 'Down on one, up on two', how: 'Slow pistol negative holding the pole, then stand on both legs.' },
      { name: 'Pistol to a box', how: 'Away from the pole, sit to a box. Start tall, go lower.' },
      { name: 'Band-assisted pistol', how: 'Band around the hips. Use a thinner band or a lower anchor over time.' },
      { name: 'Counterweight pistol', how: 'Hold 10–20 lb out in front. Go lighter over time.' },
      { name: 'Pistol on a box, free leg down', how: 'Stand on a box tall enough for the free leg to hang. Lower the box over time.' },
      { name: 'Raised heels', how: 'Lifting shoes or a small plate under the heel at any stage cuts the ankle mobility needed.' },
    ],
    mistakes: [
      { name: 'Falling backwards at the bottom', fix: 'Today: hold 10–20 lb in front. Long term: pole-assisted pistols with less and less help.' },
      { name: 'Heel lifts off', fix: 'Today: heel plate or lifting shoes. Long term: calf and Achilles mobility.' },
      { name: 'Free-leg hip flexor cramps', fix: 'Today: pistol on a box with the free leg down. Long term: L-sit work and toes-to-bar.' },
      { name: 'Collapsing into the bottom', fix: 'Today: sit to a box. Long term: slow negatives and active bottom holds.' },
      { name: 'Wobbling side to side', fix: 'Today: fix your eyes on a point ahead. Long term: train barefoot, plus step-ups and split squats.' },
    ],
    takeaways: ['Still chasing it? Practise pistols every day.', 'Rolling pistols are left out on purpose: the dynamic version is harder to learn first.'],
    caliTip: 'Your Pistol ladder starts with 20 bodyweight squats, the same entry test as this guide. Log them and step 1 ticks itself.',
    photoCredit: { text: 'Pistol-squat, Jgcastor', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Pistol-squat.jpg' },
  },
  {
    id: 'sleep',
    title: 'How to Get Optimal Sleep to Recover',
    source: 'BarBend',
    author: 'Nick English',
    published: '2024-09',
    updated: '2024-10-07',
    url: 'https://barbend.com/optimal-sleep-workout-recovery/',
    category: 'recovery',
    minutes: 10,
    dek: 'Hard training revs up your nervous system. Six ways to calm it down and actually recover.',
    summary: [
      'Intense training pushes your nervous system toward “fight or flight”. Great for lifting, bad for falling asleep. And poor sleep means weaker recovery, worse muscle gain and fat loss, and lower mood.',
      'Sleep is when growth hormone does its repair work, and short or poor sleep is linked to lower testosterone. Good sleep is linked to faster reactions, better skill learning, more endurance and stronger lifts. A psychiatrist and a psychologist give the tips below.',
    ],
    stepsTitle: 'Six levers',
    steps: [
      { name: 'Sleep hygiene', how: 'Cut caffeine hours before bed, dim lights for the last hour, keep the bed for sleep, stretch for 5–10 minutes, read something calm, keep a fixed bedtime.' },
      { name: 'Change the narrative', how: 'Tell yourself “I can sleep” instead of “why can’t I sleep”. Worrying about sleep feeds itself.' },
      { name: 'Meditate and slow your breath', how: 'Count breaths to ten and restart. Breathing like a sleeper, about one breath every 15 s, can put you out in 5–10 minutes.' },
      { name: 'Move every day', how: 'Being active all day deepens sleep. On rest days, walk, do yoga or a light bodyweight circuit.' },
      { name: 'Consider supplements', how: 'Magnesium; 1–3 mg of melatonin an hour before bed at the same time daily; 5-HTP. Ask a doctor first.' },
      { name: 'Experiment with food and drink', how: 'Food before bed disturbs some people; carbs help others. Cut drinks late if you wake at night.' },
    ],
    takeaways: [
      'Quality matters as much as quantity.',
      'Try one change for a few days or weeks and watch what happens.',
      'Chronically short on sleep? Talk to a doctor.',
    ],
    caliTip: 'Hard session late at night? Finish with five minutes of slow stretching and breathing before bed.',
    note: 'BarBend says its content is informational, not medical advice.',
  },
  {
    id: 'sleep-study',
    title: 'Bad Sleep? Work Out in the Morning, Says Study',
    source: 'BarBend',
    author: 'Jake Dickson',
    published: '2024-11',
    updated: '2024-11-11',
    url: 'https://barbend.com/sleep-loss-performance-study/',
    category: 'recovery',
    minutes: 4,
    dek: 'A meta-analysis of 69 studies: under six hours of sleep cost about 7.5% of performance.',
    summary: [
      'The write-up covers Craven et al. (2022), a meta-analysis of 69 controlled studies on adults who slept six hours or less. Performance fell by about 7.5% on average.',
      'The timing of the loss mattered. Pulling an all-nighter or waking earlier than you want caused consistent drops, and afternoon sessions suffered more than morning ones, about 0.5% per hour you have been awake.',
    ],
    takeaways: [
      'Skill-based training is especially sensitive to sleep loss. Bad news for handstand day.',
      'After a rough night, train early if you can.',
      'Limits: only 11% of participants were women, and broken sleep (waking repeatedly) was not compared.',
      'Long-term short sleep is also linked to muscle loss and slower fat loss.',
    ],
    caliTip: 'Slept badly? Swap a skill session for easy volume or rest, or move it to the morning.',
  },
  {
    id: 'protein',
    title: 'Protein: All You Need to Know to Grow',
    source: 'Body Type',
    author: 'Mikala Jamison',
    published: '2025-03-12',
    url: 'https://bodytype.substack.com/p/protein-all-you-need-to-know-to-grow',
    category: 'recovery',
    minutes: 7,
    dek: 'You do not need one gram per pound to start getting strong.',
    summary: [
      'The author, a former group fitness instructor and competitive powerlifter, pushes back on the internet’s “one gram of protein per pound of bodyweight” rule. It may suit people deep into a progressive-overload lifting plan, but it scares beginners off.',
      'She points to the American College of Sports Medicine’s range of 0.5–0.8 g per lb (about 1.1–1.8 g per kg) for people training to build muscle, and argues that starting lower and building up still works.',
    ],
    takeaways: [
      'For a 70 kg person, 0.5–0.8 g/lb is roughly 77–123 g of protein a day.',
      'Protein is having a moment partly because more people lift, and partly because of its link to fat loss.',
      'Strength training is worth it at any protein intake. Do not wait for the perfect diet.',
    ],
    caliTip: 'Training for skills, not size? Eat enough to recover and stay consistent. Protein supports the work; it does not replace it.',
    note: 'Most of the original is for paid subscribers; this covers the free part. The guidance is written for people who eat meat.',
  },
  {
    id: 'beginner-plan',
    title: 'Best Calisthenics Workout Plan for Beginners',
    source: 'Life Extension',
    author: 'Liz Lotts',
    published: '2023',
    url: 'https://www.lifeextension.com/wellness/fitness/calisthenics-workout-plan-for-beginners',
    category: 'basics',
    minutes: 11,
    dek: 'Why bodyweight works, how to start, and a seven-move circuit you can do anywhere.',
    summary: [
      'Calisthenics comes from the Greek kalos (beautiful) and sthenos (strength). It covers everything from push-ups to the planche, and the guide argues it builds strength, endurance, balance and coordination. Full range of motion is the key; it can grow muscle much like heavy training.',
      'Beginners should cover the basic movement patterns with their bodyweight, learn clean form, then progress. Big goals get broken into steps, e.g. push-up → decline push-up → wall handstand → handstand push-up.',
    ],
    stepsTitle: 'The sample circuit',
    steps: [
      { name: 'Alternating transverse squats', how: 'Step out to the side, open the hips, sit to 90°, drive back up.', pass: '× 20' },
      { name: 'Push-ups', how: 'Braced plank, lower in one piece. Knees down to make it easier.' },
      { name: 'Leg lowers', how: 'On your back, legs vertical, lower slowly with the core braced.' },
      { name: 'Walking lunges with rotation', how: 'Lunge, twist toward the front leg, return, step through.', pass: '× 20' },
      { name: 'Superman pulls', how: 'Face down, lift the chest, pull the arms into a goal-post shape, squeeze the shoulder blades.' },
      { name: 'Side plank leg lift', how: 'Forearm side plank, kick the top leg up and lower.', pass: '× 10 each side' },
      { name: 'Burpees', how: 'Squat, jump back to plank, jump in, jump up. Add a push-up to progress.' },
    ],
    takeaways: [
      '3–6 rounds, back to back, 2 minutes between rounds, 30 s or less between moves if needed.',
      'Warm up dynamically (Cossack squats, inchworms, bear walks); save static stretching for after.',
      'After about three training days in a row, take a rest day, especially as a beginner.',
      'Write the goal down and make it SMART.',
    ],
    caliTip: 'Log the push-ups and squats from each round as sets in one session. History will show the rounds climbing week by week.',
    note: 'The original also promotes the publisher’s supplements. We left those out.',
  },
];

export const VIDEOS: Video[] = [
  { id: 'x3NPAxiMRPw', title: 'How to get your first pull-up: common weak points, progression + accessories', channel: 'megsquats', length: '17:59', views: 3408381, age: '4 years ago', category: 'pull', skillId: 'muscle-up' },
  { id: 'edcbXUVH8-A', title: 'From first pull-up to 30 in a row', channel: 'Yellow Dude', length: '8:31', views: 880358, age: '6 months ago', category: 'pull', skillId: 'muscle-up' },
  { id: '_eQ2gw_Gg5Y', title: 'How to muscle-up for beginners (best exercises)', channel: 'FitnessFAQs', length: '6:04', views: 864823, age: '2 years ago', category: 'pull', skillId: 'muscle-up' },
  { id: '0r9uswEQwlY', title: 'If I wanted to unlock muscle-up in 30 days, I’d train like this', channel: 'Yellow Dude', length: '7:10', views: 462950, age: '1 year ago', category: 'pull', skillId: 'muscle-up' },
  { id: 'aXDxa79u0xQ', title: 'How to handstand: absolute beginners to pro', channel: 'STRIQfit', length: '9:47', views: 784029, age: '2 years ago', category: 'balance', skillId: 'handstand' },
  { id: 'QezdZIqmd1k', title: 'The real way to get your first handstand (for beginners)', channel: 'Meli', length: '12:18', views: 919871, age: '1 year ago', category: 'balance', skillId: 'handstand' },
  { id: 'AGhb8V8M758', title: 'Front lever for beginners (all progressions)', channel: 'FitnessFAQs', length: '6:34', views: 2234069, age: '8 years ago', category: 'statics', skillId: 'front-lever' },
  { id: '5g8-sj-8snc', title: 'How to front lever step by step', channel: 'Chris Heria', length: '13:09', views: 1152946, age: '4 years ago', category: 'statics', skillId: 'front-lever' },
  { id: 'BeGUXwZmATQ', title: 'All planche progressions from 0 to full', channel: 'Vitaly Pavlenko', length: '4:08', views: 4327171, age: '4 years ago', category: 'statics', skillId: 'planche' },
  { id: 'UZ-1jwG7aQ4', title: 'How to planche: beginner tutorial', channel: 'Calisthenicmovement', length: '3:53', views: 3604289, age: '11 years ago', category: 'statics', skillId: 'planche' },
  { id: 'HxDP7SqggpI', title: 'From zero to L-sit in 8 steps', channel: 'Vitality', length: '8:04', views: 479855, age: '4 years ago', category: 'core', skillId: 'l-sit' },
  { id: 'Qv6j5gZyBQ8', title: 'Why you can’t L-sit hold (how to, step by step)', channel: 'Chris Heria', length: '13:57', views: 1293549, age: '6 years ago', category: 'core', skillId: 'l-sit' },
  { id: 'vq5-vdgJc0I', title: 'How to get your first pistol squat (step-by-step progression)', channel: 'Squat University', length: '6:19', views: 2590665, age: '6 years ago', category: 'legs', skillId: 'pistol' },
  { id: 'd7SLe_ubwy4', title: 'The problem with pistol squats (mobility fix)', channel: 'FitnessFAQs', length: '7:22', views: 252408, age: '4 years ago', category: 'legs', skillId: 'pistol' },
  { id: '5OWbZ9Oxz0E', title: '5-minute calisthenics wrist stretching routine (follow along)', channel: 'STRIQfit', length: '3:34', views: 136024, age: '3 years ago', category: 'mobility', skillId: 'handstand' },
  { id: 'ffn-_fZORBE', title: 'Fix weak wrists with this simple routine', channel: 'Hybrid Calisthenics', length: '8:45', views: 125591, age: '6 months ago', category: 'mobility', skillId: 'handstand' },
  { id: 'geUKI-2uWaY', title: 'Beginner calisthenics workout', channel: 'Meli', length: '8:00', views: 8108841, age: '3 years ago', category: 'basics' },
  { id: '1mlN0yuxoLE', title: 'Calisthenics for complete beginners: tips, form, programming', channel: 'yvguo', length: '18:15', views: 7702096, age: '3 years ago', category: 'basics' },
  { id: 'lbXrBCxHA1s', title: 'If I started calisthenics again, I’d just do these 5 exercises', channel: 'Jacob Juul Hansen', length: '6:34', views: 1016690, age: '1 month ago', category: 'basics' },
  { id: 'pz6TbZ3lNV8', title: 'How important is sleep for building muscle?', channel: 'PictureFit', length: '4:27', views: 3683899, age: '10 years ago', category: 'recovery' },
  { id: '1xeSCokUsSI', title: 'Sleep is the best muscle-building “drug”?', channel: 'Renaissance Periodization', length: '5:42', views: 442050, age: '3 years ago', category: 'recovery' },
  // Shorts: under a minute, vertical.
  { id: 'lbEl3yg4YWA', title: 'How to do a muscle-up', channel: 'Pierre Dalati', length: '0:40', views: 11532288, age: '3 years ago', category: 'pull', skillId: 'muscle-up', short: true },
  { id: 'T6JFMq3BRPY', title: 'Do this to learn your first handstand', channel: 'Marie Risvik', length: '0:36', views: 21197476, age: '1 year ago', category: 'balance', skillId: 'handstand', short: true },
  { id: 'ojAabVC9an8', title: 'Wanna learn handstand? Start here', channel: 'Charlie Follows', length: '0:29', views: 8067539, age: '3 years ago', category: 'balance', skillId: 'handstand', short: true },
  { id: '--W7pVSWIpM', title: 'Can’t planche yet? Start here', channel: 'FitnessFAQs', length: '0:42', views: 2611298, age: '3 years ago', category: 'statics', skillId: 'planche', short: true },
  { id: 'D0omyxhQmbc', title: 'The last L-sit tutorial you will need', channel: 'Stefano Bertola', length: '0:13', views: 2381994, age: '3 weeks ago', category: 'core', skillId: 'l-sit', short: true },
];

/** "3.4M", "880K", "952". */
export function compactCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(n);
}

/** "Aug 2023", "2023", "Oct 2026". */
export function formatPublished(iso: string): string {
  const [y, m] = iso.split('-');
  if (!m) return y;
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1];
  return month ? `${month} ${y}` : y;
}

export const watchUrl = (v: Video) => (v.short ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`);

/** Filters by category; 'all' keeps everything. */
export function inCategory<T extends { category: LearnCategory }>(items: T[], cat: LearnCategory | 'all'): T[] {
  return cat === 'all' ? items : items.filter((x) => x.category === cat);
}

/** Puts items for the user's focus skills first, keeping the original order otherwise. */
export function forFocus<T extends { skillId?: string }>(items: T[], focus: string[]): T[] {
  const rank = (x: T) => {
    const i = x.skillId ? focus.indexOf(x.skillId) : -1;
    return i === -1 ? focus.length : i;
  };
  return items.map((x, i) => ({ x, i })).sort((a, b) => rank(a.x) - rank(b.x) || a.i - b.i).map(({ x }) => x);
}

/** Other items on the same skill first, then the same category. */
export function relatedTo<T extends { id: string; skillId?: string; category: LearnCategory }>(
  items: T[],
  target: { id?: string; skillId?: string; category: LearnCategory },
  limit = 3,
): T[] {
  const score = (x: T) => (target.skillId && x.skillId === target.skillId ? 0 : x.category === target.category ? 1 : 2);
  return items
    .filter((x) => x.id !== target.id && score(x) < 2)
    .sort((a, b) => score(a) - score(b))
    .slice(0, limit);
}

/** Day number within the year (1 Jan = 0), in local time. */
export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - start.getTime()) / 86_400_000);
}

/**
 * Today's pick for Home: one item a day. When the user has focus skills, it rotates through
 * the items for those skills only; otherwise through everything.
 */
export function dailyPick<T extends { skillId?: string }>(items: T[], date: Date, focus: string[] = []): T | undefined {
  const mine = forFocus(items.filter((x) => x.skillId && focus.includes(x.skillId)), focus);
  const pool = mine.length ? mine : items;
  return pool.length ? pool[dayOfYear(date) % pool.length] : undefined;
}
