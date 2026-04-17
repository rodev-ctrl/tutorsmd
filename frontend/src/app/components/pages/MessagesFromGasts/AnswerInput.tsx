// components/AnswerInput.tsx

import React, { memo, useState } from "react";
import { Button } from "@mui/material";

type Props = {
  chatId: string;
  onSend: (chatId: string, message: string) => void;
};

const AnswerInput: React.FC<Props> = ({ chatId, onSend }) => {
  const [input, setInput] = useState("");

  return (
    <div className="flex">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ваш ответ..."
      />
      <Button onClick={() => onSend(chatId, input)}>Ответить</Button>
    </div>
  );
};

export default memo(AnswerInput);
