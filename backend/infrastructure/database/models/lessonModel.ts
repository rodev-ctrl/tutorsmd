import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import Client from "./clientModel";
import Tutor from "./tutorModel";
import { LessonAttributes } from "../types/InterfacesModels";


export type LessonCreationAttributes = Optional<
  LessonAttributes,
  "id" | "datetime" | "status" | "created_at" | "updated_at"
>;

export class Lesson
  extends Model<LessonAttributes, LessonCreationAttributes>
  implements LessonAttributes
{
  declare id: number;
  declare lessonid: string;
  declare client_email: string;
  declare tutor_email: string;
  declare datetime: any | null;
  declare start_at: Date;
  declare duration_minutes: number;
  declare status: "process" | "cancelled" | "completed";

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Lesson.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    lessonid: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
    },

    client_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    tutor_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    datetime: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    start_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 90,
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "process",
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
    tableName: "lessons",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);

// Ассоциации по email (целевые поля в родительских моделях — email)
Lesson.belongsTo(Client, { as: 'client', foreignKey: 'client_email', targetKey: 'email' });
Lesson.belongsTo(Tutor,  { as: 'tutor',  foreignKey: 'tutor_email',  targetKey: 'email' });

export default Lesson;
