import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    // Удаляем поля которые теперь в users
    await queryInterface.removeColumn('clients', 'email');
    await queryInterface.removeColumn('clients', 'password');
    await queryInterface.removeColumn('clients', 'name');
    await queryInterface.removeColumn('clients', 'surname');
    await queryInterface.removeColumn('clients', 'username');
    await queryInterface.removeColumn('clients', 'isActivated');
    await queryInterface.removeColumn('clients', 'activationLink');
  },

  async down(queryInterface: QueryInterface) {
    // Откат: восстанавливаем поля
    // (данные вернуть не можем, это деструктивная миграция)
    throw new Error('Cannot rollback: data would be lost');
  }
};