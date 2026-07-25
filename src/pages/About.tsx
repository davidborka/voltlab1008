/** Névjegy, forrásmegjelölés, biztonsági tájékoztató. */
import { Keyboard, ShieldAlert } from 'lucide-react';
import { Panel } from '../components/ui';

export function About() {
  return (
    <div className="tech-grid flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[820px] px-4 py-8 sm:px-6">
        <div className="eyebrow mb-2">Névjegy</div>
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">VOLT LAB 1008</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-dim">
          Interaktív villanyszerelő gyakorlati vizsgafelkészítő. Böngészőben fut, szerver nélkül;
          semmilyen adat nem hagyja el a gépedet. A haladás, a téma és a kipipált ellenőrzési pontok
          kizárólag ebben a böngészőben tárolódnak.
        </p>

        <div className="mt-5 space-y-3">
          <Panel eyebrow="Fontos" title="Biztonsági tájékoztató">
            <div className="flex gap-3">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-bad" />
              <div className="space-y-2 text-[13px] leading-relaxed text-ink-dim">
                <p>
                  Ez gyakorlófelület <strong className="text-ink">feszültségmentes vizsgatáblához</strong>.
                  A szimuláció szándékosan egyszerűsít: nem modellez valós áramerősséget,
                  impedanciát, hőhatást és íveléses jelenséget.
                </p>
                <p>
                  Valóságos berendezésen munkát csak feszültségmentesített, a visszakapcsolás ellen
                  biztosított állapotban, szakképzettséggel és felügyelettel szabad végezni. Mérést
                  csak megfelelő műszerrel, az érvényes eljárás szerint.
                </p>
                <p>
                  Az alkalmazás <strong className="text-ink">nem helyettesíti</strong> az oktatót, a
                  vonatkozó szabványt, a jogszabályt és a hivatalos vizsgautasítást. A benne szereplő
                  értékek oktatási példák, nem megfelelőségi követelmények.
                </p>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Honnan jön" title="Forrás és feldolgozás">
            <div className="space-y-2 text-[13px] leading-relaxed text-ink-dim">
              <p>
                Az A, B, C és D feladat a komplex szakmai vizsga gyakorlati feladatlapjainak
                rajzaiból készült (MESTO CSOPORT Kft., 2021. 11. 22.). A rajzokat nem képként
                mutatjuk be: a kapcsolási logikát újraépítettük interaktív modellként, az eredeti lap
                pedig összehasonlításként megnyitható a munkafelületen.
              </p>
              <p>
                Az E, F és G feladat kiegészítés, nem a fenti lapokból származik: egyfázisú
                motorindítás, valamint háromfázisú és egyfázisú mérőhely.
              </p>
              <p>
                Ahol a rajz nem ad egyértelmű adatot - például a kismegszakítók áramértéke az A és B
                feladatban -, ott nem találtunk ki értéket. Ezeket a feladat Áttekintés paneljén
                külön jelöljük, és feltételezés-kalkulátort adunk hozzá. A részletes forráselemzés a
                tárolóban található <span className="mono">docs/source-analysis.md</span> fájlban van.
              </p>
            </div>
          </Panel>

          <Panel eyebrow="Kezelés" title="Billentyűk és mozdulatok">
            <div className="flex gap-3">
              <Keyboard size={18} className="mt-0.5 shrink-0 text-arc" />
              <ul className="grid flex-1 gap-x-6 gap-y-1.5 text-[12.5px] text-ink-dim sm:grid-cols-2">
                <Li k="Ctrl / Cmd + K">parancspaletta</Li>
                <Li k="Tab, Enter">sorkapocs kijelölése és összekötése</Li>
                <Li k="Görgő">nagyítás a tábla fölött</Li>
                <Li k="Húzás">a tábla mozgatása</Li>
                <Li k="Shift + húzás">a tábla 3D forgatása</Li>
                <Li k="Csippentés">nagyítás érintőn</Li>
                <Li k="Jobb gomb a kábelen">törlés</Li>
                <Li k="Koppintás a kábelen">törlés és rendezés gomb</Li>
              </ul>
            </div>
          </Panel>

          <Panel eyebrow="Nyílt eszközök" title="Mire épül">
            <p className="text-[13px] leading-relaxed text-ink-dim">
              React, TypeScript, Vite, Tailwind CSS, Lucide ikonok. A rajzok natív SVG-k, a
              szimuláció saját, determinisztikus csomóponti megoldó. Nincs backend, adatbázis,
              analitika és külső szolgáltatás.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Li({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="mono shrink-0 rounded border border-line px-1.5 py-0.5 text-[10.5px]">{k}</span>
      {children}
    </li>
  );
}
