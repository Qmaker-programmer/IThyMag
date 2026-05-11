// ================================================
//   iThyMag — App.jsx  ¡VIVA EL ASCII ART! 🎨
//   Push panel · Spring animations · Edit/Delete propios ✏️🗑️
// ================================================
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { db, auth, googleProvider } from './firebaseConfig';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, limit, startAfter, getDocs,
  doc, updateDoc, arrayUnion, arrayRemove, getDoc, deleteDoc
} from 'firebase/firestore';
import {
  signInWithPopup, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import PlasmaBackground from './PlasmaBackground';
import SettingsModal, { loadSettings, saveSettings } from './Settings';
import './App.css';

const PAGE_SIZE = 20;

// ── Utils ─────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}
function useClickOutside(ref, cb) {
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, cb]);
}

// ── Avatar ────────────────────────────────────────────
function Avatar({ photo, name, size = 32 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {photo
        ? <img src={photo} alt={name} referrerPolicy="no-referrer" />
        : (name || '?')[0].toUpperCase()}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────
function Toast({ msg }) {
  return <div className={`toast${msg ? ' show' : ''}`}>{msg}</div>;
}

// ── Confirm Dialog ────────────────────────────────────
function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ width: 320, textAlign: 'center', gap: 16, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '2rem' }}>🗑️</div>
        <p style={{ fontSize: '0.92rem', color: 'var(--text)' }}>{msg}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-logout" onClick={onConfirm} style={{ flex: 1 }}>Sí, borrar</button>
          <button className="btn-save-profile" onClick={onCancel} style={{ flex: 1 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Login Modal ───────────────────────────────────────
function LoginModal({ onClose, onGoogle, onEmailLogin, onEmailRegister, onForgot }) {
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [isReg, setIsReg] = useState(false);
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-logo">iThyMag</div>
        <div className="modal-sub">The HappY MAc Gallery</div>
        <button className="btn-google" onClick={onGoogle}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.5 29.4 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.7-3.1-11.4-7.6l-6.6 5.1C9.5 39.5 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.2 5.2C42.2 35.1 44 30 44 24c0-1.3-.1-2.6-.4-3.9z"/>
          </svg>
          Entrar con Google
        </button>
        <div className="modal-divider"><span>o con correo</span></div>
        <input className="modal-input" type="email" placeholder="Correo electrónico"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input className="modal-input" type="password" placeholder="Contraseña"
          value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (isReg ? onEmailRegister(email, pass) : onEmailLogin(email, pass))} />
        <button className="btn-email-login"
          onClick={() => isReg ? onEmailRegister(email, pass) : onEmailLogin(email, pass)}>
          {isReg ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
        <span className="forgot-link" onClick={() => onForgot(email)}>¿Olvidaste tu contraseña?</span>
        <div className="modal-close-row">
          <button className="btn-modal-close" onClick={() => setIsReg(r => !r)}>
            {isReg ? '¿Ya tienes cuenta? Inicia sesión' : '¿Sin cuenta? Regístrate gratis'}
          </button>
        </div>
        <div className="modal-close-row" style={{ marginTop: 6 }}>
          <button className="btn-modal-close" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Profile Dropdown ──────────────────────────────────
function ProfileDropdown({ user, profile, onSave, onLogout, onClose }) {
  const [nickname, setNickname]       = useState(profile.nickname || '');
  const [hideName, setHideName]       = useState(profile.hideName || false);
  const [hidePhoto, setHidePhoto]     = useState(profile.hidePhoto || false);
  const [customPhoto, setCustomPhoto] = useState(profile.customPhotoUrl || '');
  const ref = useRef();
  useClickOutside(ref, onClose);
  const photo = !hidePhoto ? (customPhoto || user.photoURL) : null;
  const letter = (nickname || user.displayName || '?')[0].toUpperCase();
  const handleSave = () => {
    if (hideName && !nickname.trim()) { alert('Si ocultas tu nombre, necesitas un apodo 🎭'); return; }
    onSave({ nickname, hideName, hidePhoto, customPhotoUrl: customPhoto });
  };
  return (
    <div ref={ref} className="profile-dropdown">
      <h3>Mi Perfil</h3>
      {photo
        ? <img className="profile-avatar-big" src={photo} alt="" referrerPolicy="no-referrer" />
        : <div className="profile-avatar-placeholder">{letter}</div>}
      <input className="profile-input" placeholder="Apodo" value={nickname} onChange={e => setNickname(e.target.value)} />
      <input className="profile-url-input" placeholder="URL de foto personalizada (opcional)" value={customPhoto} onChange={e => setCustomPhoto(e.target.value)} />
      <div className="profile-toggle-row">
        <label>Ocultar nombre real</label>
        <label className="toggle-switch">
          <input type="checkbox" checked={hideName} onChange={e => setHideName(e.target.checked)} />
          <span className="toggle-slider" />
        </label>
      </div>
      <div className="profile-toggle-row">
        <label>Ocultar foto de Google</label>
        <label className="toggle-switch">
          <input type="checkbox" checked={hidePhoto} onChange={e => setHidePhoto(e.target.checked)} />
          <span className="toggle-slider" />
        </label>
      </div>
      <div className="profile-actions">
        <button className="btn-save-profile" onClick={handleSave}>Guardar</button>
        <button className="btn-logout" onClick={onLogout}>Salir</button>
      </div>
    </div>
  );
}

// ── Helpers: resuelven foto/nombre usando perfil ACTUAL del usuario ──
// Si el post es tuyo, usa tu perfil en vivo (no el snapshot de Firestore)
function resolveAuthorPhoto(art, currentUser, currentProfile) {
  if (currentUser && currentUser.uid === art.authorUid) {
    if ((currentProfile || {}).hidePhoto) return null;
    return (currentProfile || {}).customPhotoUrl || currentUser.photoURL || null;
  }
  return art.authorHidePhoto ? null : (art.authorCustomPhoto || art.authorPhoto);
}

function resolveAuthorName(art, currentUser, currentProfile) {
  if (currentUser && currentUser.uid === art.authorUid) {
    const p = currentProfile || {};
    if (p.hideName) return p.nickname || 'Anón';
    return p.nickname || art.authorNickname || art.author;
  }
  return art.authorNickname || art.author;
}

// ── ASCII Card ────────────────────────────────────────
function AsciiCard({ art, onOpen, onStar, onCopy, onShare, starred, settings = {}, isSelected, currentUser, currentProfile, onEdit, onDelete }) {
  const name  = resolveAuthorName(art, currentUser, currentProfile);
  const photo = resolveAuthorPhoto(art, currentUser, currentProfile);
  const isOwner = currentUser && currentUser.uid === art.authorUid;

  return (
    <div
      className={`ascii-card${settings.compactCards ? ' compact' : ''}${isSelected ? ' is-selected' : ''}`}
      onClick={() => onOpen(art)}
    >
      <div className="card-author-row">
        <Avatar photo={photo} name={name} size={28} />
        <span className="card-author-name">@{name}</span>
        <span className="card-author-date">{formatDate(art.createdAt)}</span>
        {(art.stars || 0) > 0 && <span className="star-count">⭐ {art.stars}</span>}
        {isOwner && <span className="owner-badge">tuyo ✨</span>}
      </div>
      <div className="ascii-box">
        <pre style={settings.monoColor ? { color: '#e2e8f0' } : {}}>{art.content}</pre>
      </div>
      <div className="card-bottom" onClick={e => e.stopPropagation()}>
        <div className="card-tags">
          {art.tags?.filter(Boolean).map((t, i) => <span key={i} className="tag">#{t}</span>)}
        </div>
        <div className="card-actions">
          {isOwner && <>
            <button className="btn-icon btn-edit" title="Editar" onClick={e => { e.stopPropagation(); onEdit(art); }}>✏️</button>
            <button className="btn-icon btn-delete" title="Borrar" onClick={e => { e.stopPropagation(); onDelete(art); }}>🗑️</button>
          </>}
          <button className={`btn-icon${starred ? ' star-active' : ''}`} title="Recomendar" onClick={() => onStar(art)}>⭐</button>
          <button className="btn-icon" title="Compartir" onClick={() => onShare(art)}>🔗</button>
          <button className="btn-copy-card" onClick={() => onCopy(art.content)}>Copiar</button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────
function EditModal({ art, onSave, onClose }) {
  const [content, setContent] = useState(art.content);
  const [tags, setTags] = useState((art.tags || []).join(', '));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'artes', art.id), {
        content: content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      onSave();
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 520, maxWidth: '96vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div className="modal-logo" style={{ fontSize: '1.3rem', textAlign: 'left', marginBottom: 0 }}>✏️ Editar ASCII</div>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>
        <span className="form-label">ASCII</span>
        <textarea
          className="post-textarea"
          rows={10}
          spellCheck={false}
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ marginTop: 8, marginBottom: 12 }}
        />
        <span className="form-label">Tags</span>
        <input
          className="tags-input"
          placeholder="retro, apple, art"
          value={tags}
          onChange={e => setTags(e.target.value)}
          style={{ width: '100%', marginTop: 8, marginBottom: 18 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-save-profile" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Guardando…' : 'Guardar cambios ✅'}
          </button>
          <button className="btn-logout" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Panel (PUSH, no overlay) ──────────────────
function DetailPanel({ art, open, onClose, onStar, onCopy, onShare, starred, currentUser, currentProfile, onEdit, onDelete }) {
  const name  = art ? resolveAuthorName(art, currentUser, currentProfile) : '';
  const photo = art ? resolveAuthorPhoto(art, currentUser, currentProfile) : null;
  const isOwner = currentUser && art && currentUser.uid === art.authorUid;

  return (
    <div className={`detail-panel-wrap${open ? ' open' : ''}`}>
      <div className="detail-panel">
        {art && <>
          <button className="panel-close" onClick={onClose}>✕</button>
          <div className="panel-author-row">
            <Avatar photo={photo} name={name} size={44} />
            <div>
              <div className="panel-author-name">@{name}</div>
              <div className="panel-date">{formatDate(art.createdAt)}</div>
            </div>
            {(art.stars || 0) > 0 && <span className="panel-stars">⭐ {art.stars}</span>}
          </div>
          <div className="panel-ascii-box"><pre>{art.content}</pre></div>
          <div className="panel-tags">
            {art.tags?.filter(Boolean).map((t, i) => <span key={i} className="tag">#{t}</span>)}
          </div>
          <div className="panel-actions">
            <button className="btn-panel-copy" onClick={() => onCopy(art.content)}>Copiar ASCII</button>
            <button className="btn-panel-share" onClick={() => onShare(art)}>Compartir 🔗</button>
            <button className={`btn-panel-star${starred ? ' active' : ''}`} onClick={() => onStar(art)}>⭐</button>
          </div>
          {/* Botones de propietario */}
          {isOwner && (
            <div className="panel-owner-actions">
              <button className="btn-panel-edit" onClick={() => onEdit(art)}>✏️ Editar</button>
              <button className="btn-panel-delete" onClick={() => onDelete(art)}>🗑️ Borrar</button>
            </div>
          )}
        </>}
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────
function Sidebar({ view, onView, user, artes, starred, onOpenArt, onUnstar, onOpenLogin }) {
  const authors = useMemo(() => {
    const map = {};
    artes.forEach(a => {
      const name  = a.authorNickname || a.author || 'Anón';
      const photo = a.authorHidePhoto ? null : (a.authorCustomPhoto || a.authorPhoto);
      if (!map[name]) map[name] = { name, photo, stars: 0, posts: 0 };
      map[name].stars += (a.stars || 0);
      map[name].posts++;
    });
    return Object.values(map).sort((a, b) => b.stars - a.stars);
  }, [artes]);

  const myPosts  = useMemo(() => user ? artes.filter(a => a.authorUid === user.uid) : [], [artes, user]);
  const favPosts = useMemo(() => artes.filter(a => starred.includes(a.id)), [artes, starred]);
  const topPosts = useMemo(() => [...artes].sort((a, b) => (b.stars || 0) - (a.stars || 0)).slice(0, 5), [artes]);

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {[
          { id: 'feed',    icon: '📜', label: 'Feed' },
          { id: 'authors', icon: '👥', label: 'Autores' },
          { id: 'account', icon: '👤', label: 'Mi cuenta' },
        ].map(({ id, icon, label }) => (
          <button key={id}
            className={`sidebar-btn${view === id ? ' active' : ''}`}
            onClick={() => { if (id === 'account' && !user) { onOpenLogin(); return; } onView(id); }}
          >
            <span className="sidebar-icon">{icon}</span>
            <span className="sidebar-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-content">
        {view === 'feed' && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">🔥 Top posts</div>
            {topPosts.length === 0 && <p className="sidebar-empty">Aún no hay posts</p>}
            {topPosts.map(a => (
              <div key={a.id} className="mini-card" onClick={() => onOpenArt(a)}>
                <pre className="mini-pre">{a.content.slice(0, 70)}{a.content.length > 70 ? '…' : ''}</pre>
                <div className="mini-meta">⭐ {a.stars || 0} · @{a.authorNickname || a.author}</div>
              </div>
            ))}
          </div>
        )}

        {view === 'authors' && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">🏆 Por estrellas</div>
            {authors.length === 0 && <p className="sidebar-empty">Aún no hay autores</p>}
            {authors.map((a, i) => (
              <div key={a.name} className="author-row">
                <span className="author-rank">#{i + 1}</span>
                <Avatar photo={a.photo} name={a.name} size={26} />
                <div className="author-info">
                  <span className="author-name">@{a.name}</span>
                  <span className="author-meta">{a.posts} post{a.posts !== 1 ? 's' : ''} · ⭐ {a.stars}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'account' && user && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">📌 Mis publicaciones</div>
            {myPosts.length === 0 && <p className="sidebar-empty">Aún no publicaste nada</p>}
            {myPosts.map(a => (
              <div key={a.id} className="mini-card" onClick={() => onOpenArt(a)}>
                <pre className="mini-pre">{a.content.slice(0, 70)}{a.content.length > 70 ? '…' : ''}</pre>
                <div className="mini-meta">⭐ {a.stars || 0}</div>
              </div>
            ))}

            <div className="sidebar-section-title" style={{ marginTop: 18 }}>⭐ Favoritos</div>
            {favPosts.length === 0 && <p className="sidebar-empty">Aún no tienes favoritos</p>}
            {favPosts.map(a => (
              <div key={a.id} className="mini-card" onClick={() => onOpenArt(a)}>
                <pre className="mini-pre">{a.content.slice(0, 70)}{a.content.length > 70 ? '…' : ''}</pre>
                <div className="mini-meta">
                  @{a.authorNickname || a.author}
                  <button className="unstar-btn" onClick={e => { e.stopPropagation(); onUnstar(a); }}>✕ Quitar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// ══════════════════════════════════════════════════════
//   MAIN APP
// ══════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]                       = useState(null);
  const [profile, setProfile]                 = useState({ nickname: '', hideName: false, hidePhoto: false, customPhotoUrl: '' });
  const [showLogin, setShowLogin]             = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings]       = useState(false);
  const [settings, setSettings]               = useState(() => loadSettings());
  const [sideView, setSideView]               = useState('feed');
  const [ascii, setAscii]                     = useState('');
  const [tags, setTags]                       = useState('');
  const [artes, setArtes]                     = useState([]);
  const [search, setSearch]                   = useState('');
  const [lastDoc, setLastDoc]                 = useState(null);
  const [hasMore, setHasMore]                 = useState(false);
  const [selectedArt, setSelectedArt]         = useState(null);
  const [panelOpen, setPanelOpen]             = useState(false);
  const [prevArt, setPrevArt]                 = useState(null);
  const [starred, setStarred]                 = useState(() => {
    try { return JSON.parse(localStorage.getItem('ithymag_starred') || '[]'); } catch { return []; }
  });
  const [toast, setToast] = useState('');

  // Edit / Delete state
  const [editingArt, setEditingArt]           = useState(null);
  const [confirmDelete, setConfirmDelete]     = useState(null); // art a borrar

  const showToast = useCallback(msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  }, []);

  // Auth
  useEffect(() => onAuthStateChanged(auth, u => {
    setUser(u);
    if (u) {
      const s = localStorage.getItem(`ithymag_profile_${u.uid}`);
      if (s) setProfile(JSON.parse(s));
    }
  }), []);

  // Persist starred
  useEffect(() => { localStorage.setItem('ithymag_starred', JSON.stringify(starred)); }, [starred]);

  // Firestore real-time
  useEffect(() => {
    const q = query(collection(db, 'artes'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
    return onSnapshot(q, snap => {
      const newArtes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setArtes(newArtes);
      setLastDoc(snap.docs[snap.docs.length - 1]);
      setHasMore(snap.docs.length === PAGE_SIZE);
      // Actualizar selectedArt si está abierto (para reflejar ediciones en tiempo real)
      setSelectedArt(prev => {
        if (!prev) return prev;
        const updated = newArtes.find(a => a.id === prev.id);
        return updated || prev;
      });
    });
  }, []);

  // URL hash → open panel
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#post-')) {
      getDoc(doc(db, 'artes', hash.replace('#post-', ''))).then(d => {
        if (d.exists()) { setSelectedArt({ id: d.id, ...d.data() }); setPanelOpen(true); }
      });
    }
  }, []);

  const loadMore = async () => {
    if (!lastDoc) return;
    const q = query(collection(db, 'artes'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE));
    const snap = await getDocs(q);
    setArtes(prev => [...prev, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))]);
    setLastDoc(snap.docs[snap.docs.length - 1]);
    setHasMore(snap.docs.length === PAGE_SIZE);
  };

  const handlePost = async e => {
    e.preventDefault();
    if (!ascii.trim()) return;
    try {
      await addDoc(collection(db, 'artes'), {
        content: ascii,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        author: profile.nickname || user.displayName,
        authorPhoto: user.photoURL || '',
        authorHidePhoto: profile.hidePhoto,
        authorCustomPhoto: profile.customPhotoUrl || '',
        authorNickname: profile.nickname || '',
        authorUid: user.uid,
        stars: 0, starredBy: [],
        createdAt: serverTimestamp(),
      });
      setAscii(''); setTags('');
      showToast('¡ASCII publicado! 🎉');
    } catch (e) { alert('Error: ' + e.message); }
  };

  // ── Editar post ────────────────────────────────────
  const handleEdit = art => {
    setEditingArt(art);
  };

  const handleEditSave = () => {
    setEditingArt(null);
    showToast('✅ ASCII actualizado!');
  };

  // ── Borrar post ────────────────────────────────────
  const handleDelete = art => {
    setConfirmDelete(art);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'artes', confirmDelete.id));
      // Si el panel está abierto con ese art, cerrarlo
      if (selectedArt?.id === confirmDelete.id) {
        setPanelOpen(false);
        setTimeout(() => setSelectedArt(null), 600);
        history.pushState('', document.title, location.pathname);
      }
      showToast('🗑️ Post borrado');
    } catch (e) {
      alert('Error al borrar: ' + e.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleGoogle         = async () => { try { await signInWithPopup(auth, googleProvider); setShowLogin(false); } catch (e) { alert(e.message); } };
  const handleEmailLogin     = async (em, pw) => { try { await signInWithEmailAndPassword(auth, em, pw); setShowLogin(false); } catch (e) { alert(e.message); } };
  const handleEmailRegister  = async (em, pw) => { try { await createUserWithEmailAndPassword(auth, em, pw); setShowLogin(false); } catch (e) { alert(e.message); } };
  const handleForgot         = async em => { if (!em) { alert('Escribe tu correo primero'); return; } try { await sendPasswordResetEmail(auth, em); alert('📧 Email enviado!'); } catch (e) { alert(e.message); } };

  const handleSaveProfile = np => {
    setProfile(np);
    if (user) localStorage.setItem(`ithymag_profile_${user.uid}`, JSON.stringify(np));
    setShowProfileMenu(false);
    showToast('Perfil guardado ✅');
  };

  const handleStar = async art => {
    if (!user) { setShowLogin(true); return; }
    const isStarred = starred.includes(art.id);
    setStarred(prev => isStarred ? prev.filter(x => x !== art.id) : [...prev, art.id]);
    const r = doc(db, 'artes', art.id);
    if (isStarred) await updateDoc(r, { starredBy: arrayRemove(user.uid), stars: Math.max(0, (art.stars || 1) - 1) });
    else           await updateDoc(r, { starredBy: arrayUnion(user.uid),  stars: (art.stars || 0) + 1 });
    showToast(isStarred ? 'Estrella removida' : '⭐ ¡Recomendado!');
  };

  const handleCopy  = c  => { navigator.clipboard.writeText(c); showToast('¡Copiado! 📋'); };
  const handleShare = art => { navigator.clipboard.writeText(`${location.origin}${location.pathname}#post-${art.id}`); showToast('🔗 Link copiado!'); };

  const openPanel = art => {
    if (selectedArt?.id === art.id && panelOpen) return;
    setPrevArt(selectedArt);
    setSelectedArt(art);
    setPanelOpen(true);
    history.replaceState('', '', `${location.pathname}#post-${art.id}`);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedArt(null), 600);
    history.pushState('', document.title, location.pathname);
  };

  const handleSettingsChange = newSettings => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const filtered = search.trim()
    ? artes.filter(a => {
        const q = search.toLowerCase();
        return a.content?.toLowerCase().includes(q)
          || a.author?.toLowerCase().includes(q)
          || a.tags?.some(t => t.toLowerCase().includes(q));
      })
    : artes;

  const displayName  = profile.hideName ? (profile.nickname || 'Anón') : (profile.nickname || user?.displayName?.split(' ')[0] || 'Tú');
  const displayPhoto = profile.hidePhoto ? null : (profile.customPhotoUrl || user?.photoURL || null);

  return (
    <div className="app">
      <PlasmaBackground settings={settings} />

      <div className="app-inner">
        {/* ── Header ── */}
        <header className="main-header">
          <div className="brand">
            <span className="brand-name">iThyMag</span>
            <span className="brand-sub">The HappY MAc Gallery</span>
          </div>

          <div className="header-right">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Buscar ASCII, autor, tag…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <button className="settings-btn" onClick={() => setShowSettings(true)} title="Configuración">⚙️</button>

            {user ? (
              <div style={{ position: 'relative' }}>
                <div className="user-pill" onClick={() => setShowProfileMenu(v => !v)}>
                  <Avatar photo={displayPhoto} name={displayName} size={26} />
                  <span className="user-displayname">{displayName}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>▾</span>
                </div>
                {showProfileMenu && (
                  <ProfileDropdown user={user} profile={profile}
                    onSave={handleSaveProfile}
                    onLogout={() => { signOut(auth); setShowProfileMenu(false); }}
                    onClose={() => setShowProfileMenu(false)} />
                )}
              </div>
            ) : (
              <button className="login-btn" onClick={() => setShowLogin(true)}>Iniciar sesión</button>
            )}
          </div>
        </header>

        {/* ── Body layout: Sidebar + Main + Detail Panel ── */}
        <div className="body-layout">

          <Sidebar
            view={sideView} onView={setSideView}
            user={user} artes={artes} starred={starred}
            onOpenArt={openPanel} onUnstar={handleStar}
            onOpenLogin={() => setShowLogin(true)}
          />

          {/* ── Main ── */}
          <main className="main-content">
            <div className="hero">
              <h1 className="hero-title">iThyMag</h1>
              <p className="hero-sub">The Happy Mac Gallery</p>
            </div>

            {user ? (
              <form className="post-form" onSubmit={handlePost}>
                <span className="form-label">Nuevo ASCII</span>
                <textarea className="post-textarea" rows={9} spellCheck={false}
                  placeholder={`  _________\n | _______ |\n | |' ⅃ '| |\n | |  ◡  | |\n | ------- |\n |      _  |\n -----------\n  |       |\n  ---------`}
                  value={ascii} onChange={e => setAscii(e.target.value)} />
                <div className="form-row">
                  <input className="tags-input" placeholder="Tags opcionales: retro, apple, art"
                    value={tags} onChange={e => setTags(e.target.value)} />
                  <button type="submit" className="submit-btn">Publicar</button>
                </div>
              </form>
            ) : (
              <div className="empty-state">
                <pre>{`  _________\n | _______ |\n | |' ⅃ '| |\n | |  ◡  | |\n | ------- |\n |      _  |\n -----------\n  |       |\n  ---------`}</pre>
                <p><button className="login-btn" style={{ margin: '0 auto' }} onClick={() => setShowLogin(true)}>
                  Inicia sesión para publicar tu ASCII ↑
                </button></p>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="empty-state">
                <p>{search ? `No hay resultados para "${search}"` : '¡Sé el primero en publicar! 🎨'}</p>
              </div>
            ) : (
              <div className={`gallery${panelOpen ? ' panel-open' : ''}${settings.compactCards ? ' gallery-compact' : ''}`}>
                {filtered.map(art => (
                  <AsciiCard key={art.id} art={art}
                    onOpen={openPanel} onStar={handleStar}
                    onCopy={handleCopy} onShare={handleShare}
                    starred={starred.includes(art.id)}
                    settings={settings}
                    isSelected={panelOpen && selectedArt?.id === art.id}
                    currentUser={user}
                    currentProfile={profile}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {hasMore && !search && (
              <button className="load-more-btn" onClick={loadMore}>Cargar más</button>
            )}
          </main>

          {/* ── Detail Panel (PUSH — sits next to main) ── */}
          <DetailPanel
            art={selectedArt} open={panelOpen}
            onClose={closePanel} onStar={handleStar}
            onCopy={handleCopy} onShare={handleShare}
            starred={selectedArt ? starred.includes(selectedArt.id) : false}
            currentUser={user}
            currentProfile={profile}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal settings={settings} onChange={handleSettingsChange} onClose={() => setShowSettings(false)} />
      )}

      {/* Login Modal */}
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)}
          onGoogle={handleGoogle} onEmailLogin={handleEmailLogin}
          onEmailRegister={handleEmailRegister} onForgot={handleForgot} />
      )}

      {/* Edit Modal */}
      {editingArt && (
        <EditModal art={editingArt} onSave={handleEditSave} onClose={() => setEditingArt(null)} />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <ConfirmDialog
          msg="¿Borrar este ASCII? Esta acción no se puede deshacer 💀"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <Toast msg={toast} />
    </div>
  );
}
