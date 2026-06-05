'use client';

import { useState, useRef, useEffect } from 'react';
import NavBar from './components/NavBar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  subject?: string;
  concept?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const userMessageId = `user-${Date.now()}`;

    setInput('');
    setMessages((prev) => [...prev, { id: userMessageId, role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Step 1: Detect concept from user message
      const detectRes = await fetch('/api/detect-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage }),
      });

      const { subject = '', concept = '' } = await detectRes.json();

      // Step 2: Get streamed response from chat API
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          subject,
          concept,
        }),
      });

      if (!chatRes.ok) {
        throw new Error(`Chat API error: ${chatRes.status}`);
      }

      // Step 3: Stream response into chat
      const assistantMessageId = `assistant-${Date.now()}`;
      let fullContent = '';

      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: 'assistant', content: '', subject, concept },
      ]);

      const reader = chatRes.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullContent }
                : msg
            )
          );
        }
      }

      lastMessageIdRef.current = assistantMessageId;
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, there was an error processing your message. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgress = async (messageId: string) => {
    const assistantMessage = messages.find((m) => m.id === messageId);
    if (!assistantMessage || assistantMessage.role !== 'assistant') return;

    setSavingMessageId(messageId);

    try {
      // Parse response for key information
      const response = assistantMessage.content;
      const subject = assistantMessage.subject || '';
      const concept = assistantMessage.concept || '';

      // Simple extraction of common learning fields
      const masteryLevel = 'Developing'; // Default; could be extracted from response
      const overviewGist = response.split('\n').slice(0, 3).join('\n').trim();
      const deepDiveGist: string[] = [];
      const strongAreas: string[] = [];
      const weakAreas: string[] = [];
      const nextSteps: string[] = [];
      const notes = '';

      const saveRes = await fetch('/api/save-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          concept,
          masteryLevel,
          overviewGist,
          deepDiveGist,
          strongAreas,
          weakAreas,
          nextSteps,
          notes,
        }),
      });

      if (!saveRes.ok) {
        throw new Error(`Save API error: ${saveRes.status}`);
      }

      alert('Progress saved!');
    } catch (error) {
      console.error('Error saving progress:', error);
      alert('Failed to save progress. Please try again.');
    } finally {
      setSavingMessageId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <NavBar />

      <div className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">Study Agent</h1>
        <p className="text-sm text-slate-400">Learn at your own pace</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Start a conversation by asking a question about any topic.</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-100 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>

                {msg.role === 'assistant' && msg.subject && msg.concept && (
                  <div className="flex justify-start mt-2">
                    <button
                      onClick={() => handleSaveProgress(msg.id)}
                      disabled={savingMessageId === msg.id}
                      className="text-xs px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {savingMessageId === msg.id ? 'Saving...' : 'Save progress'}
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-slate-900 border-t border-slate-700 px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything..."
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-800 text-white placeholder-slate-500 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
