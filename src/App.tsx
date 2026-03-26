import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform, animate } from 'motion/react';
import { Trophy, Lightbulb, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, RotateCcw, Info, X, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---
interface Word {
  base: string;
  past: string;
  participle: string;
  icon: string;
  stage?: number;
  nextReview?: number;
}

// --- Constants & Assets ---
const MONSTER_ASSETS = {
  left: {
    idle: 'assets/monster_left_idle.webp',
    open: 'assets/monster_left_openmouth.webp',
    disgust: 'assets/monster_left_disgust.webp',
    spit: 'assets/monster_left_spit.webp',
  },
  right: {
    idle: 'assets/monster_right_idle.webp',
    open: 'assets/monster_right_openmouth.webp',
    happy: 'assets/monster_right_happy.webp',
  }
};

const SOUNDS = {
  swipe: 'assets/swipe.mp3',
  success: 'assets/success.mp3',
  celebrate: 'assets/celebrate.mp3',
  ding: 'assets/ding.mp3',
  spit: 'assets/spit.mp3',
  gulp: 'assets/gulp.mp3',
};

const FINNISH_PHRASES = [
  "🏆 Mestari on puhunut!",
  "🔥 Olet liekeissä!",
  "🦉 Viisas kuin pöllö!",
  "🚀 Kohti tähtiä!",
  "💎 Puhdasta timanttia!",
  "🦁 Sisu on voimaasi!",
  "🌈 Sateenkaaren päässä!",
  "⚡ Sähköinen suoritus!",
  "🥇 Voittamaton tänään!",
  "🌊 Aallonharjalla!"
];

const WORD_BANK: Word[] = [
  { base: "win", past: "won", participle: "won", icon: "🏆", stage: 0 },
  { base: "write", past: "wrote", participle: "written", icon: "✍️", stage: 0 },
  { base: "spend", past: "spent", participle: "spent", icon: "💳", stage: 0 },
  { base: "spread", past: "spread", participle: "spread", icon: "🧈", stage: 0 },
  { base: "go", past: "went", participle: "gone", icon: "🚶", stage: 0 },
  { base: "stand", past: "stood", participle: "stood", icon: "🧍", stage: 0 },
  { base: "sweep", past: "swept", participle: "swept", icon: "🧹", stage: 0 },
  { base: "grow", past: "grew", participle: "grown", icon: "🌱", stage: 0 },
  { base: "teach", past: "taught", participle: "taught", icon: "👩‍🏫", stage: 0 },
  { base: "tell", past: "told", participle: "told", icon: "🗣️", stage: 0 },
  { base: "know", past: "knew", participle: "known", icon: "🧠", stage: 0 },
  { base: "see", past: "saw", participle: "seen", icon: "👀", stage: 0 },
  { base: "take", past: "took", participle: "taken", icon: "🧳", stage: 0 },
  { base: "begin", past: "began", participle: "begun", icon: "🚀", stage: 0 },
  { base: "bite", past: "bit", participle: "bitten", icon: "🦷", stage: 0 },
  { base: "blow", past: "blew", participle: "blown", icon: "🌬️", stage: 0 },
  { base: "break", past: "broke", participle: "broken", icon: "💔", stage: 0 },
  { base: "choose", past: "chose", participle: "chosen", icon: "🎯", stage: 0 },
  { base: "do", past: "did", participle: "done", icon: "✅", stage: 0 },
  { base: "drink", past: "drank", participle: "drunk", icon: "🥤", stage: 0 },
  { base: "drive", past: "drove", participle: "driven", icon: "🚗", stage: 0 },
  { base: "eat", past: "ate", participle: "eaten", icon: "🍽️", stage: 0 },
  { base: "fall", past: "fell", participle: "fallen", icon: "🍂", stage: 0 },
  { base: "fly", past: "flew", participle: "flown", icon: "✈️", stage: 0 },
  { base: "forget", past: "forgot", participle: "forgotten", icon: "🤔", stage: 0 },
  { base: "give", past: "gave", participle: "given", icon: "🎁", stage: 0 },
];

const WORD_BANK_VERSION = '2026-03-21-v5';

// --- Custom Hook for Orientation ---
function useOrientation() {
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isPortrait;
}

export default function App() {
  const isPortrait = useOrientation();
  const leftMonsterDuration = useMemo(() => Math.random() * 2 + 2, []);
  const rightMonsterDuration = useMemo(() => Math.random() * 2 + 2, []);
  const [layoutScale, setLayoutScale] = useState(1);
  const [contentScale, setContentScale] = useState(1);
    const [startEndCompact, setStartEndCompact] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const h = window.innerHeight;
      const w = window.innerWidth;
      const isLand = w > h;

      // Rule 1: Small Landscape (Mobile) -> Scale everything down to 80%
      if (isLand && h < 500) {
        setLayoutScale(0.8);
        setContentScale(1);
      } 
      // Rule 2: Large Screen (Desktop/Tablet) -> Scale card/monsters up to 1.2
      else if (isLand && h > 800) {
        setLayoutScale(1);
        setContentScale(1.2);
      }
      // Default
      else {
        setLayoutScale(1);
        setContentScale(1);
      }
          
          const compactThreshold = isLand ? 500 : 700;
          setStartEndCompact(h < compactThreshold);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [started, setStarted] = useState(false);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [learnedList, setLearnedList] = useState<Word[]>([]);
  const [score, setScore] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [monsterState, setMonsterState] = useState({ left: 'idle', right: 'idle' });
  const [activeSpeech, setActiveSpeech] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [isSpitting, setIsSpitting] = useState(false);
  const [isReturning, setIsReturning] = useState(false); 
  const [returningWord, setReturningWord] = useState<Word | null>(null); 
  const [isStackOpening, setIsStackOpening] = useState(false); 
  const [showReviewList, setShowReviewList] = useState(false);
  const [showMasteredList, setShowMasteredList] = useState(false);
  const [monsterLean, setMonsterLean] = useState({ left: 0, right: 0 });
  const [mouthOpen, setMouthOpen] = useState({ left: 0, right: 0 });
  const [trophyBump, setTrophyBump] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [promoteSecond, setPromoteSecond] = useState(false);
  const [secondFadeIn, setSecondFadeIn] = useState(false);
  const [completionPhrase, setCompletionPhrase] = useState("");
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false); // New: Track if audio has played for current card

  // Motion values for dragging interaction
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  
  // Dynamic transforms based on orientation
  const rotateValue = useTransform(isPortrait ? dragY : dragX, [-200, 200], isPortrait ? [15, -15] : [-25, 25]);
  // Removed opacity transform to prevent card from disappearing during drag

  // Monster leaning and mouth state based on drag (Portrait vs Landscape)
  const leftMonsterPos = useTransform(isPortrait ? dragY : dragX, isPortrait ? [0, 200] : [-200, 0], isPortrait ? [0, -20] : [20, 0]);
  const rightMonsterPos = useTransform(isPortrait ? dragY : dragX, isPortrait ? [-200, 0] : [0, 200], isPortrait ? [20, 0] : [0, -20]);
  
  // Sensitive mouth triggers (0 = idle, 1 = open)
  const leftMouthTrigger = useTransform(isPortrait ? dragY : dragX, isPortrait ? [0, 20] : [-20, 0], isPortrait ? [0, 1] : [1, 0]);
  const rightMouthTrigger = useTransform(isPortrait ? dragY : dragX, isPortrait ? [-20, 0] : [0, 20], isPortrait ? [1, 0] : [0, 1]);

  useEffect(() => {
    if (isAnimating) return;
    const unsubscribeLeft = leftMouthTrigger.on('change', (v) => {
      setMonsterState(prev => ({ ...prev, left: v > 0.5 ? 'open' : 'idle' }));
    });
    const unsubscribeRight = rightMouthTrigger.on('change', (v) => {
      setMonsterState(prev => ({ ...prev, right: v > 0.5 ? 'open' : 'idle' }));
    });
    return () => {
      unsubscribeLeft();
      unsubscribeRight();
    };
  }, [leftMouthTrigger, rightMouthTrigger, isAnimating]);

  const cardControls = useAnimation();
  const stackControls = useAnimation();
  const spitControls = useAnimation();
  const heartControls = useAnimation();
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const audioSequenceRef = useRef(0); // New: Track audio sequence ID
  const cardRef = useRef<HTMLDivElement>(null);
  const mcRef = useRef<any>(null);
  const suppressClickRef = useRef(false);
  const completionRef = useRef<HTMLDivElement>(null);
  const [restartBottom, setRestartBottom] = useState(24);

  // Initialize Audio
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, src]) => {
      audioRefs.current[key] = new Audio(src);
    });
  }, []);

  // Position the restart button midway between card bottom and screen bottom
  useEffect(() => {
    const updateRestartPos = () => {
      if (words.length === 0 && completionRef.current) {
        const rect = completionRef.current.getBoundingClientRect();
        const space = Math.max(0, window.innerHeight - rect.bottom);
        const b = Math.max(8, Math.round(space / 2));
        setRestartBottom(b);
      }
    };
    updateRestartPos();
    window.addEventListener('resize', updateRestartPos);
    return () => window.removeEventListener('resize', updateRestartPos);
  }, [words.length, isPortrait, contentScale]);

  const playSound = (name: string) => {
    const audio = audioRefs.current[name];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  const stopAudio = useCallback(() => {
    window.speechSynthesis.cancel();
    setActiveSpeech('');
    audioSequenceRef.current = 0;
  }, []);

  // Load Data
  useEffect(() => {
    const loadWords = () => {
      try {
        const parsedWords = [...WORD_BANK];
        setAllWords(parsedWords);

        // Reset persisted progress when the built-in word bank changes.
        const savedVersion = localStorage.getItem('vibe_bank_version');
        if (savedVersion !== WORD_BANK_VERSION) {
          localStorage.removeItem('vibe_learned');
          localStorage.removeItem('vibe_words');
          localStorage.removeItem('vibe_score');
          localStorage.setItem('vibe_bank_version', WORD_BANK_VERSION);
        }

        const savedLearned = localStorage.getItem('vibe_learned');
        const savedWords = localStorage.getItem('vibe_words');
        const savedScore = localStorage.getItem('vibe_score');
        
        if (savedLearned) {
          const learned = JSON.parse(savedLearned) as Word[];
          setLearnedList(learned);
          
          if (savedWords) {
            setWords(JSON.parse(savedWords));
          } else {
            const now = Date.now();
            const due = learned.filter((w: Word) => w.nextReview && w.nextReview <= now);
            const notLearned = parsedWords.filter(pw => !learned.some((lw: Word) => lw.base === pw.base));
            setWords([...due, ...notLearned]);
          }
        } else {
          setWords(parsedWords);
        }
        
        if (savedScore) {
          setScore(parseInt(savedScore));
        }
      } catch (error) {
        console.error('Error loading words:', error);
        setWords(WORD_BANK);
      }
    };

    loadWords();
  }, []);

  // Save Data
  useEffect(() => {
    if (started) {
      localStorage.setItem('vibe_bank_version', WORD_BANK_VERSION);
      localStorage.setItem('vibe_learned', JSON.stringify(learnedList));
      localStorage.setItem('vibe_words', JSON.stringify(words));
      localStorage.setItem('vibe_score', score.toString());
    }
  }, [learnedList, words, score, started]);

  // Set random phrase when finished
  useEffect(() => {
    if (words.length === 0 && started) {
      setCompletionPhrase(FINNISH_PHRASES[Math.floor(Math.random() * FINNISH_PHRASES.length)]);
    }
  }, [words.length, started]);

  const speakSequence = (word: Word) => {
    stopAudio(); // Stop any previous
    const sequenceId = Date.now();
    audioSequenceRef.current = sequenceId;

    const clean = (txt: string) => String(txt).replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
    
    const speak = (t: string, type: string) => new Promise<void>((resolve) => {
      if (audioSequenceRef.current !== sequenceId) return resolve();
      
      const ut = new SpeechSynthesisUtterance(t);
      ut.onstart = () => {
        if (audioSequenceRef.current === sequenceId) setActiveSpeech(type);
        else window.speechSynthesis.cancel();
      };
      ut.onend = () => { 
        if (audioSequenceRef.current === sequenceId) setActiveSpeech(''); 
        resolve(); 
      };
      ut.onerror = () => resolve();
      window.speechSynthesis.speak(ut);
    });

    (async () => {
      if (audioSequenceRef.current !== sequenceId) return;
      await speak(clean(word.base), 'base');
      if (audioSequenceRef.current !== sequenceId) return;
      await speak(clean(word.past), 'past');
      if (audioSequenceRef.current !== sequenceId) return;
      await speak(clean(word.participle), 'pp');
    })();
  };

  // Reset audio state when current word changes
  useEffect(() => {
    setHasPlayedAudio(false);
    stopAudio();
  }, [words, stopAudio]);

  const resetMonsters = () => {
    setMouthOpen({ left: 0, right: 0 });
    setMonsterLean({ left: 0, right: 0 });
    setMonsterState({ left: 'idle', right: 'idle' });
  };
  
  const requestSwipe = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (!hasPlayedAudio) {
      handleFlip();
      return;
    }
    handleSwipe(direction);
  };

  const handleFlip = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    const newFlipped = !isFlipped;
    
    if (newFlipped) {
      // Front -> Back: 0 -> 90 (switch) -> 180
      await cardControls.start({ 
        scale: 1.1, 
        rotateY: 90,
        transition: { duration: 0.15, ease: "easeOut" }
      });
      setIsFlipped(true);
      await cardControls.start({ 
        scale: 1, 
        rotateY: 180,
        transition: { duration: 0.15, ease: "easeIn" }
      });
      
      // Only play audio if it hasn't been played for this card yet
      if (!hasPlayedAudio) {
        speakSequence(currentWord);
        setHasPlayedAudio(true);
      }
    } else {
      // Back -> Front: 180 -> 90 (switch) -> 0
      await cardControls.start({ 
        scale: 1.1, 
        rotateY: 90,
        transition: { duration: 0.15, ease: "easeOut" }
      });
      setIsFlipped(false);
      await cardControls.start({ 
        scale: 1, 
        rotateY: 0,
        transition: { duration: 0.15, ease: "easeIn" }
      });
      stopAudio(); // Stop audio when flipping back
    }
    
    setIsAnimating(false);
  };

  const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up' | 'down') => {
    if (isAnimating || words.length === 0) return;
    stopAudio(); 
    setIsAnimating(true);

    try {
      const isSuccess = direction === 'right' || direction === 'up';
      const targetMonster = isSuccess ? 'right' : 'left';

      // 1. Monster opens mouth immediately
      setMonsterState(prev => ({ ...prev, [targetMonster]: 'open' }));

      if (isSuccess) {
        confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
        playSound('success');
      } else {
        playSound('swipe');
      }

      // 2. Card flies to monster's head
      const targetX = isPortrait ? 0 : (direction === 'left' ? -460 : 460);
      const targetY = isPortrait ? (direction === 'up' ? -410 : 410) : 0;

      setPromoteSecond(true);

      const animX = animate(dragX, targetX, { duration: 0.5, ease: "easeIn" });
      const animY = animate(dragY, targetY, { duration: 0.5, ease: "easeIn" });

      await Promise.all([
        animX,
        animY,
        cardControls.start({
          scale: 0.001,
          opacity: 0,
          transition: { duration: 0.5, ease: "easeIn" }
        })
      ]);

      // --- IMMEDIATE STATE UPDATE ---
      // Update words and promote second card while monster performs feedback animations
      const word = words[0];
      const remainingWords = words.slice(1);
      
      if (word) {
        if (isSuccess) {
          const nextStage = (word.stage || 0) + 1;
          const intervals = [1, 2, 5, 15, 30];
          const nextReview = Date.now() + (intervals[Math.min(nextStage - 1, 4)] * 24 * 60 * 60 * 1000);
          const updatedWord = { ...word, stage: nextStage, nextReview };
          setLearnedList(prev => [...prev.filter(p => p.base !== word.base), updatedWord]);
          setWords(remainingWords);
        } else {
          setWords([...remainingWords, { ...word, stage: 0 }]);
        }
      }
      setPromoteSecond(false);
      // Reset active card motion values for the NEW current card
      dragX.set(0);
      dragY.set(0);
      cardControls.set({ scale: 1, opacity: 1, rotateY: 0, y: 0 });

      // 3. Monster Actions (Happy/Spit)
      if (isSuccess) {
        // --- RIGHT MONSTER (GOT IT) ---
        setMonsterState(prev => ({ ...prev, right: 'happy' }));

        const monsterEl = document.querySelector('.monster-right');
        const trophyEl = document.querySelector('.trophy-icon');
        
        if (monsterEl && trophyEl) {
          const mRect = monsterEl.getBoundingClientRect();
          const tRect = trophyEl.getBoundingClientRect();
          
          let startX = mRect.left + mRect.width / 2;
          let startY = mRect.top; 

          if (isPortrait) {
            startY = mRect.bottom - 40; 
          } else {
            startX = mRect.left + 40; 
            startY = mRect.top + mRect.height / 2;
          }

          const endX = tRect.left + tRect.width / 2;
          const endY = tRect.top + tRect.height / 2;

          setShowHeart(true);
          await new Promise(r => setTimeout(r, 30));

          heartControls.set({ x: startX, y: startY, scale: 0.5, opacity: 1 });
          
          await heartControls.start({
            x: endX,
            y: endY,
            scale: [1, 1.5, 1],
            opacity: [1, 1, 0],
            transition: { duration: 0.8, ease: "easeInOut" }
          });

          setShowHeart(false);
          setScore(prev => prev + 1);
          setTrophyBump(true);
          setTimeout(() => setTrophyBump(false), 200);
          playSound('ding');
        }
        
        await new Promise(r => setTimeout(r, 400));

      } else {
        // --- LEFT MONSTER (FORGOT) ---
        setMonsterState(prev => ({ ...prev, left: 'spit' }));
        playSound('spit');
        
        const currentWordToReturn = words[0];
        setReturningWord(currentWordToReturn);
        setIsReturning(true);
        setIsStackOpening(true); 
        
        await new Promise(r => setTimeout(r, 30));

        const monsterEl = document.querySelector('.monster-left');
        let spitStartX = 0;
        let spitStartY = 0;

        if (monsterEl) {
          const mRect = monsterEl.getBoundingClientRect();
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;

          if (isPortrait) {
             spitStartX = 0;
             spitStartY = (mRect.top + 40) - centerY;
          } else {
             spitStartX = (mRect.right - 40) - centerX;
             spitStartY = 0;
          }
        } else {
           spitStartX = isPortrait ? 0 : -460;
           spitStartY = isPortrait ? 410 : 0;
        }
        
        // 2. Small card flies out, gets slightly bigger, then flies back to center
        // Scale is capped at 0.7 as requested
        spitControls.set({ x: spitStartX, y: spitStartY, scale: 0.2, opacity: 1, rotate: 180 });
        await spitControls.start({
          x: 0,
          y: 0,
          scale: 0.6,
          opacity: 1,
          rotate: 0,
          transition: { duration: 0.28, ease: 'linear' }
        });

        setMonsterState(prev => ({ ...prev, left: 'idle' }));
        setIsReturning(false);
        setIsStackOpening(false);
      }

      // (state already updated above)

    } catch (error) {
      console.error("Animation error:", error);
    } finally {
      // 5. Final Resets - ALWAYS EXECUTE
      setIsFlipped(false);
      setIsAnimating(false);
      setPromoteSecond(false);
      setIsReturning(false);
      setReturningWord(null); 
      setIsStackOpening(false);
      resetMonsters();
      
      dragX.set(0);
      dragY.set(0);
      cardControls.set({ scale: 1, opacity: 1, rotateY: 0, y: 0 });
    }
  }, [words, isAnimating, isPortrait, heartControls, spitControls, score, dragX, dragY, cardControls]);

  const handleRestart = () => {
    setLearnedList([]);
    setWords(allWords);
    // Score is NOT reset
    setStarted(true);
  };

  // Hammer.js removed in favor of motion's drag
  useEffect(() => {
    // No longer needed
  }, []);

  const currentWord = words[0];
  const nextWord = words[1];

  if (!started) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-indigo-50 p-6">
        <div className={`relative flex items-center justify-center w-full ${isPortrait ? 'h-full max-h-[520px] translate-y-[-50px] px-4' : 'flex-1 min-h-0'}`}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative flex items-center justify-center w-full h-full`}
            style={!isPortrait && contentScale !== 1 ? { scale: contentScale } : {}}
          >
            <div className={`w-full max-w-[280px] ${isPortrait ? 'aspect-[3/2.2]' : 'aspect-[3/2.2] max-h-[60vh]'} bg-white rounded-[2.5rem] shadow-2xl border-4 border-slate-100 flex flex-col items-center justify-center p-10 text-center`}>
              <div className="text-8xl mb-6 drop-shadow-lg">✍️</div>
              <h1 className="text-4xl font-black text-indigo-900 mb-2 italic tracking-tight">Word Expedition</h1>
              <p className="text-sm text-slate-400 mb-10 font-medium">Master irregular verbs with your monster friends!</p>
            </div>
          </motion.div>
          <div className={`absolute left-1/2 -translate-x-1/2 ${startEndCompact ? 'bottom-2 scale-[0.7]' : 'bottom-6'}`}>
            <button 
              onClick={() => { 
                // Only reset to all words if it's the very first time (no learned list and no words)
                if (words.length === 0 && learnedList.length === 0) {
                  setWords(allWords);
                }
                setStarted(true); 
              }} 
              className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold shadow-[0_10px_0_0_#4338ca] active:translate-y-1 active:shadow-none transition-all"
            >
              Start Expedition
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-50">
      
      {/* --- Monsters --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {isPortrait ? (
          <>
            {/* Top Monster (Right Logic) */}
            <motion.div 
              style={{ y: rightMonsterPos, rotate: 180, scale: 1.5 }}
              className="monster-container monster-right absolute top-[-30px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center transition-all duration-300"
            >
              <motion.img 
                src={MONSTER_ASSETS.right[monsterState.right as keyof typeof MONSTER_ASSETS.right] || MONSTER_ASSETS.right.idle} 
                alt="Top Monster" 
                className="w-32 h-32 object-contain" 
                animate={{
                  scaleY: [1, 1.05, 1],
                  scaleX: [1, 1.02, 1]
                }}
                transition={{
                  duration: rightMonsterDuration,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: 'bottom' }}
              />
            </motion.div>
            {/* Bottom Monster (Left Logic) */}
            <motion.div 
              style={{ y: leftMonsterPos, rotate: 0, scale: 1.5 }}
              className="monster-container monster-left absolute bottom-[-30px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center transition-all duration-300"
            >
              <motion.img 
                src={MONSTER_ASSETS.left[monsterState.left as keyof typeof MONSTER_ASSETS.left] || MONSTER_ASSETS.left.idle} 
                alt="Bottom Monster" 
                className="w-32 h-32 object-contain" 
                animate={{
                  scaleY: [1, 1.05, 1],
                  scaleX: [1, 1.02, 1]
                }}
                transition={{
                  duration: leftMonsterDuration,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: 'bottom' }}
              />
            </motion.div>
          </>
        ) : (
          <>
            {/* Left Monster */}
            <motion.div 
              style={{ x: leftMonsterPos, rotate: 90, scale: 1.2 }}
              className="monster-container monster-left absolute left-[-33px] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-300"
            >
              <motion.img 
                src={MONSTER_ASSETS.left[monsterState.left as keyof typeof MONSTER_ASSETS.left] || MONSTER_ASSETS.left.idle} 
                alt="Left Monster" 
                className="w-40 h-40 object-contain" 
                animate={{
                  scaleY: [1, 1.05, 1],
                  scaleX: [1, 1.02, 1]
                }}
                transition={{
                  duration: leftMonsterDuration,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: 'bottom' }}
              />
            </motion.div>
            {/* Right Monster */}
            <motion.div 
              style={{ x: rightMonsterPos, rotate: -90, scale: 1.2 }}
              className="monster-container monster-right absolute right-[-33px] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-300"
            >
              <motion.img 
                src={MONSTER_ASSETS.right[monsterState.right as keyof typeof MONSTER_ASSETS.right] || MONSTER_ASSETS.right.idle} 
                alt="Right Monster" 
                className="w-40 h-40 object-contain" 
                animate={{
                  scaleY: [1, 1.05, 1],
                  scaleX: [1, 1.02, 1]
                }}
                transition={{
                  duration: rightMonsterDuration,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: 'bottom' }}
              />
            </motion.div>
          </>
        )}
      </div>

      {/* --- Header / Stats --- */}
      <div className={`relative w-full h-full flex flex-col ${!isPortrait ? 'justify-between py-2' : ''}`}
        style={!isPortrait && layoutScale !== 1 ? { 
          transform: `scale(${layoutScale})`, 
          transformOrigin: 'center',
          width: `${100/layoutScale}%`,
          height: `${100/layoutScale}%`,
          position: 'absolute',
          left: '50%',
          top: '50%',
          translate: '-50% -50%'
        } : {}}
      >
      <div id="stats-container" className={`z-30 w-full max-w-md flex items-center justify-between gap-4 ${isPortrait ? 'mb-8 mt-24' : 'flex-none mt-2 px-4 mx-auto'}`}>
        <div className="flex gap-2">
          <button onClick={() => { setShowReviewList(true); stopAudio(); }} className="bg-white px-4 py-2 rounded-2xl shadow-sm border-b-4 border-blue-400 text-center min-w-[80px] active:scale-95 transition">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Review</div>
            <div className="text-xl font-black text-blue-600">{words.length}</div>
          </button>
          <button onClick={() => { setShowMasteredList(true); stopAudio(); }} className="bg-white px-4 py-2 rounded-2xl shadow-sm border-b-4 border-green-400 text-center min-w-[80px] active:scale-95 transition">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Mastered</div>
            <div className="text-xl font-black text-green-600">{learnedList.length}</div>
          </button>
        </div>
        <div className="flex items-center gap-2 relative">
          <div className={`bg-white px-4 py-2 rounded-full shadow-md border-2 border-amber-100 flex items-center gap-2 transition-transform ${trophyBump ? 'scale-125 border-amber-400' : ''}`}>
            <span className="trophy-icon flex items-center">
              <Trophy className="w-5 h-5 text-amber-500 fill-amber-500" />
            </span>
            <span className="font-black text-amber-700">{score}</span>
          </div>
          <button onClick={() => { setShowAbout(true); stopAudio(); }} className="bg-white p-2 rounded-full shadow-md text-indigo-500 active:scale-90 transition hover:bg-indigo-50">
            <Lightbulb className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className={`relative flex items-center justify-center w-full ${isPortrait ? 'h-full max-h-[520px] translate-y-[-50px] px-4' : 'flex-1 min-h-0'}`}>
        
        <motion.div 
          animate={stackControls} 
          className={`relative z-20 flex items-center justify-center w-full h-full ${isPortrait && words.length > 0 ? 'translate-x-[-40px]' : ''}`}
          style={!isPortrait && contentScale !== 1 ? { scale: contentScale } : {}}
        >
          
          {/* Background Card (Pre-loading next word) */}
          {words[2] && promoteSecond && (
            <motion.div 
              key={words[2].base}
              initial={{ opacity: 0, scale: 1, rotate: 5 }}
              animate={{ opacity: 0.7, scale: 1, rotate: 5 }}
              transition={{ duration: 0.3 }}
              className={`absolute w-full max-w-[280px] ${isPortrait ? 'aspect-[3/2.2]' : 'aspect-[3/2.2] max-h-[60vh]'} bg-white rounded-[2.5rem] shadow-sm border-4 border-slate-50 z-0`}
            >
              <div className="flex flex-col items-center justify-center h-full opacity-20 p-4">
                <div className="text-5xl mb-4">{words[2].icon || '✨'}</div>
                <div className="text-2xl font-bold text-slate-800">{words[2].base}</div>
              </div>
            </motion.div>
          )}

          {/* Second Card */}
          <AnimatePresence>
            {nextWord && (
              <motion.div 
                key={nextWord.base}
                initial={{ opacity: 0, scale: 1, rotate: 5 }}
                animate={{ 
                  opacity: promoteSecond ? 1 : 0.9, 
                  scale: 1, 
                  rotate: promoteSecond ? 0 : 5,
                  y: isStackOpening ? -20 : 0
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={`absolute w-full max-w-[280px] ${isPortrait ? 'aspect-[3/2.2]' : 'aspect-[3/2.2] max-h-[60vh]'} bg-white rounded-[2.5rem] shadow-lg border-4 border-slate-50 z-10`}
              >
                <div className="flex flex-col items-center justify-center h-full opacity-20 p-4">
                  <div className="text-5xl mb-4">{nextWord.icon || '✨'}</div>
                  <div className="text-2xl font-bold text-slate-800">{nextWord.base}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Active Card Stack */}
          <div className={`perspective-1000 w-full max-w-[280px] ${words.length === 0 ? (isPortrait ? 'aspect-[3/4.5]' : 'h-[75vh]') : (isPortrait ? 'aspect-[3/2.2]' : 'aspect-[3/2.2] max-h-[60vh]')} z-20 transition-all duration-500`}>
            <AnimatePresence initial={false} mode="popLayout">
              {words.length > 0 ? (
                <motion.div
                  key={currentWord.base}
                  drag={hasPlayedAudio ? (isPortrait ? "y" : "x") : false}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={1}
                  style={{ 
                    x: dragX, 
                    y: dragY, 
                    rotate: rotateValue, 
                    transformStyle: 'preserve-3d',
                    opacity: (isReturning && words.length === 1) ? 0 : 1
                  }}
                  initial={{ rotate: 0, scale: 1, rotateY: 0, opacity: 1 }}
                  animate={{ 
                    ...cardControls, 
                    scale: 1,
                    y: isStackOpening ? -15 : 0,
                    opacity: (isReturning && words.length === 1) ? 0 : 1
                  }}
                  onPointerDown={(e) => {
                    if (!hasPlayedAudio) {
                      suppressClickRef.current = true;
                      handleFlip();
                    }
                  }}
                  onDragStart={() => {
                    if (!hasPlayedAudio) {
                      handleFlip();
                      return;
                    }
                    stopAudio();
                  }}
                  onDragEnd={(_, info) => {
                    if (!hasPlayedAudio) return;
                    const threshold = 100;
                    if (isPortrait) {
                      if (info.offset.y < -threshold) handleSwipe('up');
                      else if (info.offset.y > threshold) handleSwipe('down');
                      else { animate(dragX, 0); animate(dragY, 0); resetMonsters(); }
                    } else {
                      if (info.offset.x > threshold) handleSwipe('right');
                      else if (info.offset.x < -threshold) handleSwipe('left');
                      else { animate(dragX, 0); animate(dragY, 0); resetMonsters(); }
                    }
                  }}
                  onClick={() => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }
                    handleFlip();
                  }}
                  className="relative w-full h-full cursor-grab active:cursor-grabbing"
                >
                  {/* Front */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-[2.5rem] shadow-2xl border-4 border-slate-100 flex flex-col items-center justify-center p-6">
                    <div className="text-7xl mb-6 drop-shadow-md">{currentWord?.icon}</div>
                    <div className="text-4xl font-black text-slate-800 tracking-tight">{currentWord?.base}</div>
                    <div className="mt-6 text-indigo-300 font-bold tracking-widest uppercase text-[10px] animate-pulse bg-indigo-50 px-4 py-1 rounded-full">Tap to Reveal</div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-[2.5rem] shadow-2xl border-4 border-slate-100 flex flex-col items-center justify-center p-8" style={{ transform: 'rotateY(180deg)' }}>
                    <div className={`text-xl font-medium mb-6 transition-all ${activeSpeech === 'base' ? 'text-indigo-600 scale-110 font-bold' : 'text-slate-400'}`}>
                      {currentWord?.base}
                    </div>
                    <div className="flex flex-col gap-8 text-center w-full">
                      <div className={`text-4xl font-black transition-all ${activeSpeech === 'past' ? 'text-indigo-600 scale-110' : 'text-slate-800'}`}>
                        {currentWord?.past}
                      </div>
                      <div className={`text-4xl font-black transition-all ${activeSpeech === 'pp' ? 'text-indigo-600 scale-110' : 'text-slate-800'}`}>
                        {currentWord?.participle}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div ref={completionRef} className="w-full h-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-slate-100 flex flex-col items-center justify-center p-10 text-center overflow-hidden">
                  <div className="text-8xl mb-6 animate-bounce">{completionPhrase.split(' ')[0]}</div>
                  <h2 className="text-3xl font-black text-indigo-900 mb-2">{completionPhrase.split(' ').slice(1).join(' ')}</h2>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">Mission Complete!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        {words.length === 0 && (
          <div className="absolute left-1/2 -translate-x-1/2 z-30" style={{ bottom: restartBottom }}>
            <button 
              onClick={handleRestart} 
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all uppercase text-xs tracking-widest"
            >
              Restart Journey
            </button>
          </div>
        )}

        {/* --- Portrait Controls --- */}
        {isPortrait && words.length > 0 && (
          <div className="absolute right-[-10px] top-[calc(50%-25px)] -translate-y-1/2 flex flex-col gap-6 z-30">
            <button onClick={() => requestSwipe('up')} className="bg-white p-4 rounded-3xl shadow-lg active:scale-90 transition flex flex-col items-center gap-1 text-green-500 border-2 border-transparent hover:border-green-100">
              <ChevronUp className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase">Got It</span>
            </button>
            <button onClick={() => requestSwipe('down')} className="bg-white p-4 rounded-3xl shadow-lg active:scale-90 transition flex flex-col items-center gap-1 text-red-500 border-2 border-transparent hover:border-red-100">
              <ChevronDown className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase">Forgot</span>
            </button>
          </div>
        )}
      </div>

      {/* --- Landscape Controls --- */}
      {!isPortrait && words.length > 0 && (
        <div className="z-30 w-full max-w-md flex justify-between gap-8 mb-2 mx-auto flex-none">
          <button onClick={() => requestSwipe('left')} className="flex-1 bg-white p-5 rounded-3xl shadow-lg active:scale-90 transition flex items-center justify-center gap-4 text-red-500 border-2 border-transparent hover:border-red-100">
            <ChevronLeft className="w-8 h-8" />
            <span className="font-black uppercase tracking-widest">Forgot</span>
          </button>
          <button onClick={() => requestSwipe('right')} className="flex-1 bg-white p-5 rounded-3xl shadow-lg active:scale-90 transition flex items-center justify-center gap-4 text-green-500 border-2 border-transparent hover:border-green-100">
            <span className="font-black uppercase tracking-widest">Got It</span>
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
      </div>

      {/* Heart Animation (Root level to avoid transform trapping) */}
      <AnimatePresence>
        {showHeart && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={heartControls} 
            className="fixed left-0 top-0 text-red-500 pointer-events-none z-[200]"
            style={{ x: -50, y: -50 }}
          >
            <div className="relative">
              <span className="text-4xl drop-shadow-lg">❤️</span>
              {[0.1, 0.2, 0.3].map((delay, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0.6, scale: 0.8 }}
                  animate={{ 
                    opacity: 0,
                    scale: 0.4,
                    x: -20 * (i + 1),
                    y: 10 * (i + 1)
                  }}
                  transition={{ duration: 0.4, delay }}
                  className="absolute left-0 top-0 text-2xl opacity-40"
                >
                  ❤️
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Returning/Spitting Card (Root level to avoid transform trapping) */}
      <AnimatePresence>
        {isReturning && returningWord && (
          <motion.div 
            key="returning-card"
            initial={{ opacity: 0 }}
            animate={spitControls} 
            exit={{ opacity: 0, transition: { duration: 0 } }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[280px] ${isPortrait ? 'aspect-[3/2.2]' : 'aspect-[3/2.2] max-h-[60vh]'} bg-white rounded-[2.5rem] shadow-2xl border-4 border-slate-100 z-0 pointer-events-none flex flex-col items-center justify-center p-6`} 
          >
            <div className="text-7xl mb-6 drop-shadow-md">{returningWord.icon}</div>
            <div className="text-4xl font-black text-slate-800 tracking-tight">{returningWord.base}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showAbout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowAbout(false)}>
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                <h3 className="font-black text-indigo-900 uppercase tracking-widest text-xs">Expedition Guide</h3>
                <button onClick={() => setShowAbout(false)} className="bg-white p-1 rounded-full shadow-sm text-slate-300 hover:text-slate-500 transition"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-8 space-y-8 text-slate-600">
                <div className="flex gap-5">
                  <div className="bg-green-100 p-4 rounded-2xl text-green-600 h-fit shadow-sm">
                    {isPortrait ? <ChevronUp className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Got It</h4>
                    <p className="text-sm leading-relaxed">
                      {isPortrait ? "Swipe up" : "Swipe right"} if you know the word. It will return later based on spaced repetition.
                    </p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="bg-red-100 p-4 rounded-2xl text-red-600 h-fit shadow-sm">
                    {isPortrait ? <ChevronDown className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Forgot</h4>
                    <p className="text-sm leading-relaxed">
                      {isPortrait ? "Swipe down" : "Swipe left"} if you're unsure. The word will stay in your review queue.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showReviewList || showMasteredList) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => { setShowReviewList(false); setShowMasteredList(false); }}>
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }} className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                <h3 className="font-black text-indigo-900 uppercase tracking-widest text-xs">{showReviewList ? 'Review Queue' : 'Mastered Words'}</h3>
                <button onClick={() => { setShowReviewList(false); setShowMasteredList(false); }} className="bg-white p-1 rounded-full shadow-sm text-slate-300 hover:text-slate-500 transition"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 overflow-y-auto">
                {(showReviewList ? words : learnedList).map((w, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition border-b border-slate-50 last:border-0">
                    <div className="text-3xl">{w.icon}</div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800">{w.base}</div>
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-tighter">{w.past} · {w.participle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .monster-container { pointer-events: none; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .perspective-1000 { perspective: 1000px; }
        .chew-shake { animation: chewShake 0.22s ease-in-out infinite alternate; }
        @keyframes chewShake {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(2px) scale(0.98); }
        }
      `}</style>
    </div>
  );
}
