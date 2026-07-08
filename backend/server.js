const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(cors());
app.use(express.json());

// In-memory databases
let sessions = [];
let resumes = [
  { id: 'resume-1', filename: 'John_Doe_Resume.pdf', active: true, uploadDate: new Date().toISOString() }
];
let knowledge = [
  { id: 'doc-1', filename: 'Company_Guidelines.pdf', active: false, uploadDate: new Date().toISOString() }
];

// --- Auth Routes ---
app.post('/api/auth/google', (req, res) => {
  res.json({
    id: req.body.firebase_uid || 'mock-user-123',
    login_token: 'mock-login-token-xyz',
    email: req.body.email || 'mock@example.com',
    name: req.body.name || 'Mock User'
  });
});

app.post('/api/auth/check-session', (req, res) => {
  res.json({ valid: true });
});

// --- Generative AI Routes ---
app.post('/api/answer', (req, res) => {
  res.json({
    question: req.body.question || "Mocked parsed question",
    answer: "This is a mocked answer from the Express backend."
  });
});

app.post('/api/answer/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  const payload = JSON.stringify({
    question: req.body.question || "Mocked question",
    answer: "This is a streamed mock answer from the backend."
  });

  res.write(payload);
  res.end();
});

app.post('/api/screenshot', upload.single('file'), (req, res) => {
  res.json({
    answer: "This is a mock analysis of the uploaded screenshot. I see some code and a UI!"
  });
});

app.post('/api/mock-interview/feedback', (req, res) => {
  res.json({
    feedback: "This is mock feedback. You did well, but could improve on system design concepts."
  });
});

app.post('/api/answers/warmup', (req, res) => {
  res.json({ success: true });
});

app.post('/api/answers/transcript', (req, res) => {
  res.json({
    answer: "Transcript context processed."
  });
});

app.post('/api/answers/prewarm-question', (req, res) => {
  res.json({ success: true });
});

// --- Entity Management (Sessions) ---
app.get('/api/sessions', (req, res) => {
  res.json(sessions);
});

app.post('/api/sessions', (req, res) => {
  const newSession = { id: Date.now().toString(), ...req.body, date: new Date().toISOString() };
  sessions.push(newSession);
  res.json(newSession);
});

app.post('/api/sessions/overview', (req, res) => {
  res.json({ overview: "Mock session overview" });
});

app.get('/api/sessions/:id', (req, res) => {
  const session = sessions.find(s => s.id === req.params.id);
  res.json(session || {});
});

app.patch('/api/sessions/:id', (req, res) => {
  res.json({ success: true });
});

app.delete('/api/sessions/:id', (req, res) => {
  sessions = sessions.filter(s => s.id !== req.params.id);
  res.json({ success: true });
});

app.get('/api/sessions/:id/transcripts', (req, res) => {
  res.json([]);
});

app.get('/api/sessions/:id/answers', (req, res) => {
  res.json([]);
});

app.post('/api/transcripts', (req, res) => {
  res.json({ success: true });
});

// --- Entity Management (Resumes) ---
app.get('/api/resumes', (req, res) => {
  res.json(resumes);
});

app.post('/api/resumes/upload', upload.single('file'), (req, res) => {
  const newResume = {
    id: Date.now().toString(),
    filename: req.file ? req.file.originalname : 'mock_uploaded_resume.pdf',
    active: false,
    uploadDate: new Date().toISOString()
  };
  resumes.push(newResume);
  res.json(newResume);
});

app.patch('/api/resumes/:id/activate', (req, res) => {
  resumes.forEach(r => r.active = (r.id === req.params.id));
  res.json({ success: true });
});

app.delete('/api/resumes/:id', (req, res) => {
  resumes = resumes.filter(r => r.id !== req.params.id);
  res.json({ success: true });
});

// --- Entity Management (Knowledge) ---
app.get('/api/knowledge', (req, res) => {
  res.json(knowledge);
});

app.post('/api/knowledge/upload', upload.single('file'), (req, res) => {
  const newDoc = {
    id: Date.now().toString(),
    filename: req.file ? req.file.originalname : 'mock_knowledge_doc.pdf',
    active: false,
    uploadDate: new Date().toISOString()
  };
  knowledge.push(newDoc);
  res.json(newDoc);
});

app.delete('/api/knowledge/:id', (req, res) => {
  knowledge = knowledge.filter(k => k.id !== req.params.id);
  res.json({ success: true });
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Mock Backend running on http://localhost:${PORT}`);
});
