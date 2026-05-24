export interface GetAppealsDto {
  lessonId?: string;   // фильтр по уроку
  onlyOpen?: boolean;  // только открытые (для админа)
  all?: boolean;       // DCT (для админа)
}