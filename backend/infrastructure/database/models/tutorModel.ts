/*
const {Schema, model} = require('mongoose');


const Client = new Schema({
	name: {
		type: String,
        required: true
	},
    password: {
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
import { TutorAttributes } from "../types/InterfacesModels";


export type TutorCreationAttributes = Optional<
  TutorAttributes,
  | "id"
  | "name"
  | "namegerman"
  | "surname"
  | "surnamegerman"
  | "email"
  | "newEmail"
  | "password"
  | "availableSubjects"
  | "highlight"
  | "highlightgerman"
  | "fulldescribe"
  | "fulldescribegerman"
  | "username"
  | "createdAt"
  | "updatedAt"
>;

export class Tutor
  extends Model<TutorAttributes, TutorCreationAttributes>
  implements TutorAttributes
{
  declare id: number;
  declare name: string;
  declare namegerman: string;
  declare surname: string;
  declare surnamegerman: string;
  declare email: string;
  declare newEmail: string | null;
  declare changeEmailLink: string | null;
  declare password: string;
  declare availableSubjects: any | null;
  declare rating_avg: number;
  declare rating_count: number;
  declare highlight: string;
  declare highlightgerman: string;
  declare fulldescribe: string;
  declare fulldescribegerman: string;
  declare messages: any | null;
  declare schedule: any | null;
  declare username: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Tutor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: { type: DataTypes.STRING, allowNull: false },
    namegerman: { type: DataTypes.STRING, allowNull: false },
    surname: { type: DataTypes.STRING, allowNull: false },
    surnamegerman: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    newEmail: { type: DataTypes.STRING, allowNull: true },
    changeEmailLink: { type: DataTypes.STRING, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: false },

    availableSubjects: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: "availablesubjects",
    },

    rating_avg: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      defaultValue: 0,
    },
    rating_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    

    highlight: { type: DataTypes.STRING, allowNull: false },
    highlightgerman: { type: DataTypes.STRING, allowNull: false },

    fulldescribe: { type: DataTypes.STRING, allowNull: false },
    fulldescribegerman: { type: DataTypes.STRING, allowNull: false},

    messages: { type: DataTypes.JSONB, allowNull: true },

    schedule: { type: DataTypes.JSONB, allowNull: true },
    username: { type: DataTypes.STRING, allowNull: true }
  },
  {
    sequelize,
    tableName: "tutors",
    timestamps: true,
  }
);

export default Tutor;
