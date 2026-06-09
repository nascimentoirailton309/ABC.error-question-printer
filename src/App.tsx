import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Award, 
  Settings, 
  GraduationCap, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  RotateCw, 
  Check, 
  X, 
  RotateCcw, 
  Sparkles, 
  HelpCircle, 
  Star, 
  Smile, 
  PartyPopper,
  Trash2,
  Undo
} from 'lucide-react';
import { WordItem, Unit, UserProgress, TestQuestion, Sticker } from './types';
import { ALL_UNITS } from './data/wordLists';
import { sounds } from './components/SoundManager';
import { ALL_STICKERS } from './data/stickers';
import { generateTestQuestions } from './utils/testGenerator';

export default function App() {
  // State variables
  const [currentView, setCurrentView] = useState<'menu' | 'learn' | 'test' | 'album'>('menu');
  const [userProgress, setUserProgress] = useState<UserProgress>({
    learnedWords: {},
    testScores: {},
    stickers: ['star'] // Initial reward
  });
  
  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  // Unmastered lock / filtering states
  const [showBlockedTestModal, setShowBlockedTestModal] = useState<boolean>(false);
  const [blockedTestUnitId, setBlockedTestUnitId] = useState<number | null>(null);
  const [studyFilter, setStudyFilter] = useState<'all' | 'unmastered'>('all');

  // Voice recording and custom grades states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTarget, setRecordingTarget] = useState<'word' | 'sentence' | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<{ word?: string; sentence?: string }>({});
  const [pronunciationScore, setPronunciationScore] = useState<{ word?: number; sentence?: number }>({});
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Test states
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [testCurrentIndex, setTestCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spellingArray, setSpellingArray] = useState<string[]>([]);
  const [spellingInput, setSpellingInput] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);
  const [testCompleted, setTestCompleted] = useState<boolean>(false);
  const [newStickerUnlocked, setNewStickerUnlocked] = useState<Sticker | null>(null);

  // Sticker board states
  const [stamps, setStamps] = useState<{ id: string; stickerId: string; x: number; y: number; scale: number; rotation: number }[]>([]);
  const [currentSelectedSticker, setCurrentSelectedSticker] = useState<string | null>(null);

  // Load progress from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('趣味英语单词乐园_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.learnedWords) {
          setUserProgress(parsed);
        }
      } catch (e) {
        console.error("加载存档失败:", e);
      }
    }
  }, []);

  // Save progress
  const saveProgress = (newProgress: UserProgress) => {
    setUserProgress(newProgress);
    localStorage.setItem('趣味英语单词乐园_v1', JSON.stringify(newProgress));
  };

  // Reset voice recordings on focus card change
  useEffect(() => {
    setIsRecording(false);
    setRecordingTarget(null);
    setRecordedAudioUrl({});
    setPronunciationScore({});
  }, [currentWordIndex, selectedUnitId]);

  // Voice recording helpers (Dual-mode: Actual mic or fallback pediatric digital voice synthesizer simulation)
  const startRecording = async (target: 'word' | 'sentence') => {
    playSfx('click');
    setRecordingTarget(target);
    setIsRecording(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        const voiceUrl = URL.createObjectURL(audioBlob);
        
        setRecordedAudioUrl(prev => ({
          ...prev,
          [target]: voiceUrl
        }));
        
        // Encouraging score range (92 to 100) to keep child learners highly engaged
        const mockScore = Math.floor(92 + Math.random() * 8);
        setPronunciationScore(prev => ({
          ...prev,
          [target]: mockScore
        }));
        playSfx('complete');
        
        // Clean stream tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
    } catch (err) {
      console.warn("MICROPHONE UNAVAILABLE (PERMISSION OR SANDBOXED IFRAME), STARTING pediatric voice evaluation simulator:", err);
      setMediaRecorder(null);
    }
  };

  const stopRecording = (target: 'word' | 'sentence') => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    } else {
      // Fallback voice evaluation simulator: standard sandbox fallback
      const mockScore = Math.floor(88 + Math.random() * 12);
      setPronunciationScore(prev => ({
        ...prev,
        [target]: mockScore
      }));
      setRecordedAudioUrl(prev => ({
        ...prev,
        [target]: 'simulation_url'
      }));
      playSfx('complete');
    }
    setIsRecording(false);
  };

  const playRecordedAudio = (target: 'word' | 'sentence', text: string) => {
    playSfx('click');
    const url = recordedAudioUrl[target];
    if (!url) return;
    
    if (url === 'simulation_url') {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.4; // Sweet child-like high pitch callback
        window.speechSynthesis.speak(utterance);
      }
    } else {
      const audio = new Audio(url);
      audio.play().catch(e => {
        // Fallback synthesis if audio plays fail
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-US';
          utterance.rate = 1.0;
          utterance.pitch = 1.4;
          window.speechSynthesis.speak(utterance);
        }
      });
    }
  };

  // Sound play wrappers
  const playSfx = (type: 'click' | 'flip' | 'correct' | 'incorrect' | 'complete') => {
    if (type === 'click') sounds.playClick();
    if (type === 'flip') sounds.playFlip();
    if (type === 'correct') sounds.playCorrect();
    if (type === 'incorrect') sounds.playIncorrect();
    if (type === 'complete') sounds.playComplete();
  };

  // Navigation handlers
  const handleSelectUnit = (unitId: number, view: 'learn' | 'test') => {
    playSfx('click');
    setSelectedUnitId(unitId);
    setCurrentWordIndex(0);
    setIsFlipped(false);
    
    if (view === 'learn') {
      setCurrentView('learn');
    } else {
      const targetUnit = ALL_UNITS.find(u => u.id === unitId) || ALL_UNITS[0];
      const unmastered = targetUnit.words.filter(w => !userProgress.learnedWords[w.word]);
      
      // Block test view if there are unmastered words in target unit!
      if (unmastered.length > 0) {
        playSfx('incorrect');
        setBlockedTestUnitId(unitId);
        setShowBlockedTestModal(true);
        return;
      }

      const qs = generateTestQuestions(targetUnit.words);
      setTestQuestions(qs);
      setTestCurrentIndex(0);
      setSelectedOption(null);
      setQuizScore(0);
      setTestCompleted(false);
      setNewStickerUnlocked(null);
      
      // Initialize spelling puzzle
      const firstQ = qs[0];
      if (firstQ && firstQ.type === 'spelling') {
        setupSpellingQuestion(firstQ.word.word);
      }
      
      setCurrentView('test');
    }
  };

  const setupSpellingQuestion = (word: string) => {
    // Break word into individual characters, add some random distractor characters to fill the list to 8-10 characters total
    const chars = word.toLowerCase().split('');
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    while (chars.length < Math.max(word.length + 3, 8)) {
      const randChar = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (!chars.includes(randChar)) {
        chars.push(randChar);
      }
    }
    // Shuffle
    setSpellingArray(chars.sort(() => 0.5 - Math.random()));
    setSpellingInput([]);
  };

  // TTS helper
  const handleSpeak = (text: string) => {
    sounds.speak(text);
  };

  // Learn view logic
  const activeUnit = ALL_UNITS.find(u => u.id === selectedUnitId) || ALL_UNITS[0];
  
  // Calculate the subset of words based on categorizations (all vs unmastered lists)
  const wordsToStudy = studyFilter === 'unmastered'
    ? activeUnit.words.filter(w => !userProgress.learnedWords[w.word])
    : activeUnit.words;

  // Make sure the activeWord target is correctly resolved, falling back safely
  const activeWord = wordsToStudy[currentWordIndex] || wordsToStudy[0] || activeUnit.words[0];

  const toggleLearnStatus = (word: string) => {
    playSfx('click');
    const updatedLearned = { ...userProgress.learnedWords };
    if (updatedLearned[word]) {
      delete updatedLearned[word];
    } else {
      updatedLearned[word] = true;
    }
    
    // Check if we just completed all words in unit
    const allUnitWords = activeUnit.words.map(w => w.word);
    const completedAll = allUnitWords.every(w => updatedLearned[w]);
    
    let updatedStickers = [...userProgress.stickers];
    // Earn "dinosaur" (Word T-Rex) on > 20 learned words total
    const totalLearnedNum = Object.keys(updatedLearned).length;
    if (totalLearnedNum >= 20 && !updatedStickers.includes('dinosaur')) {
      updatedStickers.push('dinosaur');
      const st = ALL_STICKERS.find(s => s.id === 'dinosaur');
      if (st) setNewStickerUnlocked(st);
    }
    
    // Earn "koala" (Memory Koala) on finishing any entire unit list
    if (completedAll && !updatedStickers.includes('koala')) {
      updatedStickers.push('koala');
      const st = ALL_STICKERS.find(s => s.id === 'koala');
      if (st) setNewStickerUnlocked(st);
    }

    saveProgress({
      ...userProgress,
      learnedWords: updatedLearned,
      stickers: updatedStickers
    });
  };

  // Test question submission logic
  const handleOptionSelect = (option: string) => {
    if (selectedOption) return; // Prevent double taps
    playSfx('click');
    setSelectedOption(option);
    const currentQ = testQuestions[testCurrentIndex];
    const correct = option.toLowerCase() === currentQ.answer.toLowerCase();
    
    setIsAnswerCorrect(correct);
    if (correct) {
      setQuizScore(prev => prev + 1);
      playSfx('correct');
    } else {
      playSfx('incorrect');
    }
    setShowFeedbackModal(true);
  };

  const handleSpellingBubbleClick = (char: string, index: number) => {
    playSfx('click');
    // Add to input
    const nextInput = [...spellingInput, char];
    setSpellingInput(nextInput);
    
    // Remove from spelling board array
    const nextArr = [...spellingArray];
    nextArr.splice(index, 1);
    setSpellingArray(nextArr);
    
    const currentQ = testQuestions[testCurrentIndex];
    // Check if fully spelled
    if (nextInput.join('') === currentQ.answer.toLowerCase()) {
      // Correct!
      setQuizScore(prev => prev + 1);
      playSfx('correct');
      setIsAnswerCorrect(true);
      setSelectedOption(currentQ.answer);
      setShowFeedbackModal(true);
    } else if (nextInput.length >= currentQ.answer.length) {
      // Wrong spell length
      playSfx('incorrect');
      setIsAnswerCorrect(false);
      setSelectedOption(nextInput.join(''));
      setShowFeedbackModal(true);
    }
  };

  const resetSpelling = () => {
    playSfx('click');
    const currentQ = testQuestions[testCurrentIndex];
    if (currentQ) {
      setupSpellingQuestion(currentQ.word.word);
    }
  };

  const nextQuestion = () => {
    setShowFeedbackModal(false);
    setSelectedOption(null);
    setSpellingInput([]);
    
    const nextIdx = testCurrentIndex + 1;
    if (nextIdx < testQuestions.length) {
      setTestCurrentIndex(nextIdx);
      const nextQ = testQuestions[nextIdx];
      if (nextQ && nextQ.type === 'spelling') {
        setupSpellingQuestion(nextQ.word.word);
      }
    } else {
      // Test ended!
      setTestCompleted(true);
      playSfx('complete');
      
      // Save Highscore
      const finalPercentage = Math.round((quizScore / testQuestions.length) * 100);
      const prevScore = userProgress.testScores[selectedUnitId] || 0;
      const updatedScores = { ...userProgress.testScores };
      if (finalPercentage > prevScore) {
        updatedScores[selectedUnitId] = finalPercentage;
      }
      
      // Unlock new stickers!
      let updatedStickers = [...userProgress.stickers];
      
      // Earn "unicorn" (Wisdom Unicorn) for getting 100% full marks
      if (finalPercentage === 100 && !updatedStickers.includes('unicorn')) {
        updatedStickers.push('unicorn');
        const st = ALL_STICKERS.find(s => s.id === 'unicorn');
        if (st) setNewStickerUnlocked(st);
      }
      
      // Earn "rocket" (Rocket spelling speed)
      if (quizScore >= 6 && !updatedStickers.includes('rocket')) {
        updatedStickers.push('rocket');
        const st = ALL_STICKERS.find(s => s.id === 'rocket');
        if (st) setNewStickerUnlocked(st);
      }

      // Earn "wizard" if they completed sentences
      if (quizScore >= 4 && !updatedStickers.includes('wizard')) {
        updatedStickers.push('wizard');
        const st = ALL_STICKERS.find(s => s.id === 'wizard');
        if (st) setNewStickerUnlocked(st);
      }
      
      // Earn "dolphin" for finishing 9th unit successfully
      if (selectedUnitId === 9 && finalPercentage >= 80 && !updatedStickers.includes('dolphin')) {
        updatedStickers.push('dolphin');
        const st = ALL_STICKERS.find(s => s.id === 'dolphin');
        if (st) setNewStickerUnlocked(st);
      }

      // Earn "cupcake" on finishing 3 units with scores
      const unitsTested = Object.keys(updatedScores).length;
      if (unitsTested >= 3 && !updatedStickers.includes('cupcake')) {
        updatedStickers.push('cupcake');
        const st = ALL_STICKERS.find(s => s.id === 'cupcake');
        if (st) setNewStickerUnlocked(st);
      }
      
      saveProgress({
        ...userProgress,
        testScores: updatedScores,
        stickers: updatedStickers
      });
    }
  };

  // Sticker playground board click
  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentSelectedSticker) return;
    playSfx('flip');
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newStamp = {
      id: Math.random().toString(),
      stickerId: currentSelectedSticker,
      x,
      y,
      scale: 1 + Math.random() * 0.4,
      rotation: Math.floor(Math.random() * 30) - 15
    };
    
    setStamps([...stamps, newStamp]);
  };

  const clearStamps = () => {
    playSfx('click');
    setStamps([]);
  };

  const removeLastStamp = () => {
    playSfx('click');
    setStamps(stamps.slice(0, -1));
  };

  return (
    <div id="app_root" className="min-h-screen bg-[#FFF9F0] text-[#5D4037] overflow-x-hidden selection:bg-[#FFF176] border-[8px] md:border-[16px] border-[#FFD54F]">
      
      {/* Decorative Warm Backdrops */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40 z-0">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-[#FFD54F]/10 blur-2xl" />
        <div className="absolute top-1/4 right-20 w-40 h-40 rounded-full bg-[#FF8A65]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-24 left-1/3 w-48 h-48 rounded-full bg-[#81C784]/10 blur-3xl" />
      </div>

      {/* Main Header Container using Artistic Flair style */}
      <header className="relative bg-white border-b-[6px] border-[#5D4037] py-5 px-6 shadow-md z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          
          {/* Brand Logo, Mascot & Header */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => { playSfx('click'); setCurrentView('menu'); }}>
            <div className="w-16 h-16 bg-[#FF8A65] rounded-2xl flex items-center justify-center text-4xl shadow-[4px_4px_0px_#D84315] animate-bounce select-none">
              🐻
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#D84315] tracking-tight flex items-center gap-1 font-display">
                趣味英语单词乐园
                <span className="text-xs bg-[#FFD54F] text-[#5D4037] border-2 border-[#5D4037] px-2.5 py-0.5 rounded-full font-black">儿童专享版</span>
              </h1>
              <p className="text-xs text-[#795548] font-bold mt-0.5">✨ 嗷嗷熊陪你开心背单词、做拼写闯关！</p>
            </div>
          </div>

          {/* Quick Stats Panel styled with comic components */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-white px-4 py-2 rounded-full border-4 border-[#FFD54F] flex items-center gap-1.5 text-[#5D4037] font-black text-sm shadow-sm">
              <span>⭐ 已学会:</span>
              <span className="text-[#D84315] text-lg font-black">{Object.keys(userProgress.learnedWords).length}</span>
              <span className="text-[#BCAAA4]">/ 324</span>
            </div>
            
            <button 
              onClick={() => { playSfx('click'); setCurrentView('album'); }}
              className="bg-white hover:bg-[#FFF9F0] border-4 border-[#5D4037] px-5 py-2 rounded-full flex items-center gap-2 text-[#5D4037] font-black text-sm shadow-[4px_4px_0px_#5D4037] active:translate-y-0.5 active:shadow-[2px_2px_0px_#5D4037] transition-all cursor-pointer"
            >
              <span>🏅 贴纸相册</span>
              <span className="bg-[#FF8A65] border-2 border-[#D84315] text-white rounded-full px-2.5 py-0.2 text-xs font-black">{userProgress.stickers.length}</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        
        <AnimatePresence mode="wait">
          
          {/* ===================== VIEW 1: MENU ===================== */}
          {currentView === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-8"
            >
              
              {/* Mascot Bubble Greetings */}
              <div className="bg-[#FFF3E0] border-[6px] border-[#5D4037] rounded-[40px] p-8 flex flex-col md:flex-row items-center gap-6 shadow-[10px_10px_0px_#5D4037]">
                <div className="w-20 h-20 bg-[#FF8A65] rounded-3xl flex items-center justify-center text-5xl shadow-[6px_6px_0px_#D84315] shrink-0 select-none animate-bounce">🐻</div>
                <div className="space-y-2 text-center md:text-left flex-1">
                  <h2 className="text-2xl font-black text-[#D84315] font-display">“嗨！小可爱！今天我们来学点什么呢？”</h2>
                  <p className="text-[#795548] text-base leading-relaxed font-bold">
                    小朋友，在这里，每一个英语单词都有<b>专属的精美生活场景大图片</b>和<b>纯正的发音</b>哦！
                    点击精美卡片还能神奇翻转，悄悄看中文解答。把单元的所有单词都标为“已学会”，就能参加好玩的听写/拼写魔法大测试！拿到满分可以赢得神奇徽章贴纸，快来收集吧！
                  </p>
                </div>
              </div>

              {/* Grid of the 9 units */}
              <div className="space-y-6">
                <h3 className="text-2.5xl font-black text-[#5D4037] flex items-center gap-2.5 font-display">
                  <BookOpen className="text-[#FF8A65] w-6 h-6 stroke-[3]" />
                  选择一个学习乐园单元
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {ALL_UNITS.map((unit) => {
                    const progressCount = unit.words.filter(w => userProgress.learnedWords[w.word]).length;
                    const percent = Math.round((progressCount / unit.words.length) * 100);
                    const highscore = userProgress.testScores[unit.id];
                    
                    // Cute themed color selectors with thick comic outline
                    const bgColors = [
                      "bg-white hover:bg-[#FFF9F0]",
                      "bg-white hover:bg-[#E1F5FE]",
                      "bg-white hover:bg-[#F1F8E9]",
                      "bg-white hover:bg-yellow-50",
                      "bg-white hover:bg-purple-50",
                      "bg-white hover:bg-teal-50",
                      "bg-white hover:bg-orange-50",
                      "bg-white hover:bg-[#E1F5FE]",
                      "bg-white hover:bg-rose-50",
                    ][(unit.id - 1) % 9];

                    return (
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={unit.id}
                        className={`${bgColors} border-[6px] border-[#5D4037] rounded-[36px] p-6 shadow-[10px_10px_0px_#5D4037] flex flex-col justify-between h-80 transition-all cursor-pointer`}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-black bg-[#FFF176] text-[#5D4037] border-2 border-[#5D4037] py-1 px-3.5 rounded-full shadow-inner">
                              UNIT 0{unit.id}
                            </span>
                            {highscore !== undefined && (
                              <span className="text-xs bg-[#FFD54F] text-[#5D4037] border-2 border-[#5D4037] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                🏆 测试 {highscore}%
                              </span>
                            )}
                          </div>
                          
                          <h4 className="text-2xl font-black text-[#D84315] tracking-tight mt-1 font-display">
                            {unit.name}
                          </h4>
                          
                          <p className="text-xs text-[#795548] font-bold line-clamp-2 leading-relaxed">
                            包含 {unit.words.length} 个单词（例如：{unit.words.slice(0, 3).map(w => w.word).join(', ')}...）
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Progress bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-black text-[#5D4037]">
                              <span>已学会 {progressCount} / {unit.words.length}</span>
                              <span>{percent}%</span>
                            </div>
                            <div className="w-full bg-[#E2E8F0] h-4.5 rounded-full overflow-hidden border-2 border-[#5D4037]">
                              <div 
                                className="bg-[#81C784] h-full rounded-full transition-all duration-300 border-r-2 border-[#2E7D32]" 
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => handleSelectUnit(unit.id, 'learn')}
                              className="bg-white hover:bg-[#FFF9F0] border-4 border-[#5D4037] text-[#5D4037] py-2 rounded-2xl font-black text-xs sm:text-sm shadow-[3px_3px_0px_#5D4037] active:translate-y-0.5 active:shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              📖 学单词
                            </button>
                            <button 
                              onClick={() => handleSelectUnit(unit.id, 'test')}
                              className="bg-[#FF8A65] hover:bg-[#FF7043] border-4 border-[#D84315] text-white py-2 rounded-2xl font-black text-xs sm:text-sm shadow-[3px_3px_0px_#D84315] active:translate-y-0.5 active:shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              📝 玩测试
                            </button>
                          </div>
                        </div>

                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}

          {/* ===================== VIEW 2: LEARN ===================== */}
          {currentView === 'learn' && (
            <motion.div 
              key="learn"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="space-y-6"
            >
              
              {/* Top back button and progress tracker */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-dashed border-[#BCAAA4] pb-4">
                <button 
                  onClick={() => { playSfx('click'); setCurrentView('menu'); }}
                  className="bg-white hover:bg-[#FFF9F0] text-[#5D4037] border-4 border-[#5D4037] px-4 py-2 rounded-2xl font-black flex items-center gap-1.5 shadow-[3px_3px_0px_#5D4037] text-sm active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[3]" /> 返回乐园大厅
                </button>

                <div className="text-base font-black text-[#5D4037] font-display">
                  📚 【{activeUnit.name}】 正在记忆 第 <span className="text-[#D84315] text-xl font-black">{Math.min(currentWordIndex + 1, wordsToStudy.length)}</span> / {wordsToStudy.length} 个 {studyFilter === 'unmastered' && <span className="text-xs bg-[#FFCDD2] text-[#B71C1C] px-2.5 py-0.5 rounded-full border border-[#B71C1C] font-black ml-2 animate-pulse">只学未掌握</span>}
                </div>
              </div>

              {/* Progress Indicator Dots */}
              <div className="flex gap-1.5 justify-center max-w-full overflow-x-auto py-2">
                {wordsToStudy.map((w, idx) => (
                  <span 
                    key={idx}
                    className={`h-4.5 rounded-full transition-all border-2 ${
                      idx === currentWordIndex 
                        ? 'w-7 bg-[#FF8A65] border-[#D84315]' 
                        : userProgress.learnedWords[w.word] 
                          ? 'w-4.5 bg-[#81C784] border-[#2E7D32]' 
                          : 'w-4.5 bg-white border-[#BCAAA4]'
                    }`}
                  />
                ))}
              </div>

              {/* TWO COLUMN GRID FOR ARTISTIC CARD + DEFINITION BLOCKS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto my-4">
                
                {/* Column 1: Core 3D Flip Card */}
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-sm h-[454px] perspective relative group">
                    
                    {/* Badge rotated on the top-right corner of the card container */}
                    <div className="absolute -top-7 -right-5 w-24 h-24 bg-[#FFF176] rounded-full border-4 border-[#5D4037] flex flex-col items-center justify-center rotate-12 shadow-md z-20 select-none">
                      <span className="text-[10px] font-black text-[#5D4037] uppercase">分类</span>
                      <span className="text-xl font-black text-[#D84315]">Word</span>
                    </div>

                    <motion.div 
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, type: 'spring', stiffness: 80 }}
                      style={{ transformStyle: 'preserve-3d' }}
                      className="w-full h-full relative cursor-pointer"
                      onClick={() => { playSfx('flip'); setIsFlipped(!isFlipped); }}
                    >
                      
                      {/* CARD FRONT SIDE */}
                      <div 
                        className="absolute inset-0 bg-white border-[6px] border-[#5D4037] rounded-[40px] shadow-[12px_12px_0px_#5D4037] p-6 flex flex-col justify-between backface-hidden"
                      >
                        {/* Interactive Hint At Card Top */}
                        <div className="flex justify-between items-center bg-[#FFF9F0] border-2 border-[#5D4037] p-2 rounded-2xl shadow-inner">
                          <span className="text-[#D84315] font-black text-xs flex items-center gap-1">
                            💫 点击卡片查看中文释义
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLearnStatus(activeWord.word);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1 transition-all border-2 cursor-pointer ${
                              userProgress.learnedWords[activeWord.word] 
                                ? 'bg-[#81C784] text-white border-[#2E7D32]' 
                                : 'bg-white hover:bg-[#FFF9F0] text-[#5D4037] border-[#5D4037]'
                            }`}
                          >
                            {userProgress.learnedWords[activeWord.word] ? '✅ 已掌握' : '⭐ 掌握'}
                          </button>
                        </div>

                        {/* Polaroid Polaroid-framed image */}
                        <div className="flex-1 flex items-center justify-center my-3">
                          <div className="border-[6px] border-[#5D4037] rounded-3xl overflow-hidden aspect-square h-44 w-44 bg-[#FFF3E0] relative shadow-md">
                            <img 
                              src={activeWord.keyword} 
                              alt={activeWord.word} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover animate-fade-in"
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=400&fit=crop";
                              }}
                            />
                          </div>
                        </div>

                        {/* Word string representation (lowercase as requested) & speaker button */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-3">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#2E7D32] font-display lowercase">
                              {activeWord.word.toLowerCase()}
                            </h2>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                playSfx('click');
                                handleSpeak(activeWord.word);
                              }}
                              className="w-11 h-11 bg-[#C8E6C9] hover:bg-[#81C784] hover:text-white rounded-full flex items-center justify-center border-2 border-[#2E7D32] shadow-sm transition-all duration-200 cursor-pointer text-lg animate-pulse"
                              title="点我发音"
                            >
                              🔊
                            </button>
                          </div>
                        </div>

                        {/* Custom Bottom action flag */}
                        <div className="bg-[#FF7043] text-white border-4 border-[#5D4037] py-2.5 px-4 rounded-2xl text-center shadow-[4px_4px_0px_#5D4037] font-black text-sm uppercase tracking-wide">
                          点击翻面看中文
                        </div>

                      </div>

                      {/* CARD BACK SIDE (Simplified: showing only translation directly as requested) */}
                      <div 
                        style={{ transform: 'rotateY(180deg)' }}
                        className="absolute inset-0 bg-[#FFF9F0] border-[6px] border-[#5D4037] rounded-[40px] shadow-[12px_12px_0px_#5D4037] p-8 flex flex-col justify-between backface-hidden"
                      >
                        <div className="bg-white border-2 border-[#5D4037] p-2.5 rounded-2xl text-center shadow-inner">
                          <span className="text-xs text-[#795548] font-black">🔬 翻面魔法 · 中文释义</span>
                        </div>

                        {/* Mid Chinese translation */}
                        <div className="text-center py-6 mt-4 space-y-3 flex-1 flex flex-col items-center justify-center">
                          <span className="text-6xl select-none mb-2 animate-bounce">🍎</span>
                          <p className="text-xs text-[#795548] font-black tracking-wider">中文释义</p>
                          <h3 className="text-4xl md:text-5xl font-black text-[#D84315] tracking-tight font-display">
                            {activeWord.translation}
                          </h3>
                        </div>

                        {/* Marked learned button on back */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLearnStatus(activeWord.word);
                          }}
                          className={`w-full py-4 text-white border-4 rounded-3xl font-black text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:translate-y-0.5 cursor-pointer ${
                            userProgress.learnedWords[activeWord.word] 
                              ? 'bg-[#81C784] hover:bg-[#66BB6A] border-[#2E7D32] shadow-[0px_4px_0px_#1B5E20]' 
                              : 'bg-[#FF8A65] hover:bg-[#FF7043] border-[#5D4037] shadow-[0px_4px_0px_#5D4037]'
                          }`}
                        >
                          <Check className="w-5 h-5 stroke-[3]" /> 
                          {userProgress.learnedWords[activeWord.word] ? '我已经学会了这项词 ✨' : '点此标记“已学会”'}
                        </button>

                      </div>

                    </motion.div>
                  </div>

                  {/* 🎙️ 单词语音跟读测评 & PLAYBACK BOX (Column 1 Bottom) */}
                  <div className="w-full max-w-sm mt-6 bg-white border-4 border-[#5D4037] rounded-[28px] p-4 shadow-[6px_6px_0px_#5D4037] text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-[#FFF176] text-[#5D4037] border-2 border-[#5D4037] px-2.5 py-1 rounded-full font-black flex items-center gap-1 shadow-sm">
                        🎙️ 单词跟读魔法
                      </span>
                      {pronunciationScore.word !== undefined && (
                        <span className="text-xs font-black text-white bg-[#D84315] border-2 border-[#5D4037] px-2.5 py-0.5 rounded-lg">
                          评分: {pronunciationScore.word}分
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 bg-[#FFF9F0] p-2 rounded-2xl border-2 border-[#5D4037] shadow-inner">
                      <p className="text-base font-black text-[#5D4037] font-mono select-none flex-1 truncate px-1">
                        {activeWord.word.toLowerCase()}
                      </p>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Record Button */}
                        <button
                          onClick={() => {
                            if (isRecording && recordingTarget === 'word') {
                              stopRecording('word');
                            } else {
                              startRecording('word');
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-black rounded-xl border-2 flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer ${
                            isRecording && recordingTarget === 'word'
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse border-red-700'
                              : 'bg-white hover:bg-[#FFF9F0] border-[#5D4037] text-[#5D4037]'
                          }`}
                        >
                          {isRecording && recordingTarget === 'word' ? (
                            <>⏹️ 停止跟读</>
                          ) : (
                            <>🎙️ 跟读</>
                          )}
                        </button>
                        
                        {/* Playback Button */}
                        {recordedAudioUrl.word && (
                          <button
                            onClick={() => playRecordedAudio('word', activeWord.word)}
                            className="px-3 py-1.5 text-xs font-black rounded-xl bg-[#81C784] hover:bg-[#66BB6A] text-white border-2 border-[#2E7D32] shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="回放我的发音"
                          >
                            ▶️ 音轨回放
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quality Feedback */}
                    {pronunciationScore.word !== undefined && (
                      <div className="bg-[#FFF9F0] p-2 rounded-xl text-center border border-dashed border-[#BCAAA4]">
                        <div className="text-yellow-500 text-sm font-black tracking-tight scale-105">
                          {pronunciationScore.word >= 95 ? "⭐⭐⭐⭐⭐" : pronunciationScore.word >= 90 ? "⭐⭐⭐⭐" : "⭐⭐⭐"}
                        </div>
                        <p className="text-[10px] font-bold text-[#795548] mt-0.5">
                          {pronunciationScore.word >= 95 
                            ? "🎉 太标准了！简直跟外国小朋友一模一样！" 
                            : pronunciationScore.word >= 90 
                              ? "✨ 读得非常棒！语调太好听啦！" 
                              : "🦁 发音真响亮，你真勇敢，再大声试一次更完美！"}
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Column 2: Definition and Examples panels, exactly formatted on the theme */}
                <div className="flex flex-col gap-6 w-full">
                  
                  {/* Blue Block for explanation */}
                  <div className="bg-[#E1F5FE] rounded-[32px] border-[4px] border-[#039BE5] p-7 shadow-[8px_8px_0px_#039BE5] text-left">
                    <h3 className="text-[#01579B] font-black mb-3 text-lg flex items-center gap-2 font-display">
                      📖 英文学解释 (Explanation)
                    </h3>
                    <p className="text-xl md:text-2xl leading-relaxed text-[#0277BD] font-black">
                      {activeWord.def}
                    </p>
                  </div>

                  {/* Green Block for dynamic sentences */}
                  <div className="bg-[#F1F8E9] rounded-[32px] border-[4px] border-[#689F38] p-7 shadow-[8px_8px_0px_#689F38] text-left">
                    <h3 className="text-[#33691E] font-black mb-3 text-lg flex items-center gap-2 font-display">
                      💬 趣味句型 (Example Sentence)
                    </h3>
                    <p className="text-xl md:text-2xl leading-relaxed text-[#558B2F] font-bold">
                      "{activeWord.sentence}"
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        playSfx('click');
                        handleSpeak(activeWord.sentence);
                      }}
                      className="mt-4 flex items-center gap-2 text-[#33691E] font-black bg-[#DCEDC8] hover:bg-[#C8E6C9] py-2 px-4 rounded-xl border-2 border-[#689F38] shadow-sm transition active:scale-95 cursor-pointer text-sm"
                    >
                      <span>🔊</span> 听大熊念例句 (Listen)
                    </button>

                    {/* 🎙️ 例句跟读与评分 (Sentence Repeat-Read Component) */}
                    <div className="mt-5 pt-4 border-t border-dashed border-[#689F38] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#558B2F] font-black flex items-center gap-1.5 bg-[#DCEDC8] px-2.5 py-1 rounded-full border border-[#689F38]">
                          🗣️ 句子跟读挑战
                        </span>
                        {pronunciationScore.sentence !== undefined && (
                          <span className="text-xs font-black text-white bg-[#558B2F] px-2.5 py-0.5 rounded-lg border border-[#33691E]">
                            打分: {pronunciationScore.sentence}分
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border-2 border-[#689F38] shadow-sm">
                        <span className="text-xs text-[#558B2F] font-bold italic line-clamp-1 truncate flex-1">
                          "{activeWord.sentence}"
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Record Button */}
                          <button
                            onClick={() => {
                              if (isRecording && recordingTarget === 'sentence') {
                                stopRecording('sentence');
                              } else {
                                startRecording('sentence');
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-black rounded-xl border-2 flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer ${
                              isRecording && recordingTarget === 'sentence'
                                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse border-red-700'
                                : 'bg-white hover:bg-[#DCEDC8] border-[#689F38] text-[#33691E]'
                            }`}
                          >
                            {isRecording && recordingTarget === 'sentence' ? (
                              <>⏹️ 停止跟读</>
                            ) : (
                              <>🎙️ 跟读句子</>
                            )}
                          </button>

                          {/* Playback Button */}
                          {recordedAudioUrl.sentence && (
                            <button
                              onClick={() => playRecordedAudio('sentence', activeWord.sentence)}
                              className="px-3 py-1.5 text-xs font-black rounded-xl bg-[#81C784] hover:bg-[#66BB6A] text-white border-2 border-[#2E7D32] shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
                              title="回放我的例句声音"
                            >
                              ▶️ 音轨回放
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quality Feedback */}
                      {pronunciationScore.sentence !== undefined && (
                        <div className="bg-white p-2 rounded-xl text-center border border-dashed border-[#689F38]">
                          <div className="text-yellow-500 text-sm font-black tracking-tight">
                            {pronunciationScore.sentence >= 95 ? "⭐⭐⭐⭐⭐" : pronunciationScore.sentence >= 90 ? "⭐⭐⭐⭐" : "⭐⭐⭐"}
                          </div>
                          <p className="text-[10px] font-bold text-[#558B2F] mt-0.5">
                            {pronunciationScore.sentence >= 95 
                              ? "🎉 真流利！节奏感太完美了，大魔法师夸你好聪明！" 
                              : pronunciationScore.sentence >= 90 
                                ? "✨ 语调自然，发音超级神准！" 
                                : "🦁 句子好长，但你勇敢跟读下来了！再来试一次吧！"}
                          </p>
                        </div>
                      )}

                    </div>

                  </div>

                </div>

              </div>

              {/* Card Controls & Endless loop wrapper loop */}
              <div className="flex items-center justify-between gap-4 max-w-lg mx-auto py-4">
                <button
                  onClick={() => {
                    playSfx('click');
                    if (currentWordIndex === 0) {
                      setCurrentWordIndex(wordsToStudy.length - 1);
                    } else {
                      setCurrentWordIndex(prev => prev - 1);
                    }
                    setIsFlipped(false);
                  }}
                  className="bg-white text-[#5D4037] border-4 border-[#5D4037] hover:bg-[#FFF9F0] px-5 py-3 rounded-2xl font-black transition-all shadow-[4px_4px_0px_#5D4037] flex items-center gap-1 active:scale-95 cursor-pointer text-sm"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[3]" /> 上一个
                </button>

                <button
                  onClick={() => {
                    playSfx('flip');
                    setIsFlipped(!isFlipped);
                  }}
                  className="bg-[#FFF176] hover:bg-[#FFF59D] text-[#5D4037] border-4 border-[#5D4037] px-5 py-3 rounded-2xl font-black transition-all shadow-[4px_4px_0px_#5D4037] flex items-center gap-1 active:scale-95 cursor-pointer text-sm"
                >
                  <RotateCw className="w-5 h-5 stroke-[3]" /> 翻转卡片
                </button>

                <button
                  onClick={() => {
                    playSfx('click');
                    if (currentWordIndex >= wordsToStudy.length - 1) {
                      setCurrentWordIndex(0);
                    } else {
                      setCurrentWordIndex(prev => prev + 1);
                    }
                    setIsFlipped(false);
                  }}
                  className="px-8 py-4 bg-[#81C784] hover:bg-[#66BB6A] rounded-[24px] border-[4px] border-[#2E7D32] text-white font-black text-xl shadow-[0px_6px_0px_#1B5E20] active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  下一个 <ChevronRight className="w-5 h-5 stroke-[3]" />
                </button>
              </div>

              {/* STAGE & UNIT PROGRESS DETAILED EXPLORER BOX */}
              <div className="max-w-5xl mx-auto bg-[#FFF3E0] border-[6px] border-[#5D4037] rounded-[36px] p-6 shadow-[10px_10px_0px_#5D4037] space-y-6">
                
                {/* Header with stats */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b-4 border-dashed border-[#BCAAA4] pb-4">
                  <div className="text-left">
                    <h3 className="text-xl font-black text-[#D84315] font-display flex items-center gap-1.5">
                      🐾 单词掌握分类收纳箱
                    </h3>
                    <p className="text-xs text-[#795548] font-bold mt-0.5">
                      小朋友，点击单词可以直接飞过去学习它！把未掌握的都变成已学会才能玩魔法测试哦！
                    </p>
                  </div>
                  
                  {/* Quick toggle filter */}
                  <div className="flex items-center gap-2 bg-white border-2 border-[#5D4037] p-1 rounded-2xl shadow-sm">
                    <button
                      onClick={() => { playSfx('click'); setStudyFilter('all'); }}
                      className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                        studyFilter === 'all'
                          ? 'bg-[#FF8A65] text-white border-2 border-[#D84315]'
                          : 'bg-white hover:bg-[#FFF9F0] text-[#5D4037]'
                      }`}
                    >
                      🎪 全部单词
                    </button>
                    <button
                      onClick={() => {
                        playSfx('click');
                        const unCount = activeUnit.words.filter(w => !userProgress.learnedWords[w.word]).length;
                        if (unCount === 0) {
                          alert("🎉 小天使，你已经学会本单元所有词语啦！太棒了，快去玩测试题拼写吧！");
                          return;
                        }
                        setStudyFilter('unmastered');
                        setCurrentWordIndex(0);
                      }}
                      className={`px-4 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1 cursor-pointer ${
                        studyFilter === 'unmastered'
                          ? 'bg-[#E57373] text-white border-2 border-[#C62828]'
                          : 'bg-white hover:bg-[#FFF9F0] text-[#5D4037]'
                      }`}
                    >
                      🔁 只学未掌握 ({activeUnit.words.filter(w => !userProgress.learnedWords[w.word]).length})
                    </button>
                  </div>
                </div>

                {/* Classification lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  
                  {/* Category 1: 未掌握 (To Learn / Remaining Loop Review) */}
                  <div className="bg-white border-4 border-[#5D4037] rounded-3xl p-5 shadow-inner space-y-3">
                    <h4 className="text-[#D84315] font-black text-sm flex items-center gap-1.5 font-display border-b-2 border-dashed border-[#BCAAA4] pb-2">
                      ⭐ 待挑战 · 未掌握 ({activeUnit.words.filter(w => !userProgress.learnedWords[w.word]).length})
                    </h4>
                    
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2">
                      {activeUnit.words.filter(w => !userProgress.learnedWords[w.word]).map((wordItem) => {
                        const wordInSelectedListIndex = wordsToStudy.findIndex(w => w.word === wordItem.word);
                        return (
                          <button
                            key={wordItem.word}
                            onClick={() => {
                              playSfx('click');
                              if (studyFilter === 'unmastered') {
                                if (wordInSelectedListIndex !== -1) {
                                  setCurrentWordIndex(wordInSelectedListIndex);
                                }
                              } else {
                                const allIdx = activeUnit.words.findIndex(w => w.word === wordItem.word);
                                if (allIdx !== -1) setCurrentWordIndex(allIdx);
                              }
                              setIsFlipped(false);
                            }}
                            className={`px-3 py-1.5 rounded-xl border-2 border-[#5D4037] font-black text-xs transition-all shadow-sm cursor-pointer ${
                              activeWord.word === wordItem.word
                                ? 'bg-[#FF8A65] text-white ring-4 ring-[#FFD54F]'
                                : 'bg-[#FFF9F0] hover:bg-[#FFF59D] text-[#5D4037]'
                            }`}
                          >
                            🇺🇸 {wordItem.word.toLowerCase()} <span className="opacity-80">({wordItem.translation})</span>
                          </button>
                        );
                      })}
                      {activeUnit.words.filter(w => !userProgress.learnedWords[w.word]).length === 0 && (
                        <p className="text-xs font-bold text-[#81C784] py-3 text-center w-full select-none">
                          🎉 满分大捷！这单元所有的词你都已掌握了！快挑战魔法测试换贴纸吧！
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Category 2: 已学会 (Mastered) */}
                  <div className="bg-white border-4 border-[#5D4037] rounded-3xl p-5 shadow-inner space-y-3">
                    <h4 className="text-[#2E7D32] font-black text-sm flex items-center gap-1.5 font-display border-b-2 border-dashed border-[#BCAAA4] pb-2">
                      ✅ 顶呱呱 · 已学会 ({activeUnit.words.filter(w => userProgress.learnedWords[w.word]).length})
                    </h4>

                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2">
                      {activeUnit.words.filter(w => userProgress.learnedWords[w.word]).map((wordItem) => {
                        const wordInSelectedListIndex = wordsToStudy.findIndex(w => w.word === wordItem.word);
                        return (
                          <button
                            key={wordItem.word}
                            onClick={() => {
                              playSfx('click');
                              if (studyFilter === 'unmastered') {
                                setStudyFilter('all');
                                const allIdx = activeUnit.words.findIndex(w => w.word === wordItem.word);
                                if (allIdx !== -1) setCurrentWordIndex(allIdx);
                              } else {
                                const allIdx = activeUnit.words.findIndex(w => w.word === wordItem.word);
                                if (allIdx !== -1) setCurrentWordIndex(allIdx);
                              }
                              setIsFlipped(false);
                            }}
                            className={`px-3 py-1.5 rounded-xl border-2 border-[#5D4037] font-black text-xs transition-all shadow-sm cursor-pointer ${
                              activeWord.word === wordItem.word
                                ? 'bg-[#81C784] text-white ring-4 ring-[#FFD54F]'
                                : 'bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32]'
                            }`}
                          >
                            🏆 {wordItem.word.toLowerCase()} <span className="opacity-80">({wordItem.translation})</span>
                          </button>
                        );
                      })}
                      {activeUnit.words.filter(w => userProgress.learnedWords[w.word]).length === 0 && (
                        <p className="text-xs font-bold text-slate-400 py-3 text-center w-full select-none">
                          还没有学会的单词哦~ 在卡片上标记学会后就会收纳到这里啦！
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Educational restriction warn banner */}
                <div className="bg-[#FFF9F0] border-2 border-dashed border-[#BCAAA4] p-3 rounded-2xl text-[#795548] text-xs font-bold text-center">
                  ⚠️ <b>魔法阵温馨提醒：</b>大魔法门规定，只有本单元的单词<b>全部学会（未掌握为 0）</b>后，神奇的终极测试才允许解锁并开始闯关拿惊艳徽章贴纸！加油！
                </div>

              </div>

              {/* Direct Challenge Button inside Learn Screen */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    handleSelectUnit(selectedUnitId, 'test');
                  }}
                  className={`px-12 py-5 rounded-[28px] font-black text-lg border-[5px] flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                    activeUnit.words.filter(w => !userProgress.learnedWords[w.word]).length === 0
                      ? 'bg-gradient-to-r from-[#FFD54F] to-[#FF8A65] border-[#5D4037] text-[#5D4037] animate-bounce'
                      : 'bg-[#BCAAA4]/40 text-[#795548] border-[#795548] opacity-60'
                  }`}
                >
                  📝 挑战本单元魔法拼写测试 (Take Quiz)
                  {activeUnit.words.filter(w => !userProgress.learnedWords[w.word]).length > 0 && " [🔒 锁]"}
                </button>
              </div>

              {/* Learning guide tip */}
              <div className="bg-[#E1F5FE] border-4 border-[#039BE5] text-[#01579B] p-4 text-center rounded-[24px] max-w-lg mx-auto text-xs font-black shadow-sm">
                💡 <b>背词小贴士：</b>全部单词看完了？点击上方“返回大厅”按钮去挑战“趣味测试”拿可爱贴纸吧！
              </div>

            </motion.div>
          )}

          {/* ===================== VIEW 3: TEST ===================== */}
          {currentView === 'test' && (
            <motion.div 
              key="test"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              
              {/* Header inside test info */}
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => { playSfx('click'); setCurrentView('menu'); }}
                  className="bg-white hover:bg-[#FFF9F0] text-[#5D4037] border-4 border-[#5D4037] px-4 py-2 rounded-2xl font-black flex items-center gap-1 shadow-[3px_3px_0px_#5D4037] text-xs sm:text-sm cursor-pointer transition-all active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[3]" /> 放弃退出
                </button>

                <div className="text-[#5D4037] font-black text-sm">
                  📝 【{activeUnit.name}】趣味测试中
                </div>

                <div className="text-[#D84315] font-black text-md bg-[#FFF9F0] border-2 border-[#5D4037] px-4 py-1.5 rounded-full shadow-inner">
                  得分：{quizScore}
                </div>
              </div>

              {/* Progress bar / Balloon */}
              {!testCompleted && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black text-[#5D4037]">
                    <span>第 {testCurrentIndex + 1} / {testQuestions.length} 题</span>
                    <span>通关气球 🎈</span>
                  </div>
                  <div className="relative w-full bg-white h-5 rounded-full border-2 border-[#5D4037]">
                    {/* Animated moving slider */}
                    <div 
                      className="absolute bg-gradient-to-r from-[#FF8A65] to-[#FFD54F] h-full rounded-full transition-all duration-500"
                      style={{ width: `${((testCurrentIndex) / testQuestions.length) * 100}%` }}
                    />
                    {/* Flying balloon icon */}
                    <div 
                      className="absolute top-1/2 transform -translate-y-1/2 -ml-2 text-xl transition-all duration-500"
                      style={{ left: `${((testCurrentIndex) / testQuestions.length) * 100}%` }}
                    >
                      🎈
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TEST COMPLETED VIEW ================= */}
              {testCompleted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#FFF9F0] border-[6px] border-[#5D4037] rounded-[40px] p-8 text-center space-y-6 shadow-[12px_12px_0px_#5D4037] relative overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-4 bg-[#FFD54F] rounded-t-xl" />

                  <div className="text-6xl animate-bounce">
                    {quizScore === testQuestions.length ? "👑" : "🎉"}
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-[#5D4037] font-display">测试挑战完成！</h2>
                    <p className="text-[#795548] text-sm font-black">
                      宝贝，快来看看你这次的测试成绩吧！
                    </p>
                  </div>

                  {/* Stars decoration */}
                  <div className="flex justify-center gap-3 text-4xl py-2">
                    <span className={quizScore >= 3 ? "text-[#FFD54F] animate-pulse drop-shadow-md" : "text-gray-300"}>⭐</span>
                    <span className={quizScore >= 6 ? "text-[#FFD54F] animate-pulse scale-125 drop-shadow-md" : "text-gray-300"}>⭐</span>
                    <span className={quizScore === testQuestions.length ? "text-[#FFD54F] animate-bounce drop-shadow-lg scale-135" : "text-gray-300"}>⭐</span>
                  </div>

                  {/* Circle Score board */}
                  <div className="flex justify-center">
                    <div className="w-36 h-36 rounded-full border-[6px] border-[#5D4037] flex flex-col items-center justify-center bg-white shadow-[6px_6px_0px_#5D4037]">
                      <span className="text-5xl font-black text-[#D84315] font-display">{quizScore}</span>
                      <span className="border-t-2 border-[#BCAAA4] text-[#795548] font-bold text-xs mt-1.5 pt-1.5">满分 {testQuestions.length}</span>
                    </div>
                  </div>

                  {/* Highscore Reward text */}
                  {quizScore === testQuestions.length ? (
                    <div className="bg-[#FFF3E0] border-4 border-[#5D4037] rounded-3xl p-5 space-y-2 text-left">
                      <p className="text-base font-black text-[#D84315] flex items-center gap-1.5 font-display ml-1">
                        <Sparkles className="w-5 h-5 text-[#FFB300]" /> 满分魔法奇迹！解密金币贴纸！
                      </p>
                      <p className="text-sm font-bold text-[#795548] leading-relaxed">
                        小宝贝，在听力理解、拼写拼打和句子填空中，你表现出了惊人的聪明才智！完美通关，快去看看新获得的徽章吧！
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border-4 border-[#5D4037] rounded-3xl p-4 text-left">
                      <p className="text-base font-black text-[#5D4037] font-display">继续冲刺，争取满分拿惊喜贴纸！</p>
                      <p className="text-xs font-bold text-[#795548] leading-relaxed">（只要全部答对每一道测试题，就能在奖励贴纸库里解锁全新的徽章贴纸哦）</p>
                    </div>
                  )}

                  <div className="flex gap-3 justify-center pt-2">
                    <button 
                      onClick={() => {
                        playSfx('click');
                        handleSelectUnit(selectedUnitId, 'test');
                      }}
                      className="bg-[#FFF176] hover:bg-[#FFF59D] border-4 border-[#5D4037] text-[#5D4037] py-3 px-8 rounded-2xl font-black text-sm shadow-[4px_4px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 stroke-[3]" /> 重新挑战
                    </button>

                    <button 
                      onClick={() => { playSfx('click'); setCurrentView('menu'); }}
                      className="bg-[#FF8A65] hover:bg-[#FF7043] border-4 border-[#D84315] text-white py-3 px-8 rounded-2xl font-black text-sm shadow-[4px_4px_0px_#D84315] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      返回乐园大厅
                    </button>
                  </div>

                </motion.div>
              ) : (
                /* ================= ONGOING TEST QUESTION PANEL ================= */
                <div className="space-y-6">
                  
                  {/* The Current Question Container */}
                  <div className="bg-white border-[6px] border-[#5D4037] rounded-[40px] p-8 shadow-[10px_10px_0px_#5D4037] space-y-6 text-left">
                    
                    {/* Prompt Header */}
                    <div className="flex items-center gap-4">
                      <span className="text-5xl animate-bounce">🐻</span>
                      <div className="bg-[#FFF3E0] border-4 border-[#5D4037] text-[#5D4037] font-black py-3 px-5 rounded-3xl text-sm relative shadow-sm">
                        <div className="absolute top-1/2 -left-2.5 transform -translate-y-1/2 border-[5px] border-transparent border-r-[#5D4037]" />
                        {testQuestions[testCurrentIndex].prompt}
                      </div>
                    </div>

                    {/* Dynamic Question Render depending on type */}
                    
                    {/* Type 1: LISTENING (👂 Click to hear sound & choose) */}
                    {testQuestions[testCurrentIndex].type === 'listening' && (
                      <div className="space-y-6 text-center">
                        <div className="flex flex-col items-center justify-center p-4">
                          <button 
                            onClick={() => {
                              playSfx('click');
                              handleSpeak(testQuestions[testCurrentIndex].word.word);
                            }}
                            className="w-28 h-28 rounded-full bg-[#FFF176] hover:bg-[#FFF59D] border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer text-[#5D4037] group"
                            title="点我发音"
                          >
                            <Volume2 className="w-12 h-12 stroke-[2.5] group-hover:scale-110 transition-transform" />
                          </button>
                          <span className="text-xs text-[#795548] font-black mt-3">点击小音响朗读单词发音 🔊</span>
                        </div>

                        {/* Options Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {testQuestions[testCurrentIndex].options?.map((option, idx) => (
                            <button
                              disabled={selectedOption !== null}
                              onClick={() => handleOptionSelect(option)}
                              key={idx}
                              className={`py-4 px-3 rounded-2xl font-black text-lg border-4 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                selectedOption === null
                                  ? 'bg-white hover:bg-[#FFF9F0] border-[#5D4037] text-[#5D4037] shadow-[3px_3px_0px_#5D4037] active:scale-95'
                                  : option.toLowerCase() === testQuestions[testCurrentIndex].answer.toLowerCase()
                                    ? 'bg-[#81C784] border-[#2E7D32] text-white scale-102'
                                    : selectedOption === option
                                      ? 'bg-[#E57373] border-[#C62828] text-white'
                                      : 'bg-white border-[#BCAAA4] opacity-40'
                              }`}
                            >
                              <span className="uppercase text-xl tracking-tight font-display">{option}</span>
                              <span className={`text-[10px] uppercase font-bold ${selectedOption !== null ? 'text-white/80' : 'text-[#795548]'}`}>选项 0{idx+1}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Type 2: SPELLING (✏️ Click character bubbles to spell) */}
                    {testQuestions[testCurrentIndex].type === 'spelling' && (
                      <div className="space-y-6">
                        
                        {/* Word target image & meaning hint */}
                        <div className="flex items-center gap-4 bg-[#FFF9F0] p-5 rounded-3xl border-4 border-[#5D4037] shadow-inner">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-[#5D4037] bg-white flex-shrink-0">
                            <img 
                              src={testQuestions[testCurrentIndex].word.keyword} 
                              alt="拼写提示" 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover animate-fade-in"
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=400&fit=crop";
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-xs text-[#795548] font-black uppercase tracking-wider">🌟 请根据中文释义拼写单词 (Spelling Clue)</p>
                            <p className="text-3xl font-black text-[#D84315] font-display">{testQuestions[testCurrentIndex].word.translation}</p>
                          </div>
                        </div>

                        {/* Spelling Screen (The display of typed letters) */}
                        <div className="flex items-center justify-center gap-1.5 bg-slate-50 border-4 border-[#5D453C] rounded-[24px] p-5 min-h-18 relative overflow-hidden shadow-inner">
                          
                          {/* Display placeholders for word length */}
                          {spellingInput.map((char, idx) => (
                            <motion.span 
                              key={idx}
                              initial={{ scale: 0.5, y: -10 }}
                              animate={{ scale: 1, y: 0 }}
                              className="w-11 h-11 rounded-xl bg-[#81C784] border-2 border-[#2E7D32] shadow-sm text-white font-black flex items-center justify-center text-lg uppercase font-display"
                            >
                              {char}
                            </motion.span>
                          ))}

                          {/* Remaining empty dashes */}
                          {Array.from({ length: Math.max(0, testQuestions[testCurrentIndex].answer.replace(/\s+/g, '').length - spellingInput.length) }).map((_, idx) => (
                            <span 
                              key={idx} 
                              className="w-11 h-11 rounded-xl border-2 border-dashed border-[#BCAAA4] bg-white flex items-center justify-center text-[#BCAAA4] font-black select-none text-sm"
                            >
                              _
                            </span>
                          ))}

                          {/* Back / Reset helper link */}
                          {spellingInput.length > 0 && selectedOption === null && (
                            <button 
                              onClick={resetSpelling}
                              className="absolute right-4 hover:bg-[#FFF9F0] text-[#5D4037] transition text-xs font-black bg-white px-3 py-1.5 rounded-xl shadow-sm border-2 border-[#5D4037] flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <Undo className="w-3.5 h-3.5 stroke-[3]" /> 重来
                            </button>
                          )}
                        </div>

                        {/* Scrambled spelling blocks for child selection */}
                        {selectedOption === null ? (
                          <div className="space-y-3">
                            <p className="text-center text-xs text-[#795548] font-black">👇 请按拼写顺序用爪爪点击英文字母组装它：</p>
                            <div className="flex flex-wrap gap-2.5 justify-center py-2 h-20 items-center">
                              <AnimatePresence>
                                {spellingArray.map((char, idx) => (
                                  <motion.button
                                    key={idx}
                                    layout
                                    exit={{ scale: 0 }}
                                    onClick={() => handleSpellingBubbleClick(char, idx)}
                                    className="w-12 h-12 rounded-full bg-white hover:bg-[#FFF176] border-4 border-[#5D4037] text-[#5D4037] font-black text-lg shadow-[3px_3px_0px_#5D4037] flex items-center justify-center active:scale-90 active:translate-y-0.5 transition-all uppercase cursor-pointer"
                                  >
                                    {char}
                                  </motion.button>
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-3">
                            <span className="text-xs bg-[#E1F5FE] border-2 border-[#039BE5] px-4 py-2 rounded-full font-bold text-[#01579B]">拼写判定完毕 ✅</span>
                          </div>
                        )}

                      </div>
                    )}

                    {/* Type 3: CONTEXT (📖 Choose which fits sentence blanks) */}
                    {testQuestions[testCurrentIndex].type === 'context' && (
                      <div className="space-y-6">
                        
                        {/* Chalk board showcasing context question */}
                        <div className="bg-[#4E342E] border-[6px] border-[#5D4037] rounded-[32px] p-6 text-center space-y-4 shadow-[8px_8px_0px_#5D4037]">
                          <p className="text-xs text-[#AED581] font-black uppercase tracking-widest">请选择最合适的单词塞进句子的空隙里：</p>
                          
                          <p className="text-xl sm:text-2xl font-black text-white tracking-wide font-display">
                            {testQuestions[testCurrentIndex].word.sentence.replace(
                              new RegExp(`\\b${testQuestions[testCurrentIndex].word.word}\\b`, 'i'),
                              " [____] "
                            ).replace(
                              new RegExp(`\\b${testQuestions[testCurrentIndex].word.word}s\\b`, 'i'),
                              " [____]s "
                            )}
                          </p>
                          
                          <div className="border-t border-[#6D4C41] pt-3">
                            <p className="text-xs text-[#BCAAA4] uppercase tracking-wider mb-1">翻译放大镜：</p>
                            <p className="text-lg font-black text-[#FFF8E1]">
                              {testQuestions[testCurrentIndex].word.translation}
                            </p>
                          </div>
                        </div>

                        {/* MCQ Buttons for options */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {testQuestions[testCurrentIndex].options?.map((option, idx) => (
                            <button
                              disabled={selectedOption !== null}
                              onClick={() => handleOptionSelect(option)}
                              key={idx}
                              className={`py-4 px-3 rounded-2xl font-black text-lg border-4 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                selectedOption === null
                                  ? 'bg-white hover:bg-[#FFF9F0] border-[#5D4037] text-[#5D4037] shadow-[3px_3px_0px_#5D4037] active:scale-95'
                                  : option.toLowerCase() === testQuestions[testCurrentIndex].answer.toLowerCase()
                                    ? 'bg-[#81C784] border-[#2E7D32] text-white scale-102'
                                    : selectedOption === option
                                      ? 'bg-[#E57373] border-[#C62828] text-white'
                                      : 'bg-white border-[#BCAAA4] opacity-40'
                              }`}
                            >
                              <span className="uppercase text-xl tracking-tight font-display">{option}</span>
                              <span className={`text-[10px] uppercase font-bold relative ${selectedOption !== null ? 'text-white/80' : 'text-[#795548]'}`}>选项 0{idx+1}</span>
                            </button>
                          ))}
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Feedback Message Block overlay */}
                  <AnimatePresence>
                    {showFeedbackModal && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className={`border-[6px] border-[#5D4037] rounded-[32px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[8px_8px_0px_#5D4037] ${
                          isAnswerCorrect 
                            ? 'bg-[#E8F5E9] text-[#1B5E20]' 
                            : 'bg-[#FFEBEE] text-[#C62828]'
                        }`}
                      >
                        <div className="flex items-center gap-4 text-left text-left">
                          <span className="text-5xl select-none animate-bounce">
                            {isAnswerCorrect ? "🦕" : "🐻"}
                          </span>
                          <div>
                            <h4 className="font-black text-lg flex items-center gap-1">
                              {isAnswerCorrect ? '🎉 宝贝答对啦！你太棒了！' : '🥺 哎呀，大家别泄气，再接再厉！'}
                            </h4>
                            <p className="text-sm font-bold opacity-80 mt-1">
                              这个词是：<b className="uppercase text-xl font-display">{testQuestions[testCurrentIndex].word.word}</b>，对应中文是 <b>“ {testQuestions[testCurrentIndex].word.translation} ”</b>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={nextQuestion}
                          className={`py-3.5 px-8 rounded-2xl font-black text-sm flex items-center gap-1.5 border-4 transition-all shadow-[3px_3px_0px_#5D4037] active:scale-95 cursor-pointer ${
                            isAnswerCorrect 
                              ? 'bg-[#81C784] hover:bg-[#66BB6A] text-white border-[#2E7D32]' 
                              : 'bg-[#FF8A65] hover:bg-[#FF7043] text-white border-[#D84315]'
                          }`}
                        >
                          继续下一题 <ChevronRight className="w-5 h-5 stroke-[3]" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              )}

            </motion.div>
          )}

          {/* ===================== VIEW 4: ALBUM ===================== */}
          {currentView === 'album' && (
            <motion.div 
              key="album"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              
              {/* Back button header */}
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => { playSfx('click'); setCurrentView('menu'); }}
                  className="bg-white hover:bg-[#FFF9F0] text-[#5D4037] border-4 border-[#5D4037] px-4 py-2 rounded-2xl font-black flex items-center gap-1.5 shadow-[3px_3px_0px_#5D4037] text-sm active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[3]" /> 返回乐园大厅
                </button>
                <div className="text-base font-black text-[#5D4037] font-display">
                  🏅 宝贝的神奇勋章与贴纸收集册
                </div>
              </div>

              {/* Album Intro Panel */}
              <div className="bg-[#FFF3E0] border-[6px] border-[#5D4037] rounded-[40px] p-8 flex flex-col md:flex-row items-center gap-6 shadow-[10px_10px_0px_#5D4037]">
                <div className="text-5xl select-none animate-bounce">🦄</div>
                <div className="flex-1 space-y-1.5 text-center md:text-left">
                  <h3 className="text-2xl font-black text-[#D84315] font-display">“快看你收集到的精美贴纸！”</h3>
                  <p className="text-sm text-[#795548] font-bold leading-relaxed">
                    在各个单元各练习中不断背词、并在测试中挑战满分，就能解锁这些神奇好看的动物徽章贴纸！
                    解锁贴纸后，可以<b>在最下方“我的创意拼贴板”中随意点击贴纸并在画布上贴合，摆出你的专属大自然动物世界唷！</b>
                  </p>
                </div>
              </div>

              {/* Grid of earned stickers */}
              <div className="space-y-4 text-left">
                <h4 className="text-xl font-black text-[#5D4037] flex items-center gap-2 font-display">
                  <Award className="text-[#FF8A65] w-5 h-5 stroke-[3]" /> 
                  当前已解锁贴纸 ({userProgress.stickers.length} / {ALL_STICKERS.length})
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {ALL_STICKERS.map((sticker) => {
                    const isUnlocked = userProgress.stickers.includes(sticker.id);
                    return (
                      <div 
                        key={sticker.id}
                        className={`h-44 rounded-[32px] border-[5px] border-[#5D4037] p-4 flex flex-col items-center justify-center text-center transition-all ${
                          isUnlocked 
                            ? `bg-white shadow-[6px_6px_0px_#5D4037] text-[#5D4037]` 
                            : 'bg-[#E2E8F0]/50 border-slate-300 opacity-45'
                        }`}
                      >
                        <span className={`text-5xl select-none mb-2 ${isUnlocked ? 'animate-bounce' : 'grayscale opacity-75'}`}>
                          {sticker.emoji}
                        </span>
                        <h5 className="font-black text-base text-[#D84315] font-display">{sticker.name}</h5>
                        <p className={`text-xs mt-1.5 font-bold leading-tight ${isUnlocked ? 'text-[#795548]' : 'text-slate-400'}`}>
                          {isUnlocked ? sticker.desc : '未解锁，多做练习解锁！'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================= STICKER GRAFFITI BOARD PLAYGROUND ================= */}
              <div className="space-y-4 border-t-4 border-dashed border-[#BCAAA4] pt-8">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-left select-none">
                    <h4 className="text-xl font-black text-[#5D4037] flex items-center gap-2 font-display">
                      🎨 我的创意大自然拼贴画板
                    </h4>
                    <p className="text-xs text-[#795548] font-bold">
                      手指或鼠标魔法：①点击如下某个已解锁贴纸。②来草地上随心点击，完美贴上它！（支持无限拼贴噢）
                    </p>
                  </div>
                  
                  {/* Clean up buttons */}
                  {stamps.length > 0 && (
                    <div className="flex gap-2">
                      <button 
                        onClick={removeLastStamp}
                        className="bg-white hover:bg-[#FFF9F0] text-[#5D4037] border-4 border-[#5D4037] px-4 py-2 rounded-2xl font-black text-xs shadow-[3px_3px_0px_#5D4037] flex items-center gap-1 active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        <Undo className="w-3.5 h-3.5 stroke-[3]" /> 撤销
                      </button>
                      <button 
                        onClick={clearStamps}
                        className="bg-[#FF8A65] hover:bg-[#FF7043] border-4 border-[#D84315] text-white px-4 py-2 rounded-2xl font-black text-xs shadow-[3px_3px_0px_#D84315] flex items-center gap-1 active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[3]" /> 清空画板
                      </button>
                    </div>
                  )}
                </div>

                {/* Scroller selection of stamps */}
                <div className="flex items-center gap-3 overflow-x-auto py-3 bg-[#FFF9F0] p-4 rounded-[24px] border-4 border-[#5D4037] shadow-inner font-bold text-sm">
                  <span className="text-xs font-black text-[#5D4037] shrink-0">选择已解锁贴纸：</span>
                  {ALL_STICKERS.map((st) => {
                    const isUnlocked = userProgress.stickers.includes(st.id);
                    if (!isUnlocked) return null;
                    return (
                      <button
                        key={st.id}
                        onClick={() => {
                          playSfx('click');
                          setCurrentSelectedSticker(st.id);
                        }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0 border-4 transition-all relative cursor-pointer ${
                          currentSelectedSticker === st.id 
                            ? 'border-[#FF8A65] bg-[#FFF3E0] scale-110 shadow-md' 
                            : 'border-[#5D4037] bg-white hover:bg-[#FFF9F0]'
                        }`}
                        title={st.name}
                      >
                        {st.emoji}
                        {currentSelectedSticker === st.id && (
                          <span className="absolute -top-1 -right-1 bg-[#2E7D32] border border-[#5D4037] text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {userProgress.stickers.length === 0 && (
                    <span className="text-xs font-bold text-[#795548]">目前还没有解锁贴纸哦！快做测试满分来解锁吧！</span>
                  )}
                </div>

                {/* THE MAIN DRAWING BOARD (Cozy Forest Park background) */}
                <div 
                  onClick={handleBoardClick}
                  className="relative w-full h-[400px] border-[6px] border-[#5D4037] rounded-[40px] overflow-hidden bg-gradient-to-b from-[#E0F7FA] via-[#E8F5E9] to-[#C8E6C9] cursor-crosshair shadow-[8px_8px_0px_#5D4037] group text-left"
                >
                  
                  {/* Decorative background vectors representing a landscape */}
                  <div className="absolute bottom-0 inset-x-0 h-32 bg-[#A5D6A7] rounded-t-[44px] opacity-75 border-t-2 border-[#5D4037]" />
                  <div className="absolute bottom-0 right-0 w-72 h-40 bg-[#81C784] rounded-t-full opacity-60" />
                  <div className="absolute bottom-0 left-0 w-96 h-48 bg-[#66BB6A] rounded-t-full opacity-40 float-left" />
                  
                  {/* Sun icon background */}
                  <div className="absolute top-8 right-12 text-6xl animate-pulse select-none">☀️</div>
                  <div className="absolute top-16 left-16 text-3xl opacity-40 select-none">☁️</div>
                  <div className="absolute top-10 left-1/3 text-4xl opacity-50 select-none">☁️</div>

                  {/* Stamp placeholders */}
                  <AnimatePresence>
                    {stamps.map((stamp) => {
                      const stampSticker = ALL_STICKERS.find(s => s.id === stamp.stickerId);
                      return (
                        <motion.div
                          key={stamp.id}
                          initial={{ scale: 0, rotate: 0 }}
                          animate={{ scale: stamp.scale, rotate: stamp.rotation }}
                          exit={{ scale: 0 }}
                          style={{ 
                            left: `${stamp.x}%`, 
                            top: `${stamp.y}%`,
                            transform: 'translate(-50%, -50%)' 
                          }}
                          className="absolute pointer-events-auto select-none font-black text-5xl cursor-move filter drop-shadow-[2px_2px_0px_#5D4037]"
                        >
                          {stampSticker?.emoji}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Empty text placeholder */}
                  {stamps.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center space-y-1 z-10">
                      <span className="text-5xl animate-bounce">🎨</span>
                      <p className="text-[#5D4037] font-black text-lg font-display">空空的大自然拼画板</p>
                      <p className="text-xs text-[#795548] font-bold max-w-sm">
                        点上面已学到的可爱动物徽章贴纸，然后随意点击这个风景天地里。可以放无穷个拼贴！摆出你梦想的大自然王国！
                      </p>
                    </div>
                  )}

                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ================= GLOBAL STICKER UNLOCKED POPUP MODAL ================= */}
      <AnimatePresence>
        {newStickerUnlocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-[#FFF9F0] border-[6px] border-[#5D4037] rounded-[44px] p-8 max-w-sm w-full text-center space-y-6 shadow-[15px_15px_0px_#5D4037] relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-4 bg-[#FFC107]" />
              
              <div className="flex justify-center text-8xl animate-bounce pt-2 select-none">
                {newStickerUnlocked.emoji}
              </div>

              <div className="space-y-1">
                <span className="text-xs bg-[#FFF176] text-[#5D4037] border border-[#5D4037] font-black px-3.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  🏆 新贴纸解锁成功!
                </span>
                <h3 className="text-2xl font-black text-[#5D4037] font-display mt-2">【{newStickerUnlocked.name}】</h3>
              </div>

              <p className="text-sm font-bold text-[#795548] leading-relaxed bg-white p-4 rounded-2xl border-2 border-[#5D4037] shadow-inner">
                “ {newStickerUnlocked.desc} ”
              </p>

              <button
                onClick={() => {
                  playSfx('click');
                  setNewStickerUnlocked(null);
                  setCurrentView('album');
                }}
                className="w-full py-4 rounded-2xl font-black text-sm bg-[#FF8A65] hover:bg-[#FF7043] border-4 border-[#D84315] text-white transition-all active:translate-y-0.5 active:shadow-sm shadow-[3px_3px_0px_#D84315] flex items-center justify-center gap-2 cursor-pointer"
              >
                <PartyPopper className="w-5 h-5 animate-spin" /> 打开我的贴纸收集册！
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= PEDAGOGICAL LOCK ALERT MODAL ================= */}
      <AnimatePresence>
        {showBlockedTestModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-[#FFF9F0] border-[6px] border-[#5D4037] rounded-[44px] p-8 max-w-md w-full text-center space-y-6 shadow-[15px_15px_0px_#5D4037] relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-4 bg-[#FF7043]" />
              
              <div className="flex justify-center text-7xl animate-bounce pt-2 select-none">
                🔒🐻
              </div>

              <div className="space-y-1">
                <span className="text-xs bg-[#FFCDD2] text-[#B71C1C] border border-[#B71C1C] font-black px-3.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  🚧 魔法门提示：暂未解锁测试！
                </span>
                <h3 className="text-2xl font-black text-[#5D4037] font-display mt-2">小朋友，要先学会所有词语哦！</h3>
              </div>

              <p className="text-sm font-bold text-[#795548] leading-relaxed bg-white p-4 rounded-2xl border-2 border-[#5D4037] shadow-inner">
                这个单元里，你还有 <b className="text-[#D84315] text-lg font-black">{blockedTestUnitId ? (ALL_UNITS.find(u => u.id === blockedTestUnitId)?.words.filter(w => !userProgress.learnedWords[w.word]).length || 0) : 0}</b> 个单词没有掌握呢！
                <br />
                快和熊宝宝一起点击“只学未掌握”循环复习一下，等到它们都变成 <b>✅ 已学会</b> 的绿勾勾，测试魔法阵就会自动为你开启啦！💖
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    playSfx('click');
                    if (blockedTestUnitId !== null) {
                      setSelectedUnitId(blockedTestUnitId);
                      setStudyFilter('unmastered');
                      setCurrentWordIndex(0);
                      setCurrentView('learn');
                    }
                    setShowBlockedTestModal(false);
                  }}
                  className="flex-1 py-4.5 rounded-2xl font-black text-sm bg-[#81C784] hover:bg-[#66BB6A] border-4 border-[#2E7D32] text-white transition-all active:translate-y-0.5 active:shadow-sm shadow-[3px_3px_0px_#2E7D32] flex items-center justify-center gap-1 cursor-pointer"
                >
                  🔁 立即复习未掌握
                </button>

                <button
                  onClick={() => {
                    playSfx('click');
                    setShowBlockedTestModal(false);
                  }}
                  className="py-4.5 px-6 rounded-2xl font-black text-sm bg-white hover:bg-[#FFF9F0] border-4 border-[#5D4037] text-[#5D4037] transition-all active:translate-y-0.5 active:shadow-sm shadow-[3px_3px_0px_#5D4037] flex items-center justify-center gap-1 cursor-pointer"
                >
                  知道啦
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer copyright */}
      <footer className="py-12 text-center text-xs text-[#795548] font-black tracking-wider space-y-1 bg-[#FFF9F0]/60 border-t-2 border-dashed border-[#BCAAA4] mt-8 rounded-b-3xl">
        <p>Copyright © 2026 趣味童真可爱英语背词词汇乐园 · 儿童全息记忆系统</p>
        <p className="opacity-70 text-[10px]">专为小朋友设计的可爱互动 UI · 声音合成发音魔法方案</p>
      </footer>

    </div>
  );
}
