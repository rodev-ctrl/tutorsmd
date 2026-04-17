import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";

class PasswordResetModel extends Model {
  declare id: number;
  declare email: string;
  declare link: string;
  declare expires_at: Date;
  declare used: boolean;
  declare role: string;
}

PasswordResetModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 15 * 60 * 1000),
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, 
    },
    role: {
        type: DataTypes.ENUM("client", "tutor"),
        allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "password_reset_links",
    timestamps: true, 
    updatedAt: false, 
  }
);

export default PasswordResetModel;