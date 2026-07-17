import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Brain, Mic, MicOff, FileText, Building2, Image as ImageIcon, Library, BarChart3,
  NotebookPen, ShieldCheck, PlayCircle, Home, Search, Bell, Plus, X, Briefcase, LayoutDashboard,
  Code2, Database, Workflow, UserRound, Upload, Sparkles, Timer, Radio, Send,
  PlusCircle, Copy, Save, Camera, Pause, Pin, Minimize2, Maximize2, Move,
  SlidersHorizontal, CheckCircle2, Crown, Zap, Target, Layers, ScreenShare, AlertCircle, ExternalLink,
  Volume2, VolumeX, Activity, MonitorSpeaker, HelpCircle, ChevronDown, ChevronUp, ChevronRight, Cpu,
  Laptop, Globe, Monitor, ArrowRight, PlayCircle as MonitorPlay, EyeOff, BellOff,
  Trash, Edit3, MessageSquare, Check, Video, Settings as SettingsIcon, CreditCard
} from 'lucide-react';
import './styles/globals.css';
import { signInWithGoogle, logOut, type AppUser, isFirebaseConfigured } from './firebase';



import sutraLogoImg from './assets/Logo.png';

export const SutraLogo = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <img
    src={sutraLogoImg}
    alt="Sutra AI Logo"
    width={size}
    height={size}
    className={className}
    style={{ objectFit: 'contain', display: 'block' }}
  />
);


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
  | 'Suggestions'
  | 'Help'
  | 'Admin'
  | 'Sync';

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

export type Suggestion = {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  source: string;
};

export const saveSuggestion = (text: string, source: string, userId: string = 'anonymous') => {
  try {
    const existing = localStorage.getItem('sutra-suggestions');
    const suggestions: Suggestion[] = existing ? JSON.parse(existing) : [];
    const newSuggestion: Suggestion = {
      id: Date.now().toString(),
      userId,
      text,
      createdAt: new Date().toLocaleString(),
      source
    };
    suggestions.unshift(newSuggestion);
    localStorage.setItem('sutra-suggestions', JSON.stringify(suggestions));
  } catch (e) {
    console.error("Failed to save suggestion", e);
  }
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

export const SuggestionModal = ({ isOpen, onClose, source, onComplete }: { isOpen: boolean, onClose: () => void, source: string, onComplete?: () => void }) => {
  const [text, setText] = useState('');
  if (!isOpen) return null;
  const handleSubmit = () => {
    const keys = getCurrentUserKeys();
    saveSuggestion(text, source, keys.userId || 'anonymous');
    setText('');
    onClose();
    if (onComplete) onComplete();
  };
  const handleSkip = () => {
    setText('');
    onClose();
    if (onComplete) onComplete();
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl border border-slate-200">
        <button onClick={handleSkip} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-slate-900 mb-1 font-display">Leave a Suggestion</h3>
        <p className="text-sm text-slate-500 mb-5 font-medium">How can we improve {source}?</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all resize-none mb-5"
          placeholder="Your feedback..."
        />
        <div className="flex justify-end items-center gap-4">
          <button onClick={handleSkip} className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">Skip</button>
          <button onClick={handleSubmit} disabled={!text.trim()} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-sm">Submit</button>
        </div>
      </div>
    </div>
  );
};


export let ADMIN_EMAILS = ['kirankumar82054@gmail.com', 'omkarvenkat07@gmail.com'];
export const setAdminEmails = (emails: string[]) => { ADMIN_EMAILS = emails; };
export const isAdminUser = (email: string | null | undefined) => !!email && ADMIN_EMAILS.includes(email);

export function parseVideoUrl(url: string) {
  if (!url) return { type: 'youtube', id: 'dQw4w9WgXcQ' };
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  if (ytMatch) return { type: 'youtube', id: ytMatch[1] };
  if (url.length === 11 && !url.includes('/') && !url.includes('.')) return { type: 'youtube', id: url };
  return { type: 'direct', url };
}

export const getNav = (isAdmin: boolean) => {
  const base = [
    { label: 'Dashboard', icon: LayoutDashboard, screen: 'Dashboard' },
    { label: 'Live Session', icon: Mic, screen: 'Live Session' },
    { label: 'Mock Interview', icon: UserRound, screen: 'Mock Interview' },
    { label: 'Recent Sessions', icon: PlayCircle, screen: 'Recent Sessions' },
    { label: 'Resumes', icon: FileText, screen: 'Resume Intelligence' },
    { label: 'Knowledge', icon: Brain, screen: 'Knowledge' },
    { label: 'Help', icon: HelpCircle, screen: 'Help' },
    { label: 'Billing', icon: CreditCard, screen: 'Billing' },
    { label: 'Suggestions', icon: MessageSquare, screen: 'Suggestions' },
  ];
  if (isAdmin) {
    base.push({ label: 'Admin Console', icon: Crown, screen: 'Admin' });
  }
  return base;
};

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
  icon: Icon,
  theme = 'dark'
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  icon?: any;
  theme?: 'dark' | 'light';
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

  const isLight = theme === 'light';

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all cursor-pointer shadow-sm focus:border-teal-500/50 ${
          isLight 
            ? 'bg-white border-slate-200 !text-slate-900 hover:bg-slate-50'
            : 'bg-[#0f1123]/95 border-slate-200 text-slate-200 hover:bg-[#0f1123]'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon size={16} className={`${isLight ? 'text-slate-400' : 'text-slate-400'} shrink-0`} />}
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className={`truncate ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
      </button>

      {isOpen && (
        <div className={`absolute left-0 mt-1.5 z-40 w-full rounded-xl border p-1.5 shadow-2xl max-h-60 overflow-y-auto animate-fadeIn ${
          isLight 
            ? 'bg-white border-slate-200 shadow-xl'
            : 'bg-[#0c0d1e]/98 border-slate-200 backdrop-blur-md'
        }`}>
          {options.length === 0 ? (
            <div className={`px-3 py-2 text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No options available</div>
          ) : (
            options.map((opt) => {
              const isActive = opt.value === value;
              const isAddBtn = opt.value === 'add_from_computer';
              
              let btnClass = '';
              if (isActive) {
                btnClass = isLight 
                  ? 'bg-teal-50 text-teal-700 font-bold border border-teal-100'
                  : 'bg-teal-600/30 text-white font-bold border border-teal-500/20';
              } else if (isAddBtn) {
                btnClass = isLight
                  ? 'text-teal-600 hover:bg-teal-50 border-t border-slate-100 mt-1 pt-2'
                  : 'text-cyan-300 hover:bg-cyan-500/10 border-t border-slate-200 mt-1 pt-2';
              } else {
                btnClass = isLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-slate-700 hover:bg-white/5 hover:text-white';
              }

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex flex-col transition-all cursor-pointer my-0.5 ${btnClass}`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    {opt.label}
                  </span>
                  {opt.sublabel && <span className={`text-[10px] font-normal truncate mt-0.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{opt.sublabel}</span>}
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

  // Set body background/color dynamically for light color scheme
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    document.body.style.backgroundColor = '#f8fafc';
    document.body.style.color = '#0f172a';
    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
    };
  }, []);

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
    <div className="relative flex min-h-screen items-center justify-center bg-[#f8fafc] overflow-hidden !text-slate-900 font-sans antialiased">
      {/* Drifting Aura Lights */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-teal-100/50 blur-[130px] z-0" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-teal-50/70 blur-[150px] z-0" />

      {/* Grid Pattern Pattern Mask */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(circle_at_50%_30%,black_60%,transparent_100%)] opacity-80 z-0" />

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden backdrop-blur-2xl animate-fadeIn">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 shadow-[0_4px_12px_rgba(245,158,11,0.3)] mb-5">
              <SutraLogo size={28} className="text-white" />
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight !text-slate-900">
              Sutra <span className="text-teal-500">AI</span>
            </h1>
            <p className="mt-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Interview OS Console
            </p>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs font-medium">
              Real-time AI Copilot, resume intelligence matching, and custom knowledge base triggers.
            </p>
          </div>

          <div className="h-px bg-slate-100 my-7" />

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600 flex items-center gap-2 animate-shake">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!isFirebaseConfigured && !isGsiConfigured && (
            <div className="mb-6 space-y-4 animate-fadeIn text-left">
              <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 mb-2">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  ✨ Developer Mode Fallback
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  Firebase / GSI is not configured on this host. Enter a developer Gmail and Candidate Name to access the console locally.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wider">Gmail Address</label>
                <input
                  type="email"
                  placeholder="e.g. candidate@gmail.com"
                  value={devEmail}
                  onChange={e => setDevEmail(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 outline-none focus:border-teal-500/50 text-slate-950 placeholder:!text-slate-400 transition-all font-semibold"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={devName}
                  onChange={e => setDevName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 outline-none focus:border-teal-500/50 text-slate-950 placeholder:!text-slate-400 transition-all font-semibold"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading || (!isFirebaseConfigured && !isGsiConfigured && (!devEmail.trim() || !devName.trim()))}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-98 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-transparent" />
            ) : (
              <svg className="h-5 w-5 transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            )}
            <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
          </button>


          <p className="mt-6 text-center text-[10px] text-slate-400 leading-normal font-semibold">
            Secure Google authentication protocol active. Data synced with your active local dashboard profile.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Admin Panel & Support Hub Component ──
interface AdminPanelProps {
  reviews: any[];
  setReviews: React.Dispatch<React.SetStateAction<any[]>>;
  appVideoUrl: string;
  setAppVideoUrl: (v: string) => void;
  supportTickets: any[];
  setSupportTickets: React.Dispatch<React.SetStateAction<any[]>>;
  shorts: any[];
  setShorts: React.Dispatch<React.SetStateAction<any[]>>;
  onBack: () => void;
  currentUser: any;
}

function AdminPanel({
  reviews,
  setReviews,
  appVideoUrl,
  setAppVideoUrl,
  supportTickets,
  setSupportTickets,
  shorts,
  setShorts,
  onBack,
  currentUser
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reviews' | 'video' | 'tickets' | 'shorts' | 'suggestions' | 'admins'>('dashboard');
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => {
    try {
      const saved = localStorage.getItem('sutra-suggestions');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Admins state
  const [adminEmailList, setAdminEmailList] = useState<string[]>(ADMIN_EMAILS);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  useEffect(() => {
    if (activeTab === 'admins') {
      fetch(`${API_BASE}/api/admins`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAdminEmailList(data);
            setAdminEmails(data);
          }
        })
        .catch(err => console.error("Error fetching admins", err));
    }
  }, [activeTab]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminEmail.includes('@')) return;
    if (adminEmailList.includes(newAdminEmail)) {
      alert("Admin already exists!");
      return;
    }
    setIsAddingAdmin(true);
    try {
      const res = await fetch(`${API_BASE}/api/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail })
      });
      if (res.ok) {
        setAdminEmailList([...adminEmailList, newAdminEmail]);
        setAdminEmails([...adminEmailList, newAdminEmail]);
        setNewAdminEmail('');
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to add admin");
      }
    } catch (err) {
      alert("Error adding admin");
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (emailToRemove: string) => {
    if (emailToRemove === currentUser?.email) {
      alert("You cannot remove yourself!");
      return;
    }
    if (adminEmailList.length <= 1) {
      alert("You cannot remove the last admin!");
      return;
    }
    if (!confirm(`Are you sure you want to remove ${emailToRemove} as admin?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admins/${emailToRemove}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const newList = adminEmailList.filter(e => e !== emailToRemove);
        setAdminEmailList(newList);
        setAdminEmails(newList);
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to remove admin");
      }
    } catch (err) {
      alert("Error removing admin");
    }
  };

  // Review Form States
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [authorCompany, setAuthorCompany] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80');

  // Support Chat States
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Video Form State
  const [tempVideoUrl, setTempVideoUrl] = useState(appVideoUrl);

  const selectedTicket = supportTickets.find(t => t.id === selectedTicketId);

  // Auto-fill form when editing
  const startEditReview = (r: any) => {
    setEditingReviewId(r.id);
    setAuthorName(r.name);
    setAuthorRole(r.role);
    setAuthorCompany(r.company);
    setRating(r.rating);
    setComment(r.comment);
    setAvatar(r.avatar);
  };

  const clearReviewForm = () => {
    setEditingReviewId(null);
    setAuthorName('');
    setAuthorRole('');
    setAuthorCompany('');
    setRating(5);
    setComment('');
    setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80');
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) return alert('Name and review content are required!');

    if (editingReviewId) {
      // Edit mode
      setReviews(prev => prev.map(r => r.id === editingReviewId ? {
        ...r,
        name: authorName,
        role: authorRole,
        company: authorCompany,
        rating,
        comment,
        avatar
      } : r));
    } else {
      // Add mode
      const newReview = {
        id: String(Date.now()),
        name: authorName,
        role: authorRole,
        company: authorCompany,
        rating,
        comment,
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'
      };
      setReviews(prev => [...prev, newReview]);
    }
    clearReviewForm();
  };

  const handleDeleteReview = (id: string) => {
    if (!window.confirm('Delete this review from landing page?')) return;
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempVideoUrl.trim()) return alert('Video URL cannot be empty.');
    setAppVideoUrl(tempVideoUrl);
    alert('Vip Demo Video updated successfully!');
  };

  const handleSendTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    // Append admin reply
    setSupportTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        const newMsg = { sender: 'admin' as const, text: replyText, time: 'Just now' };
        return {
          ...t,
          status: 'Pending' as const,
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    }));

    const sentText = replyText;
    setReplyText('');

    // Simulate real-time customer feedback response
    setTimeout(() => {
      setSupportTickets(prev => prev.map(t => {
        if (t.id === selectedTicketId) {
          const autoResponseText = sentText.toLowerCase().includes('help') || sentText.toLowerCase().includes('resolve')
            ? "Thank you! I will try doing that now and let you know if it resolves the issue."
            : "Awesome, thank you for checking into that. I appreciate the quick support!";
          return {
            ...t,
            messages: [...t.messages, { sender: 'user' as const, text: autoResponseText, time: 'Just now' }]
          };
        }
        return t;
      }));
    }, 2500);
  };

  const toggleTicketStatus = (ticketId: string, status: 'Open' | 'Pending' | 'Resolved') => {
    setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
  };

  const toggleTicketPriority = (ticketId: string, priority: 'Low' | 'Medium' | 'High') => {
    setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, priority } : t));
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full w-full overflow-hidden">
      {/* Admin Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-white/70 backdrop-blur-md border-r border-slate-200 p-4 space-y-1.5">
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'reviews', label: 'Manage Reviews', icon: Edit3 },
            { id: 'shorts', label: 'Manage Shorts', icon: Video },
            { id: 'video', label: 'Video Showcase', icon: Video },
            { id: 'tickets', label: 'Support Hub', icon: MessageSquare, badge: supportTickets.filter(t => t.status !== 'Resolved').length },
            { id: 'suggestions', label: 'User Suggestions', icon: HelpCircle, badge: suggestions.length },
            { id: 'admins', label: 'Manage Admins', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold transition-all cursor-pointer border ${active
                  ? 'bg-teal-50 text-teal-600 border-teal-100 shadow-sm'
                  : 'text-slate-600 border-transparent hover:bg-slate-50 hover:!text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && tab.badge > 0 ? (
                  <span className="bg-rose-100 text-rose-600 rounded-full px-1.5 py-0.5 text-[9px] font-black">{tab.badge}</span>
                ) : null}
              </button>
            );
          })}
        </aside>

        {/* Content Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="text-left">
                <h2 className="text-xl font-extrabold !text-slate-900">System Operations Overview</h2>
                <p className="text-xs text-slate-500 mt-1">Live metrics from your mock candidate portal, video configurations, and support hub.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Candidate Reviews</span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black !text-slate-900">{reviews.length}</span>
                    <span className="text-xs text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded">↑ 4.86</span>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-100/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm text-left cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => setActiveTab('shorts')}>
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Active Shorts</span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-purple-900">{shorts.length}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Showcase Video</span>
                  <div className="mt-3">
                    <span className="text-xs text-teal-600 font-bold truncate block" title={appVideoUrl}>
                      {appVideoUrl.substring(appVideoUrl.lastIndexOf('/') + 1) || 'Sample Video'}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">Dynamic update active</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Open Support Tickets</span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black !text-slate-900">
                      {supportTickets.filter(t => t.status !== 'Resolved').length}
                    </span>
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Unresolved</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm text-left">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer SLA Speed</span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black !text-slate-900">Instant</span>
                    <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded">Mock SLA</span>
                  </div>
                </div>
              </div>

              {/* Layout Content */}
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2 text-left">
                    <MessageSquare size={14} className="text-teal-500" /> Recent Service Tickets
                  </h3>
                  <div className="space-y-2">
                    {supportTickets.slice(0, 3).map(ticket => (
                      <div 
                        key={ticket.id}
                        onClick={() => { setSelectedTicketId(ticket.id); setActiveTab('tickets'); }}
                        className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between hover:border-slate-300 transition-all cursor-pointer text-left"
                      >
                        <div>
                          <p className="text-xs font-bold !text-slate-900 truncate max-w-[200px]">{ticket.subject}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{ticket.userName} • {ticket.createdTime}</p>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          ticket.status === 'Open' ? 'bg-rose-100 text-rose-600' : ticket.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2 text-left">
                    <Edit3 size={14} className="text-teal-500" /> Landing Reviews Preview
                  </h3>
                  <div className="space-y-2.5 text-left">
                    {reviews.slice(0, 2).map(r => (
                      <div key={r.id} className="p-3 bg-slate-50/50 border border-slate-200/80 rounded-xl">
                        <div className="flex items-center gap-2 mb-1.5">
                          <img src={r.avatar} alt="" className="h-6 w-6 rounded-full object-cover border border-slate-200" />
                          <div>
                            <p className="text-xs font-bold text-slate-850">{r.name}</p>
                            <p className="text-[9px] text-slate-500">{r.role} at {r.company}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-650 italic line-clamp-2">&ldquo;{r.comment}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
              <div className="space-y-4">
                <div className="text-left">
                  <h2 className="text-xl font-extrabold !text-slate-900">Review & Testimonial Editor</h2>
                  <p className="text-xs text-slate-500 mt-1">Add, update, or remove candidate quotes displayed dynamically on the landing page.</p>
                </div>

                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="p-4 bg-white border border-slate-200/80 rounded-2xl text-left flex items-start justify-between gap-4 shadow-sm">
                      <div className="flex gap-3">
                        <img src={r.avatar} alt={r.name} className="h-10 w-10 rounded-xl object-cover border border-slate-200 mt-0.5 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold !text-slate-900">{r.name}</h4>
                            <span className="text-[10px] text-slate-500">{r.role} at {r.company}</span>
                          </div>
                          <div className="flex text-yellow-500 text-[10px] my-1">
                            {Array.from({ length: r.rating }).map((_, i) => <span key={i}>★</span>)}
                          </div>
                          <p className="text-xs text-slate-650 leading-relaxed font-medium mt-1.5">{r.comment}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEditReview(r)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:!text-slate-900 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 h-fit space-y-4 shadow-sm">
                <h3 className="text-sm font-bold !text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>{editingReviewId ? '✏️ Edit Review' : '➕ Add Landing Review'}</span>
                  {editingReviewId && (
                    <button onClick={clearReviewForm} className="text-[10px] text-slate-500 hover:!text-slate-900 uppercase font-black cursor-pointer bg-slate-105 border border-slate-200 px-2 py-0.5 rounded">Cancel</button>
                  )}
                </h3>

                <form onSubmit={handleSaveReview} className="space-y-4 text-left">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Author Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Liam Sterling"
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 outline-none focus:border-teal-500 !text-slate-900 placeholder:!text-slate-400 focus:bg-white transition-all font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Role Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Lead Developer"
                        value={authorRole}
                        onChange={e => setAuthorRole(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 outline-none focus:border-teal-500 !text-slate-900 placeholder:!text-slate-400 focus:bg-white transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Company</label>
                      <input
                        type="text"
                        placeholder="e.g. Meta"
                        value={authorCompany}
                        onChange={e => setAuthorCompany(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 outline-none focus:border-teal-500 !text-slate-900 placeholder:!text-slate-400 focus:bg-white transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Rating Stars</label>
                      <select
                        value={rating}
                        onChange={e => setRating(Number(e.target.value))}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 outline-none focus:border-teal-500 !text-slate-900 transition-all font-semibold cursor-pointer focus:bg-white"
                      >
                        {[5, 4, 3, 2, 1].map(n => (
                          <option key={n} value={n}>{n} Stars</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Avatar Profile Image</label>
                      <select
                        value={avatar}
                        onChange={e => setAvatar(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 outline-none focus:border-teal-500 !text-slate-900 transition-all font-semibold cursor-pointer focus:bg-white"
                      >
                        <option value="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80">Female Professional (Sarah)</option>
                        <option value="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80">Male Professional (Rohit)</option>
                        <option value="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80">Young Female (Emily)</option>
                        <option value="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80">Young Male (Candidate)</option>
                        <option value="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80">Tech Executive (Admin)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Review Comment Content</label>
                    <textarea
                      placeholder="Type testimonial comment here..."
                      rows={3}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 outline-none focus:border-teal-500 !text-slate-900 placeholder:!text-slate-400 focus:bg-white transition-all font-semibold leading-relaxed"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 active:scale-98 text-white py-3.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all uppercase tracking-wider"
                  >
                    {editingReviewId ? '💾 Save Changes' : '➕ Publish Review'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: MANAGE SHORTS */}
          {activeTab === 'shorts' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-display text-xl font-bold !text-slate-900">Manage Shorts</h2>
                <p className="text-sm text-slate-500">Modify the 3 YouTube Shorts shown below the video walkthrough.</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700">Showcase Shorts (4 Slots)</h3>
                  {shorts.map((short, idx) => (
                    <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex flex-col flex-1 space-y-2">
                        <span className="font-bold !text-slate-900 text-sm mb-1">Slot {idx + 1}</span>
                        <input 
                          type="text" 
                          value={short.videoId}
                          onChange={(e) => {
                            const newShorts = [...shorts];
                            let val = e.target.value;
                            const match = val.match(/shorts\/([^?]+)/);
                            if(match) val = match[1];
                            const vMatch = val.match(/v=([^&]+)/);
                            if(vMatch) val = vMatch[1];
                            const youtuMatch = val.match(/youtu\.be\/([^?]+)/);
                            if(youtuMatch) val = youtuMatch[1];
                            newShorts[idx] = { ...short, videoId: val };
                            setShorts(newShorts);
                          }}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-purple-500"
                          placeholder="YouTube Short URL or ID"
                        />
                        <input type="text" value={short.name} onChange={(e) => { const newShorts = [...shorts]; newShorts[idx] = { ...short, name: e.target.value }; setShorts(newShorts); }} className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-purple-500" placeholder="Name" />
                        <input type="text" value={short.role} onChange={(e) => { const newShorts = [...shorts]; newShorts[idx] = { ...short, role: e.target.value }; setShorts(newShorts); }} className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-purple-500" placeholder="Role (e.g., Backend Engineer @ Stripe)" />
                        <input type="text" value={short.outcome} onChange={(e) => { const newShorts = [...shorts]; newShorts[idx] = { ...short, outcome: e.target.value }; setShorts(newShorts); }} className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-purple-500" placeholder="Outcome (e.g., Landed offer after 3 rounds)" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VIDEO SHOWCASE SETTINGS */}
          {activeTab === 'video' && (
            <div className="max-w-3xl space-y-6 text-left">
              <div>
                <h2 className="text-xl font-extrabold !text-slate-900">Product Demo Video Showcase</h2>
                <p className="text-xs text-slate-500 mt-1">Configure the product video displayed directly on the landing page.</p>
              </div>

              <form onSubmit={handleUpdateVideo} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Showcase Video Link</label>
                  <input
                    type="text"
                    value={tempVideoUrl}
                    onChange={e => setTempVideoUrl(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 outline-none focus:border-teal-500 !text-slate-900 transition-all font-mono font-bold focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
                    Provide an absolute URL pointing to a raw video file (MP4/WebM). This video will load dynamically on the landing page video section.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white py-3.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all uppercase tracking-wider"
                  >
                    Update Showcase Video
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const presets = [
                        'https://www.w3schools.com/html/mov_bbb.mp4',
                        'https://www.w3schools.com/html/movie.mp4',
                        'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-computer-34287-large.mp4'
                      ];
                      const randomPreset = presets[Math.floor(Math.random() * presets.length)];
                      setTempVideoUrl(randomPreset);
                    }}
                    className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer bg-white"
                  >
                    🎲 Load Preset Link
                  </button>
                </div>
              </form>

              {/* Live Preview player */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold !text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <PlayCircle size={14} className="text-teal-500" /> Admin Console Preview
                </h3>
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-200">
                  {(() => {
                    const video = parseVideoUrl(appVideoUrl);
                    return video.type === 'youtube' ? (
                      <iframe
                        key={appVideoUrl}
                        src={`https://www.youtube.com/embed/${video.id}?modestbranding=1&rel=0`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        key={appVideoUrl}
                        src={video.url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                  <p className="text-[10px] text-slate-500 font-medium">Video is currently live. Open the landing page to verify formatting.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMER SUPPORT HUB */}
          {activeTab === 'suggestions' && (
            <div className="space-y-6">
              <div className="text-left">
                <h2 className="text-xl font-extrabold !text-slate-900">User Suggestions & Feedback</h2>
                <p className="text-xs text-slate-500 mt-1">Review feedback submitted by users across the platform.</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                {suggestions.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm font-semibold">No suggestions yet.</div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((s, idx) => (
                      <div key={s.id || idx} className="p-4 border border-slate-200 rounded-xl text-left bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-100">{s.source}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{s.createdAt}</span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{s.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="h-[74vh] flex flex-col md:flex-row border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
              {/* Left Column: Tickets List */}
              <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/20">
                <div className="p-4 border-b border-slate-200/80 text-left bg-white">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Service Tickets Queue</span>
                  <span className="text-xs font-bold !text-slate-900 mt-1 block">Active Inboxes ({supportTickets.filter(t => t.status !== 'Resolved').length})</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {supportTickets.map(ticket => {
                    const isSelected = selectedTicketId === ticket.id;
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`p-3 rounded-xl text-left cursor-pointer transition-all flex flex-col gap-1.5 border ${
                          isSelected ? 'bg-teal-50 border-teal-200 shadow-sm' : 'border-transparent hover:bg-slate-50 hover:!text-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">{ticket.id}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full leading-none shrink-0 ${
                            ticket.priority === 'High' ? 'bg-rose-100 text-rose-600 border border-rose-200' : ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {ticket.priority} Priority
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-extrabold !text-slate-900 leading-snug truncate" title={ticket.subject}>
                            {ticket.subject}
                          </p>
                          <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">{ticket.userName}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                            ticket.status === 'Open' ? 'bg-rose-100 text-rose-600' : ticket.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'
                          }`}>
                            {ticket.status}
                          </span>
                          <span className="text-[8px] text-slate-500">{ticket.createdTime}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Chat window */}
              <div className="flex-1 flex flex-col bg-slate-50/5">
                {selectedTicket ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-left">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black !text-slate-900 truncate max-w-[280px]" title={selectedTicket.subject}>
                            {selectedTicket.subject}
                          </h3>
                          <span className="text-[9px] font-mono text-slate-450 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{selectedTicket.id}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          From: <strong>{selectedTicket.userName}</strong> ({selectedTicket.userEmail})
                        </p>
                      </div>

                      {/* Dropdown status toggles */}
                      <div className="flex items-center gap-2">
                        <div className="text-left">
                          <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Status</label>
                          <select
                            value={selectedTicket.status}
                            onChange={e => toggleTicketStatus(selectedTicket.id, e.target.value as any)}
                            className="text-[9px] font-bold rounded bg-white border border-slate-200 px-2 py-1 text-slate-700 cursor-pointer focus:border-teal-500 outline-none"
                          >
                            <option value="Open">Open</option>
                            <option value="Pending">Pending</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                        <div className="text-left">
                          <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Priority</label>
                          <select
                            value={selectedTicket.priority}
                            onChange={e => toggleTicketPriority(selectedTicket.id, e.target.value as any)}
                            className="text-[9px] font-bold rounded bg-white border border-slate-200 px-2 py-1 text-slate-700 cursor-pointer focus:border-teal-500 outline-none"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Chat history list */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                      {selectedTicket.messages.map((msg: any, idx: number) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                          <div
                            key={idx}
                            className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} space-y-1`}
                          >
                            <span className="text-[9px] font-bold text-slate-500">
                              {isAdmin ? 'Admin Console (Support)' : selectedTicket.userName}
                            </span>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed border ${
                              isAdmin
                                ? 'bg-teal-600 text-white border-transparent rounded-tr-none shadow-sm'
                                : 'bg-slate-100 !text-slate-900 border-slate-200/60 rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>
                            <span className="text-[8px] text-slate-400">{msg.time}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reply editor input */}
                    <form onSubmit={handleSendTicketReply} className="p-3 border-t border-slate-200 bg-white flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Type reply to candidate..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-850 outline-none placeholder:!text-slate-400 focus:border-teal-500 focus:bg-white transition-all font-semibold"
                      />
                      <button
                        type="submit"
                        className="flex h-9 items-center justify-center rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Send size={12} />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-3 border border-slate-200">
                      <MessageSquare size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">No support ticket selected</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">Choose a service request from the queue to start helper interaction.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="text-left">
                <h2 className="text-xl font-extrabold !text-slate-900">Manage Admins</h2>
                <p className="text-xs text-slate-500 mt-1">Add or remove administrator access to this console.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="text-xs font-bold !text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Authorized Emails</h3>
                <div className="space-y-3 mb-6">
                  {adminEmailList.map((email) => (
                    <div key={email} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <div className="flex items-center gap-3 text-left">
                        <div className="bg-teal-100 text-teal-600 p-2 rounded-lg">
                          <ShieldCheck size={16} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{email}</span>
                        {email === currentUser?.email && (
                          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">You</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(email)}
                        className={`p-2 rounded-lg transition-colors ${
                          email === currentUser?.email || adminEmailList.length <= 1 
                          ? 'text-slate-300 cursor-not-allowed' 
                          : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                        disabled={email === currentUser?.email || adminEmailList.length <= 1}
                        title={email === currentUser?.email ? "Cannot remove yourself" : adminEmailList.length <= 1 ? "Cannot remove last admin" : "Remove Admin"}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddAdmin} className="flex gap-3">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="New admin email address..."
                    className="flex-1 text-sm rounded-xl border border-slate-200 px-4 py-2 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isAddingAdmin || !newAdminEmail.includes('@')}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  >
                    <Plus size={16} />
                    {isAddingAdmin ? 'Adding...' : 'Add Admin'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
    </div>
  );
}

function SyncPage({ user }: { user: AppUser | null }) {
  const [status, setStatus] = useState("Syncing with desktop app...");
  const [details, setDetails] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  const queryParams = new URLSearchParams(window.location.search);
  const port = queryParams.get('port') || '48999';

  useEffect(() => {
    if (!user) {
      setStatus("Please log in first. Redirecting to login...");
      setIsSuccess(false);
      const timer = setTimeout(() => {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }, 1500);
      return () => clearTimeout(timer);
    }

    const currentUser = {
      email: user.email,
      token: localStorage.getItem('login-token') || 'mock-secure-token-12345'
    };

    fetch(`http://127.0.0.1:${port}/auth-callback?email=${encodeURIComponent(currentUser.email)}&token=${encodeURIComponent(currentUser.token)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus("Success! Desktop application is now unlocked.");
          setDetails("You can safely close this browser tab and return to the desktop app.");
          setIsSuccess(true);
        } else {
          setStatus("Authorization failed.");
          setDetails(data.message || "The desktop application rejected the authentication request.");
          setIsSuccess(false);
        }
      })
      .catch(err => {
        console.error("Desktop app is not running:", err);
        setStatus("Error: Could not reach desktop application.");
        setDetails("Make sure the desktop application is running on your computer, then try again.");
        setIsSuccess(false);
      });
  }, [user, port]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 overflow-hidden text-white font-sans">
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-glow backdrop-blur-xl border-t-white/15 animate-fadeIn">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-soft">
              {isSuccess === true ? (
                <CheckCircle2 size={32} className="text-emerald-400" />
              ) : isSuccess === false ? (
                <AlertCircle size={32} className="text-rose-400" />
              ) : (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Stealth Account Sync
            </h1>
            <p className="mt-4 text-sm font-medium text-slate-200">
              {status}
            </p>
            {details && (
              <p className="mt-2 text-xs text-slate-400">
                {details}
              </p>
            )}
          </div>
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
    // If the path is /sync, load the Sync page
    if (window.location.pathname === '/sync') {
      return 'Sync';
    }
    if (window.location.pathname === '/login') {
      return 'Login';
    }
    // If user is already logged in (from localStorage), go to Dashboard; else show Landing
    try {
      const saved = localStorage.getItem('logged-in-user');
      return saved ? 'Dashboard' : 'Landing';
    } catch (e) {
      return 'Landing';
    }
  });

  const [adminEmailsState, setAdminEmailsState] = useState<string[]>(ADMIN_EMAILS);

  useEffect(() => {
    fetch(`${API_BASE}/api/admins`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAdminEmails(data);
          setAdminEmailsState(data);
        }
      })
      .catch(err => console.error("Failed to load admins", err));
  }, []);
  const [config, setConfig] = useState<SessionConfig>(defaultConfig);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showAppChoice, setShowAppChoice] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<TranscriptItem[]>([]);
  const [sessionTime, setSessionTime] = useState(0);

  // Dynamic reviews state
  const [reviews, setReviews] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('sutra-landing-reviews');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Sarah Jenkins', role: 'Staff Engineer', company: 'Google', rating: 5, comment: 'Sutra AI was a complete game-changer. The overlay sat invisibly on my screen during screen share, and the contextual bullet points let me answer design questions effortlessly.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80' },
        { id: '2', name: 'Rohit Mehta', role: 'Software Engineer II', company: 'Amazon', rating: 5, comment: 'The resume intelligence feature tailored the AI responses specifically to my past experience. I could see the bullet points clearly without looking away from the camera. Highly recommended!', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80' },
        { id: '3', name: 'Emily Chen', role: 'Senior Frontend Dev', company: 'Stripe', rating: 5, comment: 'I was worried about the interviewers detecting the tool on Zoom. Tested screen share with a friend and it was 100% invisible. Passed my Stripe loop on the first try.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80' }
      ];
    } catch {
      return [];
    }
  });

  // Persist reviews
  useEffect(() => {
    localStorage.setItem('sutra-landing-reviews', JSON.stringify(reviews));
  }, [reviews]);

  // Dynamic shorts state
  const [shorts, setShorts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('sutra-landing-shorts-v2');
      return saved ? JSON.parse(saved) : [
        { videoId: 'bQzMvjiu6_k', name: 'Sarah K.', role: 'Backend Engineer @ Stripe', outcome: 'Landed offer after 3 rounds' },
        { videoId: 'T60qC5BEA9w', name: 'Marcus T.', role: 'Frontend Dev @ Vercel', outcome: 'Passed system design on first try' },
        { videoId: '9ae7y_UQ39g', name: 'David L.', role: 'Fullstack @ Meta', outcome: 'Aced the live coding round' },
        { videoId: 'bQzMvjiu6_k', name: 'Priya R.', role: 'Data Scientist @ Netflix', outcome: 'Cleared the SQL interview easily' }
      ];
    } catch {
      return [
        { videoId: 'bQzMvjiu6_k', name: 'Sarah K.', role: 'Backend Engineer @ Stripe', outcome: 'Landed offer after 3 rounds' },
        { videoId: 'T60qC5BEA9w', name: 'Marcus T.', role: 'Frontend Dev @ Vercel', outcome: 'Passed system design on first try' },
        { videoId: '9ae7y_UQ39g', name: 'David L.', role: 'Fullstack @ Meta', outcome: 'Aced the live coding round' },
        { videoId: 'bQzMvjiu6_k', name: 'Priya R.', role: 'Data Scientist @ Netflix', outcome: 'Cleared the SQL interview easily' }
      ];
    }
  });

  // Persist shorts
  useEffect(() => {
    localStorage.setItem('sutra-landing-shorts-v2', JSON.stringify(shorts));
  }, [shorts]);

  // Showcase Video URL state
  const [appVideoUrl, setAppVideoUrl] = useState<string>(() => {
    return localStorage.getItem('sutra-landing-video') || 'dQw4w9WgXcQ';
  });

  // Persist video URL
  useEffect(() => {
    localStorage.setItem('sutra-landing-video', appVideoUrl);
  }, [appVideoUrl]);

  // Support tickets queue state
  const [supportTickets, setSupportTickets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('sutra-support-tickets');
      return saved ? JSON.parse(saved) : [
        {
          id: 'T-1001',
          userEmail: 'dev.jackson@gmail.com',
          userName: 'Jackson Carter',
          subject: 'Microphone permission block on macOS Sequoia',
          status: 'Open',
          priority: 'High',
          createdTime: '2 hours ago',
          messages: [
            { sender: 'user', text: "Hey support team, I'm trying to start a Live Session but it keeps saying my microphone permission is blocked. I already allowed it in system settings.", time: '2h ago' }
          ]
        },
        {
          id: 'T-1002',
          userEmail: 'priya.sharma@yahoo.com',
          userName: 'Priya Sharma',
          subject: 'Stripe subscription invoice request',
          status: 'Pending',
          priority: 'Medium',
          createdTime: '4 hours ago',
          messages: [
            { sender: 'user', text: "Hi, I recently upgraded to the Pro plan but did not receive my invoice on my registered email. Can you please send it?", time: '4h ago' },
            { sender: 'admin', text: "Hello Priya, we've updated your billing info. Let me check the invoice system.", time: '3h ago' },
            { sender: 'user', text: "Thanks, please let me know when you email it.", time: '2h ago' }
          ]
        },
        {
          id: 'T-1003',
          userEmail: 'sam.wilson@outlook.com',
          userName: 'Sam Wilson',
          subject: 'Auto-answer latency is too high',
          status: 'Resolved',
          priority: 'Low',
          createdTime: '1 day ago',
          messages: [
            { sender: 'user', text: "Sometimes the auto-answer takes 4-5 seconds to display on my screen share. Is this expected?", time: '1d ago' },
            { sender: 'admin', text: "Hi Sam, this is usually due to high server load or network routing latency. Try switching your model to gemini-2.5-flash which has low TTFT.", time: '18h ago' },
            { sender: 'user', text: "That solved it, thank you!", time: '12h ago' }
          ]
        }
      ];
    } catch {
      return [];
    }
  });

  // Persist tickets
  useEffect(() => {
    localStorage.setItem('sutra-support-tickets', JSON.stringify(supportTickets));
  }, [supportTickets]);

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
    { sender: 'bot', text: "Hello! I'm the Sutra AI Support AI. How can I help you resolve app issues, configure reference context, or optimize your session today?", time: 'Just now' }
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
      return "To start and run a **Live Session (Interview OS)**, follow these steps:\n\n1. **Start the Session**: Click the '+ Start Session' button in the top-right header.\n2. **Configuration**: Select your target company, role, session type ('Interview+Coding' or 'Coding Test'), preferred AI model, and response style (Concise/Standard/Detailed). Optionally choose an active resume and reference docs.\n3. **Share Your Screen**: Click 'Accept & Connect' on the authorization modal. Choose the browser tab where your video call is running (Google Meet, Teams, etc.). *Crucial:* Check the 'Share tab audio' checkbox at the bottom-left of the browser picker window to capture interviewer voice.\n4. **Get Real-time Answers**: As the interviewer asks questions, Sutra AI transcribes them automatically and streams answers in the right panel.\n5. **Screenshot Capture**: In coding tests or editor views, click 'Screenshot' in the footer to capture the code window for step-by-step solution guidance.\n6. **End Session**: Click the red 'Exit' button to save the transcript and generate an AI summary overview.";
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
    
    return "I can help explain all Sutra AI features (Live Session OS, Mock Interviews, Recent Sessions, Resume Parser, and Custom Prompts) or provide troubleshooting tips (Mic setup, screenshots, response lag). Please ask me a specific question!";
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

  if (screen === 'Sync') {
    return <SyncPage user={user} />;
  }

  if (screen === 'Landing') {
    return <Landing
      onSignIn={() => setScreen('Login')}
      onStart={handleStartSession}
      reviews={reviews}
      shorts={shorts}
      appVideoUrl={appVideoUrl}
      setScreen={setScreen}
    />;
  }


  if (!user || screen === 'Login') {
    return <LoginPage onLoginSuccess={(u) => {
      setUser(u);
      
      const queryParams = new URLSearchParams(window.location.search);
      const redirectUrl = queryParams.get('redirect');
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      if (u.email === 'admin@sutra.ai' || u.uid === 'admin') {
        setScreen('Admin');
      } else {
        setScreen('Dashboard');
      }
    }} />;
  }

  const isSessionStarted = isSessionActive || isMockSessionActive;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] !text-slate-900 font-sans relative">
      {/* Drifting Aura Lights for Dashboard / App */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-teal-100/50 blur-[130px] z-0" />
      <div className="pointer-events-none absolute bottom-20 right-1/4 h-[500px] w-[500px] rounded-full bg-teal-50/50 blur-[120px] z-0" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(circle_at_50%_30%,black_60%,transparent_100%)] opacity-80 z-0" />

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
            const item = getNav(isAdminUser(user?.email)).find(n => n.label === v);
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

        {screen === 'Admin' && (
          <AdminPanel
            reviews={reviews}
            setReviews={setReviews}
            appVideoUrl={appVideoUrl}
            setAppVideoUrl={setAppVideoUrl}
            supportTickets={supportTickets}
            setSupportTickets={setSupportTickets}
            shorts={shorts}
            setShorts={setShorts}
            onBack={() => setScreen('Dashboard')}
            currentUser={user}
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
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-500/10 text-teal-700 border border-teal-500/20 shadow-glow animate-pulse">
                <Mic size={36} />
              </div>
              <h2 className="text-2xl font-black text-white">Setup Your Live Session</h2>
              <p className="mt-2 max-w-md text-sm text-slate-400">Configure your target company, role, context sources, and response style before launching the session.</p>
              <button
                onClick={() => setShowWizard(true)}
                className="mt-8 rounded-2xl bg-teal-600 px-6 py-3.5 text-sm font-black text-white hover:bg-teal-500 transition-all shadow-glow flex items-center gap-2"
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
        {screen === 'Suggestions' && <SuggestionsPage />}
      </div>

      {detailSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
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

              <div className="flex items-center justify-between border-b border-slate-200 mb-4 shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => setModalTab('transcript')}
                    className={`py-2 px-3 text-xs font-bold transition-all relative ${modalTab === 'transcript'
                      ? 'border-b-2 border-teal-500 text-teal-700'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Transcript & Q&A
                  </button>
                  <button
                    onClick={() => setModalTab('notes')}
                    className={`py-2 px-3 text-xs font-bold transition-all relative ${modalTab === 'notes'
                      ? 'border-b-2 border-teal-500 text-teal-700'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Session Summary
                  </button>
                </div>

                <button
                  onClick={() => handleDownloadTranscript(detailSession)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-200 hover:bg-slate-50 transition-all"
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
                              <span className="font-bold text-teal-600">
                                {item.speaker === 'Interviewer' ? 'Question' : 'Your Answer'}
                              </span>
                              <span>{item.time}</span>
                            </div>

                            <div className={`p-4 rounded-2xl border relative ${item.speaker === 'Interviewer'
                              ? 'border-teal-500/20 bg-teal-500/5'
                              : 'border-slate-200 bg-slate-50'
                              }`}>
                              <p className="text-xs leading-5 text-slate-200 whitespace-pre-wrap">{item.text}</p>
                              <button
                                onClick={() => navigator.clipboard.writeText(item.text)}
                                className="absolute top-2 right-2 opacity-0 hover:opacity-100 p-1 rounded bg-slate-50 text-slate-400 hover:text-white transition-all"
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
                              <div className="h-px flex-1 bg-teal-500/20" />
                              <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">AI Q&A Answers</span>
                              <div className="h-px flex-1 bg-teal-500/20" />
                            </div>
                            {detailSession.qas.map((n: any) => (
                              <div key={n.id} className="p-4 rounded-2xl border border-teal-500/10 bg-teal-950/10">
                                <div className="text-xs font-bold text-teal-700 mb-1">{n.title}</div>
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
                      <h4 className="text-xs font-black text-teal-700 uppercase tracking-wide">Session Summary</h4>
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
                        <div key={n.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
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
          <div className="fixed inset-y-6 left-[17rem] w-96 z-[100] flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <img
                  src={sutraLogoImg}
                  alt="Sutra AI"
                  width={32}
                  height={32}
                  style={{ objectFit: 'contain' }}
                />
                <div>
                  <h4 className="text-sm font-black text-slate-900">Sutra AI Support AI</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-[10px] text-slate-500 font-medium">Online Help Agent</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowHelpChatbot(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all"
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
                      ? 'bg-teal-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 rounded-tl-none whitespace-pre-line'
                      }`}
                  >
                    {renderBoldText(msg.text)}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
              {isBotTyping && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 w-16 mr-auto">
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={chatbotScrollRef} />
            </div>

            {/* Suggestions */}
            {!isBotTyping && (
              <div className="px-5 py-3 flex flex-col gap-3 border-t border-slate-200 bg-white">
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
                        className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-500/10 hover:border-teal-500/30 px-2.5 py-1.5 text-[9px] text-slate-700 font-medium transition-all text-left"
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
                        className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-500/10 hover:border-teal-500/30 px-2.5 py-1.5 text-[9px] text-slate-700 font-medium transition-all text-left"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="flex gap-2 border-t border-slate-200 px-5 py-3.5 bg-white">
              <input
                type="text"
                placeholder="Ask a question about Sutra AI..."
                value={helpInput}
                onChange={e => setHelpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleHelpMessageSend()}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-teal-500/50 text-slate-900 placeholder:text-slate-500"
              />
              <button
                onClick={handleHelpMessageSend}
                disabled={isBotTyping || !helpInput.trim()}
                className="rounded-xl bg-teal-600 p-2.5 text-white hover:bg-teal-500 disabled:opacity-40 transition-all flex items-center justify-center shrink-0"
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

const getStealthScenarioContent = (scenario: 'system' | 'sql' | 'react') => {
  if (scenario === 'system') {
    return {
      sayFirst: "Actually, that reminds me of an API concurrency bottleneck we solved on our ingestion service using a partitioned queue...",
      star: [
        { label: 'S/T', desc: 'Concurrently handling 10k req/sec validation bottlenecks.' },
        { label: 'A', desc: 'Partitioned Kafka brokers categorized by channel priority.' },
        { label: 'R', desc: 'Worker containers autoscaled with APNs callback integration.' }
      ]
    };
  } else if (scenario === 'sql') {
    return {
      sayFirst: "For database querying latency, we typically target composite index paths based on ordering keys...",
      star: [
        { label: 'S/T', desc: 'Optimizing high-latency user session queries under peak load.' },
        { label: 'A', desc: 'Created B-Tree indices to match sort filters directly.' },
        { label: 'R', desc: 'Reduced query scan range by 94%, avoiding table scans.' }
      ]
    };
  } else {
    return {
      sayFirst: "With React 19, reconciliation is built on asynchronous transition states to prevent thread locks...",
      star: [
        { label: 'S/T', desc: 'Managing heavy client-side updates without input lag.' },
        { label: 'A', desc: 'Used Fiber time-slicing hooks to chunk rendering cycles.' },
        { label: 'R', desc: 'Standardized async actions without manual pending indicators.' }
      ]
    };
  }
};

const MockIDE = ({ scenario }: { scenario: 'system' | 'sql' | 'react' }) => {
  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] text-[#c9d1d9] font-mono text-left select-none h-full w-full">
      {/* VS Code title bar */}
      <div className="bg-[#161b22] px-3 py-2 flex items-center gap-1.5 border-b border-slate-800 shrink-0">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        <span className="text-[10px] text-slate-500 ml-4 font-sans">
          {scenario === 'system' ? 'QueueService.ts' : scenario === 'sql' ? 'optimize.sql' : 'ProfileEditor.tsx'} — Sutra AI Workspace
        </span>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* IDE Sidebar */}
        <div className="w-12 bg-[#0d1117] border-r border-slate-850 flex flex-col items-center py-2 gap-3 shrink-0" style={{ borderColor: '#1f242c' }}>
          <div className="p-1 rounded text-slate-400"><Code2 size={16} /></div>
          <div className="p-1 rounded text-slate-600"><Database size={16} /></div>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 flex gap-4 overflow-y-auto relative">
          {/* Line Numbers */}
          <div className="text-slate-600 text-[10px] text-right space-y-1 select-none pr-3 border-r border-slate-800/40 shrink-0">
            {Array.from({ length: 9 }).map((_, i) => <div key={i}>{i + 1}</div>)}
          </div>

          {/* Actual Code */}
          <div className="text-[10px] sm:text-[11px] leading-relaxed space-y-1 text-slate-700">
            {scenario === 'system' && (
              <>
                <div><span className="text-[#ff7b72]">import</span> &#123; messageQueue &#125; <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'./broker'</span>;</div>
                <div className="text-slate-500">// Ingestion concurrency logic</div>
                <div><span className="text-[#ff7b72]">export async function</span> <span className="text-[#d2a8ff]">handleIngestion</span>(req, res) &#123;</div>
                <div>&nbsp;&nbsp;<span className="text-[#ff7b72]">const</span> payload = req.body;</div>
                <div>&nbsp;&nbsp;<span className="text-[#d2a8ff]">validatePayload</span>(payload);</div>
                <div>&nbsp;&nbsp;<span className="text-[#ff7b72]">await</span> messageQueue.<span className="text-[#d2a8ff]">dispatch</span>(&#123;</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;topic: <span className="text-[#a5d6ff]">'notifications-high'</span>,</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;key: payload.userId</div>
                <div>&nbsp;&nbsp;&#125;);</div>
                <div>&#125;</div>
              </>
            )}
            {scenario === 'sql' && (
              <>
                <div className="text-slate-500">-- Heavy read latency query optimization</div>
                <div><span className="text-[#ff7b72]">CREATE INDEX</span> idx_sessions_active</div>
                <div><span className="text-[#ff7b72]">ON</span> user_sessions (user_id, last_active <span className="text-[#ff7b72]">DESC</span>);</div>
                <div>&nbsp;</div>
                <div className="text-slate-500">-- Optimized B-Tree composite query path:</div>
                <div><span className="text-[#ff7b72]">SELECT</span> id, session_token, last_active</div>
                <div><span className="text-[#ff7b72]">FROM</span> user_sessions</div>
                <div><span className="text-[#ff7b72]">WHERE</span> user_id = <span className="text-[#79c0ff]">918</span></div>
                <div><span className="text-[#ff7b72]">ORDER BY</span> last_active <span className="text-[#ff7b72]">DESC</span>;</div>
              </>
            )}
            {scenario === 'react' && (
              <>
                <div><span className="text-[#ff7b72]">import</span> &#123; useTransition &#125; <span className="text-[#ff7b72]">from</span> <span className="text-[#a5d6ff]">'react'</span>;</div>
                <div>&nbsp;</div>
                <div><span className="text-[#ff7b72]">function</span> <span className="text-[#d2a8ff]">ProfileEditor</span>() &#123;</div>
                <div>&nbsp;&nbsp;<span className="text-[#ff7b72]">const</span> [isPending, startTransition] = <span className="text-[#d2a8ff]">useTransition</span>();</div>
                <div>&nbsp;&nbsp;<span className="text-[#ff7b72]">const</span> updateProfile = () =&gt; &#123;</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#d2a8ff]">startTransition</span>(<span className="text-[#ff7b72]">async</span> () =&gt; &#123;</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ff7b72]">await</span> api.<span className="text-[#d2a8ff]">saveProfile</span>();</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;&#125;);</div>
                <div>&nbsp;&nbsp;&#125;;</div>
                <div>&#125;</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function Landing({
  onSignIn,
  onStart,
  reviews,
  shorts,
  appVideoUrl,
  setScreen
}: {
  onSignIn: () => void;
  onStart: () => void;
  reviews: any[];
  shorts: any[];
  appVideoUrl: string;
  setScreen: (s: Screen) => void;
}) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const video = parseVideoUrl(appVideoUrl);

  const handlePlayClick = () => {
    setIsVideoPlaying(true);
    videoRef.current?.play();
  };
  // Live session preview simulator state
  const [activeScenario, setActiveScenario] = useState<'system' | 'sql' | 'react'>('system');
  const [questionLength, setQuestionLength] = useState(0);
  const [answerLength, setAnswerLength] = useState(0);
  const [simulatorState, setSimulatorState] = useState<'idle' | 'typing' | 'thinking' | 'streaming'>('idle');
  const [hoveredLoop, setHoveredLoop] = useState<number | null>(null);

  // Pricing state
  const [landingPricingTab, setLandingPricingTab] = useState<'periods' | 'credits' | 'lifetime'>('periods');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Stealth section demo animation
  const [stealthPhase, setStealthPhase] = useState<'listening' | 'thinking' | 'response'>('listening');
  const [visibleBullets, setVisibleBullets] = useState(0);

  // Hero active mode state
  const [activeMode, setActiveMode] = useState<'prep' | 'live'>('live');

  // Magnetic CTA offsets
  const [ctaOffset, setCtaOffset] = useState({ x: 0, y: 0 });
  const handleCtaMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    const MAX_OFFSET = 6;
    setCtaOffset({
      x: Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relX * 0.15)),
      y: Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relY * 0.15)),
    });
  };
  const handleCtaMouseLeave = () => setCtaOffset({ x: 0, y: 0 });

  // Track if slider range input is actively dragged to de-couple 3D tilt coordinates
  const [isSliderDragging, setIsSliderDragging] = useState(false);

  // Toggle state for Live Mode views (replacing slider)
  const [liveViewMode, setLiveViewMode] = useState<'hud' | 'clean'>('hud');

  // 3D perspective tilt offsets
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleSimulatorMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 8, y: -y * 8 });
  };
  const handleSimulatorMouseLeave = () => setTilt({ x: 0, y: 0 });

  // Navbar scroll-to-capsule
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  useEffect(() => {
    let timeout: any;
    const cycle = () => {
      setStealthPhase('listening');
      setVisibleBullets(0);
      timeout = setTimeout(() => {
        setStealthPhase('thinking');
        timeout = setTimeout(() => {
          setStealthPhase('response');
          setVisibleBullets(0);
          // Stagger bullets in one by one
          [600, 1200, 1800].forEach((delay, i) => {
            timeout = setTimeout(() => setVisibleBullets(i + 1), delay);
          });
          // Restart cycle
          timeout = setTimeout(cycle, 5500);
        }, 1500);
      }, 2000);
    };
    cycle();
    return () => clearTimeout(timeout);
  }, []);

  // Set body background/color dynamically for light color scheme
  useEffect(() => {
    const prevBg = document.body.style.background;
    const prevColor = document.body.style.color;
    document.body.style.background = 'linear-gradient(135deg, #d1faf5 0%, #f8fffd 25%, #fffdf7 55%, #ffecd8 80%, #f0fdf4 100%)';
    document.body.style.backgroundAttachment = 'scroll';
    document.body.style.color = '#0f172a';
    return () => {
      document.body.style.background = prevBg;
      document.body.style.backgroundAttachment = '';
      document.body.style.color = prevColor;
    };
  }, []);

  // Handle click on feature cards
  const handleLearnMore = (scenario: 'system' | 'sql' | 'react' | 'insights') => {
    if (scenario === 'insights') {
      setActiveScenario('system');
      const element = document.getElementById('simulator');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash metrics container
        const metricsContainer = document.getElementById('mockup-metrics');
        if (metricsContainer) {
          metricsContainer.classList.add('ring-4', 'ring-teal-500/50', 'ring-offset-2');
          setTimeout(() => {
            metricsContainer.classList.remove('ring-4', 'ring-teal-500/50', 'ring-offset-2');
          }, 1500);
        }
      }
    } else {
      setActiveScenario(scenario);
      const element = document.getElementById('simulator');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

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

  const renderMockupAnswer = (scenario: 'system' | 'sql' | 'react', length: number) => {
    const currentData = previewScenarios[scenario];
    const fullText = currentData.answer;
    
    if (scenario === 'system') {
      const headerText = "Ingestion & In-Memory Queueing";
      const totalLen = headerText.length;
      return (
        <div className="space-y-1">
          <h4 className="text-[11px] font-black !text-slate-900 tracking-tight leading-snug">
            {headerText.slice(0, length)}
          </h4>
          {length > totalLen && (
            <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic mt-0.5">
              1. <strong className="text-teal-700 font-bold" style={{ color: '#0f766e' }}>API Ingestion Service</strong>: Light Node.js/Go instances validate schemas...
            </p>
          )}
        </div>
      );
    } else if (scenario === 'sql') {
      const headerText = "Composite Indexing & Planning Analysis";
      const totalLen = headerText.length;
      return (
        <div className="space-y-1">
          <h4 className="text-[11px] font-black !text-slate-900 tracking-tight leading-snug">
            {headerText.slice(0, length)}
          </h4>
          {length > totalLen && (
            <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic mt-0.5">
              1. <strong className="text-teal-700 font-bold" style={{ color: '#0f766e' }}>Composite Indexes</strong>: Align indexed keys with sorting criteria...
            </p>
          )}
        </div>
      );
    } else {
      const headerText = "Fiber Tree Diffing & Async Actions";
      const totalLen = headerText.length;
      return (
        <div className="space-y-1">
          <h4 className="text-[11px] font-black !text-slate-900 tracking-tight leading-snug">
            {headerText.slice(0, length)}
          </h4>
          {length > totalLen && (
            <p className="text-[10px] text-slate-600 font-medium leading-relaxed italic mt-0.5">
              1. <strong className="text-teal-700 font-bold" style={{ color: '#0f766e' }}>Fiber Time Slicing</strong>: Breaks rendering tasks into microscopic execution...
            </p>
          )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen !text-slate-900 flex flex-col relative overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes audioWave {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
        .animate-audio-wave {
          animation: audioWave 1.2s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}} />

      {/* === BASE CANVAS: Rich gradient mesh — vivid teal top-left, warm peach bottom-right === */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(135deg, #b2f5ea 0%, #e6fffa 20%, #fffdf7 50%, #fef3c7 78%, #d1faf5 100%)' }} />
      {/* Peach glow anchor — top-right corner */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[700px] w-[700px] rounded-full" style={{ background: 'radial-gradient(circle at 60% 40%, rgba(251,146,60,0.25) 0%, rgba(253,186,116,0.15) 45%, transparent 68%)', filter: 'blur(60px)' }} />
      {/* Teal glow anchor — bottom-left corner */}
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[800px] w-[800px] rounded-full" style={{ background: 'radial-gradient(circle at 40% 60%, rgba(13,148,136,0.30) 0%, rgba(20,184,166,0.18) 50%, transparent 72%)', filter: 'blur(80px)' }} />

      {/* === AURA ORBS — teal, mint, soft violet: AI product look === */}
      {/* Top-left: Teal — primary brand color */}
      <motion.div
        animate={{
          x: [0, 40, -25, 15, 0],
          y: [0, -35, 20, -15, 0],
          scale: [1, 1.15, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="pointer-events-none absolute -top-32 -left-24 h-[650px] w-[650px] rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #0d9488 0%, #14b8a6 18%, rgba(20,184,166,0.35) 50%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.35
        }}
      />
      {/* Top-right: Soft violet — depth accent */}
      <motion.div
        animate={{
          x: [0, -30, 20, -40, 0],
          y: [0, 40, -15, 30, 0],
          scale: [1, 0.9, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="pointer-events-none absolute -top-16 right-[-60px] h-[550px] w-[550px] rounded-full"
        style={{
          background: 'radial-gradient(circle at 60% 35%, #7c3aed 0%, #8b5cf6 18%, rgba(139,92,246,0.3) 45%, transparent 68%)',
          filter: 'blur(75px)',
          opacity: 0.22
        }}
      />
      {/* Center-right: Teal echo */}
      <motion.div
        animate={{
          x: [0, 50, -30, 20, 0],
          y: [0, -25, 45, -30, 0],
          scale: [1, 1.1, 0.85, 1.05, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="pointer-events-none absolute top-[20%] -right-20 h-[700px] w-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle at 65% 40%, #0f766e 0%, #14b8a6 15%, rgba(20,184,166,0.15) 50%, transparent 70%)',
          filter: 'blur(90px)',
          opacity: 0.15
        }}
      />
      {/* Mid-left: Mint — fresh secondary accent */}
      <motion.div
        animate={{
          x: [0, -45, 35, -20, 0],
          y: [0, 30, -35, 15, 0],
          scale: [1, 1.05, 0.9, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="pointer-events-none absolute top-[35%] -left-28 h-[550px] w-[550px] rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 50%, #34d399 0%, #6ee7b7 18%, rgba(110,231,183,0.25) 48%, transparent 68%)',
          filter: 'blur(80px)',
          opacity: 0.28
        }}
      />
      {/* Bottom-center: Soft violet sweep */}
      <motion.div
        animate={{
          x: [0, 35, -35, 15, 0],
          y: [0, -45, 25, -15, 0],
          scale: [1, 1.1, 0.9, 1.05, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="pointer-events-none absolute bottom-[0%] left-[15%] h-[500px] w-[800px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, #6d28d9 0%, rgba(109,40,217,0.25) 38%, transparent 65%)',
          filter: 'blur(90px)',
          opacity: 0.09
        }}
      />
      {/* Bottom-right: Teal warmth */}
      <motion.div
        animate={{
          x: [0, -25, 45, -15, 0],
          y: [0, 35, -25, 45, 0],
          scale: [1, 0.9, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="pointer-events-none absolute -bottom-20 right-[5%] h-[420px] w-[420px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #0d9488 0%, rgba(13,148,136,0.25) 40%, transparent 65%)',
          filter: 'blur(65px)',
          opacity: 0.14
        }}
      />

      {/* === HERO SPOTLIGHT: Directional white light from top keeps text readable === */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[700px]" style={{ background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.65) 40%, transparent 100%)' }} />

      {/* === DOT GRID: Teal-tinted to match brand === */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(13,148,136,0.10) 1px, transparent 1px)', backgroundSize: '28px 28px', maskImage: 'radial-gradient(ellipse 90% 65% at 50% 15%, black 10%, rgba(0,0,0,0.25) 50%, transparent 80%)', opacity: 0.85 }} />

      {/* === NOISE / GRAIN overlay: Kills the flat-vector look, adds tactile depth === */}
      <svg className="pointer-events-none absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.028 }}>
        <filter id="grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>

      {/* === TOP ACCENT LINE: teal-to-violet matches new brand palette === */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[2px]" style={{ background: 'linear-gradient(to right, transparent 0%, #14b8a6 20%, #0d9488 45%, #7c3aed 70%, transparent 100%)' }} />

      {/* Navbar — fixed, morphs into floating capsule on scroll */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full flex justify-center transition-all duration-700 ease-in-out ${
          scrolled ? 'py-3' : 'py-0 border-b border-slate-200/60'
        }`}
        style={{
          background: scrolled ? 'transparent' : 'rgba(255,255,255,0.85)',
          backdropFilter: scrolled ? 'none' : 'blur(20px)',
          boxShadow: scrolled ? 'none' : '0 1px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div
          className="flex items-center justify-between transition-all duration-700 ease-in-out"
          style={{
          width: scrolled ? 'min(820px, 92vw)' : '100%',
            maxWidth: scrolled ? 'min(820px, 92vw)' : '80rem',
            padding: scrolled ? '10px 24px' : '12px 32px',
            borderRadius: scrolled ? '9999px' : '0px',
            background: scrolled ? 'rgba(255,255,255,0.94)' : 'transparent',
            backdropFilter: scrolled ? 'blur(24px)' : 'none',
            boxShadow: scrolled
              ? '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
              : 'none',
            border: scrolled ? '1px solid rgba(226,232,240,0.8)' : 'none',
          }}
        >
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src={sutraLogoImg}
              alt="Sutra AI"
              style={{ width: scrolled ? '40px' : '58px', height: scrolled ? '40px' : '58px', objectFit: 'contain', transition: 'all 0.7s' }}
            />
            <div className="transition-all duration-700">
              <span
                className="font-display font-black tracking-tight !text-slate-900 transition-all duration-700 block"
                style={{ fontSize: scrolled ? '20px' : '30px', lineHeight: 1 }}
              >
                Sutra <span className="text-teal-500">AI</span>
              </span>
              <span
                className="font-bold text-slate-400 tracking-wider uppercase block transition-all duration-700"
                style={{ fontSize: scrolled ? '8px' : '10px', marginTop: '2px' }}
              >
                Clarity in every answer
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav
            className="hidden md:flex items-center transition-all duration-700"
            style={{ gap: scrolled ? '20px' : '28px', fontSize: scrolled ? '12px' : '14px' }}
          >
            {[['#showcase-video','Watch Demo'],['#how-it-works','How It Works'],['#features','Features'],['#reviews','Reviews'],['#pricing','Pricing']].map(([href, label]) => (
              <a key={href} href={href} className="font-semibold text-slate-500 hover:text-teal-600 transition-colors duration-200 cursor-pointer whitespace-nowrap">{label}</a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center" style={{ gap: scrolled ? '8px' : '12px' }}>
            <button
              onClick={onSignIn}
              className="font-semibold text-slate-600 hover:text-teal-700 transition-colors cursor-pointer"
              style={{ fontSize: scrolled ? '12px' : '14px' }}
            >
              Log in
            </button>
            <button
              onClick={onStart}
              className="inline-flex items-center gap-1.5 rounded-full font-bold text-white cursor-pointer transition-all duration-500 hover:-translate-y-px active:translate-y-0 whitespace-nowrap"
              style={{
                fontSize: scrolled ? '11px' : '14px',
                padding: scrolled ? '7px 16px' : '10px 20px',
                background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                boxShadow: '0 4px 14px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,0.15)'
              }}
            >
              {scrolled ? 'Get Started' : 'Start Free Session'} <ArrowRight size={scrolled ? 12 : 14} />
            </button>
          </div>
        </div>
      </header>


      {/* Main Container — top padding to clear fixed navbar */}
      <main className="relative z-10 flex-1 pt-[88px]">
        
        {/* Hero Section */}
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, type: "spring", bounce: 0.3 }} className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 md:py-20 grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div className="flex flex-col items-start text-left">
            {/* Glowing live engine pill */}
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 text-teal-700 px-3 py-1 text-[11px] font-black uppercase tracking-wider border border-teal-500/20 shadow-[0_0_12px_rgba(59,130,246,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
              <span>Sutra 2.0 Engine Live</span>
            </div>


            {/* Dynamic Segmented Switch */}
            <div className="mb-6 flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-100 p-1">
              <button
                onClick={() => setActiveMode('prep')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeMode === 'prep' 
                    ? 'bg-white text-teal-900 shadow-sm border border-slate-200/30' 
                    : 'text-slate-500 hover:!text-slate-900'
                }`}
              >
                <Volume2 size={13} className={activeMode === 'prep' ? 'text-teal-600' : 'text-slate-400'} />
                Prep Mode: AI Mock Interviewer
              </button>
              <button
                onClick={() => setActiveMode('live')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                  activeMode === 'live' 
                    ? 'bg-white text-teal-900 shadow-sm border border-slate-200/30' 
                    : 'text-slate-500 hover:!text-slate-900'
                }`}
              >
                <Monitor size={13} className={activeMode === 'live' ? 'text-teal-600' : 'text-slate-400'} />
                Live Mode: Invisible Copilot
              </button>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-[72px] font-black leading-[1.04] tracking-tight !text-slate-900">
              The <span className="text-teal-600 drop-shadow-sm">Invisible</span>, <br />
              <span className="text-teal-600">Local-First AI</span> <br />
              <span className="!text-slate-900">Interview Copilot.</span>
            </h1>
            
            <p className="mt-6 max-w-xl text-slate-650 text-base sm:text-lg leading-relaxed font-semibold" style={{ color: '#475569' }}>
              Sutra AI is the only platform built as a native desktop overlay. Practice with structured voice mock interviews before, and perform flawlessly during live calls — without anyone ever knowing it's there.
            </p>
            <div className="mt-4 max-w-lg flex items-center gap-3 bg-gradient-to-r from-amber-50 to-teal-50 border border-amber-200/60 rounded-2xl px-5 py-3.5 shadow-sm">
              <img src={sutraLogoImg} alt="" width={28} height={28} style={{ objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <p className="text-sm font-black text-teal-700 leading-tight">Clarity in every answer. <span className="text-slate-900">Confidence in every interview.</span></p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">The Sutra AI Promise</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 font-bold flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              Built for Glances, Not Reading. Speak like a human, not a teleprompter.
            </p>

            <div className="mt-8 flex flex-col items-start w-full">
              <div className="flex flex-wrap items-start gap-4 w-full sm:w-auto">
                <div className="relative inline-block">
                  {/* Ambient glowing button halo */}
                  <div className="absolute -inset-1.5 rounded-xl bg-teal-600 opacity-25 blur-lg animate-pulse" />

                  <button
                    onClick={onStart}
                    onMouseMove={handleCtaMouseMove}
                    onMouseLeave={handleCtaMouseLeave}
                    style={{
                      transform: `translate(${ctaOffset.x}px, ${ctaOffset.y}px)`,
                      transition: ctaOffset.x === 0 && ctaOffset.y === 0 ? 'transform 0.4s ease-out' : 'transform 0.05s ease-out',
                    }}
                    className="group relative overflow-hidden bg-teal-600 hover:bg-teal-500 text-white rounded-xl px-7 py-4 text-sm font-bold shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:shadow-[0_14px_34px_rgba(37,99,235,0.5)] active:scale-[0.96] flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
                  >
                    {/* Hover light sheen animation */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" />
                    <span className="relative z-10">Start Free Session</span>
                    <ArrowRight size={16} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>

                <a 
                  href="#showcase-video" 
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-6 py-4 text-sm font-bold shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 self-start"
                >
                  <PlayCircle size={16} className="text-slate-500" /> Watch Demo
                </a>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 font-bold ml-1">
                No credit card required · 2-minute setup
              </p>
            </div>

            {/* High trust Feature Check */}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 font-bold">
              <span className="flex items-center gap-1.5 text-teal-600">
                <CheckCircle2 size={13} className="text-teal-500" /> True system-level invisibility
              </span>
              <span className="flex items-center gap-1.5 text-teal-600">
                <CheckCircle2 size={13} className="text-teal-500" /> No browser extension flags
              </span>
              <span className="flex items-center gap-1.5 text-teal-600">
                <CheckCircle2 size={13} className="text-teal-500" /> Dynamic STAR-method talking points
              </span>
            </div>

            {/* Trust elements */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                <img className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm animate-fadeIn" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" alt="Learner 1" />
                <img className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm animate-fadeIn" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" alt="Learner 2" />
                <img className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm animate-fadeIn" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80" alt="Learner 3" />
                <img className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm animate-fadeIn" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80" alt="Learner 4" />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex gap-0.5 text-yellow-400">
                  <span className="text-sm font-semibold">★</span>
                  <span className="text-sm font-semibold">★</span>
                  <span className="text-sm font-semibold">★</span>
                  <span className="text-sm font-semibold">★</span>
                  <span className="text-sm font-semibold">★</span>
                </div>
                <span className="text-xs text-slate-500 font-semibold mt-0.5">Trusted by 12,000+ learners</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Mockup */}
          <div 
            id="simulator" 
            className="relative group w-full flex justify-center"
            onMouseMove={handleSimulatorMouseMove}
            onMouseLeave={handleSimulatorMouseLeave}
            onMouseUp={() => setTilt({ x: 0, y: 0 })}
          >
            {/* Deeper directional glow behind mockup — grounds the screenshot visually */}
            <div className="absolute -inset-6 rounded-3xl" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 55%, rgba(13,148,136,0.22) 0%, rgba(20,184,166,0.10) 50%, transparent 80%)', filter: 'blur(32px)' }} />
            <div className="absolute -inset-2 rounded-3xl bg-teal-600 opacity-[0.07] blur-2xl animate-pulse" />
            
            
            {activeMode === 'prep' ? (
              // PREP MODE MOCKUP
              <div 
                style={{
                  transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="relative w-full max-w-[540px] bg-white border border-slate-200/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col"
              >
                
                {/* Mockup Header */}
                <div className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200/80 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" /> Prep Mode: AI Mock
                    </div>
                    {simulatorState === 'typing' && (
                      <span className="text-[10px] text-teal-600 font-bold bg-teal-50 border border-teal-100 rounded px-1.5 py-0.5 animate-pulse">🎙️ Listening...</span>
                    )}
                    {simulatorState === 'thinking' && (
                      <span className="text-[10px] text-purple-600 font-bold bg-purple-50 border border-purple-100 rounded px-1.5 py-0.5 animate-pulse">⚡ Thinking...</span>
                    )}
                    {simulatorState === 'streaming' && (
                      <span className="text-[10px] text-teal-600 font-bold bg-teal-50 border border-teal-100 rounded px-1.5 py-0.5">💡 Copilot Streaming...</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">⏱ 24:35</span>
                    <span className="border border-red-200 text-red-600 bg-red-50/50 rounded-md px-2 py-0.5 text-[10px] font-bold">End Session</span>
                  </div>
                </div>

                {/* Mockup Body: Two columns layout */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-[1.25fr_.75fr] gap-4 bg-slate-50/30 transition-all duration-300 min-h-[380px]">
                  
                  {/* Left Column in Mockup */}
                  <div className="space-y-4">
                    
                    {/* AI Interviewer bubble */}
                    <div className="bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-sm text-left border-teal-500/30 ring-2 ring-teal-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                          <Volume2 size={13} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Interviewer</span>
                      </div>
                      <p className="text-[13px] !text-slate-900 font-semibold min-h-[40px]">
                        {questionLength > 0 ? previewScenarios[activeScenario].question.slice(0, questionLength) : <span className="text-slate-400 italic">Listening for voice signals...</span>}
                      </p>
                    </div>

                    {/* Your Response audio waveform */}
                    <div className="bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-sm text-left border-teal-500/30 ring-2 ring-teal-500/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Response</span>
                        <span className="text-[11px] font-bold text-teal-600">01:24</span>
                      </div>
                      <div className="h-8 flex items-end gap-0.5">
                        {Array.from({ length: 28 }).map((_, i) => {
                          const heights = [3,6,12,18,12,6,3,8,14,24,18,10,4,8,18,32,24,14,6,8,16,28,16,8,4,8,12,6];
                          const h = heights[i % heights.length];
                          return (
                            <span 
                              key={i} 
                              className="flex-1 rounded-sm animate-audio-wave transition-all duration-300"
                              style={{
                                height: `${h}px`,
                                animationDelay: `${i * 0.04}s`,
                                backgroundColor: '#2563eb'
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Metrics */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      id="mockup-metrics" 
                      className="grid grid-cols-3 gap-2 rounded-xl transition-all duration-300"
                    >
                      <div className="bg-white border border-slate-200/60 rounded-xl p-2.5 shadow-sm flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confidence</span>
                        <div className="relative h-11 w-11 flex items-center justify-center">
                          <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="2.5"/>
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="82, 100" strokeLinecap="round"/>
                          </svg>
                          <span className="absolute text-[11px] font-extrabold !text-slate-900">82%</span>
                        </div>
                        <span className="text-[9px] font-bold text-teal-600 mt-1">Good</span>
                      </div>

                      <div className="bg-white border border-slate-200/60 rounded-xl p-2.5 shadow-sm flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clarity</span>
                        <div className="relative h-11 w-11 flex items-center justify-center">
                          <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="2.5"/>
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="2.5" strokeDasharray="78, 100" strokeLinecap="round"/>
                          </svg>
                          <span className="absolute text-[11px] font-extrabold !text-slate-900">78%</span>
                        </div>
                        <span className="text-[9px] font-bold text-orange-600 mt-1">Good</span>
                      </div>

                      <div className="bg-white border border-slate-200/60 rounded-xl p-2.5 shadow-sm flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Relevance</span>
                        <div className="relative h-11 w-11 flex items-center justify-center">
                          <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="2.5"/>
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="91, 100" strokeLinecap="round"/>
                          </svg>
                          <span className="absolute text-[11px] font-extrabold !text-slate-900">91%</span>
                        </div>
                        <span className="text-[9px] font-bold text-teal-600 mt-1">Excellent</span>
                      </div>
                    </motion.div>

                  </div>

                  {/* Right Column in Mockup */}
                  <div className="space-y-4">
                    
                    <motion.div 
                      key="prep-feedback"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-sm text-left flex flex-col flex-1 min-h-[170px]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Feedback</span>
                        <span className="text-[8px] font-black bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Voice Mock</span>
                      </div>
                      <div className="space-y-3 mt-1">
                        <div className="bg-teal-50 border border-teal-100 rounded-lg p-2 flex items-start gap-1.5">
                          <Sparkles size={13} className="text-teal-600 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="text-[8px] font-black text-teal-800 uppercase block">Speech Pacing</span>
                            <p className="text-[9px] text-slate-600 font-bold leading-normal mt-0.5">
                              Pacing is good. Try to emphasize system partition strategies.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Talking Points</span>
                          {['Include partition offset lag checks', 'Mention dead-letter queue adapter'].map((tip, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-teal-500 shrink-0" />
                              <span className="text-[9px] text-slate-600 font-bold">{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* Job Role info */}
                    <div className="bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm text-left">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Job Role</span>
                      <span className="text-xs font-bold !text-slate-900">Backend Developer</span>
                    </div>

                    {/* Question Ratio card */}
                    <div className="bg-white border border-slate-200/60 rounded-xl p-3 shadow-sm text-left">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Question</span>
                      <span className="text-xs font-black !text-slate-900">5 / 12</span>
                    </div>

                  </div>

                </div>

                {/* Quick toggles inside browser frame to test system/sql/react */}
                <div className="bg-slate-50 border-t border-slate-200/80 px-4 py-2.5 flex items-center justify-center gap-2 overflow-x-auto">
                  <button 
                    onClick={() => setActiveScenario('system')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${activeScenario === 'system' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
                  >
                    System Design
                  </button>
                  <button 
                    onClick={() => setActiveScenario('sql')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${activeScenario === 'sql' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
                  >
                    Database Tuning
                  </button>
                  <button 
                    onClick={() => setActiveScenario('react')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${activeScenario === 'react' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
                  >
                    React 19 Reconciler
                  </button>
                </div>

              </div>
            ) : (
              // LIVE STEALTH SLIDER MODE
              <div 
                style={{
                  transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                  transition: 'transform 0.15s ease-out',
                  borderColor: '#1f242c'
                }}
                className="relative w-full max-w-[540px] aspect-[4/3] bg-[#0d1117] border border-slate-850 rounded-2xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col select-none"
              >
                
                {/* Clean IDE Layer */}
                <div className="absolute inset-0 flex flex-col">
                  {/* Mock IDE view */}
                  <MockIDE scenario={activeScenario} />
                </div>

                {/* Conditional Foreground Layer: Your View (Overlay HUD active) */}
                {liveViewMode === 'hud' && (
                  <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
                    {/* Floating Glassmorphic Sutra HUD Overlay */}
                    <div className="absolute top-[85px] left-8 w-[250px] sm:w-[280px] bg-white/75 backdrop-blur-md border border-white/40 shadow-[0_25px_50px_rgba(13,148,136,0.25)] rounded-2xl p-4 text-left pointer-events-auto transition-shadow duration-300 hover:shadow-[0_25px_50px_rgba(13,148,136,0.4)]">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sutra AI Overlay</span>
                        <span className="flex items-center gap-1 bg-teal-500/10 text-teal-700 px-2.5 py-0.5 rounded-full text-[9px] font-bold border border-teal-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                          GLANCE MODE
                        </span>
                      </div>

                      {/* SAY FIRST block */}
                      <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 mb-3">
                        <span className="text-[9px] font-black text-teal-600 tracking-widest uppercase block mb-1">SAY FIRST</span>
                        <p className="text-[10.5px] font-semibold !text-slate-900 leading-relaxed italic">
                          &ldquo;{getStealthScenarioContent(activeScenario).sayFirst}&rdquo;
                        </p>
                      </div>

                      {/* STAR outline block */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">STAR Outline</span>
                        {getStealthScenarioContent(activeScenario).star.map((point, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="mt-0.5 px-1 bg-slate-100 border border-slate-200 rounded text-[7px] font-black text-slate-500 shrink-0">{point.label}</span>
                            <span className="text-[9px] text-slate-600 font-bold leading-snug">{point.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* View Mode Toggle Controls */}
                <div className="absolute top-4 inset-x-0 flex justify-center z-30">
                  <div className="bg-slate-50 backdrop-blur-md p-1 rounded-lg border border-slate-700 flex gap-1 shadow-lg">
                    <button 
                      onClick={() => setLiveViewMode('hud')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${liveViewMode === 'hud' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      👁️ Your View (HUD)
                    </button>
                    <button 
                      onClick={() => setLiveViewMode('clean')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${liveViewMode === 'clean' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      💻 Screen Share
                    </button>
                  </div>
                </div>

                {/* Quick Scenario Toggles at the bottom inside the slider mode */}
                <div className="absolute bottom-0 inset-x-0 bg-slate-50 border-t border-slate-800 px-4 py-2 flex items-center justify-center gap-2 z-20 shrink-0">
                  <button 
                    onClick={() => setActiveScenario('system')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${activeScenario === 'system' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    System Design
                  </button>
                  <button 
                    onClick={() => setActiveScenario('sql')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${activeScenario === 'sql' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    Database Tuning
                  </button>
                  <button 
                    onClick={() => setActiveScenario('react')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${activeScenario === 'react' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    React 19 Reconciler
                  </button>
                </div>

              </div>
            )}

          </div>
        </motion.section>

        {/* ── Stealth & Privacy Ribbon ── */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className="relative z-10 mx-auto w-full max-w-7xl px-6 py-4">
          
          <div className="bg-slate-50 border border-slate-700/60 rounded-2xl p-6 md:p-10 flex flex-col gap-8 shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
            
            {/* Top Row: Copy + Badges */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 px-3 py-1 text-xs font-bold text-teal-600 mb-4">
                  <ShieldCheck size={14} />
                  100% Invisible to Screen Share
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  They see your screen. <br className="hidden sm:block" />
                  <span className="text-teal-600">They never see Sutra AI.</span>
                </h2>
                <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
                  Our click-through overlay sits invisibly above any video platform. You type in your IDE, maintain eye contact, and the AI speaks to you silently — no tab-switch alerts, no extension permissions, no traces.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: EyeOff, text: "Click-Through Overlay" },
                  { icon: BellOff, text: "No Tab-Switch Alerts" },
                  { icon: Database, text: "Zero Data Logged" }
                ].map(({ icon: Icon, text }) => (
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    key={text} 
                    className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-100 px-3.5 py-1.5 cursor-default shadow-sm backdrop-blur-sm"
                  >
                    <Icon size={12} className="text-teal-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-700 tracking-wide">{text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── Phase Step Indicator ── */}
            <div className="flex items-center gap-0 w-full max-w-md mx-auto">
              {(['listening', 'thinking', 'response'] as const).map((phase, idx) => {
                const labels = ['1. Listening', '2. Processing', '3. Responding'];
                const colors = {
                  listening: { active: 'bg-teal-500', text: 'text-teal-600', ring: 'ring-teal-500/40' },
                  thinking:  { active: 'bg-yellow-400', text: 'text-yellow-400', ring: 'ring-yellow-400/40' },
                  response:  { active: 'bg-teal-500', text: 'text-teal-600', ring: 'ring-teal-500/40' },
                };
                const isActive = stealthPhase === phase;
                const isDone = (stealthPhase === 'thinking' && idx === 0) || (stealthPhase === 'response' && idx < 2);
                const c = colors[phase];
                return (
                  <React.Fragment key={phase}>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <motion.div
                        animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                        transition={{ repeat: isActive ? Infinity : 0, duration: 1.2, ease: 'easeInOut' }}
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all duration-500
                          ${isActive ? `${c.active} ring-4 ${c.ring} shadow-lg text-white` : isDone ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-700'}`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </motion.div>
                      <span className={`text-[9px] font-bold tracking-wide transition-colors duration-500 ${isActive ? c.text : isDone ? 'text-teal-600' : 'text-slate-400'}`}>
                        {labels[idx]}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div className="h-px flex-1 mb-4 relative overflow-hidden bg-slate-700">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-teal-600"
                          animate={{ width: isDone ? '100%' : isActive ? '50%' : '0%' }}
                          transition={{ duration: 0.6, ease: 'easeInOut' }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* ── Main Demo: Side-by-side with invisible signal divider ── */}
            <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">

              {/* LEFT: What YOU See */}
              <motion.div
                className="relative bg-slate-100 border border-teal-500/30 rounded-xl p-4 overflow-hidden"
                animate={{ borderColor: stealthPhase === 'response' ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.1)' }}
                transition={{ duration: 0.5 }}
              >
                {/* Corner glow */}
                <motion.div
                  className="absolute -top-6 -left-6 h-20 w-20 rounded-full bg-teal-500/10 blur-xl pointer-events-none"
                  animate={{ opacity: stealthPhase === 'response' ? 0.7 : 0.2 }}
                  transition={{ duration: 0.6 }}
                />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-teal-600">👤 You</span>
                    <span className="text-[9px] text-slate-400">— your private view</span>
                  </div>
                  <motion.span
                    className="text-[9px] font-bold flex items-center gap-1.5"
                    animate={{ color: stealthPhase === 'listening' ? '#60a5fa' : stealthPhase === 'thinking' ? '#facc15' : '#34d399' }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.span
                      className={`h-1.5 w-1.5 rounded-full ${stealthPhase === 'listening' ? 'bg-teal-400' : stealthPhase === 'thinking' ? 'bg-yellow-400' : 'bg-teal-400'} animate-pulse`}
                    />
                    {stealthPhase === 'listening' ? 'Listening...' : stealthPhase === 'thinking' ? 'Processing...' : 'Copilot Active'}
                  </motion.span>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-700/60 min-h-[180px] relative overflow-hidden">
                  {/* Scan line animation */}
                  <AnimatePresence>
                    {stealthPhase === 'thinking' && (
                      <motion.div
                        key="scanline"
                        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent pointer-events-none z-10"
                        initial={{ top: 0, opacity: 0.8 }}
                        animate={{ top: '100%', opacity: [0.8, 0.8, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                    <img src={sutraLogoImg} alt="Sutra AI" width={16} height={16} style={{ objectFit: 'contain' }} />
                    <span className="text-[10px] font-bold text-slate-700">Sutra AI Overlay</span>
                    <motion.span
                      className="ml-auto h-1.5 w-1.5 rounded-full"
                      animate={{ backgroundColor: stealthPhase === 'listening' ? '#60a5fa' : stealthPhase === 'thinking' ? '#facc15' : '#10b981' }}
                      transition={{ duration: 0.4 }}
                      style={{ boxShadow: '0 0 6px currentColor' }}
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {stealthPhase === 'listening' && (
                      <motion.div key="listening" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }} className="flex flex-col items-center justify-center py-6 gap-3">
                        <div className="flex items-end gap-0.5 h-6">
                          {[0, 1, 2, 3, 4, 5, 6].map(i => (
                            <motion.span key={i} className="w-1 rounded-full bg-teal-400 inline-block" animate={{ height: ['3px', `${8 + Math.sin(i) * 10}px`, '3px'] }} transition={{ repeat: Infinity, duration: 0.7 + i * 0.05, delay: i * 0.1, ease: 'easeInOut' }} />
                          ))}
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-teal-700 font-semibold block">Detecting interview question...</span>
                          <span className="text-[8px] text-slate-400 mt-0.5 block">Transcribing audio in real-time</span>
                        </div>
                      </motion.div>
                    )}

                    {stealthPhase === 'thinking' && (
                      <motion.div key="thinking" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }} className="flex flex-col items-center justify-center py-6 gap-3">
                        <div className="flex gap-2 items-center">
                          {[0, 1, 2, 3].map(i => (
                            <motion.span key={i} className="h-2.5 w-2.5 rounded-full bg-yellow-400 inline-block" animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 0.65, delay: i * 0.15 }} />
                          ))}
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-yellow-300 font-semibold block">Crafting your response...</span>
                          <span className="text-[8px] text-slate-400 mt-0.5 block">Analyzing question context + your resume</span>
                        </div>
                      </motion.div>
                    )}

                    {stealthPhase === 'response' && (
                      <motion.div key="response" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-2">
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-teal-900/40 border border-teal-500/30 rounded-md px-2.5 py-2">
                          <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest block mb-1">💬 SAY FIRST</span>
                          <p className="text-[10px] text-slate-200 italic leading-snug">&ldquo;That&rsquo;s similar to a bottleneck we solved last quarter...&rdquo;</p>
                        </motion.div>
                        <div className="space-y-1.5 px-0.5">
                          <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest block">Key Points</span>
                          {['Use async workers + message queue', 'Cache at CDN edge layer', 'Auto-scale horizontally'].map((b, i) => (
                            visibleBullets > i && (
                              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-1.5">
                                <span className="h-3.5 w-3.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-[7px] flex items-center justify-center text-teal-600 font-black shrink-0">{i + 1}</span>
                                <span className="text-[10px] text-slate-700 font-medium">{b}</span>
                              </motion.div>
                            )
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* CENTER: Invisible barrier divider */}
              <div className="hidden md:flex flex-col items-center justify-center gap-2 px-2 min-w-[44px]">
                <div className="flex-1 w-px bg-gradient-to-b from-transparent via-teal-500/30 to-transparent" />
                <motion.div
                  className="h-8 w-8 rounded-full bg-slate-50 border border-teal-500/40 flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.2)]"
                  animate={{ boxShadow: ['0 0 8px rgba(16,185,129,0.15)', '0 0 20px rgba(16,185,129,0.35)', '0 0 8px rgba(16,185,129,0.15)'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <ShieldCheck size={14} className="text-teal-600" />
                </motion.div>
                <span className="text-[7px] font-black uppercase tracking-widest text-teal-600 text-center leading-tight">Invisible<br/>Barrier</span>
                <div className="flex-1 w-px bg-gradient-to-b from-transparent via-teal-500/30 to-transparent" />
              </div>

              {/* RIGHT: What Interviewer Sees */}
              <div className="relative bg-slate-100 border border-slate-700 rounded-xl p-4 overflow-hidden">
                {/* Subtle scanline texture to imply "recording" */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)' }} />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">🎥 Interviewer</span>
                    <span className="text-[9px] text-slate-400">— their screen share view</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-red-500"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    />
                    <span className="text-[8px] text-red-400 font-black tracking-widest">LIVE</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-700/60 min-h-[180px] relative">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                    <div className="flex gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">your-project/index.ts</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <motion.span
                        className="h-1.5 w-1.5 rounded-full bg-red-500"
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                      <span className="text-[8px] text-red-400 font-bold">REC</span>
                    </div>
                  </div>

                  {/* Fake IDE code lines */}
                  <div className="space-y-2 font-mono">
                    {[
                      { w: 'w-full',  color: 'bg-slate-100' },
                      { w: 'w-3/4',  color: 'bg-slate-100' },
                      { w: 'w-5/6',  color: 'bg-teal-900/50' },
                      { w: 'w-4/5',  color: 'bg-slate-100' },
                      { w: 'w-2/3',  color: 'bg-slate-100' },
                    ].map((line, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="text-[8px] text-slate-500 w-3 shrink-0">{i + 1}</span>
                        <div className={`h-2 rounded ${line.color} ${line.w}`} />
                      </div>
                    ))}
                  </div>

                  {/* No-overlay confirmation */}
                  <motion.div
                    className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    <CheckCircle2 size={10} className="text-teal-600 shrink-0" />
                    <span className="text-[9px] text-slate-400">No overlay visible — clean screen share</span>
                  </motion.div>

                  {/* Big "hidden" label overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div
                      className="bg-slate-50 border border-slate-700/60 rounded-lg px-3 py-2 flex items-center gap-2 backdrop-blur-sm"
                      animate={{ opacity: [0.55, 0.8, 0.55] }}
                      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    >
                      <EyeOff size={12} className="text-slate-500" />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sutra AI hidden</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── How It Works — 3-step mini timeline ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-700">
              {[
                { step: '01', icon: Mic, title: 'Audio Captured', desc: "Sutra silently listens to the interviewer's voice via your mic.", color: 'text-teal-600', bg: 'bg-teal-500/10 border-teal-500/30' },
                { step: '02', icon: Brain, title: 'AI Generates Answer', desc: 'Your profile + context shapes a tailored talking point in <2s.', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
                { step: '03', icon: EyeOff, title: 'Zero Screen Exposure', desc: 'The overlay is click-through — never captured by any screen share tool.', color: 'text-teal-600', bg: 'bg-teal-500/10 border-teal-500/30' },
              ].map(({ step, icon: Icon, title, desc, color, bg }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.12 }}
                  className={`flex gap-3 rounded-xl border p-3 ${bg}`}
                >
                  <div className={`h-7 w-7 shrink-0 rounded-lg flex items-center justify-center ${bg}`}>
                    <Icon size={14} className={color} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${color}`}>{step}</span>
                      <span className="text-[10px] font-bold text-white">{title}</span>
                    </div>
                    <p className="text-[9px] text-slate-700 leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </motion.section>


        {/* Stealth & Integration Ribbon */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.8, delay: 0.1 }} 
          className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6 border-y border-slate-200/60 bg-slate-50/50 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm">
              COMPATIBLE WITH ANY CALL PLATFORM — 100% INVISIBLE & DETECTED-FREE
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-teal-600 font-bold bg-teal-50 border border-teal-100 px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span>Undetectable: Verified secure 8 hours ago</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            {/* Zoom */}
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-xs select-none">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z" />
              </svg>
              <span>zoom</span>
            </div>

            {/* Google Meet */}
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-xs select-none">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Google Meet</span>
            </div>

            {/* MS Teams */}
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-xs select-none">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>MS Teams</span>
            </div>

            {/* Webex */}
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-xs select-none">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Webex</span>
            </div>

            {/* LeetCode */}
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-xs select-none">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>LeetCode</span>
            </div>

            {/* HackerRank */}
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-xs select-none">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 16 4-4-4-4" />
                <path d="m6 8-4 4 4 4" />
                <path d="m14.5 4-5 16" />
              </svg>
              <span>HackerRank</span>
            </div>
          </div>
        </motion.section>

        {/* Showcase Video Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          id="showcase-video"
          className="relative z-10 mx-auto w-full max-w-5xl px-6 py-16 text-center"
        >
          <div className="max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-100 px-3 py-1 text-[11px] font-bold text-teal-600 mb-4">
              <PlayCircle size={12} /> Video Walkthrough
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black !text-slate-900 tracking-tight">
              Sutra AI in Action
            </h2>
            <p className="mt-3 text-slate-500 text-sm sm:text-base font-medium max-w-xl mx-auto">
              See how the overlay helps candidates perform flawlessly during interviews.
            </p>
          </div>


          {/* Ambient glow behind the player, matching the hero mockup treatment */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute -inset-3 rounded-[2rem] bg-teal-600 opacity-[0.12] blur-2xl" />

            <div className="relative rounded-3xl bg-slate-900 border border-slate-700/60 p-2.5 shadow-[0_25px_60px_rgba(15,23,42,0.35)] overflow-hidden aspect-video group">
              {isVideoPlaying ? (
                video.type === 'youtube' ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1&modestbranding=1&rel=0&playsinline=1`}
                    className="w-full h-full rounded-2xl border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={video.url}
                    controls
                    autoPlay
                    className="w-full h-full rounded-2xl border-0 object-contain bg-black"
                  />
                )
              ) : (
                <>
                  {/* Thumbnail */}
                  {video.type === 'youtube' ? (
                    <img
                      src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                      alt="Sutra AI Demo"
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`; }}
                    />
                  ) : (
                    <video src={video.url} className="absolute inset-0 w-full h-full object-cover rounded-2xl bg-black" />
                  )}
                  {/* Dark scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10 rounded-2xl" />

                  {/* Branded play button overlay */}
                  <button
                    onClick={handlePlayClick}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl cursor-pointer group/play"
                    aria-label="Play Sutra AI demo"
                  >
                    <div className="relative">
                      <div className="absolute -inset-3 rounded-full bg-teal-500/30 blur-lg animate-pulse" />
                      <div className="relative h-20 w-20 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-2xl transition-all duration-300 group-hover/play:scale-110 group-hover/play:bg-white">
                        <PlayCircle size={36} className="text-teal-600 ml-1" fill="currentColor" fillOpacity={0.15} />
                      </div>
                    </div>
                    <span className="text-white/90 text-sm font-bold tracking-wide drop-shadow-md">Watch the full demo</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.section>

        {/* Success Stories Section */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 overflow-hidden text-center"
        >
          <div className="max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/60 bg-teal-50 px-3 py-1 text-[10px] font-bold text-teal-700 uppercase tracking-wider mb-4">
              Real Candidates
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black !text-slate-900 tracking-tight leading-tight">
              Success stories from{' '}
              <span className="text-teal-600">
                our candidates
              </span>
            </h2>
            <p className="mt-4 text-slate-600 text-sm sm:text-base font-medium max-w-xl mx-auto">
              Real results from developers who nailed their interviews.
            </p>
          </div>
        
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
            {shorts.slice(0, 4).map((short, idx) => {
              const isPlaying = playingId === short.videoId;
              return (
                <div
                  key={`${short.videoId}-${idx}`}
                  className="group relative w-full aspect-[9/16] bg-slate-50 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.1)] ring-1 ring-slate-200 hover:ring-2 hover:ring-teal-400/60 hover:shadow-[0_20px_40px_rgba(13,148,136,0.2)] transition-all duration-300 transform hover:-translate-y-2"
                >
                  {isPlaying ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${short.videoId}?autoplay=1&loop=1&playlist=${short.videoId}&controls=1&modestbranding=1&playsinline=1&rel=0`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      onClick={() => setPlayingId(short.videoId)}
                      className="relative w-full h-full cursor-pointer block"
                      aria-label={`Play testimonial from ${short.name}`}
                    >
                      {/* Thumbnail */}
                      <img
                        src={`https://img.youtube.com/vi/${short.videoId}/hqdefault.jpg`}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Gradient scrim so text stays legible over any thumbnail */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
        
                      {/* Custom on-brand play button (replaces default red YouTube button) */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-14 w-14 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                          <PlayCircle size={26} className="text-teal-600 ml-0.5" fill="currentColor" fillOpacity={0.15} />
                        </div>
                      </div>
        
                      {/* Name / role card, bottom-anchored */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                        <p className="text-white font-bold text-sm leading-tight">{short.name}</p>
                        <p className="text-white/70 text-[11px] font-semibold mt-0.5">{short.role}</p>
                        <p className="text-teal-700 text-[10px] font-bold mt-1.5 flex items-center gap-1">
                          <CheckCircle2 size={11} /> {short.outcome}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section id="features" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, type: "spring", bounce: 0.2 }} className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 mt-12 text-center overflow-hidden">

          {/* Faint background mesh — gives the section depth without competing with the cards */}
          <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.05),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(139,92,246,0.05),transparent_40%)]" />

          <div className="max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-100 px-3.5 py-1 text-xs font-bold text-teal-600 mb-4">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
              </span>
              Everything you need to succeed
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black !text-slate-900 tracking-tight">
              Smarter Practice.{' '}
              <span className="bg-teal-600 bg-clip-text text-transparent">
                Better Results.
              </span>
            </h2>
            <p className="mt-4 text-slate-600 text-base sm:text-lg font-medium max-w-xl mx-auto leading-relaxed">
              Build confidence, improve communication, and land your dream role with AI that adapts to you.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* Card 1: Real-time AI Interviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="relative bg-white border border-slate-200/85 rounded-2xl p-6 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.12)] hover:border-teal-300/70 transition-all duration-300 flex flex-col justify-between group cursor-pointer overflow-hidden"
              onClick={() => handleLearnMore('system')}
            >
              {/* Corner glow that blooms on hover */}
              <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-teal-500/0 group-hover:bg-teal-500/10 blur-2xl transition-colors duration-500" />

              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-teal-600/60 ring-1 ring-teal-200/50 flex items-center justify-center text-teal-600 mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  <Mic size={20} />
                </div>
                <h3 className="font-display text-lg font-bold !text-slate-900 mb-2">Real-time AI Interviews</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Practice with AI interviewers that adapt to your answers and give instant feedback.
                </p>
              </div>
              <span className="relative mt-6 text-xs font-bold text-teal-600 flex items-center gap-1.5">
                Learn more
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 transition-all duration-300 group-hover:bg-teal-600 group-hover:text-white group-hover:translate-x-0.5">
                  <ArrowRight size={11} />
                </span>
              </span>
            </motion.div>

            {/* Card 2: Resume Intelligence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              whileHover={{ y: -8 }}
              className="relative bg-white border border-slate-200/85 rounded-2xl p-6 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.12)] hover:border-teal-300/70 transition-all duration-300 flex flex-col justify-between group cursor-pointer overflow-hidden"
              onClick={() => handleLearnMore('sql')}
            >
              <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-teal-500/0 group-hover:bg-teal-500/10 blur-2xl transition-colors duration-500" />

              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-teal-600/60 ring-1 ring-teal-200/50 flex items-center justify-center text-teal-600 mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  <FileText size={20} />
                </div>
                <h3 className="font-display text-lg font-bold !text-slate-900 mb-2">Resume Intelligence</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  AI analyzes your resume and tailors questions to your experience and skills.
                </p>
              </div>
              <span className="relative mt-6 text-xs font-bold text-teal-600 flex items-center gap-1.5">
                Learn more
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 transition-all duration-300 group-hover:bg-teal-600 group-hover:text-white group-hover:translate-x-0.5">
                  <ArrowRight size={11} />
                </span>
              </span>
            </motion.div>

            {/* Card 3: Knowledge Base */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8 }}
              className="relative bg-white border border-slate-200/85 rounded-2xl p-6 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(147,51,234,0.12)] hover:border-purple-300/70 transition-all duration-300 flex flex-col justify-between group cursor-pointer overflow-hidden"
              onClick={() => handleLearnMore('react')}
            >
              <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-purple-500/0 group-hover:bg-purple-500/10 blur-2xl transition-colors duration-500" />

              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/60 ring-1 ring-purple-200/50 flex items-center justify-center text-purple-600 mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  <Library size={20} />
                </div>
                <h3 className="font-display text-lg font-bold !text-slate-900 mb-2">Knowledge Base</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Upload documents, notes, or links and let AI use them during interviews.
                </p>
              </div>
              <span className="relative mt-6 text-xs font-bold text-purple-600 flex items-center gap-1.5">
                Learn more
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-50 transition-all duration-300 group-hover:bg-purple-600 group-hover:text-white group-hover:translate-x-0.5">
                  <ArrowRight size={11} />
                </span>
              </span>
            </motion.div>

            {/* Card 4: Performance Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              whileHover={{ y: -8 }}
              className="relative bg-white border border-slate-200/85 rounded-2xl p-6 text-left shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(217,119,6,0.12)] hover:border-amber-300/70 transition-all duration-300 flex flex-col justify-between group cursor-pointer overflow-hidden"
              onClick={() => handleLearnMore('insights')}
            >
              <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-amber-500/0 group-hover:bg-amber-500/10 blur-2xl transition-colors duration-500" />

              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/60 ring-1 ring-amber-200/50 flex items-center justify-center text-amber-600 mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  <BarChart3 size={20} />
                </div>
                <h3 className="font-display text-lg font-bold !text-slate-900 mb-2">Performance Insights</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Track your progress with detailed analytics and improve every time.
                </p>
              </div>
              <span className="relative mt-6 text-xs font-bold text-amber-600 flex items-center gap-1.5">
                Learn more
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 transition-all duration-300 group-hover:bg-amber-600 group-hover:text-white group-hover:translate-x-0.5">
                  <ArrowRight size={11} />
                </span>
              </span>
            </motion.div>

          </div>
        </motion.section>

        {/* Dual-Loop Framework */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.1 }}
          id="how-it-works"
          className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 mt-12 text-center"
        >
          {/* Custom style block for flow animations */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes loopFlow {
              to { stroke-dashoffset: -32; }
            }
            .flow-line-blue {
              stroke-dasharray: 5, 7;
              animation: loopFlow 1.4s linear infinite;
              stroke: #2563eb;
              filter: drop-shadow(0 0 4px rgba(37,99,235,0.45));
            }
            .flow-line-teal {
              stroke-dasharray: 5, 7;
              animation: loopFlow 1.4s linear infinite;
              stroke: #059669;
              filter: drop-shadow(0 0 4px rgba(5,150,105,0.45));
            }
            .memory-orb-pulse {
              animation: orbGlow 3.4s ease-in-out infinite;
            }
            @keyframes orbGlow {
              0%, 100% {
                transform: scale(1);
                filter: drop-shadow(0 0 10px rgba(37,99,235,0.22)) drop-shadow(0 0 10px rgba(5,150,105,0.22));
              }
              50% {
                transform: scale(1.045);
                filter: drop-shadow(0 0 20px rgba(37,99,235,0.4)) drop-shadow(0 0 20px rgba(5,150,105,0.4));
              }
            }
            .ring-rotate {
              animation: ringSpin 24s linear infinite;
              transform-origin: 120px 120px;
            }
            @keyframes ringSpin {
              to { transform: rotate(360deg); }
            }
          `}} />

          <div className="max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50/80 px-3.5 py-1 text-[11px] font-semibold tracking-wide text-teal-700 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              The only tool that bridges both worlds
            </span>
            <h2 className="font-display text-3xl sm:text-[2.5rem] font-bold !text-slate-900 tracking-tight leading-[1.1]">
              The Dual-Loop Framework
            </h2>
            <p className="mt-5 text-slate-500 text-[15px] leading-relaxed max-w-lg mx-auto">
              Your practice sessions build a personalized memory store. When the real interview happens, Sutra AI surfaces <span className="text-slate-700 font-medium">your own</span> stories, not generic AI text.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_260px_1fr] gap-6 lg:gap-4 max-w-6xl mx-auto text-left items-center">
            {/* Loop 1: Rehearsal Card */}
            <motion.div
              whileHover={{ y: -4 }}
              onMouseEnter={() => setHoveredLoop(1)}
              onMouseLeave={() => setHoveredLoop(null)}
              className={`relative bg-white border rounded-[28px] p-8 flex flex-col gap-7 transition-all duration-500 ease-out cursor-pointer ${
                hoveredLoop === 1
                  ? 'border-teal-200 shadow-[0_20px_40px_-16px_rgba(37,99,235,0.18)]'
                  : 'border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  hoveredLoop === 1 ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25' : 'bg-teal-50 text-teal-600'
                }`}>
                  <NotebookPen size={19} strokeWidth={2.1} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-teal-500/90 uppercase tracking-[0.14em] block leading-none mb-1.5">Loop 1 &middot; Preparation</span>
                  <h3 className="font-display text-[19px] font-bold !text-slate-900 leading-tight">Rehearsal Mode</h3>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                {[
                  { title: 'Upload your resume + job docs', desc: 'Sutra AI learns your experience, projects, and skill set.' },
                  { title: 'Run unlimited mock interviews', desc: 'AI plays the interviewer. You build real, natural answers.' },
                  { title: 'Responses saved to memory store', desc: 'Your best answers are stored privately, locally, and securely.' },
                ].map(({ title, desc }, idx) => (
                  <div key={title} className="flex gap-3.5">
                    <div className="flex flex-col items-center pt-0.5">
                      <span className="h-[7px] w-[7px] rounded-full bg-teal-500/70 shrink-0" />
                      {idx < 2 && <span className="w-px flex-1 bg-slate-100 mt-1.5" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-[13.5px] font-semibold !text-slate-900 leading-snug">{title}</p>
                      <p className="text-[12.5px] text-slate-500 leading-relaxed mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Central SVG Interactive Diagram */}
            <div className="flex flex-col items-center justify-center py-8 lg:py-0 relative">
              <svg width="240" height="240" viewBox="0 0 240 240" fill="none" className="overflow-visible select-none">
                {/* Outer static ring */}
                <circle cx="120" cy="120" r="98" stroke="#f1f5f9" strokeWidth="1" fill="none" />

                {/* Background flow paths */}
                <path d="M 40 120 C 40 50, 120 50, 120 120" stroke="#f1f5f9" strokeWidth="5" strokeLinecap="round" />
                <path d="M 120 120 C 120 190, 200 190, 200 120" stroke="#f1f5f9" strokeWidth="5" strokeLinecap="round" />

                {/* Animated active paths */}
                <path
                  d="M 40 120 C 40 50, 120 50, 120 120"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className={`transition-opacity duration-500 ${hoveredLoop === 1 ? 'flow-line-blue' : 'opacity-25'}`}
                />
                <path
                  d="M 120 120 C 120 190, 200 190, 200 120"
                  stroke="#059669"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className={`transition-opacity duration-500 ${hoveredLoop === 2 ? 'flow-line-teal' : 'opacity-25'}`}
                />

                {/* Faint rotating orbit ring for depth */}
                <circle cx="120" cy="120" r="42" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="1 6" strokeLinecap="round" className="ring-rotate" />

                {/* Central orb */}
                <circle cx="120" cy="120" r="27" fill="url(#orbGrad)" className="memory-orb-pulse" />
                <circle cx="120" cy="120" r="27" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />

                <defs>
                  <linearGradient id="orbGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {/* Inner icon inside central orb */}
                <g transform="translate(109, 109)" className="pointer-events-none">
                  <path d="M4 2 L20 2 L20 6 L4 6 Z M4 9 L20 9 L20 13 L4 13 Z M4 16 L20 16 L20 20 L4 20 Z" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                <text x="120" y="76" textAnchor="middle" fill="#64748b" className="text-[10px] font-bold uppercase" style={{ letterSpacing: '0.12em' }}>Memory Store</text>
              </svg>

              <div className="absolute top-[54%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="text-[8.5px] font-bold uppercase text-white/95" style={{ letterSpacing: '0.16em' }}>Secure</span>
              </div>
            </div>

            {/* Loop 2: Live Performance Card */}
            <motion.div
              whileHover={{ y: -4 }}
              onMouseEnter={() => setHoveredLoop(2)}
              onMouseLeave={() => setHoveredLoop(null)}
              className={`relative bg-white border rounded-[28px] p-8 flex flex-col gap-7 transition-all duration-500 ease-out cursor-pointer ${
                hoveredLoop === 2
                  ? 'border-teal-200 shadow-[0_20px_40px_-16px_rgba(5,150,105,0.18)]'
                  : 'border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  hoveredLoop === 2 ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/25' : 'bg-teal-50 text-teal-600'
                }`}>
                  <Radio size={19} strokeWidth={2.1} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-teal-500/90 uppercase tracking-[0.14em] block leading-none mb-1.5">Loop 2 &middot; Delivery</span>
                  <h3 className="font-display text-[19px] font-bold !text-slate-900 leading-tight">Live Performance</h3>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                {[
                  { title: 'Copilot activates invisibly', desc: 'The click-through overlay launches over Zoom, Teams, or Meet.' },
                  { title: 'AI detects the interview topic', desc: 'Natural language processing matches the question context in real-time.' },
                  { title: 'Your stories surface automatically', desc: 'The HUD shows your own personalized answers — not generic AI text.' },
                ].map(({ title, desc }, idx) => (
                  <div key={title} className="flex gap-3.5">
                    <div className="flex flex-col items-center pt-0.5">
                      <span className="h-[7px] w-[7px] rounded-full bg-teal-500/70 shrink-0" />
                      {idx < 2 && <span className="w-px flex-1 bg-slate-100 mt-1.5" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-[13.5px] font-semibold !text-slate-900 leading-snug">{title}</p>
                      <p className="text-[12.5px] text-slate-500 leading-relaxed mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Center connector */}
          <div className="flex items-center justify-center mt-14 gap-4 max-w-md mx-auto">
            <div className="h-px bg-gradient-to-r from-transparent to-slate-200 flex-1" />
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500" />
              </span>
              <span className="text-[11.5px] font-semibold text-slate-600 tracking-wide">Continuous sync loop active</span>
            </div>
            <div className="h-px bg-gradient-to-l from-transparent to-slate-200 flex-1" />
          </div>
        </motion.section>

        {/* Dynamic Reviews Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          id="reviews"
          className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 mt-12 text-center"
        >
          <div className="max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center rounded-full bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-600 mb-4">
              Candidate Success Stories
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold !text-slate-900 tracking-tight">
              Loved by Engineers. Trusted Globally.
            </h2>
            <p className="mt-4 text-slate-600 text-base sm:text-lg font-medium max-w-xl mx-auto leading-relaxed">
              Discover how software engineers, product managers, and developers use Sutra AI to build confidence and land offers.
            </p>
          </div>

          <div className="relative w-full max-w-full overflow-hidden py-4 -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="animate-marquee flex gap-6 w-max">
              {[...reviews, ...reviews, ...reviews, ...reviews].map((r, i) => (
                <div
                  key={`${r.id || 'r'}-${i}`}
                  className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-xl hover:border-teal-200 transition-all duration-300 flex flex-col justify-between w-[350px] shrink-0 text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img src={r.avatar} alt={r.name} className="h-10 w-10 rounded-full object-cover border border-slate-100 shadow-sm" />
                        <div>
                          <h4 className="font-display text-sm font-bold !text-slate-900 leading-tight">{r.name}</h4>
                          <span className="text-[10px] font-semibold text-slate-500">{r.role} at {r.company}</span>
                        </div>
                      </div>
                      <span className="text-xs bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg text-teal-600 font-bold shrink-0">Verified</span>
                    </div>

                    <div className="flex text-yellow-400 text-xs mb-3">
                      {Array.from({ length: r.rating }).map((_, idx) => (
                        <span key={idx}>★</span>
                      ))}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium italic whitespace-normal">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Gradient overlays for smooth fading at the edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent" />
          </div>
        </motion.section>

        {/* ════════════════════════════════ */}
        {/* PRICING SECTION                  */}
        {/* ════════════════════════════════ */}
        <section id="pricing" className="relative z-10 w-full py-24 overflow-hidden">

          {/* Background — matches landing page canvas */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 40%, #f0fdf4 80%, #ffffff 100%)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(13,148,136,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 80%)' }} />

          <div className="relative mx-auto w-full max-w-7xl px-6">

            {/* ── Header ── */}
            <div className="text-center mb-14">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-bold text-teal-700 mb-5 tracking-wider uppercase">
                  <Zap size={11} /> Simple, Transparent Pricing
                </span>
                <h2 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-black !text-slate-900 tracking-tight leading-tight mb-4">
                  Choose Your Plan
                </h2>
                <p className="text-slate-500 text-base sm:text-lg font-medium max-w-xl mx-auto leading-relaxed">
                  Select a subscription plan for unlimited practice or get session credits to pay-as-you-go.
                </p>
              </motion.div>
            </div>

            {/* ── Toggle Selector ── */}
            <div className="flex justify-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1.5"
              >
                <button
                  onClick={() => setLandingPricingTab('periods')}
                  className="relative px-5 py-2.5 text-sm font-bold rounded-xl transition-colors duration-200 cursor-pointer capitalize z-10 flex items-center gap-1.5"
                  style={{ color: landingPricingTab === 'periods' ? '#ffffff' : '#64748b' }}
                >
                  {landingPricingTab === 'periods' && (
                    <motion.div
                      layoutId="landing-pricing-tab-indicator"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    Subscription Plans
                  </span>
                </button>
                <button
                  onClick={() => setLandingPricingTab('credits')}
                  className="relative px-5 py-2.5 text-sm font-bold rounded-xl transition-colors duration-200 cursor-pointer capitalize z-10 flex items-center gap-1.5"
                  style={{ color: landingPricingTab === 'credits' ? '#ffffff' : '#64748b' }}
                >
                  {landingPricingTab === 'credits' && (
                    <motion.div
                      layoutId="landing-pricing-tab-indicator"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #0d9488, #059669)' }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    Session Credits
                  </span>
                </button>
                <button
                  onClick={() => setLandingPricingTab('lifetime')}
                  className="relative px-5 py-2.5 text-sm font-bold rounded-xl transition-colors duration-200 cursor-pointer capitalize z-10 flex items-center gap-1.5"
                  style={{ color: landingPricingTab === 'lifetime' ? '#ffffff' : '#64748b' }}
                >
                  {landingPricingTab === 'lifetime' && (
                    <motion.div
                      layoutId="landing-pricing-tab-indicator"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Crown size={12} />
                    Lifetime
                  </span>
                </button>
              </motion.div>
            </div>

            {/* ── Plan Cards ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={landingPricingTab}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className={`grid gap-6 ${landingPricingTab === 'lifetime' ? 'md:grid-cols-1 max-w-4xl' : 'md:grid-cols-3 max-w-5xl'} mx-auto items-stretch mb-16`}>
                  {landingPricingTab === 'lifetime' ? (
                    <motion.div
                      key="lifetime"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="relative rounded-3xl overflow-hidden"
                      style={{ border: '2px solid #f59e0b', boxShadow: '0 20px 60px rgba(245,158,11,0.2), 0 0 0 1px rgba(245,158,11,0.1)' }}
                    >
                      {/* Golden top bar */}
                      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(to right, #d97706, #f59e0b, #fbbf24, #f59e0b, #d97706)' }} />

                      {/* Golden ambient glow */}
                      <div className="absolute -inset-px rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.15) 0%, transparent 60%)' }} />

                      {/* Badge */}
                      <div className="absolute top-6 right-6">
                        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black tracking-wider" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#fff' }}>
                          <Crown size={9} /> Limited Offer
                        </span>
                      </div>

                      <div className="bg-white p-8 md:p-10 flex flex-col md:flex-row gap-10 items-start">
                        {/* Left: info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', boxShadow: '0 8px 20px rgba(245,158,11,0.35)' }}>
                              <Crown size={22} className="text-white" />
                            </div>
                            <div>
                              <h3 className="font-display text-2xl font-black !text-slate-900">Lifetime Plan</h3>
                              <p className="text-slate-400 text-xs font-medium">Pay once. Use forever. No renewals.</p>
                            </div>
                          </div>

                          <div className="flex items-baseline gap-2 mt-6 mb-2">
                            <span className="text-sm text-slate-400 line-through font-semibold">$599</span>
                            <span className="text-5xl font-black" style={{ color: '#d97706' }}>$299</span>
                            <span className="text-slate-400 text-sm font-medium">one-time</span>
                            <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)' }}>50% OFF</span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium mb-6">Billed once — access forever, including all future updates.</p>

                          <div className="h-px bg-slate-100 mb-6" />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              'Unlimited AI interviews — forever',
                              'All future feature updates included',
                              'Premium AI model access',
                              'Unlimited history & analytics',
                              'Dedicated lifetime support channel',
                              'Early access to every new tool',
                              'Custom AI persona & tone settings',
                              'Private beta feature access',
                            ].map((f) => (
                              <div key={f} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
                                <div className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)' }}>
                                  <Check size={9} style={{ color: '#d97706' }} />
                                </div>
                                {f.includes('forever') || f.includes('Unlimited') ? <span className="font-bold !text-slate-900">{f}</span> : f}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: CTA block */}
                        <div className="md:w-64 shrink-0 flex flex-col gap-4">
                          <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(217,119,6,0.06) 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <p className="text-xs font-bold text-amber-700 mb-1 uppercase tracking-wider">What you get</p>
                            <p className="text-sm font-semibold text-slate-700 leading-relaxed">Full platform access with zero recurring payments. Land your dream job — and keep using Sutra AI even after.</p>
                          </div>
                          <div className="rounded-2xl p-4 flex items-start gap-2.5" style={{ background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-semibold text-emerald-700">30-day money-back guarantee. No questions asked.</p>
                          </div>
                          <button
                            onClick={onSignIn}
                            className="w-full py-4 rounded-2xl text-sm font-black cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98] text-white relative overflow-hidden group"
                            style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #d97706 100%)', backgroundSize: '200% auto', boxShadow: '0 8px 24px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                          >
                            <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12" />
                            <span className="relative flex items-center justify-center gap-2">
                              <Crown size={14} /> Get Lifetime Access
                            </span>
                          </button>
                          <p className="text-center text-[11px] text-slate-400 font-medium">One payment · Access forever · No subscriptions</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (landingPricingTab === 'periods' ? [
                    {
                      name: 'Weekly Plan',
                      desc: 'Short-term intensive mock prep',
                      price: '$9',
                      unit: '/ week',
                      features: ['Unlimited live mock interviews', 'Real-time AI suggestions', 'Resume synchronization', '7 days history retention', 'Unlimited customer support'],
                      highlight: false,
                      cta: 'Subscribe Weekly',
                      badge: '',
                    },
                    {
                      name: 'Monthly Plan',
                      desc: 'Standard prep for job seekers',
                      price: '$29',
                      unit: '/ month',
                      features: ['Unlimited live mock interviews', 'Advanced AI feedback reports', 'Resume matching & optimization', '90 days history retention', 'Knowledge base doc context matching', 'Unlimited priority support'],
                      highlight: true,
                      cta: 'Subscribe Monthly',
                      badge: 'Most Popular',
                    },
                    {
                      name: 'Yearly Plan',
                      desc: 'Long-term ongoing career development',
                      price: '$199',
                      unit: '/ year',
                      features: ['Unlimited live mock interviews', 'Premium custom AI models', 'Unlimited history retention', 'Early access to new tools', 'Priority queue channel support', 'Advanced career analytics dashboard'],
                      highlight: false,
                      cta: 'Subscribe Yearly',
                      badge: 'Best Value',
                    },
                  ] : [
                    {
                      name: '1 Session Credit',
                      desc: 'One full live mock session',
                      price: '$3',
                      unit: 'one-time',
                      features: ['1 full live mock session (unlimited mins)', 'Real-time AI feedback & transcript', 'Standard response channel', '30 days validity'],
                      highlight: false,
                      cta: 'Buy 1 Credit',
                      badge: '',
                    },
                    {
                      name: '2 Sessions Pack',
                      desc: 'Double practice sessions',
                      price: '$5',
                      unit: 'one-time',
                      features: ['2 full live mock sessions', 'Real-time AI feedback & transcript', 'Personalized resume sync', '60 days validity', 'Standard response channel'],
                      highlight: false,
                      cta: 'Buy 2 Credits',
                      badge: '',
                    },
                    {
                      name: '3 Sessions Pack',
                      desc: 'Triple practice sessions + extras',
                      price: '$7',
                      unit: 'one-time',
                      features: ['3 full live mock sessions', 'Real-time AI feedback & transcript', 'Personalized resume sync', '90 days validity', 'Priority email support', 'Knowledge base doc matching'],
                      highlight: true,
                      cta: 'Buy 3 Credits',
                      badge: 'Popular Choice',
                    },
                  ]).map((plan, i) => (
                    <motion.div
                      key={plan.name}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                      whileHover={{ y: -5, boxShadow: plan.highlight ? '0 24px 60px rgba(13,148,136,0.18)' : '0 16px 40px rgba(0,0,0,0.1)' }}
                      className="relative rounded-3xl bg-white flex flex-col overflow-hidden"
                      style={{
                        border: plan.highlight ? '2px solid #0d9488' : '1px solid #e2e8f0',
                        boxShadow: plan.highlight ? '0 16px 48px rgba(13,148,136,0.12)' : '0 2px 12px rgba(0,0,0,0.04)',
                      }}
                    >
                      {/* Top accent bar for Highlighted plan */}
                      {plan.highlight && (
                        <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #0d9488, #059669)' }} />
                      )}
                      {/* Badge */}
                      {plan.badge && (
                        <div className="absolute top-5 right-5">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider bg-teal-50 border border-teal-200 text-teal-700">
                            <Sparkles size={9} /> {plan.badge}
                          </span>
                        </div>
                      )}

                      <div className="p-7 flex flex-col flex-1">
                        {/* Header */}
                        <div className="mb-5">
                          <h3 className="font-display text-xl font-black !text-slate-900 mb-1">{plan.name}</h3>
                          <p className="text-slate-400 text-xs font-medium">{plan.desc}</p>
                        </div>

                        {/* Perceived Value Badge */}
                        <div className="flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-3.5 py-2.5 mb-5">
                          <span className="text-sm">{landingPricingTab === 'periods' ? '♾' : '⚡'}</span>
                          <span className="text-sm font-black text-teal-800">
                            {landingPricingTab === 'periods' ? 'Unlimited AI Usage' : 'Session-based Credits'}
                          </span>
                          <span className="text-teal-500 text-[10px] font-semibold uppercase">Included</span>
                        </div>

                        {/* Price */}
                        <div className="mb-5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black !text-slate-900">{plan.price}</span>
                            <span className="text-slate-400 text-sm font-medium">
                              {plan.unit}
                            </span>
                          </div>
                        </div>

                        <div className="h-px bg-slate-100 mb-5" />

                        {/* Features */}
                        <ul className="space-y-3 flex-1 mb-7">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium text-left">
                              <div className="mt-0.5 h-4 w-4 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                                <Check size={9} className="text-teal-600" />
                              </div>
                              {f.includes('Unlimited') ? (
                                <span className="font-bold !text-slate-900">{f}</span>
                              ) : f}
                            </li>
                          ))}
                        </ul>

                        {/* CTA */}
                        <button
                          onClick={onSignIn}
                          className="w-full py-3.5 rounded-2xl text-sm font-black cursor-pointer transition-all duration-200 hover:-translate-y-px"
                          style={plan.highlight ? {
                            background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                            color: '#ffffff',
                            boxShadow: '0 4px 20px rgba(13,148,136,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                          } : {
                            background: '#f8fafc',
                            color: '#334155',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {plan.cta}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* ── Credits vs Subscription Explanation ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-20 rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
            >
              <div className="grid md:grid-cols-[1fr_auto] gap-10 items-center">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-black text-teal-700 mb-5 tracking-wider uppercase">
                    <Zap size={10} /> Sessions & Subscriptions
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-black !text-slate-900 mb-3">
                    Flexible options for<br />every interview prep
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium max-w-md">
                    Choose session credits if you are preparing for a specific loop, or subscribe to get unlimited practice sessions and complete access to all AI tools.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  {[
                    { icon: Mic, label: '1 Live Mock Session', cost: 'Consumes 1 Credit', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
                    { icon: Brain, label: 'Real-time AI Feedback', cost: 'Included in all plans', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
                    { icon: FileText, label: 'Resume Analyzer', cost: 'Included in all plans', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
                    { icon: Sparkles, label: 'Unlimited Practice', cost: 'With any Subscription', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
                  ].map(({ icon: Icon, label, cost, color, bg }) => (
                    <div key={label} className={`flex flex-col gap-2 rounded-2xl border p-4 min-w-[140px] ${bg}`}>
                      <div className="h-8 w-8 rounded-xl bg-white/70 flex items-center justify-center border border-current/10">
                        <Icon size={15} className={color} />
                      </div>
                      <span className="text-xs font-bold !text-slate-900">{label}</span>
                      <span className="text-[10px] font-semibold text-slate-400">{cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── Feature Comparison Table ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-16"
            >
              <h3 className="font-display text-2xl font-black !text-slate-900 text-center mb-8">Full Feature Comparison</h3>
              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-4 px-6 text-slate-400 font-bold text-xs uppercase tracking-wider">Feature</th>
                      {['Free Tier', 'Session Credits', 'Subscriptions'].map((col) => (
                        <th key={col} className="py-4 px-6 text-center font-black text-xs uppercase tracking-wider" style={{ color: col === 'Subscriptions' ? '#0d9488' : '#1e293b' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'Price / Investment', free: 'Free ($0)', credits: 'From $3', subscriptions: 'From $9/wk' },
                      { feature: 'Mock Sessions Included', free: '1 session/day (10 mins)', credits: '1 full session per credit', subscriptions: 'Unlimited sessions' },
                      { feature: 'AI Feedback Reports', free: 'Basic suggestions', credits: 'Advanced feedback', subscriptions: 'Premium custom feedback' },
                      { feature: 'Resume Matching', free: 'Basic analysis', credits: 'Full resume matching', subscriptions: 'Unlimited matching & sync' },
                      { feature: 'Session History Archive', free: '24 hours', credits: '90 days', subscriptions: 'Unlimited archive' },
                      { feature: 'Custom Prompts & Guides', free: false, credits: true, subscriptions: true },
                      { feature: 'Priority Audio Channels', free: false, free_bool: true, credits: false, credits_bool: true, subscriptions: true },
                      { feature: 'Support Tier', free: 'Standard support', credits: 'Priority email support', subscriptions: 'Priority 24/7 queue support' },
                    ].map((row, i) => (
                      <tr key={row.feature} className="border-b border-slate-50" style={{ background: i % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                        <td className="py-4 px-6 text-slate-700 font-medium">
                          {row.feature}
                        </td>
                        {[row.free, row.credits, row.subscriptions].map((val, j) => {
                          const isBool = typeof val === 'boolean' || val === undefined;
                          const boolVal = j === 0 ? (row.free_bool !== undefined ? row.free_bool : val) : j === 1 ? (row.credits_bool !== undefined ? row.credits_bool : val) : val;
                          return (
                            <td key={j} className="py-4 px-6 text-center">
                              {isBool ? (
                                boolVal ? (
                                  <div className="inline-flex items-center justify-center h-5 w-5 rounded-full mx-auto bg-teal-50 border border-teal-200">
                                    <Check size={11} className="text-teal-600" />
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center justify-center h-5 w-5 rounded-full mx-auto bg-slate-50 border border-slate-200">
                                    <span className="text-slate-700 text-xs font-black">—</span>
                                  </div>
                                )
                              ) : (
                                <span className="text-xs font-bold" style={{ color: j === 2 ? '#0d9488' : '#64748b' }}>{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* ── FAQ ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-20 max-w-3xl mx-auto"
            >
              <h3 className="font-display text-2xl font-black !text-slate-900 text-center mb-10">Frequently Asked Questions</h3>
              <div className="space-y-2">
                {[
                  { q: 'How do session credits work?', a: 'Session credits allow you to pay-as-you-go. One credit is used to conduct one full-length live mock interview. Your feedback, transcripts, and history are kept for 90 days. Unused credits never expire.' },
                  { q: 'What is included in unlimited subscriptions?', a: 'Subscribed plans (Weekly, Monthly, Yearly) give you unlimited live mock session attempts, priority audio server access, advanced resume matching, and permanent history archives without any session gating.' },
                  { q: 'What does Unlimited Support mean?', a: 'We do not gate support behind paywalls. Every user — including those on the Free tier — can contact our support team. Subscribed members and credit pack buyers get priority queue response times.' },
                  { q: 'Can I switch between credits and subscriptions?', a: 'Yes! You can purchase session credits at any time if you only need short-term preparation. If you require more practice, you can subscribe to our weekly, monthly, or yearly plans directly from your billing dashboard.' },
                  { q: 'Is there a free trial or free tier?', a: 'Yes. We offer a Free Plan which includes 1 live session per day (up to 10 minutes) with basic AI transcripts and suggestions so you can try out our system.' },
                ].map((faq, i) => (
                  <motion.div
                    key={i}
                    layout
                    className="rounded-2xl border bg-white overflow-hidden cursor-pointer transition-colors duration-200"
                    style={{
                      borderColor: openFaq === i ? '#99f6e4' : '#e2e8f0',
                      boxShadow: openFaq === i ? '0 0 0 3px rgba(13,148,136,0.06)' : 'none',
                    }}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <div className="flex items-center justify-between px-6 py-4 gap-4">
                      <span className="font-bold text-sm !text-slate-900">{faq.q}</span>
                      <motion.div animate={{ rotate: openFaq === i ? 45 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                        <div className="h-6 w-6 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center">
                          <span className="text-slate-500 text-sm font-bold leading-none">+</span>
                        </div>
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                          <div className="px-6 pb-5 text-sm text-slate-500 font-medium leading-relaxed border-t border-slate-100 pt-4">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ── CTA Banner ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-20 relative rounded-3xl overflow-hidden border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-teal-50 p-10 md:p-14 text-center shadow-[0_8px_40px_rgba(13,148,136,0.08)]"
            >
              {/* Ambient glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(13,148,136,0.08)' }} />
              <div className="relative">
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black !text-slate-900 mb-4 leading-tight">
                  Ready to ace your<br />
                  <span style={{ background: 'linear-gradient(135deg, #0d9488, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    next interview?
                  </span>
                </h2>
                <p className="text-slate-500 text-base font-medium mb-8 max-w-lg mx-auto">
                  Join 12,000+ learners who use Sutra AI to prepare smarter and perform flawlessly.
                </p>
                <button
                  onClick={onStart}
                  className="inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-base font-black text-white cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                    boxShadow: '0 8px 24px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  Start Practicing Today <ArrowRight size={18} />
                </button>
                <p className="text-slate-400 text-xs font-semibold mt-4">No credit card required · Cancel anytime</p>
              </div>
            </motion.div>

          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-50 border-t border-slate-200/60 py-16 text-xs text-slate-500">
        <div className="mx-auto w-full max-w-7xl px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 text-left">
          
          {/* Brand info */}
          <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <img
              src={sutraLogoImg}
              alt="Sutra AI"
              width={32}
              height={32}
              style={{ objectFit: 'contain' }}
            />
            <div>
              <span className="font-display font-black text-base !text-slate-900">Sutra AI</span>
              <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">Clarity in every answer</div>
            </div>
          </div>
            <p className="leading-relaxed text-slate-500 font-medium max-w-xs">
              The AI Operating System for Interviews.
            </p>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="font-bold !text-slate-900 uppercase tracking-widest text-[10px] mb-4">Product</h4>
            <ul className="space-y-3 font-semibold">
              <li><a href="#simulator" className="hover:text-teal-600 transition-colors">Live Interview</a></li>
              <li><a href="#features" className="hover:text-teal-600 transition-colors">Mock Interview</a></li>
              <li><a href="#features" className="hover:text-teal-600 transition-colors">Resumes</a></li>
              <li><a href="#features" className="hover:text-teal-600 transition-colors">Knowledge Base</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="font-bold !text-slate-900 uppercase tracking-widest text-[10px] mb-4">Resources</h4>
            <ul className="space-y-3 font-semibold">
              <li><a href="#" className="hover:text-teal-600 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Guides</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Changelog</a></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div>
            <h4 className="font-bold !text-slate-900 uppercase tracking-widest text-[10px] mb-4">Company</h4>
            <ul className="space-y-3 font-semibold">
              <li><a href="#" className="hover:text-teal-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-teal-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        <div className="mx-auto w-full max-w-7xl px-6 border-t border-slate-200/50 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between text-slate-400 font-semibold gap-4">
          <p>© {new Date().getFullYear()} Sutra AI Inc. Secure Google login enabled.</p>
          <div className="flex gap-4">
            <a href="mailto:support@sutra.ai" className="hover:text-slate-600 transition-colors">Support</a>
            <a href="https://github.com" target="_blank" className="hover:text-slate-600 transition-colors">GitHub project</a>

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
    <aside className="hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white py-6 lg:flex flex-col items-start justify-between px-4 relative z-20">
      <div className="flex flex-col items-start w-full gap-8">
        <div
          onClick={() => onNavigate('Dashboard')}
          className="flex items-center gap-3 px-2 hover:opacity-80 transition-all cursor-pointer select-none"
        >
          <img
            src={sutraLogoImg}
            alt="Sutra AI"
            width={44}
            height={44}
            style={{ objectFit: 'contain', flexShrink: 0 }}
          />
          <div>
            <div className="text-xl font-black !text-slate-900 leading-tight">Sutra <span className="text-teal-500">AI</span></div>
            <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">Clarity · Confidence · Performance</div>
          </div>
        </div>

        <nav className="space-y-1.5 w-full">
          {getNav(isAdminUser(keys.userEmail)).map((item) => {
            const Icon = item.icon;
            const selected = item.label === 'Help' ? showHelpChatbot : (active === item.screen && !showHelpChatbot);
            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.label)}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all cursor-pointer border ${selected
                  ? 'bg-teal-50 text-teal-600 border-teal-100/50 shadow-sm'
                  : 'text-slate-600 border-transparent hover:bg-slate-50 hover:!text-slate-900'
                  }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-100 pt-4 w-full relative">
        <div
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-3 px-2 py-2.5 w-full cursor-pointer rounded-xl transition-all hover:bg-slate-50 text-slate-500 hover:!text-slate-900"
        >
          {keys.userPhoto ? (
            <img src={keys.userPhoto} alt="Avatar" className="h-10 w-10 shrink-0 rounded-xl border border-slate-200" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-600 border border-slate-200 uppercase">
              {keys.userName ? keys.userName.substring(0, 2) : 'IC'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold !text-slate-900 truncate">{keys.userName || 'Interview Candidate'}</div>
            <div className="text-[10px] text-slate-400 truncate">{keys.userEmail || 'Free Plan'}</div>
          </div>
        </div>

        {showProfileMenu && (
          <div className="absolute bottom-16 left-0 z-30 w-full glass-card border border-slate-200 p-2 shadow-2xl rounded-2xl animate-fadeIn">
            <button
              onClick={() => {
                setShowProfileMenu(false);
                onNavigate('Billing');
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              💳 Manage Billing
            </button>
            <div className="h-px bg-slate-100 my-1" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-all flex items-center gap-2 font-bold cursor-pointer"
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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#f8fafc]/75 px-5 py-4 backdrop-blur-2xl lg:px-8 relative z-10">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-100/50 px-4 py-2.5 text-slate-500 md:flex focus-within:border-teal-500/40 transition-all">
          <Search size={18} className="text-slate-400" />
          <input className="w-full bg-transparent text-sm outline-none placeholder:!text-slate-400 !text-slate-900 font-medium" placeholder="Search sessions, resumes, knowledge base, prompts..." />
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
          <button className="relative rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
            <Bell size={18} /><span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          </button>
          {keys.userPhoto ? (
            <img src={keys.userPhoto} alt="Avatar" className="h-10 w-10 shrink-0 rounded-xl border border-slate-200" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 border border-slate-200 uppercase">
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

  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

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
      color: 'from-teal-500/20 to-teal-600/5 border-teal-500/25 hover:border-teal-400/50',
      iconColor: 'bg-teal-500/20 text-teal-200',
      badge: 'Core Feature',
      badgeClass: 'bg-teal-500/20 text-teal-700',
      action: onStart,
    },
    {
      title: 'Resume Intelligence',
      desc: 'Upload and activate your resume so the AI answers are fully personalized to your background',
      icon: FileText,
      color: 'from-teal-500/20 to-teal-600/5 border-teal-500/25 hover:border-teal-400/50',
      iconColor: 'bg-teal-500/20 text-teal-200',
      badge: activeResumeName ? '✓ Active' : 'Setup needed',
      badgeClass: activeResumeName ? 'bg-teal-500/20 text-teal-700' : 'bg-amber-500/20 text-amber-300',
      action: () => onNavigate('Resume Intelligence'),
    },
    {
      title: 'Knowledge Base',
      desc: 'Add reference docs, build prompt templates, and write AI notes to inject context into every session',
      icon: Brain,
      color: 'from-teal-500/20 to-teal-600/5 border-teal-500/25 hover:border-teal-400/50',
      iconColor: 'bg-teal-500/20 text-teal-200',
      badge: activeDocsCount > 0 ? `${activeDocsCount} docs active` : 'No docs yet',
      badgeClass: activeDocsCount > 0 ? 'bg-teal-500/20 text-teal-700' : 'bg-amber-500/20 text-amber-300',
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
    <>
      <main className="px-6 py-8 flex-1 overflow-y-auto space-y-6 relative z-10 text-left">
      
      {/* ── Welcome Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
            Interview Workspace
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Configure context profiles, run real-time audio transcripts, and track metrics history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('Resume Intelligence')} className="btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 cursor-pointer">
            <Plus size={14} /> Add Resume
          </button>
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left Side: Main content area (Readiness checklist + Sessions Log) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card A: Readiness & Target Info */}
          <div className="glass rounded-2xl border border-slate-200 p-6 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-teal-600/10 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-[80px]" />
            
            <div className="relative flex flex-wrap md:flex-nowrap gap-6 items-center justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="teal"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />Readiness {readinessScore}%</span></Badge>
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
                      <div key={it.title} onClick={it.action} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-teal-500/20 hover:bg-teal-500/5 transition-all cursor-pointer">
                        <div className={`rounded-lg p-1.5 ${it.ok ? 'bg-teal-500/10 text-teal-600 border border-teal-500/10' : 'bg-slate-50 text-slate-600 border border-transparent'}`}><Icon size={14} /></div>
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
              <div className="shrink-0 flex flex-col items-center justify-center p-4 border border-slate-200 rounded-2xl bg-[#0a0b15]/40 backdrop-blur-md min-w-[130px]">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Readiness</div>
                <div className="relative flex items-center justify-center h-16 w-16 mb-2">
                  <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" className="!text-slate-900" strokeWidth="4" stroke="currentColor" fill="transparent" />
                    <circle cx="32" cy="32" r="28" className="text-teal-500 transition-all duration-700" strokeWidth="4" strokeDasharray="175" strokeDashoffset={175 - (175 * readinessScore) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" />
                  </svg>
                  <span className="text-sm font-extrabold text-white">{readinessScore}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-50 overflow-hidden w-20">
                  <div className="h-full bg-teal-500 transition-all duration-700" style={{ width: `${readinessScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Recent Sessions Logs */}
          <div className="glass rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-700 font-display">Recent Practice Runs</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Logs of your verbal transcripts and AI-generated answer summaries.</p>
              </div>
              <Badge tone="sky">{sessionsList.length} total</Badge>
            </div>

            {sessionsList.length > 0 ? (
              <div className="space-y-2.5">
                {sessionsList.slice(0, 3).map((s) => (
                  <div key={s.id} onClick={() => openDetail(s)} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-500/20 hover:bg-teal-500/5 px-4 py-3.5 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3.5">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                        <PlayCircle size={16} />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white leading-tight group-hover:text-teal-600 transition-colors">{s.title}</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-none">{s.description} · {s.createdAt}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-400 border border-slate-200 uppercase">{s.type}</span>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
                {sessionsList.length > 3 && (
                  <button onClick={() => onNavigate('Recent Sessions')} className="w-full text-center py-2 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                    View all session reports <ArrowRight size={12} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <PlayCircle size={32} className="text-slate-600 mb-2.5" />
                <div className="text-xs font-bold text-slate-400">No sessions recorded yet</div>
                <p className="text-[10px] text-slate-600 font-medium mt-1 text-center max-w-xs leading-normal">
                  Transcripts and AI scoring metrics will appear here once you run a session prep simulation.
                </p>
                <button onClick={onStart} className="mt-4 rounded-lg bg-teal-600/10 border border-teal-500/20 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-teal-700 hover:bg-teal-600/20 transition-all cursor-pointer">
                  Launch Live Assist
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Navigation & Feature panels */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card C: Quick Launch Center */}
          <div className="glass rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Live Assist', desc: 'Realtime answer logic', icon: Mic, tone: 'teal', screen: 'Live Session' as Screen, trigger: onStart },
                { title: 'Mock Voice', desc: 'Pre-defined question trials', icon: UserRound, tone: 'teal', screen: 'Mock Interview' as Screen },
                { title: 'Resumes', desc: 'Custom role matching', icon: FileText, tone: 'teal', screen: 'Resume Intelligence' as Screen },
                { title: 'Knowledge', desc: 'Import custom prompts', icon: Brain, tone: 'teal', screen: 'Knowledge' as Screen },
              ].map((launch) => {
                const Icon = launch.icon;
                const colors: Record<string, string> = {
                  teal: 'bg-teal-50 text-teal-600 border-teal-100 group-hover:bg-teal-100',
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
                    className="flex flex-col items-start justify-between rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-200 hover:shadow-sm p-4 transition-all cursor-pointer group text-left"
                  >
                    <div className={`rounded-lg p-2 border transition-all mb-3 ${colors[launch.tone]}`}><Icon size={16} /></div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-tight">{launch.title}</div>
                      <div className="text-[9px] text-slate-500 font-semibold mt-1 leading-tight">{launch.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Summary Widget */}
          <div className="glass rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="text-[9px] font-bold text-slate-500 uppercase leading-none">Total Runs</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1 leading-none">{sessionsList.length}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="text-[9px] font-bold text-slate-500 uppercase leading-none">Resumes</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1 leading-none">{activeResumeName ? '1' : '0'}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="text-[9px] font-bold text-slate-500 uppercase leading-none">Prompt Docs</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1 leading-none">{activeDocsCount}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl col-span-1">
                <div className="text-[9px] font-bold text-slate-500 uppercase leading-none">Readiness</div>
                <div className="text-sm font-extrabold text-teal-600 mt-1 leading-none">{readinessScore}%</div>
              </div>
            </div>
          </div>

          {/* Suggestions Widget */}
          <div className="glass rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feedback</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Help us improve the platform by leaving your suggestions.</p>
            <button 
              onClick={() => setShowSuggestionModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-50 border border-teal-200 py-2.5 text-xs font-bold text-teal-700 hover:bg-teal-100 hover:text-teal-800 transition-colors cursor-pointer"
            >
              <MessageSquare size={14} /> Leave a Suggestion
            </button>
          </div>

        </div>
      </div>


    </main>
      <SuggestionModal 
        isOpen={showSuggestionModal} 
        onClose={() => setShowSuggestionModal(false)}
        source="Dashboard"
      />
    </>
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
    window.location.href = "sutra://start-session";
    alert("🔗 Trying to open Sutra AI Desktop App...\n\nIf the app doesn't open, make sure you have the Desktop Client installed. You can download the latest bundle from the Releases page.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-100 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] md:p-10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:!text-slate-900 transition-all"
        >
          <X size={20} />
        </button>

        {/* Modal Title */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-500/20 mb-4">
            <MonitorPlay size={28} />
          </div>
          <h2 className="text-2xl font-black !text-slate-900 tracking-tight">Choose Your Experience</h2>
          <p className="mt-2 text-sm text-slate-500">Select how you want to run your interview assist session</p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Desktop App */}
          <div 
            onClick={handleOpenDesktop}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50/80 p-6 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer hover:shadow-lg"
          >
            <div className="absolute top-4 right-4 rounded-full bg-teal-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 tracking-wider">
              Recommended
            </div>
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 group-hover:scale-110 transition-transform">
                <Laptop size={24} />
              </div>
              <h3 className="text-lg font-black !text-slate-900">Desktop Application</h3>
              <p className="mt-2 text-xs text-slate-500 leading-5">
                Captures system audio, tab sound, and microphone feeds directly from your desktop. Bypasses all browser security constraints.
              </p>
            </div>
            <div className="mt-6">
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenDesktop(); }}
                className="w-full rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-3 px-4 shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Open in Desktop</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 2: Web Browser */}
          <div 
            onClick={onContinueWeb}
            className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white hover:bg-slate-50 p-6 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer hover:shadow-lg"
          >
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 group-hover:scale-110 transition-transform">
                <Globe size={24} />
              </div>
              <h3 className="text-lg font-black !text-slate-900">Continue in Web</h3>
              <p className="mt-2 text-xs text-slate-500 leading-5">
                Run the interview helper right here in this browser tab. Relies on manual browser screen/tab sharing controls.
              </p>
            </div>
            <div className="mt-6">
              <button 
                onClick={(e) => { e.stopPropagation(); onContinueWeb(); }}
                className="w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-3 px-4 shadow-sm transition-all"
              >
                Continue in Web
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-[10px] text-center text-slate-500 leading-relaxed mt-6">
          🔒 Running Sutra AI is secure. For the best performance and to capture browser/app sound cards seamlessly, we recommend using the desktop app.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06)]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-base font-black !text-slate-900">Start Live Session</h2>
            <p className="text-[11px] text-slate-500 font-semibold">Configure your session, context, and options.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:!text-slate-900 transition-all"><X size={18} /></button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-5">
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3.5">
            {[1, 2, 3].map(s => {
              const active = step === s;
              const completed = step > s;
              return (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${active ? 'bg-teal-600 text-white ring-4 ring-teal-500/20' :
                      completed ? 'bg-teal-500 text-white' : 'bg-white/5 text-slate-500 border border-slate-200'
                      }`}>
                      {completed ? '✓' : s}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${active ? 'text-teal-600' : completed ? 'text-teal-600' : 'text-slate-600'
                      }`}>
                      {s === 1 ? 'Job Details' : s === 2 ? 'Context' : 'AI Options'}
                    </span>
                  </div>
                  {s < 3 && <div className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${step > s ? 'bg-teal-500' : 'bg-white/5'}`} />}
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
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-all ${selected ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:!text-slate-900'
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs !text-slate-900 outline-none focus:border-teal-500 placeholder:!text-slate-400 transition-all shadow-sm"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs !text-slate-900 outline-none focus:border-teal-500 placeholder:!text-slate-400 transition-all shadow-sm"
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
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs !text-slate-900 outline-none focus:border-teal-500 placeholder:!text-slate-400 transition-all shadow-sm"
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
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                      <FileText size={13} className="text-teal-500" /> Resume
                    </label>
                    <CustomSelect
                      value={c.selectedResumeId}
                      onChange={handleResumeChange}
                      options={resumeOptions}
                      placeholder="-- Select Resume --"
                      icon={FileText}
                      theme="light"
                    />
                    {/* Resume JD Score */}
                    {c.selectedResumeId && (
                      <div className="mt-1">
                        {scoringResume ? (
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <div className="h-3 w-3 animate-spin rounded-full border border-teal-500 border-t-transparent" />
                            Scoring resume vs JD...
                          </div>
                        ) : resumeScore !== null ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-semibold">Resume × JD Match</span>
                              <span className={`font-black ${resumeScore >= 80 ? 'text-teal-600' : resumeScore >= 60 ? 'text-amber-400' : 'text-red-400'
                                }`}>{resumeScore}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100">
                              <div
                                className={`h-1.5 rounded-full transition-all ${resumeScore >= 80 ? 'bg-teal-500' : resumeScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
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
                                className="text-[9px] text-teal-600 hover:text-teal-700 transition-all cursor-pointer mt-1"
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
                              className="text-[9px] text-teal-600 hover:text-teal-700 underline cursor-pointer mt-1 block"
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
                            className="text-[10px] text-teal-600 hover:text-teal-700 underline cursor-pointer"
                          >Score resume vs JD</button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add Button & Popover */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3 flex flex-col justify-center items-center min-h-[96px]">
                    <label className="text-[11px] font-bold text-slate-500">Additional Context</label>
                    <div className="relative inline-block w-full text-center">
                      <button
                        type="button"
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-teal-300 hover:bg-teal-50 transition-all select-none cursor-pointer"
                      >
                        <Plus size={14} className="text-teal-500" /> Add Context Source
                      </button>

                      {showAddMenu && (
                        <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl space-y-0.5 animate-fadeIn">
                          <button
                            type="button"
                            onClick={() => { setShowAddMenu(false); setOpenDocModal(true); }}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <Brain size={12} className="text-cyan-400" /> Reference Doc
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddMenu(false); setOpenPromptModal(true); }}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <NotebookPen size={12} className="text-amber-500" /> Custom System Prompt
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddMenu(false); setOpenSessionModal(true); }}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <PlayCircle size={12} className="text-teal-500" /> Previous Session
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
                  <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 animate-fadeIn">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1">Active Context Sources</p>

                    {c.selectedDocId && (() => {
                      const docItem = docs.find(d => d.id === c.selectedDocId);
                      return (
                        <div className="flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50/50 px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 text-cyan-700">
                            <Brain size={13} />
                            <span className="font-semibold truncate max-w-[200px]">{docItem?.name || "Selected Reference Doc"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setOpenDocModal(true)} className="text-[10px] text-cyan-600 hover:underline cursor-pointer">Edit</button>
                            <button type="button" onClick={() => setC(prev => ({ ...prev, selectedDocId: '' }))} className="text-slate-400 hover:text-red-500 cursor-pointer"><X size={12} /></button>
                          </div>
                        </div>
                      );
                    })()}

                    {c.selectedPromptId && (() => {
                      const promptItem = prompts.find(p => p.id === c.selectedPromptId);
                      return (
                        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 text-amber-700">
                            <NotebookPen size={13} />
                            <span className="font-semibold truncate max-w-[200px]">{promptItem?.title || "Custom Prompt"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setOpenPromptModal(true)} className="text-[10px] text-amber-600 hover:underline cursor-pointer">Edit</button>
                            <button type="button" onClick={() => setC(prev => ({ ...prev, selectedPromptId: '' }))} className="text-slate-400 hover:text-red-500 cursor-pointer"><X size={12} /></button>
                          </div>
                        </div>
                      );
                    })()}

                    {c.selectedSessionId && (() => {
                      const sessionItem = sessions.find(s => s.id === c.selectedSessionId);
                      return (
                        <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50/50 px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 text-teal-700">
                            <PlayCircle size={13} />
                            <span className="font-semibold truncate max-w-[200px]">{sessionItem?.title || `${sessionItem?.type || "Past"} Session`}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setOpenSessionModal(true)} className="text-[10px] text-teal-600 hover:underline cursor-pointer">Edit</button>
                            <button type="button" onClick={() => setC(prev => ({ ...prev, selectedSessionId: '' }))} className="text-slate-400 hover:text-red-500 cursor-pointer"><X size={12} /></button>
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
                  theme="light"
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Session Options</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${autoAnswer ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-slate-50'
                    }`}>
                    <div>
                      <div className="text-xs font-bold !text-slate-900">Auto Answer</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">AI answers automatically when question detected</div>
                    </div>
                    <div
                      onClick={() => setAutoAnswer(!autoAnswer)}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${autoAnswer ? 'bg-teal-600' : 'bg-slate-700'
                        }`}
                    >
                      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${autoAnswer ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                    </div>
                  </label>

                  <label className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${saveTranscript ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-slate-50'
                    }`}>
                    <div>
                      <div className="text-xs font-bold !text-slate-900">Save Transcript</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Store full Q&A transcript after session ends</div>
                    </div>
                    <div
                      onClick={() => setSaveTranscript(!saveTranscript)}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${saveTranscript ? 'bg-teal-600' : 'bg-slate-700'
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
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-100 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold !text-slate-900 flex items-center gap-1.5">
                <Brain size={15} className="text-cyan-600" /> Select Reference Document
              </h3>
              <button type="button" onClick={() => setOpenDocModal(false)} className="text-slate-500 hover:!text-slate-900 cursor-pointer"><X size={16} /></button>
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
              <p className="text-[10px] text-slate-500 font-semibold">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-100 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold !text-slate-900 flex items-center gap-1.5">
                <NotebookPen size={15} className="text-amber-600" /> Custom System Prompt
              </h3>
              <button type="button" onClick={() => setOpenPromptModal(false)} className="text-slate-500 hover:!text-slate-900 cursor-pointer"><X size={16} /></button>
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
              <p className="text-[10px] text-slate-500 font-semibold">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-100 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold !text-slate-900 flex items-center gap-1.5">
                <PlayCircle size={15} className="text-teal-600" /> Select Previous Session
              </h3>
              <button type="button" onClick={() => setOpenSessionModal(false)} className="text-slate-500 hover:!text-slate-900 cursor-pointer"><X size={16} /></button>
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
          <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
            <th className="pb-3 pr-4">Title</th>
            <th className="pb-3 pr-4">Description</th>
            <th className="pb-3 pr-4">Mode</th>
            <th className="pb-3 pr-4">Duration</th>
            <th className="pb-3 pr-4">AI Usage</th>
            <th className="pb-3 pr-4">Created At</th>
            <th className="pb-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {sessionsList.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">No recent sessions found.</td>
            </tr>
          ) : (
            sessionsList.map(s => {
              const ModeIcon = getIconForType(s.type);
              const isEditing = editingId === s.id;
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3.5 pr-4 font-bold text-slate-900 max-w-[120px] truncate">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2 py-1 outline-none text-slate-900 focus:border-teal-500"
                      />
                    ) : s.title}
                  </td>
                  <td className="py-3.5 pr-4 text-xs text-slate-500 max-w-[160px] truncate" title={s.description}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2 py-1 outline-none text-slate-900 focus:border-teal-500"
                      />
                    ) : s.description}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-xl font-medium border border-slate-200">
                      <ModeIcon size={10} className="text-teal-600" />
                      {s.type}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-xs">
                    <Badge tone="teal">{s.duration || s.endsIn || '0:00'}</Badge>
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
                          className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white border border-teal-100 transition-all"
                          title="Save changes"
                        >
                          <CheckCircle2 size={13} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-white border border-slate-200 transition-all"
                          title="Cancel editing"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openDetail(s)}
                          className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white border border-teal-100 transition-all"
                          title="View details & transcript"
                        >
                          <Library size={13} />
                        </button>
                        <button
                          onClick={() => startEdit(s)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-white border border-slate-200 transition-all"
                          title="Edit details"
                        >
                          <NotebookPen size={13} />
                        </button>
                        <button
                          onClick={() => deleteSession(s.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 transition-all"
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
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

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
      <div className="flex-1 min-h-0 flex overflow-hidden bg-[#0e1015] text-slate-100 animate-fadeIn" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
        {/* Left Panel: Webcam + Mic */}
        <div className="flex flex-col border-r border-slate-800/50 bg-[#0e1015]" style={{ width: '42%', minWidth: '300px' }}>
          {/* Webcam player */}
          <div className="shrink-0 relative bg-[#8f8f8f] aspect-video flex flex-col items-center justify-center overflow-hidden border-b border-[#0e1015]">
            <video
              ref={videoRef}
              className="w-full h-full object-cover bg-[#8f8f8f]"
              muted
              playsInline
              autoPlay
            />
            {/* Live Indicator overlay */}
            <div className="absolute top-3 left-3 bg-rose-500/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> REC
            </div>
            {!webcamStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#9e9e9e]">
                <SettingsIcon size={140} className="text-[#c1c1c1]" />
              </div>
            )}
          </div>

          {/* Left Panel Header / Mic control */}
          <div className="flex flex-col flex-1 bg-slate-50 p-4 relative border-r border-slate-200">
            <div className="flex items-center gap-3">
              <button
                onClick={mic.active ? mic.stop : startMic}
                className={`flex items-center gap-2 rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold transition-all ${mic.active
                  ? 'bg-teal-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.35)]'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
              >
                {mic.active ? <MicOff size={14} /> : <Mic size={14} />}
                {mic.active ? 'Mic Off' : 'Mic On'}
              </button>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {mic.statusMsg}
              </span>
            </div>

            {/* Transcription progress box */}
            <div className="mt-auto border border-slate-200 bg-white rounded-xl p-4 shadow-sm">
              <div className="text-[10px] font-bold text-teal-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                LIVE SPEECH TRANSCRIPTION
              </div>
              <p className="text-xs text-slate-600 leading-5 italic">
                {mic.active
                  ? (userAnswer ? "Listening to mic... Answer text area on the right will update in real-time." : "Start speaking. Your words will appear in the answer box on the right.")
                  : "Microphone is muted. Turn it on to answer by speaking, or type directly into the text box."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: AI Question, Answer Input, Feedback */}
        <div className="flex flex-col flex-1 min-w-0 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0 bg-white">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  {interviewType}
                </span>
                <h1 className="text-lg font-black text-slate-900">{company} Mock Session</h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">{role}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 shadow-sm">
                <Timer size={14} className="text-slate-400" />
                <span className="font-semibold">{formatTime(sessionTime)}</span>
              </div>
              <button
                onClick={() => setShowSuggestionModal(true)}
                className="rounded-md bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-bold text-white transition-all shadow-sm"
              >
                End & Save
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-white">
            {/* Question card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600 rounded-l-xl" />
              <div className="flex items-center justify-between mb-3 ml-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
                  Question {sessionQuestions.length + 1}
                </span>
                <span className="text-[11px] font-medium text-slate-500">Active</span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-900 ml-2">{currentQuestion}</p>
            </div>

            {/* Answer textarea */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500">Your Response</label>
              <textarea
                value={userAnswer}
                onChange={handleUserAnswerChange}
                rows={5}
                placeholder="Type your response here or speak into the mic..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-900 outline-none focus:border-teal-500 placeholder:text-slate-400 transition-all shadow-sm"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={generateFeedback}
                  disabled={isGenerating || !userAnswer.trim()}
                  className="rounded-lg bg-teal-600 hover:bg-teal-500 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-sm"
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
                      <Send size={13} />
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Feedback output for previous answer */}
            {(feedback || suggestedAnswer) && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4">
                  <div className="text-[10px] font-black uppercase tracking-wide text-teal-600">AI Feedback (Last Question)</div>
                  <p className="mt-2.5 whitespace-pre-wrap text-xs leading-6 text-slate-700">{feedback}</p>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
                  <div className="text-[10px] font-black uppercase tracking-wide text-sky-600">Suggested Response</div>
                  <p className="mt-2.5 whitespace-pre-wrap text-xs leading-6 text-slate-700">{suggestedAnswer}</p>
                </div>
              </div>
            )}

            {/* Session QA History Log */}
            {sessionQuestions.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-500">Session Transcript ({sessionQuestions.length})</h3>
                <div className="space-y-3">
                  {sessionQuestions.slice().reverse().map((qa, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                      <div className="font-bold text-teal-600">Q: {qa.question}</div>
                      <div className="text-slate-700 pl-2 border-l border-slate-200">A: {qa.answer}</div>
                      <details className="mt-2 group">
                        <summary className="text-[10px] text-slate-500 font-bold cursor-pointer hover:text-slate-700 select-none outline-none">
                          View Feedback & Suggestion
                        </summary>
                        <div className="mt-2 grid gap-3 md:grid-cols-2 pt-2 border-t border-slate-100">
                          <div className="bg-teal-50 p-3 rounded-xl text-[11px] leading-5 text-slate-700 border border-teal-100">
                            <span className="font-bold text-teal-600 block mb-1">Feedback</span>
                            {qa.feedback}
                          </div>
                          <div className="bg-sky-50 p-3 rounded-xl text-[11px] leading-5 text-slate-700 border border-sky-100">
                            <span className="font-bold text-sky-600 block mb-1">Suggested</span>
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
          className="rounded-xl bg-teal-600 hover:bg-teal-500 px-4 py-2.5 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-glow"
        >
          <Plus size={14} />
          Start Interview
        </button>
      </div>

      {/* ── Setup Form Overlay Modal ── */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-teal-100/50 blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-black !text-slate-900">Setup Mock Interview</h2>
              <button
                onClick={() => setShowSetup(false)}
                className="rounded-full p-1.5 hover:bg-slate-100 text-slate-500 hover:!text-slate-900 transition-all"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs !text-slate-900 outline-none focus:border-teal-500 transition-all placeholder:!text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Target Role</label>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs !text-slate-900 outline-none focus:border-teal-500 transition-all placeholder:!text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Interview Type</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs !text-slate-900 outline-none focus:border-teal-500 cursor-pointer transition-all"
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
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs !text-slate-900 outline-none focus:border-teal-500 transition-all placeholder:!text-slate-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowSetup(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={startMockInterview}
                className="flex-1 rounded-xl bg-teal-600 py-3 text-xs font-black text-white hover:bg-teal-500 shadow-md transition-all"
              >
                Start Mock Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mock History Dashboard ── */}
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-slate-200 bg-slate-50 rounded-[2rem] p-8 max-w-xl mx-auto">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 border border-teal-500/20 shadow-glow">
            <UserRound size={28} />
          </div>
          <h2 className="text-lg font-black text-white">No Mock Interviews Yet</h2>
          <p className="mt-2.5 text-xs text-slate-400 max-w-sm leading-relaxed">
            Practice for your interviews using our interactive AI. Set your role, company, and JD, and practice responding in real-time.
          </p>
          <button
            onClick={() => setShowSetup(true)}
            className="mt-6 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition-all shadow-glow"
          >
            Start Your First Mock Interview
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 hover:border-teal-500/30 transition-all flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-teal-600/5 blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge tone="teal">{s.type}</Badge>
                  <span className="text-[10px] text-slate-500 font-semibold">{s.date}</span>
                </div>

                <h3 className="text-sm font-black text-white truncate">{s.role}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">{s.company}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[10px] text-slate-500 font-bold uppercase shrink-0">
                  <div className="rounded-xl bg-slate-50 p-2 border border-slate-200">
                    <span className="text-slate-700 text-xs block mb-0.5">{s.history?.length || 0}</span>
                    Questions
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2 border border-slate-200">
                    <span className="text-slate-700 text-xs block mb-0.5">{s.duration || '0m'}</span>
                    Duration
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-5 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setViewingSession(s)}
                  className="flex-1 rounded-xl bg-slate-50 hover:bg-slate-50 border border-slate-200 py-2 text-xs font-bold text-slate-200 hover:text-white transition-all text-center"
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
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
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                      <div className="font-bold text-teal-600">Q{idx + 1}: {qa.question}</div>
                      <div className="text-slate-700 pl-2 border-l border-slate-200">A: {qa.answer}</div>

                      <div className="grid gap-3 md:grid-cols-2 pt-2 mt-2 border-t border-slate-200">
                        <div className="bg-teal-500/5 p-3 rounded-xl leading-5 text-slate-700">
                          <span className="font-bold text-teal-600 block mb-1">AI Feedback</span>
                          {qa.feedback}
                        </div>
                        <div className="bg-sky-500/5 p-3 rounded-xl leading-5 text-slate-700">
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

            <div className="mt-6 border-t border-slate-200 pt-4 flex justify-end shrink-0">
              <button
                onClick={() => setViewingSession(null)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-white transition-all"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
      <SuggestionModal 
        isOpen={showSuggestionModal} 
        onClose={() => setShowSuggestionModal(false)}
        source="Mock Interview"
        onComplete={endAndSaveSession}
      />
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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  return (
    <Page title="Recent Sessions" subtitle="View details, edit info, delete, or review transcripts of your past live sessions.">
      <Card className="w-full">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Recent Live Sessions</h2>
            <Badge tone="teal">{sessionsList.length} total</Badge>
          </div>
          <button 
            onClick={() => setShowFeedbackModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
          >
            <MessageSquare size={14} /> Leave Feedback
          </button>
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
      <SuggestionModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        source="Recent Sessions"
      />
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
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

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
    setShowSuggestionModal(true);
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
    <div className="flex-1 min-h-0 flex overflow-hidden bg-white text-slate-900 animate-fadeIn" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>

      {/* ── Screen share / system audio authorization request modal ── */}
      {!sysAudio.stream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl text-center relative overflow-hidden">
            {/* Visual background glow */}
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-glow">
              <ScreenShare size={30} />
            </div>

            <h3 className="text-xl font-black text-slate-900">Share Tab or Window to Connect</h3>
            <p className="mt-2.5 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              To capture the interviewer's audio and process live questions, Sutra AI requires capturing a browser tab or an application window. Sharing the entire screen is not supported.
            </p>

            {/* Instruction Steps */}
            <div className="my-6 text-left bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5">
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-black text-teal-600">1</span>
                <p className="text-xs text-slate-700 leading-normal">
                  Click the <strong>Accept &amp; Connect</strong> button below.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-black text-teal-600">2</span>
                <p className="text-xs text-slate-700 leading-normal">
                  In the browser picker, switch to the <strong>Chrome Tab</strong>/<strong>Edge Tab</strong> or <strong>Window</strong> panel.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-black text-teal-600">3</span>
                <p className="text-xs text-slate-700 leading-normal">
                  Select the tab or window where your video call is running (Google Meet, Teams, etc.).
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-black text-rose-600">!</span>
                <p className="text-xs text-slate-700 leading-normal">
                  <strong>CRITICAL:</strong> If sharing a browser tab, you must check the <strong>Share tab audio</strong> (or "Share audio") box at the bottom-left of the picker window.
                </p>
              </div>
            </div>

            {/* Error / Loading Feedback */}
            {sysAudio.status === 'requesting' && (
              <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-xs text-teal-600">
                <svg className="animate-spin h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="none">
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
                  <p className="mt-0.5 text-slate-700 leading-normal">{sysAudio.statusMsg}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExitClick}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-white transition-all"
              >
                Exit Session
              </button>
              <button
                onClick={startSystemAudio}
                disabled={sysAudio.status === 'requesting'}
                className="flex-1 rounded-xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-500 shadow-glow disabled:opacity-50 transition-all"
              >
                Accept &amp; Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEFT PANEL: Live Captions ── */}
      <div className="flex flex-col border-r border-slate-200 bg-slate-50" style={{ width: '42%', minWidth: '300px' }}>
        {sysAudio.stream && (
          <div className="shrink-0 border-b border-slate-200 bg-black relative group/preview aspect-video overflow-hidden flex flex-col">
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
          <div className="shrink-0 border-b border-slate-200 bg-slate-50 p-5 flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <ScreenShare size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Connect Interview Audio & Screen</p>
              <p className="mt-1 text-[11px] text-slate-500 max-w-xs leading-normal">
                Share a Chrome Tab with the audio checkbox checked to stream the interviewer's voice and capture live screenshots.
              </p>
            </div>
            <button
              onClick={startSystemAudio}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-500 transition-all shadow-glow"
            >
              <ScreenShare size={12} />
              Share Screen & Audio
            </button>
          </div>
        )}

        {/* Left Header */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3 shrink-0">
          <button
            onClick={() => { setTr([]); setAiQuestion(''); stream.start(''); }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-all"
          >
            <X size={14} />
            Clear
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={mic.active ? mic.stop : startMic}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${mic.active
                ? 'bg-teal-600 text-white border-teal-600 shadow-[0_0_15px_rgba(124,58,237,0.35)]'
                : 'bg-white text-slate-700 border-slate-200 hover:border-teal-500 hover:text-teal-600 hover:bg-slate-50'
                }`}
            >
              <MonitorSpeaker size={13} />
              {mic.active ? 'Mic On' : 'Mic'}
            </button>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none cursor-pointer hover:border-slate-300"
            >
              {['English', 'Hindi', 'Telugu', 'Spanish', 'French'].map(l => (
                <option key={l} className="bg-white text-slate-900">{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transcript Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-50 space-y-3">
          {tr.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 animate-fadeIn">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 shadow-sm relative">
                <div className="absolute inset-0 rounded-2xl border border-teal-200 animate-ping opacity-60" />
                <Mic size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Waiting for interviewer audio...</p>
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
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-md bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-teal-500 transition-all"
                      >
                        <Sparkles size={8} /> Ask AI
                      </button>
                    )}
                  </div>
                  <p className={`text-sm leading-6 rounded-xl px-3 py-2 border ${t.speaker === 'Interviewer'
                    ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
                    : 'bg-teal-50 border-teal-100 text-teal-900'
                    } ${!t.isFinal ? 'italic text-slate-500 border-teal-200 bg-teal-50/50' : ''}`}>
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
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-40 transition-all"
            >
              <Sparkles size={11} /> Ask AI
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: AI Answer ── */}
      <div className="flex flex-col flex-1 min-w-0 bg-white">

        {/* Right Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src={sutraLogoImg}
              alt="Sutra AI"
              width={36}
              height={36}
              style={{ objectFit: 'contain' }}
            />
            <span className="text-base font-black text-slate-900">Sutra AI</span>
          </div>

          {/* Active Context Badges */}
          <div className="hidden lg:flex items-center gap-2 text-[10px]">
            {activeResumeName && (
              <span className="inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-100 px-2 py-0.5 text-teal-600 font-bold max-w-[150px] truncate" title={activeResumeName}>
                <FileText size={10} /> {activeResumeName}
              </span>
            )}
            {activeDocName && (
              <span className="inline-flex items-center gap-1 rounded bg-cyan-50 border border-cyan-100 px-2 py-0.5 text-cyan-600 font-bold max-w-[150px] truncate" title={activeDocName}>
                <Brain size={10} /> {activeDocName}
              </span>
            )}
            {activePromptTitle && (
              <span className="inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-100 px-2 py-0.5 text-teal-600 font-bold max-w-[150px] truncate" title={activePromptTitle}>
                <Sparkles size={10} /> {activePromptTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
              <Timer size={13} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-600">{formatTime(sessionTime)}</span>
              <span className="text-xs font-bold bg-teal-50 border border-teal-100 text-teal-600 px-1.5 py-0.5 rounded ml-1">Pro</span>
            </div>
            {qaHistory.length > 0 && (
              <button
                onClick={() => {
                  if (!window.confirm('Are you sure you want to clear the live Q&A history?')) return;
                  setQaHistory([]);
                }}
                className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                title="Clear Q&A"
              >
                <X size={12} /> Clear Q&A
              </button>
            )}
            <button
              onClick={captureAndAnalyze}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
              title="Take screenshot"
            >
              <Camera size={13} />
            </button>
            <button
              onClick={handleExitClick}
              className="rounded-lg bg-rose-500 px-4 py-1.5 text-sm font-bold text-white hover:bg-rose-600 transition-all shadow-sm"
            >
              Exit
            </button>
          </div>
        </div>

        {/* AI Chat Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-white">
          {qaHistory.length === 0 && !stream.text ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center">
                <img src={sutraLogoImg} alt="Sutra AI" width={60} height={60} style={{ objectFit: 'contain' }} />
              </div>
              <p className="text-sm font-semibold text-slate-700">No messages yet.</p>
              <p className="text-xs text-slate-500 mt-1">Click "Answer" to start!</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto">
              {qaHistory.map((qa, i) => (
                <div key={i} className="space-y-3">
                  <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        Question #{i + 1}
                      </span>
                      {qa.responseTime && (
                        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                          TTFT: {qa.responseTime}s
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium leading-6 text-slate-900 pl-1.5">{qa.question}</p>
                  </div>
                  <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-100 px-2.5 py-0.5 rounded border border-teal-200">
                        AI Answer
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(qa.answer)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
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
                  <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-600" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        Current Question
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-6 text-slate-900 pl-1.5">{aiQuestion || latestQuestion}</p>
                  </div>
                  <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-100 px-2.5 py-0.5 rounded border border-teal-200">
                          AI Answer
                        </span>
                        <span className="text-[10px] font-bold text-cyan-600 bg-cyan-100 px-2.5 py-0.5 rounded border border-cyan-200 animate-pulse">
                          Generating
                        </span>
                      </div>
                    </div>
                    <div className="pl-1">
                      <FormattedAnswer text={stream.text} />
                      <span className="animate-pulse text-teal-600 ml-1 text-sm">▍</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={answerEndRef} />
            </div>
          )}
        </div>

        {/* Bottom: Manual input + Screenshot + Answer button */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <input
              value={manualMessage}
              onChange={e => setManualMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnswerClick(); } }}
              placeholder="Type a manual message..."
              className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:bg-white transition-all shadow-sm"
            />
            <button
              onClick={captureAndAnalyze}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0 shadow-sm"
            >
              <Camera size={16} />
              <span className="text-xs">Screenshot</span>
            </button>
          </div>

          <div className="px-4 py-3">
            <button
              onClick={handleAnswerClick}
              disabled={stream.busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 text-sm font-bold text-white hover:bg-teal-500 shadow-glow disabled:opacity-50 transition-all"
            >
              <Sparkles size={16} className="text-teal-600" />
              {stream.busy ? 'Generating Answer...' : 'Answer'}
            </button>
          </div>
        </div>
      </div>

      {shutterFlash && <div className="fixed inset-0 bg-white z-[9999] pointer-events-none" />}
      <SuggestionModal 
        isOpen={showSuggestionModal} 
        onClose={() => setShowSuggestionModal(false)}
        source="Live Session"
        onComplete={() => onFinish(qaHistory)}
      />
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
              ? 'border-teal-500 bg-teal-500/10 scale-[0.99]'
              : 'border-slate-200 bg-slate-50 hover:border-teal-400/30 hover:bg-teal-500/5'
              } text-center relative`}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload size={36} className={`mb-3 ${dragging ? 'text-teal-600 animate-bounce' : 'text-slate-500'}`} />
            <h3 className="text-base font-black text-slate-900">Drag & Drop Resumes Here</h3>
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
                      ? 'border-teal-500/30 bg-teal-500/5'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${r.active ? 'bg-teal-500/10 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
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
                          ? 'bg-teal-600/20 text-teal-700 border border-teal-500/40 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                          : 'bg-slate-100 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
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
                <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3 mb-4">
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
                          ? 'bg-teal-600/20 text-teal-700 border border-teal-500/30'
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
                      className="text-[10px] text-teal-600 hover:text-teal-700 font-bold bg-white/5 px-2 py-0.5 rounded transition-all cursor-pointer"
                    >
                      Copy Content
                    </button>
                  </div>
                  <div className="h-[320px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
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
      ].map(([name, focus, level, notes]) => <Card key={name}><h2 className="text-2xl font-black">{name}</h2><p className="mt-3 text-sm text-slate-400">{focus}</p><div className="mt-5 flex gap-2"><Badge tone={level === 'Hard' ? 'amber' : 'sky'}>{level}</Badge><Badge>Likely Questions</Badge></div><p className="mt-5 text-sm leading-6 text-slate-700">{notes}</p></Card>)}
    </div>
  </Page>;
}

function ScreenshotLab() {
  return <Page title="Screenshot Lab" subtitle="Upload interview screenshots and extract questions, code, SQL, or diagrams.">
    <section className="grid gap-6 xl:grid-cols-2">
      <Card><div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-teal-400/30 bg-teal-500/8 text-center"><ImageIcon size={48} className="text-teal-700" /><h2 className="mt-5 text-xl font-black">Drop Screenshot Here</h2><p className="mt-2 max-w-sm text-sm text-slate-400">Supports coding platforms, system design diagrams, SQL tables, and browser interview prompts.</p><Button className="mt-5">Upload Screenshot</Button></div></Card>
      <Card><h2 className="text-xl font-black">Detected Output Preview</h2><div className="mt-5 space-y-4"><Output k="Question Type" v="System Design" /><Output k="Detected Question" v="Design a realtime notification service." /><Output k="Difficulty" v="Senior" /><div className="rounded-3xl bg-white p-5 text-sm leading-7 text-slate-700">Recommended answer will appear here after image processing.</div></div></Card>
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
      <div className="flex border-b border-slate-200 mb-6 max-w-xl shrink-0">
        <button
          onClick={() => setTab('docs')}
          className={`flex-1 py-3 text-sm font-black transition-all flex items-center justify-center gap-2 ${tab === 'docs'
            ? 'border-b-2 border-teal-500 text-teal-700 bg-teal-500/5'
            : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <FileText size={16} /> Reference Docs
        </button>
        <button
          onClick={() => setTab('prompts')}
          className={`flex-1 py-3 text-sm font-black transition-all flex items-center justify-center gap-2 ${tab === 'prompts'
            ? 'border-b-2 border-teal-500 text-teal-700 bg-teal-500/5'
            : 'text-slate-500 hover:text-slate-700'
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
                ? 'border-teal-500 bg-teal-500/10 scale-[0.99]'
                : 'border-slate-200 bg-slate-50 hover:border-teal-400/30 hover:bg-teal-500/5'
                } text-center relative`}
            >
              <input
                type="file"
                multiple
                onChange={handleDocFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload size={36} className={`mb-3 ${docDragging ? 'text-teal-600 animate-bounce' : 'text-slate-500'}`} />
              <h3 className="text-base font-black text-slate-900">Drag & Drop Documents Here</h3>
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
                          ? 'border-teal-500 bg-teal-500/10'
                          : d.active
                            ? 'border-teal-500/30 bg-teal-500/5'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${d.active ? 'bg-teal-500/15 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-slate-900 truncate max-w-[240px]" title={d.name}>{d.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{d.size} • Uploaded {d.uploadDate}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={d.active}
                            onChange={() => toggleDocActive(d.id)}
                            className="h-4 w-4 accent-teal-600 rounded cursor-pointer"
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
                      <div className="h-32 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 text-[11px] font-mono text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {previewDoc.content || 'No text content available.'}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <p className="text-xs text-slate-400 leading-5 mb-5">Active documents are parsed and converted into semantic vector embeddings. During live sessions, relevant snippets are injected directly into the prompt.</p>
              <div className="rounded-3xl border border-teal-400/15 bg-teal-500/8 p-5 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-sm">Embedding Status</span>
                  <Badge tone="teal">Synced</Badge>
                </div>
                <div className="text-xs text-slate-400">All active document vectors are built and fully available.</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Active Reference Docs</span>
                  <span className="font-bold text-slate-900">{docs.filter(d => d.active).length} files</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Index Size</span>
                  <span className="font-bold text-white">
                    {(docs.reduce((acc, d) => acc + ((d.name || '').endsWith('.pdf') ? 1000 : 25), 0) / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">LLM Context Utilization</span>
                  <Badge tone="teal">Optimal (4.2k tokens)</Badge>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-5 border-t border-slate-200 text-xs text-slate-500 leading-5">
              💡 <strong className="text-slate-700">Tip:</strong> Activating more documents increases the variety of matching context, but keep it targeted to the specific job description for maximum answer relevancy.
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
                  ? 'border-teal-500 bg-teal-500/10 scale-[0.99]'
                  : 'border-slate-200 bg-slate-50 hover:border-teal-400/30 hover:bg-teal-500/5'
                  } text-center p-4 relative`}
              >
                <input
                  type="file"
                  multiple
                  accept=".txt,.md"
                  onChange={handlePromptFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload size={32} className={`mb-3 ${promptDragging ? 'text-teal-600 animate-bounce' : 'text-slate-500'}`} />
                <h3 className="text-sm font-black text-slate-900">Drag & Drop Prompt Files</h3>
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
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-teal-500/50 text-white placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Write template instructions here..."
                      rows={4}
                      value={promptContentInput}
                      onChange={e => setPromptContentInput(e.target.value)}
                      className="w-full text-xs resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-teal-500/50 text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>
                <button
                  onClick={addPromptManually}
                  disabled={!promptTitleInput.trim() || !promptContentInput.trim()}
                  className="mt-3 w-full rounded-xl bg-teal-600 py-2.5 text-xs font-black hover:bg-teal-500 disabled:opacity-40 transition-all text-white"
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
                        ? 'border-teal-500/30 bg-teal-500/5'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${p.active ? 'bg-teal-500/15 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                            <Library size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{p.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Added {p.uploadDate}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={p.active}
                              onChange={() => togglePromptActive(p.id)}
                              className="h-4 w-4 accent-teal-600 rounded cursor-pointer"
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
                      <p className="mt-3 text-xs leading-5 text-slate-400 bg-slate-100 rounded-xl p-3 border border-slate-200 whitespace-pre-wrap">{p.content}</p>
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
              <div className="rounded-3xl border border-teal-400/15 bg-teal-500/8 p-5 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-sm">Active Templates</span>
                  <span className="font-bold text-teal-700">{prompts.filter(p => p.active).length} Injected</span>
                </div>
                <div className="text-xs text-slate-400">These will combine in the system instruction buffer during live streaming.</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Response Tone Preference</span>
                  <Badge tone="teal">Structured & Analytical</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Total Tokens Consumed</span>
                  <span className="font-bold text-white">~{calculatedTokens} tokens</span>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-5 border-t border-slate-200 text-xs text-slate-500 leading-5">
              💡 <strong className="text-slate-700">Prompt Style:</strong> Keep system prompts short and imperative (e.g. "Do not output intro commentary", "Use markdown tables for metrics").
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
          ['Overall Score', '88%', 'High confidence (+3% vs last week)', 'teal'],
          ['Sessions Practiced', '14 rounds', '5 system design, 9 coding', 'teal'],
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
            <div className={`absolute -right-6 -bottom-6 h-20 w-20 rounded-full opacity-10 blur-xl ${tone === 'teal' ? 'bg-teal-500' :
              tone === 'teal' ? 'bg-teal-500' :
                tone === 'sky' ? 'bg-sky-500' : 'bg-amber-500'
              }`} />
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Score Progression (Last 6 Sessions)</h3>
            <Badge tone="teal">Interactive Engaged</Badge>
          </div>

          <div className="relative w-full h-60 bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-center">
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
            <h3 className="text-lg font-black text-slate-900 mb-4">Competency Breakdown</h3>

            <div className="relative w-full h-44 bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-center">
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
            Your strongest dimension is <strong className="text-slate-700">System Design</strong>, while <strong className="text-slate-700">Database & SQL</strong> has the largest room for gain.
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="border-l-4 border-teal-500">
          <h4 className="text-sm font-black text-teal-700 uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Strong Areas
          </h4>
          <ul className="mt-3 space-y-2.5 text-xs text-slate-700 leading-5">
            <li>• <strong className="text-slate-900">Kafka Queueing:</strong> Perfect details on retention settings and dead-letter pipelines.</li>
            <li>• <strong className="text-white">In-memory caching:</strong> Correct callouts on write-through strategies vs cache-aside.</li>
            <li>• <strong className="text-white">STAR Metric quantification:</strong> Increased score by 18% by framing impact in latency reductions.</li>
          </ul>
        </Card>

        <Card className="border-l-4 border-amber-500">
          <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
            <Target size={14} /> Action Items to Improve
          </h4>
          <ul className="mt-3 space-y-2.5 text-xs text-slate-700 leading-5">
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
      <Card><h2 className="text-xl font-black">Timeline</h2>{['Question 1', 'Question 2', 'Question 3', 'Question 4'].map((x, i) => <div key={x} className="mt-4 rounded-2xl bg-slate-50 p-4"><div className="font-bold">{x}</div><div className="text-xs text-slate-500">00:{(i + 1) * 8}</div></div>)}</Card>
      <Card><h2 className="text-xl font-black">Replay Detail</h2><p className="mt-4 leading-7 text-slate-700">Question: How would you design a scalable URL shortener?</p><div className="mt-5 rounded-3xl bg-white p-5 text-sm leading-7 text-slate-700">Feedback: Strong high-level structure. Improve by adding capacity estimation and failure handling.</div></Card>
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

function SuggestionsPage() {
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  return (
    <Page title="Suggestions & Feedback" subtitle="Your feedback helps shape Sutra AI. Let us know how we can improve.">
      <div className="pt-6 max-w-3xl animate-fadeIn space-y-6">
        <div className="glass rounded-2xl border border-slate-200 p-8 space-y-4 bg-white/50">
           <h2 className="text-xl font-bold text-slate-900">Have an idea or spotted a bug?</h2>
           <p className="text-sm text-slate-500 mb-6">Open the feedback form to submit your suggestions directly to the team.</p>
           <button 
             onClick={() => setShowSuggestionModal(true)}
             className="flex items-center justify-center gap-2 rounded-xl bg-teal-50 border border-teal-200 py-3 px-6 text-sm font-bold text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer w-full md:w-auto"
           >
             <MessageSquare size={16} /> Open Feedback Form
           </button>
        </div>
      </div>
      <SuggestionModal 
        isOpen={showSuggestionModal} 
        onClose={() => setShowSuggestionModal(false)}
        source="Dashboard"
      />
    </Page>
  );
}

function Billing() {
  const [billingTab, setBillingTab] = useState<'periods' | 'credits'>('periods');

  const creditPlans = [
    {
      title: '1 Session Credit',
      originalPrice: '₹199',
      price: '₹149',
      discount: '25% OFF',
      desc: 'Get 1 full-length live mock session with real-time feedback, transcripts, and AI analysis.',
      validity: 'Valid for 30 days',
      badge: '',
      popular: false,
    },
    {
      title: '2 Sessions Pack',
      originalPrice: '₹399',
      price: '₹249',
      discount: '37% OFF',
      desc: 'Get 2 live mock sessions. Resume matching and reference docs context injection included.',
      validity: 'Valid for 60 days',
      badge: '',
      popular: false,
    },
    {
      title: '3 Sessions Pack',
      originalPrice: '₹599',
      price: '₹349',
      discount: '41% OFF',
      desc: 'Get 3 live mock sessions. Priority support access and detailed history archive matching.',
      validity: 'Valid for 90 days',
      badge: 'Popular Choice',
      popular: true,
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
      <div className="flex border border-slate-200 p-1 rounded-2xl max-w-md bg-slate-100/80 mb-8 shrink-0 shadow-sm">
        <button
          onClick={() => setBillingTab('periods')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${billingTab === 'periods'
            ? 'bg-teal-600 text-white shadow-sm'
            : 'text-slate-500 hover:!text-slate-900'
            }`}
        >
          <SlidersHorizontal size={14} /> Subscription Periods
        </button>
        <button
          onClick={() => setBillingTab('credits')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${billingTab === 'credits'
            ? 'bg-teal-600 text-white shadow-sm'
            : 'text-slate-500 hover:!text-slate-900'
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
              className={`relative overflow-hidden flex flex-col justify-between h-full border transition-all ${plan.popular
                ? 'border-teal-500/40 bg-teal-500/10 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <Badge tone={plan.popular ? 'teal' : 'teal'}>{plan.badge}</Badge>
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
                    <span className="text-[10px] text-teal-600 font-bold bg-teal-500/10 px-2 py-0.5 rounded-lg border border-teal-500/20">
                      {plan.discount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{plan.desc}</p>
                <div className="text-[10px] text-slate-500 font-bold bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-lg w-max">
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
              className={`relative overflow-hidden flex flex-col justify-between h-full border transition-all ${plan.popular
                ? 'border-teal-500/40 bg-teal-500/10 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <Badge tone={plan.popular ? 'teal' : 'teal'}>{plan.badge}</Badge>
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
                    <span className="text-[10px] text-teal-600 font-bold bg-teal-500/10 px-2 py-0.5 rounded-lg border border-teal-500/20">
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
                  onClick={() => {}}
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
    <section className="mt-6 grid gap-6 xl:grid-cols-2"><Card><h2 className="text-xl font-black">Strengths</h2><div className="mt-4 flex flex-wrap gap-2">{['Clear structure', 'Good caching explanation', 'Strong API design'].map((x) => <Badge key={x} tone="teal">{x}</Badge>)}</div></Card><Card><h2 className="text-xl font-black">Improve Next</h2><div className="mt-4 space-y-4"><Plan label="Database sharding" value={58} /><Plan label="Failure handling" value={64} /><Plan label="Capacity estimation" value={42} /></div></Card></section>
  </Page>;
}

function Page({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="px-5 py-7 lg:px-8 flex-1 overflow-y-auto min-h-0"><div className="mb-8"><p className="text-sm font-semibold text-teal-700">Sutra AI</p><h1 className="mt-2 text-4xl font-black text-white">{title}</h1><p className="mt-2 text-slate-400">{subtitle}</p></div>{children}</main>;
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
  return <div><label className="mb-2 block text-sm font-bold">{label}</label><input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" /></div>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return <div><label className="mb-2 block text-sm font-bold">{label}</label><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none">{options.map((o) => <option className="bg-white" key={o}>{o}</option>)}</select></div>;
}

function Tool({ icon: Icon, label }: { icon: any; label: string }) {
  return <button className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-200 hover:bg-slate-50"><Icon size={15} />{label}</button>;
}

function Plan({ label, value }: { label: string; value: number }) {
  return <div><div className="mb-2 flex justify-between text-sm"><span className="text-slate-700">{label}</span><span>{value}%</span></div><Progress value={value} /></div>;
}

function Output({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between rounded-2xl bg-slate-50 border border-slate-200/60 p-4 text-sm"><span className="text-slate-500">{k}</span><span className="font-bold !text-slate-900">{v}</span></div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-2xl font-black !text-slate-900">{value}</div><div className="mt-1 text-xs text-slate-500 font-semibold">{label}</div></div>;
}

function PreviewCard({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl bg-slate-50 border border-slate-200/60 p-4"><div className="text-xs font-black uppercase tracking-wide text-teal-600">{title}</div><p className="mt-2 text-sm leading-6 text-slate-600 font-medium">{text}</p></div>;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass card-hover rounded-3xl p-5 ${className}`}>{children}</div>;
}

const toneMap = {
  teal: 'bg-teal-50 text-teal-600 ring-teal-100/50',
  teal: 'bg-teal-50 text-teal-600 ring-teal-100/50',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100/50',
  sky: 'bg-sky-50 text-sky-600 ring-sky-100/50',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100/50',
};

function Badge({ children, tone = 'teal' }: { children: React.ReactNode; tone?: keyof typeof toneMap }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${toneMap[tone]}`}>{children}</span>;
}

function Button({ children, onClick, variant = 'primary', className = '' }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger'; className?: string }) {
  const styles = {
    primary: 'btn-gradient text-white shadow-lg shadow-teal-600/10',
    secondary: 'btn-glass text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:!text-slate-900',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/10 hover:from-red-500 hover:to-rose-500'
  };
  return <button onClick={onClick} className={`rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 active:translate-y-0 cursor-pointer ${styles[variant]} ${className}`}>{children}</button>;
}

function Progress({ value }: { value: number }) {
  return <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-600" style={{ width: `${value}%` }} /></div>;
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
        tokens.push(<span key={keyIdx++} className="text-teal-600 font-medium">{stringToken}</span>);
      } else if (keyword) {
        tokens.push(<span key={keyIdx++} className="text-teal-600 font-bold">{keyword}</span>);
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
          tokens.push(<span key={keyIdx++} className="text-teal-600 font-semibold">{identifier}</span>);
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
            <div key={index} className="my-4 overflow-hidden rounded-xl border border-teal-500/30 bg-[#05060f] shadow-lg font-mono text-xs ring-1 ring-teal-500/10">
              <div className="flex items-center justify-between bg-teal-950/20 px-4 py-2 border-b border-teal-500/20">
                <span className="text-[10px] uppercase tracking-wider text-teal-700 font-extrabold">{segment.lang || 'code'}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(segment.content.trim())}
                  className="rounded-md border border-teal-500/20 bg-teal-950/40 px-2 py-1 text-[10px] font-bold text-teal-700 hover:border-teal-500 hover:text-white hover:bg-teal-900 transition-all cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-slate-700 font-mono whitespace-pre-wrap bg-[#05060f]" style={{ whiteSpace: 'pre-wrap' }}>
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
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                      <p className="text-slate-700 whitespace-pre-wrap">
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
                    <h4 key={lIdx} className={`${sizeClass} font-black !text-slate-900 mt-4 mb-2 tracking-tight`}>
                      {renderBoldText(content)}
                    </h4>
                  );
                }

                // Normal paragraph (trimEnd to preserve leading indentation for code that is formatted outside code blocks)
                return (
                  <p key={lIdx} className="text-slate-700 whitespace-pre-wrap">
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
        <strong key={i} className="font-bold !text-slate-900">
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
