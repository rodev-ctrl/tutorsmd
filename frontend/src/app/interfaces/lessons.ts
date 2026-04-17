export type Subject = {
  id: number;
  subjectName: string;
  level: string[];
  description: string;
  image: string;
};

export type Booking = {
  id: number;
  clientid: number;
  tutoremail: string;
  datetime: string;
  lessonid: string;
  status: string;
  tutorid: number;
};


export type WeeklyPlan = {
  id: number;
  lessonid: string;
  client_email: string;
  tutor_email: string;
  status: string;
  datetime: {
    timezone: string;
    subjects: Record<
      string,
      Array<{ dow: number; time: string; status: string }>
    >;
  };
};