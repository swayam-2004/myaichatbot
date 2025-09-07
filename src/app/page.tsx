"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { ArrowUpCircle } from "lucide-react";

type Role = "user" | "model";

interface Message {
  id: number;
  role: Role;
  content: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const el = document.querySelector(".chat-end");
    el?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mounted]);

  if (!mounted) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setFileText(text.trim());
    };
    reader.readAsText(file);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !fileText) return;

    const combinedInput = trimmed + (fileText ? `\n\n[Attached File Content]:\n${fileText}` : "");
  
    // User message creation
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmed + (fileName ? `\n\n📎 File: ${fileName}` : ""),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const contents = [
        ...messages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
        { role: "user", parts: [{ text: combinedInput }] },
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB-OfCUOtJTSuOutPfChAulAk1Md6Yoiiw`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        }
      );

      const data = await res.json();
      let aiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "Sorry, I didn't understand that.";

      aiText = aiText.replace(/\*\*(.*?)\*\*/g, "$1");

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "model",
        content: aiText,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, role: "model", content: "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
      setFileText("");
      setFileName("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-300 to-blue-500 text-white transition-colors">
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-6 border-4 border-white rounded-xl bg-white/20 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-center">My ChatBot AI</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <span className="text-2xl">{theme === "dark" ? "☀️" : "🌙"}</span>
          </Button>
        </div>

        <div className="w-full max-w-2xl mx-auto flex flex-col h-full p-4 bg-white/10 rounded-lg shadow-inner">
          <div className="flex-1 overflow-hidden">
            <div className="flex flex-col gap-4 pb-4 overflow-y-auto max-h-[60vh] pr-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "p-4 rounded-lg max-w-[80%] transition-transform duration-300",
                    msg.role === "user"
                      ? "bg-blue-600 text-white self-end transform hover:scale-105"
                      : "bg-pink-300 text-pink-900 self-start transform hover:scale-105"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="bg-pink-100 text-pink-800 p-3 rounded-lg max-w-[80%] self-start animate-pulse">
                  Typing...
                </div>
              )}
              <div className="chat-end" />
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex flex-col gap-2 pt-2"
          >
            {fileName && (
              <div className="text-sm text-gray-700 font-medium bg-gray-100 px-3 py-2 border border-gray-300 rounded-md">
                📎 {fileName}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <Input type="file" onChange={handleFileChange} className="w-full" />
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 transition-colors">
                  <ArrowUpCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
