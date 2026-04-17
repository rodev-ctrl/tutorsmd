import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import { Client } from "./clientModel";
import { BookingAttributes } from "../types/InterfacesModels";
import Tutor from "./tutorModel";

type BookingCreationAttributes = Optional<BookingAttributes, "id">;

export class Booking extends Model<
  BookingAttributes,
  BookingCreationAttributes
> {
  declare id: number;
  declare clientid: number | null;
  declare tutorid: number | null;
  declare tutoremail: string;
  declare datetime: string;
  declare lessonid: string;
  declare status: string;
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    clientid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    tutorid: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    tutoremail: { type: DataTypes.STRING, allowNull: false },

    datetime: { type: DataTypes.STRING, allowNull: false },

    lessonid: { type: DataTypes.STRING, allowNull: false },

    status: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    tableName: "bookings",
    timestamps: false,
  }
);


// Обработка конфликтов при вставке данных (пример для PostgreSQL)
// INSERT INTO distributors (id, dname) VALUES (1, 'Distributor 1'), (2, 'Distributor 2')
// ON CONFLICT (id) DO UPDATE SET dname = EXCLUDED.dname;
// ON CONFLICT (id) DO NOTHING; -- Игнорировать конфликт и не вставлять дубликат
// ON CONFLICT DUPLICATE KEY UPDATE dname = VALUES(dname);

// Возврат только нужных полей при запросе данных
// SELECT id, dname FROM distributors WHERE id = 1;
// или 
// INSERT INTO distributors (id, dname) VALUES (1, 'Distributor 1'), (2, 'Distributor 2')
// ON CONFLICT (id) DO UPDATE SET dname = EXCLUDED.dname;
// RETURNING dname;


// УДАЛЕНИЕ ВСЕГО И ВСЕГО СВЯЗАННОГО С ТАБЛИЦЕЙ
// TRUNCATE TABLE distributors RESTART IDENTITY CASCADE;
// TRUNCATE FROM distributors WHERE id = 1;

// УДАЛЕНИЕ СВЯЗАННЫХ ДАННЫХ ПРИ УДАЛЕНИИ ЗАПИСИ
// DELETE FROM distributors WHERE id = 1 CASCADE; -- Удаляет запись и связанные с ней данные  

// ОБЫЧНОЕ УДАЛЕНИЕ ЗАПИСИ
// DELETE FROM distributors WHERE id = 1; -- Удаляет запись, но связанные данные остаются (может вызвать ошибки из-за нарушенных связей)


Booking.belongsTo(Client, { foreignKey: "clientid" });
Booking.belongsTo(Tutor, { foreignKey: "tutorid" });


export default Booking;
