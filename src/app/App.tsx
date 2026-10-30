/** Alkalmazásváz: hash-alapú navigáció, téma, parancspaletta. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, ClipboardCheck, Command, Info, LayoutGrid, ListChecks, Moon, Search, Sun, Users, Zap } from 'lucide-react';
import { Button, Modal, cx, useLocal } from '../components/ui';
import { TASKS, TASK_ORDER } from '../data/tasks';
import { Dashboard } from '../pages/Dashboard';
import { Workspace } from '../pages/Workspace';
import { Library } from '../pages/Library';
import { Inspection } from '../pages/Inspection';
import { About } from '../pages/About';

export type Route =
  | { name: 'dashboard' }
  | { name: 'task'; id: string; exam?: boolean }
  | { name: 'library' }
  | { name: 'inspection' }
  | { name: 'interactive' }
  | { name: 'game' }
  | { name: 'party' }
  | { name: 'about' };

function parseHash(): Route {
  const h = location.hash.replace(/^#\/?/, '');
  if (h.startsWith('feladat/')) {
    const [raw, sub] = h.slice(8).split('/');
    const id = raw.toUpperCase();
    if (TASKS[id]) return { name: 'task', id, exam: sub === 'vizsga' };
  }
  if (h === 'keszulekek') return { name: 'library' };
  if (h === 'ellenorzes') return { name: 'inspection' };
  if (h === 'interaktiv') return { name: 'interactive' };
  if (h === 'jatek') return { name: 'game' };
  if (h === 'parti') return { name: 'party' };
  if (h === 'rolunk') return { name: 'about' };
  return { name: 'dashboard' };
}

export function go(route: Route) {
  const map: Record<Route['name'], string> = {
    dashboard: '',
    task: '',
    library: 'keszulekek',
    inspection: 'ellenorzes',
    interactive: 'interaktiv',
    game: 'jatek',
    party: 'parti',
    about: 'rolunk',
  };
  location.hash = route.name === 'task' ? `/feladat/${route.id}${route.exam ? '/vizsga' : ''}` : `/${map[route.name]}`;
}

export function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [theme, setTheme] = useLocal<'dark' | 'light'>('vl.theme', 'dark');
  const [done, setDone] = useLocal<string[]>('vl.done', []);
  const [last, setLast] = useLocal<string | null>('vl.last', null);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const on = () => setRoute(parseHash());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (route.name === 'task') setLast(route.id);
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const markDone = useCallback(
    (id: string) => {
      if (!done.includes(id)) setDone([...done, id]);
    },
    [done, setDone]
  );

  const nav = [
    { name: 'dashboard' as const, label: 'Feladatok', icon: LayoutGrid },
    { name: 'interactive' as const, label: 'Interaktív vizsga', icon: ListChecks },
    { name: 'game' as const, label: 'Legyen Ön is villanyszerelő!', icon: Zap },
    { name: 'party' as const, label: 'Hálózatépítők (online)', icon: Users },
    { name: 'library' as const, label: 'Készülékek', icon: BookOpen },
    { name: 'inspection' as const, label: 'Ellenőrzés', icon: ClipboardCheck },
    { name: 'about' as const, label: 'Névjegy', icon: Info },
  ];

  return (
    <div className="app-shell flex h-[100dvh] flex-col overflow-hidden">
      <header className="sticky top-0 z-40 flex flex-none items-center gap-2 border-b border-line bg-surface/90 px-3 py-2.5 backdrop-blur-md no-print sm:gap-4 sm:px-5">
        <button
          onClick={() => go({ name: 'dashboard' })}
          className="flex items-center gap-2.5 rounded-lg pr-1 text-left"
          aria-label="Vissza a főoldalra"
        >
          <span className="grid h-8 w-8 place-items-center rounded-[9px] border border-arc/40 bg-arc/10 text-arc">
            <Zap size={17} strokeWidth={2.4} />
          </span>
          <span className="leading-none">
            <span className="block whitespace-nowrap text-[13.5px] font-extrabold tracking-[-0.02em] sm:text-[15px]">VOLT LAB 1008</span>
            <span className="eyebrow hidden sm:block">gyakorlati vizsgafelkészítő</span>
          </span>
        </button>

        <nav className="ml-auto flex items-center gap-1">
          {nav.map((n) => (
            <button
              key={n.name}
              onClick={() => go({ name: n.name })}
              aria-current={route.name === n.name ? 'page' : undefined}
              className={cx(
                'inline-flex h-9 items-center gap-2 rounded-[10px] border px-2.5 text-[12.5px] font-semibold transition-colors',
                route.name === n.name
                  ? 'border-line bg-surface-3 text-ink'
                  : 'border-transparent text-ink-dim hover:bg-surface-3/60 hover:text-ink'
              )}
            >
              <n.icon size={15} />
              <span className="hidden md:inline">{n.label}</span>
            </button>
          ))}
          <Button size="sm" tone="ghost" onClick={() => setPalette(true)} aria-label="Parancspaletta">
            <Search size={15} />
            <span className="mono hidden text-[10px] lg:inline">Ctrl K</span>
          </Button>
          <Button
            size="sm"
            tone="ghost"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Világos téma' : 'Sötét téma'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </Button>
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {route.name === 'dashboard' && <Dashboard done={done} last={last} />}
        {route.name === 'task' && <Workspace taskId={route.id} startExam={!!route.exam} onComplete={markDone} completed={done.includes(route.id)} />}
        {route.name === 'library' && <Library />}
        {route.name === 'inspection' && <Inspection />}
        {route.name === 'interactive' && <InteractiveExam />}
        {route.name === 'game' && <InteractiveExam hash="jatek" />}
        {route.name === 'party' && <PartyGame />}
        {route.name === 'about' && <About />}
      </main>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

/* A központi interaktív vizsga gyakorlója önálló, build nélküli oldal (public/interaktiv/),
   mert szándékosan a KRÉTA vizsgafelületet utánozza, nem a VOLT LAB témáját. */
function InteractiveExam({ hash }: { hash?: string }) {
  return (
    <iframe
      key={hash ?? 'exam'}
      allow="autoplay"
      src={`${import.meta.env.BASE_URL}interaktiv/index.html${hash ? `#${hash}` : ''}`}
      title="Interaktív vizsga gyakorló"
      className="h-full w-full flex-1 border-0 bg-white"
    />
  );
}

/* Online társasjáték (public/interaktiv/party.html): a telefonok PeerJS-sel, közvetlenül kapcsolódnak. */
function PartyGame() {
  return (
    <iframe
      allow="autoplay; fullscreen; clipboard-write; web-share"
      src={`${import.meta.env.BASE_URL}interaktiv/party.html`}
      title="Hálózatépítők – online társasjáték"
      className="h-full w-full flex-1 border-0 bg-[#07090d]"
    />
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose(): void }) {
  const [q, setQ] = useState('');
  const items = useMemo(() => {
    const list = [
      ...TASK_ORDER.map((id) => ({
        label: `${id} - ${TASKS[id].title}`,
        hint: TASKS[id].subtitle,
        run: () => go({ name: 'task', id }),
      })),
      { label: 'Interaktív vizsga', hint: 'KRÉTA-szerű tesztvizsga, 808 kérdés', run: () => go({ name: 'interactive' }) },
      { label: 'Legyen Ön is villanyszerelő!', hint: 'kvízjáték óvodástól Einsteinig', run: () => go({ name: 'game' }) },
      { label: 'Hálózatépítők (online)', hint: 'társasjáték telefonokon, 2–5 fő', run: () => go({ name: 'party' }) },
      { label: 'Készülékkönyvtár', hint: 'szimbólumok és kapcsok', run: () => go({ name: 'library' }) },
      { label: 'Ellenőrzési lista', hint: 'mérés és dokumentálás', run: () => go({ name: 'inspection' }) },
      { label: 'Névjegy és biztonság', hint: 'forrás, felelősség', run: () => go({ name: 'about' }) },
    ];
    const s = q.trim().toLowerCase();
    return s ? list.filter((i) => (i.label + i.hint).toLowerCase().includes(s)) : list;
  }, [q]);

  useEffect(() => {
    if (open) setQ('');
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Ugrás">
      <div className="mb-3 flex items-center gap-2 rounded-[11px] border border-line bg-surface px-3">
        <Command size={15} className="text-ink-faint" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Feladat vagy oldal neve"
          aria-label="Keresés"
          className="h-11 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-faint"
        />
      </div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.label}>
            <button
              onClick={() => {
                i.run();
                onClose();
              }}
              className="flex w-full items-baseline justify-between gap-3 rounded-[10px] border border-transparent px-3 py-2.5 text-left hover:border-line hover:bg-surface-3/60"
            >
              <span className="text-[13.5px] font-semibold">{i.label}</span>
              <span className="mono text-[10.5px] text-ink-faint">{i.hint}</span>
            </button>
          </li>
        ))}
        {!items.length && <li className="px-3 py-6 text-center text-[13px] text-ink-faint">Nincs találat.</li>}
      </ul>
    </Modal>
  );
}
