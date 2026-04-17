import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      INSERT INTO users (id, email, password, name, surname, username, created_at, updated_at)
      SELECT id, email, password, name, surname, username, "createdAt", "updatedAt"
      FROM clients;
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO user_roles (user_id, role, is_primary, created_at)
      SELECT id, 'client', true, NOW()
      FROM clients;
    `);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM user_roles WHERE role = 'client';
    `);

    await queryInterface.sequelize.query(`
      DELETE FROM users WHERE id IN (SELECT id FROM clients);
    `);
  }
};