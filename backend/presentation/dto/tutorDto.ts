import ApiError from "../exceptions/apiError";
import { Message } from "../interfaces/InterfacesModels";
import TutorAttributes from "../models/tutorModel";

export default class TutorDto {
    id: number;
    name: string;
    namegerman: string;
    surname: string;
    surnamegerman: string;
    email: string;
    newEmail: string;
    changeEmailLink: string;
    availablesubjects: string[];
    highlight: string;
    highlightgerman: string;
    fulldescribe: string;
    fulldescribegerman: string;
    messages: Message[];
    username: string;

    constructor(model: TutorAttributes) {
        if (!model) {
            throw ApiError.NotFound("Tutor not found");
        }

        this.id = model.id;
        this.name = model.name;
        this.namegerman = model.namegerman;
        this.surname = model.surname;
        this.surnamegerman = model.surnamegerman;
        this.email = model.email;

        // Fallbacks kept as same type
        this.newEmail = model.newEmail ?? "N/A";
        this.changeEmailLink = model.changeEmailLink ?? "N/A";

        this.availablesubjects = model.availableSubjects ?? [];

        this.highlight = model.highlight;
        this.highlightgerman = model.highlightgerman;

        this.fulldescribe = model.fulldescribe;
        this.fulldescribegerman = model.fulldescribegerman;

        this.messages = model.messages ?? [];
        this.username = model.username || "";
    }
}
