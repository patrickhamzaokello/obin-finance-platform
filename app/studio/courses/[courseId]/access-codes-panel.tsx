'use client';

import { useState } from 'react';
import { generateAccessCode, listAccessCodes, revokeAccessCode } from '@/app/actions/access-codes';
import {
  ChevronDown, ChevronUp, Plus, Copy, RefreshCw,
  Clock, User, X, KeyRound,
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60';

export function AccessCodesPanel({ courseId, showToast }: {
  courseId: string;
  showToast: (t: 'success' | 'error', m: string) => void;
}) {
  const [codes,      setCodes]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const [generating, setGenerating] = useState(false);
  const [label,      setLabel]      = useState('');
  const [expireDays, setExpireDays] = useState('');
  const [accessDays, setAccessDays] = useState('');
  const [count,      setCount]      = useState('1');
  const [newCodes,   setNewCodes]   = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    const r = await listAccessCodes(courseId);
    if (r.success) setCodes(r.data ?? []);
    setLoading(false);
  };

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && codes.length === 0) load();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setNewCodes([]);
    const r = await generateAccessCode(courseId, {
      label: label.trim() || undefined,
      codeExpiresInDays: expireDays ? parseInt(expireDays) : undefined,
      accessDurationDays: accessDays ? parseInt(accessDays) : undefined,
      count: count ? Math.min(parseInt(count), 50) : 1,
    });
    setGenerating(false);
    if (r.success && r.data) {
      const generated = r.data.map((c: any) => c.code);
      setNewCodes(generated);
      showToast('success', `${generated.length} code${generated.length > 1 ? 's' : ''} generated`);
      load();
      setLabel('');
    } else {
      showToast('error', (r as any).error || 'Failed to generate codes');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this code? If a user has already activated it, they will lose access.')) return;
    const r = await revokeAccessCode(id);
    if (r.success) { setCodes((prev) => prev.filter((c) => c.id !== id)); showToast('success', 'Code revoked'); }
    else showToast('error', 'Failed to revoke code');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('success', 'Copied to clipboard');
  };

  const unused  = codes.filter((c) => !c.usedBy);
  const used    = codes.filter((c) =>  c.usedBy);
  const expired = unused.filter((c) => c.codeExpiresAt && new Date(c.codeExpiresAt) < new Date());

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header / toggle */}
      <div
        role="button" tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <KeyRound size={13} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Access Codes</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {codes.length > 0
              ? `${codes.length} total · ${used.length} used · ${unused.length - expired.length} available`
              : 'Generate codes to grant learners access to this course'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {loading && <RefreshCw size={12} className="text-muted-foreground animate-spin" />}
          {expanded ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-black/[0.04]">

          {/* ── Generator ─────────────────────────────────────────────── */}
          <div className="px-5 py-4 space-y-3 bg-[#F5F5F7]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generate New Codes</p>

            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-muted-foreground mb-1">Label (optional)</label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. For Aaron Peter" className={inputCls} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-muted-foreground mb-1">Quantity (max 50)</label>
                <input type="number" value={count} onChange={(e) => setCount(e.target.value)}
                  min="1" max="50" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Code expires in (days)</label>
                <input type="number" value={expireDays} onChange={(e) => setExpireDays(e.target.value)}
                  placeholder="Never" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Access duration (days)</label>
                <input type="number" value={accessDays} onChange={(e) => setAccessDays(e.target.value)}
                  placeholder="Permanent" className={inputCls} />
              </div>
            </div>

            <button onClick={handleGenerate} disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm">
              {generating
                ? <><RefreshCw size={13} className="animate-spin" /> Generating…</>
                : <><Plus size={13} /> Generate {parseInt(count || '1') > 1 ? `${count} Codes` : 'Code'}</>
              }
            </button>

            {/* Freshly generated codes — prominent copy UI */}
            {newCodes.length > 0 && (
              <div className="p-4 bg-white rounded-xl border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary">
                    {newCodes.length > 1 ? `${newCodes.length} codes ready` : 'Code ready'} — copy and share with learner{newCodes.length > 1 ? 's' : ''}
                  </p>
                  {newCodes.length > 1 && (
                    <button onClick={() => { navigator.clipboard.writeText(newCodes.join('\n')); showToast('success', 'All codes copied'); }}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Copy size={11} /> Copy all
                    </button>
                  )}
                </div>
                {newCodes.map((code) => (
                  <div key={code} className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#F5F5F7] rounded-lg">
                    <span className="font-mono font-bold text-sm tracking-widest text-foreground select-all">{code}</span>
                    <button onClick={() => copyCode(code)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0">
                      <Copy size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Code list ──────────────────────────────────────────────── */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All Codes</p>
              <button onClick={load} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                <RefreshCw size={11} /> Refresh
              </button>
            </div>

            {codes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">No codes yet. Generate one above.</p>
            ) : (
              <div className="space-y-2">
                {codes.map((c) => {
                  const isUsed        = !!c.usedBy;
                  const isExpired     = !isUsed && c.codeExpiresAt && new Date(c.codeExpiresAt) < new Date();
                  const accessExp     = c.accessExpiresAt ? new Date(c.accessExpiresAt) : null;
                  const accessExpired = accessExp && accessExp < new Date();

                  return (
                    <div key={c.id} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border ${
                      isUsed ? 'bg-[#F5F5F7] border-border' : isExpired ? 'bg-red-50 border-red-100' : 'bg-white border-primary/10'
                    }`}>
                      <div className="flex-1 min-w-0">
                        {/* Code + status badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-mono font-semibold text-sm tracking-widest ${isUsed || isExpired ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {c.code}
                          </span>
                          {isUsed    && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Used</span>}
                          {isExpired && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Code expired</span>}
                          {!isUsed && !isExpired && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Available</span>}
                          {accessExpired && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Access expired</span>}
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {c.label && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User size={10} />{c.label.replace(/^\[\d+d\]\s?/, '')}
                            </span>
                          )}
                          {isUsed && (c.usedByName || c.usedByEmail) && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User size={10} />{c.usedByName || c.usedByEmail}
                            </span>
                          )}
                          {isUsed && c.usedAt && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={10} />Activated {new Date(c.usedAt).toLocaleDateString()}
                            </span>
                          )}
                          {!isUsed && c.codeExpiresAt && !isExpired && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={10} />Code expires {new Date(c.codeExpiresAt).toLocaleDateString()}
                            </span>
                          )}
                          {accessExp && !accessExpired && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={10} />Access until {accessExp.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!isUsed && !isExpired && (
                          <button onClick={() => copyCode(c.code)}
                            className="p-1.5 text-muted-foreground hover:text-primary rounded-lg transition-colors" title="Copy code">
                            <Copy size={12} />
                          </button>
                        )}
                        <button onClick={() => handleRevoke(c.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors" title="Revoke code">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
