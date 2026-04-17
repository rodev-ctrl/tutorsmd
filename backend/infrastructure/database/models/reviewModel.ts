import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from "../db";
import { ReviewAttributes } from '../types/InterfacesModels';

export type ReviewCreationAttributes = Optional<
  ReviewAttributes,
  'id' | 'created_at' | 'updated_at'
>;

class Review
  extends Model<ReviewAttributes, ReviewCreationAttributes>
  implements ReviewAttributes
{
  declare id: number;
  declare tutor_id: number;
  declare user_id: number;

  declare first_name: string;
  declare last_name: string;

  declare grade: number;
  declare comment: string;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Review.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tutor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'reviews',
    underscored: true,
    timestamps: true, // ✔ Sequelize сам управляет датами
    indexes: [
      {
        unique: true,
        fields: ['tutor_id', 'user_id'],
      },
    ],
  }
);

export default Review;

  