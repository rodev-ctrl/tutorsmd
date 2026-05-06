import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    // ON CONFLICT потому что некоторые id могут совпадать с clients
    await queryInterface.sequelize.query(`
      INSERT INTO users (id, email, password, name, surname, username, created_at, updated_at)
      SELECT id, email, password, name, surname, username, "createdAt", "updatedAt"
      FROM tutors
      ON CONFLICT (id) DO NOTHING;
    `);

    // Создаём роль 'tutor' для каждого тьютора
    await queryInterface.sequelize.query(`
      INSERT INTO user_roles (user_id, role, is_primary, created_at)
      SELECT id, 'tutor', true, NOW()
      FROM tutors;
    `);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM user_roles WHERE role = 'tutor';
    `);

    await queryInterface.sequelize.query(`
      DELETE FROM users WHERE id IN (SELECT id FROM tutors);
    `);
  }
};