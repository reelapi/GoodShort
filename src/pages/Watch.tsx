import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Hls from 'hls.js';
import { useBookDetail, useVideos, usePlay } from '../hooks/useDramas';

const QUALITIES = ['1080p', '720p', '540p'];

const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [quality, setQuality] = useState('720p');
  const [showQuality, setShowQuality] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const { book, loading: bookLoading } = useBookDetail(id);
  const { videos, loading: videosLoading } = useVideos(id);
  const { playData, loadVideo } = usePlay();

  useEffect(() => {
    if (id && videos[currentEpisode]) {
      loadVideo(id, videos[currentEpisode].id, quality);
    }
  }, [id, videos, currentEpisode, quality, loadVideo]);

  useEffect(() => {
    if (!videoRef.current || !playData?.m3u8) return;

    const video = videoRef.current;
    const videoUrl = `/api/video?url=${encodeURIComponent(playData.m3u8)}&keyData=${encodeURIComponent(playData.keyData)}`;

    if (hlsRef.current) hlsRef.current.destroy();

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      video.addEventListener('loadedmetadata', () => video.play().catch(() => {}));
    }

    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, [playData]);

  const handleEpisodeChange = (ep: number) => setCurrentEpisode(ep);
  const handlePrevious = () => { if (currentEpisode > 0) setCurrentEpisode(currentEpisode - 1); };
  const handleNext = () => { if (currentEpisode < videos.length - 1) setCurrentEpisode(currentEpisode + 1); };

  if (bookLoading || videosLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Drama not found</p>
          <button onClick={() => navigate('/')} className="btn-primary">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-4 py-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-zinc-300 hover:text-white">
            <ArrowLeft size={20} /> <span className="font-medium">Back</span>
          </button>
        </div>

        <div className="relative bg-black aspect-[9/16]">
          {playData?.m3u8 ? (
            <video ref={videoRef} className="w-full h-full" controls playsInline onEnded={handleNext} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          <div className="absolute top-3 right-3 z-20">
            <button onClick={() => setShowQuality(!showQuality)} className="bg-black/60 text-white text-xs px-2 py-1 rounded font-medium">{quality}</button>
            {showQuality && (
              <div className="absolute right-0 mt-1 bg-zinc-900 rounded-lg overflow-hidden shadow-lg">
                {QUALITIES.map(q => (
                  <button key={q} onClick={() => { setQuality(q); setShowQuality(false); }} className={`block w-full px-4 py-2 text-sm text-left ${quality === q ? 'bg-red-500 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}>{q}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <h2 className="text-lg font-bold mb-2">{book.bookName}</h2>
            <span className="text-sm text-zinc-400">Episode {currentEpisode + 1} of {videos.length}</span>
            {book.introduction && <p className="text-sm text-zinc-300 mt-2 line-clamp-3">{book.introduction}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handlePrevious} disabled={currentEpisode === 0} className="flex-1 bg-zinc-800 text-white py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              <ChevronLeft size={20} /> Previous
            </button>
            <button onClick={handleNext} disabled={currentEpisode === videos.length - 1} className="flex-1 btn-primary py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              Next <ChevronRight size={20} />
            </button>
          </div>

          <div>
            <h3 className="font-semibold mb-3">All Episodes</h3>
            <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
              {videos.map((_, i) => (
                <button key={i} onClick={() => handleEpisodeChange(i)} className={`aspect-square rounded-lg text-sm font-medium transition-all ${currentEpisode === i ? 'bg-red-500 text-white scale-105' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
