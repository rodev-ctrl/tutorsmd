
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";

import { DeskAttributes } from "../types/InterfacesModels";



type DeskCreationAttributes = Optional<
  DeskAttributes,
  "id" | "data" | "image_path" | "updated_at"
>;

export class Desk
  extends Model<DeskAttributes, DeskCreationAttributes>
  implements DeskAttributes
{
  declare id: number;
  declare lessonid: string;
  declare page_index: number;
  declare data: any;
  declare image_path: string | null;
  declare updated_at: Date;
}

Desk.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    lessonid: { type: DataTypes.STRING, allowNull: false },

    page_index: { type: DataTypes.INTEGER, allowNull: false },

    data: { type: DataTypes.JSONB, allowNull: true },

    image_path: { type: DataTypes.STRING, allowNull: true },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("NOW()"),
    },
  },
  {
    sequelize,
    tableName: "desks",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["lessonid", "page_index"] },
    ],
  }
);

export default Desk;
