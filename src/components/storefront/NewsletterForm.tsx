"use client";

import { useState } from "react";
import Icon from "./Icon";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    try {
      const list = JSON.parse(localStorage.getItem("ssg-letters") || "[]");
      list.push({ email, at: Date.now() });
      localStorage.setItem("ssg-letters", JSON.stringify(list));
    } catch {}
    setSent(true);
    setEmail("");
  };

  return (
    <>
      <form className="letters-form" onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="your address, please"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="Email address"
        />
        <button type="submit">
          <Icon name="feather" size={14} /> Subscribe
        </button>
      </form>
      <div className={"letters-thanks " + (sent ? "in" : "")} role="status" aria-live="polite">
        {sent && "Thank you — your first letter follows."}
      </div>
    </>
  );
}
