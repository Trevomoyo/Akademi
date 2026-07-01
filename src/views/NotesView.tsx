import React, { useState, useEffect } from 'react';
import { SUBJECTS_DB } from '../lib/content';
import { AkademiDB } from '../lib/db';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, BookOpen, CheckCircle, Sparkles, Brain, Target, Trophy } from 'lucide-react';
import { ThreeModelEmbed } from '../components/ThreeModelEmbed';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { calculateLevel, awardBadge } from '../lib/xp';
import confetti from 'canvas-confetti';

function renderMarkdownWithKaTeX(markdown: string) {
  const segments: { text: string; math: boolean; display: boolean }[] = [];
  let remaining = markdown;
  const displayRe = /\$\$([\s\S]*?)\$\$/g;
  const inlineRe = /\$((?:[^$\\]|\\.)+?)\$/g;

  let last = 0;
  let m: RegExpExecArray | null;
  displayRe.lastIndex = 0;
  while ((m = displayRe.exec(remaining)) !== null) {
    if (m.index > last) segments.push({ text: remaining.slice(last, m.index), math: false, display: false });
    segments.push({ text: m[1], math: true, display: true });
    last = m.index + m[0].length;
  }
  segments.push({ text: remaining.slice(last), math: false, display: false });

  const finalSegments: { text: string; math: boolean; display: boolean }[] = [];
  for (const seg of segments) {
    if (seg.math) { finalSegments.push(seg); continue; }
    let l = 0;
    inlineRe.lastIndex = 0;
    while ((m = inlineRe.exec(seg.text)) !== null) {
      if (m.index > l) finalSegments.push({ text: seg.text.slice(l, m.index), math: false, display: false });
      finalSegments.push({ text: m[1], math: true, display: false });
      l = m.index + m[0].length;
    }
    finalSegments.push({ text: seg.text.slice(l), math: false, display: false });
  }

  return finalSegments.map((seg, index) => {
    if (seg.math) {
      try {
        const html = katex.renderToString(seg.text, { throwOnError: false, displayMode: seg.display });
        return <span key={index} className={seg.display ? 'block my-6 overflow-x-auto text-center py-2' : ''} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <span key={index} className="text-red-500">Math error</span>;
      }
    }
    const lines = seg.text.split('\n');
    return (
      <span key={index}>
        {lines.map((line, i) => {
          if (line.startsWith('### ')) return <h3 key={i} className="font-bold text-xl mt-8 mb-3 text-[var(--text-primary)]">{line.slice(4)}</h3>;
          if (line.startsWith('## ')) return <h2 key={i} className="font-bold text-2xl mt-10 mb-4 text-[var(--text-primary)] border-l-4 border-[var(--primary)] pl-4">{line.slice(3)}</h2>;
          if (line.startsWith('> **Key point:**')) return (
            <blockquote key={i} className="bg-gradient-to-r from-[var(--primary-light)] to-transparent border-l-4 border-[var(--primary)] pl-5 py-3 pr-4 my-5 rounded-r-xl text-[var(--text-primary)] font-medium">
              💡 {line.replace('> **Key point:**', '').trim()}
            </blockquote>
          );
          if (line.startsWith('**Worked Example:**')) return <div key={i} className="bg-gradient-to-r from-[#FEF3E2] to-transparent border-l-4 border-[var(--accent-warm)] pl-5 py-3 my-5 rounded-r-xl font-semibold text-[#92400E]">📘 {line.replace(/\*\*/g, '')}</div>;
          if (line.startsWith('**Solution:**')) return <div key={i} className="bg-gradient-to-r from-[#E8F5F1] to-transparent border-l-4 border-[#14B8A6] pl-5 py-3 my-5 rounded-r-xl font-semibold text-[#0D7A6E]">✅ {line.replace(/\*\*/g, '')}</div>;
          if (line.startsWith('---')) return <hr key={i} className="my-8 border-[var(--border)]" />;
          if (line.trim() === '') return <br key={i} />;
          
          // Handle tables (simple markdown tables)
          if (line.includes('|') && line.trim().startsWith('|')) {
            const cells = line.split('|').filter(c => c.trim());
            const isHeader = i === 0 || (i > 0 && lines[i-1]?.includes('---'));
            return (
              <div key={i} className={`flex ${isHeader ? 'font-bold bg-[var(--primary-light)]' : ''} border-b border-[var(--border)] ${isHeader ? 'rounded-t-xl' : ''}`}>
                {cells.map((cell, ci) => (
                  <div key={ci} className="flex-1 p-3 text-sm">{cell.trim()}</div>
                ))}
              </div>
            );
          }

          const boldParts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} className="mb-3 leading-relaxed text-[var(--text-primary)]">
              {boldParts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-[var(--primary)]">{p}</strong> : p)}
            </p>
          );
        })}
      </span>
    );
  });
}

export default function NotesView({ route, navigate, profile, showToast, onUpdateProfile }: any) {
  if (!profile) { navigate('/onboarding'); return null; }
  const idMatch = route.match(/\/lesson\/(.+)/);
  const topicId = idMatch ? idMatch[1] : null;

  let topic: any = null;
  let subject: any = null;

  for (const s of SUBJECTS_DB) {
    const t = s.topics.find((x: any) => x.id === topicId);
    if (t) {
      topic = t;
      subject = s;
      break;
    }
  }

  const [progress, setProgress] = useState<any>(null);
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<number[]>([]);
  const [essayText, setEssayText] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<any>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!topic) return;

    (async () => {
      const existing = await AkademiDB.getProgress(topic.id);
      const p = existing || { topicId: topic.id, readComplete: false, mcqScore: 0 };

      if (!p.readComplete) {
        const updatedProg = { ...p, readComplete: true };
        await AkademiDB.saveProgress(updatedProg);
        setProgress(updatedProg);
        onUpdateProfile({ ...profile, xp: (profile.xp || 0) + topic.readXP });
        showToast(`✨ +${topic.readXP} XP (Read notes)`);
      } else {
        setProgress(p);
      }
    })();
  }, [topic?.id]);

  if (!topic || !subject) {
    return <div className="p-8 text-center text-red-500">Lesson not found. <button onClick={() => navigate('/dashboard')} className="underline">Go back</button></div>;
  }

  const handleMcqSelect = async (optIndex: number) => {
    if (mcqAnswers[mcqIndex] !== undefined) return;
    
    const newAnswers = [...mcqAnswers];
    newAnswers[mcqIndex] = optIndex;
    setMcqAnswers(newAnswers);
    
    const isCorrect = optIndex === topic.mcqs[mcqIndex].correctIndex;
    let xpDelta = 0;
    if (isCorrect) {
      xpDelta += 25;
      showToast('🎯 +25 XP (Correct Answer)');
    }

    if (mcqIndex === topic.mcqs.length - 1) {
      const correctCount = newAnswers.filter((a: number, i: number) => a === topic.mcqs[i].correctIndex).length;
      const pct = Math.round((correctCount / topic.mcqs.length) * 100);

      const newProg = { ...progress, mcqScore: Math.max(progress?.mcqScore || 0, pct) };
      await AkademiDB.saveProgress(newProg);
      setProgress(newProg);

      if (pct === 100) {
        xpDelta += 150;
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => showToast('🏆 Perfect Score! +150 XP'), 500);
        awardBadge('perfect_score');
      }

      if (topic.id === 'chem-benzene') awardBadge('benzene_master');
      if (topic.hasMathEquations) awardBadge('equation_king');
      setShowAnswers(true);
    }

    if (xpDelta > 0) {
      const prevLevel = calculateLevel(profile.xp);
      const newXp = profile.xp + xpDelta;
      const newLevel = calculateLevel(newXp);
      onUpdateProfile({ ...profile, xp: newXp });
      if (newLevel > prevLevel) setTimeout(() => showToast(`🎉 Level up! You're now Level ${newLevel}`), 1500);
    }
  };

  const submitEssay = async () => {
    if (!essayText.trim()) return;
    setGrading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/grade-essay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          topicId: topic.id,
          topicTitle: topic.title,
          essay: essayText,
          prompt: topic.essayPrompt,
          rubric: topic.essayRubric,
        }),
      });
      const data = await res.json();
      setGradeResult(data);

      const scorePct = Math.round(data.score ?? 0);
      const newProg = {
        ...(progress || { topicId: topic.id, readComplete: false, mcqScore: 0 }),
        essayScore: Math.max((progress?.essayScore || 0), scorePct),
      };
      await AkademiDB.saveProgress(newProg);
      setProgress(newProg);
      
      showToast('✍️ +50 XP (Essay Submitted)');
      awardBadge('essayist');
      let extraXp = 0;
      if (scorePct >= 80) {
        extraXp = 100;
        awardBadge('top_grade');
        showToast('🏅 Top Grade! +100 XP Bonus');
      }
      onUpdateProfile({ ...profile, xp: profile.xp + 50 + extraXp });

    } catch (err) {
      showToast("Error grading essay");
    } finally {
      setGrading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    const newMsg = { role: 'user', content: chatMessage };
    setChatHistory([...chatHistory, newMsg]);
    setChatMessage('');
    setIsChatting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          message: newMsg.content,
          history: chatHistory,
          topicTitle: topic.title,
          subjectName: subject?.name,
        }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'model', content: 'Network error reaching tutor.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const mcqProgress = mcqAnswers.filter(a => a !== undefined).length;
  const totalMcqs = topic.mcqs?.length || 0;
  const isMcqComplete = mcqProgress === totalMcqs && totalMcqs > 0;

  return (
    <div className="bg-[var(--surface)] min-h-screen font-body pb-24 relative">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/subject/${subject.id}`)} className="p-2 hover:bg-[var(--surface-light)] rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="text-xs text-[var(--text-muted)] font-medium">{subject.name}</div>
              <div className="font-bold text-sm truncate max-w-[180px]">{topic.title}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary-light)] px-3 py-1.5 rounded-full">
              {progress?.readComplete ? '✅ Read' : '📖 Reading'}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 bg-[var(--surface-light)]">
          <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-warm)] transition-all duration-500" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Hero Banner */}
      <div 
        className="relative overflow-hidden px-6 pt-8 pb-12"
        style={{ background: `linear-gradient(135deg, ${subject.themeColor}dd, ${subject.themeColor}55, ${subject.themeColor}22)` }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen size={14} />
            <span>Topic Lesson</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white leading-tight">
            {topic.title}
          </h1>
          <p className="text-white/80 text-sm mt-2 max-w-xl">
            {topic.summary}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 -mt-4 relative z-10">
        <div className="bg-[var(--surface)] rounded-3xl shadow-lg border border-[var(--border)] p-5 md:p-8 max-w-3xl mx-auto">
          
          {/* Objectives Callout */}
          <div className="bg-gradient-to-r from-[#FEF3E2] to-[#FFF8ED] border border-[#F5C842]/30 rounded-2xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#F5C842]/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Target size={20} className="text-[#92400E]" />
              </div>
              <div>
                <h3 className="font-bold text-[#92400E] text-sm mb-1">What you'll learn</h3>
                <p className="text-[#92400E]/80 text-sm leading-relaxed">{topic.summary}</p>
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="lesson-body text-[var(--text-primary)] leading-relaxed">
            {renderMarkdownWithKaTeX(topic.contentMarkdown)}
          </div>

          {/* 3D Model */}
          {topic.hasThreeDModel && (
            <div className="my-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-[var(--primary)]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--text-muted)]">Interactive 3D Model</h3>
              </div>
              <ThreeModelEmbed modelType={topic.hasThreeDModel as any} />
            </div>
          )}

          {/* MCQs Section */}
          {topic.mcqs && topic.mcqs.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Brain size={22} className="text-[var(--primary)]" />
                  <h3 className="font-bold text-xl">Practice Questions</h3>
                </div>
                <div className="text-sm font-medium text-[var(--text-muted)]">
                  {mcqProgress}/{totalMcqs} answered
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex gap-1.5 mb-6">
                {Array.from({ length: totalMcqs }).map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i < mcqProgress 
                        ? mcqAnswers[i] === topic.mcqs[i].correctIndex 
                          ? 'bg-green-500' 
                          : 'bg-red-400'
                        : 'bg-[var(--border)]'
                    }`}
                  />
                ))}
              </div>

              <div className="bg-[var(--surface-light)] rounded-2xl border border-[var(--border)] p-6">
                <div className="text-sm font-medium text-[var(--text-muted)] mb-1">
                  Question {mcqIndex + 1} of {totalMcqs}
                </div>
                <div className="text-lg font-semibold mb-5 text-[var(--text-primary)]">
                  {topic.mcqs[mcqIndex].question}
                </div>
                
                <div className="flex flex-col gap-3">
                  {topic.mcqs[mcqIndex].options.map((opt: string, i: number) => {
                    const isSelected = mcqAnswers[mcqIndex] === i;
                    const isCorrect = topic.mcqs[mcqIndex].correctIndex === i;
                    const hasAnswered = mcqAnswers[mcqIndex] !== undefined;
                    
                    let btnClass = "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] bg-white";
                    if (hasAnswered) {
                      if (isCorrect) btnClass = "bg-green-50 border-green-500 text-green-800";
                      else if (isSelected && !isCorrect) btnClass = "bg-red-50 border-red-500 text-red-800";
                      else btnClass = "bg-white opacity-50";
                    }

                    return (
                      <button 
                        key={i} 
                        onClick={() => handleMcqSelect(i)}
                        disabled={hasAnswered}
                        className={`w-full text-left px-5 py-4 min-h-[52px] rounded-xl border-2 ${btnClass} font-medium transition-all`}
                      >
                        <span className="inline-block w-6 h-6 rounded-full bg-[var(--surface-light)] text-center mr-3 text-sm font-bold">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                        {hasAnswered && isCorrect && <span className="ml-3 text-green-600">✅</span>}
                        {hasAnswered && isSelected && !isCorrect && <span className="ml-3 text-red-600">✖️</span>}
                      </button>
                    );
                  })}
                </div>

                {mcqAnswers[mcqIndex] !== undefined && (
                  <div className="mt-5 p-4 bg-white rounded-xl border border-[var(--border)] animate-fade-in">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={14} className="text-[var(--primary)]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase text-[var(--text-muted)] tracking-wider mb-1">Explanation</div>
                        <p className="text-sm text-[var(--text-primary)]">{topic.mcqs[mcqIndex].explanation}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  {mcqAnswers[mcqIndex] !== undefined && mcqIndex < totalMcqs - 1 && (
                    <button 
                      onClick={() => setMcqIndex(i => i + 1)}
                      className="flex-1 bg-[var(--primary)] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                    >
                      Next Question →
                    </button>
                  )}
                  {isMcqComplete && (
                    <div className="w-full bg-gradient-to-r from-[#14B8A6]/10 to-[#F5C842]/10 border border-[#14B8A6]/30 rounded-xl p-4 text-center">
                      <Trophy size={24} className="text-[var(--accent-warm)] mx-auto mb-1" />
                      <p className="font-bold text-[var(--primary)]">Practice Complete! 🎉</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        Score: {mcqAnswers.filter((a, i) => a === topic.mcqs[i].correctIndex).length}/{totalMcqs} correct
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Essay Section */}
          {topic.essayPrompt && (
            <div className="mt-12 bg-gradient-to-br from-white to-[var(--surface-light)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#7C3AED]/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl">Essay Task</h3>
              </div>
              <p className="mb-4 text-[var(--text-muted)] italic text-sm leading-relaxed">{topic.essayPrompt}</p>
              
              <textarea 
                value={essayText}
                onChange={e => setEssayText(e.target.value)}
                placeholder="Write your essay here..."
                className="w-full h-48 p-4 border-2 border-[var(--border)] rounded-xl bg-white resize-none font-body text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
              
              <button 
                onClick={submitEssay}
                disabled={grading || !essayText.trim()}
                className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 text-white py-4 rounded-xl font-semibold mt-4 disabled:opacity-50 transition-opacity hover:shadow-lg"
              >
                {grading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Grading...
                  </span>
                ) : (
                  'Submit for AI Grading'
                )}
              </button>

              {gradeResult && (
                <div className="mt-6 border-t border-[var(--border)] pt-6 animate-fade-in">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-warm)] flex items-center justify-center text-white text-2xl font-bold">
                      {gradeResult.score}%
                    </div>
                    <div>
                      <div className="font-bold text-lg">AI Feedback</div>
                      <div className="text-sm text-[var(--text-muted)]">{gradeResult.feedback}</div>
                    </div>
                  </div>
                  <div className="bg-[var(--surface-light)] rounded-xl p-4">
                    <h4 className="font-bold text-sm uppercase text-[var(--text-muted)] tracking-wider mb-3">Rubric Breakdown</h4>
                    <div className="grid gap-2">
                      {Object.entries(gradeResult.rubricBreakdown || {}).map(([k, v]: any) => (
                        <div key={k} className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                          <span className="text-sm">{k}</span>
                          <span className="font-bold text-[var(--primary)]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Tutor Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatOpen ? (
          <button 
            onClick={() => setChatOpen(true)}
            className="w-14 h-14 bg-gradient-to-br from-[var(--accent-warm)] to-[#F5C842] text-white rounded-full flex justify-center items-center shadow-2xl hover:scale-105 transition-transform"
          >
            💬
          </button>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] w-80 h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-[var(--accent-warm)] to-[#F5C842] text-white px-4 py-3 font-bold flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Sparkles size={16} />
                AI Tutor
              </span>
              <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[var(--surface-light)]">
              {chatHistory.length === 0 && (
                <div className="text-center text-[var(--text-muted)] my-auto">
                  <div className="text-4xl mb-2">🤔</div>
                  <p className="text-sm">Ask a question about this topic!</p>
                </div>
              )}
              {chatHistory.map((m, i) => (
                <div key={i} className={`p-3 rounded-2xl text-sm max-w-[85%] ${m.role === 'user' ? 'bg-[var(--primary)] text-white self-end rounded-tr-none' : 'bg-white border border-[var(--border)] self-start rounded-tl-none'}`}>
                  {m.content}
                </div>
              ))}
              {isChatting && (
                <div className="bg-white border border-[var(--border)] self-start rounded-2xl rounded-tl-none px-4 py-2 text-sm text-[var(--text-muted)]">
                  <span className="inline-block w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse mr-1"></span>
                  <span className="inline-block w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse delay-75 mr-1"></span>
                  <span className="inline-block w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse delay-150"></span>
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-t border-[var(--border)] flex gap-2">
              <input 
                type="text" 
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask a question..."
                className="flex-1 bg-[var(--surface-light)] outline-none border border-[var(--border)] px-4 py-2 rounded-full text-sm"
              />
              <button 
                onClick={sendChatMessage} 
                disabled={isChatting || !chatMessage.trim()} 
                className="bg-[var(--primary)] text-white w-10 h-10 rounded-full flex justify-center items-center disabled:opacity-50 transition-opacity"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
      }
