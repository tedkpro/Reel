import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, Youtube, Music, MessageCircle, Video, Plus, X, 
  Settings, Clock, Sparkles, Globe, Compass, RefreshCw, 
  Trash2, ExternalLink, ShieldAlert
} from 'lucide-react';

// Default shortcut configuration
const DEFAULT_SHORTCUTS = [
  { id: '1', name: 'YouTube', url: 'https://youtube.com', iconType: 'youtube', color: 'hover:text-red-400 hover:border-red-500/40' },
  { id: '2', name: 'Spotify', url: 'https://spotify.com', iconType: 'spotify', color: 'hover:text-green-400 hover:border-green-500/40' },
  { id: '3', name: 'Discord', url: 'https://discord.com', iconType: 'discord', color: 'hover:text-indigo-400 hover:border-indigo-500/40' },
  { id: '4', name: 'TikTok', url: 'https://tiktok.com', iconType: 'tiktok', color: 'hover:text-pink-400 hover:border-pink-500/40' },
];

const SEARCH_ENGINES = [
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { id: 'brave', name: 'Brave', url: 'https://search.brave.com/search?q=' },
];

interface Fish {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  flipped: boolean;
  fleeing: boolean;
  color: string;
  tailOffset: number;
}

const FISH_COLORS = [
  'rgba(120, 180, 255, 0.4)',
  'rgba(99, 230, 226, 0.45)',
  'rgba(147, 197, 253, 0.35)',
  'rgba(167, 139, 250, 0.35)',
  'rgba(56, 189, 248, 0.4)',
];

function generateFish(id: number, w: number, h: number): Fish {
  const goingRight = Math.random() > 0.5;
  const speed = 0.3 + Math.random() * 0.6;
  return {
    id,
    x: Math.random() * w,
    y: Math.random() * (h - 120) + 60,
    vx: goingRight ? speed : -speed,
    vy: (Math.random() - 0.5) * 0.3,
    size: 28 + Math.random() * 30,
    flipped: !goingRight,
    fleeing: false,
    color: FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)],
    tailOffset: Math.random() * 100,
  };
}

function FishSvg({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size * 0.5}
      viewBox="0 0 100 50"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="filter drop-shadow-[0_0_8px_rgba(77,159,255,0.4)] transition-opacity duration-300 hover:opacity-100"
    >
      <path d="M20 25 Q35 8 60 18 Q82 25 90 25 Q82 25 60 32 Q35 42 20 25 Z" />
      <path d="M20 25 L8 12 L12 25 L8 38 Z" />
      <circle cx="68" cy="22" r="2.5" fill={color} stroke="none" />
      <path d="M40 20 Q45 12 52 18" />
    </svg>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [fishCountTarget, setFishCountTarget] = useState(14);
  const [fish, setFish] = useState<Fish[]>([]);
  const [shortcuts, setShortcuts] = useState(() => {
    const saved = localStorage.getItem('reel_shortcuts');
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });
  const [selectedEngine, setSelectedEngine] = useState(() => {
    const saved = localStorage.getItem('reel_engine');
    return saved || 'duckduckgo';
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newShortcut, setNewShortcut] = useState({ name: '', url: '' });
  const [time, setTime] = useState(new Date());

  const containerRef = useRef<HTMLDivElement>(null);
  const fishRef = useRef<Fish[]>([]);
  const rafRef = useRef<number>(0);
  const idRef = useRef(0);

  // Sync shortcuts to local storage
  useEffect(() => {
    localStorage.setItem('reel_shortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  // Sync search engine
  useEffect(() => {
    localStorage.setItem('reel_engine', selectedEngine);
  }, [selectedEngine]);

  // Live Clock update
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Fish Population
  useEffect(() => {
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;
    const initial: Fish[] = [];
    for (let i = 0; i < fishCountTarget; i++) {
      initial.push(generateFish(i, w, h));
    }
    idRef.current = fishCountTarget;
    fishRef.current = initial;
    setFish(initial);
  }, []);

  // Handle fish target count changes
  useEffect(() => {
    const current = fishRef.current.length;
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 800;

    if (fishCountTarget > current) {
      const added: Fish[] = [];
      for (let i = 0; i < fishCountTarget - current; i++) {
        idRef.current += 1;
        added.push(generateFish(idRef.current, w, h));
      }
      fishRef.current = [...fishRef.current, ...added];
    } else if (fishCountTarget < current) {
      fishRef.current = fishRef.current.slice(0, fishCountTarget);
    }
  }, [fishCountTarget]);

  // Main Fish Animation Loop
  useEffect(() => {
    const animate = () => {
      const w = window.innerWidth || 1200;
      const h = window.innerHeight || 800;

      let respawnCount = 0;

      const updated = fishRef.current.map((f) => {
        let { x, y, vx, vy, fleeing } = f;

        if (fleeing) {
          const speed = 14;
          vx = vx > 0 ? speed : -speed;
          vy *= 0.2;
        }

        x += vx;
        y += vy;

        if (!fleeing) {
          vy += (Math.random() - 0.5) * 0.04;
          vy = Math.max(-0.6, Math.min(0.6, vy));
          if (y < 40) { y = 40; vy = Math.abs(vy); }
          if (y > h - 40) { y = h - 40; vy = -Math.abs(vy); }
        }

        // Handle fleeing fish off-screen removal and respawn tag
        if (fleeing && (x < -f.size * 2 || x > w + f.size * 2)) {
          respawnCount++;
          return null;
        }

        // Screen wrap for regular swimming fish
        if (!fleeing) {
          if (x < -f.size * 2) x = w + f.size;
          if (x > w + f.size * 2) x = -f.size;
        }

        return { ...f, x, y, vx, vy };
      }).filter(Boolean) as Fish[];

      // Respawn startled fish from screen edge
      if (respawnCount > 0) {
        for (let i = 0; i < respawnCount; i++) {
          idRef.current += 1;
          const newF = generateFish(idRef.current, w, h);
          // Spawn just beyond screen edge
          newF.x = newF.vx > 0 ? -newF.size : w + newF.size;
          updated.push(newF);
        }
      }

      fishRef.current = updated;
      setFish(updated);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleFishClick = useCallback((id: number) => {
    fishRef.current = fishRef.current.map((f) => {
      if (f.id !== id) return f;
      const w = window.innerWidth || 1200;
      const goRight = f.x < w / 2;
      return { ...f, fleeing: true, vx: goRight ? 1 : -1, flipped: !goRight };
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const engineObj = SEARCH_ENGINES.find(e => e.id === selectedEngine) || SEARCH_ENGINES[0];
      window.location.href = `${engineObj.url}${encodeURIComponent(query.trim())}`;
    }
  };

  const addShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcut.name.trim() || !newShortcut.url.trim()) return;

    let formattedUrl = newShortcut.url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const item = {
      id: Date.now().toString(),
      name: newShortcut.name.trim(),
      url: formattedUrl,
      iconType: 'globe',
      color: 'hover:text-blue-400 hover:border-blue-500/40',
    };

    setShortcuts([...shortcuts, item]);
    setNewShortcut({ name: '', url: '' });
    setShowAddModal(false);
  };

  const removeShortcut = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShortcuts(shortcuts.filter((s) => s.id !== id));
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-5 h-5" />;
      case 'spotify': return <Music className="w-5 h-5" />;
      case 'discord': return <MessageCircle className="w-5 h-5" />;
      case 'tiktok': return <Video className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-between px-5 py-8 text-white select-none font-sans"
    >
      {/* Deep Sea Ambient Background */}
      <div
        className="absolute inset-0 -z-20 pointer-events-none"
        style={{
          backgroundColor: '#050d18',
          backgroundImage: `
            radial-gradient(#4d9fff, rgba(77,159,255,0.12) 1px, transparent 35px),
            radial-gradient(#ffffff, rgba(255,255,255,0.08) 1.5px, transparent 40px)
          `,
          backgroundSize: '500px 500px, 350px 350px',
          backgroundPosition: '0 0, 90px 140px',
        }}
      />

      {/* Floating Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none -z-20 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-600/[0.08] blur-[120px] pointer-events-none -z-20" />

      {/* Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between z-20">
        <div className="flex items-center gap-3 bg-blue-950/30 backdrop-blur-md px-4 py-2 rounded-full border border-blue-500/10 shadow-lg">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold tracking-wide text-blue-100">{formattedTime}</span>
          <span className="text-xs text-blue-300/50">|</span>
          <span className="text-xs text-blue-200/70">{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 rounded-full bg-blue-950/30 backdrop-blur-md border border-blue-500/10 text-blue-300 hover:text-white hover:border-blue-400/30 transition-all duration-200 shadow-lg"
            title="Aquarium Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Fish Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {fish.map((f) => (
          <div
            key={f.id}
            className="absolute pointer-events-auto cursor-pointer transition-transform duration-75"
            style={{
              left: `${f.x}px`,
              top: `${f.y}px`,
              transform: f.flipped ? 'scaleX(-1)' : 'scaleX(1)',
            }}
            onClick={() => handleFishClick(f.id)}
          >
            <FishSvg size={f.size} color={f.color} />
          </div>
        ))}
      </div>

      {/* Main Center Content */}
      <main className="w-full max-w-lg flex flex-col items-center z-10 my-auto">
        {/* Brand */}
        <div className="relative group cursor-default mb-8">
          <h1
            className="text-8xl font-black text-white tracking-tighter select-none transition-transform duration-300 group-hover:scale-105"
            style={{ textShadow: '0 0 35px rgba(77,159,255,0.6), 0 0 10px rgba(255,255,255,0.4)' }}
          >
            reel
          </h1>
          <span className="absolute -bottom-2 right-1 text-xs tracking-widest text-cyan-400/80 font-mono uppercase">
            aquarium tab
          </span>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSubmit}
          className={`relative w-full mb-8 flex items-center rounded-full px-2 py-1.5 border transition-all duration-300 backdrop-blur-md ${
            focused
              ? 'bg-blue-950/60 border-blue-400/60 shadow-[0_0_30px_rgba(77,159,255,0.25)]'
              : 'bg-blue-950/30 border-blue-400/15 hover:border-blue-400/30 shadow-xl'
          }`}
        >
          <Search
            className={`ml-4 w-5 h-5 transition-colors ${focused ? 'text-blue-400' : 'text-blue-200/40'}`}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={`Search ${SEARCH_ENGINES.find(e => e.id === selectedEngine)?.name}...`}
            autoComplete="off"
            autoFocus
            className="flex-1 bg-transparent border-none px-4 py-3 text-white text-base outline-none placeholder:text-blue-200/30"
          />
          <button
            type="submit"
            className="mr-1 px-5 py-2.5 rounded-full bg-blue-500/15 hover:bg-blue-500/30 text-xs font-semibold tracking-wider uppercase text-blue-300 hover:text-white border border-blue-400/20 transition-all duration-200"
          >
            Go
          </button>
        </form>

        {/* Shortcuts Grid */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full">
          {shortcuts.map(({ id, name, url, iconType, color }) => (
            <div key={id} className="relative group">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center text-blue-200/50 hover:text-white text-xs font-medium tracking-wide transition-all duration-200 hover:-translate-y-1.5 ${color}`}
              >
                <div className="w-13 h-13 rounded-2xl bg-blue-950/30 backdrop-blur-md border border-blue-400/15 flex items-center justify-center mb-2 transition-all duration-200 group-hover:bg-blue-500/20 group-hover:border-blue-400/50 group-hover:shadow-[0_0_20px_rgba(77,159,255,0.3)]">
                  {renderIcon(iconType)}
                </div>
                <span className="truncate max-w-[70px] text-center">{name}</span>
              </a>
              {/* Shortcut Remove Button */}
              <button
                onClick={(e) => removeShortcut(id, e)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md"
                title="Remove Shortcut"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Add Shortcut Trigger */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex flex-col items-center text-blue-200/40 hover:text-blue-300 text-xs font-medium tracking-wide transition-all duration-200 hover:-translate-y-1.5 group"
          >
            <div className="w-13 h-13 rounded-2xl bg-blue-950/20 border border-dashed border-blue-400/20 flex items-center justify-center mb-2 transition-all duration-200 group-hover:bg-blue-500/10 group-hover:border-blue-400/40">
              <Plus className="w-5 h-5" />
            </div>
            <span>Add</span>
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-5xl flex items-center justify-between text-xs text-blue-300/40 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400/60" />
          <span>Click fish to frighten them off-screen</span>
        </div>
        <div>
          <span>{fish.length} fish active</span>
        </div>
      </footer>

      {/* Modal: Add Shortcut */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-blue-950/90 border border-blue-500/20 p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-blue-300/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Add Custom Shortcut</h3>
            <form onSubmit={addShortcut} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300/70 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GitHub"
                  value={newShortcut.name}
                  onChange={(e) => setNewShortcut({ ...newShortcut, name: e.target.value })}
                  className="w-full bg-blue-900/40 border border-blue-400/20 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-300/70 mb-1">
                  URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="github.com"
                  value={newShortcut.url}
                  onChange={(e) => setNewShortcut({ ...newShortcut, url: e.target.value })}
                  className="w-full bg-blue-900/40 border border-blue-400/20 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-blue-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all"
                >
                  Save Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Drawer / Panel */}
      {showSettings && (
        <div className="fixed top-20 right-5 z-40 w-80 rounded-3xl bg-blue-950/90 border border-blue-500/20 p-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between mb-4 border-b border-blue-500/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-400" />
              Aquarium & Search Settings
            </h3>
            <button onClick={() => setShowSettings(false)} className="text-blue-300/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Search Engine Selector */}
            <div>
              <label className="block text-xs font-semibold text-blue-300/70 mb-2 uppercase tracking-wider">
                Default Search Engine
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SEARCH_ENGINES.map((engine) => (
                  <button
                    key={engine.id}
                    onClick={() => setSelectedEngine(engine.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                      selectedEngine === engine.id
                        ? 'bg-blue-500/20 border-blue-400 text-white shadow-md'
                        : 'bg-blue-900/30 border-blue-500/10 text-blue-300/60 hover:border-blue-500/30'
                    }`}
                  >
                    {engine.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Fish Population Density */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-blue-300/70 uppercase tracking-wider">
                  Fish Population
                </label>
                <span className="text-xs font-mono text-cyan-400 font-bold">{fishCountTarget}</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                value={fishCountTarget}
                onChange={(e) => setFishCountTarget(Number(e.target.value))}
                className="w-full accent-blue-400 cursor-pointer"
              />
            </div>

            {/* Reset Defaults */}
            <button
              onClick={() => {
                setShortcuts(DEFAULT_SHORTCUTS);
                setSelectedEngine('duckduckgo');
                setFishCountTarget(14);
              }}
              className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Settings to Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
