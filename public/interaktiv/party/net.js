'use strict';
// Transport: PeerJS WebRTC (default) or BroadcastChannel between tabs (?local=1, for tests).
// Host: Net.host(code, {open(cid), msg(cid, m), close(cid)}) → {send(cid, m), close()}
// Client: Net.join(code, {msg(m), close()}) → Promise<{send(m), close()}>; rejects 'noroom' | 'neterr'
const Net = (() => {
  const LOCAL = new URLSearchParams(location.search).has('local');
  const PEER_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
  const pid = code => 'vlab-party-' + code;
  let peerLoading = null;
  const loadPeer = () => peerLoading ||= new Promise((ok, bad) => {
    if (window.Peer) return ok();
    const s = document.createElement('script'); s.src = PEER_URL; s.onload = ok; s.onerror = () => { peerLoading = null; bad('neterr'); };
    document.head.append(s);
  });
  const rid = () => Math.random().toString(36).slice(2, 10);

  function hostLocal(code, h) {
    const bc = new BroadcastChannel(pid(code)), known = new Set();
    bc.onmessage = ({ data: { from, to, m } }) => {
      if (to !== 'host') return;
      if (!known.has(from)) { known.add(from); h.open(from); }
      if (m.type === 'bye') { known.delete(from); h.close(from); return; }
      h.msg(from, m);
    };
    bc.postMessage({ from: 'host', to: '*', m: { type: 'hostup' } }); // tells phones the board (re)started
    return Promise.resolve({ send(cid, m) { bc.postMessage({ from: 'host', to: cid, m }); }, close() { bc.close(); } });
  }
  function joinLocal(code, h) {
    return new Promise((ok, bad) => {
      const bc = new BroadcastChannel(pid(code)), me = rid();
      const api = { send(m) { bc.postMessage({ from: me, to: 'host', m }); }, close() { api.send({ type: 'bye' }); bc.close(); } };
      let up = false;
      const t = setTimeout(() => { if (!up) { bc.close(); bad('noroom'); } }, 2500);
      bc.onmessage = ({ data: { to, m } }) => {
        if (to !== me && to !== '*') return;
        if (!up && m.type === 'hi') { up = true; clearTimeout(t); ok(api); return; }
        if (up) h.msg(m);
      };
      api.send({ type: 'hello' });
    });
  }

  async function hostPeer(code, h) {
    await loadPeer();
    return new Promise((ok, bad) => {
      const peer = new window.Peer(pid(code), { debug: 0 }), conns = new Map();
      let opened = false;
      peer.on('open', () => { opened = true; ok(api); });
      peer.on('error', e => { if (!opened) { peer.destroy(); bad(e.type === 'unavailable-id' ? 'taken' : 'neterr'); } });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch { /* destroyed */ } }); // lost the broker; data channels stay up
      peer.on('connection', conn => {
        const cid = conn.peer + ':' + conn.connectionId;
        conn.on('open', () => { conns.set(cid, conn); h.open(cid); });
        conn.on('data', m => h.msg(cid, m));
        conn.on('close', () => { conns.delete(cid); h.close(cid); });
        conn.on('error', () => {});
      });
      const api = { send(cid, m) { const c = conns.get(cid); if (c?.open) try { c.send(m); } catch { /* closing */ } }, close() { peer.destroy(); } };
    });
  }
  async function joinPeer(code, h) {
    await loadPeer();
    return new Promise((ok, bad) => {
      const peer = new window.Peer({ debug: 0 });
      let up = false;
      const fail = why => { if (up) return; clearTimeout(t); peer.destroy(); bad(why); };
      const t = setTimeout(() => fail('neterr'), 15000);
      peer.on('error', e => fail(e.type === 'peer-unavailable' ? 'noroom' : 'neterr'));
      peer.on('open', () => {
        const conn = peer.connect(pid(code), { reliable: true, serialization: 'json' });
        conn.on('open', () => { up = true; clearTimeout(t); ok({ send(m) { if (conn.open) try { conn.send(m); } catch { /* closing */ } }, close() { peer.destroy(); } }); });
        conn.on('data', m => { if (m.type !== 'hi') h.msg(m); });
        conn.on('close', () => { if (up) h.close(); });
      });
    });
  }
  return {
    LOCAL,
    host: (code, h) => (LOCAL ? hostLocal : hostPeer)(code, h),
    join: (code, h) => (LOCAL ? joinLocal : joinPeer)(code, h),
  };
})();
