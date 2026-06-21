'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCourseById, getUserProgress, updateProgress } from '@/app/actions/courses';
import ReactPlayer from 'react-player';

export default function LearningPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [currentContentType, setCurrentContentType] = useState<'video' | 'pdf' | null>(null);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourseData = async () => {
      const courseResult = await getCourseById(params.courseId);
      if (courseResult.success) {
        setCourse(courseResult.data);
        setCurrentModuleId(courseResult.data.modules[0]?.id || null);

        const progressResult = await getUserProgress(params.courseId);
        if (progressResult.success) {
          setProgress(progressResult.data);
          // Set current content from last progress
          if (progressResult.data.length > 0) {
            const lastProgress = progressResult.data[progressResult.data.length - 1];
            setCurrentModuleId(lastProgress.moduleId);
            if (lastProgress.videoId) {
              setCurrentContentType('video');
              setCurrentContentId(lastProgress.videoId);
            }
          }
        }
      } else {
        router.push('/dashboard');
      }
      setLoading(false);
    };

    loadCourseData();
  }, [params.courseId, router]);

  const handleVideoProgress = async (state: any) => {
    if (currentModuleId && currentContentId) {
      const seconds = Math.floor(state.playedSeconds);
      await updateProgress(params.courseId, currentModuleId, currentContentId, seconds);
    }
  };

  const handleSelectModule = (moduleId: string) => {
    setCurrentModuleId(moduleId);
    const module = course.modules.find((m: any) => m.id === moduleId);
    if (module) {
      if (module.videos.length > 0) {
        setCurrentContentType('video');
        setCurrentContentId(module.videos[0].id);
      } else if (module.pdfs.length > 0) {
        setCurrentContentType('pdf');
        setCurrentContentId(module.pdfs[0].id);
      }
    }
  };

  const handleSelectVideo = (videoId: string) => {
    setCurrentContentType('video');
    setCurrentContentId(videoId);
  };

  const handleSelectPdf = (pdfId: string) => {
    setCurrentContentType('pdf');
    setCurrentContentId(pdfId);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center max-w-md'>
          <h2 className='text-2xl font-semibold text-foreground mb-2'>Course Not Found</h2>
          <p className='text-muted-foreground mb-6'>The course you are looking for does not exist or you are not enrolled.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentModule = course.modules.find((m: any) => m.id === currentModuleId);
  let currentContent: any = null;

  if (currentContentType === 'video' && currentModule) {
    currentContent = currentModule.videos.find((v: any) => v.id === currentContentId);
  } else if (currentContentType === 'pdf' && currentModule) {
    currentContent = currentModule.pdfs.find((p: any) => p.id === currentContentId);
  }

  const currentProgress = progress.find((p: any) => p.moduleId === currentModuleId);

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b border-border bg-card sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center'>
          <button
            onClick={() => router.push('/dashboard')}
            className='text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2 transition-colors'
          >
            ← Back to Dashboard
          </button>
          <h1 className='text-lg font-semibold text-foreground'>{course.title}</h1>
          <div className='text-sm text-muted-foreground'>{course.modules.length} modules</div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Sidebar - Modules List */}
        <aside className='lg:col-span-1'>
          <div className='bg-card border border-border rounded-lg p-4 sticky top-24 max-h-[calc(100vh-200px)] overflow-y-auto'>
            <h2 className='font-semibold text-lg text-foreground mb-4'>Modules</h2>
            <div className='space-y-2'>
              {course.modules.map((module: any, index: number) => {
                const moduleProgress = progress.find((p: any) => p.moduleId === module.id);
                const isCompleted = moduleProgress?.isModuleCompleted;
                const isActive = currentModuleId === module.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => handleSelectModule(module.id)}
                    className={`w-full text-left px-3 py-3 rounded-md transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-sm truncate'>{index + 1}. {module.title}</p>
                      </div>
                      {isCompleted && <span className='text-lg flex-shrink-0'>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className='lg:col-span-3 space-y-6'>
          {currentModule && (
            <>
              {/* Module Title and Description */}
              <div>
                <h2 className='text-3xl font-semibold text-foreground'>{currentModule.title}</h2>
                {currentModule.description && (
                  <p className='text-muted-foreground mt-2 leading-relaxed'>{currentModule.description}</p>
                )}
              </div>

              {/* Content Viewer */}
              <div className='bg-card border border-border rounded-lg overflow-hidden'>
                {currentContentType === 'video' && currentContent ? (
                  <div className='bg-black relative aspect-video'>
                    <ReactPlayer
                      url={currentContent.url}
                      controls
                      width='100%'
                      height='100%'
                      onProgress={handleVideoProgress}
                      progressInterval={5000}
                      playing={false}
                    />
                  </div>
                ) : currentContentType === 'pdf' && currentContent ? (
                  <div className='p-8 bg-card flex flex-col items-center justify-center min-h-96'>
                    <div className='text-5xl mb-4'>📄</div>
                    <p className='text-lg font-semibold text-foreground mb-2'>{currentContent.title}</p>
                    <p className='text-muted-foreground mb-6 text-center'>PDF Document</p>
                    <div className='flex gap-4'>
                      <a
                        href={currentContent.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors'
                      >
                        View PDF
                      </a>
                      <a
                        href={currentContent.url}
                        download
                        className='px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 font-medium transition-colors'
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className='p-8 text-center text-muted-foreground'>
                    <p className='text-lg'>Select a video or document to view</p>
                  </div>
                )}
              </div>

              {/* Content Navigation */}
              <div className='bg-card border border-border rounded-lg p-6'>
                <h3 className='font-semibold text-lg text-foreground mb-6'>Module Content</h3>
                <div className='space-y-6'>
                  {currentModule.videos.length > 0 && (
                    <div>
                      <p className='text-sm font-semibold text-foreground mb-3'>Videos ({currentModule.videos.length})</p>
                      <div className='space-y-2'>
                        {currentModule.videos.map((video: any, idx: number) => (
                          <button
                            key={video.id}
                            onClick={() => handleSelectVideo(video.id)}
                            className={`w-full text-left px-4 py-3 rounded-md transition text-sm font-medium ${
                              currentContentId === video.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground hover:bg-muted/80'
                            }`}
                          >
                            <div className='flex items-center gap-3'>
                              <span className='text-xs opacity-75'>Video {idx + 1}</span>
                              <span className='truncate'>{video.title}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentModule.pdfs.length > 0 && (
                    <div className={currentModule.videos.length > 0 ? 'border-t border-border pt-6' : ''}>
                      <p className='text-sm font-semibold text-foreground mb-3'>Resources ({currentModule.pdfs.length})</p>
                      <div className='space-y-2'>
                        {currentModule.pdfs.map((pdf: any, idx: number) => (
                          <button
                            key={pdf.id}
                            onClick={() => handleSelectPdf(pdf.id)}
                            className={`w-full text-left px-4 py-3 rounded-md transition text-sm font-medium ${
                              currentContentId === pdf.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground hover:bg-muted/80'
                            }`}
                          >
                            <div className='flex items-center gap-3'>
                              <span className='text-xs opacity-75'>PDF {idx + 1}</span>
                              <span className='truncate'>{pdf.title}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
