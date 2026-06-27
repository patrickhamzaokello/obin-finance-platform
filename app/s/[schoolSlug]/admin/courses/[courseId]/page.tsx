'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { uploadToBlob } from '@/lib/upload-client';
import { FileOrUrlInput } from '@/components/file-or-url-input';
import {
  getAdminCourse,
  createCourse, updateCourse, deleteCourse,
  createModule, deleteModule,
  createVideo, deleteVideo,
  createPdf, deletePdf,
  getSchools,
} from '@/app/actions/admin';
import {
  ChevronDown, ChevronUp, Play, FileText, Plus, Trash2,
  BookOpen, LayoutDashboard, Users, Check, AlertCircle,
  Video, Upload, Link2,
} from 'lucide-react';

// ─── Toast ────────────────────────────────────────────────────────────────────
type Toast = { type: 'success' | 'error'; message: string; id: number };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { type, message, id }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className='fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm'>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded shadow-lg text-sm font-medium bg-white border ${
            t.type === 'success'
              ? 'border-l-[3px] border-l-primary border-border'
              : 'border-l-[3px] border-l-destructive border-border'
          }`}
        >
          {t.type === 'success'
            ? <Check size={15} className='text-primary mt-0.5 shrink-0' />
            : <AlertCircle size={15} className='text-destructive mt-0.5 shrink-0' />
          }
          <span className='text-foreground'>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Shared ────────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 bg-white';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/users', label: 'Users', icon: Users },
];

function isYouTubeLike(url: string) {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CourseEditor() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;
  const isNew = courseId === 'new';

  const [course, setCourse]   = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const { toasts, show: showToast } = useToast();

  // Derived: slug of the school currently selected for this course
  const schoolSlug = schools.find((s) => s.id === course?.schoolId)?.slug || '';

  useEffect(() => {
    getSchools().then((r) => { if (r.success) setSchools(r.data as any[]); });
    if (!isNew) {
      getAdminCourse(courseId).then((result) => {
        if (result.success) {
          setCourse(result.data);
        } else {
          setLoadError((result as any).error || 'Failed to load course');
        }
        setLoading(false);
      });
    } else {
      setCourse({ id: 'new', title: '', description: '', thumbnail: '', instructor: '', schoolId: '', isPublished: false, modules: [] });
      setLoading(false);
    }
  }, [courseId, isNew]);

  const handleSaveCourse = async () => {
    if (!course?.title.trim()) { showToast('error', 'Course title is required'); return; }
    setSaving(true);
    const data = { title: course.title, description: course.description, thumbnail: course.thumbnail, instructor: course.instructor, isPublished: course.isPublished, schoolId: course.schoolId || null };
    const result = isNew ? await createCourse(data) : await updateCourse(courseId, data);
    setSaving(false);
    if (result.success) {
      showToast('success', isNew ? 'Course created!' : 'Changes saved');
      if (isNew) router.push('/admin/courses');
    } else {
      showToast('error', (result as any).error || 'Failed to save course');
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm('Delete this course and all its content? This cannot be undone.')) return;
    const result = await deleteCourse(courseId);
    if (result.success) router.push('/admin/courses');
    else showToast('error', (result as any).error || 'Failed to delete course');
  };

  const handleAddModule = async (title: string, description: string) => {
    const order = (course.modules?.length || 0) + 1;
    const result = await createModule(courseId, { title, description, order });
    if (result.success) {
      setCourse((prev: any) => ({
        ...prev,
        modules: [...(prev.modules || []), { ...result.data, videos: [], pdfs: [] }],
      }));
      setShowModuleForm(false);
      showToast('success', 'Module added');
    } else {
      showToast('error', (result as any).error || 'Failed to add module');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module and all its videos and resources?')) return;
    const result = await deleteModule(moduleId);
    if (result.success) {
      setCourse((prev: any) => ({ ...prev, modules: prev.modules.filter((m: any) => m.id !== moduleId) }));
      showToast('success', 'Module deleted');
    } else {
      showToast('error', (result as any).error || 'Failed to delete module');
    }
  };

  const handleModuleUpdate = useCallback((updatedModule: any) => {
    setCourse((prev: any) => ({
      ...prev,
      modules: prev.modules.map((m: any) => (m.id === updatedModule.id ? updatedModule : m)),
    }));
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className='min-h-screen bg-[#f9fafb] flex items-center justify-center px-4'>
        <div className='card-accent p-8 max-w-md w-full text-center'>
          <AlertCircle className='w-10 h-10 text-destructive mx-auto mb-4' />
          <h2 className='text-lg font-semibold text-foreground mb-2'>Failed to load course</h2>
          <p className='text-sm text-muted-foreground mb-1'>Course ID: <code className='font-mono text-xs bg-muted px-1 py-0.5 rounded'>{courseId}</code></p>
          <p className='text-xs text-destructive bg-destructive/6 border border-destructive/20 rounded px-3 py-2 mt-3 mb-6 text-left'>{loadError}</p>
          <Link
            href='/admin/courses'
            className='inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors'
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className='min-h-screen bg-[#f9fafb]'>
      <ToastContainer toasts={toasts} />

      <header className='bg-white border-b border-border sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4'>
          <div className='w-[3px] h-8 bg-primary rounded-full' />
          <h1 className='text-lg font-bold text-foreground tracking-tight'>
            {isNew ? 'New Course' : 'Edit Course'}
          </h1>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7'>
        <nav className='flex gap-1 mb-7 bg-white border border-border rounded p-1 w-fit'>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className='inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors'
            >
              <Icon size={14} />{label}
            </Link>
          ))}
        </nav>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>

          {/* Course details (sticky left panel) */}
          <div className='lg:col-span-1'>
            <div className='sticky top-[69px]'>
              <div className='card-accent p-6 space-y-5'>
                <p className='text-xs font-semibold text-primary uppercase tracking-wider'>Course Details</p>

                <div>
                  <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>
                    Title <span className='text-destructive'>*</span>
                  </label>
                  <input type='text' value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} className={inputCls} placeholder='Enter course title' />
                </div>

                <div>
                  <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>Description</label>
                  <textarea value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} className={inputCls} placeholder='What will learners gain?' rows={4} />
                </div>

                <div>
                  <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>Instructor</label>
                  <input type='text' value={course.instructor} onChange={(e) => setCourse({ ...course, instructor: e.target.value })} className={inputCls} placeholder='Instructor name' />
                </div>

                <div>
                  <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>
                    School <span className='text-destructive'>*</span>
                  </label>
                  {schools.length === 0 ? (
                    <p className='text-xs text-muted-foreground px-3 py-2 border border-border rounded bg-secondary'>
                      No schools yet — <a href='/admin/schools' className='text-primary underline'>create one first</a>
                    </p>
                  ) : (
                    <select
                      value={course.schoolId || ''}
                      onChange={(e) => setCourse({ ...course, schoolId: e.target.value })}
                      className={inputCls}
                    >
                      <option value=''>— Select school —</option>
                      {schools.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.slug})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <FileOrUrlInput
                    value={course.thumbnail}
                    onChange={(value) => setCourse({ ...course, thumbnail: value })}
                    fileType='thumbnail'
                    schoolSlug={schoolSlug}
                    label='Thumbnail Image'
                    placeholder='https://…'
                  />
                </div>

                <div className='flex items-center justify-between py-3 px-4 bg-secondary rounded border border-border'>
                  <div>
                    <p className='text-sm font-semibold text-foreground'>Publish course</p>
                    <p className='text-xs text-muted-foreground mt-0.5'>Visible to all learners</p>
                  </div>
                  <button
                    onClick={() => setCourse({ ...course, isPublished: !course.isPublished })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${course.isPublished ? 'bg-primary' : 'bg-border'}`}
                    role='switch' aria-checked={course.isPublished}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${course.isPublished ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className='flex flex-col gap-2 pt-1'>
                  <button onClick={handleSaveCourse} disabled={saving}
                    className='w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors disabled:opacity-60'
                  >
                    {saving ? 'Saving…' : isNew ? 'Create Course' : 'Save Changes'}
                  </button>
                  {!isNew && (
                    <button onClick={handleDeleteCourse}
                      className='w-full py-2.5 border border-destructive text-destructive text-sm font-semibold rounded hover:bg-destructive/6 transition-colors'
                    >
                      Delete Course
                    </button>
                  )}
                  <Link href='/admin/courses'
                    className='w-full py-2.5 border border-border text-muted-foreground text-sm font-semibold rounded hover:bg-secondary text-center block transition-colors'
                  >
                    ← Back to Courses
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum (right panel) */}
          {!isNew ? (
            <div className='lg:col-span-2 space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='text-base font-semibold text-foreground'>Curriculum</h2>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {course.modules?.length || 0} module{course.modules?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {!showModuleForm && (
                  <button onClick={() => setShowModuleForm(true)}
                    className='inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors'
                  >
                    <Plus size={14} /> Add Module
                  </button>
                )}
              </div>

              {showModuleForm && (
                <AddModuleForm onSubmit={handleAddModule} onCancel={() => setShowModuleForm(false)} />
              )}

              {course.modules?.length > 0 ? (
                <div className='space-y-3'>
                  {course.modules.map((mod: any, index: number) => (
                    <ModuleCard
                      key={mod.id}
                      module={mod}
                      index={index}
                      schoolSlug={schoolSlug}
                      onDelete={() => handleDeleteModule(mod.id)}
                      onUpdate={handleModuleUpdate}
                      showToast={showToast}
                    />
                  ))}
                </div>
              ) : (
                <div className='card-accent p-10 text-center'>
                  <BookOpen className='w-8 h-8 text-border mx-auto mb-3' />
                  <p className='text-sm font-semibold text-foreground mb-1'>No modules yet</p>
                  <p className='text-xs text-muted-foreground'>Add your first module to start building the curriculum.</p>
                </div>
              )}
            </div>
          ) : (
            <div className='lg:col-span-2'>
              <div className='card-accent p-10 text-center h-full flex flex-col items-center justify-center gap-3'>
                <BookOpen className='w-8 h-8 text-border' />
                <p className='text-sm font-semibold text-foreground'>Create the course first</p>
                <p className='text-xs text-muted-foreground'>Once saved, you can add modules, videos, and resources.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Module Form ──────────────────────────────────────────────────────────
function AddModuleForm({ onSubmit, onCancel }: { onSubmit: (title: string, desc: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    await onSubmit(title, description);
    setBusy(false);
  };

  return (
    <div className='card-accent p-5 space-y-4'>
      <p className='text-xs font-semibold text-primary uppercase tracking-wider'>New Module</p>
      <div>
        <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>
          Title <span className='text-destructive'>*</span>
        </label>
        <input type='text' value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls}
          placeholder='e.g. Introduction to Budgeting' autoFocus onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>
      <div>
        <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls}
          placeholder='What does this module cover?' rows={2} />
      </div>
      <div className='flex gap-2'>
        <button onClick={submit} disabled={busy || !title.trim()}
          className='flex-1 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors disabled:opacity-50'
        >
          {busy ? 'Adding…' : 'Add Module'}
        </button>
        <button onClick={onCancel} className='px-4 py-2 border border-border text-muted-foreground text-sm font-semibold rounded hover:bg-secondary transition-colors'>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({
  module, index, schoolSlug, onDelete, onUpdate, showToast,
}: {
  module: any;
  index: number;
  schoolSlug: string;
  onDelete: () => void;
  onUpdate: (m: any) => void;
  showToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const videoCount = module.videos?.length || 0;
  const pdfCount = module.pdfs?.length || 0;

  return (
    <div className={`bg-white border rounded overflow-hidden transition-all duration-150 ${expanded ? 'border-primary/50 shadow-sm' : 'border-border hover:border-muted-foreground/40'}`}>
      {/* Header — using div + role=button to avoid nested button issue */}
      <div
        role='button'
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExpanded(!expanded)}
        className='flex items-center gap-4 px-5 py-4 cursor-pointer select-none group'
      >
        <span className='shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center'>
          {index + 1}
        </span>

        <div className='flex-1 min-w-0'>
          <p className='text-sm font-semibold text-foreground truncate'>{module.title}</p>
          <p className='text-xs text-muted-foreground mt-0.5'>
            {videoCount === 0 && pdfCount === 0
              ? 'No content yet — expand to add'
              : `${videoCount} video${videoCount !== 1 ? 's' : ''}${pdfCount > 0 ? ` · ${pdfCount} resource${pdfCount !== 1 ? 's' : ''}` : ''}`}
          </p>
        </div>

        <div className='flex items-center gap-1 shrink-0'>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className='p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded transition-colors opacity-0 group-hover:opacity-100'
            title='Delete module'
          >
            <Trash2 size={13} />
          </button>
          {expanded
            ? <ChevronUp size={15} className='text-muted-foreground' />
            : <ChevronDown size={15} className='text-muted-foreground' />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className='border-t border-border'>
          <VideoSection
            module={module}
            onUpdate={onUpdate}
            showToast={showToast}
          />
          <ResourceSection
            module={module}
            onUpdate={onUpdate}
            showToast={showToast}
          />
        </div>
      )}
    </div>
  );
}

// ─── Video Section ────────────────────────────────────────────────────────────
function VideoSection({ module, onUpdate, showToast }: {
  module: any;
  onUpdate: (m: any) => void;
  showToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (videoId: string) => {
    const result = await deleteVideo(videoId);
    if (result.success) {
      onUpdate({ ...module, videos: module.videos.filter((v: any) => v.id !== videoId) });
      showToast('success', 'Video removed');
    } else {
      showToast('error', 'Failed to remove video');
    }
  };

  const handleAdd = (video: any) => {
    onUpdate({ ...module, videos: [...(module.videos || []), video] });
    showToast('success', 'Video added');
    setShowForm(false);
  };

  return (
    <div className='px-5 py-4 border-b border-border'>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <Play size={13} className='text-muted-foreground' />
          <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Videos</span>
          <span className='text-xs text-muted-foreground'>({module.videos?.length || 0})</span>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className='inline-flex items-center gap-1 px-3 py-1.5 border border-border text-xs font-semibold text-foreground rounded hover:border-primary hover:text-primary transition-colors'
          >
            <Plus size={11} /> Add Video
          </button>
        )}
      </div>

      {/* Existing videos */}
      {module.videos?.length > 0 && (
        <div className='space-y-1.5 mb-3'>
          {module.videos.map((vid: any) => (
            <ContentRow
              key={vid.id}
              icon={isYouTubeLike(vid.youtubeUrl || '') ? Video : Play}
              title={vid.title}
              subtitle={vid.youtubeUrl || vid.url || ''}
              badge={vid.youtubeUrl ? 'YouTube' : 'Upload'}
              onDelete={() => handleDelete(vid.id)}
            />
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <AddVideoForm
          moduleId={module.id}
          schoolSlug={schoolSlug}
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
          showToast={showToast}
        />
      )}

      {!showForm && module.videos?.length === 0 && (
        <p className='text-xs text-muted-foreground italic'>No videos yet</p>
      )}
    </div>
  );
}

// ─── Resource (PDF) Section ───────────────────────────────────────────────────
function ResourceSection({ module, onUpdate, showToast }: {
  module: any;
  onUpdate: (m: any) => void;
  showToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (pdfId: string) => {
    const result = await deletePdf(pdfId);
    if (result.success) {
      onUpdate({ ...module, pdfs: module.pdfs.filter((p: any) => p.id !== pdfId) });
      showToast('success', 'Resource removed');
    } else {
      showToast('error', 'Failed to remove resource');
    }
  };

  const handleAdd = (pdf: any) => {
    onUpdate({ ...module, pdfs: [...(module.pdfs || []), pdf] });
    showToast('success', 'Resource added');
    setShowForm(false);
  };

  return (
    <div className='px-5 py-4'>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <FileText size={13} className='text-muted-foreground' />
          <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Resources</span>
          <span className='text-xs text-muted-foreground'>({module.pdfs?.length || 0})</span>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className='inline-flex items-center gap-1 px-3 py-1.5 border border-border text-xs font-semibold text-foreground rounded hover:border-primary hover:text-primary transition-colors'
          >
            <Plus size={11} /> Add PDF
          </button>
        )}
      </div>

      {module.pdfs?.length > 0 && (
        <div className='space-y-1.5 mb-3'>
          {module.pdfs.map((p: any) => (
            <ContentRow
              key={p.id}
              icon={FileText}
              title={p.title}
              subtitle={p.url}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <AddPdfForm
          moduleId={module.id}
          schoolSlug={schoolSlug}
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
          showToast={showToast}
        />
      )}

      {!showForm && module.pdfs?.length === 0 && (
        <p className='text-xs text-muted-foreground italic'>No resources yet</p>
      )}
    </div>
  );
}

// ─── Content Row (existing item) ──────────────────────────────────────────────
function ContentRow({ icon: Icon, title, subtitle, badge, onDelete }: {
  icon: any;
  title: string;
  subtitle?: string;
  badge?: string;
  onDelete: () => void;
}) {
  return (
    <div className='flex items-center gap-3 px-3 py-2.5 bg-secondary rounded group'>
      <Icon size={13} className='text-muted-foreground shrink-0' />
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-medium text-foreground truncate'>{title}</p>
          {badge && (
            <span className='shrink-0 text-[10px] font-semibold px-1.5 py-0.5 bg-primary/10 text-primary rounded'>
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className='text-xs text-muted-foreground truncate mt-0.5'>{subtitle}</p>}
      </div>
      <button onClick={onDelete}
        className='p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0'
        title='Remove'
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ─── Add Video Form ───────────────────────────────────────────────────────────
function AddVideoForm({ moduleId, schoolSlug, onAdd, onCancel, showToast }: {
  moduleId: string;
  schoolSlug: string;
  onAdd: (video: any) => void;
  onCancel: () => void;
  showToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<'youtube' | 'upload'>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadToBlob(file, 'video', schoolSlug);
    setUploading(false);
    if (result.success) {
      setUploadedUrl(result.url);
      showToast('success', 'File uploaded — now click "Add Video"');
    } else {
      showToast('error', result.error);
    }
    e.target.value = '';
  };

  const submit = async () => {
    if (!title.trim()) { showToast('error', 'Video title is required'); return; }
    const url = source === 'youtube' ? youtubeUrl.trim() : uploadedUrl;
    if (!url) {
      showToast('error', source === 'youtube' ? 'Paste a YouTube URL' : 'Upload a video file first');
      return;
    }
    setBusy(true);
    const result = await createVideo(moduleId, { title: title.trim(), url, order: 999 });
    setBusy(false);
    if (result.success) {
      onAdd(result.data);
    } else {
      showToast('error', (result as any).error || 'Failed to add video');
    }
  };

  return (
    <div className='mt-3 bg-white border border-border rounded overflow-hidden'>
      {/* Source selector */}
      <div className='flex border-b border-border'>
        {(['youtube', 'upload'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
              source === s
                ? 'bg-primary/8 text-primary border-b-2 border-b-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {s === 'youtube' ? <Video size={13} /> : <Upload size={13} />}
            {s === 'youtube' ? 'YouTube Link' : 'Upload File'}
          </button>
        ))}
      </div>

      <div className='p-4 space-y-3'>
        {/* Title */}
        <div>
          <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>
            Video Title <span className='text-destructive'>*</span>
          </label>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
            placeholder='e.g. Introduction to Compound Interest'
            autoFocus
          />
        </div>

        {/* YouTube source */}
        {source === 'youtube' && (
          <div>
            <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>
              YouTube URL <span className='text-destructive'>*</span>
            </label>
            <input
              type='text'
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className={inputCls}
              placeholder='https://www.youtube.com/watch?v=… or https://youtu.be/…'
            />
            {youtubeUrl && isYouTubeLike(youtubeUrl) && (
              <p className='flex items-center gap-1.5 text-xs text-primary font-medium mt-1.5'>
                <Check size={12} /> Valid YouTube URL
              </p>
            )}
            {youtubeUrl && !isYouTubeLike(youtubeUrl) && (
              <p className='flex items-center gap-1.5 text-xs text-destructive mt-1.5'>
                <AlertCircle size={12} /> Paste a full YouTube link (youtube.com or youtu.be)
              </p>
            )}
          </div>
        )}

        {/* File upload source */}
        {source === 'upload' && (
          <div>
            <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>
              Video File <span className='text-destructive'>*</span>
            </label>
            <input
              ref={fileInputRef}
              type='file'
              accept='video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov'
              onChange={handleFileUpload}
              className='hidden'
              id={`video-upload-${moduleId}`}
            />
            {uploadedUrl ? (
              <div className='flex items-center gap-3 px-3 py-2.5 bg-primary/6 border border-primary/20 rounded'>
                <Check size={14} className='text-primary shrink-0' />
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-semibold text-primary'>File uploaded successfully</p>
                  <p className='text-xs text-muted-foreground truncate mt-0.5'>{uploadedUrl}</p>
                </div>
                <button onClick={() => setUploadedUrl('')} className='text-muted-foreground hover:text-foreground'>
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <label
                htmlFor={`video-upload-${moduleId}`}
                className={`flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded cursor-pointer transition-colors ${
                  uploading ? 'border-primary/40 bg-primary/4' : 'border-border hover:border-primary/40 hover:bg-secondary'
                }`}
              >
                <Upload size={20} className={uploading ? 'text-primary animate-pulse' : 'text-muted-foreground'} />
                <span className='text-sm font-medium text-foreground'>
                  {uploading ? 'Uploading…' : 'Click to choose a video file'}
                </span>
                <span className='text-xs text-muted-foreground'>MP4, WebM, MOV — max 100 MB</span>
              </label>
            )}
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-2 pt-1'>
          <button
            onClick={submit}
            disabled={busy || uploading}
            className='flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors disabled:opacity-50'
          >
            {busy ? 'Saving…' : 'Add Video'}
          </button>
          <button onClick={onCancel} className='px-4 py-2 border border-border text-muted-foreground text-sm font-semibold rounded hover:bg-secondary transition-colors'>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add PDF Form ─────────────────────────────────────────────────────────────
function AddPdfForm({ moduleId, schoolSlug, onAdd, onCancel, showToast }: {
  moduleId: string;
  schoolSlug: string;
  onAdd: (pdf: any) => void;
  onCancel: () => void;
  showToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<'url' | 'upload'>('url');
  const [pdfUrl, setPdfUrl] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadToBlob(file, 'pdf', schoolSlug);
    setUploading(false);
    if (result.success) {
      setUploadedUrl(result.url);
      showToast('success', 'File uploaded — now click "Add Resource"');
    } else {
      showToast('error', result.error);
    }
    e.target.value = '';
  };

  const submit = async () => {
    if (!title.trim()) { showToast('error', 'Resource title is required'); return; }
    const url = source === 'url' ? pdfUrl.trim() : uploadedUrl;
    if (!url) {
      showToast('error', source === 'url' ? 'Enter a URL' : 'Upload a PDF file first');
      return;
    }
    setBusy(true);
    const result = await createPdf(moduleId, { title: title.trim(), url, order: 999 });
    setBusy(false);
    if (result.success) {
      onAdd(result.data);
    } else {
      showToast('error', (result as any).error || 'Failed to add resource');
    }
  };

  return (
    <div className='mt-3 bg-white border border-border rounded overflow-hidden'>
      {/* Source selector */}
      <div className='flex border-b border-border'>
        {(['url', 'upload'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors ${
              source === s
                ? 'bg-primary/8 text-primary border-b-2 border-b-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {s === 'url' ? <Link2 size={13} /> : <Upload size={13} />}
            {s === 'url' ? 'PDF URL' : 'Upload File'}
          </button>
        ))}
      </div>

      <div className='p-4 space-y-3'>
        <div>
          <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>
            Resource Title <span className='text-destructive'>*</span>
          </label>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
            placeholder='e.g. Module 1 — Study Notes'
            autoFocus
          />
        </div>

        {source === 'url' && (
          <div>
            <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>
              PDF URL <span className='text-destructive'>*</span>
            </label>
            <input
              type='text'
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              className={inputCls}
              placeholder='https://…'
            />
          </div>
        )}

        {source === 'upload' && (
          <div>
            <label className='block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'>
              PDF File <span className='text-destructive'>*</span>
            </label>
            <input
              type='file'
              accept='application/pdf,.pdf'
              onChange={handleFileUpload}
              className='hidden'
              id={`pdf-upload-${moduleId}`}
            />
            {uploadedUrl ? (
              <div className='flex items-center gap-3 px-3 py-2.5 bg-primary/6 border border-primary/20 rounded'>
                <Check size={14} className='text-primary shrink-0' />
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-semibold text-primary'>File uploaded successfully</p>
                  <p className='text-xs text-muted-foreground truncate mt-0.5'>{uploadedUrl}</p>
                </div>
                <button onClick={() => setUploadedUrl('')} className='text-muted-foreground hover:text-foreground'>
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <label
                htmlFor={`pdf-upload-${moduleId}`}
                className={`flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded cursor-pointer transition-colors ${
                  uploading ? 'border-primary/40 bg-primary/4' : 'border-border hover:border-primary/40 hover:bg-secondary'
                }`}
              >
                <Upload size={20} className={uploading ? 'text-primary animate-pulse' : 'text-muted-foreground'} />
                <span className='text-sm font-medium text-foreground'>
                  {uploading ? 'Uploading…' : 'Click to choose a PDF'}
                </span>
                <span className='text-xs text-muted-foreground'>PDF — max 50 MB</span>
              </label>
            )}
          </div>
        )}

        <div className='flex gap-2 pt-1'>
          <button
            onClick={submit}
            disabled={busy || uploading}
            className='flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors disabled:opacity-50'
          >
            {busy ? 'Saving…' : 'Add Resource'}
          </button>
          <button onClick={onCancel} className='px-4 py-2 border border-border text-muted-foreground text-sm font-semibold rounded hover:bg-secondary transition-colors'>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
