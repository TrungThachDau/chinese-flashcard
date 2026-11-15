"use client";

import { useState, type FormEvent } from "react";
import { Check, Send } from "lucide-react";

export function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  if (subscribed) {
    return (
      <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
        <Check className="w-4 h-4 text-emerald-600" />
        <span>Cảm ơn bạn! Bản tin mẹo học sẽ gửi tới bạn mỗi sáng.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="nhapemail@gmail.com"
        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-orange-200 text-xs text-[#2d1b13] focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <button
        type="submit"
        className="clay-btn-coral px-4 py-2.5 text-xs font-black shrink-0"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}