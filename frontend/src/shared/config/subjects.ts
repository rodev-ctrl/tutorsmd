export interface SubjectConfig {
  id:    string; // UUID из таблицы subjects
  nameDe: string;
  nameRu: string;
  nameEn: string;
  icon:  string;
}

export const SUBJECTS: SubjectConfig[] = [
  {
    id:     'c9b8b0af-7217-4b17-b529-f49c7024e83f',
    nameDe: 'Mathematik',
    nameRu: 'Математика',
    nameEn: 'Mathematics',
    icon:   '📐',
  },
  {
    id:     '424323dc-8794-4a6c-b683-a0c854b4eb96',
    nameDe: 'Deutsch',
    nameRu: 'Немецкий',
    nameEn: 'German',
    icon:   '📖',
  },
];

export const getSubjectName = (
  subject: SubjectConfig,
  lang: string,
): string => {
  if (lang === 'ru') return subject.nameRu;
  if (lang === 'en') return subject.nameEn;
  return subject.nameDe;
};