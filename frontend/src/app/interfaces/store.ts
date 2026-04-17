import { Subject } from './lessons';
import { MenuItem, Question, Time } from './common';
import { HeaderText } from './common';
import { Client, Tutor } from './user';

export interface PropsStor {
   subjects: Subject[];
    tutors: Tutor[];
    menu: MenuItem[];
    menuClient: MenuItem[];
    menuTutor: MenuItem[];
    headerText: HeaderText;
    time: Time[];
    questions: Question[];
    likedTutors: number[];
    accessToken: string;
    user: Client | Tutor | null;
    role: string;
    language: string;
}