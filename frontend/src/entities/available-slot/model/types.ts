export interface AvailableSlot {
  id:        string;
  tutorId?:   string;
  dayOfWeek: number; // 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa
  startTime: string; // "HH:MM"
  endTime:   string;
  isActive:  boolean;
}