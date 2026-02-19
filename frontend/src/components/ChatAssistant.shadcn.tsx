/**
 * ChatAssistant – NIST CSF 2.0 help chatbot
 *
 * Visible on ALL pages as a fixed bottom-right bubble.
 * Dual mode: Quick Help (pre-built QA) + AI Assistant (Claude API streaming).
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send } from 'lucide-react';
import { T } from '../tokens';
import { API_BASE_URL } from '../api/client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuickAction {
  id: string;
  label: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickActions?: QuickAction[];
  isStreaming?: boolean;
  isError?: boolean;
  isAiMode?: boolean;
}

interface ContextInfo {
  greeting: string;
  quickActions: QuickAction[];
}

// ─── Pre-built Q&A database ──────────────────────────────────────────────────

const QA: Record<string, { answer: string; followUp?: QuickAction[] }> = {
  'what-is-nist': {
    answer: `**NIST CSF 2.0** is the National Institute of Standards and Technology Cybersecurity Framework — a voluntary, widely-adopted standard for managing cybersecurity risk.

It's organized into **6 core functions**:
• 🏛️ **Govern (GV)** — Strategy, policies, and accountability
• 🔍 **Identify (ID)** — Assets, risks, and exposure
• 🛡️ **Protect (PR)** — Access controls and safeguards
• 👁️ **Detect (DE)** — Monitoring and anomaly detection
• 📣 **Respond (RS)** — Incident response procedures
• 🔄 **Recover (RC)** — Recovery planning and continuity

Your assessment covers all **120 controls** across these 6 functions and 22 categories.`,
    followUp: [
      { id: 'how-to-rate', label: 'How do I rate a control?' },
      { id: 'score-calc', label: 'How is my score calculated?' },
    ],
  },

  'how-to-rate': {
    answer: `Each control can be rated with one of 4 statuses:

✅ **Compliant** — Fully implemented with documented evidence. You can demonstrate it to an auditor.

🟡 **Partial** — Some aspects exist but it's incomplete, inconsistently applied, or not yet documented.

❌ **Non-Compliant** — The control is missing or significantly deficient.

⏭️ **Not Applicable** — The control doesn't apply to your context (e.g., a cloud-only org rating on-premises controls).

**Tip:** When in doubt, lean toward *Partial* rather than *Compliant* — it's more defensible and surfaces real improvement areas.`,
    followUp: [
      { id: 'what-evidence', label: 'What evidence do I need?' },
      { id: 'score-calc', label: 'How is the score calculated?' },
    ],
  },

  'what-evidence': {
    answer: `Evidence proves that a control is implemented. Common types:

📄 **Policies & Procedures** — Written security policies, standards (PDF / Word)
📸 **Screenshots** — Tool configs, dashboard snapshots, security settings
📋 **Audit Reports** — SOC 2, ISO 27001, penetration test results
📊 **Logs & Records** — Access logs, change records, incident tickets
🎓 **Training Records** — Security awareness completion certificates
📝 **Meeting Minutes** — Risk committee records, board cybersecurity briefings

**How to add evidence:** Use the attachment button in any control row, or summarize it in the Notes field.

**Tip:** Auditors value *recent* evidence (< 12 months) that is specific and traceable to a named system or process.`,
    followUp: [
      { id: 'how-to-rate', label: 'Back to rating a control' },
      { id: 'what-to-fix', label: 'What should I prioritize?' },
    ],
  },

  'score-calc': {
    answer: `Your **Overall Score** uses a weighted formula:

  Compliant     × 1.0
+ Partial       × 0.5
+ Non-Compliant × 0.0
─────────────────────
÷ Total Controls × 100

**Not Assessed** items count as 0 but are included in the denominator — completing the assessment matters.

**Not Applicable** items are excluded from both numerator and denominator.

**Function Scores** use the same formula scoped to each CSF function, showing you where gaps are concentrated.`,
    followUp: [
      { id: 'maturity', label: 'What is a good score?' },
      { id: 'what-to-fix', label: 'What should I fix first?' },
    ],
  },

  'what-to-fix': {
    answer: `Prioritize remediation using this approach:

🔴 **Critical first** — Non-Compliant controls in **Identify** and **Protect** represent the highest exploitable risk.

⚡ **Quick wins** — Partial controls that just need documentation or a minor process change — high score impact, low effort.

📋 **Priority controls** — Items marked with an orange badge in the checklist are flagged as high priority.

**Practical steps:**
1. Go to the Report page and open the Findings table
2. Sort by Status → focus on Non-Compliant first
3. Group by function to find your weakest area
4. Aim for 3–5 controls improved per sprint

**Remember:** Moving Non-Compliant → Partial → Compliant shows measurable progress to auditors even before full compliance.`,
    followUp: [
      { id: 'what-evidence', label: 'What evidence do I need?' },
      { id: 'score-calc', label: 'How is my score calculated?' },
    ],
  },

  'maturity': {
    answer: `**NIST CSF Maturity Tiers** and typical score ranges:

Tier 1 — Partial        (< 30%)
  Ad-hoc, reactive security practices

Tier 2 — Risk Informed  (30–50%)
  Some policies exist; not fully implemented

Tier 3 — Repeatable     (50–70%)
  Consistent, documented practices

Tier 4 — Adaptive       (> 70%)
  Proactive, continuously improving

**Industry benchmarks:**
• Small organizations: ~35–50%
• Mid-market: ~50–65%
• Enterprise: ~65–80%

A score of **60%+** is commonly acceptable for vendor risk. Critical vendors are often expected to reach **70%+**.

**Note:** The *type* of gaps matters as much as the number. Non-compliance in Detect/Respond is typically riskier than in Govern.`,
    followUp: [
      { id: 'what-to-fix', label: 'How do I improve my score?' },
    ],
  },

  'wizard-vs-checklist': {
    answer: `CSF Compass offers two ways to complete your assessment:

🧙 **Assessment Wizard**
Step-by-step guided flow organized by security tool category (IAM, Endpoint, Cloud, etc.). Best for:
• First-time assessors
• Teams uploading evidence alongside each step
• Structured walkthroughs with implementation guidance

📋 **Compliance Checklist**
Full 120-control view organized by CSF function and category. Best for:
• Experienced assessors who know the framework
• Rapid bulk status updates
• Reviewing specific functions in detail

**Both update the same assessment** — progress in one instantly reflects in the other. Switch anytime from the Assessment Detail page.`,
    followUp: [
      { id: 'how-to-rate', label: 'How do I rate a control?' },
      { id: 'what-evidence', label: 'What evidence do I need?' },
    ],
  },

  'vendor-assessment': {
    answer: `**Vendor assessments** evaluate third-party security posture using the same NIST CSF 2.0 framework.

**Two approaches:**

1. **You assess them** — Fill the checklist yourself using their documentation, certifications (SOC 2, ISO 27001), or questionnaire responses.

2. **Vendor self-assessment** — Send a magic link from the Assessment Detail page; the vendor completes it independently.

After a vendor completes their self-assessment, you can **compare** your rating against theirs side-by-side in the Comparison view.

**Criticality tiers:**
• 🔴 Critical — Core business dependencies with data access
• 🟠 High — Significant data processing or business process impact
• 🟡 Medium — Standard business tool usage
• 🟢 Low — Minimal data or business exposure`,
    followUp: [
      { id: 'how-to-rate', label: 'How do I rate a control?' },
      { id: 'what-to-fix', label: 'What gaps to prioritize?' },
    ],
  },

  'govern-function': {
    answer: `The **Govern (GV)** function is new in CSF 2.0. It covers overall cybersecurity governance:

• **GV.OC** — Organizational Context: mission, stakeholders, legal requirements
• **GV.RM** — Risk Management Strategy: risk appetite, thresholds, priorities
• **GV.RR** — Roles & Responsibilities: who owns cybersecurity (CISO, board)
• **GV.PO** — Policy: written cybersecurity policies
• **GV.OV** — Oversight: executive and board cybersecurity oversight
• **GV.SC** — Supply Chain Risk: third-party and supplier risk management

**Evidence to gather:** Security policy documents, board presentation decks, RACI charts, risk register, vendor management procedures.`,
    followUp: [
      { id: 'what-evidence', label: 'What counts as evidence?' },
    ],
  },
};

// ─── Fallback quick actions ───────────────────────────────────────────────────

const FALLBACK_ACTIONS: QuickAction[] = [
  { id: 'what-is-nist', label: 'What is NIST CSF 2.0?' },
  { id: 'how-to-rate', label: 'How do I rate a control?' },
  { id: 'what-evidence', label: 'What evidence do I need?' },
  { id: 'score-calc', label: 'How is my score calculated?' },
];

// ─── Context helper (Quick Help mode greetings) ──────────────────────────────

function getContextForPath(path: string): ContextInfo {
  if (path.includes('/checklist')) {
    return {
      greeting: "You're reviewing the **Compliance Checklist**. Use the **ℹ️ What's Required** and **📘 Guidance** buttons on each control row — or ask me anything below.",
      quickActions: [
        { id: 'how-to-rate', label: 'How do I rate a control?' },
        { id: 'what-evidence', label: 'What evidence do I need?' },
        { id: 'what-to-fix', label: 'What to prioritize?' },
        { id: 'wizard-vs-checklist', label: 'Checklist vs Wizard?' },
      ],
    };
  }
  if (path.includes('/wizard')) {
    return {
      greeting: "You're working through the **Assessment Wizard**. Each step covers a security domain. Use the **📘 Implementation Guide** button in each step — or ask me below.",
      quickActions: [
        { id: 'wizard-vs-checklist', label: 'Checklist vs Wizard?' },
        { id: 'what-evidence', label: 'What evidence do I need?' },
        { id: 'how-to-rate', label: 'How do I rate a control?' },
        { id: 'what-is-nist', label: 'What is NIST CSF 2.0?' },
      ],
    };
  }
  if (path.includes('/report')) {
    return {
      greeting: "You're viewing the **Assessment Report**. I can help explain scores, findings, and remediation priorities.",
      quickActions: [
        { id: 'score-calc', label: 'How is my score calculated?' },
        { id: 'maturity', label: 'What is a good score?' },
        { id: 'what-to-fix', label: 'What to prioritize next?' },
        { id: 'what-is-nist', label: 'About NIST CSF 2.0' },
      ],
    };
  }
  if (path.includes('/comparison')) {
    return {
      greeting: "You're viewing a **Comparison** between two assessments. I can help explain the delta scores and what the differences mean.",
      quickActions: [
        { id: 'score-calc', label: 'How is scoring calculated?' },
        { id: 'how-to-rate', label: 'About compliance statuses' },
        { id: 'what-to-fix', label: 'What to prioritize?' },
      ],
    };
  }
  if (path.startsWith('/assessments/')) {
    return {
      greeting: "I'm your **CSF Compass Assistant** — here to help with NIST CSF 2.0 controls, compliance guidance, scoring, and evidence requirements. What would you like to know?",
      quickActions: [
        { id: 'what-is-nist', label: 'What is NIST CSF 2.0?' },
        { id: 'how-to-rate', label: 'How do I rate a control?' },
        { id: 'what-evidence', label: 'What evidence do I need?' },
        { id: 'score-calc', label: 'How is my score calculated?' },
        { id: 'what-to-fix', label: 'What to prioritize?' },
      ],
    };
  }
  if (path === '/dashboard' || path.startsWith('/dashboard')) {
    return {
      greeting: "Welcome to **CSF Compass**! I can help you understand your compliance dashboard, interpret metrics, or guide you through your first assessment.",
      quickActions: [
        { id: 'what-is-nist', label: 'What is NIST CSF 2.0?' },
        { id: 'wizard-vs-checklist', label: 'How do assessments work?' },
        { id: 'score-calc', label: 'How are scores calculated?' },
        { id: 'vendor-assessment', label: 'About vendor assessments' },
      ],
    };
  }
  if (path.startsWith('/vendors')) {
    return {
      greeting: "You're on the **Vendors** section. I can help with vendor risk management, assessment setup, or interpreting vendor scores.",
      quickActions: [
        { id: 'vendor-assessment', label: 'About vendor assessments' },
        { id: 'how-to-rate', label: 'How do I rate controls?' },
        { id: 'maturity', label: 'What is a good vendor score?' },
      ],
    };
  }
  if (path.startsWith('/company-groups')) {
    return {
      greeting: "You're viewing **Group Companies**. I can explain how CSF function scores are measured or what a good aggregate compliance score looks like.",
      quickActions: [
        { id: 'what-is-nist', label: 'About the 6 CSF functions' },
        { id: 'score-calc', label: 'How are scores calculated?' },
        { id: 'maturity', label: 'What score is acceptable?' },
      ],
    };
  }
  if (path === '/analytics') {
    return {
      greeting: "You're on the **Analytics** page. I can help explain compliance trends, gap analysis, or how to interpret the charts.",
      quickActions: [
        { id: 'score-calc', label: 'How are scores calculated?' },
        { id: 'maturity', label: 'CSF maturity benchmarks' },
        { id: 'what-to-fix', label: 'What to prioritize?' },
      ],
    };
  }
  // Global default
  return {
    greeting: "I'm your **CSF Compass Assistant** — here to help with NIST CSF 2.0 controls, compliance guidance, scoring, and evidence requirements. What would you like to know?",
    quickActions: [
      { id: 'what-is-nist', label: 'What is NIST CSF 2.0?' },
      { id: 'how-to-rate', label: 'How do I rate a control?' },
      { id: 'what-evidence', label: 'What evidence do I need?' },
      { id: 'score-calc', label: 'How is my score calculated?' },
      { id: 'what-to-fix', label: 'What to prioritize?' },
    ],
  };
}

// ─── Page context string (AI mode system prompt injection) ────────────────────

function getPageContextString(path: string): string {
  if (path.includes('/checklist'))
    return 'User is reviewing the Compliance Checklist — individual NIST CSF 2.0 controls with status, notes, and evidence.';
  if (path.includes('/wizard'))
    return 'User is on the Assessment Wizard — a step-by-step guided assessment organized by security domain.';
  if (path.includes('/report'))
    return 'User is viewing the Assessment Report — compliance scores, findings table, and export options.';
  if (path.includes('/comparison'))
    return 'User is on the Assessment Comparison page — two assessments shown side-by-side with delta indicators.';
  if (path.startsWith('/assessments/'))
    return 'User is on an Assessment Detail page — overview of a specific NIST CSF 2.0 assessment.';
  if (path.startsWith('/vendors'))
    return 'User is on the Vendors section — managing third-party vendor security assessments.';
  if (path.startsWith('/company-groups'))
    return 'User is on the Group Companies page — managing internal subsidiaries and their aggregate CSF scores.';
  if (path === '/analytics')
    return 'User is on the Analytics page — compliance trends, gap analysis charts, and vendor risk metrics.';
  if (path === '/dashboard' || path.startsWith('/dashboard'))
    return 'User is on the Dashboard — high-level view of compliance posture, recent assessments, and key metrics.';
  return 'User is on the CSF Compass platform — a NIST CSF 2.0 compliance management application.';
}

// ─── Keyword matching (Quick Help mode) ──────────────────────────────────────

function matchKeywords(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.match(/nist|csf|framework|what is/)) return 'what-is-nist';
  if (lower.match(/rate|status|partial|compliant|how to assess/)) return 'how-to-rate';
  if (lower.match(/evidence|document|proof|upload|attach|file/)) return 'what-evidence';
  if (lower.match(/score|calculat|percent|formula|how.*calc/)) return 'score-calc';
  if (lower.match(/fix|priorit|improv|start|remedi|first/)) return 'what-to-fix';
  if (lower.match(/wizard|checklist|difference|vs |versus/)) return 'wizard-vs-checklist';
  if (lower.match(/good|average|benchmark|maturity|tier|pass/)) return 'maturity';
  if (lower.match(/vendor|supplier|third.party|self.assess/)) return 'vendor-assessment';
  if (lower.match(/govern|gv\.|policy|policies/)) return 'govern-function';
  return null;
}

// ─── Simple markdown renderer ────────────────────────────────────────────────

function renderMarkdown(text: string): ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={j} style={{ fontWeight: 600, color: 'inherit' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={j}>{part}</span>;
    });
    return (
      <span
        key={i}
        style={{ display: 'block', lineHeight: '1.6', minHeight: line.trim() === '' ? 8 : undefined }}
      >
        {rendered}
      </span>
    );
  });
}

// ─── CSS animations ──────────────────────────────────────────────────────────

const ANIM_CSS = `
@keyframes csf-chat-pulse {
  0%   { box-shadow: 0 4px 16px rgba(0,0,0,0.25), 0 0 0 0 rgba(99,102,241,0.55); }
  70%  { box-shadow: 0 4px 16px rgba(0,0,0,0.25), 0 0 0 15px rgba(99,102,241,0); }
  100% { box-shadow: 0 4px 16px rgba(0,0,0,0.25), 0 0 0 0 rgba(99,102,241,0); }
}
@keyframes csf-chat-slideup {
  from { opacity: 0; transform: translateY(18px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes csf-chat-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40%           { transform: translateY(-5px); opacity: 1; }
}
@keyframes csf-chat-shimmer {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}
.csf-chat-pulse {
  animation: csf-chat-pulse 1s ease-out 3;
}
.csf-chat-panel {
  animation: csf-chat-slideup 0.22s ease-out forwards;
}
.csf-chat-dot {
  animation: csf-chat-bounce 1.2s ease-in-out infinite;
}
.csf-chat-streaming {
  animation: csf-chat-shimmer 1.5s ease-in-out infinite;
}
@media (max-width: 640px) {
  .csf-chat-panel {
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    max-height: 82vh !important;
    border-radius: 16px 16px 0 0 !important;
  }
}
@media print {
  .csf-chat-bubble, .csf-chat-panel { display: none !important; }
}
`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChatAssistant() {
  const { pathname } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'quick' | 'ai'>(
    () => (localStorage.getItem('csf-chat-mode') as 'quick' | 'ai') ?? 'quick',
  );
  const [quickMessages, setQuickMessages] = useState<Message[]>([]);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isPulsing, setIsPulsing] = useState(false);
  const [isAiStreaming, setIsAiStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const context = useMemo(() => getContextForPath(pathname), [pathname]);
  const messages = chatMode === 'quick' ? quickMessages : aiMessages;

  // ── Switch mode ──
  const switchMode = useCallback((mode: 'quick' | 'ai') => {
    setChatMode(mode);
    localStorage.setItem('csf-chat-mode', mode);
  }, []);

  // ── Pulse on first ever visit ──
  useEffect(() => {
    const seen = localStorage.getItem('csf-chat-seen');
    if (seen) return;
    const delay = setTimeout(() => {
      setIsPulsing(true);
      const stop = setTimeout(() => {
        setIsPulsing(false);
        localStorage.setItem('csf-chat-seen', '1');
      }, 3300);
      return () => clearTimeout(stop);
    }, 1800);
    return () => clearTimeout(delay);
  }, []);

  // ── Welcome message when panel opens or mode switches ──
  useEffect(() => {
    if (!isOpen) return;
    if (chatMode === 'quick' && quickMessages.length === 0) {
      setQuickMessages([{
        id: 'welcome-q',
        role: 'assistant',
        content: context.greeting,
        timestamp: new Date(),
        quickActions: context.quickActions,
      }]);
    } else if (chatMode === 'ai' && aiMessages.length === 0) {
      setAiMessages([{
        id: 'welcome-ai',
        role: 'assistant',
        content: "Hi! I'm powered by **Claude AI**. Ask me anything about NIST CSF 2.0 controls, evidence requirements, implementation strategies, or how to improve your compliance posture.",
        timestamp: new Date(),
        isAiMode: true,
      }]);
    }
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen, chatMode, quickMessages.length, aiMessages.length, context]);

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Reset on navigation ──
  useEffect(() => {
    abortRef.current?.abort();
    setQuickMessages([]);
    setAiMessages([]);
    setIsOpen(false);
    setIsAiStreaming(false);
  }, [pathname]);

  // ── Quick Help: quick-action chip handler ──
  const handleQuickAction = useCallback((actionId: string, actionLabel: string) => {
    const qa = QA[actionId];
    if (!qa) return;
    setQuickMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: actionLabel, timestamp: new Date() },
      {
        id: `a-${Date.now() + 1}`,
        role: 'assistant',
        content: qa.answer,
        timestamp: new Date(),
        quickActions: qa.followUp,
      },
    ]);
  }, []);

  // ── Quick Help: free text send ──
  const handleQuickSend = useCallback((text: string) => {
    const matchedId = matchKeywords(text);
    const qa = matchedId ? QA[matchedId] : null;
    setQuickMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date() },
      {
        id: `a-${Date.now() + 1}`,
        role: 'assistant',
        content: qa
          ? qa.answer
          : "I don't have a specific answer for that, but here are some topics I can help with:",
        timestamp: new Date(),
        quickActions: qa?.followUp ?? FALLBACK_ACTIONS,
      },
    ]);
  }, []);

  // ── AI Assistant: streaming send ──
  const handleAiSend = useCallback(async (text: string) => {
    if (isAiStreaming) return;

    const aiMsgId = `a-${Date.now() + 1}`;

    // Build history snapshot before state updates
    const historyMessages = aiMessages
      .filter(m => !m.isError && !m.isStreaming && m.content.trim() && m.id !== 'welcome-ai')
      .slice(-10)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    historyMessages.push({ role: 'user', content: text });

    setAiMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date(), isAiMode: true },
      { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date(), isAiMode: true, isStreaming: true },
    ]);
    setIsAiStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyMessages,
          page_context: getPageContextString(pathname),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            setAiMessages(prev =>
              prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m),
            );
            setIsAiStreaming(false);
            return;
          }
          try {
            const parsed = JSON.parse(data) as { token?: string; error?: string };
            if (parsed.token) {
              setAiMessages(prev =>
                prev.map(m =>
                  m.id === aiMsgId ? { ...m, content: m.content + parsed.token } : m,
                ),
              );
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch { /* ignore JSON parse errors for individual lines */ }
        }
      }

      setAiMessages(prev =>
        prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m),
      );
      setIsAiStreaming(false);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setAiMessages(prev =>
        prev.map(m =>
          m.id === aiMsgId
            ? { ...m, content: '', isStreaming: false, isError: true }
            : m,
        ),
      );
      setIsAiStreaming(false);
    }
  }, [aiMessages, isAiStreaming, pathname]);

  // ── Unified submit ──
  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    if (chatMode === 'ai') {
      handleAiSend(text);
    } else {
      handleQuickSend(text);
    }
  }, [chatMode, inputValue, handleAiSend, handleQuickSend]);

  const sendEnabled = inputValue.trim().length > 0 && !(chatMode === 'ai' && isAiStreaming);

  return (
    <>
      <style>{ANIM_CSS}</style>

      {/* ── Chat panel ── */}
      {isOpen && (
        <div
          className="csf-chat-panel"
          style={{
            position: 'fixed',
            bottom: 88,
            right: 24,
            width: 380,
            height: 'min(520px, 60vh)',
            display: 'flex',
            flexDirection: 'column',
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 101,
            overflow: 'hidden',
            fontFamily: T.fontSans,
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: T.accentLight,
                border: `1px solid ${T.accentBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MessageCircle size={15} color={T.accent} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
                  CSF Compass Assistant
                </div>
                <div style={{ fontSize: 10, color: T.textMuted }}>
                  {chatMode === 'ai' ? 'Claude AI · NIST CSF Expert' : 'NIST CSF 2.0 Guidance'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              title="Close"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 5,
                borderRadius: 6,
                color: T.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = T.accentLight;
                e.currentTarget.style.color = T.accent;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = T.textMuted;
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Mode toggle */}
          <div style={{ padding: '8px 12px 4px', flexShrink: 0 }}>
            <div style={{
              background: T.bg,
              padding: 2,
              borderRadius: 8,
              display: 'flex',
              gap: 2,
              border: `1px solid ${T.border}`,
            }}>
              {(['quick', 'ai'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => switchMode(mode)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    textAlign: 'center',
                    fontSize: 11,
                    fontFamily: T.fontSans,
                    fontWeight: chatMode === mode ? 500 : 400,
                    color: chatMode === mode ? 'white' : T.textFaint,
                    background: chatMode === mode ? T.accent : 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    boxShadow: chatMode === mode ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {mode === 'quick' ? '📋 Quick Help' : '🤖 AI Assistant'}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 14px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {messages.map((msg) => (
              <div key={msg.id}>
                {/* ✨ AI badge above assistant bubbles in AI mode */}
                {msg.role === 'assistant' && msg.isAiMode && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    paddingLeft: 4,
                    marginBottom: 3,
                  }}>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 600,
                      color: T.accent,
                      background: T.accentLight,
                      border: `1px solid ${T.accentBorder}`,
                      borderRadius: 4,
                      padding: '1px 6px',
                      letterSpacing: '0.02em',
                    }}>✨ AI</span>
                  </div>
                )}

                {/* Bubble */}
                <div style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 3,
                }}>
                  <div
                    className={msg.isStreaming && msg.content ? 'csf-chat-streaming' : ''}
                    style={{
                      maxWidth: '84%',
                      padding: '9px 13px',
                      borderRadius: msg.role === 'user'
                        ? '14px 14px 4px 14px'
                        : '4px 14px 14px 14px',
                      background: msg.role === 'user' ? T.accent : T.bg,
                      color: msg.role === 'user' ? 'white' : T.textPrimary,
                      fontSize: 12.5,
                      lineHeight: '1.55',
                      border: msg.role === 'user' ? 'none' : `1px solid ${T.border}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                    }}
                  >
                    {/* Typing indicator (streaming, no content yet) */}
                    {msg.isStreaming && msg.content === '' && (
                      <div style={{ display: 'flex', gap: 4, padding: '4px 2px', alignItems: 'center' }}>
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="csf-chat-dot"
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: T.textMuted,
                              animationDelay: `${i * 0.2}s`,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Error state */}
                    {msg.isError && (
                      <div>
                        <p style={{ color: '#EF4444', fontSize: 12, margin: '0 0 8px 0' }}>
                          AI Assistant unavailable. Try Quick Help mode.
                        </p>
                        <button
                          onClick={() => switchMode('quick')}
                          style={{
                            fontSize: 11,
                            color: T.accent,
                            background: T.accentLight,
                            border: `1px solid ${T.accentBorder}`,
                            borderRadius: 5,
                            padding: '4px 10px',
                            cursor: 'pointer',
                            fontFamily: T.fontSans,
                          }}
                        >
                          Switch to Quick Help →
                        </button>
                      </div>
                    )}

                    {/* Normal content */}
                    {!msg.isError && msg.content && renderMarkdown(msg.content)}
                  </div>
                </div>

                {/* Timestamp */}
                <div style={{
                  fontSize: 10,
                  color: T.textFaint,
                  fontFamily: T.fontMono,
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                  paddingInline: 4,
                  marginBottom: 4,
                }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                {/* Quick-action chips (Quick Help mode only) */}
                {msg.quickActions && msg.quickActions.length > 0 && chatMode === 'quick' && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 5,
                    paddingInline: 4,
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginTop: 2,
                  }}>
                    {msg.quickActions.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action.id, action.label)}
                        style={{
                          background: T.accentLight,
                          color: T.accent,
                          border: `1px solid ${T.accentBorder}`,
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontFamily: T.fontSans,
                          cursor: 'pointer',
                          transition: 'all 0.13s',
                          lineHeight: '1.4',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = T.accent;
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.borderColor = T.accent;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = T.accentLight;
                          e.currentTarget.style.color = T.accent;
                          e.currentTarget.style.borderColor = T.accentBorder;
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: `1px solid ${T.border}`,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={chatMode === 'ai' ? 'Ask the AI assistant…' : 'Ask about NIST CSF 2.0…'}
              disabled={chatMode === 'ai' && isAiStreaming}
              style={{
                flex: 1,
                padding: '8px 11px',
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: T.bg,
                color: T.textPrimary,
                fontSize: 12.5,
                fontFamily: T.fontSans,
                outline: 'none',
                transition: 'border-color 0.15s',
                opacity: chatMode === 'ai' && isAiStreaming ? 0.5 : 1,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = T.accent)}
              onBlur={e => (e.currentTarget.style.borderColor = T.border)}
            />
            <button
              onClick={handleSubmit}
              disabled={!sendEnabled}
              title="Send"
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: sendEnabled ? T.accent : T.borderLight,
                border: 'none',
                cursor: sendEnabled ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
                flexShrink: 0,
              }}
            >
              <Send size={14} color={sendEnabled ? 'white' : T.textFaint} />
            </button>
          </div>
        </div>
      )}

      {/* ── Chat bubble ── */}
      <button
        className={`csf-chat-bubble${isPulsing ? ' csf-chat-pulse' : ''}`}
        onClick={() => setIsOpen(o => !o)}
        title={isOpen ? 'Close assistant' : 'Open CSF Compass Assistant'}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: T.accent,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          zIndex: 102,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
        }}
      >
        {isOpen
          ? <X size={22} color="white" />
          : <MessageCircle size={22} color="white" />
        }
      </button>
    </>
  );
}
