import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { facingMode = 'user', width = 640, height = 480 } = options;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsActive(false);
    isStartingRef.current = false;
  }, []);

  const startCamera = useCallback(async () => {
    // Prevent multiple simultaneous start attempts
    if (isStartingRef.current || isActive) {
      return;
    }
    
    isStartingRef.current = true;
    setError(null);
    
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for the video to be ready before playing
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element not found'));
            return;
          }
          
          const handleCanPlay = () => {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            resolve();
          };
          
          const handleError = () => {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            reject(new Error('Video failed to load'));
          };
          
          video.addEventListener('canplay', handleCanPlay);
          video.addEventListener('error', handleError);
          
          // If already ready, resolve immediately
          if (video.readyState >= 3) {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            resolve();
          }
        });
        
        await videoRef.current.play();
      }
      
      setIsActive(true);
      isStartingRef.current = false;
    } catch (err) {
      isStartingRef.current = false;
      console.error('Camera access error:', err);
      
      if (err instanceof Error) {
        // Ignore AbortError as it's usually from rapid start/stop cycles
        if (err.name === 'AbortError') {
          return;
        }
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('ক্যামেরা অ্যাক্সেস অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংস থেকে অনুমতি দিন।');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('কোনো ক্যামেরা খুঁজে পাওয়া যায়নি।');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          setError('ক্যামেরা অন্য অ্যাপ্লিকেশন ব্যবহার করছে।');
        } else {
          setError('ক্যামেরা চালু করতে সমস্যা হয়েছে।');
        }
      } else {
        setError('ক্যামেরা চালু করতে সমস্যা হয়েছে।');
      }
      
      setIsActive(false);
    }
  }, [facingMode, width, height, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    isActive,
    error,
    startCamera,
    stopCamera,
  };
}
