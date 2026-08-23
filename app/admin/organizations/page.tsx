'use client';

import { useEffect, useState } from 'react';
import {
  getOrganizations, createOrganization, updateOrganization,
  deleteOrganization, assignSchoolToOrganization, getSchoolsWithOrg,
} from '@/app/actions/organizations';
import {
  Globe, Plus, Trash2, Loader2, ChevronDown, ChevronRight,
  Building2, Pencil, Check, X, Link2, Link2Off,
} from 'lucide-react';

export default function OrganizationsPage() {
  const [orgs,         setOrgs]         = useState<any[]>([]);
  const [allSchools,   setAllSchools]   = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [formName,     setFormName]     = useState('');
  const [formDomain,   setFormDomain]   = useState('');
  const [formError,    setFormError]    = useState('');
  const [creating,     setCreating]     = useState(false);
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set());

  // Edit org
  const [editingOrg,   setEditingOrg]   = useState<string | null>(null);
  const [editName,     setEditName]     = useState('');
  const [editDomain,   setEditDomain]   = useState('');
  const [savingOrg,    setSavingOrg]    = useState(false);

  // Assign modal
  const [assignOrgId,  setAssignOrgId]  = useState<string | null>(null);
  const [assigning,    setAssigning]    = useState<string | null>(null); // schoolId being saved

  useEffect(() => {
    Promise.all([getOrganizations(), getSchoolsWithOrg()]).then(([orgRes, schoolRes]) => {
      if (orgRes.success)    setOrgs(orgRes.data ?? []);
      if (schoolRes.success) setAllSchools(schoolRes.data ?? []);
      setLoading(false);
    });
  }, []);

  const refresh = async () => {
    const [orgRes, schoolRes] = await Promise.all([getOrganizations(), getSchoolsWithOrg()]);
    if (orgRes.success)    setOrgs(orgRes.data ?? []);
    if (schoolRes.success) setAllSchools(schoolRes.data ?? []);
  };

  const handleCreate = async () => {
    setFormError('');
    if (!formName.trim()) { setFormError('Name is required'); return; }
    if (!formDomain.trim()) { setFormError('Domain is required'); return; }
    setCreating(true);
    const r = await createOrganization({ name: formName, domain: formDomain });
    setCreating(false);
    if (!r.success) { setFormError((r as any).error ?? 'Failed'); return; }
    setFormName(''); setFormDomain(''); setShowForm(false);
    await refresh();
  };

  const handleDelete = async (org: any) => {
    if (!confirm(`Delete organization "${org.name}"? Its ${org.schoolCount} creator(s) will be detached.`)) return;
    await deleteOrganization(org.id);
    await refresh();
  };

  const startEdit = (org: any) => {
    setEditingOrg(org.id); setEditName(org.name); setEditDomain(org.domain);
  };

  const saveEdit = async (orgId: string) => {
    setSavingOrg(true);
    await updateOrganization(orgId, { name: editName, domain: editDomain });
    setSavingOrg(false);
    setEditingOrg(null);
    await refresh();
  };

  const handleAssign = async (schoolId: string, orgId: string | null) => {
    setAssigning(schoolId);
    await assignSchoolToOrganization(schoolId, orgId);
    setAssigning(null);
    await refresh();
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const inp = 'w-full px-3 py-2 text-sm border border-border rounded-lg focus:border-primary focus:outline-none bg-white';

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Group creators under an organization domain (e.g. myschool.com)
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setFormError(''); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
          <Plus size={14} /> New Organization
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 max-w-lg space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Create organization</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Organization name</label>
              <input value={formName} onChange={e => setFormName(e.target.value)}
                className={inp} placeholder="e.g. Obin Academy" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Domain</label>
              <input value={formDomain} onChange={e => setFormDomain(e.target.value.toLowerCase())}
                className={inp} placeholder="e.g. obinacademy.com" />
              <p className="text-[10px] text-muted-foreground mt-1">
                Without https:// — e.g. <code>obinacademy.com</code>
              </p>
            </div>
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60">
              {creating ? <><Loader2 size={13} className="animate-spin" /> Creating…</> : 'Create organization'}
            </button>
            <button onClick={() => { setShowForm(false); setFormError(''); }}
              className="px-4 py-2 border border-border text-muted-foreground text-sm font-semibold rounded-lg hover:bg-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Org list */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-12">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : orgs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm py-16 text-center">
          <Globe className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No organizations yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map(org => {
            const isExpanded = expanded.has(org.id);
            const isEditing  = editingOrg === org.id;
            // Schools NOT in this org (for the assign panel)
            const unassigned = allSchools.filter(s => s.organizationId !== org.id);
            const assigned   = org.schools as any[];

            return (
              <div key={org.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Org row */}
                <div className="flex items-center gap-4 px-6 py-4">
                  {/* Expand toggle */}
                  <button onClick={() => toggleExpand(org.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Globe size={16} className="text-primary" />
                  </div>

                  {/* Name + domain — editable */}
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-primary rounded focus:outline-none" placeholder="Name" />
                      <input value={editDomain} onChange={e => setEditDomain(e.target.value.toLowerCase())}
                        className="flex-1 px-2 py-1 text-sm border border-border rounded focus:outline-none font-mono" placeholder="domain.com" />
                      <button onClick={() => saveEdit(org.id)} disabled={savingOrg}
                        className="p-1.5 text-primary hover:text-primary/80 disabled:opacity-50">
                        {savingOrg ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      </button>
                      <button onClick={() => setEditingOrg(null)}
                        className="p-1.5 text-muted-foreground hover:text-foreground">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{org.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{org.domain}</p>
                    </div>
                  )}

                  {/* Creator count badge */}
                  <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                    {assigned.length} creator{assigned.length !== 1 ? 's' : ''}
                  </span>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => startEdit(org)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(org)}
                        className="p-1.5 text-destructive/50 hover:text-destructive transition-colors" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded: assigned creators + assign panel */}
                {isExpanded && (
                  <div className="border-t border-black/[0.05] px-6 py-5 space-y-5">

                    {/* Assigned creators */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                        Assigned creators
                      </p>
                      {assigned.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">None yet — assign creators below.</p>
                      ) : (
                        <div className="space-y-2">
                          {assigned.map((s: any) => (
                            <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-secondary/50 rounded-xl">
                              <div className="flex items-center gap-2.5">
                                <Building2 size={13} className="text-muted-foreground shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                                  <p className="text-[11px] text-muted-foreground font-mono">/creator/{s.slug}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAssign(s.id, null)}
                                disabled={assigning === s.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-destructive/70 hover:text-destructive border border-destructive/20 rounded-lg hover:border-destructive/50 transition-colors disabled:opacity-50"
                                title="Remove from this organization">
                                {assigning === s.id
                                  ? <Loader2 size={11} className="animate-spin" />
                                  : <Link2Off size={11} />}
                                Detach
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assign panel — show schools not yet in this org */}
                    {unassigned.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                          Assign a creator to this organization
                        </p>
                        <div className="space-y-2">
                          {unassigned.map((s: any) => {
                            const currentOrg = orgs.find(o => o.id === s.organizationId);
                            return (
                              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 border border-border rounded-xl hover:bg-secondary/30 transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Building2 size={13} className="text-muted-foreground shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                                    <div className="flex items-center gap-2">
                                      <p className="text-[11px] text-muted-foreground font-mono">/creator/{s.slug}</p>
                                      {currentOrg && (
                                        <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                          in {currentOrg.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAssign(s.id, org.id)}
                                  disabled={assigning === s.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0">
                                  {assigning === s.id
                                    ? <Loader2 size={11} className="animate-spin" />
                                    : <Link2 size={11} />}
                                  Assign
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {unassigned.length === 0 && assigned.length > 0 && (
                      <p className="text-xs text-muted-foreground italic">All creators are assigned to this organization.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unassigned creators summary */}
      {!loading && (() => {
        const unassignedGlobal = allSchools.filter(s => !s.organizationId);
        if (!unassignedGlobal.length) return null;
        return (
          <div className="mt-8 bg-orange-50 border border-orange-200 rounded-2xl px-6 py-5">
            <p className="text-sm font-semibold text-orange-800 mb-3">
              {unassignedGlobal.length} creator{unassignedGlobal.length !== 1 ? 's' : ''} not assigned to any organization
            </p>
            <div className="space-y-1.5">
              {unassignedGlobal.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-sm text-orange-700">
                  <Building2 size={12} className="shrink-0" />
                  <span className="font-medium">{s.name}</span>
                  <span className="text-orange-500 font-mono text-xs">/creator/{s.slug}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-orange-600 mt-3">
              Expand an organization above to assign these creators.
            </p>
          </div>
        );
      })()}
    </div>
  );
}
