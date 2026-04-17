import ApiError from "../../domain/errors/apiError";
import ClientAttributes from "../../infrastructure/database/models/clientModel";
import Message from "../infrastructure/database/models/message";


export default class ClientDto {

  // DTO - readonly
  // public field1;      // Доступно везде (по умолчанию)
  // private field2;     // Только внутри класса
  // protected field3;   // Внутри класса + наследники
  // readonly field4;    // Нельзя изменить после инициализации

    public readonly id: number;
    public readonly name: string;
    public readonly surname: string;
    email: string; 
    hashedPassword: string;
    public isActivated: boolean; 
    public readonly messages: Message[];
    public readonly progress: Object;
    public readonly username: string;
    
    constructor(model: ClientAttributes) {
        if (!model) {
            throw ApiError.NotFound("Client not found");
        }

        this.id = model.id;
        this.name = model.name;
        this.surname = model.surname;
        this.email = model.email; 
        this.hashedPassword = model.password;
        this.isActivated = model.isActivated || false;
        this.messages = model.messages ?? [];
        this.progress = model.progress || {}; 
        this.username = model.username || "";
    }
}
