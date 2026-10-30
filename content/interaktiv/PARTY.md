# „Hálózatépítők” – online P2P strategy board game (design spec v2)

Original resource / trade / build board game for 2–5 players, each on their own phone, peer-to-peer.
Inspired by the resource-trading-building GENRE (Catan-like depth), but NOT a copy: no hex tiles, no robber,
no dice-numbered tiles. Theme: electricians wiring a small town. The exam question bank drives the economy.

## Setup / roles
- One phone creates a room (host = authoritative state + also a player). Others join with a 4-letter code or QR
  (`party.html#ABCD`), name + avatar colour. Optional big screen: `party.html?board=ABCD` shows the board only.
- Networking: PeerJS WebRTC (pinned CDN), host peer id `vlab-party-<CODE>`, host-authoritative, sanitised state
  broadcast, reconnect by localStorage token, `?local=1` BroadcastChannel mode for Playwright tests.
- Each phone shows the shared map (pinch/scroll ok, but fits portrait by default) + its own hand + action bar.

## Map
- A square grid town, 7×7 intersections (6×6 blocks). Lots/buildings sit in blocks: Ház (1 VP), Iskola (2 VP),
  Kórház (3 VP), Üzem (2 VP, gives +1 Munkaóra each round once powered), Napelempark (1 VP, gives +1 Réz each round).
  Layout randomised per match with a fair distribution; each player starts with a Transzformátor at a corner/edge
  intersection (setup snake-draft placement like a draft: 1→N, N→1).
- Cables are built on grid EDGES connected to your network (your transformer or your existing cables).
  A building is "connected" when one of its block's 4 corner intersections touches your network; then you may
  power it (cost below) and it becomes yours (one owner per building).
- Elosztó (substation) on an intersection of your network: extends reach (your network may jump one empty edge) and
  +1 VP. Max 2 per player.

## Resources (4, mapped to the 4 exam parts)
- 🔩 Szerelvény ← I. Alkatrész és anyagismeret
- ⏱️ Munkaóra ← II. Technológiai ismeret
- 🟠 Réz ← III. Számítási feladatok
- 🛡️ Védelem ← IV. Villamos biztonsági ismeret

## Turn (active player; ~60–90 s, with a soft timer)
1. **Munkavégzés (work):** choose a category (I–IV) and a difficulty (Könnyű = 1 resource, Nehéz = 2 + a card chance).
   A question from that part appears on EVERY phone (single-choice, 4 options, from data/questions.js;
   difficulty 1 for Könnyű, 2–3 for Nehéz). Active player: correct → resources of that category.
   **Kollégák besegítenek:** other players answer simultaneously; each correct non-active player gets 1 of that
   resource only if the active player was WRONG (so helpers profit from others' mistakes) — keeps everyone engaged.
   After the reveal the explanation is shown briefly (learning!).
2. **Kereskedés (trade):** propose offers to all ("2 🟠 → 1 🛡️"); others accept/decline on their phones; first accept
   executes. Nagyker: 3 of one → 1 of any. Elosztó owners trade 2:1 in one resource of their choice.
3. **Építés (build):**
   - Kábelszakasz: 1 🟠 + 1 ⏱️
   - Épület bekapcsolása: Ház 1 🔩 + 1 🛡️; Iskola/Üzem 2 🔩 + 1 🛡️ + 1 ⏱️; Kórház 2 🔩 + 2 🛡️ + 1 🟠; Napelempark 1 🔩 + 1 🟠 + 1 🛡️
   - Elosztó: 2 🟠 + 1 🔩 + 1 🛡️
   - Fejlesztőkártya húzása: 1 of each except 🔩 (🟠 ⏱️ 🛡️)
4. End turn.

## Events (every 3rd turn, a card from the event deck, announced with drama + Feri voice)
- ⚡ **Villámcsapás** on a random district (quarter of the map): each player with cables there loses one cable
  segment (their choice) unless they own a Túlfeszültség-védelem card or an Elosztó in that district.
- 🧑‍🔧 **Hatósági ellenőrzés:** every player answers one Part IV question simultaneously; wrong → pay 1 resource
  of choice to the bank; correct → +1 🛡️.
- 📉 **Rézár-emelkedés:** cable costs +1 🟠 until the next event.
- 🌞 **Napos nap:** Napelempark owners +2 🟠.
- 🔧 **Szerszámkölcsön:** the player with the fewest VP takes 1 resource of choice from the leader.

## Development cards (from building action or Nehéz work)
- 🛡️ Túlfeszültség-levezető (blocks one Villámcsapás loss)
- 🧰 Szerszámláda (+2 resources of choice)
- 🚧 Engedélyügyintézés (build 2 cables for free)
- 📜 Mesterlevél (+1 VP, hidden until game end)
- ⚡ Tesla-ötlet (look at the next question's category… simpler: next work action gives double)

## Scoring / end
- First to **10 VP** on their turn wins. VP: buildings, Elosztó (+1), Mesterlevél (+1),
  **Leghosszabb hálózat** (longest continuous cable path ≥5: +2, transferable),
  **Biztonsági bajnok** (most correct Part IV answers, ≥3: +2, transferable).
- Podium with stats (correct answers per part, longest network, buildings), "Visszavágó" button.

## UX
- Mobile-first: map as SVG fitting phone width, tap an edge/building to build (highlight legal moves),
  bottom action bar with resources counters and big buttons; trade sheet; event overlay; log ticker.
- Animated: cables "light up" when built, buildings glow when powered, lightning strike animation, resource fly-ins.
- Reuse sfx/voice from game/ (Fázis Feri as narrator, lines for events if they fit). Hungarian UI, no alert().
- Static files only: public/interaktiv/party.html + public/interaktiv/party/*. Load data/questions.js; not app.js.
