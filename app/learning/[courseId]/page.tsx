'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCourseById, getUserProgress, updateProgress } from '@/app/actions/courses';
import ReactPlayer from 'react-player';
import { Document, Page as PDFPage } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

export default function LearningPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [currentContentType, setCurrentContentType] = useState<'video' | 'pdf' | null>(null);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfPages, setPdfPages] = useState(0);

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
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg text-gray-600'>Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg text-gray-600'>Course not found</div>
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
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow sticky top-0 z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center'>
          <button
            onClick={() => router.push('/dashboard')}
            className='text-blue-600 hover:text-blue-700 font-semibold'
          >
            ← Back to Dashboard
          </button>
          <h1 className='text-xl font-bold text-gray-900'>{course.title}</h1>
          <div></div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Sidebar - Modules List */}
        <aside className='lg:col-span-1'>
          <div className='bg-white rounded-lg shadow p-4 sticky top-24'>
            <h2 className='font-bold text-lg text-gray-900 mb-4'>Course Modules</h2>
            <div className='space-y-2'>
              {course.modules.map((module: any) => {
                const moduleProgress = progress.find((p: any) => p.moduleId === module.id);
                const isCompleted = moduleProgress?.isModuleCompleted;
                return (
                  <button
                    key={module.id}
                    onClick={() => handleSelectModule(module.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      currentModuleId === module.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='truncate'>
                        <p className='font-semibold text-sm'>{module.title}</p>
                      </div>
                      {isCompleted && <span className='text-green-500 text-lg'>✓</span>}
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
              {/* Module Title */}
              <div>
                <h2 className='text-3xl font-bold text-gray-900'>{currentModule.title}</h2>
                {currentModule.description && (
                  <p className='text-gray-600 mt-2'>{currentModule.description}</p>
                )}
              </div>

              {/* Content Viewer */}
              <div className='bg-white rounded-lg shadow overflow-hidden'>
                {currentContentType === 'video' && currentContent ? (
                  <div className='bg-black relative'>
                    <ReactPlayer
                      url={currentContent.url}
                      controls
                      width='100%'
                      height='500px'
                      onProgress={handleVideoProgress}
                      progressInterval={5000}
                      playing={false}
                    />
                  </div>
                ) : currentContentType === 'pdf' && currentContent ? (
                  <div className='p-4'>
                    <Document file={currentContent.url} onLoadSuccess={({ numPages }) => setPdfPages(numPages)}>
                      {Array.from(new Array(pdfPages), (el, index) => (
                        <PDFPage key={`page_${index + 1}`} pageNumber={index + 1} />
                      ))}
                    </Document>
                    <a
                      href={currentContent.url}
                      download
                      className='mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                    >
                      Download PDF
                    </a>
                  </div>
                ) : (
                  <div className='p-8 text-center text-gray-600'>No content available</div>
                )}
              </div>

              {/* Content Navigation */}
              <div className='bg-white rounded-lg shadow p-4'>
                <h3 className='font-semibold text-gray-900 mb-4'>Module Content</h3>
                <div className='space-y-2'>
                  {currentModule.videos.length > 0 && (
                    <div>
                      <p className='text-sm font-semibold text-gray-700 mb-2'>Videos</p>
                      <div className='space-y-2'>
                        {currentModule.videos.map((video: any) => (
                          <button
                            key={video.id}
                            onClick={() => handleSelectVideo(video.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                              currentContentId === video.id
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            🎬 {video.title}
                            {video.duration && <span className='text-xs text-gray-500 ml-2'>({video.duration}s)</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentModule.pdfs.length > 0 && (
                    <div>
                      <p className='text-sm font-semibold text-gray-700 mb-2'>Documents</p>
                      <div className='space-y-2'>
                        {currentModule.pdfs.map((pdf: any) => (
                          <button
                            key={pdf.id}
                            onClick={() => handleSelectPdf(pdf.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                              currentContentId === pdf.id
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            📄 {pdf.title}
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
