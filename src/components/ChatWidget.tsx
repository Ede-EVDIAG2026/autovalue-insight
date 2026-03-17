import { useState, useRef, useEffect, useCallback } from 'react';

type Role = 'user' | 'assistant';
type Message = { role: Role; content: string };

const WELCOME = 'Szia! Az AutoValue AI asszisztense vagyok. Segíthetek az értékbecslésben, piaci árakban vagy a járműpiaci trendekben. Mit kérdezel?';
import { MARKET_API } from '@/lib/marketApi';
const API = `${MARKET_API}/chat`;
const MAX_HISTORY = 10;

const EV_DIAG_SYSTEM_CONTEXT = `Ha a felhasználó az EV DIAG platformról kérdez, vagy a "Mutasd be az EV DIAG platformot!" üzenetet küldi, válaszolj ezzel a részletes bemutatóval:

🚗⚡ Az EV DIAG – Európa első magyar fejlesztésű AI-alapú elektromos járműértékelő platformja.

Miközben az autóvásárlók milliói találgatnak, az EV DIAG tudja a választ.

**Mi az EV DIAG?**
Mérnökök által épített, mesterséges intelligenciával vezérelt értékbecslési rendszer, amely kizárólag elektromos és hibrid járművekre (BEV/PHEV/HEV/MHEV) specializált – 2013-tól gyártott járművekre.

**Hogyan működik?**
Egyetlen VIN szám megadásával 5 AI ügynök dolgozik párhuzamosan:

🔍 VIN Dekódolás – NHTSA adatbázis alapján azonosítja a pontos gyártmányt, modellt, felszereltséget
🔧 Trim & Felszereltség Intelligencia – értéknövelő és értékcsökkentő tényezők azonosítása
⚡ EV Specialista – akkumulátor állapot, töltési képességek, szoftver verziók elemzése
🛡️ Visszahívás & Biztonság – nyitott NHTSA visszahívások és panaszok vizsgálata
💶 Értékszintézis – valós AutoScout24 EU piaci adatok alapján (8.000+ aktív hirdetés, 5 ország)

**Miért egyedülálló Közép-Európában?**
Az EV DIAG nem becsléssel dolgozik – valódi, napi frissítésű EU piaci adatokat használ. Látja a médián árat, a P25-P75 sávot, és megmutatja a hasonló, ténylegesen elérhető ajánlatokat.

**Kinek szól?**
🏢 Márkakereskedők és flottakezelők – gyors, megbízható értékbecslés
🔬 Biztosítók és független értékbecslők – adatvezérelt döntéstámogatás
👤 Tudatos vásárlók és eladók – ne fizessen túl, ne adjon el olcsón
🏦 Lízingcégek és pénzintézetek – kockázatelemzés új alapokon

**A különbség, amit érez:**
Hagyományos értékbecslő: általános piaci átlag, emberi szubjektivitás.
EV DIAG: az Ön konkrét járművének VIN-je alapján, valós EU piaci összehasonlítással, másodpercek alatt.

Magyar mérnöki csapat. Európai piac. Mérnöki precizitás. 🇭🇺

Szeretne kipróbálni egy konkrét VIN elemzést?`;

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingAutoMessage = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Listen for custom event to open chat and send a message
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setOpen(true);
      pendingAutoMessage.current = detail;
    };
    window.addEventListener('evdiag-chat-send', handler);
    return () => window.removeEventListener('evdiag-chat-send', handler);
  }, []);

  // When chat opens with a pending message, send it
  useEffect(() => {
    if (open && pendingAutoMessage.current && !loading) {
      const text = pendingAutoMessage.current;
      pendingAutoMessage.current = null;
      const timer = setTimeout(() => {
        const userMsg: Message = { role: 'user', content: text };
        const history = [...messages, userMsg].slice(-MAX_HISTORY);
        setMessages(history);
        setLoading(true);
        sendToApi(history);
      }, 400);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const sendToApi = useCallback(async (history: Message[]) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const systemMsg = { role: 'system' as const, content: EV_DIAG_SYSTEM_CONTEXT };
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ messages: [systemMsg, ...history.map(m => ({ role: m.role, content: m.content }))] }),
        signal: controller.signal,
        mode: 'cors',
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant' as const, content: (data.reply || 'Nincs válasz.') as string }].slice(-MAX_HISTORY));
    } catch {
      setMessages(prev => [...prev, { role: 'assistant' as const, content: 'Átmeneti hiba, próbáld újra.' }].slice(-MAX_HISTORY));
    } finally {
      setLoading(false);
    }
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    const history = [...messages, userMsg].slice(-MAX_HISTORY);
    setMessages(history);
    setLoading(true);
    sendToApi(history);
  }, [input, loading, messages, sendToApi]);

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Chat megnyitása"
        className="fixed z-[9999] flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{
          bottom: 24, right: 24, width: 56, height: 56,
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={loading ? '' : 'animate-pulse'}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed z-[9999] flex flex-col rounded-2xl shadow-2xl border border-border overflow-hidden"
          style={{ bottom: 90, right: 24, width: 360, height: 480, background: 'hsl(var(--card))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
          >
            <span className="text-sm font-semibold text-white">AutoValue Asszisztens 🤖</span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white" aria-label="Bezárás">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2" style={{ scrollBehavior: 'smooth' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                  style={m.role === 'user' ? { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' } : undefined}
                >
                  {renderMarkdown(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground animate-pulse">
                  ...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border px-3 py-2 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Írj üzenetet..."
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
            >
              Küldés
            </button>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-muted-foreground py-1 border-t border-border">
            Powered by Claude AI · EV DIAG
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
