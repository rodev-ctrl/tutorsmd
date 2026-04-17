import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";

import { StudentTutorChatAttributes } from "../types/InterfacesModels";


export type StudentTutorChatCreationAttributes = Optional<
  StudentTutorChatAttributes,
  "id"
>;

export class StudentTutorChat
  extends Model<
    StudentTutorChatAttributes,
    StudentTutorChatCreationAttributes
  >
  implements StudentTutorChatAttributes
{
  declare id: number;
  declare chatid: string;
  declare messages: any;
}

StudentTutorChat.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    chatid: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    messages: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "studenttutorchats",
    timestamps: false,
  }
);

export default StudentTutorChat;
