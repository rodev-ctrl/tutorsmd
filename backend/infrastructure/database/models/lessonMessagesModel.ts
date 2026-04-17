import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import Lesson from "./lessonModel"; 

export interface LessonMessageAttributes {
  id: number;
  lessonid: string;   
  sender_email: string;
  text: string;
  type: "text" | "system" | "file";
  created_at?: Date;
  updated_at?: Date;
}

// Атрибуты для создания (id и даты опциональны)
export type LessonMessageCreationAttributes = Optional<
  LessonMessageAttributes,
  "id" | "type" | "created_at" | "updated_at"
>;

export class LessonMessage
  extends Model<LessonMessageAttributes, LessonMessageCreationAttributes>
  implements LessonMessageAttributes
{
  declare id: number;
  declare lessonid: string;
  declare sender_email: string;
  declare text: string;
  declare type: "text" | "system" | "file";

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

LessonMessage.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    lessonid: {
      type: DataTypes.STRING(255),
      allowNull: false,
      // Индекс критически важен для быстрого поиска сообщений урока
      references: {
        model: "lessons",
        key: "lessonid",
      },
    },
    sender_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "text",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "lesson_messages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);


LessonMessage.belongsTo(Lesson, { foreignKey: "lessonid", targetKey: "lessonid", as: "lesson" });
Lesson.hasMany(LessonMessage, { foreignKey: "lessonid", sourceKey: "lessonid", as: "messages" });

export default LessonMessage;