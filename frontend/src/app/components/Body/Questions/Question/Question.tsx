"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";

const plus = require("../../../../../assets/img/plus.png");

type QuestionType = {
  id: number;
  question: string;
  answer: string;
};

const Question: React.FC<QuestionType> = ({ id, question, answer }) => {
  const [open, setOpen] = useState(false);
  const [questionsItemSize, setQuestionsItemSize] = useState<string>("text-xl");

  useEffect(() => {
    if(window.innerWidth < 900) setQuestionsItemSize("text-md");
    if(window.innerWidth < 500) setQuestionsItemSize("text-sm");
    if(window.innerWidth < 450) setQuestionsItemSize("text-xs");
  }, []);

  return (
    <div className="question w-full">
      <Button
        disableRipple
        onClick={() => setOpen((v) => !v)}
        sx={{
          width: "100%",
          minHeight: 64,
          borderBottom: "1px solid #e5e7eb",
          borderRadius: 0,
          justifyContent: "space-between",
          alignItems: "center",
          textTransform: "none",
          bgcolor: "transparent",
          "&:hover": { bgcolor: "transparent" },
          p: 2,
        }}
      >
        <span className={`text-left font-bold text-base ${questionsItemSize}`}>
          {question}
        </span>
        <img
          alt="toggle"
          src={plus}
          width={28}
          height={28}
          style={{
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 200ms",
          }}
        />
      </Button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="p-3">
              <p className="text-sm sm:text-base">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(Question);
