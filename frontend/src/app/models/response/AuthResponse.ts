import { User } from "./User";

// Модель ЗАПРОСА
export interface AuthResponse {
    tutor: any;
    client: any;
    person: any;
    accessToken: string;
    refreshtoken: string;
    user: User;
    role: string;
    message: string;
    status: string;
}