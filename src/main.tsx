import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Bot, Brain, Mic, MicOff, FileText, Building2, Image as ImageIcon, Library, BarChart3,
  NotebookPen, ShieldCheck, PlayCircle, Home, Search, Bell, Plus, X, Briefcase, LayoutDashboard,
  Code2, Database, Workflow, UserRound, Upload, Sparkles, Timer, Radio, Send,
  PlusCircle, Copy, Save, Camera, Pause, Pin, Minimize2, Maximize2, Move,
  SlidersHorizontal, CheckCircle2, Crown, Zap, Target, Layers, ScreenShare, AlertCircle, ExternalLink,
  Volume2, VolumeX, Activity, MonitorSpeaker, HelpCircle, ChevronDown, ChevronUp, ChevronRight, Cpu,
  Laptop, Globe, ArrowRight, PlayCircle as MonitorPlay
} from 'lucide-react';
import './styles/globals.css';
import { signInWithGoogle, logOut, type AppUser, isFirebaseConfigured } from './firebase';


export function getCurrentUserKeys() {
  try {
    const savedUser = localStorage.getItem('logged-in-user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      const id = u.id || u.uid;
      if (id) {
        return {
          userId: id,
          userEmail: u.email,
          userName: u.displayName || u.name,
          userPhoto: u.photoURL,
          resumesKey: `user-resumes-${id}`,
          docsKey: `user-documents-${id}`,
          promptsKey: `user-prompts-${id}`,
          sessionsKey: `user-recent-sessions-${id}`
        };
      }
    }
  } catch (e) {
    console.error("Error parsing logged-in-user:", e);
  }
  return {
    userId: '',
    userEmail: '',
    userName: '',
    userPhoto: '',
    resumesKey: 'user-resumes',
    docsKey: 'user-documents',
    promptsKey: 'user-prompts',
    sessionsKey: 'user-recent-sessions'
  };
}

type Screen =
  | 'Landing'
  | 'Login'
  | 'Dashboard'
  | 'Live Session'
  | 'Mock Interview'
  | 'Recent Sessions'
  | 'Session Summary'
  | 'Session Replay'
  | 'Resume Intelligence'
  | 'Company Intelligence'
  | 'Screenshot Lab'
  | 'Knowledge'
  | 'Settings'
  | 'Billing'
  | 'Help';

type SessionType = 'Interview' | 'Coding' | 'HR' | 'Interview+Coding';

type SessionConfig = {
  type: SessionType;
  company: string;
  role: string;
  jd: string;
  model: string;
  language: string;
  useResume: boolean;
  useDocuments: boolean;
  usePreviousSessions: boolean;
  selectedResumeId: string;
  selectedDocId: string;
  selectedPromptId: string;
  selectedSessionId: string;
  autoAnswer?: boolean;
  saveTranscript?: boolean;
};

type TranscriptItem = {
  id: string;
  speaker: 'Interviewer' | 'You';
  text: string;
  time: string;
  screenshot?: string;
  asked?: boolean;
  isFinal?: boolean;
  finalText?: string;
};

const modelOptions = [
  { value: 'gpt-4.1', label: 'GPT-4.1 (Premium)' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1-mini' },
  { value: 'gpt-4o', label: 'GPT-4o (High Accuracy)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'llama-3.3-70b', label: 'Llama 3.3 70B (Groq)' },
  { value: 'llama-3.1-8b', label: 'Llama 3.1 8B (Groq)' }
];
const defaultConfig: SessionConfig = {
  type: 'Interview+Coding',
  company: '',
  role: '',
  jd: '',
  model: 'gpt-4.1',
  language: 'English',
  useResume: true,
  useDocuments: true,
  usePreviousSessions: true,
  selectedResumeId: '',
  selectedDocId: '',
  selectedPromptId: '',
  selectedSessionId: '',
};

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard, screen: 'Dashboard' },
  { label: 'Live Session', icon: Mic, screen: 'Live Session' },
  { label: 'Mock Interview', icon: UserRound, screen: 'Mock Interview' },
  { label: 'Recent Sessions', icon: PlayCircle, screen: 'Recent Sessions' },
  { label: 'Resumes', icon: FileText, screen: 'Resume Intelligence' },
  { label: 'Knowledge', icon: Brain, screen: 'Knowledge' },
  { label: 'Help', icon: HelpCircle, screen: 'Help' },
];

const sessionTypes = [
  { label: 'Interview+Coding', value: 'Interview', icon: Briefcase, desc: 'General interview prep' },
  { label: 'Coding Test', value: 'Coding', icon: Code2, desc: 'Algorithms & debugging' },
  { label: 'HR Round', value: 'HR', icon: UserRound, desc: 'Behavioral & culture fit' },
];

const contextItems = [
  { title: 'Resume', status: 'Loaded', score: '92%', icon: FileText },
  { title: 'Job Description', status: 'Loaded', score: '88%', icon: Briefcase },
  { title: 'Reference Docs', status: 'Loaded', score: '90%', icon: Brain },
  { title: 'Previous Sessions', status: 'Available', score: '85%', icon: PlayCircle },
];

const sessions: any[] = [];

// No predefined seed — transcript starts empty and fills from live audio

const mockQuestions = [
  'Can you explain how you would design a scalable notification system?',
  'How would you reduce latency in a realtime WebSocket application?',
  'Tell me about a time you handled a production issue.',
  'How would you optimize a slow SQL query?',
  'How would you design a realtime interview copilot platform?'
];

// mockAnswers removed — only real API responses are used


const API_BASE = 'http://localhost:8000';
const WS_BASE = 'ws://localhost:8000';

async function requestTranscriptAnswer(transcript: string, model?: string, sessionId?: string): Promise<{ question: string; answer: string }> {
  const keys = getCurrentUserKeys();
  let resumeContent = '';
  let knowledgeContent = '';

  // Always resolve lightweight IDs to help backend load the correct context
  try {
    const savedResumes = localStorage.getItem(keys.resumesKey);
    const resumesList = savedResumes ? JSON.parse(savedResumes) : [];
    const activeResume = resumesList.find((r: any) => r.active);
    if (activeResume) {
      resumeContent = activeResume.id || '';
    }
  } catch (e) { console.error("Error reading resume for API context:", e); }

  try {
    const savedDocs = localStorage.getItem(keys.docsKey);
    const docsList = savedDocs ? JSON.parse(savedDocs) : [];
    const activeDoc = docsList.find((d: any) => d.active);
    if (activeDoc && activeDoc.id) {
      knowledgeContent += `doc_id:${activeDoc.id}|`;
    }

    const savedPrompts = localStorage.getItem(keys.promptsKey);
    const promptsList = savedPrompts ? JSON.parse(savedPrompts) : [];
    const activePrompt = promptsList.find((p: any) => p.active);
    if (activePrompt && activePrompt.id) {
      knowledgeContent += `prompt_id:${activePrompt.id}|`;
    }
  } catch (e) { console.error("Error reading knowledge for API context:", e); }

  const res = await fetch(`${API_BASE}/api/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId || undefined,
      question: transcript,
      source_type: 'transcript',
      resume_content: resumeContent || undefined,
      knowledge_content: knowledgeContent || undefined,
      model: model || undefined
    })
  });
  if (!res.ok) throw new Error(`Answer API failed: ${res.status}`);
  const data = await res.json();
  return {
    question: data.question || '',
    answer: data.answer || ''
  };
}

function extractPartialAnswer(jsonStream: string): string {
  const match = jsonStream.match(/"answer"\s*:\s*"/);
  if (!match) return "";
  const startIndex = match.index! + match[0].length;
  const answerContent = jsonStream.slice(startIndex);

  let result = "";
  let escaped = false;
  for (let i = 0; i < answerContent.length; i++) {
    const char = answerContent[i];
    if (escaped) {
      if (char === 'n') result += '\n';
      else if (char === 't') result += '\t';
      else if (char === 'r') result += '\r';
      else if (char === '\\') result += '\\';
      else if (char === '"') result += '"';
      else result += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '"') {
      break;
    } else {
      result += char;
    }
  }
  return result;
}

function extractPartialQuestion(jsonStream: string): string {
  const match = jsonStream.match(/"question"\s*:\s*"/);
  if (!match) return "";
  const startIndex = match.index! + match[0].length;
  const content = jsonStream.slice(startIndex);

  let result = "";
  let escaped = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (escaped) {
      if (char === 'n') result += '\n';
      else if (char === 't') result += '\t';
      else if (char === 'r') result += '\r';
      else if (char === '\\') result += '\\';
      else if (char === '"') result += '"';
      else result += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '"') {
      break;
    } else {
      result += char;
    }
  }
  return result;
}

async function requestTranscriptAnswerStream(
  transcript: string,
  model?: string,
  sessionId?: string,
  onChunk?: (answer: string, question: string) => void
): Promise<{ question: string; answer: string; ttft?: number }> {
  const keys = getCurrentUserKeys();
  const startTime = performance.now();
  let resumeContent = '';
  let knowledgeContent = '';

  // Always resolve lightweight IDs to help backend load the correct context
  try {
    const savedResumes = localStorage.getItem(keys.resumesKey);
    const resumesList = savedResumes ? JSON.parse(savedResumes) : [];
    const activeResume = resumesList.find((r: any) => r.active);
    if (activeResume) {
      resumeContent = activeResume.id || '';
    }
  } catch (e) { console.error("Error reading resume for API context:", e); }

  try {
    const savedDocs = localStorage.getItem(keys.docsKey);
    const docsList = savedDocs ? JSON.parse(savedDocs) : [];
    const activeDoc = docsList.find((d: any) => d.active);
    if (activeDoc && activeDoc.id) {
      knowledgeContent += `doc_id:${activeDoc.id}|`;
    }

    const savedPrompts = localStorage.getItem(keys.promptsKey);
    const promptsList = savedPrompts ? JSON.parse(savedPrompts) : [];
    const activePrompt = promptsList.find((p: any) => p.active);
    if (activePrompt && activePrompt.id) {
      knowledgeContent += `prompt_id:${activePrompt.id}|`;
    }
  } catch (e) { console.error("Error reading knowledge for API context:", e); }

  const res = await fetch(`${API_BASE}/api/answer/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId || undefined,
      question: transcript,
      source_type: 'transcript',
      resume_content: resumeContent || undefined,
      knowledge_content: knowledgeContent || undefined,
      model: model || undefined
    })
  });
  if (!res.ok) throw new Error(`Answer API failed: ${res.status}`);
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let finalAnswer = '';
  let finalQuestion = '';
  let firstTokenTime: number | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });

    const answer = extractPartialAnswer(accumulated);
    const question = extractPartialQuestion(accumulated) || transcript;
    const isJson = accumulated.trim().startsWith('{');

    finalAnswer = answer || (isJson ? "" : accumulated);
    finalQuestion = question;

    if (finalAnswer.trim() && firstTokenTime === null) {
      firstTokenTime = performance.now();
    }

    if (onChunk) {
      onChunk(finalAnswer, finalQuestion);
    }
  }

  const ttft = firstTokenTime ? (firstTokenTime - startTime) : undefined;

  return {
    question: finalQuestion,
    answer: finalAnswer,
    ttft: ttft
  };
}

async function requestScreenshotAnswer(file: Blob, sessionId?: string, model?: string): Promise<string> {
  const form = new FormData();
  form.append('file', file, 'capture.png');
  if (sessionId) {
    form.append('session_id', sessionId);
  }
  if (model) {
    form.append('model', model);
  }
  const res = await fetch(`${API_BASE}/api/screenshot`, {
    method: 'POST',
    body: form
  });
  if (!res.ok) throw new Error(`Screenshot API failed: ${res.status}`);
  const data = await res.json();
  return data.answer || '';
}

let globalDisplayStream: MediaStream | null = null;
let globalSystemAudioStreamPromise: Promise<MediaStream> | null = null;
let globalAudioWarningDismissed = false;

async function getOrInitDisplayStream(): Promise<MediaStream> {
  if (globalDisplayStream && globalDisplayStream.active) {
    return globalDisplayStream;
  }
  const controller = (window as any).CaptureController ? new (window as any).CaptureController() : null;
  globalDisplayStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    monitorTypeSurfaces: "exclude",
    selfBrowserSurface: "include",
    audio: false,
    controller
  } as any);

  if (controller) {
    try {
      controller.setFocusBehavior("no-focus-change");
    } catch (err) {
      console.warn("Failed to set focus behavior:", err);
    }
  }

  // Validate that they did not share the entire screen
  const videoTracks = globalDisplayStream.getVideoTracks();
  if (videoTracks.length > 0) {
    const settings = videoTracks[0].getSettings();
    if (settings.displaySurface === "monitor") {
      globalDisplayStream.getTracks().forEach(track => track.stop());
      globalDisplayStream = null;
      throw new Error("Sharing the entire screen is blocked. Please select a browser tab or an application window.");
    }
  }

  globalDisplayStream.getVideoTracks().forEach(track => {
    track.addEventListener('ended', () => {
      globalDisplayStream = null;
    });
  });

  return globalDisplayStream;
}

function stopGlobalDisplayStream() {
  if (globalDisplayStream) {
    globalDisplayStream.getTracks().forEach(track => track.stop());
    globalDisplayStream = null;
  }
}

async function captureScreenImage(): Promise<{ blob: Blob; dataUrl: string }> {
  const displayStream = await getOrInitDisplayStream();
  const video = document.createElement('video');
  video.srcObject = displayStream;
  video.muted = true;

  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => {
      video.play().then(() => resolve()).catch(() => resolve());
    };
    // fallback if event doesn't fire immediately
    setTimeout(resolve, 300);
  });

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to create screenshot blob')), 'image/png');
  });
  const dataUrl = canvas.toDataURL('image/png');
  return { blob, dataUrl };
}


interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  icon: Icon
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  icon?: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-[#0f1123]/95 hover:bg-[#0f1123] px-3.5 py-2.5 text-sm text-slate-200 outline-none transition-all cursor-pointer shadow-inner focus:border-violet-500/50"
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon size={16} className="text-slate-400 shrink-0" />}
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-slate-500 truncate">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 z-40 w-full rounded-xl border border-white/10 bg-[#0c0d1e]/98 backdrop-blur-md p-1.5 shadow-2xl max-h-60 overflow-y-auto animate-fadeIn">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500 italic">No options available</div>
          ) : (
            options.map((opt) => {
              const isActive = opt.value === value;
              const isAddBtn = opt.value === 'add_from_computer';
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex flex-col transition-all cursor-pointer my-0.5 ${isActive
                    ? 'bg-violet-600/30 text-white font-bold border border-violet-500/20'
                    : isAddBtn
                      ? 'text-cyan-300 hover:bg-cyan-500/10 border-t border-white/5 mt-1 pt-2'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    {opt.label}
                  </span>
                  {opt.sublabel && <span className="text-[10px] text-slate-500 font-normal truncate mt-0.5">{opt.sublabel}</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function LoginPage({ onLoginSuccess }: { onLoginSuccess: (u: AppUser) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');

  // Determined at module load time from vite.config.ts define / .env
  const isGsiConfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await signInWithGoogle(
        !isFirebaseConfigured && !isGsiConfigured && devEmail.trim() ? devEmail.trim() : undefined,
        !isFirebaseConfigured && !isGsiConfigured && devName.trim() ? devName.trim() : undefined
      );

      // Try to sync with backend DB (optional — works without backend too)
      let finalUser: AppUser = u;
      try {
        const res = await fetch(`${API_BASE}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebase_uid: u.uid,
            email: u.email,
            name: u.displayName,
            access_token: u.accessToken || null,
            is_mock: u.isMock || false
          })
        });
        if (res.ok) {
          const dbUser = await res.json();
          finalUser = { ...u, uid: dbUser.id };
          // Store the server-issued login token for single-session enforcement
          if (dbUser.login_token) {
            localStorage.setItem('login-token', dbUser.login_token);
            localStorage.setItem('login-token-user-id', String(dbUser.id));
          }
        }
      } catch (backendErr) {
        console.warn("Backend sync skipped (backend may not be running). Proceeding with Google user.", backendErr);
      }

      localStorage.setItem('logged-in-user', JSON.stringify(finalUser));
      onLoginSuccess(finalUser);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050609] overflow-hidden text-white font-sans antialiased">
      {/* Drifting Aura Lights */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[130px] animate-float-slow z-0" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-600/5 blur-[150px] animate-float-medium z-0" />

      {/* Grid Pattern Pattern Mask */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30 z-0" />

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="glass rounded-[2rem] border border-white/5 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-2xl animate-fadeIn">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(124,58,237,0.35)] mb-5">
              <Bot size={28} className="text-white" />
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
              Copilot<span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">X</span>
            </h1>
            <p className="mt-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Interview OS Console
            </p>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs">
              Real-time AI Copilot, resume intelligence matching, and custom knowledge base triggers.
            </p>
          </div>

          <div className="h-px bg-white/5 my-7" />

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 text-xs text-red-400 flex items-center gap-2 animate-shake">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!isFirebaseConfigured && !isGsiConfigured && (
            <div className="mb-6 space-y-4 animate-fadeIn text-left">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-2">
                <p className="text-xs font-bold text-violet-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  ✨ Developer Mode Fallback
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Firebase / GSI is not configured on this host. Enter a developer Gmail and Candidate Name to access the console locally.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider">Gmail Address</label>
                <input
                  type="email"
                  placeholder="e.g. candidate@gmail.com"
                  value={devEmail}
                  onChange={e => setDevEmail(e.target.value)}
                  className="w-full text-xs rounded-xl border border-white/5 bg-[#0a0b14]/50 px-3.5 py-3 outline-none focus:border-violet-500/40 text-white placeholder:text-slate-700 transition-all font-semibold"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={devName}
                  onChange={e => setDevName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-white/5 bg-[#0a0b14]/50 px-3.5 py-3 outline-none focus:border-violet-500/40 text-white placeholder:text-slate-700 transition-all font-semibold"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading || (!isFirebaseConfigured && !isGsiConfigured && (!devEmail.trim() || !devName.trim()))}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] hover:bg-white/[0.08] active:scale-98 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-5 w-5 text-white transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            )}
            <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
          </button>

          <p className="mt-6 text-center text-[10px] text-slate-500 leading-normal font-semibold">
            Secure Google authentication protocol active. Data synced with your active local dashboard profile.
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('logged-in-user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [screen, setScreen] = useState<Screen>(() => {
    // If user is already logged in (from localStorage), go to Dashboard; else show Landing
    try {
      const saved = localStorage.getItem('logged-in-user');
      return saved ? 'Dashboard' : 'Landing';
    } catch {
      return 'Landing';
    }
  });
  const [config, setConfig] = useState<SessionConfig>(defaultConfig);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showAppChoice, setShowAppChoice] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptItem[]>([]);
  const [sessionTime, setSessionTime] = useState(0);

  const [isMockSessionActive, setIsMockSessionActive] = useState(false);
  const [mockSessionQuestions, setMockSessionQuestions] = useState<Array<{
    question: string;
    answer: string;
    feedback: string;
    suggested: string;
  }>>([]);
  const [mockCurrentQuestion, setMockCurrentQuestion] = useState('Tell me about yourself and your recent project experience.');
  const [mockUserAnswer, setMockUserAnswer] = useState('');
  const [mockFeedback, setMockFeedback] = useState('');
  const [mockSuggestedAnswer, setMockSuggestedAnswer] = useState('');
  const [mockCompany, setMockCompany] = useState('Amazon');
  const [mockRole, setMockRole] = useState('Senior Software Engineer');
  const [mockInterviewType, setMockInterviewType] = useState<'Behavioral' | 'Technical' | 'Coding' | 'SQL' | 'System Design' | 'HR' | 'Mixed'>('Mixed');
  const [mockJd, setMockJd] = useState('');
  const [mockSessionTime, setMockSessionTime] = useState(0);
  const [mockModel, setMockModel] = useState('gemini-2.5-flash');

  useEffect(() => {
    if (!isMockSessionActive) return;
    const timer = setInterval(() => setMockSessionTime(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isMockSessionActive]);

  // ── Single-session enforcement ──────────────────────────────────────────
  // Every 30 s, ask the backend if this login_token is still the active one.
  // If another device/tab has logged in since, the backend returns {valid:false}
  // and we force-logout this session immediately.
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('login-token');
    const tokenUserId = localStorage.getItem('login-token-user-id');
    if (!token || !tokenUserId) return; // no backend token → skip (mock / offline mode)

    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/check-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: tokenUserId, login_token: token })
        });
        if (!res.ok) return; // backend down — don't kick
        const data = await res.json();
        if (data.valid === false) {
          // Another login has taken over — force logout this tab
          localStorage.removeItem('logged-in-user');
          localStorage.removeItem('login-token');
          localStorage.removeItem('login-token-user-id');
          localStorage.removeItem('active-session-id');
          setUser(null);
          setScreen('Landing');
          // Brief alert so the user understands why they were logged out
          alert('⚠️ You have been signed in on another device. This session has been logged out.');
        }
      } catch {
        // Network error — silently skip this check
      }
    };

    check(); // run immediately on mount
    const interval = setInterval(check, 30_000); // then every 30 s
    return () => clearInterval(interval);
  }, [user]);

  // Sync token if the user is logged in but missing the login token (e.g. session restored on mount)
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('login-token');
    if (!token) {
      fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: user.uid,
          email: user.email,
          name: user.displayName || '',
          is_mock: user.isMock || false
        })
      })
        .then(res => {
          if (res.ok) return res.json();
        })
        .then(dbUser => {
          if (dbUser && dbUser.login_token) {
            localStorage.setItem('login-token', dbUser.login_token);
            localStorage.setItem('login-token-user-id', String(dbUser.id));
          }
        })
        .catch(err => console.warn("Failed to sync session on mount", err));
    }
  }, [user]);
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    const keys = getCurrentUserKeys();

    // Sync Recent Sessions from LocalStorage first for instant render
    const savedSessions = localStorage.getItem(keys.sessionsKey);
    if (savedSessions) {
      try {
        setSessionsList(JSON.parse(savedSessions));
      } catch (e) { }
    }

    // Always fetch from backend to ensure data is synced
    fetch(`${API_BASE}/api/sessions?user_id=${user.uid}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const formatDuration = (seconds: number) => {
          if (!seconds || seconds <= 0) return '0:00';
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          return `${m}:${s.toString().padStart(2, '0')}`;
        };
        const formatted = data.map((s: any) => ({
          id: s.id,
          title: s.session_name ? (s.session_name.includes(' (') ? s.session_name.split(' (')[0] : s.session_name) : 'Practice Session',
          description: s.role_name ? `${s.role_name}${s.company_name ? ` (${s.company_name})` : ''}` : (s.company_name ? `Mock Prep Session with ${s.company_name}` : 'Practice Session'),
          company: s.company_name || '',
          type: s.session_name && s.session_name.includes('Coding Test') ? 'Coding Test' : (s.session_name && s.session_name.includes('HR Round') ? 'HR Round' : 'Interview+Coding'),
          duration: formatDuration(s.duration_seconds),
          aiUsage: s.ai_usage || 0,
          summary: s.summary || '',
          createdAt: new Date(s.created_at + (s.created_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          transcript: [],
          notes: s.summary ? [{ id: 'sum_' + s.id, title: 'Session Summary', text: s.summary }] : [
            { id: 'sum_def_' + s.id, title: 'Session Summary', text: `Mock Prep Session with ${s.company_name || 'Target Company'} for ${s.role_name || 'Software Engineer'}.` }
          ]
        }));
        setSessionsList(formatted);
        localStorage.setItem(keys.sessionsKey, JSON.stringify(formatted));
      })
      .catch(err => console.error("Failed to sync sessions:", err));

    // Sync Resumes from backend
    if (keys.userId) {
      fetch(`${API_BASE}/api/resumes?user_id=${keys.userId}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (data && data.length > 0) {
            const formattedResumes = data.map((dbRes: any) => ({
              id: dbRes.id,
              name: dbRes.file_name,
              active: dbRes.is_active,
              size: dbRes.parsed_content ? `${(dbRes.parsed_content.length / 1024).toFixed(0)} KB` : '10 KB',
              uploadDate: 'Previously uploaded',
              parsed_content: dbRes.parsed_content || ''
            }));
            localStorage.setItem(keys.resumesKey, JSON.stringify(formattedResumes));
          }
        }).catch(err => console.error("Failed to sync resumes on mount:", err));
    }

    // Sync Knowledge & Prompts from backend
    if (keys.userId) {
      fetch(`${API_BASE}/api/knowledge?user_id=${keys.userId}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (data && data.length > 0) {
            const backendDocs = data.filter((item: any) => item.document_type !== 'prompt');
            const backendPrompts = data.filter((item: any) => item.document_type === 'prompt');

            if (backendDocs.length > 0) {
              const formattedDocs = backendDocs.map((d: any) => ({
                id: d.id,
                name: d.document_name,
                content: d.content,
                active: true,
                size: d.content ? `${(d.content.length / 1024).toFixed(0)} KB` : '1 KB',
                uploadDate: 'Previously uploaded'
              }));
              localStorage.setItem(keys.docsKey, JSON.stringify(formattedDocs));
            }
            if (backendPrompts.length > 0) {
              const formattedPrompts = backendPrompts.map((p: any) => ({
                id: p.id,
                name: p.document_name,
                content: p.content,
                active: true,
                uploadDate: 'Previously uploaded'
              }));
              localStorage.setItem(keys.promptsKey, JSON.stringify(formattedPrompts));
            }
          }
        }).catch(err => console.error("Failed to sync knowledge on mount:", err));
    }
  }, [user]);



  const [showHelpChatbot, setShowHelpChatbot] = useState(false);
  const [helpMessages, setHelpMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    { sender: 'bot', text: "Hello! I'm the CopilotX Support AI. How can I help you resolve app issues, configure reference context, or optimize your session today?", time: 'Just now' }
  ]);
  const [helpInput, setHelpInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const chatbotScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showHelpChatbot && chatbotScrollRef.current) {
      chatbotScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [helpMessages, isBotTyping, showHelpChatbot]);

  const getHelpBotResponse = (text: string): string => {
    const q = text.toLowerCase();
    
    // Feature explanations
    if (q.includes('live session') || q.includes('interview os') || q.includes('streaming') || q.includes('real-time') || q.includes('step')) {
      return "To start and run a **Live Session (Interview OS)**, follow these steps:\n\n1. **Start the Session**: Click the '+ Start Session' button in the top-right header.\n2. **Configuration**: Select your target company, role, session type ('Interview+Coding' or 'Coding Test'), preferred AI model, and response style (Concise/Standard/Detailed). Optionally choose an active resume and reference docs.\n3. **Share Your Screen**: Click 'Accept & Connect' on the authorization modal. Choose the browser tab where your video call is running (Google Meet, Teams, etc.). *Crucial:* Check the 'Share tab audio' checkbox at the bottom-left of the browser picker window to capture interviewer voice.\n4. **Get Real-time Answers**: As the interviewer asks questions, CopilotX transcribes them automatically and streams answers in the right panel.\n5. **Screenshot Capture**: In coding tests or editor views, click 'Screenshot' in the footer to capture the code window for step-by-step solution guidance.\n6. **End Session**: Click the red 'Exit' button to save the transcript and generate an AI summary overview.";
    }
    if (q.includes('mock interview') || q.includes('webcam') || q.includes('practice')) {
      return "**Mock Interviews** allow you to practice with an AI interviewer:\n\n1. **Profile Adaptation**: Generates custom questions tailored to your targeted company, role, and job description.\n2. **Camera & Voice**: Records your answers using your webcam and mic.\n3. **Feedback**: Analyzes your speech patterns, answers, and provides a customized score alongside suggested improvements.";
    }
    if (q.includes('recent sessions') || q.includes('history') || q.includes('past')) {
      return "**Recent Sessions** serves as your interview log and performance history:\n\n1. **Transcripts & Q&A**: View detailed word-for-word transcript logs and past AI generated answers.\n2. **AI Summaries**: Provides auto-generated summaries of your session performance.\n3. **Interaction**: Click 'Ask AI' to request revisions or follow-up details from any past session.";
    }
    if (q.includes('resume') || q.includes('cv') || q.includes('parser') || q.includes('parse')) {
      return "**Resume Intelligence** is used to personalize all AI answers:\n\n1. **Upload**: Supports PDF, DOCX, and raw text files.\n2. **AI Summarization**: Extracts key strengths, career progression, summaries, and conversational introductions written in the first-person perspective.\n3. **Active State**: Make it active to automatically feed it into live and mock session prompts.";
    }
    if (q.includes('custom prompt') || q.includes('prompts') || q.includes('reference') || q.includes('knowledge') || q.includes('document')) {
      return "The **Knowledge Base** gives you behavioral customization options:\n\n1. **Reference Docs**: Upload cheatsheets, instructions, or documentation. Mark them active to inject them into the live session context.\n2. **Prompt Templates**: Create system prompts overrides (e.g. STAR method). Check 'Inject' to apply guidelines to all generated answers.\n3. **Token Counter**: Tracks combined prompt sizes dynamically.";
    }
    
    // Troubleshooting responses
    if (q.includes('mic') || q.includes('audio') || q.includes('websocket') || q.includes('speak') || q.includes('transcript')) {
      return "If your microphone or transcript streaming is not working, try these steps:\n\n1. Verify the FastAPI backend server is running locally on port 8000.\n2. Check browser microphone permissions in settings.\n3. Ensure you checked 'Share tab audio' if capturing tab audio.\n4. If sharing a window, no audio track is provided; the system will connect without audio, which is normal.";
    }
    if (q.includes('screenshot') || q.includes('image') || q.includes('capture')) {
      return "To take a screenshot:\n\n1. Share your IDE window or coding test browser tab inside the session connection dialog.\n2. Click the 'Screenshot' camera button in the right panel footer.\n3. The screenshot is analyzed using Vision LLMs to extract code and provide step-by-step guidance.";
    }
    if (q.includes('slow') || q.includes('delay') || q.includes('latency')) {
      return "To minimize response delays:\n\n1. Select 'Gemini 2.5 Flash' in the Setup Wizard (highly optimized for low-latency streaming).\n2. Set 'Style' to 'Concise' and 'Speed' to 'Fast' in the Wizard configuration.\n3. Verify your local network and FastAPI backend connections are stable.";
    }
    
    return "I can help explain all CopilotX features (Live Session OS, Mock Interviews, Recent Sessions, Resume Parser, and Custom Prompts) or provide troubleshooting tips (Mic setup, screenshots, response lag). Please ask me a specific question!";
  };

  const handleHelpMessageSend = () => {
    if (!helpInput.trim()) return;
    const userMsg = helpInput.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setHelpMessages(prev => [...prev, { sender: 'user', text: userMsg, time: now }]);
    setHelpInput('');
    setIsBotTyping(true);

    setTimeout(() => {
      const botResponse = getHelpBotResponse(userMsg);
      setHelpMessages(prev => [...prev, { sender: 'bot', text: botResponse, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }]);
      setIsBotTyping(false);
    }, 1200);
  };

  const sendQuickQuestion = (question: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setHelpMessages(prev => [...prev, { sender: 'user', text: question, time: now }]);
    setIsBotTyping(true);

    setTimeout(() => {
      const botResponse = getHelpBotResponse(question);
      setHelpMessages(prev => [...prev, { sender: 'bot', text: botResponse, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }]);
      setIsBotTyping(false);
    }, 1000);
  };

  const [sessionsList, setSessionsList] = useState(() => {
    const keys = getCurrentUserKeys();
    const saved = localStorage.getItem(keys.sessionsKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => {
          if (s.endsIn && !s.duration) {
            const duration = s.id === 's1' ? '15m' : (s.id === 's2' ? '10m' : '15m');
            const { endsIn, ...rest } = s;
            return { ...rest, duration };
          }
          return s;
        });
      } catch (e) { }
      return JSON.parse(saved);
    }
    return [];
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [detailSession, setDetailSession] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<'notes' | 'transcript' | 'ask'>('transcript');

  const [askInput, setAskInput] = useState('');
  const [askHistory, setAskHistory] = useState<{ id: string; role: 'user' | 'ai'; text: string }[]>([]);
  const [isModalStreaming, setIsModalStreaming] = useState(false);

  useEffect(() => {
    const keys = getCurrentUserKeys();
    localStorage.setItem(keys.sessionsKey, JSON.stringify(sessionsList));
  }, [sessionsList]);

  const startEdit = (session: any) => {
    setEditingId(session.id);
    setEditTitle(session.title);
    setEditDesc(session.description);
  };

  const saveEdit = (id: string) => {
    setSessionsList(prev => prev.map(s => s.id === id ? { ...s, title: editTitle, description: editDesc } : s));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const deleteSession = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;
    setSessionsList(prev => prev.filter(s => s.id !== id));
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      fetch(`${API_BASE}/api/sessions/${id}`, { method: 'DELETE' })
        .catch(err => console.error("Database session delete failed:", err));
    }
  };

  const openDetail = (session: any) => {
    setDetailSession(session);
    setModalTab('transcript');
    setAskInput('');
    setAskHistory([]);

    if (session.id && !session.id.startsWith('live_')) {
      Promise.all([
        fetch(`${API_BASE}/api/sessions/${session.id}/transcripts`).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE}/api/sessions/${session.id}/answers`).then(r => r.ok ? r.json() : [])
      ]).then(([dbTranscripts, dbAnswers]) => {
        const formattedTranscript = dbTranscripts.map((t: any) => ({
          id: t.id,
          speaker: t.speaker === 'interviewer' ? 'Interviewer' : 'You',
          text: t.content,
          time: new Date(t.created_at + (t.created_at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        }));

        const formattedNotes = session.summary ? [{ id: 'sum_' + session.id, title: 'Session Summary', text: session.summary }] : [
          { id: 'sum_def_' + session.id, title: 'Session Summary', text: `Mock Prep Session with ${session.company || 'Target Company'} for ${session.description || 'Software Engineer'}.` }
        ];

        const formattedQAs = dbAnswers.map((a: any, idx: number) => ({
          id: a.id,
          title: a.question || `AI Answer #${idx + 1}`,
          text: a.answer
        }));

        setDetailSession((prev: any) => {
          if (!prev || prev.id !== session.id) return prev;
          return {
            ...prev,
            transcript: formattedTranscript,
            notes: formattedNotes,
            qas: formattedQAs
          };
        });

        setSessionsList(prev => prev.map(s => s.id === session.id ? {
          ...s,
          transcript: formattedTranscript,
          notes: formattedNotes,
          qas: formattedQAs
        } : s));
      }).catch(err => console.error("Failed to load session details from DB:", err));
    }
  };

  const closeDetail = () => {
    setDetailSession(null);
  };

  const handleDownloadTranscript = (session: any) => {
    const textContent = session.transcript.map((t: any) => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${session.title}_transcript.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAskModalSend = async () => {
    if (!askInput.trim()) return;
    const userMsg = askInput.trim();
    setAskInput('');
    const msgId = String(Date.now());
    setAskHistory(prev => [...prev, { id: msgId, role: 'user', text: userMsg }]);
    setIsModalStreaming(true);

    try {
      setAskHistory(prev => [...prev, { id: 'streaming_node', role: 'ai', text: 'Thinking...' }]);

      const result = await requestTranscriptAnswerStream(
        userMsg,
        undefined,
        detailSession?.id,
        (partialAnswer, partialQuestion) => {
          setAskHistory(prev => {
            const other = prev.filter(x => x.id !== 'streaming_node');
            return [...other, { id: 'streaming_node', role: 'ai', text: partialAnswer || 'Thinking...' }];
          });
        }
      );
      const responseText = result.answer?.trim() || '⚠️ The AI returned an empty response. Please check the backend server.';

      setAskHistory(prev => {
        const other = prev.filter(x => x.id !== 'streaming_node');
        return [...other, { id: String(Date.now()), role: 'ai', text: responseText }];
      });
      setIsModalStreaming(false);
    } catch {
      setAskHistory(prev => {
        const other = prev.filter(x => x.id !== 'streaming_node');
        return [...other, { id: String(Date.now()), role: 'ai', text: '⚠️ Could not reach the backend. Make sure the FastAPI server is running on http://localhost:8000.' }];
      });
      setIsModalStreaming(false);
    }
  };

  const handleStartSession = () => {
    setIsSessionActive(false);
    localStorage.removeItem('session-active');
    setShowAppChoice(true);
    setScreen('Live Session');
    setCurrentTranscript([]);
    setSessionTime(0);
  };

  const handleEndSession = (qaHistoryData?: Array<{ question: string; answer: string; responseTime?: string }>) => {
    stopGlobalDisplayStream();

    const formatTimeFn = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const keys = getCurrentUserKeys();
    // Always save the session when ended (even if transcript is empty)
    const activeSessionId = localStorage.getItem('active-session-id');
    const defaultSummaryText = `Live session for ${config.company || 'Amazon'} as ${config.role || 'Senior Software Engineer'}.`;

    const newSession = {
      id: activeSessionId || ('live_' + Date.now()),
      title: config.company || 'Practice Session',
      description: `${config.role || 'Senior Software Engineer'} (${config.type})`,
      type: config.type,
      duration: formatTimeFn(sessionTime),
      aiUsage: qaHistoryData ? qaHistoryData.length : 0,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      transcript: config.saveTranscript ? currentTranscript : [
        {
          id: 'no_save',
          speaker: 'Interviewer',
          text: "User didn't want to save transcript.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        }
      ],
      summary: '',
      notes: [
        { id: 'sum_gen', title: 'Session Summary', text: 'Generating AI overview...' }
      ],
      qas: qaHistoryData && qaHistoryData.length > 0 ? qaHistoryData.map((qa, idx) => ({
        id: 'qa_' + idx,
        title: qa.question || `AI Answer #${idx + 1}`,
        text: qa.answer + (qa.responseTime ? `\n\n*(TTFT: ${qa.responseTime}s)*` : '')
      })) : []
    };
    setSessionsList(prev => [newSession, ...prev]);

    // 1. Mark session as ended immediately in DB to prevent race condition on page refresh
    if (activeSessionId && keys.userId) {
      fetch(`${API_BASE}/api/sessions/${activeSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended', duration_seconds: sessionTime })
      })
        .then(r => {
          if (!r.ok) console.warn("Failed to mark session as ended in DB:", r.statusText);
          return r.ok ? r.json() : null;
        })
        .then(data => {
          if (data && data.ai_usage !== undefined) {
            setSessionsList(prev => {
              const updated = prev.map(s => {
                if (s.id === data.id) {
                  return { ...s, aiUsage: data.ai_usage };
                }
                return s;
              });
              localStorage.setItem(keys.sessionsKey, JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(err => console.error("Database session status PATCH failed:", err));
    }

    // 2. Save transcript blocks to DB asynchronously
    if (activeSessionId && keys.userId && config.saveTranscript && currentTranscript.length > 0) {
      currentTranscript.forEach(item => {
        fetch(`${API_BASE}/api/transcripts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: activeSessionId,
            speaker: item.speaker === 'Interviewer' ? 'interviewer' : 'you',
            content: item.text,
            source: 'browser_audio'
          })
        }).catch(err => console.error("Failed to save transcript block to DB:", err));
      });
    }

    // 3. Generate AI Session Overview asynchronously
    if (currentTranscript.length > 0) {
      const transcriptText = currentTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n');
      const qaHistoryText = qaHistoryData && qaHistoryData.length > 0 
        ? qaHistoryData.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')
        : '';

      fetch(`${API_BASE}/api/sessions/overview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId || undefined,
          transcript: transcriptText,
          qa_history: qaHistoryText
        })
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const summaryText = data?.overview || defaultSummaryText;
          const aiNote = {
            id: 'sum_ai_' + Date.now(),
            title: 'Session Summary',
            text: summaryText
          };
          setSessionsList(prev => {
            const updated = prev.map(s => {
              if (s.id === newSession.id) {
                return { ...s, notes: [aiNote], summary: summaryText };
              }
              return s;
            });
            localStorage.setItem(keys.sessionsKey, JSON.stringify(updated));
            return updated;
          });

          if (activeSessionId && keys.userId) {
            fetch(`${API_BASE}/api/sessions/${activeSessionId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ summary: summaryText })
            }).catch(err => console.error("Database session overview PATCH failed:", err));
          }
        })
        .catch(err => {
          console.error("Failed to generate session overview:", err);
          setSessionsList(prev => {
            const updated = prev.map(s => {
              if (s.id === newSession.id) {
                return { ...s, notes: [{ id: 'sum_fail', title: 'Session Summary', text: defaultSummaryText }], summary: defaultSummaryText };
              }
              return s;
            });
            localStorage.setItem(keys.sessionsKey, JSON.stringify(updated));
            return updated;
          });

          if (activeSessionId && keys.userId) {
            fetch(`${API_BASE}/api/sessions/${activeSessionId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ summary: defaultSummaryText })
            }).catch(err => console.error("Database session fallback overview PATCH failed:", err));
          }
        });
    } else {
      // Empty session summary
      setSessionsList(prev => {
        const updated = prev.map(s => {
          if (s.id === newSession.id) {
            return { ...s, notes: [{ id: 'sum_empty', title: 'Session Summary', text: defaultSummaryText }], summary: defaultSummaryText };
          }
          return s;
        });
        localStorage.setItem(keys.sessionsKey, JSON.stringify(updated));
        return updated;
      });

      if (activeSessionId && keys.userId) {
        fetch(`${API_BASE}/api/sessions/${activeSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: defaultSummaryText })
        }).catch(err => console.error("Database session empty overview PATCH failed:", err));
      }
    }

    if (activeSessionId) {
      localStorage.removeItem('active-session-id');
    }

    setIsSessionActive(false);
    localStorage.removeItem('session-active');
    setScreen('Recent Sessions');
  };

  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isSessionActive) {
      lastActivityRef.current = Date.now();
    }
  }, [currentTranscript, isSessionActive]);

  const endSessionRef = useRef(handleEndSession);
  useEffect(() => {
    endSessionRef.current = handleEndSession;
  }, [handleEndSession]);

  useEffect(() => {
    if (!isSessionActive) return;
    const timer = setInterval(() => {
      setSessionTime(s => s + 1);

      // Auto-exit session after 5 minutes of inactivity
      if (Date.now() - lastActivityRef.current >= 5 * 60 * 1000) {
        console.log("Session inactive for 5 minutes, auto-ending...");
        endSessionRef.current();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isSessionActive]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'session-active' && e.newValue !== 'true') {
        stopGlobalDisplayStream();
        setIsSessionActive(false);
        setScreen('Recent Sessions');
      }
    };

    const handleBeforeUnload = () => {
      const activeSessionId = localStorage.getItem('active-session-id');
      if (activeSessionId) {
        fetch(`${API_BASE}/api/sessions/${activeSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ended' }),
          keepalive: true
        });
        localStorage.removeItem('active-session-id');
        localStorage.removeItem('session-active');
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (screen === 'Landing') {
    return <Landing
      onSignIn={() => setScreen('Login')}
      onStart={handleStartSession}
    />;
  }

  if (!user || screen === 'Login') {
    return <LoginPage onLoginSuccess={(u) => {
      setUser(u);
      setScreen('Dashboard');
    }} />;
  }

  const isSessionStarted = isSessionActive || isMockSessionActive;

  return (
    <div className="flex h-screen overflow-hidden bg-[#050609] text-slate-100 font-sans relative">
      {/* Drifting Aura Lights for Dashboard / App */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[130px] animate-float-slow z-0" />
      <div className="pointer-events-none absolute bottom-20 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-600/5 blur-[120px] animate-float-medium z-0" />
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30 z-0" />

      {!isSessionStarted && (
        <Sidebar
          active={screen === 'Session Summary' ? 'Live Session' : screen}
          showHelpChatbot={showHelpChatbot}
          onLogout={() => {
            localStorage.removeItem('logged-in-user');
            localStorage.removeItem('login-token');
            localStorage.removeItem('login-token-user-id');
            setUser(null);
            setScreen('Landing');
          }}
          onNavigate={(v) => {
            if (v === 'Help') {
              setShowHelpChatbot(prev => !prev);
              return;
            }
            if (v === 'Dashboard') {
              setShowHelpChatbot(false);
              setScreen('Dashboard');
              return;
            }
            if (v === 'Billing') {
              setShowHelpChatbot(false);
              setScreen('Billing');
              return;
            }
            const item = nav.find(n => n.label === v);
            if (item) {
              setShowHelpChatbot(false);
              if (item.screen === 'Live Session') {
                if (!isSessionActive) {
                  setShowAppChoice(true);
                }
              }
              setScreen(item.screen as Screen);
            }
          }}
        />
      )}
      <div className="min-w-0 flex-1 flex flex-col relative z-10">
        {!isSessionStarted && (
          <Topbar
            isSessionActive={isSessionActive}
            onStart={handleStartSession}
            onEnd={handleEndSession}
          />
        )}

        {screen === 'Dashboard' && (
          <Dashboard
            onStart={handleStartSession}
            onNavigate={(v) => setScreen(v as Screen)}
            sessionsList={sessionsList}
            editingId={editingId}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editDesc={editDesc}
            setEditDesc={setEditDesc}
            startEdit={startEdit}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            deleteSession={deleteSession}
            openDetail={openDetail}
            config={config}
          />
        )}

        {screen === 'Mock Interview' && (
          <MockInterview
            isSessionActive={isMockSessionActive}
            setIsSessionActive={setIsMockSessionActive}
            sessionQuestions={mockSessionQuestions}
            setSessionQuestions={setMockSessionQuestions}
            currentQuestion={mockCurrentQuestion}
            setCurrentQuestion={setMockCurrentQuestion}
            userAnswer={mockUserAnswer}
            setUserAnswer={setMockUserAnswer}
            feedback={mockFeedback}
            setFeedback={setMockFeedback}
            suggestedAnswer={mockSuggestedAnswer}
            setSuggestedAnswer={setMockSuggestedAnswer}
            company={mockCompany}
            setCompany={setMockCompany}
            role={mockRole}
            setRole={setMockRole}
            interviewType={mockInterviewType}
            setInterviewType={setMockInterviewType}
            jd={mockJd}
            setJd={setMockJd}
            sessionTime={mockSessionTime}
            setSessionTime={setMockSessionTime}
            model={mockModel}
            setModel={setMockModel}
          />
        )}

        {screen === 'Recent Sessions' && (
          <RecentSessionsPage
            sessionsList={sessionsList}
            editingId={editingId}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editDesc={editDesc}
            setEditDesc={setEditDesc}
            startEdit={startEdit}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            deleteSession={deleteSession}
            openDetail={openDetail}
          />
        )}

        {isSessionActive && (
          <div className={screen === 'Live Session' ? "flex-1 flex min-h-0 min-w-0" : "hidden"}>
            <LiveSession
              config={config}
              onFinish={handleEndSession}
              tr={currentTranscript}
              setTr={setCurrentTranscript}
              sessionTime={sessionTime}
            />
          </div>
        )}

        {screen === 'Live Session' && !isSessionActive && (
          <Page title="Live Session" subtitle="Prepare and customize your live interview settings.">
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-glow animate-pulse">
                <Mic size={36} />
              </div>
              <h2 className="text-2xl font-black text-white">Setup Your Live Session</h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">Configure your target company, role, context sources, and response style before launching the session.</p>
              <button
                onClick={() => setShowWizard(true)}
                className="mt-8 rounded-2xl bg-violet-600 px-6 py-3.5 text-sm font-black text-white hover:bg-violet-500 transition-all shadow-glow flex items-center gap-2"
              >
                <Plus size={16} /> Open Setup Wizard
              </button>
            </div>
          </Page>
        )}

        {screen === 'Session Summary' && <SessionSummary onHome={() => setScreen('Dashboard')} onReplay={() => setScreen('Session Replay')} />}
        {screen === 'Session Replay' && <SessionReplay />}
        {screen === 'Resume Intelligence' && <ResumeIntelligence />}
        {screen === 'Company Intelligence' && <CompanyIntelligence />}
        {screen === 'Screenshot Lab' && <ScreenshotLab />}
        {screen === 'Knowledge' && <Knowledge />}
        {screen === 'Settings' && <Settings />}
        {screen === 'Billing' && <Billing />}
      </div>

      {detailSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-soft flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">Transcript</h2>
                  <button
                    onClick={() => {
                      if (!window.confirm('Are you sure you want to clear this transcript? This cannot be undone.')) return;
                      setSessionsList(prev => prev.map(s => s.id === detailSession.id ? { ...s, transcript: [] } : s));
                      setDetailSession((prev: any) => ({ ...prev, transcript: [] }));
                    }}
                    className="p-1 rounded bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all shadow-sm"
                    title="Delete transcript"
                  >
                    <X size={12} />
                  </button>
                </div>
                <button
                  onClick={closeDetail}
                  className="rounded-2xl p-2 text-slate-400 hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-white/5 mb-4 shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => setModalTab('transcript')}
                    className={`py-2 px-3 text-xs font-bold transition-all relative ${modalTab === 'transcript'
                      ? 'border-b-2 border-violet-500 text-violet-300'
                      : 'text-slate-500 hover:text-slate-300'
                      }`}
                  >
                    Transcript & Q&A
                  </button>
                  <button
                    onClick={() => setModalTab('notes')}
                    className={`py-2 px-3 text-xs font-bold transition-all relative ${modalTab === 'notes'
                      ? 'border-b-2 border-violet-500 text-violet-300'
                      : 'text-slate-500 hover:text-slate-300'
                      }`}
                  >
                    Session Summary
                  </button>
                </div>

                <button
                  onClick={() => handleDownloadTranscript(detailSession)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-black text-slate-200 hover:bg-white/[0.08] transition-all"
                >
                  <Upload size={12} className="rotate-180" />
                  Download
                </button>
              </div>

              <div className="min-h-[300px] max-h-[420px] overflow-y-auto pr-1 space-y-4">
                {modalTab === 'transcript' && (
                  <div className="space-y-4">
                    {detailSession.transcript.length === 0 && (!detailSession.notes || detailSession.notes.length === 0) ? (
                      <div className="text-center text-slate-600 text-xs py-12">No transcript or Q&A recorded for this session.</div>
                    ) : (
                      <>
                        {detailSession.transcript.map((item: any) => (
                          <div key={item.id} className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
                              <span className="font-bold text-violet-400">
                                {item.speaker === 'Interviewer' ? 'Question' : 'Your Answer'}
                              </span>
                              <span>{item.time}</span>
                            </div>

                            <div className={`p-4 rounded-2xl border relative ${item.speaker === 'Interviewer'
                              ? 'border-violet-500/20 bg-violet-500/5'
                              : 'border-white/5 bg-slate-900'
                              }`}>
                              <p className="text-xs leading-5 text-slate-200 whitespace-pre-wrap">{item.text}</p>
                              <button
                                onClick={() => navigator.clipboard.writeText(item.text)}
                                className="absolute top-2 right-2 opacity-0 hover:opacity-100 p-1 rounded bg-white/[0.05] text-slate-400 hover:text-white transition-all"
                                title="Copy text"
                              >
                                <Copy size={10} />
                              </button>
                            </div>
                          </div>
                        ))}

                        {detailSession.qas && detailSession.qas.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 pt-2">
                              <div className="h-px flex-1 bg-violet-500/20" />
                              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">AI Q&A Answers</span>
                              <div className="h-px flex-1 bg-violet-500/20" />
                            </div>
                            {detailSession.qas.map((n: any) => (
                              <div key={n.id} className="p-4 rounded-2xl border border-violet-500/10 bg-violet-950/10">
                                <div className="text-xs font-bold text-violet-300 mb-1">{n.title}</div>
                                <p className="text-xs text-slate-400 mt-1 leading-5">{n.text}</p>
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {modalTab === 'notes' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-violet-300 uppercase tracking-wide">Session Summary</h4>
                      {detailSession.notes?.length > 0 && (
                        <button
                          onClick={() => {
                            if (!window.confirm('Are you sure you want to clear the session summary? This cannot be undone.')) return;
                            setSessionsList(prev => prev.map(s => s.id === detailSession.id ? { ...s, notes: [] } : s));
                            setDetailSession((prev: any) => ({ ...prev, notes: [] }));
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all text-[10px] font-bold"
                          title="Clear session summary"
                        >
                          <X size={10} /> Clear
                        </button>
                      )}
                    </div>
                    {!detailSession.notes || detailSession.notes.length === 0 ? (
                      <div className="text-center text-slate-600 text-xs py-12">No session summary yet. Summary is auto-generated when you end the session.</div>
                    ) : (
                      detailSession.notes?.map((n: any) => (
                        <div key={n.id} className="p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
                          <div className="text-xs font-bold text-white">{n.title}</div>
                          <p className="text-xs text-slate-400 mt-1.5 leading-5">{n.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}
      {showHelpChatbot && (
        <>
          {/* Backdrop Blur Overlay next to Nav */}
          <div
            onClick={() => setShowHelpChatbot(false)}
            className="fixed inset-0 left-64 bg-black/60 backdrop-blur-md z-[90] animate-fadeIn cursor-pointer"
          />
          {/* Chatbot Window next to Nav */}
          <div className="fixed inset-y-6 left-[17rem] w-96 z-[100] flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">CopilotX Support AI</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-medium">Online Help Agent</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowHelpChatbot(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {helpMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-5 ${msg.sender === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-white/[0.04] text-slate-200 border border-white/5 rounded-tl-none whitespace-pre-line'
                      }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
              {isBotTyping && (
                <div className="flex items-center gap-1 bg-white/[0.04] border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 w-16 mr-auto">
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={chatbotScrollRef} />
            </div>

            {/* Suggestions */}
            {!isBotTyping && (
              <div className="px-5 py-3 flex flex-col gap-3 border-t border-white/5 bg-slate-950/40">
                <div>
                  <p className="text-[9px] text-slate-500 font-bold px-1 uppercase tracking-wider mb-1.5">Explore Features</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      ['🎙️ Live Session OS', 'Tell me about the Live Session feature'],
                      ['🤖 Mock Interviews', 'Tell me about Mock Interviews'],
                      ['📊 Recent Sessions', 'Tell me about Recent Sessions'],
                      ['📄 Resume Parser', 'Tell me about Resume Intelligence'],
                      ['🧠 Custom Prompts', 'Tell me about Custom Prompts and reference docs']
                    ].map(([label, query]) => (
                      <button
                        key={label}
                        onClick={() => sendQuickQuestion(query)}
                        className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-violet-500/10 hover:border-violet-500/30 px-2.5 py-1.5 text-[9px] text-slate-300 font-medium transition-all text-left"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold px-1 uppercase tracking-wider mb-1.5">Troubleshooting</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      ['🎤 Mic Setup', 'My microphone is not working'],
                      ['📸 Screenshots', 'How do I take screenshots?'],
                      ['⚡ Answer Lag', 'Why are answers slow?']
                    ].map(([label, query]) => (
                      <button
                        key={label}
                        onClick={() => sendQuickQuestion(query)}
                        className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-violet-500/10 hover:border-violet-500/30 px-2.5 py-1.5 text-[9px] text-slate-300 font-medium transition-all text-left"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2 border-t border-white/10 px-5 py-3.5 bg-slate-950">
              <input
                type="text"
                placeholder="Ask a question about CopilotX..."
                value={helpInput}
                onChange={e => setHelpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleHelpMessageSend()}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs outline-none focus:border-violet-500/50 text-white placeholder:text-slate-600"
              />
              <button
                onClick={handleHelpMessageSend}
                disabled={isBotTyping || !helpInput.trim()}
                className="rounded-xl bg-violet-600 p-2.5 text-white hover:bg-violet-500 disabled:opacity-40 transition-all flex items-center justify-center shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </>
      )}
      {showAppChoice && (
        <AppChoiceModal
          open={showAppChoice}
          onClose={() => setShowAppChoice(false)}
          onContinueWeb={() => {
            setShowAppChoice(false);
            setShowWizard(true);
          }}
        />
      )}
      {showWizard && (
        <StartSessionWizard
          open={showWizard}
          onClose={() => setShowWizard(false)}
          onLaunch={(c) => {
            const keys = getCurrentUserKeys();
            try {
              const savedResumes = localStorage.getItem(keys.resumesKey);
              if (savedResumes) {
                const list = JSON.parse(savedResumes);
                const updated = list.map((r: any) => ({ ...r, active: r.id === c.selectedResumeId }));
                localStorage.setItem(keys.resumesKey, JSON.stringify(updated));
              }
            } catch (e) { console.error("Error setting active resume:", e); }

            try {
              const savedDocs = localStorage.getItem(keys.docsKey);
              if (savedDocs) {
                const list = JSON.parse(savedDocs);
                const updated = list.map((d: any) => ({ ...d, active: d.id === c.selectedDocId }));
                localStorage.setItem(keys.docsKey, JSON.stringify(updated));
              }
            } catch (e) { console.error("Error setting active doc:", e); }

            try {
              const savedPrompts = localStorage.getItem(keys.promptsKey);
              if (savedPrompts) {
                const list = JSON.parse(savedPrompts);
                const updated = list.map((p: any) => ({ ...p, active: p.id === c.selectedPromptId }));
                localStorage.setItem(keys.promptsKey, JSON.stringify(updated));
              }
            } catch (e) { console.error("Error setting active prompt:", e); }

            const proceedWithSession = (sessId: string) => {
              localStorage.setItem('active-session-id', sessId);

              // Warm up cache with selected resume, doc, and prompt content
              let warmupResumeContent = '';
              let warmupDocContent = '';
              let warmupPromptContent = '';
              try {
                const savedResumes = localStorage.getItem(keys.resumesKey);
                const resumesList = savedResumes ? JSON.parse(savedResumes) : [];
                const r = resumesList.find((r: any) => r.id === c.selectedResumeId);
                if (r) warmupResumeContent = r.parsed_content || '';

                const savedDocs = localStorage.getItem(keys.docsKey);
                const docsList = savedDocs ? JSON.parse(savedDocs) : [];
                const d = docsList.find((d: any) => d.id === c.selectedDocId);
                if (d) warmupDocContent = d.content || '';

                const savedPrompts = localStorage.getItem(keys.promptsKey);
                const promptsList = savedPrompts ? JSON.parse(savedPrompts) : [];
                const p = promptsList.find((p: any) => p.id === c.selectedPromptId);
                if (p) warmupPromptContent = p.content || '';
              } catch (e) { console.error("Error reading context for warmup:", e); }

              fetch(`${API_BASE}/api/answers/warmup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  resume_id: c.selectedResumeId || undefined,
                  resume_content: warmupResumeContent || undefined,
                  doc_id: c.selectedDocId || undefined,
                  doc_content: warmupDocContent || undefined,
                  prompt_id: c.selectedPromptId || undefined,
                  prompt_content: warmupPromptContent || undefined
                })
              }).catch(err => console.error("Cache warmup failed:", err));

              setConfig(c);
              setIsSessionActive(true);
              localStorage.setItem('session-active', 'true');
            };

            if (keys.userId) {
              fetch(`${API_BASE}/api/sessions?user_id=${keys.userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  session_name: `${c.company || 'Amazon'} (${c.type || 'Interview+Coding'})`,
                  company_name: c.company || 'Amazon',
                  role_name: c.role || 'Senior Software Engineer',
                  language: c.language || 'English',
                  audio_source: 'browser_tab_audio'
                })
              })
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                  const newId = (data && data.id) ? data.id : 'demo-session-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
                  proceedWithSession(newId);
                })
                .catch(err => {
                  console.error("Database session creation failed:", err);
                  proceedWithSession('demo-session-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now());
                });
            } else {
              proceedWithSession('demo-session-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now());
            }
            setShowWizard(false);
          }}
        />
      )}
    </div>
  );
}

const previewScenarios = {
  system: {
    question: "Design a scalable notification system.",
    answer: "### Ingestion & In-Memory Queueing\n\n1. **API Ingestion Service**: Light Node.js/Go instances validate schemas, authenticate client payloads, and delegate to broker pools.\n2. **Partitioned Broker Queue**: Publish tasks to Apache Kafka categorized by channel priority.\n\n```typescript\nasync function dispatchToQueue(payload: NotificationRequest) {\n  const messageId = crypto.randomUUID();\n  await messageQueue.publish({\n    topic: `notifications-${payload.priority}`,\n    key: payload.userId,\n    value: JSON.stringify({ messageId, ...payload })\n  });\n  return { success: true, messageId };\n}\n```\n\n3. **Worker Microservices**: Autoscale container pools pull tasks and contact Firebase/APNs adapters.",
  },
  sql: {
    question: "How would you optimize a slow database query?",
    answer: "### Composite Indexing & Planning Analysis\n\n1. **Composite Indexes**: Align indexed keys with sorting criteria to eliminate costly in-memory sort scans.\n2. **Avoid SELECT ***: Return only the mandatory schema columns to minimize data serialization overhead.\n\n```sql\n-- Heavy read latency query:\nSELECT * FROM user_sessions WHERE user_id = 918 ORDER BY last_active DESC;\n\n-- Optimization with Composite B-Tree:\nCREATE INDEX idx_user_sessions_id_active ON user_sessions (user_id, last_active DESC);\nSELECT id, session_token, last_active FROM user_sessions WHERE user_id = 918 ORDER BY last_active DESC;\n```\n\n3. **Query Engine Plan**: Execute `EXPLAIN ANALYZE` to identify scan bottlenecks.",
  },
  react: {
    question: "Explain React 19 reconciliation and optimizations.",
    answer: "### Fiber Tree Diffing & Async Actions\n\n1. **Fiber Time Slicing**: Breaks rendering tasks into microscopic execution increments to prevent main thread locks.\n2. **React Actions**: Standardizes async state variables inside transitions without manual pending states.\n\n```tsx\n// React 19 useTransition Action Hook\nimport { useTransition } from 'react';\n\nfunction ProfileEditor() {\n  const [isPending, startTransition] = useTransition();\n  \n  const updateProfile = () => {\n    startTransition(async () => {\n      const response = await api.saveProfile();\n      toast.success(\"Profile updated!\");\n    });\n  };\n}\n```\n\n3. **Batched updates**: Async actions inside promises share standard render updates, lowering paint frequencies.",
  }
};

function Landing({ onSignIn, onStart }: { onSignIn: () => void; onStart: () => void }) {
  // Live session preview simulator state
  const [activeScenario, setActiveScenario] = useState<'system' | 'sql' | 'react'>('system');
  const [questionLength, setQuestionLength] = useState(0);
  const [answerLength, setAnswerLength] = useState(0);
  const [simulatorState, setSimulatorState] = useState<'idle' | 'typing' | 'thinking' | 'streaming'>('idle');

  // Resume scorer state
  const [scorerResume, setScorerResume] = useState<'lead_fe' | 'staff_be' | 'ml_eng'>('lead_fe');
  const [scorerCompany, setScorerCompany] = useState<'Google' | 'Netflix' | 'Stripe'>('Google');
  const [scorerProgress, setScorerProgress] = useState(0);
  const [scorerScore, setScorerScore] = useState<number | null>(null);
  const [scorerState, setScorerState] = useState<'idle' | 'running' | 'done'>('idle');

  // Pricing state
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'annual'>('annual');

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Preview Simulator Engine
  useEffect(() => {
    let active = true;
    let qInterval: any;
    let aInterval: any;
    let thinkingTimeout: any;

    setQuestionLength(0);
    setAnswerLength(0);
    setSimulatorState('typing');

    const currentData = previewScenarios[activeScenario];

    let qLen = 0;
    qInterval = setInterval(() => {
      if (!active) return;
      if (qLen < currentData.question.length) {
        qLen++;
        setQuestionLength(qLen);
      } else {
        clearInterval(qInterval);
        setSimulatorState('thinking');
        
        thinkingTimeout = setTimeout(() => {
          if (!active) return;
          setSimulatorState('streaming');
          
          let aLen = 0;
          const answerText = currentData.answer;
          aInterval = setInterval(() => {
            if (!active) return;
            if (aLen < answerText.length) {
              aLen += 6;
              setAnswerLength(Math.min(aLen, answerText.length));
            } else {
              clearInterval(aInterval);
              setSimulatorState('idle');
            }
          }, 15);
        }, 1200);
      }
    }, 25);

    return () => {
      active = false;
      clearInterval(qInterval);
      clearInterval(aInterval);
      clearTimeout(thinkingTimeout);
    };
  }, [activeScenario]);

  // Resume Scorer Simulation Handler
  const runResumeAnalysis = () => {
    setScorerState('running');
    setScorerProgress(0);
    setScorerScore(null);

    let targetScore = 80;
    if (scorerResume === 'lead_fe') {
      if (scorerCompany === 'Google') targetScore = 84;
      else if (scorerCompany === 'Netflix') targetScore = 96;
      else targetScore = 89;
    } else if (scorerResume === 'staff_be') {
      if (scorerCompany === 'Google') targetScore = 91;
      else if (scorerCompany === 'Stripe') targetScore = 97;
      else targetScore = 86;
    } else { // ml_eng
      if (scorerCompany === 'Google') targetScore = 95;
      else if (scorerCompany === 'Netflix') targetScore = 81;
      else targetScore = 90;
    }

    const duration = 1200; // ms
    const stepTime = 25;
    const totalSteps = duration / stepTime;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setScorerProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        setScorerScore(targetScore);
        setScorerState('done');
      }
    }, stepTime);
  };

  const getScorerFeedback = () => {
    if (scorerResume === 'lead_fe') {
      if (scorerCompany === 'Netflix') {
        return "✨ Stellar match! Outstanding framework optimization & CDN asset delivery experiences line up perfectly with Netflix's media scaling requirements.";
      }
      return "💡 Good layout fit. Recommendation: Expand details on web vitals logging & asynchronous service workers to push score higher.";
    }
    if (scorerResume === 'staff_be') {
      if (scorerCompany === 'Stripe') {
        return "✨ Elite fit! Deep background in distributed transaction synchronization, idempotency keys, and PCI APIs maps perfectly to Stripe's core team.";
      }
      return "💡 Excellent infrastructure fit. Recommendation: Highlight database partitioning projects and zero-downtime ledger migration schemas.";
    }
    // ml_eng
    if (scorerCompany === 'Google') {
      return "✨ Incredible research fit! High-end model architecture adjustments, custom LLM fine-tuning, and TPU compute layouts mesh directly with Google Brain initiatives.";
    }
    return "💡 Strong math & ML fit. Recommendation: Emphasize memory footprints optimization and real-time model inference acceleration details.";
  };

  const faqs = [
    {
      q: "How does CopilotX capture meeting audio?",
      a: "CopilotX integrates directly using browser-native screen audio-sharing capture capabilities or via our standalone desktop app. It aggregates tab sound feeds and your microphone signals seamlessly to run local transcriptions without hardware delays."
    },
    {
      q: "Does it personalize answers to my background?",
      a: "Yes. By importing your resumes, active JD postings, and notes, the AI filters all suggestions, architecture advice, and coding models to utilize your actual historical stacks and tech background."
    },
    {
      q: "Is it safe to run alongside test programs?",
      a: "Absolutely. CopilotX executes in an isolated web layout or local container thread, prioritizing background audio analysis without injecting files, hooking screen processes, or running intrusive local packages."
    },
    {
      q: "Which AI models power the suggestions?",
      a: "CopilotX leverages advanced LLM systems including GPT-4o, Gemini 2.5 Pro, and Llama 3.3. It routes queries dynamically using an optimization mesh to ensure answers generate in under 1.2 seconds."
    }
  ];

  return (
    <div className="min-h-screen bg-[#050609] text-slate-100 flex flex-col relative overflow-hidden font-sans">
      
      {/* Drifting Aura Lights */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[130px] animate-float-slow" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[150px] animate-float-medium" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-600/5 blur-[120px] animate-float-slow" />

      {/* Grid Pattern Mask */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60" />

      {/* Floating Glass Navbar */}
      <header className="relative z-50 mx-4 my-4 max-w-6xl md:mx-auto md:w-[94%] glass-navbar rounded-2xl flex items-center justify-between px-6 py-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
            <Bot size={18} className="text-white animate-pulse" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">Copilot<span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">X</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <a href="#simulator" className="hover:text-white transition-colors cursor-pointer">Live Demo</a>
          <a href="#scorer" className="hover:text-white transition-colors cursor-pointer">Resume Scorer</a>
          <a href="#features" className="hover:text-white transition-colors cursor-pointer">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors cursor-pointer">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors cursor-pointer">FAQ</a>
        </nav>

        <div className="flex gap-3">
          <button onClick={onSignIn} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer">Sign In</button>
          <button onClick={onStart} className="btn-gradient rounded-xl px-5 py-2 text-xs font-bold text-white cursor-pointer">Launch Console</button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 flex-1">
        
        {/* Hero Section */}
        <section className="grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr] py-8">
          <div className="flex flex-col items-start text-left">
            <div className="mb-6 flex flex-wrap gap-2 animate-fadeIn">
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-950/20 px-3 py-1 text-[11px] font-bold text-violet-300 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                <Sparkles size={11} className="text-violet-400" /> Resume-aware Context
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-950/20 px-3 py-1 text-[11px] font-bold text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <Globe size={11} className="text-cyan-400" /> Company Target Tuned
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-950/20 px-3 py-1 text-[11px] font-bold text-emerald-400 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Real-time Listening
              </span>
            </div>

            <h1 className="font-display text-[46px] sm:text-[62px] lg:text-[74px] font-extrabold leading-[1.08] tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              The AI Operating <br className="hidden sm:inline" />
              System for <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Interviews</span>.
            </h1>
            
            <p className="mt-6 max-w-xl text-[16px] sm:text-[18px] leading-relaxed text-slate-400 font-medium">
              Transcribe conversations on-the-fly, stream tailor-made coding scripts, run automated webcam voice mock trials, and inspect resume scorecards. Optimized for modern developers.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto">
              <button onClick={onSignIn} className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-white shadow-xl w-full sm:w-auto cursor-pointer">
                <span>Start Free Console</span> <ArrowRight size={16} />
              </button>
              <a href="#simulator" className="btn-glass inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-bold text-slate-200 w-full sm:w-auto cursor-pointer">
                <PlayCircle size={16} /> Simulate Live Session
              </a>
            </div>

            {/* Quick stats widgets */}
            <div className="mt-12 grid grid-cols-3 gap-6 w-full border-t border-white/5 pt-8">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg LLM Latency</div>
                <div className="text-xl font-black text-violet-400 mt-1 flex items-center gap-1.5">
                  <Cpu size={16} className="text-violet-400 animate-pulse" /> 1.2s
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Audio Sync Speed</div>
                <div className="text-xl font-black text-cyan-400 mt-1 flex items-center gap-1.5">
                  <Activity size={16} className="text-cyan-400 animate-pulse" /> Real-time
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Answer Accuracy</div>
                <div className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-400" /> 96.8%
                </div>
              </div>
            </div>
          </div>

          {/* Isometric Dashboard Render */}
          <div className="relative group w-full flex justify-center">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-600 to-cyan-500 opacity-20 blur-xl transition-all group-hover:opacity-30" />
            
            <div className="relative glass-card rounded-2xl p-5 w-full max-w-[460px] overflow-hidden border-t-white/10">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider ml-1">Session-Monitor-V2</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" /> active
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Role</div>
                  <div className="text-slate-200 font-bold bg-white/[0.03] border border-white/5 px-2.5 py-1.5 rounded-lg">Staff Software Engineer (Backend)</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Profile</div>
                    <div className="text-slate-300 bg-white/[0.03] border border-white/5 px-2.5 py-1.5 rounded-lg font-semibold">Stripe Inc</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">LLM Engine</div>
                    <div className="text-slate-300 bg-white/[0.03] border border-white/5 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1">
                      <Zap size={10} className="text-violet-400" /> Gemini Pro 2.5
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Knowledge Base References</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-violet-950/20 border border-violet-800/30 text-violet-300 text-[10px] px-2 py-0.5 rounded-md font-semibold">stripe-pci-compliance.pdf</span>
                    <span className="bg-cyan-950/20 border border-cyan-800/30 text-cyan-300 text-[10px] px-2 py-0.5 rounded-md font-semibold">ledger-shard-mapping.md</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">Calculated Matching Metric</span>
                  <span className="text-xs font-black text-emerald-400">93% Alignment</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Live Simulator Dashboard */}
        <section id="simulator" className="mt-32 pt-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Test Drive the Real-Time Simulator
            </h2>
            <p className="mt-3 text-slate-400 text-sm font-medium leading-relaxed">
              Select one of the topics below to simulate how CopilotX captures live interviewer questions and streams contextual solutions.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[250px_1fr] items-start">
            
            {/* Scenario Toggles */}
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              <button
                onClick={() => setActiveScenario('system')}
                className={`flex-1 text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal shrink-0 ${activeScenario === 'system' 
                  ? 'border-violet-500/40 bg-violet-600/10 text-white shadow-inner shadow-violet-500/5' 
                  : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-white'}`}
              >
                🖥️ System Design Scenario
              </button>
              <button
                onClick={() => setActiveScenario('sql')}
                className={`flex-1 text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal shrink-0 ${activeScenario === 'sql' 
                  ? 'border-violet-500/40 bg-violet-600/10 text-white shadow-inner shadow-violet-500/5' 
                  : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-white'}`}
              >
                📊 Database Tuning Scenario
              </button>
              <button
                onClick={() => setActiveScenario('react')}
                className={`flex-1 text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal shrink-0 ${activeScenario === 'react' 
                  ? 'border-violet-500/40 bg-violet-600/10 text-white shadow-inner shadow-violet-500/5' 
                  : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-white'}`}
              >
                ⚛️ Frontend reconciler Scenario
              </button>
            </div>

            {/* Simulated Live UI console */}
            <div className="glass-card rounded-2xl overflow-hidden border-t-white/10">
              
              {/* Header bar */}
              <div className="bg-[#0b0c16] px-5 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1 h-3 items-center wave-active">
                    <span className="audio-wave-bar h-2 w-[2px]" />
                    <span className="audio-wave-bar h-4 w-[2px]" />
                    <span className="audio-wave-bar h-3 w-[2px]" />
                    <span className="audio-wave-bar h-1 w-[2px]" />
                    <span className="audio-wave-bar h-4 w-[2px]" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Audio Capture Mode
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {simulatorState === 'typing' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/40 border border-cyan-800/30 px-2.5 py-0.5 text-[10px] text-cyan-300 font-bold">
                      🎙️ Voice Transcribing...
                    </span>
                  )}
                  {simulatorState === 'thinking' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-950/40 border border-violet-800/30 px-2.5 py-0.5 text-[10px] text-violet-300 font-bold animate-pulse">
                      ⚡ AI Processing...
                    </span>
                  )}
                  {simulatorState === 'streaming' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/30 px-2.5 py-0.5 text-[10px] text-emerald-300 font-bold">
                      💡 Copilot Streaming...
                    </span>
                  )}
                  {simulatorState === 'idle' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-white/5 px-2.5 py-0.5 text-[10px] text-slate-400 font-bold">
                      ✓ Ready
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6 text-left min-h-[360px] flex flex-col justify-between">
                
                {/* Question panel */}
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Detected Audio Transcript</div>
                  <div className="text-[15px] font-semibold text-slate-100 flex items-start gap-2 bg-white/[0.02] border border-white/5 p-3 rounded-xl min-h-[50px]">
                    <span className="text-violet-400 shrink-0 font-bold text-xs uppercase bg-violet-500/10 px-1.5 py-0.5 rounded mt-0.5">INT</span>
                    <span>{questionLength > 0 ? previewScenarios[activeScenario].question.slice(0, questionLength) : <span className="text-slate-600 italic">Listening for voice signals...</span>}</span>
                  </div>
                </div>

                {/* AI response panel */}
                <div className="flex-1 flex flex-col justify-start mt-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span>AI Copilot Smart Suggestion</span>
                    {simulatorState === 'thinking' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-ping" />
                    )}
                  </div>

                  <div className="bg-[#05060d] border border-white/5 rounded-xl p-4 min-h-[220px] max-h-[350px] overflow-y-auto font-sans leading-relaxed text-sm">
                    {simulatorState === 'thinking' ? (
                      <div className="h-full flex flex-col items-center justify-center py-10 space-y-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                        <span className="text-slate-400 text-xs font-semibold animate-pulse">Contextualizing resume + target role database...</span>
                      </div>
                    ) : answerLength > 0 ? (
                      <FormattedAnswer text={previewScenarios[activeScenario].answer.slice(0, answerLength)} />
                    ) : (
                      <div className="h-full flex items-center justify-center py-10 text-slate-600 text-xs italic">
                        Waiting for speech transcription to finalize...
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* Section 3: Interactive Resume match scorer */}
        <section id="scorer" className="mt-32 pt-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Interactive Resume Alignment Scorer
            </h2>
            <p className="mt-3 text-slate-400 text-sm font-medium leading-relaxed">
              Test how well your resume matches target job roles. Select a sample profile and company below, then check alignment.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 max-w-3xl mx-auto border-t-white/10">
            <div className="grid gap-6 md:grid-cols-2 text-left">
              
              {/* Selectors */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    1. Select Candidate Profile
                  </label>
                  <select
                    value={scorerResume}
                    onChange={(e) => {
                      setScorerResume(e.target.value as any);
                      setScorerState('idle');
                    }}
                    className="w-full text-xs rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3 outline-none focus:border-violet-500/50 text-white cursor-pointer"
                  >
                    <option value="lead_fe">Senior UI Developer (React, TS, Webpack, CSS)</option>
                    <option value="staff_be">Staff backend Engineer (Go, PostgreSQL, Kafka, Redis)</option>
                    <option value="ml_eng">Machine Learning Engineer (Python, PyTorch, CUDA, LLMs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    2. Select Target Company
                  </label>
                  <select
                    value={scorerCompany}
                    onChange={(e) => {
                      setScorerCompany(e.target.value as any);
                      setScorerState('idle');
                    }}
                    className="w-full text-xs rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3 outline-none focus:border-violet-500/50 text-white cursor-pointer"
                  >
                    <option value="Google">Google (Distributed Search Optimization)</option>
                    <option value="Netflix">Netflix (High-Performance Client Application)</option>
                    <option value="Stripe">Stripe (Asynchronous API Integrations)</option>
                  </select>
                </div>

                <button
                  onClick={runResumeAnalysis}
                  disabled={scorerState === 'running'}
                  className="w-full btn-gradient py-3.5 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  {scorerState === 'running' ? (
                    <>
                      <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Parsing Stacks ({scorerProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Analyze Resume Match Alignment</span>
                    </>
                  )}
                </button>
              </div>

              {/* Progress and Score Results */}
              <div className="flex flex-col items-center justify-center p-4 border border-white/5 bg-white/[0.01] rounded-2xl relative min-h-[220px]">
                {scorerState === 'idle' && (
                  <div className="text-center text-slate-500 text-xs italic space-y-2">
                    <Target size={36} className="mx-auto text-slate-600 animate-pulse" />
                    <p>Click the button to process context parsing...</p>
                  </div>
                )}

                {scorerState === 'running' && (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative flex items-center justify-center">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#8b5cf6"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * scorerProgress) / 100}
                          className="transition-all duration-100 ease-out"
                        />
                      </svg>
                      <span className="absolute text-sm font-black text-white">{scorerProgress}%</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Running semantic parsing...</span>
                  </div>
                )}

                {scorerState === 'done' && scorerScore !== null && (
                  <div className="text-center space-y-4 animate-fadeIn">
                    <div className="relative flex items-center justify-center mx-auto">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          stroke={scorerScore >= 90 ? '#10b981' : scorerScore >= 75 ? '#3b82f6' : '#f59e0b'}
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={301.6}
                          strokeDashoffset={301.6 - (301.6 * scorerScore) / 100}
                          className="transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        />
                      </svg>
                      <span className="absolute text-xl font-black text-white">{scorerScore}%</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Match Coefficient</div>
                      <p className="text-xs leading-relaxed text-slate-300 max-w-xs px-2 mt-1">{getScorerFeedback()}</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Section 4: Grid Features */}
        <section id="features" className="mt-32 pt-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for High-Pressure Technical Rounds
            </h2>
            <p className="mt-3 text-slate-400 text-sm font-medium leading-relaxed">
              Explore the four core system components designed to feed your AI context dynamically and yield ultra-fast responses.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                title: 'Real-Time Audio Copilot',
                desc: 'Streams audio inputs seamlessly from browser tabs or your local microphone feed. Transcribes questions letter-by-letter and renders structured system charts and optimized scripts on-the-fly.',
                icon: Mic,
                acc: '1.2s avg latency',
                color: 'group-hover:text-violet-400 border-violet-500/10'
              },
              {
                title: 'Personalized Resume Engine',
                desc: 'Upload, digest, and store your career transcripts. Personalized system indexing ensures the LLM outlines answers utilizing the coding architectures, projects, and experiences in your CV.',
                icon: FileText,
                acc: 'Supports PDF, Doc, MD',
                color: 'group-hover:text-cyan-400 border-cyan-500/10'
              },
              {
                title: 'Knowledge & Prompts Base',
                desc: 'Inject reference docs, documentation APIs, corporate code manuals, and personalized prompt rules directly into the session stack. Guides model reasoning templates precisely.',
                icon: Brain,
                acc: 'Custom templates',
                color: 'group-hover:text-indigo-400 border-indigo-500/10'
              },
              {
                title: 'Voice Mock Simulator',
                desc: 'Simulate high-fidelity voice rounds with optional camera feeds. Delivers immediate grading feedback, outline analysis, query improvements, and suggested audio model structures.',
                icon: PlayCircle,
                acc: 'Local camera support',
                color: 'group-hover:text-emerald-400 border-emerald-500/10'
              }
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="glass-card rounded-2xl p-6 text-left relative group border-t-white/10">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 text-slate-300 transition-colors group-hover:bg-white/[0.06] group-hover:text-white">
                      <Icon size={20} className="transition-transform group-hover:scale-105" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-full">{f.acc}</span>
                  </div>

                  <h3 className="font-display text-[17px] font-bold text-white tracking-tight mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed font-medium">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 5: Pricing plans */}
        <section id="pricing" className="mt-32 pt-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Flexible Tiers for Any Interview Phase
            </h2>
            <p className="mt-3 text-slate-400 text-sm font-medium leading-relaxed">
              Unlock real-time streaming copilots, unlimited resume scoring, and mock assessments.
            </p>
          </div>

          {/* Pricing Period Toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={`text-xs font-bold transition-colors ${pricingPeriod === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setPricingPeriod(pricingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-800 transition-colors duration-200 ease-in-out outline-none"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${pricingPeriod === 'annual' ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-xs font-bold transition-colors flex items-center gap-1.5 ${pricingPeriod === 'annual' ? 'text-white' : 'text-slate-500'}`}>
              Annually <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Save 20%</span>
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            
            {/* Free Tier */}
            <div className="glass-card rounded-2xl p-6 text-left flex flex-col justify-between border-t-white/10 relative">
              <div>
                <h3 className="font-display text-lg font-bold text-white mb-1">Developer Basic</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Test the local audio processing setup.</p>
                
                <div className="my-6">
                  <span className="text-3xl font-black text-white">$0</span>
                  <span className="text-xs text-slate-500"> / forever</span>
                </div>

                <div className="h-px bg-white/5 mb-6" />

                <ul className="space-y-3.5 text-xs text-slate-400 font-medium">
                  <li className="flex items-center gap-2">✓ 2 audio test session runs</li>
                  <li className="flex items-center gap-2">✓ 1 local resume profile</li>
                  <li className="flex items-center gap-2">✓ Basic Markdown code rendering</li>
                  <li className="flex items-center gap-2 text-slate-600">✗ Custom developer prompts</li>
                  <li className="flex items-center gap-2 text-slate-600">✗ Realtime tab audio feed capture</li>
                </ul>
              </div>

              <button onClick={onSignIn} className="mt-8 w-full btn-glass py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer">
                Get Started
              </button>
            </div>

            {/* Pro Tier (Featured) */}
            <div className="glass-card rounded-2xl p-6 text-left flex flex-col justify-between border-violet-500/30 bg-violet-950/5 relative shadow-[0_15px_35px_rgba(124,58,237,0.12)]">
              <div className="absolute top-4 right-4 bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                Most Popular
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-white mb-1">CopilotX Pro</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">Full real-time support for active engineering loops.</p>
                
                <div className="my-6">
                  <span className="text-3xl font-black text-white">
                    ${pricingPeriod === 'annual' ? '15' : '19'}
                  </span>
                  <span className="text-xs text-slate-400"> / month</span>
                  {pricingPeriod === 'annual' && <div className="text-[9px] text-emerald-400 font-bold mt-1">Billed annually ($180)</div>}
                </div>

                <div className="h-px bg-white/5 mb-6" />

                <ul className="space-y-3.5 text-xs text-slate-300 font-medium">
                  <li className="flex items-center gap-2 text-violet-300">✓ Unlimited real-time sessions</li>
                  <li className="flex items-center gap-2">✓ Dynamic tab & desktop sound processing</li>
                  <li className="flex items-center gap-2">✓ Infinite resume indexing slots</li>
                  <li className="flex items-center gap-2">✓ Prompt injection API</li>
                  <li className="flex items-center gap-2">✓ Advanced LLM engines (Gemini/GPT)</li>
                </ul>
              </div>

              <button onClick={onSignIn} className="mt-8 w-full btn-gradient py-3 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer">
                Upgrade to Pro
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="glass-card rounded-2xl p-6 text-left flex flex-col justify-between border-t-white/10 relative">
              <div>
                <h3 className="font-display text-lg font-bold text-white mb-1">Studio Enterprise</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Enterprise grade setups with custom integrations.</p>
                
                <div className="my-6">
                  <span className="text-2xl font-black text-white">Custom Pricing</span>
                  <span className="text-xs text-slate-500"> / team quota</span>
                </div>

                <div className="h-px bg-white/5 mb-6" />

                <ul className="space-y-3.5 text-xs text-slate-400 font-medium">
                  <li className="flex items-center gap-2">✓ Shared team session history</li>
                  <li className="flex items-center gap-2">✓ Dedicated model server endpoints</li>
                  <li className="flex items-center gap-2">✓ Zero-retention data privacy guarantees</li>
                  <li className="flex items-center gap-2">✓ Custom model fine-tuning support</li>
                  <li className="flex items-center gap-2">✓ Priority SLA 24/7 technical chats</li>
                </ul>
              </div>

              <a href="mailto:support@copilotx.ai" className="mt-8 w-full btn-glass py-2.5 rounded-xl text-xs text-center font-bold text-white cursor-pointer">
                Contact Enterprise
              </a>
            </div>

          </div>
        </section>

        {/* Section 6: FAQ Accordion */}
        <section id="faq" className="mt-32 pt-8 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Queried Specifications
            </h2>
            <p className="mt-3 text-slate-400 text-sm font-medium leading-relaxed">
              Find fast responses about our localized integration patterns, custom prompts, and privacy protocols.
            </p>
          </div>

          <div className="space-y-3 text-left">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between px-6 py-4.5 font-semibold text-sm text-slate-200 hover:text-white transition-colors cursor-pointer select-none"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} className="text-violet-400" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </button>
                  
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs text-slate-400 leading-relaxed font-medium animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 7: Final Climax CTA */}
        <section className="mt-32 border-t border-white/5 pt-20 pb-10 text-center relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-white/[0.01] to-transparent">
          <div className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/5 opacity-[0.1] rounded-full blur-[110px]" />
          
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Ready to Ace Your Technical Rounds?
          </h2>
          
          <p className="text-[15px] sm:text-[17px] text-slate-400 font-medium mb-10 max-w-lg mx-auto leading-relaxed">
            Join thousands of developers utilizing context-aware live streaming copilots to clear their coding assessments.
          </p>

          <button onClick={onSignIn} className="btn-gradient inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white shadow-xl cursor-pointer">
            <span>Launch App with Google Account</span> <ArrowRight size={16} />
          </button>
        </section>

      </main>

      {/* Modern Compact Footer */}
      <footer className="border-t border-white/5 bg-[#030407] py-12 relative z-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
          
          {/* Logo brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md">
                <Bot size={13} className="text-white" />
              </div>
              <span className="font-display font-bold text-sm tracking-tight text-white">CopilotX</span>
            </div>
            <p className="leading-relaxed max-w-xs text-slate-600 font-medium">
              Real-time AI Copilot, Resume match scoring alignment, and interactive voice mock coaching frameworks.
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[10px] mb-4">Core Stacks</h4>
            <ul className="space-y-2.5 font-medium">
              <li><a href="#simulator" className="hover:text-slate-300 transition-colors">Real-time Transcript</a></li>
              <li><a href="#scorer" className="hover:text-slate-300 transition-colors">Resume Match scorecard</a></li>
              <li><a href="#features" className="hover:text-slate-300 transition-colors">Webcam Voice Trials</a></li>
              <li><a href="#pricing" className="hover:text-slate-300 transition-colors">Vite local setup</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[10px] mb-4">Company</h4>
            <ul className="space-y-2.5 font-medium">
              <li><a href="mailto:support@copilotx.ai" className="hover:text-slate-300 transition-colors">Privacy Policy</a></li>
              <li><a href="mailto:support@copilotx.ai" className="hover:text-slate-300 transition-colors">Terms of Service</a></li>
              <li><a href="mailto:support@copilotx.ai" className="hover:text-slate-300 transition-colors">Help Center</a></li>
              <li><a href="mailto:support@copilotx.ai" className="hover:text-slate-300 transition-colors">Release updates</a></li>
            </ul>
          </div>

          {/* Subscribe column */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">Updates Newsletter</h4>
            <p className="leading-relaxed text-slate-600 font-medium">Get the latest model update news directly in your inbox.</p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Subscribed! Thank you."); }} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="developer@gmail.com"
                className="w-full rounded-lg bg-slate-900 border border-white/5 px-3 py-2 outline-none focus:border-violet-500/50 text-[11px] placeholder:text-slate-600 text-white"
              />
              <button type="submit" className="btn-gradient px-3 py-2 rounded-lg text-[11px] font-bold text-white shrink-0 cursor-pointer">
                Subscribe
              </button>
            </form>
          </div>

        </div>

        <div className="max-w-6xl mx-auto px-6 border-t border-white/5 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between text-slate-600 font-medium gap-4">
          <p>© {new Date().getFullYear()} CopilotX Inc. Secure Google login enabled.</p>
          <div className="flex gap-4">
            <a href="mailto:support@copilotx.ai" className="hover:text-slate-400 transition-colors">Support</a>
            <a href="https://github.com" target="_blank" className="hover:text-slate-400 transition-colors">GitHub project</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

function Sidebar({ active, onNavigate, onLogout, showHelpChatbot }: { active: string; onNavigate: (v: string) => void; onLogout: () => void; showHelpChatbot: boolean }) {
  const keys = getCurrentUserKeys();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logOut();
    onLogout();
  };

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-white/5 bg-[#0a0b14]/75 backdrop-blur-2xl py-6 lg:flex flex-col items-start justify-between px-4 relative z-20">
      <div className="flex flex-col items-start w-full gap-8">
        <div
          onClick={() => onNavigate('Dashboard')}
          className="flex items-center gap-3 px-2 hover:opacity-80 transition-all cursor-pointer select-none"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-white leading-tight">Copilot<span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">X</span></div>
            <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Interview OS</div>
          </div>
        </div>

        <nav className="space-y-1.5 w-full">
          {nav.map((item) => {
            const Icon = item.icon;
            const selected = item.label === 'Help' ? showHelpChatbot : (active === item.screen && !showHelpChatbot);
            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.label)}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all cursor-pointer border ${selected
                  ? 'bg-violet-600/15 text-violet-300 border-violet-500/20 shadow-[inset_0_0_12px_rgba(124,58,237,0.05),0_0_20px_rgba(124,58,237,0.1)]'
                  : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/5 pt-4 w-full relative">
        <div
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-3 px-2 py-2.5 w-full cursor-pointer rounded-xl transition-all hover:bg-white/5 text-slate-400 hover:text-white"
        >
          {keys.userPhoto ? (
            <img src={keys.userPhoto} alt="Avatar" className="h-10 w-10 shrink-0 rounded-xl border border-white/10" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-black text-slate-300 border border-slate-700/50 uppercase">
              {keys.userName ? keys.userName.substring(0, 2) : 'IC'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-slate-200 truncate">{keys.userName || 'Interview Candidate'}</div>
            <div className="text-[10px] text-slate-500 truncate">{keys.userEmail || 'Free Plan'}</div>
          </div>
        </div>

        {showProfileMenu && (
          <div className="absolute bottom-16 left-0 z-30 w-full glass-card border border-white/10 p-2 shadow-2xl rounded-2xl animate-fadeIn">
            <button
              onClick={() => {
                setShowProfileMenu(false);
                onNavigate('Billing');
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer"
            >
              💳 Manage Billing
            </button>
            <div className="h-px bg-white/5 my-1" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 font-bold cursor-pointer"
            >
              🚪 Sign Out of Google
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function Topbar({
  isSessionActive,
  onStart,
  onEnd
}: {
  isSessionActive: boolean;
  onStart: () => void;
  onEnd: () => void;
}) {
  const keys = getCurrentUserKeys();
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#050609]/75 px-5 py-4 backdrop-blur-2xl lg:px-8 relative z-10">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/5 bg-[#0a0b14]/50 px-4 py-2.5 text-slate-400 md:flex focus-within:border-violet-500/40 transition-all">
          <Search size={18} className="text-slate-500" />
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600 text-white font-medium" placeholder="Search sessions, resumes, knowledge base, prompts..." />
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isSessionActive ? (
            <Button onClick={onEnd} variant="danger">
              <span className="inline-flex items-center gap-2">
                <MicOff size={18} />
                End Session
              </span>
            </Button>
          ) : (
            <Button onClick={onStart}>
              <span className="inline-flex items-center gap-2">
                <Plus size={18} />
                Start Session
              </span>
            </Button>
          )}
          <button className="relative rounded-xl border border-white/5 bg-[#0a0b14]/50 p-3 text-slate-300 hover:bg-white/5 transition-all cursor-pointer">
            <Bell size={18} /><span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          </button>
          {keys.userPhoto ? (
            <img src={keys.userPhoto} alt="Avatar" className="h-10 w-10 shrink-0 rounded-xl border border-white/10" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-slate-300 border border-slate-700/50 uppercase">
              {keys.userName ? keys.userName.substring(0, 2) : 'IC'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
interface DashboardProps {
  onStart: () => void;
  onNavigate: (v: Screen) => void;
  sessionsList: any[];
  editingId: string | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editDesc: string;
  setEditDesc: (v: string) => void;
  startEdit: (session: any) => void;
  saveEdit: (id: string) => void;
  cancelEdit: () => void;
  deleteSession: (id: string) => void;
  openDetail: (session: any) => void;
  config: SessionConfig;
}

function Dashboard({
  onStart,
  onNavigate,
  sessionsList,
  editingId,
  editTitle,
  setEditTitle,
  editDesc,
  setEditDesc,
  startEdit,
  saveEdit,
  cancelEdit,
  deleteSession,
  openDetail,
  config
}: DashboardProps) {
  const keys = getCurrentUserKeys();
  const activeResumeName = (() => {
    try {
      const saved = localStorage.getItem(keys.resumesKey);
      const list = saved ? JSON.parse(saved) : [];
      const active = list.find((r: any) => r.active);
      return active ? active.name : null;
    } catch { return null; }
  })();

  const activeDocsCount = (() => {
    try {
      const saved = localStorage.getItem(keys.docsKey);
      const list = saved ? JSON.parse(saved) : [];
      return list.filter((d: any) => d.active).length;
    } catch { return 0; }
  })();

  const readinessScore = Math.round(
    10 +
    (activeResumeName ? 30 : 0) +
    (activeDocsCount > 0 ? 30 : 0) +
    (sessionsList.length > 0 ? 30 : 0)
  );

  const dynamicContextItems = [
    { title: 'Resume', status: activeResumeName ? activeResumeName.slice(0, 22) + '…' : 'Not uploaded', score: activeResumeName ? '95%' : '0%', icon: FileText, ok: !!activeResumeName, action: () => onNavigate('Resume Intelligence') },
    { title: 'Reference Docs', status: activeDocsCount > 0 ? `${activeDocsCount} active` : 'No docs uploaded', score: activeDocsCount > 0 ? '90%' : '0%', icon: Brain, ok: activeDocsCount > 0, action: () => onNavigate('Knowledge') },
    { title: 'Session History', status: sessionsList.length > 0 ? `${sessionsList.length} sessions` : 'No sessions yet', score: sessionsList.length > 0 ? '85%' : '0%', icon: PlayCircle, ok: sessionsList.length > 0, action: () => onNavigate('Recent Sessions') },
  ];

  const features = [
    {
      title: 'Live Session',
      desc: 'Start a live session — realtime AI answers with transcript and mic capture',
      icon: Mic,
      color: 'from-violet-500/20 to-violet-600/5 border-violet-500/25 hover:border-violet-400/50',
      iconColor: 'bg-violet-500/20 text-violet-200',
      badge: 'Core Feature',
      badgeClass: 'bg-violet-500/20 text-violet-300',
      action: onStart,
    },
    {
      title: 'Resume Intelligence',
      desc: 'Upload and activate your resume so the AI answers are fully personalized to your background',
      icon: FileText,
      color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/25 hover:border-emerald-400/50',
      iconColor: 'bg-emerald-500/20 text-emerald-200',
      badge: activeResumeName ? '✓ Active' : 'Setup needed',
      badgeClass: activeResumeName ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300',
      action: () => onNavigate('Resume Intelligence'),
    },
    {
      title: 'Knowledge Base',
      desc: 'Add reference docs, build prompt templates, and write AI notes to inject context into every session',
      icon: Brain,
      color: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/25 hover:border-indigo-400/50',
      iconColor: 'bg-indigo-500/20 text-indigo-200',
      badge: activeDocsCount > 0 ? `${activeDocsCount} docs active` : 'No docs yet',
      badgeClass: activeDocsCount > 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300',
      action: () => onNavigate('Knowledge'),
    },
    {
      title: 'Recent Sessions',
      desc: 'Review past session transcripts, read AI notes, and ask follow-up questions about any session',
      icon: PlayCircle,
      color: 'from-amber-500/20 to-amber-600/5 border-amber-500/25 hover:border-amber-400/50',
      iconColor: 'bg-amber-500/20 text-amber-200',
      badge: sessionsList.length > 0 ? `${sessionsList.length} sessions` : 'No sessions yet',
      badgeClass: sessionsList.length > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-400',
      action: () => onNavigate('Recent Sessions'),
    },
  ];

  return (
    <main className="px-6 py-8 flex-1 overflow-y-auto space-y-6 relative z-10 text-left">
      
      {/* ── Welcome Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Interview Workspace
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Configure context profiles, run real-time audio transcripts, and track metrics history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('Resume Intelligence')} className="btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 cursor-pointer">
            <Plus size={14} /> Add Resume
          </button>
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left Side: Main content area (Readiness checklist + Sessions Log) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card A: Readiness & Target Info */}
          <div className="glass rounded-2xl border border-white/5 p-6 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-violet-600/10 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-[80px]" />
            
            <div className="relative flex flex-wrap md:flex-nowrap gap-6 items-center justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="emerald"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Readiness {readinessScore}%</span></Badge>
                  <Badge tone="sky">{config.type} · {config.company || 'No target'}</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Target Prep Checklist</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed max-w-lg">
                    Boost your readiness by importing your target role description, matching resumes, and practicing simulated interview speech.
                  </p>
                </div>
                
                {/* Micro Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {dynamicContextItems.map((it) => {
                    const Icon = it.icon;
                    return (
                      <div key={it.title} onClick={it.action} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:border-violet-500/20 hover:bg-violet-500/5 transition-all cursor-pointer">
                        <div className={`rounded-lg p-1.5 ${it.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-slate-900 text-slate-600 border border-transparent'}`}><Icon size={14} /></div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white leading-tight truncate">{it.title}</div>
                          <div className="text-[10px] text-slate-500 font-semibold truncate leading-normal">{it.status}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Score Circular Dial */}
              <div className="shrink-0 flex flex-col items-center justify-center p-4 border border-white/5 rounded-2xl bg-[#0a0b15]/40 backdrop-blur-md min-w-[130px]">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Readiness</div>
                <div className="relative flex items-center justify-center h-16 w-16 mb-2">
                  <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" className="text-slate-800" strokeWidth="4" stroke="currentColor" fill="transparent" />
                    <circle cx="32" cy="32" r="28" className="text-violet-500 transition-all duration-700" strokeWidth="4" strokeDasharray="175" strokeDashoffset={175 - (175 * readinessScore) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" />
                  </svg>
                  <span className="text-sm font-extrabold text-white">{readinessScore}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden w-20">
                  <div className="h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 transition-all duration-700" style={{ width: `${readinessScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Recent Sessions Logs */}
          <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-300 font-display">Recent Practice Runs</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Logs of your verbal transcripts and AI-generated answer summaries.</p>
              </div>
              <Badge tone="sky">{sessionsList.length} total</Badge>
            </div>

            {sessionsList.length > 0 ? (
              <div className="space-y-2.5">
                {sessionsList.slice(0, 3).map((s) => (
                  <div key={s.id} onClick={() => openDetail(s)} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/20 hover:bg-violet-500/5 px-4 py-3.5 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3.5">
                      <div className="h-8 w-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                        <PlayCircle size={16} />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white leading-tight group-hover:text-violet-400 transition-colors">{s.title}</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-none">{s.description} · {s.createdAt}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/5 uppercase">{s.type}</span>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
                {sessionsList.length > 3 && (
                  <button onClick={() => onNavigate('Recent Sessions')} className="w-full text-center py-2 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                    View all session reports <ArrowRight size={12} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                <PlayCircle size={32} className="text-slate-600 mb-2.5" />
                <div className="text-xs font-bold text-slate-400">No sessions recorded yet</div>
                <p className="text-[10px] text-slate-600 font-medium mt-1 text-center max-w-xs leading-normal">
                  Transcripts and AI scoring metrics will appear here once you run a session prep simulation.
                </p>
                <button onClick={onStart} className="mt-4 rounded-lg bg-violet-600/10 border border-violet-500/20 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-violet-300 hover:bg-violet-600/20 transition-all cursor-pointer">
                  Launch Live Assist
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Navigation & Feature panels */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card C: Quick Launch Center */}
          <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Navigation Launcher</h3>
            <div className="space-y-2">
              {[
                { title: 'Live Assist Console', desc: 'Realtime speech to answer logic', icon: Mic, tone: 'violet', screen: 'Live Session' as Screen, trigger: onStart },
                { title: 'Mock Voice Simulator', desc: 'Pre-defined question trials', icon: UserRound, tone: 'emerald', screen: 'Mock Interview' as Screen },
                { title: 'Resume Personalizer', desc: 'Custom role matching indexing', icon: FileText, tone: 'sky', screen: 'Resume Intelligence' as Screen },
                { title: 'Knowledge Base API', desc: 'Import custom prompts & docs', icon: Brain, tone: 'indigo', screen: 'Knowledge' as Screen },
                { title: 'Recent Transcripts', desc: 'Logs, summaries, & review notes', icon: PlayCircle, tone: 'amber', screen: 'Recent Sessions' as Screen },
              ].map((launch) => {
                const Icon = launch.icon;
                const colors: Record<string, string> = {
                  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/10 group-hover:bg-violet-500/20 group-hover:text-violet-300',
                  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10 group-hover:bg-emerald-500/20 group-hover:text-emerald-300',
                  sky: 'bg-sky-500/10 text-sky-400 border-sky-500/10 group-hover:bg-sky-500/20 group-hover:text-sky-300',
                  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10 group-hover:bg-indigo-500/20 group-hover:text-indigo-300',
                  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/10 group-hover:bg-amber-500/20 group-hover:text-amber-300'
                };
                
                return (
                  <button
                    key={launch.title}
                    onClick={() => {
                      if (launch.trigger) {
                        launch.trigger();
                      } else {
                        onNavigate(launch.screen);
                      }
                    }}
                    className="w-full flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] p-3 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 border transition-all ${colors[launch.tone]}`}><Icon size={14} /></div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors leading-tight">{launch.title}</div>
                        <div className="text-[9px] text-slate-500 font-semibold mt-0.5 leading-none">{launch.desc}</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-white transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Summary Widget */}
          <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                <div className="text-[9px] font-bold text-slate-500 uppercase leading-none">Total Runs</div>
                <div className="text-lg font-extrabold text-white mt-1 leading-none">{sessionsList.length}</div>
              </div>
              <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                <div className="text-[9px] font-bold text-slate-500 uppercase leading-none">Resumes</div>
                <div className="text-lg font-extrabold text-white mt-1 leading-none">{activeResumeName ? '1' : '0'}</div>
              </div>
              <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                <div className="text-[9px] font-bold text-slate-500 uppercase leading-none">Prompt Docs</div>
                <div className="text-lg font-extrabold text-white mt-1 leading-none">{activeDocsCount}</div>
              </div>
              <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl col-span-1">
                <div className="text-[9px] font-bold text-slate-500 uppercase leading-none">Readiness</div>
                <div className="text-sm font-extrabold text-emerald-400 mt-1 leading-none">{readinessScore}%</div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </main>
  );
}


function AppChoiceModal({ open, onClose, onContinueWeb }: { open: boolean; onClose: () => void; onContinueWeb: () => void }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleOpenDesktop = () => {
    window.location.href = "copilotx://start-session";
    alert("🔗 Trying to open CopilotX Desktop App...\n\nIf the app doesn't open, make sure you have the Desktop Client installed. You can download the latest bundle from the Releases page.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] md:p-10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/20 mb-4">
            <MonitorPlay size={28} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Choose Your Experience</h2>
          <p className="mt-2 text-sm text-slate-400">Select how you want to run your interview assist session</p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Desktop App */}
          <div 
            onClick={handleOpenDesktop}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-violet-500/30 bg-violet-600/5 hover:bg-violet-600/10 p-6 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer hover:shadow-[0_15px_30px_rgba(139,92,246,0.15)]"
          >
            <div className="absolute top-4 right-4 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-black uppercase px-2.5 py-0.5 tracking-wider">
              Recommended
            </div>
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/25 text-violet-300 group-hover:scale-110 transition-transform">
                <Laptop size={24} />
              </div>
              <h3 className="text-lg font-black text-white">Desktop Application</h3>
              <p className="mt-2 text-xs text-slate-400 leading-5">
                Captures system audio, tab sound, and microphone feeds directly from your desktop. Bypasses all browser security constraints.
              </p>
            </div>
            <div className="mt-6">
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenDesktop(); }}
                className="w-full rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-3 px-4 shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Open in Desktop</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 2: Web Browser */}
          <div 
            onClick={onContinueWeb}
            className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-6 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer hover:border-white/10 hover:shadow-[0_15px_30px_rgba(255,255,255,0.03)]"
          >
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-300 group-hover:scale-110 transition-transform">
                <Globe size={24} />
              </div>
              <h3 className="text-lg font-black text-white">Continue in Web</h3>
              <p className="mt-2 text-xs text-slate-400 leading-5">
                Run the interview helper right here in this browser tab. Relies on manual browser screen/tab sharing controls.
              </p>
            </div>
            <div className="mt-6">
              <button 
                onClick={(e) => { e.stopPropagation(); onContinueWeb(); }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 px-4 transition-all"
              >
                Continue in Web
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-[10px] text-center text-slate-500 leading-relaxed mt-6">
          🔒 Running CopilotX is secure. For the best performance and to capture browser/app sound cards seamlessly, we recommend using the desktop app.
        </p>

      </div>
    </div>
  );
}


function StartSessionWizard({ open, onClose, onLaunch }: { open: boolean; onClose: () => void; onLaunch: (c: SessionConfig) => void }) {
  const keys = getCurrentUserKeys();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const [c, setC] = useState<SessionConfig>(() => {
    let initialResumeId = '';
    try {
      const saved = localStorage.getItem(keys.resumesKey);
      const list = saved ? JSON.parse(saved) : [];
      const active = list.find((r: any) => r.active) || list[0];
      if (active) initialResumeId = active.id;
    } catch (e) { }
    return { ...defaultConfig, selectedResumeId: initialResumeId };
  });

  const [resumeScore, setResumeScore] = useState<number | null>(null);
  const [resumeScoreError, setResumeScoreError] = useState<string | null>(null);
  const [scoringResume, setScoringResume] = useState(false);
  const [autoAnswer, setAutoAnswer] = useState(false);
  const [saveTranscript, setSaveTranscript] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const resumeFileInputRef = useRef<HTMLInputElement>(null);

  const [resumes, setResumes] = useState<any[]>(() => {
    const saved = localStorage.getItem(keys.resumesKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [docs, setDocs] = useState<any[]>(() => {
    const saved = localStorage.getItem(keys.docsKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [prompts, setPrompts] = useState<any[]>(() => {
    const saved = localStorage.getItem(keys.promptsKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [sessions, setSessions] = useState<any[]>(() => {
    const saved = localStorage.getItem(keys.sessionsKey);
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [openDocModal, setOpenDocModal] = useState(false);
  const [openPromptModal, setOpenPromptModal] = useState(false);
  const [openSessionModal, setOpenSessionModal] = useState(false);

  const resumeOptions = [
    ...resumes.map(r => ({ value: r.id, label: r.name, sublabel: `${r.size || ''} | ${r.uploadDate || ''}` })),
    { value: 'add_from_computer', label: '📂 Upload resume...' }
  ];
  const docOptions = [
    { value: '', label: 'None' },
    ...docs.map(d => ({ value: d.id, label: d.name, sublabel: `${d.size || ''}` })),
    { value: 'add_from_computer', label: '📂 Upload document...' }
  ];

  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Sync resources from DB on mount
  useEffect(() => {
    if (keys.userId) {
      // Fetch resumes
      fetch(`${API_BASE}/api/resumes?user_id=${keys.userId}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (data && data.length > 0) {
            setResumes(prev => {
              const merged = data.map((dbRes: any) => {
                const local = prev.find(r => r.id === dbRes.id || r.name === dbRes.file_name);
                return {
                  id: dbRes.id,
                  name: dbRes.file_name,
                  active: local ? local.active : dbRes.is_active,
                  size: local ? local.size : '150 KB',
                  uploadDate: local ? local.uploadDate : 'Previously uploaded',
                  parsed_content: dbRes.parsed_content
                };
              });
              localStorage.setItem(keys.resumesKey, JSON.stringify(merged));
              return merged;
            });
          }
        }).catch(err => console.error("Failed to fetch resumes:", err));

      // Fetch knowledge docs & prompts
      fetch(`${API_BASE}/api/knowledge?user_id=${keys.userId}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (data && data.length > 0) {
            const backendDocs = data.filter((item: any) => item.document_type !== 'prompt');
            const backendPrompts = data.filter((item: any) => item.document_type === 'prompt');

            if (backendDocs.length > 0) {
              const formattedDocs = backendDocs.map((d: any) => ({
                id: d.id,
                name: d.document_name,
                content: d.content,
                active: true,
                size: d.content ? `${(d.content.length / 1024).toFixed(0)} KB` : '1 KB',
                uploadDate: 'Previously uploaded'
              }));
              setDocs(formattedDocs);
              localStorage.setItem(keys.docsKey, JSON.stringify(formattedDocs));
            }
            if (backendPrompts.length > 0) {
              const formattedPrompts = backendPrompts.map((p: any) => ({
                id: p.id,
                title: p.document_name,
                content: p.content,
                uploadDate: 'Previously uploaded'
              }));
              setPrompts(formattedPrompts);
              localStorage.setItem(keys.promptsKey, JSON.stringify(formattedPrompts));
            }
          }
        }).catch(err => console.error("Failed to fetch knowledge:", err));

      // Fetch recent sessions
      fetch(`${API_BASE}/api/sessions?user_id=${keys.userId}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (data && data.length > 0) {
            const formatDuration = (seconds: number) => {
              if (!seconds || seconds <= 0) return '0:00';
              const m = Math.floor(seconds / 60);
              const s = seconds % 60;
              return `${m}:${s.toString().padStart(2, '0')}`;
            };
            const formatted = data.map((s: any) => ({
              id: s.id,
              title: s.session_name ? (s.session_name.includes(' (') ? s.session_name.split(' (')[0] : s.session_name) : 'Practice Session',
              description: s.role_name ? `${s.role_name}${s.company_name ? ` (${s.company_name})` : ''}` : (s.company_name ? `Mock Prep Session with ${s.company_name}` : 'Practice Session'),
              company: s.company_name || '',
              type: s.session_name && s.session_name.includes('Coding Test') ? 'Coding Test' : (s.session_name && s.session_name.includes('HR Round') ? 'HR Round' : 'Interview+Coding'),
              duration: formatDuration(s.duration_seconds),
              aiUsage: s.ai_usage || 0,
              summary: s.summary || '',
              createdAt: new Date(s.created_at + (s.created_at.endsWith('Z') ? '' : 'Z')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              transcript: [],
              notes: s.summary ? [{ id: 'sum_' + s.id, title: 'Session Summary', text: s.summary }] : [
                { id: 'sum_def_' + s.id, title: 'Session Summary', text: `Mock Prep Session with ${s.company_name || 'Target Company'} for ${s.role_name || 'Software Engineer'}.` }
              ]
            }));
            setSessions(formatted);
            localStorage.setItem(keys.sessionsKey, JSON.stringify(formatted));
          }
        }).catch(err => console.error("Failed to fetch sessions:", err));
    }
  }, [keys.userId]);

  const scoreResume = async (resumeId: string, jd: string, directText?: string) => {
    if (!resumeId) { setResumeScore(null); setResumeScoreError(null); return; }
    setScoringResume(true);
    setResumeScore(null);
    setResumeScoreError(null);
    try {
      const resume = resumes.find(r => r.id === resumeId);
      const textContent = directText || resume?.parsed_content;
      if (!textContent) {
        setResumeScoreError("No parsed resume content found. Please upload or parse a resume first.");
        return;
      }
      const res = await fetch(`${API_BASE}/api/answers/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_content: textContent,
          jd_content: jd,
          role: c.role,
          company: c.company,
          model: c.model
        })
      });
      if (res.ok) {
        const data = await res.json();
        const raw = (data.answer || '').replace(/[^0-9]/g, '');
        const score = parseInt(raw, 10);
        if (isNaN(score)) {
          setResumeScoreError("API returned non-numeric match score.");
        } else {
          setResumeScore(Math.min(100, Math.max(0, score)));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setResumeScoreError(errData.detail || "API Key error or LLM call failed.");
      }
    } catch (e: any) {
      setResumeScoreError(e?.message || "Network error. Failed to reach backend.");
    } finally {
      setScoringResume(false);
    }
  };

  const handleResumeChange = (val: string) => {
    if (val === 'add_from_computer') { resumeFileInputRef.current?.click(); return; }
    setC(prev => ({ ...prev, selectedResumeId: val }));
    const resume = resumes.find(r => r.id === val);
    scoreResume(val, c.jd, resume?.parsed_content);
  };

  const handleDocChange = (val: string) => {
    if (val === 'add_from_computer') { docFileInputRef.current?.click(); return; }
    setC(prev => ({ ...prev, selectedDocId: val }));
  };

  const handleResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);
    if (keys.userId) {
      formData.append('user_id', keys.userId);
    }

    try {
      setScoringResume(true);
      setResumeScore(null);
      setResumeScoreError(null);

      const uploadRes = await fetch(`${API_BASE}/api/resumes/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(errText || `Failed to upload/parse resume: ${uploadRes.statusText}`);
      }

      const dbResume = await uploadRes.json();
      const id = dbResume.id || ('r_' + Date.now());
      const parsedText = dbResume.parsed_content || '';

      const newR = {
        id,
        name: file.name,
        active: true,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        uploadDate: 'Just now',
        parsed_content: parsedText
      };

      setResumes(prev => {
        const u = prev.map(r => ({ ...r, active: false }));
        const list = [...u, newR];
        localStorage.setItem(keys.resumesKey, JSON.stringify(list));
        return list;
      });

      setC(prev => ({ ...prev, selectedResumeId: id }));
      scoreResume(id, c.jd, parsedText);

    } catch (err: any) {
      console.error(err);
      setResumeScoreError(err?.message || "Failed to upload and parse resume.");
    } finally {
      setScoringResume(false);
      e.target.value = '';
    }
  };

  const handleDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', 'document');
    if (keys.userId) {
      formData.append('user_id', keys.userId);
    }

    try {
      const res = await fetch(`${API_BASE}/api/knowledge/upload`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error("Failed to upload document");
      const data = await res.json();

      const id = data.id || ('d_' + Date.now());
      const parsedText = data.content || '';
      
      const newD = {
        id,
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        uploadDate: 'Just now',
        content: parsedText,
        active: true
      };

      setDocs(prev => {
        const list = [...prev, newD];
        localStorage.setItem(keys.docsKey, JSON.stringify(list));
        return list;
      });
      setC(prev => ({ ...prev, selectedDocId: id }));
    } catch (err) {
      console.error("Doc upload failed:", err);
      alert("Failed to upload and parse document.");
    } finally {
      e.target.value = '';
    }
  };


  const handleLaunch = () => {
    if (!c.company.trim()) { setError('Company name is required.'); return; }
    if (!c.role.trim()) { setError('Target role is required.'); return; }
    setError('');
    onLaunch({ ...c, useResume: !!c.selectedResumeId, useDocuments: !!c.selectedDocId, autoAnswer: autoAnswer, saveTranscript: saveTranscript });
  };

  if (!open) return null;

  const selectedResume = resumes.find(r => r.id === c.selectedResumeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[2rem] border border-white/5 bg-[#07080e]/95 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-3xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#07080e]/95 px-6 py-4">
          <div>
            <h2 className="text-base font-black text-white">Start Live Session</h2>
            <p className="text-[11px] text-slate-500">Configure your session, context, and options.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all"><X size={18} /></button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-5">
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.02] border border-white/5 px-4 py-3.5">
            {[1, 2, 3].map(s => {
              const active = step === s;
              const completed = step > s;
              return (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${active ? 'bg-violet-600 text-white ring-4 ring-violet-500/20' :
                      completed ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500 border border-white/10'
                      }`}>
                      {completed ? '✓' : s}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${active ? 'text-violet-400' : completed ? 'text-emerald-400' : 'text-slate-600'
                      }`}>
                      {s === 1 ? 'Job Details' : s === 2 ? 'Context' : 'AI Options'}
                    </span>
                  </div>
                  {s < 3 && <div className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${step > s ? 'bg-emerald-500' : 'bg-white/5'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* STEP 1 — Job Details */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Session Type</p>
                <div className="grid grid-cols-4 gap-2">
                  {sessionTypes.map(s => {
                    const Icon = s.icon;
                    const selected = c.type === s.label;
                    return (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setC({ ...c, type: s.label as SessionType })}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all ${selected ? 'border-violet-500/50 bg-violet-500/15 text-violet-200' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white'
                          }`}
                      >
                        <Icon size={18} />
                        <span className="text-xs font-bold">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                    Company <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={c.company}
                    onChange={e => setC({ ...c, company: e.target.value })}
                    placeholder="e.g. Amazon, Google..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500/60 placeholder:text-slate-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                    Target Role <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={c.role}
                    onChange={e => setC({ ...c, role: e.target.value })}
                    placeholder="e.g. Senior SDE, Data Engineer..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500/60 placeholder:text-slate-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                  Job Description <span className="text-slate-600 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={c.jd}
                  onChange={e => setC({ ...c, jd: e.target.value })}
                  onBlur={() => { if (c.selectedResumeId) scoreResume(c.selectedResumeId, c.jd); }}
                  rows={4}
                  placeholder="Paste the JD to personalize AI answers and score your resume match..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white outline-none focus:border-violet-500/60 placeholder:text-slate-600 transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 2 — Context Sources */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Context Sources</p>
                <input type="file" ref={resumeFileInputRef} onChange={handleResumeFile} accept=".pdf,.doc,.docx,.txt" className="hidden" />
                <input type="file" ref={docFileInputRef} onChange={handleDocFile} accept=".pdf,.doc,.docx,.txt,.md" className="hidden" />

                <div className="grid grid-cols-2 gap-3 items-start">
                  {/* Resume */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                      <FileText size={13} className="text-violet-400" /> Resume
                    </label>
                    <CustomSelect
                      value={c.selectedResumeId}
                      onChange={handleResumeChange}
                      options={resumeOptions}
                      placeholder="-- Select Resume --"
                      icon={FileText}
                    />
                    {/* Resume JD Score */}
                    {c.selectedResumeId && (
                      <div className="mt-1">
                        {scoringResume ? (
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <div className="h-3 w-3 animate-spin rounded-full border border-violet-500 border-t-transparent" />
                            Scoring resume vs JD...
                          </div>
                        ) : resumeScore !== null ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-semibold">Resume × JD Match</span>
                              <span className={`font-black ${resumeScore >= 80 ? 'text-emerald-400' : resumeScore >= 60 ? 'text-amber-400' : 'text-red-400'
                                }`}>{resumeScore}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800">
                              <div
                                className={`h-1.5 rounded-full transition-all ${resumeScore >= 80 ? 'bg-emerald-500' : resumeScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                style={{ width: `${resumeScore}%` }}
                              />
                            </div>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const resume = resumes.find(r => r.id === c.selectedResumeId);
                                  scoreResume(c.selectedResumeId, c.jd, resume?.parsed_content);
                                }}
                                className="text-[9px] text-violet-400 hover:text-violet-300 transition-all cursor-pointer mt-1"
                              >
                                🔄 Recalculate Score
                              </button>
                            </div>
                          </div>
                        ) : resumeScoreError ? (
                          <div className="space-y-1">
                            <p className="text-[10px] text-rose-400 font-semibold leading-relaxed">
                              ⚠️ {resumeScoreError}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                const resume = resumes.find(r => r.id === c.selectedResumeId);
                                scoreResume(c.selectedResumeId, c.jd, resume?.parsed_content);
                              }}
                              className="text-[9px] text-violet-400 hover:text-violet-300 underline cursor-pointer mt-1 block"
                            >
                              Retry Scoring
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const resume = resumes.find(r => r.id === c.selectedResumeId);
                              scoreResume(c.selectedResumeId, c.jd, resume?.parsed_content);
                            }}
                            className="text-[10px] text-violet-400 hover:text-violet-300 underline cursor-pointer"
                          >Score resume vs JD</button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add Button & Popover */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-3 flex flex-col justify-center items-center min-h-[96px]">
                    <label className="text-[11px] font-bold text-slate-400">Additional Context</label>
                    <div className="relative inline-block w-full text-center">
                      <button
                        type="button"
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all select-none cursor-pointer"
                      >
                        <Plus size={14} className="text-violet-400" /> Add Context Source
                      </button>

                      {showAddMenu && (
                        <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 z-20 w-48 rounded-xl border border-white/10 bg-slate-900 p-1.5 shadow-xl space-y-0.5 animate-fadeIn">
                          <button
                            type="button"
                            onClick={() => { setShowAddMenu(false); setOpenDocModal(true); }}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                          >
                            <Brain size={12} className="text-cyan-400" /> Reference Doc
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddMenu(false); setOpenPromptModal(true); }}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                          >
                            <NotebookPen size={12} className="text-amber-400" /> Custom System Prompt
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddMenu(false); setOpenSessionModal(true); }}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                          >
                            <PlayCircle size={12} className="text-emerald-400" /> Previous Session
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedResume && (
                  <p className="mt-2 text-[10px] text-slate-500 pl-1">
                    📄 {selectedResume.name} · {selectedResume.size}
                  </p>
                )}

                {/* Display Selected Context Items below Resume */}
                {(c.selectedDocId || c.selectedPromptId || c.selectedSessionId) && (
                  <div className="mt-4 space-y-2 border-t border-white/5 pt-3 animate-fadeIn">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Active Context Sources</p>

                    {c.selectedDocId && (() => {
                      const docItem = docs.find(d => d.id === c.selectedDocId);
                      return (
                        <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 text-cyan-200">
                            <Brain size={13} />
                            <span className="font-semibold truncate max-w-[200px]">{docItem?.name || "Selected Reference Doc"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setOpenDocModal(true)} className="text-[10px] text-cyan-400 hover:underline cursor-pointer">Edit</button>
                            <button type="button" onClick={() => setC(prev => ({ ...prev, selectedDocId: '' }))} className="text-slate-500 hover:text-red-400 cursor-pointer"><X size={12} /></button>
                          </div>
                        </div>
                      );
                    })()}

                    {c.selectedPromptId && (() => {
                      const promptItem = prompts.find(p => p.id === c.selectedPromptId);
                      return (
                        <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 text-amber-200">
                            <NotebookPen size={13} />
                            <span className="font-semibold truncate max-w-[200px]">{promptItem?.title || "Custom Prompt"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setOpenPromptModal(true)} className="text-[10px] text-amber-400 hover:underline cursor-pointer">Edit</button>
                            <button type="button" onClick={() => setC(prev => ({ ...prev, selectedPromptId: '' }))} className="text-slate-500 hover:text-red-400 cursor-pointer"><X size={12} /></button>
                          </div>
                        </div>
                      );
                    })()}

                    {c.selectedSessionId && (() => {
                      const sessionItem = sessions.find(s => s.id === c.selectedSessionId);
                      return (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 text-emerald-200">
                            <PlayCircle size={13} />
                            <span className="font-semibold truncate max-w-[200px]">{sessionItem?.title || `${sessionItem?.type || "Past"} Session`}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setOpenSessionModal(true)} className="text-[10px] text-emerald-400 hover:underline cursor-pointer">Edit</button>
                            <button type="button" onClick={() => setC(prev => ({ ...prev, selectedSessionId: '' }))} className="text-slate-500 hover:text-red-400 cursor-pointer"><X size={12} /></button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 — AI Configuration */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                  AI Model Selection
                </label>
                <CustomSelect
                  value={c.model}
                  onChange={val => setC({ ...c, model: val })}
                  options={modelOptions}
                  placeholder="-- Select Model --"
                  icon={Cpu}
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Session Options</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${autoAnswer ? 'border-violet-500/40 bg-violet-500/10' : 'border-white/10 bg-white/[0.02]'
                    }`}>
                    <div>
                      <div className="text-xs font-bold text-white">Auto Answer</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">AI answers automatically when question detected</div>
                    </div>
                    <div
                      onClick={() => setAutoAnswer(!autoAnswer)}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${autoAnswer ? 'bg-violet-600' : 'bg-slate-700'
                        }`}
                    >
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${autoAnswer ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                    </div>
                  </label>

                  <label className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${saveTranscript ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/[0.02]'
                    }`}>
                    <div>
                      <div className="text-xs font-bold text-white">Save Transcript</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Store full Q&A transcript after session ends</div>
                    </div>
                    <div
                      onClick={() => setSaveTranscript(!saveTranscript)}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${saveTranscript ? 'bg-emerald-600' : 'bg-slate-700'
                        }`}
                    >
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${saveTranscript ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-1">
            {step === 1 && (
              <>
                <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button className="flex-1" onClick={() => {
                  if (!c.company.trim()) { setError('Company name is required.'); return; }
                  if (!c.role.trim()) { setError('Target role is required.'); return; }
                  setError('');
                  setStep(2);
                }}>Next Step →</Button>
              </>
            )}
            {step === 2 && (
              <>
                <Button variant="secondary" className="flex-1" onClick={() => { setError(''); setStep(1); }}>← Back</Button>
                <Button className="flex-1" onClick={() => { setError(''); setStep(3); }}>Next Step →</Button>
              </>
            )}
            {step === 3 && (
              <>
                <Button variant="secondary" className="flex-1" onClick={() => { setError(''); setStep(2); }}>← Back</Button>
                <Button className="flex-1" onClick={handleLaunch}>
                  <span className="flex items-center gap-2"><Mic size={15} /> Launch Session →</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Popup modals for context items */}
      {openDocModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0a0d24] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Brain size={15} className="text-cyan-400" /> Select Reference Document
              </h3>
              <button type="button" onClick={() => setOpenDocModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <CustomSelect
                value={c.selectedDocId}
                onChange={(val) => {
                  if (val === 'add_from_computer') {
                    docFileInputRef.current?.click();
                    setOpenDocModal(false);
                  } else {
                    setC(prev => ({ ...prev, selectedDocId: val }));
                  }
                }}
                options={docOptions}
                placeholder="-- Select Document --"
                icon={Brain}
              />
              <p className="text-[10px] text-slate-500">
                Upload reference architecture, style guide, or cheat sheets to inject into the AI context.
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" className="px-4 py-2 text-xs" onClick={() => setOpenDocModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {openPromptModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0a0d24] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <NotebookPen size={15} className="text-amber-400" /> Custom System Prompt
              </h3>
              <button type="button" onClick={() => setOpenPromptModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <CustomSelect
                value={c.selectedPromptId}
                onChange={(val) => {
                  setC(prev => ({ ...prev, selectedPromptId: val }));
                }}
                options={[
                  { value: '', label: 'None' },
                  ...prompts.map(p => ({ value: p.id, label: p.title, sublabel: p.content ? (p.content.slice(0, 40) + '...') : '' }))
                ]}
                placeholder="-- Select Custom Prompt --"
                icon={NotebookPen}
              />
              <p className="text-[10px] text-slate-500">
                Select a saved prompt template from your Knowledge base to steer the AI's behavior and tone.
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" className="px-4 py-2 text-xs" onClick={() => setOpenPromptModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {openSessionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0a0d24] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <PlayCircle size={15} className="text-emerald-400" /> Select Previous Session
              </h3>
              <button type="button" onClick={() => setOpenSessionModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <CustomSelect
                value={c.selectedSessionId}
                onChange={(val) => {
                  setC(prev => ({ ...prev, selectedSessionId: val }));
                }}
                options={[
                  { value: '', label: 'None' },
                  ...sessions.map(s => ({ value: s.id, label: s.title || `${s.type}`, sublabel: `${s.company} | ${s.createdAt || ''}` }))
                ]}
                placeholder="-- Select Past Session --"
                icon={PlayCircle}
              />
              <p className="text-[10px] text-slate-500">
                Inject previous Q&A transcripts and notes from a past session to maintain continuity.
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" className="px-4 py-2 text-xs" onClick={() => setOpenSessionModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Keep old component stubs to avoid breaking references (not rendered anymore)
function WizardSession({ c, setC }: { c: SessionConfig; setC: (c: SessionConfig) => void }) { return <div />; }
function WizardContext({ c, setC }: { c: SessionConfig; setC: React.Dispatch<React.SetStateAction<SessionConfig>> }) { return <div />; }
function WizardBehavior({ c, setC }: { c: SessionConfig; setC: (c: SessionConfig) => void }) { return <div />; }
function WizardReview({ c }: { c: SessionConfig }) { return <div />; }


interface RecentSessionsPageProps {
  sessionsList: any[];
  editingId: string | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editDesc: string;
  setEditDesc: (v: string) => void;
  startEdit: (session: any) => void;
  saveEdit: (id: string) => void;
  cancelEdit: () => void;
  deleteSession: (id: string) => void;
  openDetail: (session: any) => void;
}

interface RecentSessionsTableProps {
  sessionsList: any[];
  editingId: string | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editDesc: string;
  setEditDesc: (v: string) => void;
  startEdit: (session: any) => void;
  saveEdit: (id: string) => void;
  cancelEdit: () => void;
  deleteSession: (id: string) => void;
  openDetail: (session: any) => void;
}

function RecentSessionsTable({
  sessionsList,
  editingId,
  editTitle,
  setEditTitle,
  editDesc,
  setEditDesc,
  startEdit,
  saveEdit,
  cancelEdit,
  deleteSession,
  openDetail
}: RecentSessionsTableProps) {
  const getIconForType = (type: SessionType) => {
    switch (type) {
      case 'Interview': return Briefcase;
      case 'Coding': return Code2;
      case 'HR': return UserRound;
      default: return Briefcase;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-wider text-slate-500">
            <th className="pb-3 pr-4">Title</th>
            <th className="pb-3 pr-4">Description</th>
            <th className="pb-3 pr-4">Mode</th>
            <th className="pb-3 pr-4">Duration</th>
            <th className="pb-3 pr-4">AI Usage</th>
            <th className="pb-3 pr-4">Created At</th>
            <th className="pb-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-sm text-slate-300">
          {sessionsList.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">No recent sessions found.</td>
            </tr>
          ) : (
            sessionsList.map(s => {
              const ModeIcon = getIconForType(s.type);
              const isEditing = editingId === s.id;
              return (
                <tr key={s.id} className="hover:bg-white/[0.01]">
                  <td className="py-3.5 pr-4 font-bold text-white max-w-[120px] truncate">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full text-xs rounded-lg border border-violet-500/30 bg-slate-950 px-2 py-1 outline-none text-white focus:border-violet-500"
                      />
                    ) : s.title}
                  </td>
                  <td className="py-3.5 pr-4 text-xs text-slate-400 max-w-[160px] truncate" title={s.description}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        className="w-full text-xs rounded-lg border border-violet-500/30 bg-slate-950 px-2 py-1 outline-none text-white focus:border-violet-500"
                      />
                    ) : s.description}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-800 px-2 py-1 rounded-xl">
                      <ModeIcon size={10} className="text-violet-300" />
                      {s.type}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-xs">
                    <Badge tone="violet">{s.duration || s.endsIn || '0:00'}</Badge>
                  </td>
                  <td className="py-3.5 pr-4 text-xs font-bold pl-3">
                    {s.aiUsage}
                  </td>
                  <td className="py-3.5 pr-4 text-xs text-slate-500">
                    {s.createdAt}
                  </td>
                  <td className="py-3.5 text-right whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => saveEdit(s.id)}
                          className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all"
                          title="Save changes"
                        >
                          <CheckCircle2 size={13} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5 transition-all"
                          title="Cancel editing"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openDetail(s)}
                          className="p-1.5 rounded-lg bg-violet-600/20 text-violet-300 hover:bg-violet-600 hover:text-white border border-violet-500/20 transition-all"
                          title="View details & transcript"
                        >
                          <Library size={13} />
                        </button>
                        <button
                          onClick={() => startEdit(s)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-white/5 transition-all"
                          title="Edit details"
                        >
                          <NotebookPen size={13} />
                        </button>
                        <button
                          onClick={() => deleteSession(s.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                          title="Delete session"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}


function MockInterview({
  isSessionActive,
  setIsSessionActive,
  sessionQuestions,
  setSessionQuestions,
  currentQuestion,
  setCurrentQuestion,
  userAnswer,
  setUserAnswer,
  feedback,
  setFeedback,
  suggestedAnswer,
  setSuggestedAnswer,
  company,
  setCompany,
  role,
  setRole,
  interviewType,
  setInterviewType,
  jd,
  setJd,
  sessionTime,
  setSessionTime,
  model,
  setModel
}: {
  isSessionActive: boolean;
  setIsSessionActive: (active: boolean) => void;
  sessionQuestions: Array<{
    question: string;
    answer: string;
    feedback: string;
    suggested: string;
  }>;
  setSessionQuestions: React.Dispatch<React.SetStateAction<Array<{
    question: string;
    answer: string;
    feedback: string;
    suggested: string;
  }>>>;
  currentQuestion: string;
  setCurrentQuestion: (q: string) => void;
  userAnswer: string;
  setUserAnswer: (a: string) => void;
  feedback: string;
  setFeedback: (f: string) => void;
  suggestedAnswer: string;
  setSuggestedAnswer: (s: string) => void;
  company: string;
  setCompany: (c: string) => void;
  role: string;
  setRole: (r: string) => void;
  interviewType: 'Behavioral' | 'Technical' | 'Coding' | 'SQL' | 'System Design' | 'HR' | 'Mixed';
  setInterviewType: (t: 'Behavioral' | 'Technical' | 'Coding' | 'SQL' | 'System Design' | 'HR' | 'Mixed') => void;
  jd: string;
  setJd: (j: string) => void;
  sessionTime: number;
  setSessionTime: (t: number) => void;
  model: string;
  setModel: (m: string) => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [viewingSession, setViewingSession] = useState<any | null>(null);

  const keys = getCurrentUserKeys();
  const mockInterviewsKey = keys.userId ? `user-mock-interviews-${keys.userId}` : 'user-mock-interviews';

  const [sessions, setSessions] = useState<any[]>(() => {
    const saved = localStorage.getItem(mockInterviewsKey);
    return saved ? JSON.parse(saved) : [];
  });

  const mic = useDeepgramAudio();
  const baseAnswerRef = useRef('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(mockInterviewsKey);
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading mock interviews:", e);
      }
    }
  }, [mockInterviewsKey]);

  const saveSessions = (updated: any[]) => {
    setSessions(updated);
    localStorage.setItem(mockInterviewsKey, JSON.stringify(updated));
  };

  useEffect(() => {
    let localStream: MediaStream | null = null;
    if (isSessionActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          localStream = stream;
          setWebcamStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(err => console.error("Error playing webcam video:", err));
          }
        })
        .catch(err => {
          console.warn("Webcam access not allowed or unavailable:", err);
        });
    }
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isSessionActive]);

  const handleUserAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserAnswer(e.target.value);
    baseAnswerRef.current = e.target.value;
  };

  const startMic = () => {
    baseAnswerRef.current = userAnswer;
    mic.start(
      MIC_CONSTRAINTS,
      (text, isFinal) => {
        const combined = baseAnswerRef.current ? (baseAnswerRef.current.trim() + ' ' + text) : text;
        setUserAnswer(combined);
        if (isFinal) {
          baseAnswerRef.current = combined;
        }
      }
    );
  };

  const mockQuestionBank: Record<string, string[]> = {
    Behavioral: [
      'Tell me about a time you handled a production issue.',
      'Describe a situation where you disagreed with a teammate.',
      'Tell me about a time you had to learn a new technology quickly.',
      'How do you handle prioritization when working on multiple high-priority tasks?'
    ],
    Technical: [
      'Explain Redis caching strategy and when you would use it.',
      'What is the difference between synchronous and asynchronous communication?',
      'How would you reduce latency in a realtime WebSocket application?',
      'What is the difference between SQL and NoSQL databases, and how do you choose?'
    ],
    Coding: [
      'Write an optimal solution for Two Sum.',
      'Find the longest substring without repeating characters.',
      'Merge overlapping intervals.',
      'Design a data structure that supports insert, delete, and getRandom in O(1) time.'
    ],
    SQL: [
      'Write a SQL query to find duplicate records in a table.',
      'How would you optimize a slow SQL query?',
      'Explain the difference between RANK, DENSE_RANK, and ROW_NUMBER.',
      'How would you design a schema and query to track user logins and find active users?'
    ],
    'System Design': [
      'Design a scalable URL shortener.',
      'Design a notification system.',
      'Design a rate limiter for an API.',
      'Design a distributed message queue like Kafka.'
    ],
    HR: [
      'Why do you want to join this company?',
      'What are your salary expectations?',
      'Why are you looking for a change?',
      'Where do you see yourself in 5 years?'
    ],
    Mixed: [
      'Tell me about yourself and your recent project experience.',
      'How would you design a scalable notification system?',
      'How would you optimize a slow SQL query?',
      'Tell me about a time you solved a difficult production issue.',
      'Write an optimal solution for Two Sum.'
    ]
  };

  const startMockInterview = () => {
    setIsSessionActive(true);
    setShowSetup(false);
    setSessionQuestions([]);
    setCurrentQuestion(`Hello! Welcome to your mock interview at ${company || 'your target company'} for the ${role || 'target'} role. To get started, please introduce yourself and walk me through your background and recent project experience.`);
    setUserAnswer('');
    setFeedback('');
    setSuggestedAnswer('');
  };

  const generateFeedback = async () => {
    if (!userAnswer.trim()) {
      setFeedback('Please write or speak your answer first. Then click Submit Answer.');
      return;
    }

    setIsGenerating(true);
    setFeedback('AI is evaluating your response...');
    setSuggestedAnswer('');

    const backendHistory = sessionQuestions.map(q => ({
      question: q.question,
      answer: q.answer
    }));

    try {
      const response = await fetch(`${API_BASE}/api/mock-interview/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          role,
          interview_type: interviewType,
          question: currentQuestion,
          user_answer: userAnswer,
          jd,
          history: backendHistory,
          model: model
        }),
      });

      if (!response.ok) {
        throw new Error(`API failed with status ${response.status}`);
      }

      const data = await response.json();
      const finalFeedback = data.feedback || buildLocalFeedback(currentQuestion, userAnswer, interviewType);
      const finalSuggested = data.suggested_answer || buildSuggestedAnswer(currentQuestion, interviewType);
      const nextQuestionText = data.next_question || "Thank you! That concludes our mock interview. Do you have any questions for me?";

      setFeedback(finalFeedback);
      setSuggestedAnswer(finalSuggested);

      const currentQA = {
        question: currentQuestion,
        answer: userAnswer,
        feedback: finalFeedback,
        suggested: finalSuggested
      };

      setSessionQuestions(prev => [...prev, currentQA]);
      setCurrentQuestion(nextQuestionText);
      setUserAnswer('');
      baseAnswerRef.current = '';
    } catch (err) {
      console.error("Feedback generation failed, using local fallback:", err);
      const finalFeedback = buildLocalFeedback(currentQuestion, userAnswer, interviewType);
      const finalSuggested = buildSuggestedAnswer(currentQuestion, interviewType);

      const asked = new Set(sessionQuestions.map(h => h.question.toLowerCase()));
      asked.add(currentQuestion.toLowerCase());

      const localQuestions = mockQuestionBank[interviewType] || mockQuestionBank.Mixed;
      let nextQuestionText = "Thank you! That concludes our mock interview. Do you have any questions for me?";
      for (const q of localQuestions) {
        if (!asked.has(q.toLowerCase())) {
          nextQuestionText = q;
          break;
        }
      }

      setFeedback(finalFeedback);
      setSuggestedAnswer(finalSuggested);

      const currentQA = {
        question: currentQuestion,
        answer: userAnswer,
        feedback: finalFeedback,
        suggested: finalSuggested
      };

      setSessionQuestions(prev => [...prev, currentQA]);
      setCurrentQuestion(nextQuestionText);
      setUserAnswer('');
      baseAnswerRef.current = '';
    } finally {
      setIsGenerating(false);
    }
  };

  const endAndSaveSession = () => {
    if (sessionQuestions.length === 0 && !userAnswer.trim()) {
      setIsSessionActive(false);
      return;
    }

    const durationMin = Math.ceil(sessionTime / 60);
    const newSession = {
      id: 'mock_' + Date.now(),
      company: company || 'Generic',
      role: role || 'Software Engineer',
      type: interviewType,
      jd: jd,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      duration: `${durationMin}m`,
      history: sessionQuestions
    };

    const updatedSessions = [newSession, ...sessions];
    saveSessions(updatedSessions);
    setIsSessionActive(false);
  };

  const buildLocalFeedback = (question: string, answer: string, type: string) => {
    const answerLength = answer.trim().split(/\s+/).filter(Boolean).length;
    const lengthComment = answerLength < 35
      ? 'Your answer is a little short. Add more context, impact, and specific examples.'
      : 'Your answer has good detail. Improve it by making the structure sharper and more interview-ready.';

    if (type === 'Behavioral' || question.toLowerCase().includes('time')) {
      return `${lengthComment}\n\nSuggested improvements:\n• Use STAR format clearly.\n• Add measurable result.\n• Mention your ownership.\n• Keep the answer concise and confident.`;
    }

    if (type === 'Coding') {
      return `${lengthComment}\n\nSuggested improvements:\n• Start with approach.\n• Mention edge cases.\n• Provide optimal complexity.\n• Keep code clean and avoid unnecessary explanation.`;
    }

    if (type === 'SQL') {
      return `${lengthComment}\n\nSuggested improvements:\n• Explain filtering and joins.\n• Mention indexes if performance matters.\n• Keep query optimized and readable.`;
    }

    if (type === 'System Design') {
      return `${lengthComment}\n\nSuggested improvements:\n• Clarify requirements first.\n• Explain high-level design.\n• Add database, cache, scaling, and tradeoffs.`;
    }

    return `${lengthComment}\n\nSuggested improvements:\n• Give structured answer.\n• Add real project example.\n• Connect answer to ${company} ${role} expectations.`;
  };

  const buildSuggestedAnswer = (question: string, type: string) => {
    if (type === 'Behavioral' || question.toLowerCase().includes('time')) {
      return `Situation: In one of my recent projects, we faced a production issue that impacted data reliability.\n\nTask: I was responsible for identifying the root cause quickly and restoring stable processing.\n\nAction: I checked logs, isolated the failing stage, validated source data changes, fixed the transformation logic, and added monitoring plus retry handling.\n\nResult: The issue was resolved quickly, downstream impact was reduced, and we prevented recurrence with better validation and alerts.`;
    }

    if (type === 'System Design') {
      return `I would first clarify scale, latency, availability, and data retention requirements.\n\nAt a high level, I would use an API gateway, stateless application services, Redis for low-latency cache or rate limiting, PostgreSQL for durable metadata, and Kafka or RabbitMQ for async processing where needed.\n\nFor scaling, I would use horizontal service replicas, read replicas, partitioning for high-volume data, CDN/cache for hot reads, and observability for latency and error tracking.\n\nThe main tradeoff is balancing consistency, latency, and operational complexity.`;
    }

    if (type === 'Coding') {
      return `Start with the optimal approach, explain the data structure, then write clean code without comments.\n\nMention:\nTime Complexity: O(n)\nSpace Complexity: O(n)\n\nAlso cover edge cases like empty input, duplicates, and large input size.`;
    }

    if (type === 'SQL') {
      return `I would first check the execution plan, identify full table scans, expensive joins, sorting, and missing indexes.\n\nThen I would reduce selected columns, push filters earlier, add appropriate indexes, update statistics, and rewrite joins or aggregations if needed.\n\nI would validate improvement using before-and-after execution time and query plan comparison.`;
    }

    return `I would answer this by connecting my experience to the role, giving a concrete example, explaining my decision-making, and ending with the business or technical impact.`;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isSessionActive) {
    return (
      <div className="flex-1 min-h-0 flex overflow-hidden bg-[#070a1a] text-slate-100 animate-fadeIn" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
        {/* Left Panel: Webcam + Mic */}
        <div className="flex flex-col border-r border-slate-800 bg-[#070a1a]" style={{ width: '42%', minWidth: '300px' }}>
          {/* Webcam player */}
          <div className="shrink-0 border-b border-slate-800 bg-black relative aspect-video overflow-hidden flex flex-col items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover bg-black"
              muted
              playsInline
              autoPlay
            />
            {/* Live Indicator overlay */}
            <div className="absolute top-3 left-3 bg-red-600/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-glow animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-white" /> REC
            </div>
            {!webcamStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-4 text-center text-xs text-slate-500">
                <Camera size={24} className="mb-2 text-slate-600" />
                No webcam feed. Please allow camera permissions.
              </div>
            )}
          </div>

          {/* Left Panel Header / Mic control */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#070a1a] px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={mic.active ? mic.stop : startMic}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${mic.active
                  ? 'bg-violet-600 text-white border-violet-600 shadow-[0_0_15px_rgba(124,58,237,0.35)]'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-violet-500 hover:text-violet-400 hover:bg-slate-800'
                  }`}
              >
                {mic.active ? <MicOff size={13} /> : <Mic size={13} />}
                {mic.active ? 'Mic Off' : 'Mic On'}
              </button>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {mic.statusMsg}
              </span>
            </div>
          </div>

          {/* Transcription progress box */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-[#050712]/40 flex flex-col justify-end">
            <div className="border border-white/5 bg-slate-950/40 rounded-2xl p-4">
              <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-ping" /> Live Speech Transcription
              </div>
              <p className="text-xs text-slate-300 leading-5 italic">
                {mic.active
                  ? (userAnswer ? "Listening to mic... Answer text area on the right will update in real-time." : "Start speaking. Your words will appear in the answer box on the right.")
                  : "Microphone is muted. Turn it on to answer by speaking, or type directly into the text box."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: AI Question, Answer Input, Feedback */}
        <div className="flex flex-col flex-1 min-w-0 bg-[#070a1a]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#070a1a] px-5 py-3 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="violet">{interviewType}</Badge>
                <h1 className="text-base font-black text-white">{company} Mock Session</h1>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{role}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200">
                <Timer size={12} className="text-slate-500" />
                <span className="font-semibold">{formatTime(sessionTime)}</span>
              </div>
              <button
                onClick={endAndSaveSession}
                className="rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-bold text-white transition-all shadow-glow"
              >
                End & Save
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5 bg-[#050712]/40">
            {/* Question card */}
            <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/20 to-indigo-950/20 p-5 shadow-[0_4px_25px_rgba(99,102,241,0.08)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  Question {sessionQuestions.length + 1}
                </span>
                <span className="text-[10px] text-slate-500">Active</span>
              </div>
              <p className="text-sm font-semibold leading-7 text-slate-200">{currentQuestion}</p>
            </div>

            {/* Answer textarea */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Your Response</label>
              <textarea
                value={userAnswer}
                onChange={handleUserAnswerChange}
                rows={5}
                placeholder="Type your response here or speak into the mic..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none focus:border-violet-500 placeholder:text-slate-600 transition-all"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={generateFeedback}
                  disabled={isGenerating || !userAnswer.trim()}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-glow"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Feedback output for previous answer */}
            {(feedback || suggestedAnswer) && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                  <div className="text-[10px] font-black uppercase tracking-wide text-emerald-400">AI Feedback (Last Question)</div>
                  <p className="mt-2.5 whitespace-pre-wrap text-xs leading-6 text-slate-200">{feedback}</p>
                </div>
                <div className="rounded-2xl border border-sky-500/15 bg-sky-500/5 p-4">
                  <div className="text-[10px] font-black uppercase tracking-wide text-sky-400">Suggested Response</div>
                  <p className="mt-2.5 whitespace-pre-wrap text-xs leading-6 text-slate-200">{suggestedAnswer}</p>
                </div>
              </div>
            )}

            {/* Session QA History Log */}
            {sessionQuestions.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-400">Session Transcript ({sessionQuestions.length})</h3>
                <div className="space-y-3">
                  {sessionQuestions.slice().reverse().map((qa, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs space-y-2">
                      <div className="font-bold text-violet-400">Q: {qa.question}</div>
                      <div className="text-slate-300 pl-2 border-l border-white/10">A: {qa.answer}</div>
                      <details className="mt-2 group">
                        <summary className="text-[10px] text-slate-500 font-bold cursor-pointer hover:text-slate-300 select-none outline-none">
                          View Feedback & Suggestion
                        </summary>
                        <div className="mt-2 grid gap-3 md:grid-cols-2 pt-2 border-t border-white/5">
                          <div className="bg-emerald-500/5 p-3 rounded-xl text-[11px] leading-5 text-slate-300">
                            <span className="font-bold text-emerald-400 block mb-1">Feedback</span>
                            {qa.feedback}
                          </div>
                          <div className="bg-sky-500/5 p-3 rounded-xl text-[11px] leading-5 text-slate-300">
                            <span className="font-bold text-sky-400 block mb-1">Suggested</span>
                            {qa.suggested}
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Page
      title="Mock Interview Hub"
      subtitle="Practice before the real interview. AI asks questions, reviews your answer, and suggests a stronger response."
    >
      <div className="flex justify-end mb-6 -mt-4">
        <button
          onClick={() => setShowSetup(true)}
          className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-glow"
        >
          <Plus size={14} />
          Start Interview
        </button>
      </div>

      {/* ── Setup Form Overlay Modal ── */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#0a0d24] p-6 shadow-soft relative overflow-hidden">
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
              <h2 className="text-lg font-black text-white">Setup Mock Interview</h2>
              <button
                onClick={() => setShowSetup(false)}
                className="rounded-full p-1.5 hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Company</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Amazon, Google"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Target Role</label>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Interview Type</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[#070a1a] px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 cursor-pointer transition-all"
                >
                  <option>Mixed</option>
                  <option>Behavioral</option>
                  <option>Technical</option>
                  <option>Coding</option>
                  <option>SQL</option>
                  <option>System Design</option>
                  <option>HR</option>
                </select>
              </div>



              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Job Description (JD)</label>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={4}
                  placeholder="Paste Job Description to personalize interview questions..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2.5 text-xs text-white outline-none focus:border-violet-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
              <button
                onClick={() => setShowSetup(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-xs font-bold text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={startMockInterview}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-black text-white hover:from-violet-500 hover:to-indigo-500 shadow-glow transition-all"
              >
                Start Mock Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mock History Dashboard ── */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-white/5 bg-slate-900/20 rounded-[2rem] p-8 max-w-xl mx-auto">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-glow">
            <UserRound size={28} />
          </div>
          <h2 className="text-lg font-black text-white">No Mock Interviews Yet</h2>
          <p className="mt-2.5 text-xs text-slate-400 max-w-sm leading-relaxed">
            Practice for your interviews using our interactive AI. Set your role, company, and JD, and practice responding in real-time.
          </p>
          <button
            onClick={() => setShowSetup(true)}
            className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition-all shadow-glow"
          >
            Start Your First Mock Interview
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-[2rem] border border-white/10 bg-slate-900/40 p-5 hover:border-violet-500/30 transition-all flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-violet-600/5 blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge tone="violet">{s.type}</Badge>
                  <span className="text-[10px] text-slate-500 font-semibold">{s.date}</span>
                </div>

                <h3 className="text-sm font-black text-white truncate">{s.role}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">{s.company}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[10px] text-slate-500 font-bold uppercase shrink-0">
                  <div className="rounded-xl bg-white/[0.02] p-2 border border-white/5">
                    <span className="text-slate-300 text-xs block mb-0.5">{s.history?.length || 0}</span>
                    Questions
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-2 border border-white/5">
                    <span className="text-slate-300 text-xs block mb-0.5">{s.duration || '0m'}</span>
                    Duration
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-5 pt-3 border-t border-white/5">
                <button
                  onClick={() => setViewingSession(s)}
                  className="flex-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 py-2 text-xs font-bold text-slate-200 hover:text-white transition-all text-center"
                >
                  Review Q&A
                </button>
                <button
                  onClick={() => {
                    const updated = sessions.filter(x => x.id !== s.id);
                    saveSessions(updated);
                  }}
                  className="rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 px-3 py-2 text-xs text-rose-300 transition-all flex items-center justify-center"
                  title="Delete Session"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detailed Review Modal ── */}
      {viewingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fadeIn">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-soft flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
                <div>
                  <h2 className="text-base font-black text-white">Mock Interview Transcript</h2>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    {viewingSession.role} at {viewingSession.company} — {viewingSession.date}
                  </p>
                </div>
                <button
                  onClick={() => setViewingSession(null)}
                  className="rounded-full p-1.5 hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {viewingSession.history && viewingSession.history.length > 0 ? (
                  viewingSession.history.map((qa: any, idx: number) => (
                    <div key={idx} className="rounded-2xl border border-white/5 bg-white/[0.015] p-4 text-xs space-y-2">
                      <div className="font-bold text-violet-400">Q{idx + 1}: {qa.question}</div>
                      <div className="text-slate-300 pl-2 border-l border-white/10">A: {qa.answer}</div>

                      <div className="grid gap-3 md:grid-cols-2 pt-2 mt-2 border-t border-white/5">
                        <div className="bg-emerald-500/5 p-3 rounded-xl leading-5 text-slate-300">
                          <span className="font-bold text-emerald-400 block mb-1">AI Feedback</span>
                          {qa.feedback}
                        </div>
                        <div className="bg-sky-500/5 p-3 rounded-xl leading-5 text-slate-300">
                          <span className="font-bold text-sky-400 block mb-1">Suggested Model Answer</span>
                          {qa.suggested}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-600 text-xs py-10">No questions were answered during this session.</div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-white/5 pt-4 flex justify-end shrink-0">
              <button
                onClick={() => setViewingSession(null)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}


function RecentSessionsPage({
  sessionsList,
  editingId,
  editTitle,
  setEditTitle,
  editDesc,
  setEditDesc,
  startEdit,
  saveEdit,
  cancelEdit,
  deleteSession,
  openDetail
}: RecentSessionsPageProps) {
  return (
    <Page title="Recent Sessions" subtitle="View details, edit info, delete, or review transcripts of your past live sessions.">
      <Card className="w-full">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Recent Live Sessions</h2>
          <Badge tone="violet">{sessionsList.length} total</Badge>
        </div>

        <RecentSessionsTable
          sessionsList={sessionsList}
          editingId={editingId}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editDesc={editDesc}
          setEditDesc={setEditDesc}
          startEdit={startEdit}
          saveEdit={saveEdit}
          cancelEdit={cancelEdit}
          deleteSession={deleteSession}
          openDetail={openDetail}
        />
      </Card>
    </Page>
  );
}


// ─── Reusable Deepgram audio capture hook (instantiate once per source) ─────────────────
function useDeepgramAudio() {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'listening' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('Ready');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onTranscriptRef = useRef<((text: string, isFinal: boolean) => void) | null>(null);
  const onPipelineUpdateRef = useRef<((data: any) => void) | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const start = async (
    constraints: MediaTrackConstraints,
    onTranscript: (text: string, isFinal: boolean) => void,
    onPipelineUpdate?: (data: any) => void,
    isSystemAudio?: boolean,
    requireAudio: boolean = true
  ) => {
    if (active) return;
    onTranscriptRef.current = onTranscript;
    onPipelineUpdateRef.current = onPipelineUpdate || null;
    try {
      setStatus('requesting');
      setStatusMsg('Starting...');

      let captureStream: MediaStream;
      if (isSystemAudio) {
        if (globalDisplayStream && globalDisplayStream.active && globalDisplayStream.getAudioTracks().length > 0) {
          captureStream = globalDisplayStream;
        } else if (globalSystemAudioStreamPromise) {
          captureStream = await globalSystemAudioStreamPromise;
        } else {
          const controller = (window as any).CaptureController ? new (window as any).CaptureController() : null;
          globalSystemAudioStreamPromise = navigator.mediaDevices.getDisplayMedia({
            video: true,
            monitorTypeSurfaces: "exclude",
            selfBrowserSurface: "include",
            audio: true,
            controller
          } as any);
          try {
            captureStream = await globalSystemAudioStreamPromise;

            if (controller) {
              try {
                controller.setFocusBehavior("no-focus-change");
              } catch (err) {
                console.warn("Failed to set focus behavior:", err);
              }
            }

            // Validate that they did not share the entire screen
            const videoTracks = captureStream.getVideoTracks();
            if (videoTracks.length > 0) {
              const settings = videoTracks[0].getSettings();
              if (settings.displaySurface === "monitor") {
                captureStream.getTracks().forEach(track => track.stop());
                throw new Error("Sharing the entire screen is blocked. Please select a browser tab or an application window.");
              }
            }

            globalDisplayStream = captureStream;
          } finally {
            globalSystemAudioStreamPromise = null;
          }
        }
      } else {
        captureStream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
      }

      if (!isMountedRef.current) {
        if (captureStream !== globalDisplayStream) {
          captureStream.getTracks().forEach(t => t.stop());
        }
        return;
      }

      // Check if system audio is actually shared. If not, block and prompt to try again.
      if (isSystemAudio && requireAudio && captureStream.getAudioTracks().length === 0) {
        captureStream.getTracks().forEach(t => t.stop());
        if (globalDisplayStream === captureStream) {
          globalDisplayStream = null;
        }
        throw new Error("You must check the 'Share tab audio' checkbox in the capture dialog.");
      }

      streamRef.current = captureStream;
      setStream(captureStream);

      // Listen to track ended event (e.g. user stops sharing via browser bar)
      captureStream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          stop();
        });
      });

      const sessionUuid = localStorage.getItem('active-session-id') || 'legacy-session-id';
      const ws = new WebSocket(`${WS_BASE}/ws/audio/${sessionUuid}`);
      wsRef.current = ws;
      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }
        setStatus('listening');
        setStatusMsg(captureStream.getAudioTracks().length > 0 ? 'Listening' : 'Connected (No audio)');

        if (captureStream.getAudioTracks().length > 0) {
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus' : 'audio/webm';

          // Use only audio tracks for the recorder to avoid recording/processing video
          const recordStream = isSystemAudio
            ? new MediaStream(captureStream.getAudioTracks())
            : captureStream;

          const recorder = new MediaRecorder(recordStream, { mimeType });
          recorderRef.current = recorder;
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) ws.send(e.data);
          };
          recorder.start(50);
        }
        setActive(true);
      };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'transcript' && data.text)
            onTranscriptRef.current?.(data.text.trim(), !!data.is_final);
          if (data.type === 'pipeline_update' && onPipelineUpdateRef.current)
            onPipelineUpdateRef.current(data);
          if (data.type === 'status') setStatusMsg(data.message || 'Listening');
        } catch { }
      };
      ws.onerror = () => { setStatus('error'); setStatusMsg('Backend offline'); };
      ws.onclose = () => { setActive(false); setStatus('idle'); setStatusMsg('Stopped'); };
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(
        err?.name === 'NotAllowedError'
          ? 'Permission denied'
          : err?.name === 'AbortError'
            ? 'Screen share cancelled'
            : err?.message || 'Error'
      );
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      if (streamRef.current === globalDisplayStream) {
        globalDisplayStream = null;
        globalAudioWarningDismissed = false; // Reset warning flag for new manual session
      }
    }
    streamRef.current = null;
    setStream(null);
    wsRef.current?.close();
    wsRef.current = null;
    setActive(false);
    setStatus('idle');
    setStatusMsg('Stopped');
  };

  useEffect(() => () => stop(), []);
  return { active, status, statusMsg, start, stop, stream };
}


// System audio constraints: raw capture picks up speakers ambient
const SYSTEM_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  sampleRate: 16000,
} as MediaTrackConstraints;

// Mic constraints: normal voice capture
const MIC_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  sampleRate: 16000,
} as MediaTrackConstraints;

function LiveSession({
  config,
  onFinish,
  tr,
  setTr,
  sessionTime
}: {
  config: SessionConfig;
  onFinish: (qaHistoryData?: Array<{ question: string; answer: string; responseTime?: string }>) => void;
  tr: TranscriptItem[];
  setTr: React.Dispatch<React.SetStateAction<TranscriptItem[]>>;
  sessionTime: number;
}) {
  const [idx, setIdx] = useState(0);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [manualMessage, setManualMessage] = useState('');
  const [qaHistory, setQaHistory] = useState<Array<{ question: string; answer: string; responseTime?: string }>>([]);

  // Pre-warm debounce timer ref
  const prewarmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPrewarmedTextRef = useRef<string>('');

  // Secret hotkey for offline simulation/testing (Ctrl + Alt + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        ask();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [idx]);

  const handleExitClick = () => {
    onFinish(qaHistory);
  };

  // Fire pre-warm as soon as the interviewer starts forming a question
  const prewarmQuestion = (partialText: string) => {
    // Only pre-warm when there's enough text (>=6 words) and it's a new question
    const wordCount = partialText.trim().split(/\s+/).length;
    if (wordCount < 6) return;
    if (lastPrewarmedTextRef.current === partialText) return;

    // Debounce: wait 600ms of inactivity before firing
    if (prewarmTimerRef.current) clearTimeout(prewarmTimerRef.current);
    prewarmTimerRef.current = setTimeout(() => {
      lastPrewarmedTextRef.current = partialText;
      const activeSessionId = localStorage.getItem('active-session-id') || undefined;
      fetch(`${API_BASE}/api/answers/prewarm-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          partial_question: partialText,
          resume_content: config.selectedResumeId || undefined,
          knowledge_content: config.selectedDocId
            ? `doc_id:${config.selectedDocId}${config.selectedPromptId ? `|prompt_id:${config.selectedPromptId}` : ''}`
            : undefined,
        })
      }).catch(() => {/* silent — pre-warm is best-effort */ });
      console.debug('[PreWarm] Triggered for:', partialText.slice(0, 60));
    }, 600);
  };

  const keys = getCurrentUserKeys();
  const activeResumeName = (() => {
    try {
      if (!config.selectedResumeId) return null;
      const saved = localStorage.getItem(keys.resumesKey);
      const list = saved ? JSON.parse(saved) : [];
      const item = list.find((r: any) => r.id === config.selectedResumeId);
      return item ? item.name : null;
    } catch { return null; }
  })();

  const activeDocName = (() => {
    try {
      if (!config.selectedDocId) return null;
      const saved = localStorage.getItem(keys.docsKey);
      const list = saved ? JSON.parse(saved) : [];
      const item = list.find((d: any) => d.id === config.selectedDocId);
      return item ? item.name : null;
    } catch { return null; }
  })();

  const activePromptTitle = (() => {
    try {
      if (!config.selectedPromptId) return null;
      const saved = localStorage.getItem(keys.promptsKey);
      const list = saved ? JSON.parse(saved) : [];
      const item = list.find((p: any) => p.id === config.selectedPromptId);
      return item ? item.title : null;
    } catch { return null; }
  })();
  const [language, setLanguage] = useState('English');
  const [aiQuestion, setAiQuestion] = useState('');
  const stream = useStream();
  // Two separate audio capture instances
  const sysAudio = useDeepgramAudio(); // system/ambient — auto-starts
  const mic = useDeepgramAudio();      // microphone — manual toggle
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const answerEndRef = useRef<HTMLDivElement>(null);
  const shouldStartNewParaRef = useRef(false);
  const lastAutoAnsweredQuestionRef = useRef('');
  // Holds only the latest question segment that has NOT been sent to API yet.
  // After Ask, this buffer is cleared, so old/repeated transcript cannot be sent again.
  const latestQuestionBufferRef = useRef('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (sysAudio.stream) {
        videoRef.current.srcObject = sysAudio.stream;
        videoRef.current.play().catch(e => console.error("Error playing preview video:", e));
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [sysAudio.stream]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const latestQuestion = latestQuestionBufferRef.current.trim();

  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [tr]);
  useEffect(() => { answerEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [stream.text]);

  const startNewParagraph = (speaker: 'Interviewer' | 'You') => {
    setTr(p => {
      // If the last item is already empty, don't create another empty one
      if (p.length > 0 && !p[p.length - 1].text.trim()) {
        const last = p[p.length - 1];
        if (last.speaker !== speaker) {
          const updatedLast = { ...last, speaker };
          return [...p.slice(0, -1), updatedLast];
        }
        return p;
      }
      return [...p, {
        id: String(Date.now()),
        speaker,
        text: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      }];
    });
    shouldStartNewParaRef.current = false;
  };

  const handleIncomingTranscript = (text: string, speaker: 'Interviewer' | 'You', isFinal: boolean) => {
    const cleanText = (text || '').trim();
    if (!cleanText) return;

    let latestSegmentText = cleanText;

    setTr(p => {
      if (p.length === 0 || shouldStartNewParaRef.current) {
        shouldStartNewParaRef.current = false;
        latestSegmentText = cleanText;

        return [...p, {
          id: String(Date.now()),
          speaker,
          text: cleanText,
          finalText: isFinal ? cleanText : '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          isFinal: isFinal
        }];
      }

      const last = p[p.length - 1];

      if (last.speaker !== speaker) {
        const updatedLast = last.isFinal ? last : { ...last, isFinal: true, finalText: last.text };
        const newHistory = last.isFinal ? p : [...p.slice(0, -1), updatedLast];

        latestSegmentText = cleanText;

        return [...newHistory, {
          id: String(Date.now()),
          speaker,
          text: cleanText,
          finalText: isFinal ? cleanText : '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          isFinal: isFinal
        }];
      }

      const baseFinalText = last.finalText !== undefined ? last.finalText : last.text;

      if (isFinal) {
        const combinedFinal = baseFinalText ? (baseFinalText.trim() + ' ' + cleanText) : cleanText;
        latestSegmentText = combinedFinal;

        return [
          ...p.slice(0, -1),
          {
            ...last,
            text: combinedFinal,
            finalText: combinedFinal,
            isFinal: true
          }
        ];
      } else {
        const combinedText = baseFinalText ? (baseFinalText.trim() + ' ' + cleanText) : cleanText;
        latestSegmentText = combinedText;

        return [
          ...p.slice(0, -1),
          {
            ...last,
            text: combinedText,
            finalText: baseFinalText,
            isFinal: false
          }
        ];
      }
    });

    // Store only the latest not-yet-asked transcript segment.
    // This is what the Ask button sends to API.
    latestQuestionBufferRef.current = latestSegmentText.trim();

    // Pre-warm context using the latest segment, not only the tiny incoming chunk.
    if (speaker === 'Interviewer') {
      prewarmQuestion(latestQuestionBufferRef.current);
    }
  };

  const addTranscript = (text: string, speaker: 'Interviewer' | 'You') => {
    handleIncomingTranscript(text, speaker, true);
  };

  const askAIWithTranscript = async (
    question: string,
    speaker: 'Interviewer' | 'You' = 'Interviewer',
    historyOverride?: TranscriptItem[]
  ) => {
    const questionToSend = (question || '').trim();
    if (!questionToSend) return;

    // Break transcript here. Next Deepgram text will start a fresh segment.
    shouldStartNewParaRef.current = true;
    startNewParagraph(speaker);

    // Clear buffer after taking current question, so repeated old transcript will not go to API.
    latestQuestionBufferRef.current = '';

    const activeSessionId = localStorage.getItem('active-session-id') || undefined;
    const startTime = performance.now();

    try {
      setAiQuestion(questionToSend);
      stream.update('Thinking...', true);
      const response = await requestTranscriptAnswerStream(
        questionToSend,
        config.model,
        activeSessionId,
        (partialAnswer, partialQuestion) => {
          if (partialQuestion) {
            setAiQuestion(partialQuestion);
          }
          stream.update(partialAnswer || 'Thinking...', true);
        }
      );
      const ttftSec = response.ttft ? (response.ttft / 1000).toFixed(2) : '0.00';

      if (response && response.answer.trim()) {
        const finalQ = response.question || questionToSend;
        if (response.question) {
          setAiQuestion(response.question);
        }
        stream.update(response.answer, false);
        setQaHistory(prev => {
          if (prev.some(x => x.question === finalQ)) return prev;
          return [...prev, { question: finalQ, answer: response.answer, responseTime: ttftSec }];
        });
      } else {
        stream.update('⚠️ The AI returned an empty response. Please check the backend server.', false);
      }
    } catch (err) {
      console.error(err);
      stream.update('⚠️ Could not reach the backend. Make sure the FastAPI server is running on http://localhost:8000.', false);
    }
  };

  const handleAskAI = async (item: TranscriptItem) => {
    const itemIdx = tr.findIndex(x => x.id === item.id);
    if (itemIdx === -1) return;
    const historyUpToItem = tr.slice(0, itemIdx + 1);
    await askAIWithTranscript(item.text, item.speaker, historyUpToItem);
  };

  const handleAnswerClick = async () => {
    const manual = manualMessage.trim();
    const question = manual || latestQuestionBufferRef.current.trim();

    if (!question) {
      console.warn('No latest question found to send.');
      return;
    }

    if (manual) {
      shouldStartNewParaRef.current = true;
      addTranscript(manual, 'You');
      setManualMessage('');
    }

    await askAIWithTranscript(question, manual ? 'You' : 'Interviewer');
  };

  const captureAndAnalyze = async () => {
    try {
      setShutterFlash(true);
      setTimeout(() => setShutterFlash(false), 250);
      const { blob, dataUrl } = await captureScreenImage();
      stream.start('Analyzing screenshot...');
      const activeSessionId = localStorage.getItem('active-session-id') || undefined;
      const answer = await requestScreenshotAnswer(blob, activeSessionId, config.model);
      const question = 'Screen capture question';
      localStorage.setItem('latest-screenshot', dataUrl);
      localStorage.setItem('latest-screenshot-question', question);
      localStorage.setItem('latest-screenshot-answer', answer);
      shouldStartNewParaRef.current = true;
      setTr(p => [...p, {
        id: String(Date.now()), speaker: 'You', text: question,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
        screenshot: dataUrl
      }]);
      setAiQuestion(question);
      stream.start(answer);
      setQaHistory(prev => [...prev, { question, answer }]);
      // startNewParagraph('Interviewer'); // disabled: next transcript starts fresh via shouldStartNewParaRef
    } catch (err: any) {
      console.error('Screenshot capture/API failed:', err);
      stream.start(err?.message || 'Unable to process screenshot. Please check browser screen-capture permission and FastAPI server.');
    }
  };

  // ── System audio: auto-start on mount, captures ambient/speaker audio ─────────
  const startSystemAudio = () => {
    sysAudio.start(
      SYSTEM_AUDIO_CONSTRAINTS,
      (text, isFinal) => {
        handleIncomingTranscript(text, 'Interviewer', isFinal);
      },
      (data) => {
        if (data.ready_for_answer && data.prediction) {
          const cleanQ = data.prediction.trim();
          if (cleanQ) {
            setTr(prev => {
              if (prev.length === 0) return prev;
              const copy = [...prev];
              for (let i = copy.length - 1; i >= 0; i--) {
                if (copy[i].speaker === 'Interviewer') {
                  copy[i] = {
                    ...copy[i],
                    text: cleanQ,
                    finalText: cleanQ,
                    isFinal: true
                  };
                  break;
                }
              }
              return copy;
            });
          }
        }

        if (config.autoAnswer && data.ready_for_answer && data.prediction) {
          const q = data.prediction.trim();
          if (q && lastAutoAnsweredQuestionRef.current !== q) {
            lastAutoAnsweredQuestionRef.current = q;
            console.info("Auto Answer Triggered for predicted question:", q);
            askAIWithTranscript(q, 'Interviewer');
          }
        }
      },
      true,
      config.type !== 'Coding'
    );
  };

  // ── Mic: manual toggle ────────────────────────────────────────────────────────
  const startMic = () => {
    mic.start(
      MIC_CONSTRAINTS,
      (text, isFinal) => {
        handleIncomingTranscript(text, 'You', isFinal);
      }
      // no answer callback for mic
    );
  };

  // Auto-start system audio is disabled on mount to allow custom accept modal.
  // useEffect(() => { startSystemAudio(); }, []);



  const ask = async () => {
    shouldStartNewParaRef.current = true;
    const q = mockQuestions[idx % mockQuestions.length];
    setIdx(i => i + 1);
    addTranscript(q, 'Interviewer');
    await askAIWithTranscript(q, 'Interviewer');
  };

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden bg-[#070a1a] text-slate-100 animate-fadeIn" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>

      {/* ── Screen share / system audio authorization request modal ── */}
      {!sysAudio.stream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0a0d24] p-8 shadow-soft text-center relative overflow-hidden">
            {/* Visual background glow */}
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-glow">
              <ScreenShare size={30} />
            </div>

            <h3 className="text-xl font-black text-white">Share Tab or Window to Connect</h3>
            <p className="mt-2.5 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              To capture the interviewer's audio and process live questions, CopilotX requires capturing a browser tab or an application window. Sharing the entire screen is not supported.
            </p>

            {/* Instruction Steps */}
            <div className="my-6 text-left bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3.5">
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-black text-violet-300">1</span>
                <p className="text-xs text-slate-300 leading-normal">
                  Click the <strong>Accept &amp; Connect</strong> button below.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-black text-violet-300">2</span>
                <p className="text-xs text-slate-300 leading-normal">
                  In the browser picker, switch to the <strong>Chrome Tab</strong>/<strong>Edge Tab</strong> or <strong>Window</strong> panel.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-black text-violet-300">3</span>
                <p className="text-xs text-slate-300 leading-normal">
                  Select the tab or window where your video call is running (Google Meet, Teams, etc.).
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-black text-rose-300">!</span>
                <p className="text-xs text-slate-300 leading-normal">
                  <strong>CRITICAL:</strong> If sharing a browser tab, you must check the <strong>Share tab audio</strong> (or "Share audio") box at the bottom-left of the picker window.
                </p>
              </div>
            </div>

            {/* Error / Loading Feedback */}
            {sysAudio.status === 'requesting' && (
              <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs text-violet-300">
                <svg className="animate-spin h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Select a tab or window in the sharing prompt...</span>
              </div>
            )}

            {sysAudio.status === 'error' && (
              <div className="mb-6 flex items-start gap-2 text-left rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-xs text-rose-400">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Connection Blocked:</span>
                  <p className="mt-0.5 text-slate-300 leading-normal">{sysAudio.statusMsg}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExitClick}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-bold text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all"
              >
                Exit Session
              </button>
              <button
                onClick={startSystemAudio}
                disabled={sysAudio.status === 'requesting'}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-black text-white hover:from-violet-500 hover:to-indigo-500 shadow-glow disabled:opacity-50 transition-all"
              >
                Accept &amp; Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEFT PANEL: Live Captions ── */}
      <div className="flex flex-col border-r border-slate-800 bg-[#070a1a]" style={{ width: '42%', minWidth: '300px' }}>
        {sysAudio.stream && (
          <div className="shrink-0 border-b border-slate-800 bg-black relative group/preview aspect-video overflow-hidden flex flex-col">
            <video
              id="screen-share-preview-video"
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              muted
              playsInline
              autoPlay
            />
            {/* Overlay controls or badge */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex items-center justify-between opacity-0 group-hover/preview:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-white flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Live Preview
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sysAudio.stop();
                    startSystemAudio();
                  }}
                  className="text-[10px] text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors font-semibold"
                >
                  Change Tab
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const videoEl = document.getElementById('screen-share-preview-video') as HTMLVideoElement | null;
                      if (videoEl) {
                        if (document.fullscreenElement) {
                          await document.exitFullscreen();
                        } else {
                          await videoEl.requestFullscreen();
                        }
                      }
                    } catch (e) {
                      console.error("Fullscreen error", e);
                    }
                  }}
                  className="text-[10px] text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors font-semibold"
                >
                  Fullscreen
                </button>
              </div>
            </div>
          </div>
        )}

        {!sysAudio.stream && (
          <div className="shrink-0 border-b border-slate-800 bg-slate-950/60 p-5 flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <ScreenShare size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Connect Interview Audio & Screen</p>
              <p className="mt-1 text-[11px] text-slate-500 max-w-xs leading-normal">
                Share a Chrome Tab with the audio checkbox checked to stream the interviewer's voice and capture live screenshots.
              </p>
            </div>
            <button
              onClick={startSystemAudio}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-glow"
            >
              <ScreenShare size={12} />
              Share Screen & Audio
            </button>
          </div>
        )}

        {/* Left Header */}
        <div className="flex items-center gap-2 border-b border-slate-800 bg-[#070a1a] px-4 py-3 shrink-0">
          <button
            onClick={() => { setTr([]); setAiQuestion(''); stream.start(''); }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-white transition-all"
          >
            <X size={14} />
            Clear
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={mic.active ? mic.stop : startMic}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${mic.active
                ? 'bg-violet-600 text-white border-violet-600 shadow-[0_0_15px_rgba(124,58,237,0.35)]'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-violet-500 hover:text-violet-400 hover:bg-slate-800'
                }`}
            >
              <MonitorSpeaker size={13} />
              {mic.active ? 'Mic On' : 'Mic'}
            </button>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 outline-none cursor-pointer hover:border-slate-600"
            >
              {['English', 'Hindi', 'Telugu', 'Spanish', 'French'].map(l => (
                <option key={l} className="bg-slate-900 text-slate-200">{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transcript Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-[#050712]/40 space-y-3">
          {tr.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 animate-fadeIn">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-glow relative">
                <div className="absolute inset-0 rounded-2xl border border-indigo-500/30 animate-ping opacity-60" />
                <Mic size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-300">Waiting for interviewer audio...</p>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-[240px]">Real-time transcription will begin automatically as soon as the interviewer speaks.</p>
            </div>
          ) : (
            <>
              <div ref={transcriptEndRef} />
              {[...tr].reverse().map((t) => (
                <div key={t.id} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-400">
                      {t.speaker === 'Interviewer' ? 'Interviewer 1' : 'You'} — {t.time}
                      {!t.isFinal && <span className="ml-2 text-[10px] text-cyan-400 font-bold animate-pulse">speaking...</span>}
                    </span>
                    {t.text.trim() && t.isFinal && (
                      <button
                        onClick={() => handleAskAI(t)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-indigo-500 transition-all"
                      >
                        <Sparkles size={8} /> Ask AI
                      </button>
                    )}
                  </div>
                  <p className={`text-sm leading-6 rounded-xl px-3 py-2 border ${t.speaker === 'Interviewer'
                    ? 'bg-slate-900/80 border-slate-800 text-slate-100 shadow-sm'
                    : 'bg-indigo-950/40 border-indigo-900/60 text-slate-100'
                    } ${!t.isFinal ? 'italic text-slate-300/80 border-indigo-500/25 bg-indigo-500/5' : ''}`}>
                    {t.text || <span className="text-slate-500 italic animate-pulse">Listening...</span>}
                  </p>
                  {t.screenshot && <img src={t.screenshot} alt="capture" className="mt-2 max-h-32 rounded-lg border border-slate-800 object-cover w-full" />}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Left Footer */}
        {tr.length > 0 && (
          <div className="shrink-0 border-t border-slate-800 bg-[#070a1a] px-4 py-2 flex gap-2 items-center">
            <button
              onClick={() => handleAskAI(tr[tr.length - 1])}
              disabled={tr.length === 0 || !tr[tr.length - 1].text.trim() || stream.busy}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition-all"
            >
              <Sparkles size={11} /> Ask AI
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: AI Answer ── */}
      <div className="flex flex-col flex-1 min-w-0 bg-[#070a1a]">

        {/* Right Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#070a1a] px-5 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-sm">
              <Brain size={16} className="text-white" />
            </div>
            <span className="text-base font-black text-slate-100">CopilotX</span>
          </div>

          {/* Active Context Badges */}
          <div className="hidden lg:flex items-center gap-2 text-[10px]">
            {activeResumeName && (
              <span className="inline-flex items-center gap-1 rounded bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-violet-300 font-bold max-w-[150px] truncate" title={activeResumeName}>
                <FileText size={10} /> {activeResumeName}
              </span>
            )}
            {activeDocName && (
              <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-cyan-300 font-bold max-w-[150px] truncate" title={activeDocName}>
                <Brain size={10} /> {activeDocName}
              </span>
            )}
            {activePromptTitle && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-emerald-300 font-bold max-w-[150px] truncate" title={activePromptTitle}>
                <Sparkles size={10} /> {activePromptTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5">
              <Timer size={13} className="text-gray-500" />
              <span className="text-sm font-semibold text-slate-200">{formatTime(sessionTime)}</span>
              <span className="text-xs font-bold bg-violet-500/10 border border-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded ml-1">Pro</span>
            </div>
            {qaHistory.length > 0 && (
              <button
                onClick={() => {
                  if (!window.confirm('Are you sure you want to clear the live Q&A history?')) return;
                  setQaHistory([]);
                }}
                className="flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all"
                title="Clear Q&A"
              >
                <X size={12} /> Clear Q&A
              </button>
            )}
            <button
              onClick={captureAndAnalyze}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition-all"
              title="Take screenshot"
            >
              <Camera size={13} />
            </button>
            <button
              onClick={handleExitClick}
              className="rounded-lg bg-rose-500 px-4 py-1.5 text-sm font-bold text-white hover:bg-rose-600 transition-all"
            >
              Exit
            </button>
          </div>
        </div>

        {/* AI Chat Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-[#050712]/40">
          {qaHistory.length === 0 && !stream.text ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900/60 border border-slate-800">
                <Bot size={26} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No messages yet.</p>
              <p className="text-xs text-slate-500 mt-1">Click "Answer" to start!</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto">
              {qaHistory.map((qa, i) => (
                <div key={i} className="space-y-3">
                  <div className="rounded-2xl border border-indigo-500/20 bg-[#0d1230]/80 p-4 shadow-[0_4px_20px_rgba(99,102,241,0.08)] backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        Question #{i + 1}
                      </span>
                      {qa.responseTime && (
                        <span className="text-[10px] font-bold text-violet-300/90 bg-violet-500/15 px-2 py-0.5 rounded border border-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.15)] flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                          TTFT: {qa.responseTime}s
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-6 text-slate-200 pl-1.5">{qa.question}</p>
                  </div>
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-5 shadow-[0_8px_30px_rgba(124,58,237,0.06)] backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded border border-violet-500/20">
                        AI Answer
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(qa.answer)}
                        className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:border-violet-600 hover:text-violet-400 hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={10} />
                        Copy Answer
                      </button>
                    </div>
                    <div className="pl-1">
                      <FormattedAnswer text={qa.answer} />
                    </div>
                  </div>
                </div>
              ))}

              {stream.busy && stream.text && !qaHistory.some(x => x.answer === stream.text) && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-indigo-500/20 bg-[#0d1230]/80 p-4 shadow-[0_4px_20px_rgba(99,102,241,0.08)] backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        Current Question
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-6 text-slate-200 pl-1.5">{aiQuestion || latestQuestion}</p>
                  </div>
                  <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-5 shadow-[0_8px_30px_rgba(124,58,237,0.06)] backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded border border-violet-500/20">
                          AI Answer
                        </span>
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-900/40 animate-pulse">
                          Generating
                        </span>
                      </div>
                    </div>
                    <div className="pl-1">
                      <FormattedAnswer text={stream.text} />
                      <span className="animate-pulse text-violet-400 ml-1 text-sm">▍</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={answerEndRef} />
            </div>
          )}
        </div>

        {/* Bottom: Manual input + Screenshot + Answer button */}
        <div className="shrink-0 border-t border-slate-800 bg-[#070a1a]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/40">
            <input
              value={manualMessage}
              onChange={e => setManualMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnswerClick(); } }}
              placeholder="Type a manual message..."
              className="flex-1 min-w-0 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:bg-slate-900 transition-all"
            />
            <button
              onClick={captureAndAnalyze}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-sm font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition-all shrink-0"
            >
              <Camera size={16} />
              <span className="text-xs">Screenshot</span>
            </button>
          </div>

          <div className="px-4 py-3">
            <button
              onClick={handleAnswerClick}
              disabled={stream.busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white hover:from-violet-500 hover:to-indigo-500 shadow-glow disabled:opacity-50 transition-all"
            >
              <Sparkles size={16} className="text-violet-400" />
              {stream.busy ? 'Generating Answer...' : 'Answer'}
            </button>
          </div>
        </div>
      </div>

      {shutterFlash && <div className="fixed inset-0 bg-white z-[9999] pointer-events-none" />}
    </div>
  );
}








function ResumeIntelligence() {
  const keys = getCurrentUserKeys();

  const [resumes, setResumes] = useState<any[]>(() => {
    const saved = localStorage.getItem(keys.resumesKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [dragging, setDragging] = useState(false);
  const [previewTab, setPreviewTab] = useState<string>('intro');

  useEffect(() => {
    localStorage.setItem(keys.resumesKey, JSON.stringify(resumes));
  }, [resumes, keys.resumesKey]);

  useEffect(() => {
    if (keys.userId) {
      fetch(`${API_BASE}/api/resumes?user_id=${keys.userId}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (data && data.length > 0) {
            const formattedResumes = data.map((dbRes: any) => ({
              id: dbRes.id,
              name: dbRes.file_name,
              active: dbRes.is_active,
              size: dbRes.parsed_content ? `${(dbRes.parsed_content.length / 1024).toFixed(0)} KB` : '10 KB',
              uploadDate: 'Previously uploaded',
              parsed_content: dbRes.parsed_content || '',
              introduction: dbRes.introduction || '',
              professional_summary: dbRes.professional_summary || '',
              career_journey: dbRes.career_journey || '',
              strengths: dbRes.strengths || '',
              project_summary: dbRes.project_summary || ''
            }));
            setResumes(formattedResumes);
          }
        }).catch(err => console.error("Failed to fetch resumes:", err));
    }
  }, [keys.userId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      files.forEach(file => {
        const tempId = String(Date.now() + Math.random());
        const newResume = {
          id: tempId,
          name: file.name,
          active: false,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          uploadDate: 'Just now',
          parsed_content: '',
          introduction: '',
          professional_summary: '',
          career_journey: '',
          strengths: '',
          project_summary: ''
        };
        setResumes(prev => [...prev, newResume]);

        const formData = new FormData();
        formData.append('file', file);
        if (keys.userId) {
          formData.append('user_id', keys.userId);
        }

        fetch(`${API_BASE}/api/resumes/upload`, {
          method: 'POST',
          body: formData
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data && data.id) {
              setResumes(prev => prev.map(r => r.id === tempId ? {
                ...r,
                id: data.id,
                parsed_content: data.parsed_content || '',
                introduction: data.introduction || '',
                professional_summary: data.professional_summary || '',
                career_journey: data.career_journey || '',
                strengths: data.strengths || '',
                project_summary: data.project_summary || ''
              } : r));
            }
          })
          .catch(err => console.error("Database resume upload failed:", err));
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const tempId = String(Date.now() + Math.random());
        const newResume = {
          id: tempId,
          name: file.name,
          active: false,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          uploadDate: 'Just now',
          parsed_content: '',
          introduction: '',
          professional_summary: '',
          career_journey: '',
          strengths: '',
          project_summary: ''
        };
        setResumes(prev => [...prev, newResume]);

        const formData = new FormData();
        formData.append('file', file);
        if (keys.userId) {
          formData.append('user_id', keys.userId);
        }

        fetch(`${API_BASE}/api/resumes/upload`, {
          method: 'POST',
          body: formData
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data && data.id) {
              setResumes(prev => prev.map(r => r.id === tempId ? {
                ...r,
                id: data.id,
                parsed_content: data.parsed_content || '',
                introduction: data.introduction || '',
                professional_summary: data.professional_summary || '',
                career_journey: data.career_journey || '',
                strengths: data.strengths || '',
                project_summary: data.project_summary || ''
              } : r));
            }
          })
          .catch(err => console.error("Database resume upload failed:", err));
      });
    }
  };

  const toggleActive = (id: string) => {
    setResumes(prev => prev.map(r => ({
      ...r,
      active: r.id === id
    })));

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) && keys.userId) {
      fetch(`${API_BASE}/api/resumes/${id}/activate?user_id=${keys.userId}`, { method: 'PATCH' })
        .catch(err => console.error("Database activate failed:", err));
    }
  };

  const deleteResume = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resume? This action cannot be undone.')) return;
    setResumes(prev => prev.filter(r => r.id !== id));
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      fetch(`${API_BASE}/api/resumes/${id}`, { method: 'DELETE' })
        .catch(err => console.error("Database delete failed:", err));
    }
  };

  const activeResume = resumes.find(r => r.active);

  return (
    <Page title="Resume Intelligence" subtitle="Manage your resumes. The active resume is used to personalize your live interview answers.">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex h-48 flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all ${dragging
              ? 'border-violet-500 bg-violet-500/10 scale-[0.99]'
              : 'border-white/10 bg-white/[0.02] hover:border-violet-400/30 hover:bg-violet-500/5'
              } text-center relative`}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload size={36} className={`mb-3 ${dragging ? 'text-violet-400 animate-bounce' : 'text-slate-500'}`} />
            <h3 className="text-base font-black text-white">Drag & Drop Resumes Here</h3>
            <p className="mt-1 text-xs text-slate-500">Supports PDF, DOCX, TXT up to 10MB (or click to browse)</p>
          </div>

          <Card>
            <h3 className="text-lg font-black mb-4 flex items-center justify-between">
              <span>My Resumes</span>
              <span className="text-xs text-slate-500 font-normal">{resumes.length} uploaded</span>
            </h3>
            <div className="space-y-3">
              {resumes.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No resumes uploaded yet. Upload one to get started.</div>
              ) : (
                resumes.map(r => (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${r.active
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${r.active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate max-w-[240px]" title={r.name}>{r.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{r.size} • Uploaded {r.uploadDate}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleActive(r.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${r.active
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
                          }`}
                      >
                        {r.active ? 'Active' : 'Make Active'}
                      </button>
                      <button
                        onClick={() => deleteResume(r.id)}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                        title="Delete resume"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black mb-3">Active Resume Preview</h3>
            {activeResume ? (
              <>
                <p className="text-xs text-slate-400 mb-3 truncate max-w-[260px]" title={activeResume.name}>Analyzing: {activeResume.name}</p>
                
                {/* Tabs */}
                <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3 mb-4">
                  {[
                    { id: 'intro', label: 'AI Intro' },
                    { id: 'summary', label: 'Summary' },
                    { id: 'journey', label: 'Journey' },
                    { id: 'strengths', label: 'Strengths' },
                    { id: 'projects', label: 'Projects' },
                    { id: 'raw', label: 'Raw Text' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setPreviewTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        previewTab === tab.id
                          ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                          : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide flex justify-between items-center">
                    <span>
                      {previewTab === 'intro' && 'AI Speakable Introduction'}
                      {previewTab === 'summary' && 'Professional Summary'}
                      {previewTab === 'journey' && 'Career Journey Progression'}
                      {previewTab === 'strengths' && 'Skills & Strengths'}
                      {previewTab === 'projects' && 'Projects & Tech Summary'}
                      {previewTab === 'raw' && 'Raw Parsed Content'}
                    </span>
                    <button
                      onClick={() => {
                        let text = '';
                        if (previewTab === 'intro') text = activeResume.introduction;
                        else if (previewTab === 'summary') text = activeResume.professional_summary;
                        else if (previewTab === 'journey') text = activeResume.career_journey;
                        else if (previewTab === 'strengths') text = activeResume.strengths;
                        else if (previewTab === 'projects') text = activeResume.project_summary;
                        else text = activeResume.parsed_content;
                        navigator.clipboard.writeText(text || '');
                      }}
                      className="text-[10px] text-violet-400 hover:text-violet-300 font-bold bg-white/5 px-2 py-0.5 rounded transition-all cursor-pointer"
                    >
                      Copy Content
                    </button>
                  </div>
                  <div className="h-[320px] overflow-y-auto rounded-xl border border-white/10 bg-slate-950 p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {previewTab === 'intro' && (activeResume.introduction || 'Generating AI speakable introduction... Please wait.')}
                    {previewTab === 'summary' && (activeResume.professional_summary || 'Generating professional summary... Please wait.')}
                    {previewTab === 'journey' && (activeResume.career_journey || 'Generating career journey... Please wait.')}
                    {previewTab === 'strengths' && (activeResume.strengths || 'Generating skills and strengths... Please wait.')}
                    {previewTab === 'projects' && (activeResume.project_summary || 'Generating projects summary... Please wait.')}
                    {previewTab === 'raw' && (activeResume.parsed_content || 'No parsed content available.')}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                <FileText size={32} className="mb-2 text-slate-600" />
                <p className="text-xs">No active resume. Select one from the list to preview its parsed content.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}

function CompanyIntelligence() {
  return <Page title="Company Intelligence" subtitle="Company-specific prep, patterns, and likely questions.">
    <div className="grid gap-4 md:grid-cols-3">
      {[
        ['Amazon', 'Leadership Principles + System Design', 'Hard', 'Ownership, Dive Deep, Bias for Action'],
        ['Google', 'DSA + Distributed Systems', 'Hard', 'Scalability, correctness, tradeoffs'],
        ['Microsoft', 'Behavioral + Practical Design', 'Medium', 'Collaboration, practical design, clarity'],
      ].map(([name, focus, level, notes]) => <Card key={name}><h2 className="text-2xl font-black">{name}</h2><p className="mt-3 text-sm text-slate-400">{focus}</p><div className="mt-5 flex gap-2"><Badge tone={level === 'Hard' ? 'amber' : 'sky'}>{level}</Badge><Badge>Likely Questions</Badge></div><p className="mt-5 text-sm leading-6 text-slate-300">{notes}</p></Card>)}
    </div>
  </Page>;
}

function ScreenshotLab() {
  return <Page title="Screenshot Lab" subtitle="Upload interview screenshots and extract questions, code, SQL, or diagrams.">
    <section className="grid gap-6 xl:grid-cols-2">
      <Card><div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-violet-400/30 bg-violet-500/8 text-center"><ImageIcon size={48} className="text-violet-300" /><h2 className="mt-5 text-xl font-black">Drop Screenshot Here</h2><p className="mt-2 max-w-sm text-sm text-slate-400">Supports coding platforms, system design diagrams, SQL tables, and browser interview prompts.</p><Button className="mt-5">Upload Screenshot</Button></div></Card>
      <Card><h2 className="text-xl font-black">Detected Output Preview</h2><div className="mt-5 space-y-4"><Output k="Question Type" v="System Design" /><Output k="Detected Question" v="Design a realtime notification service." /><Output k="Difficulty" v="Senior" /><div className="rounded-3xl bg-slate-950/70 p-5 text-sm leading-7 text-slate-300">Recommended answer will appear here after image processing.</div></div></Card>
    </section>
  </Page>;
}

function Knowledge() {
  const keys = getCurrentUserKeys();
  const [tab, setTab] = useState<'docs' | 'prompts'>('docs');

  // docs state
  const [docs, setDocs] = useState<any[]>(() => {
    const saved = localStorage.getItem(keys.docsKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docDragging, setDocDragging] = useState(false);

  // prompts state
  const [prompts, setPrompts] = useState<any[]>(() => {
    const saved = localStorage.getItem(keys.promptsKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [promptTitleInput, setPromptTitleInput] = useState('');
  const [promptContentInput, setPromptContentInput] = useState('');

  const calculatedTokens = 580 + prompts
    .filter(p => p.active)
    .reduce((sum, p) => sum + Math.ceil((p.content || '').length / 4.0), 0);
  const [promptDragging, setPromptDragging] = useState(false);

  useEffect(() => {
    localStorage.setItem(keys.docsKey, JSON.stringify(docs));
  }, [docs, keys.docsKey]);

  useEffect(() => {
    localStorage.setItem(keys.promptsKey, JSON.stringify(prompts));
  }, [prompts, keys.promptsKey]);

  useEffect(() => {
    if (keys.userId) {
      fetch(`${API_BASE}/api/knowledge?user_id=${keys.userId}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (data && data.length > 0) {
            const backendDocs = data.filter((item: any) => item.document_type !== 'prompt');
            const backendPrompts = data.filter((item: any) => item.document_type === 'prompt');

            if (backendDocs.length > 0) {
              const formattedDocs = backendDocs.map((d: any) => ({
                id: d.id,
                name: d.document_name,
                content: d.content,
                active: true,
                size: d.content ? `${(d.content.length / 1024).toFixed(0)} KB` : '1 KB',
                uploadDate: 'Previously uploaded'
              }));
              setDocs(formattedDocs);
            }
            if (backendPrompts.length > 0) {
              const formattedPrompts = backendPrompts.map((p: any) => ({
                id: p.id,
                name: p.document_name,
                content: p.content,
                active: true,
                uploadDate: 'Previously uploaded'
              }));
              setPrompts(formattedPrompts);
            }
          }
        }).catch(err => console.error("Failed to fetch knowledge:", err));
    }
  }, [keys.userId]);

  // doc handlers
  const handleDocDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDocDragging(true);
  };
  const handleDocDragLeave = () => {
    setDocDragging(false);
  };
  const handleDocDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDocDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      files.forEach(async (file) => {
        const tempId = String(Date.now() + Math.random());
        const newDoc = {
          id: tempId,
          name: file.name,
          active: true,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          uploadDate: 'Just now',
          content: ''
        };
        setDocs(prev => [...prev, newDoc]);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', 'document');
        if (keys.userId) {
          formData.append('user_id', keys.userId);
        }

        try {
          const res = await fetch(`${API_BASE}/api/knowledge/upload`, {
            method: 'POST',
            body: formData
          });
          if (!res.ok) throw new Error("Failed to upload document");
          const data = await res.json();
          if (data && data.id) {
            setDocs(prev => prev.map(d => d.id === tempId ? { ...d, id: data.id, content: data.content || '' } : d));
          }
        } catch (err) {
          console.error("Database doc sync failed:", err);
        }
      });
    }
  };
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach(async (file) => {
        const tempId = String(Date.now() + Math.random());
        const newDoc = {
          id: tempId,
          name: file.name,
          active: true,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          uploadDate: 'Just now',
          content: ''
        };
        setDocs(prev => [...prev, newDoc]);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', 'document');
        if (keys.userId) {
          formData.append('user_id', keys.userId);
        }

        try {
          const res = await fetch(`${API_BASE}/api/knowledge/upload`, {
            method: 'POST',
            body: formData
          });
          if (!res.ok) throw new Error("Failed to upload document");
          const data = await res.json();
          if (data && data.id) {
            setDocs(prev => prev.map(d => d.id === tempId ? { ...d, id: data.id, content: data.content || '' } : d));
          }
        } catch (err) {
          console.error("Database doc sync failed:", err);
        }
      });
    }
  };
  const toggleDocActive = (id: string) => {
    setDocs(prev => prev.map(d => ({
      ...d,
      active: d.id === id ? !d.active : d.active
    })));
  };
  const deleteDoc = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    setDocs(prev => prev.filter(d => d.id !== id));
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      fetch(`${API_BASE}/api/knowledge/${id}`, { method: 'DELETE' })
        .catch(err => console.error("Database delete doc failed:", err));
    }
  };

  // prompt handlers
  const handlePromptDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setPromptDragging(true);
  };
  const handlePromptDragLeave = () => {
    setPromptDragging(false);
  };
  const handlePromptDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPromptDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      files.forEach(async (file) => {
        const tempId = String(Date.now() + Math.random());
        const newPrompt = {
          id: tempId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          content: '',
          active: true,
          uploadDate: 'Just now'
        };
        setPrompts(prev => [...prev, newPrompt]);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', 'prompt');
        if (keys.userId) {
          formData.append('user_id', keys.userId);
        }

        try {
          const res = await fetch(`${API_BASE}/api/knowledge/upload`, {
            method: 'POST',
            body: formData
          });
          if (!res.ok) throw new Error("Failed to upload prompt");
          const data = await res.json();
          if (data && data.id) {
            setPrompts(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id, content: data.content || '' } : p));
          }
        } catch (err) {
          console.error("Database prompt sync failed:", err);
        }
      });
    }
  };
  const handlePromptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      files.forEach(async (file) => {
        const tempId = String(Date.now() + Math.random());
        const newPrompt = {
          id: tempId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          content: '',
          active: true,
          uploadDate: 'Just now'
        };
        setPrompts(prev => [...prev, newPrompt]);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', 'prompt');
        if (keys.userId) {
          formData.append('user_id', keys.userId);
        }

        try {
          const res = await fetch(`${API_BASE}/api/knowledge/upload`, {
            method: 'POST',
            body: formData
          });
          if (!res.ok) throw new Error("Failed to upload prompt");
          const data = await res.json();
          if (data && data.id) {
            setPrompts(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id, content: data.content || '' } : p));
          }
        } catch (err) {
          console.error("Database prompt sync failed:", err);
        }
      });
    }
  };
  const addPromptManually = () => {
    if (!promptTitleInput.trim() || !promptContentInput.trim()) return;
    const tempId = String(Date.now());
    const newPrompt = {
      id: tempId,
      title: promptTitleInput.trim(),
      content: promptContentInput.trim(),
      active: true,
      uploadDate: 'Just now'
    };
    setPrompts(prev => [...prev, newPrompt]);
    setPromptTitleInput('');
    setPromptContentInput('');

    if (keys.userId) {
      fetch(`${API_BASE}/api/knowledge?user_id=${keys.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_name: newPrompt.title,
          document_type: 'prompt',
          content: newPrompt.content
        })
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.id) {
            setPrompts(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
          }
        })
        .catch(err => console.error("Database prompt sync failed:", err));
    }
  };
  const togglePromptActive = (id: string) => {
    setPrompts(prev => prev.map(p => ({
      ...p,
      active: p.id === id ? !p.active : p.active
    })));
  };
  const deletePrompt = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this prompt template? This action cannot be undone.')) return;
    setPrompts(prev => prev.filter(p => p.id !== id));
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      fetch(`${API_BASE}/api/knowledge/${id}`, { method: 'DELETE' })
        .catch(err => console.error("Database delete prompt failed:", err));
    }
  };

  return (
    <Page title="Knowledge Base" subtitle="Manage your reference documents and prompt templates. Active resources are fed into the live session behavior and context layers.">
      <div className="flex border-b border-white/10 mb-6 max-w-xl shrink-0">
        <button
          onClick={() => setTab('docs')}
          className={`flex-1 py-3 text-sm font-black transition-all flex items-center justify-center gap-2 ${tab === 'docs'
            ? 'border-b-2 border-violet-500 text-violet-300 bg-violet-500/5'
            : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          <FileText size={16} /> Reference Docs
        </button>
        <button
          onClick={() => setTab('prompts')}
          className={`flex-1 py-3 text-sm font-black transition-all flex items-center justify-center gap-2 ${tab === 'prompts'
            ? 'border-b-2 border-violet-500 text-violet-300 bg-violet-500/5'
            : 'text-slate-500 hover:text-slate-300'
            }`}
        >
          <Library size={16} /> Prompt Templates
        </button>
      </div>

      {tab === 'docs' && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr] animate-fadeIn">
          <div className="space-y-6">
            <div
              onDragOver={handleDocDragOver}
              onDragLeave={handleDocDragLeave}
              onDrop={handleDocDrop}
              className={`flex h-48 flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all ${docDragging
                ? 'border-violet-500 bg-violet-500/10 scale-[0.99]'
                : 'border-white/10 bg-white/[0.02] hover:border-violet-400/30 hover:bg-violet-500/5'
                } text-center relative`}
            >
              <input
                type="file"
                multiple
                onChange={handleDocFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload size={36} className={`mb-3 ${docDragging ? 'text-violet-400 animate-bounce' : 'text-slate-500'}`} />
              <h3 className="text-base font-black text-white">Drag & Drop Documents Here</h3>
              <p className="mt-1 text-xs text-slate-500">Supports PDF, DOCX, TXT, MD up to 15MB (or click to browse)</p>
            </div>

            <Card>
              <h3 className="text-lg font-black mb-4 flex items-center justify-between">
                <span>Knowledge Base Files</span>
                <span className="text-xs text-slate-500 font-normal">{docs.length} indexed</span>
              </h3>
              <div className="space-y-3">
                {docs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">No files uploaded yet. Add reference docs to train the AI.</div>
                ) : (
                  docs.map(d => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDocId(d.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedDocId === d.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : d.active
                            ? 'border-violet-500/30 bg-violet-500/5'
                            : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${d.active ? 'bg-violet-500/15 text-violet-300' : 'bg-slate-800 text-slate-400'}`}>
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white truncate max-w-[240px]" title={d.name}>{d.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{d.size} • Uploaded {d.uploadDate}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={d.active}
                            onChange={() => toggleDocActive(d.id)}
                            className="h-4 w-4 accent-violet-600 rounded cursor-pointer"
                          />
                          <span className="text-xs text-slate-400 font-medium">Use Context</span>
                        </label>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteDoc(d.id); }}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                          title="Delete document"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black mb-3">Context Health Engine</h3>
              
              {/* Document Preview Box */}
              {(() => {
                const previewDoc = docs.find(d => d.id === selectedDocId) || docs.find(d => d.active) || docs[0];
                if (previewDoc) {
                  return (
                    <div className="mb-4 animate-fadeIn">
                      <div className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide flex justify-between items-center">
                        <span>Preview: {previewDoc.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(previewDoc.content || ''); }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold bg-white/5 px-2 py-0.5 rounded transition-all cursor-pointer"
                        >
                          Copy Text
                        </button>
                      </div>
                      <div className="h-32 overflow-y-auto rounded-xl border border-white/10 bg-slate-950 p-3 text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {previewDoc.content || 'No text content available.'}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <p className="text-xs text-slate-400 leading-5 mb-5">Active documents are parsed and converted into semantic vector embeddings. During live sessions, relevant snippets are injected directly into the prompt.</p>
              <div className="rounded-3xl border border-emerald-400/15 bg-emerald-500/8 p-5 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-sm">Embedding Status</span>
                  <Badge tone="emerald">Synced</Badge>
                </div>
                <div className="text-xs text-slate-400">All active document vectors are built and fully available.</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Active Reference Docs</span>
                  <span className="font-bold text-white">{docs.filter(d => d.active).length} files</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Index Size</span>
                  <span className="font-bold text-white">
                    {(docs.reduce((acc, d) => acc + (d.name.endsWith('.pdf') ? 1000 : 25), 0) / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">LLM Context Utilization</span>
                  <Badge tone="violet">Optimal (4.2k tokens)</Badge>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-5 border-t border-white/5 text-xs text-slate-500 leading-5">
              💡 <strong className="text-slate-300">Tip:</strong> Activating more documents increases the variety of matching context, but keep it targeted to the specific job description for maximum answer relevancy.
            </div>
          </Card>
        </div>
      )}

      {tab === 'prompts' && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr] animate-fadeIn">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div
                onDragOver={handlePromptDragOver}
                onDragLeave={handlePromptDragLeave}
                onDrop={handlePromptDrop}
                className={`flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all ${promptDragging
                  ? 'border-violet-500 bg-violet-500/10 scale-[0.99]'
                  : 'border-white/10 bg-white/[0.02] hover:border-violet-400/30 hover:bg-violet-500/5'
                  } text-center p-4 relative`}
              >
                <input
                  type="file"
                  multiple
                  accept=".txt,.md"
                  onChange={handlePromptFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload size={32} className={`mb-3 ${promptDragging ? 'text-violet-400 animate-bounce' : 'text-slate-500'}`} />
                <h3 className="text-sm font-black text-white">Drag & Drop Prompt Files</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-[150px] mx-auto">Drop template files (.txt, .md) to import them instantly (or click to browse)</p>
              </div>

              <Card className="flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-white">Add Prompt Template</h3>
                  <div>
                    <input
                      type="text"
                      placeholder="Template Title (e.g. Behavioral STAR)"
                      value={promptTitleInput}
                      onChange={e => setPromptTitleInput(e.target.value)}
                      className="w-full text-xs rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 outline-none focus:border-violet-500/50 text-white placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Write template instructions here..."
                      rows={4}
                      value={promptContentInput}
                      onChange={e => setPromptContentInput(e.target.value)}
                      className="w-full text-xs resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 outline-none focus:border-violet-500/50 text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>
                <button
                  onClick={addPromptManually}
                  disabled={!promptTitleInput.trim() || !promptContentInput.trim()}
                  className="mt-3 w-full rounded-xl bg-violet-600 py-2.5 text-xs font-black hover:bg-violet-500 disabled:opacity-40 transition-all text-white"
                >
                  Add Template
                </button>
              </Card>
            </div>

            <Card>
              <h3 className="text-lg font-black mb-4 flex items-center justify-between">
                <span>Saved Frameworks</span>
                <span className="text-xs text-slate-500 font-normal">{prompts.length} templates</span>
              </h3>
              <div className="space-y-3">
                {prompts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">No prompt templates saved yet. Create or drag & drop one above.</div>
                ) : (
                  prompts.map(p => (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all ${p.active
                        ? 'border-violet-500/30 bg-violet-500/5'
                        : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${p.active ? 'bg-violet-500/15 text-violet-300' : 'bg-slate-800 text-slate-400'}`}>
                            <Library size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{p.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Added {p.uploadDate}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={p.active}
                              onChange={() => togglePromptActive(p.id)}
                              className="h-4 w-4 accent-violet-600 rounded cursor-pointer"
                            />
                            <span className="text-xs text-slate-400 font-medium">Inject</span>
                          </label>
                          <button
                            onClick={() => deletePrompt(p.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                            title="Delete template"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-slate-400 bg-black/40 rounded-xl p-3 border border-white/5 whitespace-pre-wrap">{p.content}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black mb-3">AI Behavior Engine</h3>
              <p className="text-xs text-slate-400 leading-5 mb-5">By injecting structured answer templates, you override the default LLM system prompt. The model will format answers to explicitly match your guidelines.</p>
              <div className="rounded-3xl border border-violet-400/15 bg-violet-500/8 p-5 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-sm">Active Templates</span>
                  <span className="font-bold text-violet-300">{prompts.filter(p => p.active).length} Injected</span>
                </div>
                <div className="text-xs text-slate-400">These will combine in the system instruction buffer during live streaming.</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Response Tone Preference</span>
                  <Badge tone="emerald">Structured & Analytical</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Tokens Consumed</span>
                  <span className="font-bold text-white">~{calculatedTokens} tokens</span>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-5 border-t border-white/5 text-xs text-slate-500 leading-5">
              💡 <strong className="text-slate-300">Prompt Style:</strong> Keep system prompts short and imperative (e.g. "Do not output intro commentary", "Use markdown tables for metrics").
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}

function Analytics() {
  return (
    <Page title="Analytics & Insights" subtitle="Track your progression, latency trends, and AI context score.">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Overall Score', '88%', 'High confidence (+3% vs last week)', 'emerald'],
          ['Sessions Practiced', '14 rounds', '5 system design, 9 coding', 'violet'],
          ['Avg AI Response Time', '1.1 seconds', 'Streaming mode (Fast)', 'sky'],
          ['Context Index Health', '94% Score', 'Full active sync coverage', 'amber']
        ].map(([title, value, description, tone]) => (
          <Card key={title} className="relative overflow-hidden">
            <div className="flex flex-col justify-between h-full">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
                <div className="mt-4 text-3xl font-black text-white">{value}</div>
              </div>
              <p className="mt-4 text-xs text-slate-400">{description}</p>
            </div>
            <div className={`absolute -right-6 -bottom-6 h-20 w-20 rounded-full opacity-10 blur-xl ${tone === 'emerald' ? 'bg-emerald-500' :
              tone === 'violet' ? 'bg-violet-500' :
                tone === 'sky' ? 'bg-sky-500' : 'bg-amber-500'
              }`} />
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-white">Score Progression (Last 6 Sessions)</h3>
            <Badge tone="violet">Interactive Engaged</Badge>
          </div>

          <div className="relative w-full h-60 bg-slate-950/60 rounded-2xl p-4 border border-white/5 flex items-center justify-center">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1="20" y1="65" x2="480" y2="65" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1="20" y1="110" x2="480" y2="110" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <line x1="20" y1="155" x2="480" y2="155" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

              <path
                d="M 20 155 Q 100 130, 150 110 T 250 80 T 350 45 T 480 30 L 480 155 Z"
                fill="url(#chartGradient)"
              />

              <path
                d="M 20 155 Q 100 130, 150 110 T 250 80 T 350 45 T 480 30"
                fill="none"
                stroke="rgb(139, 92, 246)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              <circle cx="20" cy="155" r="4" fill="rgb(139, 92, 246)" stroke="rgb(167, 139, 250)" strokeWidth="2" />
              <circle cx="112" cy="122" r="4" fill="rgb(139, 92, 246)" stroke="rgb(167, 139, 250)" strokeWidth="2" />
              <circle cx="204" cy="98" r="4" fill="rgb(139, 92, 246)" stroke="rgb(167, 139, 250)" strokeWidth="2" />
              <circle cx="296" cy="62" r="4" fill="rgb(139, 92, 246)" stroke="rgb(167, 139, 250)" strokeWidth="2" />
              <circle cx="388" cy="41" r="4" fill="rgb(139, 92, 246)" stroke="rgb(167, 139, 250)" strokeWidth="2" />
              <circle cx="480" cy="30" r="5" fill="rgb(52, 211, 153)" stroke="rgb(16, 185, 129)" strokeWidth="2" />

              <text x="440" y="20" fill="rgb(52, 211, 153)" fontSize="10" fontWeight="bold">88%</text>

              <text x="15" y="180" fill="rgba(255,255,255,0.4)" fontSize="9">Session 1</text>
              <text x="107" y="180" fill="rgba(255,255,255,0.4)" fontSize="9">Session 2</text>
              <text x="199" y="180" fill="rgba(255,255,255,0.4)" fontSize="9">Session 3</text>
              <text x="291" y="180" fill="rgba(255,255,255,0.4)" fontSize="9">Session 4</text>
              <text x="383" y="180" fill="rgba(255,255,255,0.4)" fontSize="9">Session 5</text>
              <text x="455" y="180" fill="rgba(255,255,255,0.4)" fontSize="9">Latest</text>
            </svg>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-white mb-4">Competency Breakdown</h3>

            <div className="relative w-full h-44 bg-slate-950/60 rounded-2xl p-4 border border-white/5 flex items-center justify-center">
              <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
                <text x="0" y="15" fill="white" fontSize="9" fontWeight="bold">System Design</text>
                <rect x="0" y="22" width="220" height="7" rx="3.5" fill="rgba(255,255,255,0.05)" />
                <rect x="0" y="22" width="202" height="7" rx="3.5" fill="rgb(139, 92, 246)" />
                <text x="225" y="28" fill="rgb(167, 139, 250)" fontSize="9" fontWeight="bold">92%</text>

                <text x="0" y="45" fill="white" fontSize="9" fontWeight="bold">Algorithms & Coding</text>
                <rect x="0" y="52" width="220" height="7" rx="3.5" fill="rgba(255,255,255,0.05)" />
                <rect x="0" y="52" width="184" height="7" rx="3.5" fill="rgb(139, 92, 246)" />
                <text x="225" y="58" fill="rgb(167, 139, 250)" fontSize="9" fontWeight="bold">84%</text>

                <text x="0" y="75" fill="white" fontSize="9" fontWeight="bold">Behavioral STAR</text>
                <rect x="0" y="82" width="220" height="7" rx="3.5" fill="rgba(255,255,255,0.05)" />
                <rect x="0" y="82" width="193" height="7" rx="3.5" fill="rgb(139, 92, 246)" />
                <text x="225" y="88" fill="rgb(167, 139, 250)" fontSize="9" fontWeight="bold">88%</text>

                <text x="0" y="105" fill="white" fontSize="9" fontWeight="bold">Database & SQL</text>
                <rect x="0" y="112" width="220" height="7" rx="3.5" fill="rgba(255,255,255,0.05)" />
                <rect x="0" y="112" width="173" height="7" rx="3.5" fill="rgb(139, 92, 246)" />
                <text x="225" y="118" fill="rgb(167, 139, 250)" fontSize="9" fontWeight="bold">79%</text>
              </svg>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 leading-normal">
            Your strongest dimension is <strong className="text-slate-300">System Design</strong>, while <strong className="text-slate-300">Database & SQL</strong> has the largest room for gain.
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="border-l-4 border-emerald-500">
          <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Strong Areas
          </h4>
          <ul className="mt-3 space-y-2.5 text-xs text-slate-300 leading-5">
            <li>• <strong className="text-white">Kafka Queueing:</strong> Perfect details on retention settings and dead-letter pipelines.</li>
            <li>• <strong className="text-white">In-memory caching:</strong> Correct callouts on write-through strategies vs cache-aside.</li>
            <li>• <strong className="text-white">STAR Metric quantification:</strong> Increased score by 18% by framing impact in latency reductions.</li>
          </ul>
        </Card>

        <Card className="border-l-4 border-amber-500">
          <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
            <Target size={14} /> Action Items to Improve
          </h4>
          <ul className="mt-3 space-y-2.5 text-xs text-slate-300 leading-5">
            <li>• <strong className="text-white">Capacity Estimates:</strong> Practice computing storage requirements for a URL shortener mock.</li>
            <li>• <strong className="text-white">SQL deep join plans:</strong> Memorize execution plan indicators for index scans vs index seeks.</li>
            <li>• <strong className="text-white">System failure handles:</strong> Add robust circuit-breakers discussions in system design.</li>
          </ul>
        </Card>
      </section>
    </Page>
  );
}

function SessionReplay() {
  return <Page title="Session Replay" subtitle="Replay questions, answers, feedback, and improvement points.">
    <div className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
      <Card><h2 className="text-xl font-black">Timeline</h2>{['Question 1', 'Question 2', 'Question 3', 'Question 4'].map((x, i) => <div key={x} className="mt-4 rounded-2xl bg-white/[0.035] p-4"><div className="font-bold">{x}</div><div className="text-xs text-slate-500">00:{(i + 1) * 8}</div></div>)}</Card>
      <Card><h2 className="text-xl font-black">Replay Detail</h2><p className="mt-4 leading-7 text-slate-300">Question: How would you design a scalable URL shortener?</p><div className="mt-5 rounded-3xl bg-slate-950/70 p-5 text-sm leading-7 text-slate-300">Feedback: Strong high-level structure. Improve by adding capacity estimation and failure handling.</div></Card>
    </div>
  </Page>;
}

function Settings() {
  return <Page title="Settings" subtitle="Configure model, answer style, privacy, and workspace preferences.">
    <div className="grid gap-4 md:grid-cols-2">
      {[
        ['Answer Style', 'Senior Engineer'],
        ['Default Model', 'Gemini 2.5 Flash'],
        ['Language', 'English'],
        ['Privacy Mode', 'Store Summary Only'],
        ['Overlay Transparency', '92%'],
        ['Response Speed', 'Fast']
      ].map(([a, b]) => <Card key={a}><p className="text-sm text-slate-500">{a}</p><h2 className="mt-2 text-xl font-black text-white">{b}</h2></Card>)}
    </div>
  </Page>;
}

function Billing() {
  const [billingTab, setBillingTab] = useState<'periods' | 'credits'>('periods');

  const creditPlans = [
    {
      title: '3 Sessions Pack',
      originalPrice: '₹599',
      price: '₹399',
      discount: '33% OFF',
      desc: 'Get 3 full-length live mock sessions. Realtime transcripts and AI feedback history included.',
      validity: 'Valid for 30 days',
      badge: '',
      popular: false,
    },
    {
      title: '6 Sessions Pack',
      originalPrice: '₹1199',
      price: '₹699',
      discount: '42% OFF',
      desc: 'Get 6 live mock sessions + 1 bonus session free! Complete resume and reference docs context matching.',
      validity: 'Valid for 60 days',
      badge: 'Popular Choice',
      popular: true,
    },
    {
      title: '10 Sessions Pack',
      originalPrice: '₹1999',
      price: '₹999',
      discount: '50% OFF',
      desc: 'Get 10 live mock sessions + 3 bonus sessions free! Best format to prepare extensively for complex loops.',
      validity: 'Valid for 90 days',
      badge: 'Best Value',
      popular: false,
    },
  ];

  const periodPlans = [
    {
      title: 'Free Plan',
      originalPrice: '',
      price: '₹0',
      period: 'forever',
      discount: '',
      desc: '1 live session/day (up to 10 mins). Basic AI suggestions and transcript.',
      badge: '',
      popular: false,
      isCurrent: true,
    },
    {
      title: 'Weekly Pass',
      originalPrice: '₹999',
      price: '₹599',
      period: 'week',
      discount: '40% OFF',
      desc: 'Unlimited live sessions for 7 days. Personalized resume synchronization.',
      badge: '',
      popular: false,
    },
    {
      title: 'Monthly Subscription',
      originalPrice: '₹2999',
      price: '₹1599',
      period: 'month',
      discount: '47% OFF',
      desc: 'Unlimited live sessions for 30 days. Resume matching + Knowledge Base indexing.',
      badge: 'Best Deal',
      popular: true,
    },
    {
      title: 'Yearly Subscription',
      originalPrice: '₹19999',
      price: '₹9999',
      period: 'year',
      discount: '50% OFF',
      desc: 'Unlimited live sessions for 1 year. Priority audio channel access, full session archives.',
      badge: 'Mega Saver',
      popular: false,
    },
  ];

  return (
    <Page title="Billing & Pricing" subtitle="Choose between session-based credits or unlimited time-based subscriptions. Offers applied automatically.">
      {/* Toggle Selector */}
      <div className="flex border border-white/10 p-1 rounded-2xl max-w-md bg-slate-900/60 mb-8 shrink-0">
        <button
          onClick={() => setBillingTab('periods')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${billingTab === 'periods'
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-glow'
            : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <SlidersHorizontal size={14} /> Subscription Periods
        </button>
        <button
          onClick={() => setBillingTab('credits')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${billingTab === 'credits'
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-glow'
            : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Zap size={14} /> Session Credits
        </button>
      </div>

      {/* Plans List */}
      <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
        {billingTab === 'credits' ? (
          creditPlans.map((plan) => (
            <Card
              key={plan.title}
              className={`relative overflow-hidden flex flex-col justify-between h-full border transition-all ${plan.popular ? 'border-violet-500/40 bg-violet-950/20 shadow-glow' : 'border-white/10 bg-slate-900/40'
                }`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <Badge tone={plan.popular ? 'violet' : 'emerald'}>{plan.badge}</Badge>
                </div>
              )}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-white">{plan.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  {plan.originalPrice && (
                    <span className="text-sm text-slate-500 line-through">{plan.originalPrice}</span>
                  )}
                  {plan.discount && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      {plan.discount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{plan.desc}</p>
                <div className="text-[10px] text-slate-500 font-bold bg-white/[0.02] border border-white/5 py-1 px-2.5 rounded-lg w-max">
                  {plan.validity}
                </div>
              </div>
              <div className="mt-8">
                <Button
                  className="w-full py-2.5"
                  variant={plan.popular ? 'primary' : 'secondary'}
                >
                  Buy Credits
                </Button>
              </div>
            </Card>
          ))
        ) : (
          periodPlans.map((plan) => (
            <Card
              key={plan.title}
              className={`relative overflow-hidden flex flex-col justify-between h-full border transition-all ${plan.popular ? 'border-violet-500/40 bg-violet-950/20 shadow-glow' : 'border-white/10 bg-slate-900/40'
                }`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <Badge tone={plan.popular ? 'violet' : 'emerald'}>{plan.badge}</Badge>
                </div>
              )}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-white">{plan.title}</h3>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  {plan.originalPrice && (
                    <span className="text-sm text-slate-500 line-through">{plan.originalPrice}</span>
                  )}
                  {plan.period && plan.price !== '₹0' && (
                    <span className="text-xs text-slate-500">/{plan.period}</span>
                  )}
                  {plan.discount && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                      {plan.discount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{plan.desc}</p>
              </div>
              <div className="mt-8">
                <Button
                  className="w-full py-2.5"
                  variant={plan.popular ? 'primary' : 'secondary'}
                >
                  {plan.isCurrent ? 'Current Plan' : 'Subscribe'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </Page>
  );
}

function SessionSummary({ onHome, onReplay }: { onHome: () => void; onReplay: () => void }) {
  return <Page title="Interview Summary" subtitle="Review strengths, gaps, and learning plan.">
    <div className="mb-6 flex gap-2"><Button variant="secondary" onClick={onReplay}>Replay Session</Button><Button onClick={onHome}>Back Home</Button></div>
    <section className="grid gap-4 md:grid-cols-4">{[['Questions', '12'], ['Strong', '8'], ['Improve', '3'], ['Score', '86%']].map(([a, b]) => <Card key={a}><p className="text-sm text-slate-400">{a}</p><div className="mt-4 text-3xl font-black">{b}</div></Card>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-2"><Card><h2 className="text-xl font-black">Strengths</h2><div className="mt-4 flex flex-wrap gap-2">{['Clear structure', 'Good caching explanation', 'Strong API design'].map((x) => <Badge key={x} tone="emerald">{x}</Badge>)}</div></Card><Card><h2 className="text-xl font-black">Improve Next</h2><div className="mt-4 space-y-4"><Plan label="Database sharding" value={58} /><Plan label="Failure handling" value={64} /><Plan label="Capacity estimation" value={42} /></div></Card></section>
  </Page>;
}

function Page({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="px-5 py-7 lg:px-8 flex-1 overflow-y-auto min-h-0"><div className="mb-8"><p className="text-sm font-semibold text-violet-300">CopilotX</p><h1 className="mt-2 text-4xl font-black text-white">{title}</h1><p className="mt-2 text-slate-400">{subtitle}</p></div>{children}</main>;
}

function useStream() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef<number | undefined>(undefined);

  useEffect(() => () => clearInterval(ref.current), []);

  return {
    text,
    busy,
    start: (full: string) => {
      clearInterval(ref.current);
      setText('');
      setBusy(true);

      // Extract indices of word/whitespace boundaries to animate cleanly
      const boundaryIndices: number[] = [];
      let idx = 0;
      while (idx < full.length) {
        while (idx < full.length && full[idx] !== ' ' && full[idx] !== '\n' && full[idx] !== '\t') {
          idx++;
        }
        while (idx < full.length && (full[idx] === ' ' || full[idx] === '\n' || full[idx] === '\t')) {
          idx++;
        }
        boundaryIndices.push(idx);
      }
      if (boundaryIndices.length === 0 || boundaryIndices[boundaryIndices.length - 1] !== full.length) {
        boundaryIndices.push(full.length);
      }

      let i = 0;
      ref.current = window.setInterval(() => {
        i++;
        if (i <= boundaryIndices.length) {
          setText(full.slice(0, boundaryIndices[i - 1]));
        }
        if (i >= boundaryIndices.length) {
          clearInterval(ref.current);
          setBusy(false);
        }
      }, 8);
    },
    update: (content: string, isBusy: boolean) => {
      clearInterval(ref.current);
      setText(content);
      setBusy(isBusy);
    }
  };
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div><label className="mb-2 block text-sm font-bold">{label}</label><input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm outline-none" /></div>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return <div><label className="mb-2 block text-sm font-bold">{label}</label><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm outline-none">{options.map((o) => <option className="bg-slate-950" key={o}>{o}</option>)}</select></div>;
}

function Tool({ icon: Icon, label }: { icon: any; label: string }) {
  return <button className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-slate-200 hover:bg-white/[0.08]"><Icon size={15} />{label}</button>;
}

function Plan({ label, value }: { label: string; value: number }) {
  return <div><div className="mb-2 flex justify-between text-sm"><span className="text-slate-300">{label}</span><span>{value}%</span></div><Progress value={value} /></div>;
}

function Output({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between rounded-2xl bg-white/[0.035] p-4 text-sm"><span className="text-slate-500">{k}</span><span className="font-bold text-white">{v}</span></div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="text-2xl font-black text-white">{value}</div><div className="mt-1 text-xs text-slate-500">{label}</div></div>;
}

function PreviewCard({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl bg-white/[0.035] p-4"><div className="text-xs font-black uppercase tracking-wide text-violet-300">{title}</div><p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></div>;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass card-hover rounded-3xl p-5 ${className}`}>{children}</div>;
}

const toneMap = {
  violet: 'bg-violet-500/12 text-violet-200 ring-violet-400/20',
  emerald: 'bg-emerald-500/12 text-emerald-200 ring-emerald-400/20',
  amber: 'bg-amber-500/12 text-amber-200 ring-amber-400/20',
  sky: 'bg-sky-500/12 text-sky-200 ring-sky-400/20',
  rose: 'bg-rose-500/12 text-rose-200 ring-rose-400/20',
};

function Badge({ children, tone = 'violet' }: { children: React.ReactNode; tone?: keyof typeof toneMap }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneMap[tone]}`}>{children}</span>;
}

function Button({ children, onClick, variant = 'primary', className = '' }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger'; className?: string }) {
  const styles = {
    primary: 'btn-gradient text-white shadow-lg shadow-violet-600/15',
    secondary: 'btn-glass text-slate-200 border border-white/10 hover:border-white/20 hover:text-white',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/10 hover:from-red-500 hover:to-rose-500'
  };
  return <button onClick={onClick} className={`rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 active:translate-y-0 cursor-pointer ${styles[variant]} ${className}`}>{children}</button>;
}

function Progress({ value }: { value: number }) {
  return <div className="h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${value}%` }} /></div>;
}

// getMockAnswerForQuestion removed — only real API responses are used

interface Segment {
  type: 'text' | 'code';
  content: string;
  lang?: string;
}

function parseMarkdown(text: string): Segment[] {
  const segments: Segment[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const codeBlockStart = text.indexOf('```', currentIndex);
    if (codeBlockStart === -1) {
      segments.push({
        type: 'text',
        content: text.slice(currentIndex)
      });
      break;
    }

    if (codeBlockStart > currentIndex) {
      segments.push({
        type: 'text',
        content: text.slice(currentIndex, codeBlockStart)
      });
    }

    const nextStart = codeBlockStart + 3;
    const codeBlockEnd = text.indexOf('```', nextStart);

    if (codeBlockEnd === -1) {
      // Unclosed code block (streaming)
      const codePart = text.slice(nextStart);
      const firstNewline = codePart.indexOf('\n');
      let lang = '';
      let code = codePart;
      if (firstNewline !== -1) {
        const potentialLang = codePart.slice(0, firstNewline).trim();
        if (/^[a-zA-Z0-9_+-]+$/.test(potentialLang)) {
          lang = potentialLang;
          code = codePart.slice(firstNewline + 1);
        }
      }
      segments.push({
        type: 'code',
        content: code,
        lang
      });
      break;
    } else {
      // Closed code block
      const codePart = text.slice(nextStart, codeBlockEnd);
      const firstNewline = codePart.indexOf('\n');
      let lang = '';
      let code = codePart;
      if (firstNewline !== -1) {
        const potentialLang = codePart.slice(0, firstNewline).trim();
        if (/^[a-zA-Z0-9_+-]+$/.test(potentialLang)) {
          lang = potentialLang;
          code = codePart.slice(firstNewline + 1);
        }
      }
      segments.push({
        type: 'code',
        content: code,
        lang
      });
      currentIndex = codeBlockEnd + 3;
    }
  }

  return segments;
}

function renderHighlightedCode(code: string, lang: string = 'code') {
  const lines = code.split('\n');

  return lines.map((line, lineIdx) => {
    if (line === '') {
      return <div key={lineIdx} className="h-4" />;
    }

    const tokenRegex = /(\/\/.*|#.*|--.*)|("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')|\b(def|class|return|if|else|elif|for|while|import|from|const|let|var|function|select|where|from|join|on|group|by|order|limit|null|true|false|None|self|and|or|not|in|as|try|except|catch|finally|throw|new|public|private|protected|static|void|int|str|float|bool|list|dict|set|tuple)\b|(\b\d+\b)|\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\()|(\s+)|([^\s\w]+)|([a-zA-Z_][a-zA-Z0-9_]*)/g;

    const tokens: React.ReactNode[] = [];
    let match;
    let keyIdx = 0;

    tokenRegex.lastIndex = 0;
    while ((match = tokenRegex.exec(line)) !== null) {
      const [
        _,
        comment,
        stringToken,
        keyword,
        numberToken,
        funcName,
        spaces,
        operator,
        identifier
      ] = match;

      if (comment) {
        tokens.push(<span key={keyIdx++} className="text-slate-500 italic">{comment}</span>);
      } else if (stringToken) {
        tokens.push(<span key={keyIdx++} className="text-emerald-400 font-medium">{stringToken}</span>);
      } else if (keyword) {
        tokens.push(<span key={keyIdx++} className="text-violet-400 font-bold">{keyword}</span>);
      } else if (numberToken) {
        tokens.push(<span key={keyIdx++} className="text-amber-400">{numberToken}</span>);
      } else if (funcName) {
        tokens.push(<span key={keyIdx++} className="text-sky-400 font-semibold">{funcName}</span>);
      } else if (spaces) {
        tokens.push(spaces);
      } else if (operator) {
        tokens.push(<span key={keyIdx++} className="text-pink-400 font-medium">{operator}</span>);
      } else if (identifier) {
        if (identifier === 'self' || identifier === 'None' || identifier === 'true' || identifier === 'false' || identifier === 'null') {
          tokens.push(<span key={keyIdx++} className="text-indigo-400 font-semibold">{identifier}</span>);
        } else {
          tokens.push(identifier);
        }
      }
    }

    return (
      <div key={lineIdx} className="min-h-[18px] leading-relaxed">
        {tokens.length > 0 ? tokens : line}
      </div>
    );
  });
}

function FormattedAnswer({ text }: { text: string }) {
  if (!text) return null;

  const segments = parseMarkdown(text);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-200">
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          return (
            <div key={index} className="my-4 overflow-hidden rounded-xl border border-violet-500/30 bg-[#05060f] shadow-lg font-mono text-xs ring-1 ring-violet-500/10">
              <div className="flex items-center justify-between bg-violet-950/20 px-4 py-2 border-b border-violet-500/20">
                <span className="text-[10px] uppercase tracking-wider text-violet-300 font-extrabold">{segment.lang || 'code'}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(segment.content.trim())}
                  className="rounded-md border border-violet-500/20 bg-violet-950/40 px-2 py-1 text-[10px] font-bold text-violet-300 hover:border-violet-500 hover:text-white hover:bg-violet-900 transition-all cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-slate-300 font-mono whitespace-pre-wrap bg-[#05060f]" style={{ whiteSpace: 'pre-wrap' }}>
                <code className="whitespace-pre-wrap" style={{ whiteSpace: 'pre-wrap' }}>{renderHighlightedCode(segment.content.trimEnd(), segment.lang)}</code>
              </pre>
            </div>
          );
        } else {
          // Parse normal text blocks, split by lines/paragraphs
          const lines = segment.content.split('\n');
          return (
            <div key={index} className="space-y-2">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                // Capture indentation for lists/paragraphs to preserve styling/nesting
                const leadingSpacesMatch = line.match(/^(\s*)/);
                const indentCount = leadingSpacesMatch ? leadingSpacesMatch[1].length : 0;

                // Check if list item
                const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
                const isNumbered = /^\d+\.\s/.test(trimmed);

                if (isBullet || isNumbered) {
                  const content = isBullet ? trimmed.replace(/^[-*]\s+/, '') : trimmed.replace(/^\d+\.\s+/, '');
                  return (
                    <div key={lIdx} className="flex items-start gap-2.5 pl-1 my-1 animate-fadeIn" style={{ paddingLeft: `${indentCount * 8}px` }}>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                      <p className="text-slate-300 whitespace-pre-wrap">
                        {renderBoldText(content)}
                      </p>
                    </div>
                  );
                }

                // Check if heading (e.g. ### Heading)
                if (trimmed.startsWith('#')) {
                  const level = (trimmed.match(/^#+/) || ['#'])[0].length;
                  const content = trimmed.replace(/^#+\s+/, '');
                  const sizeClass = level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base';
                  return (
                    <h4 key={lIdx} className={`${sizeClass} font-black text-white mt-4 mb-2 tracking-tight`}>
                      {renderBoldText(content)}
                    </h4>
                  );
                }

                // Normal paragraph (trimEnd to preserve leading indentation for code that is formatted outside code blocks)
                return (
                  <p key={lIdx} className="text-slate-300 whitespace-pre-wrap">
                    {renderBoldText(line.trimEnd())}
                  </p>
                );
              })}
            </div>
          );
        }
      })}
    </div>
  );
}

function renderBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
