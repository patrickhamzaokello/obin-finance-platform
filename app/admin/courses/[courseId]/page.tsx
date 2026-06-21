'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCourseById } from '@/app/actions/courses';
import { FileOrUrlInput } from '@/components/file-or-url-input';
import {
  createCourse,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  createVideo,
  updateVideo,
  deleteVideo,
  createPdf,
  updatePdf,
  deletePdf,
} from '@/app/actions/admin';

export default function CourseEditor() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;
  const isNew = courseId === 'new';

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(!isNew);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);

  useEffect(() => {
    if (!isNew) {
      const loadCourse = async () => {
        const result = await getCourseById(courseId);
        if (result.success) {
          setCourse(result.data);
        } else {
          router.push('/admin/courses');
        }
        setLoading(false);
      };
      loadCourse();
    } else {
      setCourse({
        id: 'new',
        title: '',
        description: '',
        thumbnail: '',
        instructor: '',
        isPublished: false,
        modules: [],
      });
      setLoading(false);
    }
  }, [courseId, isNew, router]);

  const handleSaveCourse = async () => {
    if (!course?.title) {
      alert('Please enter a course title');
      return;
    }

    const data = {
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      instructor: course.instructor,
      isPublished: course.isPublished,
    };

    if (isNew) {
      const result = await createCourse(data);
      if (result.success) {
        alert('Course created successfully!');
        router.push('/admin/courses');
      } else {
        alert('Error creating course: ' + (result.error || 'Unknown error'));
        console.error('[v0] Create course failed:', result);
      }
    } else {
      const result = await updateCourse(courseId, data);
      if (result.success) {
        alert('Course updated successfully!');
      } else {
        alert('Error updating course: ' + (result.error || 'Unknown error'));
        console.error('[v0] Update course failed:', result);
      }
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    const result = await deleteCourse(courseId);
    if (result.success) {
      alert('Course deleted successfully!');
      router.push('/admin/courses');
    }
  };

  const handleAddModule = async (title: string, description: string) => {
    if (!title) {
      alert('Please enter a module title');
      return;
    }
    const order = (course.modules?.length || 0) + 1;
    const result = await createModule(courseId, { title, description, order });
    if (result.success) {
      setCourse({
        ...course,
        modules: [...(course.modules || []), result.data],
      });
      setShowModuleForm(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-lg text-foreground'>Loading...</div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className='min-h-screen bg-white'>
      <header className='border-b-2 border-border bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <h1 className='text-3xl font-semibold text-foreground'>{isNew ? 'Create Course' : 'Edit Course'}</h1>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Course Details */}
        <div className='border-2 border-border bg-white p-6 mb-8'>
          <h2 className='text-2xl font-semibold text-foreground mb-6'>Course Details</h2>
          <div className='space-y-5'>
            <div>
              <label className='block text-sm font-semibold text-foreground mb-2'>Course Title*</label>
              <input
                type='text'
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className='w-full px-4 py-2 border-2 border-border rounded focus:border-primary focus:outline-none'
                placeholder='Enter course title'
              />
            </div>
            <div>
              <label className='block text-sm font-semibold text-foreground mb-2'>Description</label>
              <textarea
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                className='w-full px-4 py-2 border-2 border-border rounded focus:border-primary focus:outline-none'
                placeholder='Enter course description'
                rows={4}
              />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              <div>
                <FileOrUrlInput
                  value={course.thumbnail}
                  onChange={(value) => setCourse({ ...course, thumbnail: value })}
                  fileType='thumbnail'
                  label='Thumbnail Image'
                  placeholder='https://...'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-foreground mb-2'>Instructor</label>
                <input
                  type='text'
                  value={course.instructor}
                  onChange={(e) => setCourse({ ...course, instructor: e.target.value })}
                  className='w-full px-4 py-2 border-2 border-border rounded focus:border-primary focus:outline-none'
                  placeholder='Instructor name'
                />
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <input
                type='checkbox'
                id='publish-course'
                checked={course.isPublished}
                onChange={(e) => setCourse({ ...course, isPublished: e.target.checked })}
                className='w-5 h-5 border-2 border-border rounded accent-primary'
              />
              <label htmlFor='publish-course' className='text-sm font-semibold text-foreground cursor-pointer'>
                Publish this course
              </label>
            </div>
            <div className='flex gap-3 pt-4'>
              <button
                onClick={handleSaveCourse}
                className='px-6 py-2 bg-primary text-primary-foreground border-2 border-primary font-semibold hover:bg-primary/90 transition'
              >
                Save Course
              </button>
              {!isNew && (
                <button
                  onClick={handleDeleteCourse}
                  className='px-6 py-2 bg-white text-destructive border-2 border-destructive font-semibold hover:bg-destructive/10 transition'
                >
                  Delete Course
                </button>
              )}
            </div>
          </div>
        </div>

        {!isNew && (
          <>
            {/* Modules Section */}
            <div className='border-2 border-border bg-white p-6'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-semibold text-foreground'>Modules</h2>
                <button
                  onClick={() => setShowModuleForm(!showModuleForm)}
                  className='px-4 py-2 bg-primary text-primary-foreground border-2 border-primary font-semibold hover:bg-primary/90 transition'
                >
                  Add Module
                </button>
              </div>

              {showModuleForm && <ModuleForm onSubmit={handleAddModule} onCancel={() => setShowModuleForm(false)} />}

              {course.modules && course.modules.length > 0 ? (
                <div className='space-y-4'>
                  {course.modules.map((mod: any) => (
                    <ModuleItem key={mod.id} module={mod} courseId={courseId} />
                  ))}
                </div>
              ) : (
                <p className='text-muted-foreground'>No modules yet. Add one to get started.</p>
              )}
            </div>
          </>
        )}

        <div className='mt-8'>
          <Link href='/admin/courses' className='text-primary hover:text-primary/80 font-semibold'>
            ← Back to Courses
          </Link>
        </div>
      </main>
    </div>
  );
}

function ModuleForm({ onSubmit, onCancel }: { onSubmit: (title: string, desc: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className='border-2 border-border bg-secondary p-4 mb-4'>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-semibold text-foreground mb-2'>Module Title</label>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='w-full px-4 py-2 border-2 border-border rounded focus:border-primary focus:outline-none'
            placeholder='Module title'
          />
        </div>
        <div>
          <label className='block text-sm font-semibold text-foreground mb-2'>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className='w-full px-4 py-2 border-2 border-border rounded focus:border-primary focus:outline-none'
            placeholder='Module description'
            rows={3}
          />
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => onSubmit(title, description)}
            className='px-4 py-2 bg-primary text-primary-foreground border-2 border-primary font-semibold hover:bg-primary/90'
          >
            Create Module
          </button>
          <button onClick={onCancel} className='px-4 py-2 bg-secondary text-foreground border-2 border-border font-semibold hover:bg-muted'>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ModuleItem({ module, courseId }: { module: any; courseId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showPdfForm, setShowPdfForm] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  const handleAddVideo = async () => {
    if (!videoTitle || !videoUrl) {
      alert('Please enter video title and URL');
      return;
    }
    const result = await createVideo(module.id, {
      title: videoTitle,
      url: videoUrl,
      order: (module.videos?.length || 0) + 1,
    });
    if (result.success) {
      alert('Video added successfully!');
      setVideoTitle('');
      setVideoUrl('');
      setShowVideoForm(false);
      window.location.reload();
    }
  };

  const handleAddPdf = async () => {
    if (!pdfTitle || !pdfUrl) {
      alert('Please enter PDF title and URL');
      return;
    }
    const result = await createPdf(module.id, {
      title: pdfTitle,
      url: pdfUrl,
      order: (module.pdfs?.length || 0) + 1,
    });
    if (result.success) {
      alert('PDF added successfully!');
      setPdfTitle('');
      setPdfUrl('');
      setShowPdfForm(false);
      window.location.reload();
    }
  };

  return (
    <div className='border-2 border-border bg-white p-4'>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='w-full text-left flex justify-between items-center'
      >
        <div>
          <h3 className='font-semibold text-foreground'>{module.title}</h3>
          {module.description && <p className='text-sm text-muted-foreground mt-1'>{module.description}</p>}
        </div>
        <span className='text-muted-foreground'>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className='mt-4 space-y-5 pt-4 border-t-2 border-border'>
          {/* Videos Section */}
          <div>
            <div className='flex justify-between items-center mb-3'>
              <h4 className='font-semibold text-foreground'>Videos ({module.videos?.length || 0})</h4>
              <button
                onClick={() => setShowVideoForm(!showVideoForm)}
                className='px-3 py-1 text-sm bg-primary text-primary-foreground border border-primary rounded hover:bg-primary/90'
              >
                {showVideoForm ? 'Cancel' : 'Add Video'}
              </button>
            </div>

            {showVideoForm && (
              <div className='border-2 border-border bg-secondary p-3 mb-3 space-y-3'>
                <input
                  type='text'
                  placeholder='Video title'
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className='w-full px-3 py-2 border-2 border-border rounded text-sm focus:border-primary focus:outline-none'
                />
                <FileOrUrlInput
                  value={videoUrl}
                  onChange={setVideoUrl}
                  fileType='video'
                  placeholder='Video URL (YouTube, Vimeo, etc.)'
                />
                <button
                  onClick={handleAddVideo}
                  className='w-full px-3 py-2 bg-primary text-primary-foreground text-sm border-2 border-primary font-semibold rounded hover:bg-primary/90'
                >
                  Add Video
                </button>
              </div>
            )}

            {module.videos && module.videos.length > 0 ? (
              <div className='space-y-2'>
                {module.videos.map((vid: any) => (
                  <div key={vid.id} className='flex justify-between items-center p-3 border-2 border-border bg-secondary rounded'>
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-foreground'>{vid.title}</p>
                      <p className='text-xs text-muted-foreground truncate'>{vid.url}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-xs text-muted-foreground italic'>No videos added yet</p>
            )}
          </div>

          {/* PDFs Section */}
          <div className='pt-4'>
            <div className='flex justify-between items-center mb-3'>
              <h4 className='font-semibold text-foreground'>PDFs ({module.pdfs?.length || 0})</h4>
              <button
                onClick={() => setShowPdfForm(!showPdfForm)}
                className='px-3 py-1 text-sm bg-primary text-primary-foreground border border-primary rounded hover:bg-primary/90'
              >
                {showPdfForm ? 'Cancel' : 'Add PDF'}
              </button>
            </div>

            {showPdfForm && (
              <div className='border-2 border-border bg-secondary p-3 mb-3 space-y-3'>
                <input
                  type='text'
                  placeholder='PDF title'
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className='w-full px-3 py-2 border-2 border-border rounded text-sm focus:border-primary focus:outline-none'
                />
                <FileOrUrlInput
                  value={pdfUrl}
                  onChange={setPdfUrl}
                  fileType='pdf'
                  placeholder='PDF URL'
                />
                <button
                  onClick={handleAddPdf}
                  className='w-full px-3 py-2 bg-primary text-primary-foreground text-sm border-2 border-primary font-semibold rounded hover:bg-primary/90'
                >
                  Add PDF
                </button>
              </div>
            )}

            {module.pdfs && module.pdfs.length > 0 ? (
              <div className='space-y-2'>
                {module.pdfs.map((p: any) => (
                  <div key={p.id} className='flex justify-between items-center p-3 border-2 border-border bg-secondary rounded'>
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-foreground'>{p.title}</p>
                      <p className='text-xs text-muted-foreground truncate'>{p.url}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-xs text-muted-foreground italic'>No PDFs added yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
