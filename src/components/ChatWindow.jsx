import React, { useEffect, useRef, useState } from 'react';
import './ChatWindow.css';
import socket from '../services/socketClient';
import ChatBackground from '../assets/images/chat-background 1.png';
import axios from 'axios';
import { getAvatarUrl, handleAvatarError } from '../utils/avatarUtils';
import photoDefault from '../assets/images/default-avatar-icon-of-social-media-user-vector.jpg';

const API_URL = process.env.REACT_APP_API_URL;

function formatDateSeparator(dateStr) {
  try {
    // Essayer de parser la date selon différents formats
    let date;
    
    // Si c'est déjà un objet Date
    if (dateStr instanceof Date) {
      date = dateStr;
    } 
    // Si c'est un timestamp ISO ou un format standard
    else if (typeof dateStr === 'string') {
      // Essayer de parser comme ISO string
      if (dateStr.includes('T') || dateStr.includes('-')) {
        date = new Date(dateStr);
      } 
      // Si c'est un format "HH:MM:SS" (timestamp), utiliser la date actuelle
      else if (dateStr.match(/^\d{1,2}:\d{2}:\d{2}/)) {
        date = new Date();
      } 
      // Sinon essayer de parser directement
      else {
        date = new Date(dateStr);
      }
    } 
    // Si c'est un timestamp numérique
    else if (typeof dateStr === 'number') {
      date = new Date(dateStr);
    } 
    else {
      date = new Date();
    }

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      date = new Date();
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Comparer les dates (année, mois, jour)
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Aujourd'hui";
  if (isYesterday) return "Hier";
    
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  } catch (error) {
    console.error('Erreur formatDateSeparator:', error);
    return "Date inconnue";
  }
}

// Liste d'emojis populaires
const popularEmojis = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙌','👍','👋','🤷‍♀️',
  '🙂','🙃','😉','😌','😍','🥰','😘','👏','😙','😚','💑','👫','👌','🤦‍♀️',
  '😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🍔','🍗','🙏','🧏‍♀️',
  '🥳','😏','😒','😞','😔','😟','💔','💖','❤','🙁', '☹️','😣','📙','🤦‍♂️',
  '🤦‍♂️','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🌧','🌤','🎁','🧏‍♂️',
  '🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🔥','✝','⚽','🤷‍♂️',
  '🤔','🤭','🤫','🤥','🧠','😐','😑','😯','😦','😧','🌈','🌊','🌾','🍏',
  '😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🕒','❌','��','🏄‍♂️',
  '🤮','🤧','😷','🤒','🤕','🤑','🤠','💩','👻','💀','🎉','📞','💡','🚗',
  '☠️','🦾','👀','🤖','😺','😸','😹','😻','😼','😽','🌬','🚀','✈','©','🏳'
];

const ChatWindow = ({ user, messages, onSendMessage, onClose, onShowUserProfile, onProfileDataChange, sidebarRef }) => {
  // Initialisation des hooks d'état et refs
  const [message, setMessage] = useState('');
  const [localMessages, setLocalMessages] = useState({});
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(user && user.status === 'online');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem('userId');
  const fileInputRef = useRef();
  const [modalImage, setModalImage] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, msg: null });
  const [hoveredMenuIdx, setHoveredMenuIdx] = useState(null);
  const messageRefs = useRef({});
  const contextMenuRef = useRef();
  const [isBlocked, setIsBlocked] = useState({ iBlock: false, blockedMe: false });
  // useRef pour suivre le nombre de messages affichés
  const lastMessagesCountRef = useRef(0);
  
  // Nettoyage du localStorage si placeholder (sans return ici)
  useEffect(() => {
  if (currentUserId === 'mon_user_id_temporaire') {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  }, [currentUserId]);

  // useEffect pour charger l'historique à l'ouverture de la conversation
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistoryLoaded(false);
        if (user && user._id && currentUserId) {
        const res = await axios.get(`${API_URL}/chatroom/history?user1=${currentUserId}&user2=${user._id}`);
        const history = res.data.map(msg => {
          // Détection auto du type media si non fourni
          let msgType = msg.type;
          let msgMediaType = msg.mediaType;
          if (!msgType && typeof msg.message === 'string' && msg.message.startsWith('/uploads/')) {
            msgType = 'media';
            const ext = msg.message.split('.').pop().toLowerCase();
            if (["jpg","jpeg","png","gif","webp","bmp"].includes(ext)) msgMediaType = 'image';
            else if (["mp4","webm","ogg","mov","avi","mkv"].includes(ext)) msgMediaType = 'video';
          }
          return {
            _id: msg._id,
            fromMe: msg.from === currentUserId,
            from: msg.from,
            to: msg.to,
            text: msg.message,
            timestamp: msg.timestamp,
            type: msgType,
            mediaType: msgMediaType
          };
        });
        setLocalMessages(prev => ({
          ...prev,
          [user._id]: history
        }));
        }
        setHistoryLoaded(true);
      } catch (err) {
        console.error('Erreur chargement historique :', err);
        setHistoryLoaded(true);
      }
    };
      fetchHistory();
  }, [user && user._id, currentUserId]);

  // useEffect pour la gestion du socket et des messages reçus
  useEffect(() => {
    if (!currentUserId || currentUserId === 'mon_user_id_temporaire') return;
      socket.emit('join', currentUserId);
    const handleReceiveMessage = ({ from, to, message, timestamp, type, mediaType, _id }) => {
      let msgType = type;
      let msgMediaType = mediaType;
      if (!type && typeof message === 'string' && message.startsWith('/uploads/')) {
        msgType = 'media';
        const ext = message.split('.').pop().toLowerCase();
        if (["jpg","jpeg","png","gif","webp","bmp"].includes(ext)) msgMediaType = 'image';
        else if (["mp4","webm","ogg","mov","avi","mkv"].includes(ext)) msgMediaType = 'video';
      }
      const newMsg = {
        _id,
        fromMe: from === currentUserId,
            from,
        to: from === user._id ? currentUserId : user._id,
            text: message,
            timestamp,
            type: msgType,
            mediaType: msgMediaType
      };
      setLocalMessages(prev => {
        const msgs = prev[user._id] || [];
        // Vérifie si un message identique existe déjà (par _id si dispo, sinon timestamp+texte)
        const alreadyExists = _id
          ? msgs.some(m => m._id === _id)
          : msgs.some(m => m.timestamp === newMsg.timestamp && m.text === newMsg.text && m.type === newMsg.type);
        if (alreadyExists) return prev;
        return {
          ...prev,
          [user._id]: [...msgs, newMsg]
        };
      });
    };
    const handleAvatarUpdate = ({ userId: updatedUserId, newAvatar }) => {
      if (updatedUserId === user._id) {
        setLocalMessages(prev => ({ ...prev }));
      }
    };
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('userAvatarUpdated', handleAvatarUpdate);
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('userAvatarUpdated', handleAvatarUpdate);
    };
  }, [user && user._id, currentUserId]);

  // useEffect pour le statut online/offline
  useEffect(() => {
    const handleUserOnline = (userId) => {
      if (userId === user._id) setIsOnline(true);
    };
    const handleUserOffline = (userId) => {
      if (userId === user._id) setIsOnline(false);
    };
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    setIsOnline(user.status === 'online');
    return () => {
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
    };
  }, [user && user._id, user && user.status]);

  // useEffect pour fermer le sélecteur d'emojis
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

  // useEffect pour fermer le menu contextuel
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

  // useEffect pour suppression temps réel
  useEffect(() => {
    const handlePrivateMessageDeleted = ({ messageId }) => {
      setLocalMessages(prev => ({
        ...prev,
        [user._id]: (prev[user._id] || []).filter(m => m._id !== messageId)
      }));
    };
    socket.on('privateMessageDeleted', handlePrivateMessageDeleted);
    return () => {
      socket.off('privateMessageDeleted', handlePrivateMessageDeleted);
    };
  }, [user && user._id]);

  // useEffect pour transmettre les médias/fichiers/links au parent
  useEffect(() => {
    if (onProfileDataChange) {
      // Extraction des médias et fichiers
      const allMessages = [...(messages || []), ...(localMessages[user._id] || [])];
      const medias = allMessages.filter(
        msg => msg.type === 'media' && msg.mediaType === 'image'
      ).map(msg => ({
        id: msg.timestamp + msg.text,
        url: msg.text.startsWith('http') ? msg.text : `${API_URL.replace('/api', '')}/uploads/${msg.text}`
      }));
      const files = allMessages.filter(
        msg => msg.type === 'media' && msg.mediaType !== 'image'
      ).map(msg => ({
        id: msg.timestamp + msg.text,
        name: msg.text.split('/').pop(),
        size: msg.size || '',
        date: msg.timestamp,
        url: msg.text.startsWith('http') ? msg.text : `${API_URL.replace('/api', '')}/uploads/${msg.text}`
      }));
      const links = allMessages.filter(
        msg => (msg.type === 'link') || (typeof msg.text === 'string' && msg.text.includes('http'))
      ).map((msg, idx) => ({
        id: msg.timestamp + idx,
        url: (msg.text.match(/https?:\/\/[^\s]+/g) || [msg.text])[0],
        preview: msg.text.length > 60 ? msg.text.slice(0, 60) + '...' : msg.text
      }));
      onProfileDataChange({ medias, files, links });
    }
  }, [user && user._id, messages, localMessages, onProfileDataChange]);

  // useEffect pour scroll auto uniquement lors de l'arrivée d'un nouveau message
  useEffect(() => {
    const allMessages = [...(messages || []), ...(localMessages[user._id] || [])];
    if (!historyLoaded || allMessages.length === 0) return;
    const container = messagesEndRef.current?.parentNode;
    if (!container) return;
    // Si le nombre de messages a augmenté, scroll vers le bas
    if (allMessages.length > lastMessagesCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
    lastMessagesCountRef.current = allMessages.length;
  }, [messages, localMessages, user && user._id, historyLoaded]);

  // useEffect pour le statut de blocage
  useEffect(() => {
    const fetchBlockStatus = async () => {
      if (!user?._id || !currentUserId || user._id === currentUserId) return;
      try {
        const res = await axios.get(`${API_URL}/users/${user._id}/is-blocked`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setIsBlocked(res.data);
      } catch (err) {
        setIsBlocked({ iBlock: false, blockedMe: false });
      }
    };
    fetchBlockStatus();
  }, [user && user._id, currentUserId]);

  // useEffect pour écouter les changements de blocage en temps réel
  useEffect(() => {
    const handleUserBlocked = ({ blockerId, blockedId, action }) => {
      if (blockedId === user._id || blockerId === user._id) {
        const fetchBlockStatus = async () => {
          if (!user?._id || !currentUserId || user._id === currentUserId) return;
          try {
            const res = await axios.get(`${API_URL}/users/${user._id}/is-blocked`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setIsBlocked(res.data);
          } catch (err) {
            setIsBlocked({ iBlock: false, blockedMe: false });
          }
        };
        fetchBlockStatus();
      }
    };
    socket.on('userBlocked', handleUserBlocked);
    return () => {
      socket.off('userBlocked', handleUserBlocked);
    };
  }, [user && user._id, currentUserId]);

  // Early return après tous les hooks
  if (!user || !user._id) return null;
  if (!currentUserId || currentUserId === 'mon_user_id_temporaire') return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !currentUserId) return;

    const timestamp = new Date().toLocaleTimeString();

    const payload = {
      from: currentUserId,
      to: user._id,
      message,
      timestamp,
    };

    socket.emit('sendMessage', payload);
    console.log("📤 Message envoyé au serveur:", payload);

    // Ajout du contact dans la sidebar de l'expéditeur si besoin
    if (sidebarRef && sidebarRef.current && sidebarRef.current.addContact) {
      sidebarRef.current.addContact(user._id, message, timestamp);
    }

    setMessage('');
  };

  // Gérer l'upload de fichier (image/vidéo)
  const handleGalleryClick = () => {
    fileInputRef.current.click();
  };

  // Gérer l'ouverture/fermeture du sélecteur d'emojis
  const handleEmojiClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Gérer la sélection d'un emoji
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('from', currentUserId);
    formData.append('to', user._id);
    formData.append('timestamp', new Date().toLocaleTimeString());
    formData.append('type', 'media');
    try {
      const res = await axios.post(`${API_URL}/chatroom/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Envoi du message media via socket pour temps réel
      const msg = res.data;
      socket.emit('sendMessage', {
        from: msg.from,
        to: msg.to,
        message: msg.message,
        timestamp: msg.timestamp,
        type: 'media',
        mediaType: msg.mediaType
      });
    } catch (err) {
      alert('Erreur lors de l\'upload du fichier');
    }
  };

  // Handler suppression message (optimistic + socket)
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    setLocalMessages(prev => ({
      ...prev,
      [user._id]: (prev[user._id] || []).filter(m => m._id !== messageToDelete._id)
    }));
    setShowDeletePopup(false);
    setMessageToDelete(null);
    setContextMenu({ visible: false, x: 0, y: 0, msg: null });
    socket.emit('deletePrivateMessage', { messageId: messageToDelete._id, to: user._id });
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/chatroom/message/${messageToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {}
  };

  // Handler favoris (optimistic)
  const handleToggleSave = async (msg) => {
    const alreadySaved = msg.savedBy && msg.savedBy.includes(currentUserId);
    setLocalMessages(prev => ({
      ...prev,
      [user._id]: (prev[user._id] || []).map(m => m.timestamp === msg.timestamp && m.text === msg.text ? { ...m, savedBy: alreadySaved ? (m.savedBy||[]).filter(id => id !== currentUserId) : [...(m.savedBy||[]), currentUserId] } : m)
    }));
    setContextMenu({ visible: false, x: 0, y: 0, msg: null });
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/chatroom/message/${msg._id}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {}
  };

  // Handler pour ouvrir le menu contextuel avec positionnement intelligent
  const openContextMenu = (msg, idx) => {
    const ref = messageRefs.current[idx];
    if (ref) {
      const rect = ref.getBoundingClientRect();
      const menuHeight = 90;
      const menuWidth = 200;
      let x = rect.right + 8;
      let y = rect.top;
      if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 12;
      if (y + menuHeight > window.innerHeight) y = rect.bottom - menuHeight;
      setContextMenu({ visible: true, x, y, msg });
    }
  };

  // Fusionne sans doublons par _id (priorité à localMessages)
  const history = messages || [];
  const local = localMessages[user._id] || [];
  const allMessagesMap = new Map();

  // Ajoute d'abord l'historique
  for (const msg of history) {
    if (msg._id) allMessagesMap.set(msg._id, msg);
    else allMessagesMap.set(msg.timestamp + msg.text + msg.type, msg);
  }
  // Ajoute/écrase avec les messages locaux (plus récents ou modifiés)
  for (const msg of local) {
    if (msg._id) allMessagesMap.set(msg._id, msg);
    else allMessagesMap.set(msg.timestamp + msg.text + msg.type, msg);
  }
  const allMessages = Array.from(allMessagesMap.values());

  // Extraction des médias et fichiers
  const medias = allMessages.filter(
    msg => msg.type === 'media' && msg.mediaType === 'image'
  ).map(msg => {
    const url = msg.text && msg.text.startsWith('http') ? msg.text : `${API_URL.replace('/api', '')}/uploads/${msg.text}`;
    return {
    id: msg.timestamp + msg.text,
      url
    };
  });

  const files = allMessages.filter(
    msg => msg.type === 'media' && msg.mediaType !== 'image'
  ).map(msg => {
    const url = msg.text && msg.text.startsWith('http') ? msg.text : `${API_URL.replace('/api', '')}/uploads/${msg.text}`;
    return {
    id: msg.timestamp + msg.text,
    name: msg.text.split('/').pop(),
    size: msg.size || '',
      date: msg.timestamp,
      url
    };
  });

  // Extraction des liens partagés
  const links = allMessages.filter(
    msg => (msg.type === 'link') || (typeof msg.text === 'string' && msg.text.includes('http'))
  ).map((msg, idx) => ({
    id: msg.timestamp + idx,
    url: (msg.text.match(/https?:\/\/[^\s]+/g) || [msg.text])[0],
    preview: msg.text.length > 60 ? msg.text.slice(0, 60) + '...' : msg.text
  }));

  return (
    <div className="chat-window">
      <header className="chat-header">
        <div className="user-info">
          {(isBlocked.iBlock || isBlocked.blockedMe) ? (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #222', color: '#888', fontSize: 18 }}>
              <i className="fas fa-user-slash"></i>
            </div>
          ) : (
          <img
              src={getAvatarUrl(user.avatar)}
            alt={user.username}
            className="user-avatar"
              onError={handleAvatarError}
              onClick={onShowUserProfile}
              style={{ cursor: 'pointer' }}
          />
          )}
          <div className="user-details">
            <span className="user-name">{user.username}</span>
            <span className="user-status">
              <i className="fas fa-circle status-icon" style={{ color: isOnline ? '#19d219' : '#888' }}></i>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="action-icons">
          <i className="fas fa-video"></i>
          <i className="fas fa-phone"></i>
          <i 
            className="fas fa-sliders-h" 
            onClick={onShowUserProfile}
            style={{ cursor: 'pointer' }}
            title="Profil utilisateur"
          ></i>
        </div>
      </header>

      <main className="chat-messages" style={{ backgroundImage: `url(${ChatBackground})` }}>
        {!historyLoaded ? (
          <div style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>Chargement de l'historique...</div>
        ) : (
          (() => {
            let lastDate = null;
            return allMessages.map((msg, idx) => {
              // Extraire la date du message de manière plus robuste
              let msgDate;
              try {
                if (msg.timestamp) {
                  // Si le timestamp contient une date complète
                  if (typeof msg.timestamp === 'string' && (msg.timestamp.includes('-') || msg.timestamp.includes('/'))) {
                    msgDate = new Date(msg.timestamp);
                  } 
                  // Si c'est juste l'heure (format HH:MM:SS), utiliser la date actuelle
                  else if (typeof msg.timestamp === 'string' && msg.timestamp.match(/^\d{1,2}:\d{2}:\d{2}/)) {
                    msgDate = new Date();
                  } 
                  // Sinon essayer de parser le timestamp
                  else {
                    msgDate = new Date(msg.timestamp);
                  }
                } else {
                  msgDate = new Date();
                }
                
                // Vérifier si la date est valide
                if (isNaN(msgDate.getTime())) {
                  msgDate = new Date();
                }
              } catch (error) {
                console.error('Erreur parsing date message:', error);
                msgDate = new Date();
              }

              // Déterminer si on doit afficher un séparateur
              let showSeparator = false;
              if (!lastDate) {
                showSeparator = true;
                lastDate = msgDate;
              } else {
                // Comparer les dates (année, mois, jour seulement)
                const lastDateStr = lastDate.toDateString();
                const currentDateStr = msgDate.toDateString();
                
                if (lastDateStr !== currentDateStr) {
                  showSeparator = true;
                  lastDate = msgDate;
                }
              }

              return (
                <React.Fragment key={idx}>
                  {showSeparator && (
                    <div style={{ textAlign: 'center', color: '#b0b3b8', margin: '16px 0', fontSize: '0.95em' }}>
                      <span style={{ 
                        borderBottom: '1px solid #b0b3b8', 
                        padding: '0 12px',
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: '12px',
                        padding: '4px 16px'
                      }}>
                        {formatDateSeparator(msgDate)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`message-bubble ${msg.fromMe ? 'from-me' : 'from-them'}`}
                    ref={el => messageRefs.current[idx] = el}
                    style={{ position: 'relative', paddingRight: 44 }}
                  >
                    {msg.type === 'media' ? (
                      msg.mediaType === 'image' ? (
                        <img
                          src={`${API_URL.replace('/api', '')}/uploads/${msg.text}`}
                          alt="media"
                          style={{ maxWidth: 220, maxHeight: 220, borderRadius: 8, cursor: 'pointer' }}
                          onClick={() => setModalImage(`${API_URL.replace('/api', '')}/uploads/${msg.text}`)}
                        />
                      ) : (
                        <video controls src={`${API_URL.replace('/api', '')}/uploads/${msg.text}`} style={{ maxWidth: 220, maxHeight: 220, borderRadius: 8 }} />
                      )
                    ) : (
            <div>{msg.text}</div>
                    )}
                    <span style={{ fontSize: '0.75em', color: '#000', marginTop: '4px', display: 'block', textAlign: 'right' }}>
              {msg.timestamp}
            </span>
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
                </React.Fragment>
              );
            });
          })()
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Conteneur flex horizontal pour retour + footer */}
      {(isBlocked.iBlock || isBlocked.blockedMe) ? (
        <div style={{ background: '#2a2b2f', color: '#e53935', textAlign: 'center', padding: 18, fontWeight: 600, fontSize: 16, borderTop: '2px solid #444' }}>
          {isBlocked.iBlock ? 'Vous avez bloqué cet utilisateur' : 'Cet utilisateur vous a bloqué, vous ne pouvez plus lui envoyer de message'}
        </div>
      ) : (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 8 }}>
        <i
          className="fas fa-arrow-left chat-exit-btn"
          style={{ fontSize: '1.5em', color: '#b0b3b8', cursor: 'pointer', marginRight: 18, transition: 'color 0.2s, background 0.2s', borderRadius: '50%', padding: 6 }}
          onClick={onClose}
          title="Sortie"
        ></i>
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
            placeholder="Entrez un message"
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
      </div>
      )}

      {/* Sélecteur d'emojis */}
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

      {/* Menu contextuel */}
      {contextMenu.visible && contextMenu.msg && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#23272f',
            color: '#fff',
            borderRadius: 8,
            boxShadow: '0 2px 16px #0008',
            zIndex: 10000,
            minWidth: 180,
            padding: '8px 0'
          }}
        >
          <div
            style={{
              padding: '10px 18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 15,
              borderBottom: '1px solid #333'
            }}
            onClick={() => handleToggleSave(contextMenu.msg)}
          >
            <i className={contextMenu.msg.savedBy && contextMenu.msg.savedBy.includes(currentUserId) ? 'fas fa-bookmark' : 'far fa-bookmark'} style={{ color: contextMenu.msg.savedBy && contextMenu.msg.savedBy.includes(currentUserId) ? '#FFD600' : '#888' }}></i>
            {contextMenu.msg.savedBy && contextMenu.msg.savedBy.includes(currentUserId) ? 'Retirer des messages gardés' : 'Garder ce message'}
          </div>
          {contextMenu.msg.fromMe && (
            <div
              style={{
                padding: '10px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 15,
                color: '#e53935'
              }}
              onClick={() => {
                setShowDeletePopup(true);
                setMessageToDelete(contextMenu.msg);
                setContextMenu({ visible: false, x: 0, y: 0, msg: null });
              }}
            >
              <i className="fas fa-trash-alt"></i>
              Supprimer
            </div>
          )}
        </div>
      )}
      {/* Popup de confirmation suppression */}
      {showDeletePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#23272f',
            color: '#fff',
            borderRadius: 12,
            padding: 32,
            minWidth: 320,
            boxShadow: '0 2px 16px #0008',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 20, marginBottom: 18 }}>Supprimer ce message ?</div>
            <div style={{ color: '#b0b3b8', marginBottom: 24 }}>Cette action est irréversible.</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
              <button onClick={() => setShowDeletePopup(false)} style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleDeleteMessage} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 600, cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;