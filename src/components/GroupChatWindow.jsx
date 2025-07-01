import React, { useEffect, useRef, useState } from 'react';
import './ChatWindow.css';
import socket from '../services/socketClient';
import { getAvatarUrl, handleAvatarError } from '../utils/avatarUtils';
import GroupInfoPanel from './GroupInfoPanel';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const GroupChatWindow = ({ room, onClose, onLeaveRoom }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem('userId');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef();
  const popularEmojis = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙌','👍','👋','🤷‍♀️',
    '🙂','🙃','😉','😌','😍','🥰','😘','👏','😙','😚','💑','👫','👌','🤦‍♀️',
    '😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🍔','🍗','🙏','🧏‍♀️',
    '🥳','😏','😒','😞','😔','😟','💔','💖','❤','🙁', '☹️','😣','📙','🤦‍♂️',
    '🤦‍♂️','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🌧','🌤','🎁','🧏‍♂️',
    '🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤐','✝','⚽','🤷‍♂️',
    '🤔','🤭','🤫','🤥','🧠','😐','😑','😯','😦','😧','🌈','🌊','🌾','🍏',
    '😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🕒','❌','🍉','🏄‍♂️',
    '🤮','🤧','😷','🤒','🤕','🤑','🤠','💩','👻','💀','🎉','📞','💡','🚗',
    '☠️','🦾','👀','🤖','😺','😸','😹','😻','😼','😽','🌬','🚀','✈','©','🏳'
  ];
  const [modalImage, setModalImage] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, msg: null });
  const messageRefs = useRef({});
  const contextMenuRef = useRef();
  const [hoveredMenuIdx, setHoveredMenuIdx] = useState(null);

  // Rejoindre la room socket.io
  useEffect(() => {
    if (room && room._id) {
      socket.emit('joinRoom', room._id);
    }
    return () => {
      if (room && room._id) {
        socket.emit('leaveRoom', room._id);
      }
    };
  }, [room?._id]);

  // Charger l'historique des messages du groupe à chaque ouverture
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistoryLoaded(false);
        const res = await fetch(`${API_URL}/chatroom/group-history/${room._id}`);
        if (!res.ok) {
          throw new Error('Erreur lors du chargement de l\'historique');
        }
        const data = await res.json();
        console.log('📚 GroupChatWindow - Historique chargé:', data.length, 'messages');
        setMessages(data.map(msg => ({ ...msg, _id: msg._id })));
        setHistoryLoaded(true);
      } catch (err) {
        console.error('❌ GroupChatWindow - Erreur chargement historique:', err);
        setMessages([]);
        setHistoryLoaded(true);
      }
    };
    if (room && room._id) {
      fetchHistory();
    }
  }, [room?._id]);

  // Réception des messages en temps réel (évite les doublons)
  useEffect(() => {
    const handleReceiveGroupMessage = (msg) => {
      console.log('📨 GroupChatWindow - Message reçu:', msg);
      // Si le message existe déjà (même timestamp et from), on ne l'ajoute pas
      if (!messages.some(m => m.timestamp === msg.timestamp && m.from === msg.from && (m.text === msg.text || m.message === msg.text))) {
        setMessages(prev => [...prev, msg]);
      }
    };
    socket.on('receiveGroupMessage', handleReceiveGroupMessage);
    return () => {
      socket.off('receiveGroupMessage', handleReceiveGroupMessage);
    };
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Vérifier si l'utilisateur est encore membre de la salle
    const isStillMember = room.members?.some(member => 
      (member._id || member) === currentUserId
    );
    
    if (!isStillMember) {
      alert('Vous n\'êtes plus membre de cette salle. Veuillez la fermer.');
      onClose();
      return;
    }
    
    const msg = {
      roomId: room._id,
      from: currentUserId,
      text: message,
      timestamp: new Date().toLocaleTimeString(),
    };
    socket.emit('sendGroupMessage', msg);
    setMessage('');
  };

  // Ajoute une fonction utilitaire pour trouver le nom d'un membre (compatibilité string/_id)
  function getUserName(userId) {
    if (!room.members) return userId;
    const member = room.members.find(m => (m._id || m) === userId);
    return member?.username || userId;
  }

  // Fonction pour générer une couleur à partir d'un userId, en évitant le bleu (hue 200-260)
  function getUserColor(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    let hue = Math.abs(hash % 360);
    // Évite le bleu (200-260)
    if (hue >= 200 && hue <= 260) hue = (hue + 70) % 360;
    return `hsl(${hue}, 70%, 55%)`;
  }

  // Emoji picker
  const handleEmojiClick = () => setShowEmojiPicker(!showEmojiPicker);
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker') && !event.target.closest('.emoji-icon')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Gestion de l'upload de fichier (image/vidéo)
  const handleGalleryClick = () => {
    fileInputRef.current.click();
  };
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier si l'utilisateur est encore membre de la salle
    const isStillMember = room.members?.some(member => 
      (member._id || member) === currentUserId
    );
    
    if (!isStillMember) {
      alert('Vous n\'êtes plus membre de cette salle. Veuillez la fermer.');
      onClose();
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('from', currentUserId);
    formData.append('to', room._id);
    formData.append('timestamp', new Date().toLocaleTimeString());
    formData.append('type', 'group');
    try {
      const res = await fetch(`${API_URL}/chatroom/upload`, {
        method: 'POST',
        body: formData
      });
      const msg = await res.json();
      socket.emit('sendGroupMessage', {
        roomId: room._id,
        from: msg.from,
        text: msg.message,
        timestamp: msg.timestamp,
        type: 'media',
        mediaType: msg.mediaType
      });
    } catch (err) {
      alert("Erreur lors de l'upload du fichier");
    }
  };

  const handleLeaveRoom = (roomId) => {
    onLeaveRoom && onLeaveRoom(roomId);
    onClose();
  };

  // Handler suppression message (optimistic + socket)
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    setMessages(prev => prev.filter(m => m._id !== messageToDelete._id));
    setShowDeletePopup(false);
    setMessageToDelete(null);
    setContextMenu({ visible: false, x: 0, y: 0, msg: null });
    socket.emit('deleteGroupMessage', { messageId: messageToDelete._id, roomId: room._id });
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/chatroom/message/${messageToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {}
  };

  // Handler favoris (optimistic)
  const handleToggleSave = async (msg) => {
    // Optimistic update
    const alreadySaved = msg.savedBy && msg.savedBy.includes(currentUserId);
    setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, savedBy: alreadySaved ? (m.savedBy||[]).filter(id => id !== currentUserId) : [...(m.savedBy||[]), currentUserId] } : m));
    setContextMenu({ visible: false, x: 0, y: 0, msg: null });
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/chatroom/message/${msg._id}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      // Optionnel : rollback si erreur
    }
  };

  // Réception suppression temps réel
  useEffect(() => {
    const handleGroupMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };
    socket.on('groupMessageDeleted', handleGroupMessageDeleted);
    return () => {
      socket.off('groupMessageDeleted', handleGroupMessageDeleted);
    };
  }, []);

  // Handler pour ouvrir le menu contextuel avec positionnement intelligent
  const openContextMenu = (msg, idx) => {
    const ref = messageRefs.current[msg._id || idx];
    if (ref) {
      const rect = ref.getBoundingClientRect();
      const menuHeight = 90; // hauteur estimée du menu
      const menuWidth = 200;
      let x = rect.right + 8;
      let y = rect.top;
      // Si le menu sort de l'écran à droite, le coller à droite de la fenêtre
      if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 12;
      // Si le menu sort en bas, l'afficher au-dessus du message
      if (y + menuHeight > window.innerHeight) y = rect.bottom - menuHeight;
      setContextMenu({ visible: true, x, y, msg });
    }
  };

  // Fermer le menu contextuel au clic ailleurs
  useEffect(() => {
    if (!contextMenu.visible) return;
    const handleClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu({ visible: false, x: 0, y: 0, msg: null });
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu.visible]);

  return (
    <div className="chat-window">
      <header className="chat-header">
        <div className="user-info">
          <div className="user-avatar" style={{ background: '#0095FF', color: '#fff', fontWeight: 700, fontSize: 22, width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fas fa-users"></i>
          </div>
          <div className="user-details">
            <span className="user-name">{room.name}</span>
            <span className="user-status">{room.members?.length || 0} membres</span>
          </div>
        </div>
        <div className="action-icons">
          <i 
            className="fas fa-info-circle" 
            style={{ cursor: 'pointer', marginRight: 18 }}
            onClick={() => setShowGroupInfo(true)}
            title="Informations du groupe"
          ></i>
          <i className="fas fa-arrow-left chat-exit-btn" style={{ marginLeft: 18, cursor: 'pointer' }} onClick={onClose}></i>
        </div>
      </header>
      <main className="chat-messages">
        {!historyLoaded ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
            Chargement des messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
            Aucun message dans cette salle
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg._id || idx}
              className={`message-bubble ${msg.from === currentUserId ? 'from-me' : 'from-them'}`}
              style={{ position: 'relative', paddingRight: 44 }}
              ref={el => messageRefs.current[msg._id || idx] = el}
            >
              <div>
                <span style={{ fontWeight: 800, color: getUserColor(msg.from), marginRight: 6 }}>
                  {getUserName(msg.from)}
                </span>
                : { (msg.type === 'media' || msg.mediaType)
                      ? (msg.mediaType === 'image'
                          ? <img
                              src={`${API_URL}/uploads/${msg.text || msg.message}`}
                              alt="media"
                              style={{ maxWidth: 220, maxHeight: 220, borderRadius: 8, verticalAlign: 'middle', cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 0 0 rgba(0,0,0,0)' }}
                              onClick={() => setModalImage(`${API_URL}/uploads/${msg.text || msg.message}`)}
                              onMouseOver={e => e.currentTarget.style.boxShadow = '0 0 16px #0095FF'}
                              onMouseOut={e => e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'}
                            />
                          : <video controls src={`${API_URL}/uploads/${msg.text || msg.message}`} style={{ maxWidth: 220, maxHeight: 220, borderRadius: 8, verticalAlign: 'middle' }} />)
                      : (msg.text || msg.message)
                  }
              </div>
              <span style={{ fontSize: '0.75em', color: '#000', marginTop: '4px', display: 'block', textAlign: 'right' }}>{msg.timestamp}</span>
              {/* Icône options */}
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <i
                  className="fas fa-ellipsis-v"
                  style={{
                    color: hoveredMenuIdx === idx ? '#222' : '#666',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: 4,
                    borderRadius: 4,
                    transition: 'background 0.2s, color 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.10)'
                  }}
                  title="Options"
                  onClick={e => {
                    e.stopPropagation();
                    openContextMenu(msg, idx);
                  }}
                  onMouseEnter={() => setHoveredMenuIdx(idx)}
                  onMouseLeave={() => setHoveredMenuIdx(null)}
                ></i>
              </div>
            </div>
          ))
        )}
        {/* Menu contextuel */}
        {contextMenu.visible && contextMenu.msg && (
          <div ref={contextMenuRef} style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: '#23272f', color: '#fff', borderRadius: 8, boxShadow: '0 2px 16px #0008', zIndex: 10000, minWidth: 180, padding: '8px 0' }}>
            <div
              style={{ padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, borderBottom: '1px solid #333' }}
              onClick={() => handleToggleSave(contextMenu.msg)}
            >
              <i className={contextMenu.msg.savedBy && contextMenu.msg.savedBy.includes(currentUserId) ? 'fas fa-bookmark' : 'far fa-bookmark'} style={{ color: contextMenu.msg.savedBy && contextMenu.msg.savedBy.includes(currentUserId) ? '#FFD600' : '#888' }}></i>
              {contextMenu.msg.savedBy && contextMenu.msg.savedBy.includes(currentUserId) ? 'Retirer des messages gardés' : 'Garder ce message'}
            </div>
            {contextMenu.msg.from === currentUserId && (
              <div
                style={{ padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#e53935' }}
                onClick={() => { setShowDeletePopup(true); setMessageToDelete(contextMenu.msg); setContextMenu({ visible: false, x: 0, y: 0, msg: null }); }}
              >
                <i className="fas fa-trash-alt"></i>
                Supprimer
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>
      <footer className="chat-footer" style={{ display: 'flex', alignItems: 'center', width: '95%', maxWidth: 900 }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div className="footer-icons">
            <i className="fas fa-image" style={{ cursor: 'pointer' }} onClick={handleGalleryClick}></i>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
            <i className="far fa-smile emoji-icon" style={{ cursor: 'pointer' }} onClick={handleEmojiClick}></i>
          </div>
          <form onSubmit={handleSend} className="message-form" style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Entrez un message pour le groupe"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="message-input"
            />
            <button type="submit" className="send-button">
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </footer>
      {showEmojiPicker && (
        <div className="emoji-picker">
          {popularEmojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      {modalImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setModalImage(null)}
        >
          <img
            src={modalImage}
            alt="Agrandissement"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 0 24px #000' }}
          />
          <span
            style={{
              position: 'fixed',
              top: 24,
              right: 36,
              fontSize: 36,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              zIndex: 10000
            }}
            onClick={e => { e.stopPropagation(); setModalImage(null); }}
          >
            ×
          </span>
        </div>
      )}
      {showGroupInfo && (
        <GroupInfoPanel
          room={room}
          onClose={() => setShowGroupInfo(false)}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
      {/* Popup de confirmation suppression */}
      {showDeletePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#23272f', color: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #0008', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 18 }}>Supprimer ce message ?</div>
            <div style={{ color: '#b0b3b8', marginBottom: 24 }}>Cette action est irréversible.</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
              <button onClick={() => setShowDeletePopup(false)} style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleDeleteMessage} disabled={saving} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatWindow; 