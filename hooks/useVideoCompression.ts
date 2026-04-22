'use client';

import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface CompressionResult {
  compressedFile: File;
  thumbnailFile: File | null;
  originalSize: number;
  compressedSize: number;
  ratio: number; // percentage saved
}

/**
 * useVideoCompression
 * 
 * Township-resilient client-side video compression using FFmpeg.wasm.
 * - Compresses to H.264/AAC at 720p, CRF 28 (good quality/size balance).
 * - Extracts a thumbnail at 2 seconds for feed previews.
 * - Detects slow devices and offers a CRF 32/480p fallback.
 * - 45-second timeout protection to prevent UI lockup on low-end Android.
 */
export function useVideoCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const ffmpegRef = useRef<FFmpeg | null>(null);

  /** Lazy-load the FFmpeg WASM core (one-time, cached after first load) */
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    setStatus('Loading compressor (one-time, ~5MB)...');
    const ffmpeg = new FFmpeg();

    ffmpeg.on('progress', ({ progress: p }) => {
      setProgress(Math.max(0, Math.min(99, Math.round(p * 100))));
    });

    // @ffmpeg/ffmpeg v0.12 — load config uses classWorkers with toBlobURL
    // corePath → coreURL, wasmPath → wasmURL
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  }, []);

  /**
   * Determine encoding preset based on device capability.
   * Uses hardwareConcurrency as a rough proxy for CPU speed.
   * Low-end devices (<=2 cores) → 480p + CRF 32 for faster encode.
   * Higher-end devices → 720p + CRF 28 for better quality.
   */
  const getPreset = (): { scale: string; crf: string } => {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 4 : 4;
    if (cores <= 2) {
      return { scale: 'scale=854:-2', crf: '32' }; // 480p, faster
    }
    return { scale: 'scale=1280:-2', crf: '28' }; // 720p, balanced
  };

  const compressVideo = useCallback(async (
    inputFile: File,
    onTimeout?: () => void
  ): Promise<CompressionResult> => {
    setIsCompressing(true);
    setProgress(0);
    setStatus('Preparing compressor for low-bandwidth networks...');

    // 45-second timeout guard for low-end devices
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      onTimeout?.();
    }, 45_000);

    try {
      const ffmpeg = await loadFFmpeg();

      if (timedOut) throw new Error('TIMEOUT');

      const inputName = 'input.mp4';
      const outputName = 'output.mp4';
      const thumbName = 'thumb.jpg';
      const { scale, crf } = getPreset();

      setStatus(`Compressing for low-data networks (${crf === '32' ? '480p' : '720p'})...`);
      await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

      if (timedOut) throw new Error('TIMEOUT');

      // Single-pass compression: H.264 + AAC + web-faststart
      // Hard cap at 180 seconds to protect platform storage
      await ffmpeg.exec([
        '-i', inputName,
        '-t', '180',
        '-c:v', 'libx264',
        '-crf', crf,
        '-preset', 'medium',
        '-vf', scale,
        '-b:v', crf === '32' ? '800k' : '2500k',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputName,
      ]);

      if (timedOut) throw new Error('TIMEOUT');

      // Extract thumbnail at 2 seconds
      setStatus('Generating thumbnail...');
      await ffmpeg.exec([
        '-i', outputName,
        '-ss', '00:00:02',
        '-vframes', '1',
        '-q:v', '2',
        thumbName,
      ]);

      const compressedData = await ffmpeg.readFile(outputName);
      const thumbData = await ffmpeg.readFile(thumbName);

      const compressedBlob = new Blob([compressedData as unknown as ArrayBuffer], { type: 'video/mp4' });
      const thumbBlob = new Blob([thumbData as unknown as ArrayBuffer], { type: 'image/jpeg' });

      const originalName = inputFile.name.replace(/\.[^.]+$/, '');
      const compressedFile = new File([compressedBlob], `${originalName}_compressed.mp4`, { type: 'video/mp4' });
      const thumbnailFile = new File([thumbBlob], `${originalName}_thumb.jpg`, { type: 'image/jpeg' });

      const ratio = Math.round(((inputFile.size - compressedFile.size) / inputFile.size) * 100);

      return {
        compressedFile,
        thumbnailFile,
        originalSize: inputFile.size,
        compressedSize: compressedFile.size,
        ratio: Math.max(0, ratio),
      };

    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
        throw new Error('TIMEOUT');
      }
      console.error('[useVideoCompression]', err);
      throw new Error('Compression failed. Please try a shorter clip or use raw upload.');
    } finally {
      clearTimeout(timeoutId);
      setIsCompressing(false);
      setProgress(100);
      setStatus('');
    }
  }, [loadFFmpeg]);

  const trimVideo = useCallback(async (
    inputFile: File,
    startTime: number,
    duration: number,
    audioTrackUrl?: string
  ): Promise<File> => {
    setIsCompressing(true);
    setProgress(0);
    setStatus('Processing your vibe check...');

    try {
      const ffmpeg = await loadFFmpeg();
      const inputName = 'input_raw.mp4';
      const outputName = 'trimmed.mp4';
      
      await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

      const args = [
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-i', inputName,
      ];

      if (audioTrackUrl) {
        setStatus('Layering sound protocols...');
        const audioName = 'audio.mp3';
        const fetchedAudio = await fetchFile(audioTrackUrl);
        await ffmpeg.writeFile(audioName, fetchedAudio);
        
        args.push('-i', audioName);
        args.push('-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-shortest');
      } else {
        args.push('-c', 'copy');
      }

      args.push(outputName);

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data as any], { type: 'video/mp4' });
      return new File([blob], `trimmed_${Date.now()}.mp4`, { type: 'video/mp4' });

    } catch (err) {
      console.error('[trimVideo]', err);
      throw new Error('Video processing failed. Profile mismatch.');
    } finally {
      setIsCompressing(false);
      setStatus('');
    }
  }, [loadFFmpeg]);

  return { compressVideo, trimVideo, isCompressing, progress, status };
}
