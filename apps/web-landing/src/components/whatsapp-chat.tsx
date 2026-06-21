'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@eduai365/ui';

export function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappNumber = '916003526521';
  const prefilledMessage = encodeURIComponent('Hello eduAI365, I have a question about the platform.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${prefilledMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="mb-4 w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-md text-white"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center font-bold text-white">
                    edu
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-zinc-950 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-body-md font-bold leading-tight">eduAI365 Support</h4>
                  <p className="text-xs text-white/70">Typically replies instantly</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 bg-zinc-950/50 space-y-4">
              <div className="rounded-2xl rounded-tl-none bg-white/5 border border-white/5 p-3.5 text-body-sm text-white/80 max-w-[90%] leading-relaxed">
                Hi there! 👋 How can we help you today? Ask us about our AI School OS modules, features, sales inquiries, or franchisee partnership opportunities.
              </div>
            </div>

            {/* Footer / CTA Button */}
            <div className="p-4 border-t border-white/5 bg-zinc-900/50">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-all duration-300 py-3 text-body-md font-bold text-white shadow-lg shadow-emerald-900/20"
              >
                <MessageCircle className="h-5 w-5 fill-current" />
                Start WhatsApp Chat
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 outline-none",
          isOpen 
            ? "bg-zinc-800 border border-white/10" 
            : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
        )}
        aria-label="Toggle live chat"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.button>
    </div>
  );
}
