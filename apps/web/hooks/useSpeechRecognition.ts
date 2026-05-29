'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Thin wrapper around the Web Speech API. Returns a streaming transcript that
 * appends final segments and shows interim text live. Gracefully no-op'd in
 * unsupported browsers.
 */
export function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const recRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Rec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!Rec) return;
    setSupported(true);
    const r = new Rec();
    r.continuous = true;
    r.interimResults = true;
    r.lang = navigator.language || 'en-US';
    r.onresult = (e: any) => {
      let inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const segment = e.results[i][0].transcript;
        if (e.results[i].isFinal) setTranscript((prev) => (prev ? prev + ' ' : '') + segment.trim());
        else inter += segment;
      }
      setInterim(inter);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r;
  }, []);

  function start() {
    if (!recRef.current || listening) return;
    setListening(true); setInterim('');
    try { recRef.current.start(); } catch { /* already started */ }
  }
  function stop() {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch { /* noop */ }
    setListening(false);
  }
  function reset() { setTranscript(''); setInterim(''); }

  return { supported, listening, transcript, interim, start, stop, reset, setTranscript };
}
