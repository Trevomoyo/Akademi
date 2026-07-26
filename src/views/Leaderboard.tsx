import React, { useState, useEffect, useMemo } from 'react';
import { AkademiDB, LeaderboardEntry } from '../lib/db';
import { SUBJECTS_DB } from '../lib/content';
import { formLevelLabel } from '../lib/xp';
import { BottomNav } from '../components/BottomNav';
import { Trophy, Medal, Flame, ChevronDown } from 'lucide-react';

const LEVEL_TABS: { key: 'all' | 'zjc' | 'o' | 'a'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'zjc', label: 'ZJC' },
  { key: 'o',   label: 'O-Level' },
  { key: 'a',   label: 'A-Level' },
];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze

export default function Leaderboard({ navigate, profile }: any) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<'all' | 'zjc' | 'o' | 'a'>('all');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    AkademiDB.getLeaderboard(200).then(data => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const schools = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => { if (e.school) set.add(e.school); });
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries
      .filter(e => levelFilter === 'all' || e.level === levelFilter)
      .filter(e => !schoolFilter || e.school === schoolFilter)
      .filter(e => !subjectFilter || e.subjects.includes(subjectFilter))
      .sort((a, b) => b.xp - a.xp);
  }, [entries, levelFilter, schoolFilter, subjectFilter]);

  const myRank = filtered.findIndex(e => e.id === profile?.id);
  const activeFilterCount = (schoolFilter ? 1 : 0) + (subjectFilter ? 1 : 0);

  return (
    <div className="bg-[var(--surface)] min-h-screen text-[var(--text-primary)] pb-24 font-body">
      {/* Header */}
      <div className="pt-10 px-6 pb-4 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={26} className="text-[var(--accent-warm)]" />
          <h1 className="font-display font-bold text-3xl">Leaderboard</h1>
        </div>

        {/* Level tabs */}
        <div className="flex bg-[var(--surface-light)] p-1 rounded-full w-max mb-4 border border-[var(--border)]">
          {LEVEL_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setLevelFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${levelFilter === tab.key ? 'bg-white shadow text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)]"
        >
          More filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {showFilters && (
          <div className="flex gap-3 mt-3 overflow-x-auto hide-scrollbar pb-1">
            <select
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
              className="bg-white border border-[var(--border)] px-4 py-2 rounded-full text-sm font-medium outline-none text-[var(--text-primary)] shrink-0"
            >
              <option value="">All Schools</option>
              {schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="bg-white border border-[var(--border)] px-4 py-2 rounded-full text-sm font-medium outline-none text-[var(--text-primary)] shrink-0"
            >
              <option value="">All Subjects</option>
              {SUBJECTS_DB.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Your rank card */}
      {profile && myRank !== -1 && (
        <div className="mx-6 mt-5 p-4 rounded-2xl bg-[var(--primary)] text-white flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg shrink-0">
            #{myRank + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">Your rank</div>
            <div className="text-white/80 text-sm">{profile.xp?.toLocaleString()} XP</div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="px-6 pt-5 flex flex-col gap-2 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center text-[var(--text-muted)] py-16">Loading rankings…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] py-16">No students match these filters</div>
        ) : (
          filtered.map((entry, idx) => {
            const isMe = entry.id === profile?.id;
            const rankColor = idx < 3 ? RANK_COLORS[idx] : undefined;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${isMe ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-[var(--border)] bg-white'}`}
              >
                {/* Rank */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                  style={{ backgroundColor: rankColor ?? 'var(--surface-light)', color: rankColor ? '#fff' : 'var(--text-muted)' }}
                >
                  {idx < 3 ? <Medal size={16} /> : idx + 1}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--accent-warm)] flex items-center justify-center font-bold text-white shrink-0">
                  {entry.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{entry.name}{isMe && <span className="text-[var(--primary)]"> (You)</span>}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">
                    {entry.school || 'No school set'} · {formLevelLabel(entry.formLevel)}
                  </div>
                </div>

                {/* XP + streak */}
                <div className="text-right shrink-0">
                  <div className="font-bold text-[var(--primary)]">{entry.xp.toLocaleString()}</div>
                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 justify-end">
                    <Flame size={11} /> {entry.loginStreak}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav activeTab="/leaderboard" onNavigate={navigate} />
    </div>
  );
}
