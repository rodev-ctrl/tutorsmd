export interface GooglePayload {
  sub:            string;         // стабильный, уникальный ID аккаунта у Google
  email:          string;
  emailVerified:  boolean;        // критично: только если true, можно auto-link на существующий локальный аккаунт
  name:           string | null;
  givenName:      string | null;
  familyName:     string | null;
  picture:        string | null;
}

export interface IGoogleTokenVerifier {
  /**
   * Проверяет ID-токен (JWT credential от Google Identity Services) —
   * подпись, issuer, audience (наш GOOGLE_CLIENT_ID) и срок действия.
   * Бросает ошибку, если токен невалиден.
   */
  verify(idToken: string): Promise<GooglePayload>;
}
