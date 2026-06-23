import React, { useState, useEffect, useRef } from 'react';
import { SUBJECTS_DB } from '../lib/content';
import { AkademiDB } from '../lib/db';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send } from 'lucide-react';
import { ThreeModelEmbed } from '../components/ThreeModelEmbed';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { calculateLevel, awardBadge } from '../lib/xp';
import confetti from 'canvas-confetti';

function renderMarkdownWithKaTeX(markdown: string) {
  // Split on $$...$$ (display math) first, then $...$ (inline math)
  const segments: { text: string; math: boolean; display: boolean }[] = [];
  let remaining = markdown;
  const displayRe = /\$\$([\s\S]*?)\$\$/g;
  const inlineRe = /\$((?:[^$\\]|\\.)+?)\$/g;

  // Replace display math
  let last = 0;
  let m: RegExpExecArray | null;
  displayRe.lastIndex = 0;
  while ((m = displayRe.exec(remaining)) !== null) {
    if (m.index > last) segments.push({ text: remaining.slice(last, m.index), math: false, display: false });
    segments.push({ text: m[1], math: true, display: true });
    last = m.index + m[0].length;
  }
  segments.push({ text: remaining.slice(last), math: false, display: false });

  // For non-math segments, handle inline math
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
        return <span key={index} className={seg.display ? 'block my-4 overflow-x-auto text-center' : ''} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <span key={index} className="text-red-500">Math error</span>;
      }
    }
    const lines = seg.text.split('\n');
    return (
      <span key={index}>
        {lines.map((line, i) => {
          if (line.startsWith('### ')) return <h3 key={i} className="font-bold text-xl mt-6 mb-2">{line.slice(4)}</h3>;
          if (line.startsWith('## ')) return <h2 key={i} className="font-bold text-2xl mt-8 mb-3">{line.slice(3)}</h2>;
          if (line.startsWith('> **Key point:**')) return <blockquote key={i} className="border-l-4 border-[var(--primary)] pl-4 italic text-[var(--text-muted)] my-4">{line.replace('> **Key point:**', '')}</blockquote>;
          if (line.startsWith('**Worked Example:**') || line.startsWith('**Solution:**')) return <strong key={i} className="block mt-4 mb-2">{line.replace(/\*\*/g, '')}</strong>;
          if (line.startsWith('---')) return <hr key={i} className="my-6 border-[var(--border)]" />;
          if (line.trim() === '') return <br key={i} />;
          // Bold inline **text**
          const boldParts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <React.Fragment key={i}>
              {boldParts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
              <br />
            </React.Fragment>
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
        showToast(`+${topic.readXP} XP (Read notes)`);
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
      showToast('+25 XP (Correct Answer)');
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
        setTimeout(() => showToast('🎉 Perfect Score! +150 XP'), 500);
        awardBadge('perfect_score');
      }

      if (topic.id === 'chem-benzene') awardBadge('benzene_master');
      if (topic.hasMathEquations) awardBadge('equation_king');
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
      
      showToast('+50 XP (Essay Submitted)');
      awardBadge('essayist');
      let extraXp = 0;
      if (scorePct >= 80) {
        extraXp = 100;
        awardBadge('top_grade');
        showToast('Top Grade! +100 XP Bonus');
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

  return (
    <div className="bg-[var(--surface)] min-h-screen font-body pb-20 relative">
      <div className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/subject/${subject.id}`)} className="p-2 hover:bg-black/5 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <div className="font-bold truncate max-w-[200px] text-sm">{subject.name}</div>
          </div>
          <div className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary-light)] px-2 py-1 rounded-full">
            {progress?.readComplete ? 'Read' : 'Reading'}
          </div>
        </div>
        <div className="w-full h-0.5 bg-[var(--surface-light)]">
          <div className="h-full bg-[var(--primary)]" style={{ width: '100%' }}></div>
        </div>
      </div>

      <div 
        className="h-[200px] flex flex-col justify-end p-6 text-white"
        style={{ background: `linear-gradient(to bottom right, ${subject.themeColor}, ${subject.themeColor}aa)` }}
      >
        <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Topic Lesson</div>
        <h1 className="font-display text-2xl font-bold leading-tight">{topic.title}</h1>
      </div>

      <div className="lesson-body bg-white rounded-t-3xl -mt-6 p-6 md:p-8 min-h-screen border-t border-[var(--border)] relative z-10 shadow-sm">
        
        <div className="bg-[#FEF3E2] border border-[#F5C842] rounded-xl p-4 mb-8 text-[#92400E]">
          <h3 className="font-bold flex items-center mb-2"><span className="mr-2">📋</span> Objectives</h3>
          <p className="text-sm">{topic.summary}</p>
        </div>

        <div className="text-[var(--text-primary)] leading-relaxed text-lg">
          {renderMarkdownWithKaTeX(topic.contentMarkdown)}
        </div>

        {topic.hasThreeDModel && (
          <div className="my-8">
            <ThreeModelEmbed modelType={topic.hasThreeDModel as any} />
          </div>
        )}

        {/* MCQs Section */}
        {topic.mcqs && topic.mcqs.length > 0 && (
          <div className="mt-12 bg-[var(--surface-light)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="font-bold text-xl mb-4 text-[var(--text-primary)]">📝 Practice Questions</h3>
            <div className="font-semibold mb-4 text-sm text-[var(--text-muted)]">Question {mcqIndex + 1} of {topic.mcqs.length}</div>
            
            <div className="mb-4 text-lg font-medium">{topic.mcqs[mcqIndex].question}</div>
            
            <div className="flex flex-col gap-3">
              {topic.mcqs[mcqIndex].options.map((opt: string, i: number) => {
                const isSelected = mcqAnswers[mcqIndex] === i;
                const isCorrect = topic.mcqs[mcqIndex].correctIndex === i;
                const hasAnswered = mcqAnswers[mcqIndex] !== undefined;
                
                let btnClass = "border-[var(--border)] hover:border-[var(--primary)] bg-white";
                if (hasAnswered) {
                   if (isCorrect) btnClass = "bg-green-100 border-green-500 text-green-800";
                   else if (isSelected && !isCorrect) btnClass = "bg-red-100 border-red-500 text-red-800";
                   else btnClass = "bg-white opacity-50";
                }

                return (
                  <button 
                    key={i} 
                    onClick={() => handleMcqSelect(i)}
                    disabled={hasAnswered}
                    className={`w-full text-left px-5 py-4 min-h-[52px] rounded-full border ${btnClass} font-medium transition-colors`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {mcqAnswers[mcqIndex] !== undefined && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-[var(--border)] text-sm">
                <strong>Explanation: </strong> {topic.mcqs[mcqIndex].explanation}
              </div>
            )}

            {mcqAnswers[mcqIndex] !== undefined && mcqIndex < topic.mcqs.length - 1 && (
              <button 
                onClick={() => setMcqIndex(i => i + 1)}
                className="mt-6 w-full bg-[#1A1714] text-white py-3 rounded-full font-semibold"
              >
                Next Question
              </button>
            )}
            
            {mcqAnswers[mcqIndex] !== undefined && mcqIndex === topic.mcqs.length - 1 && (
               <div className="mt-6 text-center text-[var(--primary)] font-bold text-lg">
                 Practice complete!
               </div>
            )}
          </div>
        )}

        {/* Essay Section */}
        {topic.essayPrompt && (
          <div className="mt-12 bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-xl mb-4 text-[var(--text-primary)]">✍️ Essay Task</h3>
            <p className="mb-4 italic text-[var(--text-muted)] text-sm">{topic.essayPrompt}</p>
            
            <textarea 
              value={essayText}
              onChange={e => setEssayText(e.target.value)}
              placeholder="Write your essay here..."
              className="w-full h-48 p-4 border border-[var(--border)] rounded-xl bg-[var(--surface-light)] resize-none font-body text-sm mb-4 focus:outline-none focus:border-[var(--primary)]"
            />
            
            <button 
              onClick={submitEssay}
              disabled={grading || !essayText.trim()}
              className="w-full bg-[var(--primary)] text-white py-4 rounded-full font-semibold disabled:opacity-50"
            >
              {grading ? 'Grading...' : 'Submit for AI Grading'}
            </button>

            {gradeResult && (
              <div className="mt-6 border-t border-[var(--border)] pt-4 animate-fade-in">
                 <div className="text-2xl font-bold text-[var(--primary)] mb-2">Score: {gradeResult.score} / {gradeResult.total}</div>
                 <p className="text-sm bg-[var(--surface-light)] p-4 rounded-xl mb-4">{gradeResult.feedback}</p>
                 <h4 className="font-bold text-sm mb-2 uppercase text-[var(--text-muted)]">Rubric Breakdown</h4>
                 <ul className="text-sm grid gap-2">
                   {Object.entries(gradeResult.rubricBreakdown).map(([k, v]: any) => (
                     <li key={k} className="flex justify-between border-b border-[var(--border)] pb-1"><span className="truncate mr-4">{k}</span> <span className="font-bold">{v}</span></li>
                   ))}
                 </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Tutor Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatOpen ? (
          <button 
            onClick={() => setChatOpen(true)}
            className="w-14 h-14 bg-[var(--accent-warm)] text-white rounded-full flex justify-center items-center shadow-2xl hover:scale-105 transition-transform"
          >
            💬
          </button>
        ) : (
          <div className="bg-white border text-[var(--text-primary)] border-[var(--border)] w-80 h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in font-body">
            <div className="bg-[var(--accent-warm)] text-white px-4 py-3 font-bold flex justify-between items-center">
              Tutor
              <button onClick={() => setChatOpen(false)} className="text-white hover:text-gray-200">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[var(--surface-light)]">
               {chatHistory.length === 0 && <div className="text-xs text-center text-[var(--text-muted)] my-auto">Ask a question about this topic!</div>}
               {chatHistory.map((m, i) => (
                 <div key={i} className={`p-3 rounded-2xl text-sm max-w-[85%] ${m.role === 'user' ? 'bg-[#12110E] text-white self-end rounded-tr-none' : 'bg-white border border-[var(--border)] self-start rounded-tl-none'}`}>
                    {m.content}
                 </div>
               ))}
               {isChatting && <div className="p-3 bg-white border border-[var(--border)] self-start rounded-2xl rounded-tl-none text-xs text-[var(--text-muted)] italic">Typing...</div>}
            </div>

            <div className="p-3 bg-white border-t border-[var(--border)] flex gap-2">
              <input 
                type="text" 
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask..."
                className="flex-1 bg-[var(--surface-light)] outline-none border border-[var(--border)] px-3 py-2 rounded-full text-sm"
              />
              <button onClick={sendChatMessage} disabled={isChatting || !chatMessage.trim()} className="bg-[#12110E] text-white w-10 h-10 rounded-full flex justify-center items-center disabled:opacity-50">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
