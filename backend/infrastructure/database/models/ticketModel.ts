import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";

import { TicketAttributes } from "../types/InterfacesModels";


export type TicketCreationAttributes = Optional<TicketAttributes, never>;

export class Ticket extends Model<TicketAttributes, TicketCreationAttributes>
  implements TicketAttributes {
    
  declare ticket: string;
  declare user_email: string;
  declare expires_at: Date;
}

Ticket.init(
  {
    ticket: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    user_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "ticket",
    timestamps: false,
  }
);

export default Ticket;
