import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";

import { OfferAttributes } from "../types/InterfacesModels";



export type OfferCreationAttributes = Optional<OfferAttributes, "id">;

export class Offer
  extends Model<OfferAttributes, OfferCreationAttributes>
  implements OfferAttributes
{
  declare id: number;
  declare offer: string;
}

Offer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    offer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "offers",
    timestamps: false,
  }
);

export default Offer;
