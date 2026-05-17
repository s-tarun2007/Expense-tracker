import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Plus, Users, UserPlus } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { useMembers, useStats, useSettings } from "../hooks/useData";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { MEMBERS_COLLECTION, ACTIVITIES_COLLECTION } from "../hooks/useData";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  isAddingMembers?: boolean;
  parsedMembers?: {name: string, usn: string}[];
}

export function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "1",
    role: "model",
    text: "Hello! I can answer questions about the members list, track payments, or even add new members for you if you paste a list of names and USNs."
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ url: string, mimeType: string } | null>(null);
  const { members } = useMembers();

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target && event.target.result) {
              setAttachedImage({
                url: event.target.result as string,
                mimeType: file.type
              });
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };
  const { settings } = useSettings();
  const stats = useStats(members, settings);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const addMembersToDb = async (membersList: {name: string, usn: string}[]) => {
    setLoading(true);
    let addedCount = 0;
    try {
      for (const m of membersList) {
        await addDoc(collection(db, MEMBERS_COLLECTION), {
          name: m.name,
          usn: m.usn,
          amount: 300,
          status: "Pending",
          paymentMethod: "upi",
          notes: "Added via AI setup",
          proofUrl: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        await addDoc(collection(db, ACTIVITIES_COLLECTION), {
          user: m.name,
          action: "added via AI",
          timestamp: Date.now(),
          type: "add_member",
          createdAt: serverTimestamp()
        });
        addedCount++;
      }
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "model",
        text: `Successfully added ${addedCount} members to the database as Pending.`
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "model",
        text: "Error adding some members to the database."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || loading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: "user", text: input.trim() || (attachedImage ? "Attached an image." : "") };
    setMessages(prev => [...prev, userMessage]);
    
    const requestText = input.trim();
    const currentAttachment = attachedImage;
    
    setInput("");
    setAttachedImage(null);
    setLoading(true);

    try {
      // Build context
      const contextText = `
        Current system state:
        Total Members: ${stats.totalMembers}
        Paid: ${stats.paidMembers}
        Unpaid/Pending: ${stats.unpaidMembers}
        Amount Collected: ₹${stats.totalCollected}

        Members List (First 50): 
        ${members.slice(0, 50).map(m => `- ${m.name} (USN: ${m.usn}, Status: ${m.status}, Amount: ₹${m.amount})`).join("\n")}
        
        User instructions: If the user provides a list of members with names and USNs to add, do NOT actually use a tool. Instead, acknowledge the list, and explain you extracted them, and output a JSON block inside markdown like:
        \`\`\`json
        [
          {"name": "...", "usn": "..."}
        ]
        \`\`\`
        Then ask the user "Would you like me to add these members to the list?".
      `;

      const userParts: any[] = [{ text: requestText || "Please analyze this image." }];
      if (currentAttachment) {
        const base64Data = currentAttachment.url.split(',')[1];
        userParts.push({
          inlineData: {
            data: base64Data,
            mimeType: currentAttachment.mimeType
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: contextText }] },
          ...messages.filter(m => m.id !== "1").map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: "user", parts: userParts }
        ]
      });

      const replyText = response.text || "I couldn't process that.";
      
      // Parse for JSON block of members to add
      let parsedMembers: {name: string, usn: string}[] | undefined;
      const jsonMatch = replyText.match(/```json\s*(\[\s*\{[\s\S]*?\}\s*\])\s*```/);
      if (jsonMatch) {
        try {
          parsedMembers = JSON.parse(jsonMatch[1]);
        } catch (e) {}
      }

      const botMessage: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: "model", 
        text: replyText,
        isAddingMembers: !!parsedMembers,
        parsedMembers
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "model", text: "Something went wrong asking the AI." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:scale-105 premium-transition z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[360px] h-[500px] max-h-[80vh] bg-[#060B16] border border-sv-border rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-sv-border bg-gradient-to-r from-sv-primary/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sv-primary flex items-center justify-center shadow-lg">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white text-sm">Action AI</span>
                <span className="text-[10px] text-sv-text-secondary">Online</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-sv-text-secondary hover:text-white rounded-full hover:bg-white/5 premium-transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-sv-bg/50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-sv-border" : "bg-sv-primary/20 border border-sv-primary/30"}`}>
                  {msg.role === "user" ? <User className="w-4 h-4 text-sv-text-secondary" /> : <Bot className="w-4 h-4 text-sv-primary" />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-sv-primary text-white rounded-tr-sm" : "bg-sv-card border border-sv-border text-sv-text-primary rounded-tl-sm"}`}>
                  <p className="whitespace-pre-wrap break-words">{msg.text.replace(/```json[\s\S]*?```/g, '')}</p>
                  
                  {msg.parsedMembers && msg.parsedMembers.length > 0 && (
                    <div className="mt-3 p-3 bg-black/40 rounded-xl border border-sv-border">
                      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-sv-text-secondary">
                         <Users className="w-3.5 h-3.5" />
                         <span>{msg.parsedMembers.length} Members Extracted</span>
                      </div>
                      <div className="max-h-[100px] overflow-y-auto space-y-1 mb-3 scrollbar-hide">
                         {msg.parsedMembers.map((m, i) => (
                           <div key={i} className="text-xs text-sv-text-secondary flex justify-between bg-white/5 px-2 py-1 rounded">
                             <span className="text-white truncate pr-2">{m.name}</span>
                             <span className="font-mono">{m.usn}</span>
                           </div>
                         ))}
                      </div>
                      <button 
                        onClick={() => addMembersToDb(msg.parsedMembers!)}
                        className="w-full py-2 bg-sv-primary/20 hover:bg-sv-primary border border-sv-primary/30 hover:border-sv-primary text-sv-primary hover:text-white rounded-lg text-xs font-medium premium-transition flex flex-row items-center justify-center gap-2"
                      >
                         <UserPlus className="w-3.5 h-3.5" />
                         Add to Directory
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 flex-row">
                <div className="w-8 h-8 rounded-full bg-sv-primary/20 border border-sv-primary/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-sv-primary" />
                </div>
                <div className="bg-sv-card border border-sv-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-sv-primary animate-spin" />
                  <span className="text-xs text-sv-text-secondary">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-sv-border bg-sv-card/80 flex flex-col gap-2">
            {attachedImage && (
              <div className="relative inline-block w-20 h-20 rounded-xl overflow-hidden border border-sv-border">
                <img src={attachedImage.url} alt="Attached" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setAttachedImage(null)}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white premium-transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onPaste={handlePaste}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Ask, paste image, or paste list..."
                className="w-full bg-[#0B1220] border border-sv-border rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder:text-sv-text-secondary focus:outline-none focus:border-sv-primary focus:ring-1 focus:ring-sv-primary premium-transition"
              />
              <button 
                onClick={handleSend}
                disabled={(!input.trim() && !attachedImage) || loading}
                className="absolute right-2 p-1.5 bg-sv-primary hover:bg-sv-primary/80 disabled:bg-sv-border text-white disabled:text-sv-text-secondary rounded-lg premium-transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
