export interface BookingAttributes {
    id: number;
    clientid: number | null;
    tutorid: number | null;
    tutoremail: string;
    datetime: string;
    lessonid: string;
    status: "process" | "cancelled" | "completed";
  }

  type FileMeta = { name: string; url: string; size?: number; type?: string };

  export interface Message {
    id?: string; 
    message?: string; answer?: string;
    name: string;
    files?: FileMeta[];
  }

  export interface ReviewAttributes {
    id: number;
    tutor_id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    grade: number;
    comment: string;
    created_at: Date;
    updated_at: Date
  };


  export interface ClientAttributes {
    id: number;
    name: string;
    surname: string;
    email: string;
    newEmail?: string | null;
    password: string;
    isActivated: boolean;
    activationLink?: string | null;
    changeEmailLink?: string | null;
    messages?: any | null;
    progress?: any | null;
    username: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface ComplaintAttributes {
    id: number;
    clientid: number;
    complaint: string;
  }

  export interface DeskAttributes {
    id: number;
    lessonid: string;
    page_index: number;
    data?: any | null;
    image_path?: string | null;
    updated_at: Date;
  }

  export interface FileAttributes {
    id?: number;
    name: string;
    type: string;
    accessLink?: string | null;
    size?: number | null;
    path?: string | null;
    user: string;
    parent?: string | null;
    childs?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface GastAttributes {
    userid: string;
    chatid: string;
    messages?: any | null;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface LessonAttributes {
    id: number;
    lessonid: string;
    client_email: string;
    tutor_email: string;
    datetime?: any | null;
    start_at: Date;
    duration_minutes: number;
    status: "process" | "cancelled" | "completed";
    created_at?: Date;
    updated_at?: Date;
  }

  export interface OfferAttributes {
    id: number;
    offer: string;
  }

  export interface StudentTutorChatAttributes {
    id: number;
    chatid: string;
    messages: any;
  }

  export interface TicketAttributes {
    ticket: string;
    user_email: string;
    expires_at: Date;
  }

  export interface TokenAttributes {
    id: string;
    clientid: number;
    refreshtoken: string;
    deviceid: string;
    createdat?: Date;
    updatedat?: Date;
  }

  export interface TokenTutorAttributes {
    id: string;
    tutorid: number | null;
    refreshtoken: string;
    deviceid: string;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface TutorAttributes {
    id: number;
    name: string;
    namegerman: string;
    surname: string;
    surnamegerman: string;
    email: string;
    newEmail?: string | null;
    changeEmailLink?: string | null;
    password: string;
    availableSubjects: any;
    rating_avg: number;
    rating_count: number;
    highlight: string;
    highlightgerman: string;
    fulldescribe: string;
    fulldescribegerman: string;
    messages?: any | null;
    schedule?: any | null;
    username: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }
  