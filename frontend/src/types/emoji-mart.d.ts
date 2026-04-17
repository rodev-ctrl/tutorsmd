declare module '@emoji-mart/react' {
    import { FC } from 'react';
  
    export interface PickerProps {
      data: any; // Уточните тип, если доступен
      onEmojiSelect?: (emoji: any) => void; // Уточните тип, если доступен
      previewPosition?: 'none' | 'top' | 'bottom';
      theme?: 'light' | 'dark' | 'auto';
      [key: string]: any; // Для дополнительных атрибутов
    }
  
    const Picker: FC<PickerProps>;
    export default Picker;
  }
  