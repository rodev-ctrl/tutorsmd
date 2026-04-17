"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@mui/material";
import { useLanguage } from "../../context/LanguageContext";

type Props = { paddingLanguageButton?: string };

type Language = "german" | "russian";

export default function Language({ paddingLanguageButton = "10px" }: Props) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const labels: Record<Language, { button: string; ru: string; de: string }> = {
    german: { button: "Deutsch", ru: "Russisch", de: "Deutsch" },
    russian: { button: "Русский", ru: "Русский", de: "Немецкий" },
  };

  // fallback, если localStorage испорчен
  const safeLang: Language =
    language === "german" || language === "russian"
      ? language
      : "russian";

  const { button, ru, de } = labels[safeLang];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function changeLanguage(lang: Language) {
    setLanguage(lang);
    setOpen(false);
  }

  return (
    <div ref={ref} className="languages">
      <Button
        color="warning"
        onClick={() => setOpen((p) => !p)}
        style={{ padding: paddingLanguageButton, margin: "25px" }}
      >
        <b>{button}</b>
      </Button>

      {open && (
        <div className="absolute top-full left-0 p-2 bg-white border z-50">
          <Button color="warning" onClick={() => changeLanguage("russian")}>
            {ru}
          </Button>
          <br />
          <Button color="warning" onClick={() => changeLanguage("german")}>
            {de}
          </Button>
        </div>
      )}
    </div>
  );
}
