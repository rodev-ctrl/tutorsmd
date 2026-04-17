import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";

export interface UsersChatsMessageAttributes {
  id: number;
  chat_id: string;      
  sender_email: string;
  text: string | null;
  created_at: Date;
  edited: boolean;
  deleted: boolean;
}

export type UsersChatsMessageCreationAttributes = Optional<
  UsersChatsMessageAttributes,
  "id" | "created_at" | "edited" | "deleted"
>;

export class UsersChatsMessage
  extends Model<UsersChatsMessageAttributes, UsersChatsMessageCreationAttributes>
  implements UsersChatsMessageAttributes
{
  declare id: number;
  declare chat_id: string;
  declare sender_email: string;
  declare text: string | null;
  declare created_at: Date;
  declare edited: boolean;
  declare deleted: boolean;
}

UsersChatsMessage.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    chat_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sender_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    edited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "userschatsmessages",
    timestamps: false, 
    underscored: true,
  }
);

export default UsersChatsMessage;