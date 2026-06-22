'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCourseById, getUserProgress, updateProgress } from '@/app/actions/courses';
import { convertBlobUrlToApiUrl } from '@/lib/blob-url';
import { getPlaybackUrl, getVideoPreviewInfo } from '@/lib/video-url';
import ReactPlayer from 'react-player';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, Play } from 'lucide-react';

export default function LearningPage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [currentContentType, setCurrentContentType] = useState<'video' | 'pdf' | null>(null);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseData = async () => {
      const resolvedParams = await params;
      setCourseId(resolvedParams.courseId);
      const courseResult = await getCourseById(resolvedParams.courseId);
      if (courseResult.success) {
        setCourse(courseResult.data);
        setCurrentModuleId(courseResult.data.modules[0]?.id || null);

        const progressResult = await getUserProgress(resolvedParams.courseId);
        if (progressResult.success) {
          setProgress(progressResult.data);
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
  }, [params, router]);

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

  const toggleModuleExpanded = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
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
      <div className='min-h-screen bg-background flex items-center justify-center px-4'>
        <div className='text-center max-w-md border-2 border-border bg-white p-8 rounded'>
          <h2 className='text-2xl font-semibold text-foreground mb-2'>Course Not Found</h2>
          <p className='text-muted-foreground mb-6'>The course you are looking for does not exist, or you need to be enrolled or logged in to view it.</p>
          <div className='flex flex-col gap-3'>
            <Link
              href='/sign-in'
              className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-primary rounded hover:bg-primary/90 transition-colors font-medium'
            >
              Sign In
            </Link>
            <Link
              href='/dashboard'
              className='inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-foreground border-2 border-border rounded hover:bg-secondary transition-colors font-medium'
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentModule = course.modules.find((m: any) => m.id === currentModuleId);
  const currentContent = currentModule
    ? currentContentType === 'video'
      ? currentModule.videos.find((v: any) => v.id === currentContentId)
      : currentModule.pdfs.find((p: any) => p.id === currentContentId)
    : null;

  const currentVideo = currentModule?.videos.find((v: any) => v.id === currentContentId);

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b-2 border-border bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center'>
          <Link
            href='/dashboard'
            className='inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium'
          >
            <ArrowLeft size={16} />
            Back to Courses
          </Link>
          <h1 className='text-lg font-semibold text-foreground flex-1 text-center'>{course.title}</h1>
          <div className='w-24'></div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Video Player and Content */}
          <div className='lg:col-span-2'>
            <div className='border-2 border-border bg-white rounded overflow-hidden'>
              {/* Video Player */}
              {currentContentType === 'video' && currentVideo ? (
                <div className='bg-black aspect-video'>
                  <ReactPlayer
                    url={getPlaybackUrl(currentVideo.url, currentVideo.youtubeUrl)}
                    controls
                    width='100%'
                    height='100%'
                    onProgress={handleVideoProgress}
                    progressInterval={5000}
                    playing={false}
                    config={{
                      youtube: {
                        playerVars: {
                          controls: 1,
                          modestbranding: 1,
                          rel: 0,
                          showinfo: 0,
                        },
                      },
                      file: {
                        attributes: {
                          controlsList: 'nodownload',
                          poster: course.thumbnail,
                        },
                      },
                    }}
                  />
                </div>
              ) : currentContentType === 'pdf' && currentContent ? (
                <div className='p-8 bg-white flex flex-col items-center justify-center min-h-96'>
                  <div className='text-5xl mb-4'>📄</div>
                  <p className='text-lg font-semibold text-foreground mb-2'>{currentContent.title}</p>
                  <p className='text-muted-foreground mb-6'>PDF Document</p>
                  <div className='flex gap-4'>
                    <a
                      href={getPlaybackUrl(currentContent.url, currentContent.youtubeUrl)}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='px-6 py-3 bg-primary text-primary-foreground border-2 border-primary font-semibold hover:bg-primary/90 transition-colors'
                    >
                      View PDF
                    </a>
                    <a
                      href={getPlaybackUrl(currentContent.url, currentContent.youtubeUrl)}
                      download
                      className='px-6 py-3 bg-white text-foreground border-2 border-border font-semibold hover:bg-secondary transition-colors'
                    >
                      Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className='p-8 bg-secondary text-center min-h-96 flex items-center justify-center'>
                  <p className='text-lg text-muted-foreground'>Select a video or document to view</p>
                </div>
              )}
            </div>

            {/* Content Info */}
            {currentContent && (
              <div className='mt-6 border-2 border-border bg-white p-6 rounded'>
                <h2 className='text-2xl font-semibold text-foreground mb-2'>{currentContent.title}</h2>
                <p className='text-muted-foreground'>
                  {currentContentType === 'video' ? 'Video' : 'PDF Document'}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Course Navigation */}
          <div className='lg:col-span-1'>
            <div className='sticky top-6 border-2 border-border bg-white rounded overflow-hidden'>
              {/* Module List */}
              <div className='p-0'>
                <div className='px-6 py-4 border-b-2 border-border bg-secondary'>
                  <h3 className='font-semibold text-foreground text-lg'>Course Content</h3>
                  <p className='text-xs text-muted-foreground mt-1'>{course.modules.length} modules</p>
                </div>

                <div className='divide-y-2 divide-border'>
                  {course.modules.map((module: any, index: number) => {
                    const isExpanded = expandedModules.has(module.id);
                    const isActive = currentModuleId === module.id;

                    return (
                      <div key={module.id}>
                        <button
                          onClick={() => {
                            handleSelectModule(module.id);
                            toggleModuleExpanded(module.id);
                          }}
                          className={`w-full px-6 py-4 text-left transition-colors flex justify-between items-center ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-secondary text-foreground'
                          }`}
                        >
                          <div className='flex-1'>
                            <div className='font-semibold text-sm'>
                              Module {index + 1}: {module.title}
                            </div>
                            <p className='text-xs opacity-75 mt-1'>
                              {module.videos.length} video{module.videos.length !== 1 ? 's' : ''} •{' '}
                              {module.pdfs.length} resource{module.pdfs.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={18} className='ml-2' />
                          ) : (
                            <ChevronDown size={18} className='ml-2' />
                          )}
                        </button>

                        {/* Module Content */}
                        {isExpanded && (
                          <div className='bg-secondary border-t-2 border-border'>
                            {/* Videos */}
                            {module.videos.length > 0 && (
                              <div className='px-6 py-4 border-b border-border'>
                                <p className='text-xs font-semibold text-foreground uppercase mb-3 text-muted-foreground'>
                                  Videos
                                </p>
                                <div className='space-y-2'>
                                  {module.videos.map((video: any, idx: number) => (
                                    <button
                                      key={video.id}
                                      onClick={() => handleSelectVideo(video.id)}
                                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                                        currentContentId === video.id
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-white text-foreground border border-border hover:border-primary'
                                      }`}
                                    >
                                      <div className='flex items-center gap-2'>
                                        <span className='text-xs opacity-70'>▶</span>
                                        <span className='truncate'>Video {idx + 1}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* PDFs */}
                            {module.pdfs.length > 0 && (
                              <div className='px-6 py-4'>
                                <p className='text-xs font-semibold text-foreground uppercase mb-3 text-muted-foreground'>
                                  Resources
                                </p>
                                <div className='space-y-2'>
                                  {module.pdfs.map((pdf: any, idx: number) => (
                                    <button
                                      key={pdf.id}
                                      onClick={() => handleSelectPdf(pdf.id)}
                                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
                                        currentContentId === pdf.id
                                          ? 'bg-primary text-primary-foreground'
                                          : 'bg-white text-foreground border border-border hover:border-primary'
                                      }`}
                                    >
                                      <div className='flex items-center gap-2'>
                                        <span className='text-xs opacity-70'>📄</span>
                                        <span className='truncate'>Resource {idx + 1}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
