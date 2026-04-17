import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";

import { GastAttributes } from "../types/InterfacesModels";



export type GastCreationAttributes = Optional<
  GastAttributes,
  "messages" | "createdAt" | "updatedAt"
>;

export class Gast
  extends Model<GastAttributes, GastCreationAttributes>
  implements GastAttributes
{
  declare userid: string;
  declare chatid: string;
  declare messages: any | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Gast.init(
  {
    userid: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    chatid: {
      type: DataTypes.STRING(1024),
      allowNull: false,
    },
    messages: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "gasts",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userid", "chatid"],
      },
    ],
  }
);

export default Gast;

