import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTracking } from '../hooks/useTracking';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your PillarstoHome AI concierge. Are you looking to buy or invest in luxury real estate? I can help you find the perfect property or investment opportunity." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', budget: '', intent: '' });
  const { capturePartialLead, submitFullLead } = useTracking();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `You are a luxury real estate concierge for PillarstoHome Real Estate. 
            Your goal is to be helpful and professional, while naturally qualifying the lead.
            Try to capture their: Name, Email, Phone, Budget, and Intent (Self-use or Investment).
            Current captured data: ${JSON.stringify(formData)}
            User just said: "${userMessage}"
            Previous conversation: ${JSON.stringify(messages)}
            
            If you have all the data, thank them and say a consultant will reach out.
            If you are missing data, ask for it naturally.
            Return ONLY the text response for the user.
            Also, if you detect new data fields, include them in a special JSON block at the end of your response like this: 
            [[DATA:{"name": "...", "email": "...", "phone": "...", "budget": "...", "intent": "..."}]]
            Only include the fields you just detected or confirmed.` }] }
        ],
        config: {
          systemInstruction: "You are an elite real estate concierge. Be concise, elegant, and effective at capturing lead details.",
          temperature: 0.7,
        }
      });

      const aiResponse = response.text || "I'm sorry, I'm having trouble connecting. Please try again or use our contact form.";
      
      // Extract data if present
      const dataMatch = aiResponse.match(/\[\[DATA:(.*?)\]\]/);
      let cleanResponse = aiResponse.replace(/\[\[DATA:.*?\]\]/, '').trim();
      
      if (dataMatch) {
        try {
          const newData = JSON.parse(dataMatch[1]);
          const updatedFormData = { ...formData, ...newData };
          setFormData(updatedFormData);
          
          // Capture partial lead with new data
          capturePartialLead({ ...updatedFormData, source: 'AI Chatbot' });

          // If we have all critical fields, submit full lead
          if (updatedFormData.name && updatedFormData.email && updatedFormData.phone && updatedFormData.budget && updatedFormData.intent) {
            submitFullLead({ ...updatedFormData, source: 'AI Chatbot' });
          }
        } catch (e) {
          console.error("Failed to parse AI data", e);
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I apologize, but I'm experiencing a technical issue. Please leave your details in the contact form below." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gold-500 rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-transform z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-96 bg-luxury-800 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[600px]"
          >
            <div className="bg-luxury-900 p-4 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium text-sm">PillarstoHome AI Concierge</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-[#0a0a0a] scrollbar-thin min-h-[300px]">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-2xl text-sm max-w-[85%] ${
                    msg.role === 'assistant' 
                      ? 'bg-luxury-700 text-white self-start rounded-tl-sm' 
                      : 'bg-gold-500 text-black self-end rounded-tr-sm'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="bg-luxury-700 text-white p-3 rounded-2xl rounded-tl-sm text-sm self-start flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 bg-luxury-900 border-t border-white/10 flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..." 
                className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="bg-gold-500 text-black p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
