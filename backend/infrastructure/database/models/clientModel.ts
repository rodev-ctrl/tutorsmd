/*
const {Schema, model} = require('mongoose');
const Client = new Schema({
	name: {
		type: String,
        required: true
	},
    surname: {
		type: String,
        required: true
	},
    email: {
    	type: String,
    	required: true,
        unique: true
    },
    pass: {
    	type: String,
    	required: true
    },
    roles: [{type: String, ref: 'Role'}]
});


module.exports = model('Client', Client);
*/
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import { ClientAttributes } from "../types/InterfacesModels";
import ClientToken from './tokenModel';
import Booking from "./bookingModel";


type ClientCreationAttributes = Optional<
  ClientAttributes,
  | "id"
  | "isActivated"
  | "newEmail"
  | "activationLink"
  | "changeEmailLink"
  | "messages"
  | "progress"
  | "username"
  | "createdAt"
  | "updatedAt"
>;

export class Client
  extends Model<ClientAttributes, ClientCreationAttributes> {
  declare id: number;
  declare name: string;
  declare surname: string;
  declare email: string;
  declare newEmail: string | null;
  declare password: string;
  declare isActivated: boolean;
  declare activationLink: string | null;
  declare changeEmailLink: string | null;
  declare messages: any | null;
  declare progress: any | null;
  declare username: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}


Client.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    surname: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },

    newEmail: { type: DataTypes.STRING, allowNull: true },

    password: { type: DataTypes.STRING, allowNull: false },

    isActivated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    activationLink: { type: DataTypes.STRING, allowNull: true },

    changeEmailLink: { type: DataTypes.STRING, allowNull: true },

    messages: { type: DataTypes.JSONB, allowNull: true },

    progress: { type: DataTypes.JSONB, allowNull: true },

    username: { type: DataTypes.STRING, allowNull: true }
  },
  {
    sequelize,
    tableName: "clients",
    timestamps: true,
  }
);

export default Client;
