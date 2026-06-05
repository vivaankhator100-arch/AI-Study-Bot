'use client';

import { useMemo, useState } from 'react';

export type ConceptRow = {
  id?: string | number | null;
  subject?: string | null;
  concept?: string | null;
  mastery_level?: string | null;
  strong_areas?: string[] | null;
  weak_areas?: string[] | null;
  next_steps?: string[] | null;
  last_updated?: string | null;
};

type DashboardClientProps = {
  concepts: ConceptRow[];
  error?: string | null;
};

const masteryScores: Record<string, number> = {
  Strong: 4,
  Proficient: 3,
  Developing: 2,
  Introduced: 1,
  'In Progress': 0,
};

const subjectPillStyles: Record<string, string> = {
  Physics: 'bg-blue-500/20 text-blue-100 ring-blue-400/25',
  Biology: 'bg-emerald-500/20 text-emerald-100 ring-emerald-400/25',
  Mathematics: 'bg-violet-500/20 text-violet-100 ring-violet-400/25',
  'Computer Science': 'bg-orange-500/20 text-orange-100 ring-orange-400/25',
  Chemistry: 'bg-red-500/20 text-red-100 ring-red-400/25',
};

const masteryBadgeStyles: Record<string, string> = {
  Strong: 'bg-emerald-500/10 text-emerald-200 ring-emerald-400/20',
  Proficient: 'bg-sky-500/10 text-sky-200 ring-sky-400/20',
  Developing: 'bg-amber-500/10 text-amber-200 ring-amber-400/20',
  Introduced: 'bg-violet-500/10 text-violet-200 ring-violet-400/20',
  'In Progress': 'bg-slate-500/10 text-slate-200 ring-slate-400/20',
};

const tagStyles = {
  strong: 'bg-emerald-500/10 text-emerald-200 ring-emerald-400/20',
  weak: 'bg-red-500/10 text-red-200 ring-red-400/20',
  next: 'bg-sky-500/10 text-sky-200 ring-sky-400/20',
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Never updated';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const normalizeArray = (value?: string[] | null) =>
  Array.isArray(value) ? value.filter(Boolean) : [];

export default function DashboardClient({ concepts, error }: DashboardClientProps) {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const totalConcepts = concepts.length;
  const uniqueSubjects = useMemo(
    () => new Set(concepts.map((item) => item.subject?.trim() ?? '').filter(Boolean)).size,
    [concepts]
  );

  const averageMastery = useMemo(() => {
    if (!totalConcepts) return 0;
    const totalScore = concepts.reduce((sum, item) => {
      const value = item.mastery_level ? masteryScores[item.mastery_level] ?? 0 : 0;
      return sum + value;
    }, 0);
    return Math.round((totalScore / (totalConcepts * 4)) * 100);
  }, [concepts, totalConcepts]);

  const toggleCard = (id: string | number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div className="px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-lg shadow-slate-950/20">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Study summary
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Dashboard</h1>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              Review your concepts, mastery trends, and next steps from Supabase.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm text-slate-400">Total concepts studied</p>
              <p className="mt-3 text-3xl font-semibold text-white">{totalConcepts}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm text-slate-400">Unique subjects</p>
              <p className="mt-3 text-3xl font-semibold text-white">{uniqueSubjects}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm text-slate-400">Average mastery</p>
              <p className="mt-3 flex items-baseline gap-2 text-3xl font-semibold text-white">
                {averageMastery}%
                <span className="text-sm text-slate-500">of 100</span>
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-slate-100">
            <p className="font-semibold">Unable to load dashboard data.</p>
            <p className="mt-2 text-sm text-slate-300">{error}</p>
          </div>
        ) : null}

        {concepts.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-10 text-center text-slate-400">
            No concepts found. Save a concept from the chat page to populate your dashboard.
          </div>
        ) : (
          <div className="grid gap-4">
            {concepts.map((concept, index) => {
              const rawSubject = concept.subject?.trim() || 'Unknown';
              const subjectClass = subjectPillStyles[rawSubject] ?? 'bg-slate-500/20 text-slate-100 ring-slate-400/20';
              const mastery = concept.mastery_level?.trim() || 'In Progress';
              const score = masteryScores[mastery] ?? 0;
              const progressWidth = `${Math.round((score / 4) * 100)}%`;
              const id = concept.id ?? `${rawSubject}-${concept.concept ?? 'concept'}-${index}`;
              const isExpanded = expandedId === id;
              const strongAreas = normalizeArray(concept.strong_areas);
              const weakAreas = normalizeArray(concept.weak_areas);
              const nextSteps = normalizeArray(concept.next_steps);

              return (
                <button
                  type="button"
                  key={typeof id === 'number' ? `concept-${id}` : id}
                  onClick={() => toggleCard(id)}
                  className="w-full rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 text-left shadow-xl shadow-slate-950/10 transition hover:border-slate-700 hover:bg-slate-900"
                  aria-expanded={isExpanded}
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${subjectClass}`}>
                          {rawSubject}
                        </span>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ${masteryBadgeStyles[mastery] ?? masteryBadgeStyles['In Progress']}`}>
                          {mastery}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold text-white">{concept.concept || 'Untitled concept'}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          Last updated {formatDate(concept.last_updated)}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-[160px] flex-col items-start gap-3 sm:items-end">
                      <div className="w-full rounded-full bg-slate-800/90 p-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                        Progress
                      </div>
                      <div className="w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                          style={{ width: progressWidth }}
                        />
                      </div>
                      <p className="text-sm text-slate-400">{progressWidth} complete</p>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-6 space-y-6 border-t border-slate-800 pt-6">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Strong areas</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {strongAreas.length > 0 ? (
                              strongAreas.map((area, idx) => (
                                <span key={`strong-${idx}`} className={`rounded-full px-3 py-1 text-sm ${tagStyles.strong}`}>
                                  {area}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-slate-500">No strong areas listed.</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Weak areas</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {weakAreas.length > 0 ? (
                              weakAreas.map((area, idx) => (
                                <span key={`weak-${idx}`} className={`rounded-full px-3 py-1 text-sm ${tagStyles.weak}`}>
                                  {area}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-slate-500">No weak areas listed.</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Next steps</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {nextSteps.length > 0 ? (
                              nextSteps.map((step, idx) => (
                                <span key={`next-${idx}`} className={`rounded-full px-3 py-1 text-sm ${tagStyles.next}`}>
                                  {step}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-slate-500">No next steps available.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
