import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";

import { TokenTutorAttributes } from "../types/InterfacesModels";



export type TokenTutorCreationAttributes = Optional<
  TokenTutorAttributes,
  "id" | "tutorid" | "createdAt" | "updatedAt"
>;

export class TokenTutorModel
  extends Model<TokenTutorAttributes, TokenTutorCreationAttributes>
  implements TokenTutorAttributes
{
  declare id: string;
  declare tutorid: number | null;
  declare refreshtoken: string;
  declare deviceid: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TokenTutorModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    tutorid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "tutorid",
    },

    refreshtoken: {
      type: DataTypes.STRING(2048),
      allowNull: false,
    },

    deviceid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "tokenstutors",
    timestamps: true,
    createdAt: "createdat",
    updatedAt: "updatedat",
  }
);

export default TokenTutorModel;

