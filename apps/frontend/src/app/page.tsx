'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Upload, Sparkles, Database, Cpu, Image as ImageIcon, User as UserIcon, Bot, Trash2 } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'ai';
  content: string;
  images?: string[];
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: "Hello! I'm your JiraAgent AI. How can I help you analyze your project data today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [config, setConfig] = useState({ source: '...', llm: '...' });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('http://localhost:3001/agent/config');
        setConfig(response.data);
      } catch (error) {
        console.error('Failed to fetch config', error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() && images.length === 0) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      images: [...images],
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImages([]);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/agent/summarize', {
        query: userMessage.content,
        images: userMessage.images,
      });

      const aiMessage: Message = {
        role: 'ai',
        content: response.data.summary,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat failed', error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "I'm sorry, I'm having trouble connecting to the analysis engine. Please try again later.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages([...images, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'ai',
      content: "Chat cleared. I'm ready for new analysis! How can I help you analyze your project data today?",
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="chatbot-container">
      {/* Header */}
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255, 255, 255, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', backdropFilter: 'blur(4px)' }}>
            <Sparkles size={20} style={{ margin: 'auto' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Jira Assistant</h1>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2px' }}>
              <span className="badge-light" style={{ background: 'rgba(255, 255, 255, 0.15)', color: 'white' }}>
                <Database size={12} /> {config.source}
              </span>
              <span className="badge-light" style={{ background: 'rgba(255, 255, 255, 0.15)', color: 'white' }}>
                <Cpu size={12} /> {config.llm}
              </span>
            </div>
          </div>
        </div>

        <button onClick={clearChat} style={{ width: 40, height: 40, background: 'rgba(255, 255, 255, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', backdropFilter: 'blur(4px)' }} title="Clear Conversations">
          <Trash2 size={20} color="white" />
        </button>
      </header>

      {/* Messages */}
      <div className="message-list" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`message-row ${msg.role}`}
            >
              <div style={{ display: 'flex', gap: '1rem', maxWidth: '85%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: msg.role === 'user' ? 'var(--primary-light)' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {msg.role === 'user' ? <UserIcon size={18} color="var(--primary)" /> : <Bot size={18} color="var(--text-muted)" />}
                </div>

                <div className={`message-bubble ${msg.role}`}>
                  {msg.images && msg.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      {msg.images.map((img, idx) => (
                        <img key={idx} src={img} alt="attachment" style={{ height: 60, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                  )}
                  <div>
                    {msg.role === 'ai' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    marginTop: '0.5rem',
                    opacity: 0.6,
                    textAlign: msg.role === 'user' ? 'right' : 'left'
                  }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message-row ai">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} color="var(--text-muted)" style={{ margin: 'auto' }} />
                </div>
                <div className="message-bubble ai" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '12px 20px' }}>
                  <div className="typing-dot" style={{ width: 6, height: 6, background: 'white', borderRadius: '50%', animation: 'bounce 1s infinite 0.1s' }} />
                  <div className="typing-dot" style={{ width: 6, height: 6, background: 'white', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }} />
                  <div className="typing-dot" style={{ width: 6, height: 6, background: 'white', borderRadius: '50%', animation: 'bounce 1s infinite 0.3s' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="input-area">
        <div className="input-wrapper">
          <label style={{ cursor: 'pointer', padding: '8px', color: 'var(--text-muted)' }} title="Attach Board/Screenshot">
            <Upload size={20} />
            <input type="file" hidden onChange={handleImageUpload} accept="image/*" />
          </label>

          {images.length > 0 && (
            <div style={{ position: 'absolute', bottom: '100%', left: 20, display: 'flex', gap: '8px', padding: '12px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 -10px 20px rgba(0,0,0,0.05)' }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img} style={{ height: 40, width: 40, objectFit: 'cover', borderRadius: 4 }} />
                  <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 14, height: 14, fontSize: 10, cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>
          )}

          <textarea
            placeholder="Ask anything about your Jira board..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={1}
          />

          <button
            className="btn-send"
            onClick={handleSendMessage}
            disabled={loading || (!input.trim() && images.length === 0)}
          >
            <Send size={18} />
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          JiraAgent can read spreadsheets, APIs, and screenshots. Type with <b>Shift+Enter</b> for new lines.
        </p>
      </div>

      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .typing-dot {
          display: inline-block;
        }
      `}</style>
    </div>
  );
}
