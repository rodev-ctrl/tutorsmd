import { TextField } from "@mui/material";
import React from "react";


  type Props = {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  
  const TextInput: React.FC<Props> = ({ value, onChange }) => {
    return (
      <TextField
        value={value}
        onChange={onChange}
        label="Ответ"
        variant="outlined"
      />
    );
  };
  
  export default React.memo(TextInput);
  