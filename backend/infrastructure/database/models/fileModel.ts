import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";

import { FileAttributes } from "../types/InterfacesModels";



export type FileCreationAttributes = Optional<
  FileAttributes,
  "id" | "accessLink" | "size" | "path" | "parent" | "childs" | "createdAt" | "updatedAt"
>;

export class File
  extends Model<FileAttributes, FileCreationAttributes>
  implements FileAttributes
{
  declare id: number;
  declare name: string;
  declare type: string;
  declare accessLink: string | null;
  declare size: number | null;
  declare path: string | null;
  declare user: string;
  declare parent: string | null;
  declare childs: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

File.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    accessLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },

    path: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },

    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    parent: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    childs: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "file",
    timestamps: true,
  }
);

export default File;
