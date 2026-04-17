import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";

import { TokenAttributes } from "../types/InterfacesModels";



type TokenCreationAttributes = Optional<
  TokenAttributes,
  "id" | "createdat" | "updatedat"
>;

export class TokenModel
  extends Model<TokenAttributes, TokenCreationAttributes>
  implements TokenAttributes
{
  declare id: string;
  declare clientid: number;
  declare refreshtoken: string;
  declare deviceid: string;

  declare readonly createdat: Date;
  declare readonly updatedat: Date;
}

TokenModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clientid: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: "tokensclients",
    timestamps: true,
    createdAt: "createdat",
    updatedAt: "updatedat",
  }
);

export default TokenModel;
