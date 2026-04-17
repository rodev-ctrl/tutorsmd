import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import UsersChatsMessage from "./usersChatsMessagesModel";

export interface UsersChatsMessageFileAttributes {
  id: number;
  message_id: number;
  url: string;
  type: string; 
  size: number;
  path: string; 
  created_at: Date;
}

export type UsersChatsMessageFileCreationAttributes = Optional<
  UsersChatsMessageFileAttributes,
  "id" | "created_at"
>;

export class UsersChatsMessageFile
  extends Model<UsersChatsMessageFileAttributes, UsersChatsMessageFileCreationAttributes>
  implements UsersChatsMessageFileAttributes
{
  declare id: number;
  declare message_id: number;
  declare url: string;
  declare type: string;
  declare size: number;
  declare path: string;
  declare created_at: Date;
}

UsersChatsMessageFile.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    message_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "userschatsmessages",
        key: "id",
      },
      onDelete: "CASCADE", // файлы удаляются при удалении сообщения
    },
    url: {
      type: DataTypes.STRING(512),
      allowNull: false, // публичная ссылка для скачивания/просмотра
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING(512),
      allowNull: true, // может быть null, если храним только в облаке
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "userschatsmessagefiles",
    timestamps: false,
    underscored: true,
  }
);

// Ассоциации
UsersChatsMessage.hasMany(UsersChatsMessageFile, {
  foreignKey: "message_id",
  as: "files",
  onDelete: "CASCADE",
});

UsersChatsMessageFile.belongsTo(UsersChatsMessage, {
  foreignKey: "message_id",
  as: "message",
});

export default UsersChatsMessageFile;