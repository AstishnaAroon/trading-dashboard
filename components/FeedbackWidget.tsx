"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

export default function FeedbackWidget() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>(" ");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) return;

    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    const feedbackData = {
      user_id: user?.id || null, // Capture Clerk User ID if they are logged in [2]
      email: user?.primaryEmailAddress?.emailAddress || "anonymous@domain.com", // Capture email automatically [2]
      message: cleanMessage,
      status: "NEW",
    };

    const { error } = await supabase.from("feedback").insert([feedbackData]);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
      setMessage(" "); // Reset input
      setTimeout(() => {
        setIsOpen(false); // Smoothly close the widget after 2 seconds on success
        setSuccess(false);
      }, 2000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 text-white font-sans select-none">
      {/* 1. Floating Trigger Button - Styled with clean 9999px pill boundary [DESIGN (5).md] */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-white text-inkwell hover:bg-bone border border-iron shadow-2xl flex items-center justify-center transition-transform duration-200 hover:scale-105 cursor-pointer"
        title="Report an Issue / Submit Feedback"
      >
        {isOpen ? (
          /* Minimal Close Icon */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          /* Minimal Speech Bubble Icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* 2. Floating Dialog Panel - Styled in strict "Slash" Slate Card Design [DESIGN (5).md] */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-slate border border-iron rounded-[10px] shadow-2xl p-5 animate-fadeIn">
          <h3 className="text-sm font-bold text-bone mb-1">Terminal Feedback</h3>
          <p className="text-[10px] text-ash uppercase tracking-wider mb-4">Report bugs or suggest terminal enhancements.</p>

          {success && (
            <div className="bg-graphite border border-iron text-bone text-xs p-3 rounded-sm mb-4 text-center">
              Feedback successfully logged to admin ledger. Thank you!
            </div>
          )}
          {errorMsg && (
            <div className="bg-graphite border border-ember-gold text-ember-gold text-xs p-3 rounded-sm mb-4 text-center">
              Error: {errorMsg}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your issue or idea here..."
                  rows={4}
                  className="w-full bg-graphite border border-iron text-bone text-xs p-3 rounded-sm focus:border-ember-gold focus:ring-0 outline-none resize-none leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-inkwell h-10 font-bold text-xs rounded-sm hover:bg-bone transition-all duration-200 cursor-pointer uppercase tracking-wider"
              >
                {loading ? "Sending..." : "Submit Feedback"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}