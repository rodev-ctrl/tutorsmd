export type MenuItem = {
  name: string;
  href: string;
}

export type ButtonSortTutors = {
  defaultValue: string;
  subjectValues: string[];
};

export type HeaderText = {
  buttonLessonReceive: string;
  title: string;
  buttonSortTutors: ButtonSortTutors;
};

export type Time = {
  id: number;
  name: string;
};

export type Question = {
  id: number;
  question: string;
  answer: string;
};