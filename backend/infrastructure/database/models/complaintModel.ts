import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";

import { ComplaintAttributes } from "../types/InterfacesModels";



type ComplaintCreationAttributes = Optional<ComplaintAttributes, "id">;

export class Complaint
  extends Model<ComplaintAttributes, ComplaintCreationAttributes>
  implements ComplaintAttributes
{
  declare id: number;
  declare clientid: number;
  declare complaint: string;
}

Complaint.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    clientid: { type: DataTypes.INTEGER, allowNull: false },
    complaint: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    tableName: "complaints",
    timestamps: false,
  }
);

export default Complaint;
