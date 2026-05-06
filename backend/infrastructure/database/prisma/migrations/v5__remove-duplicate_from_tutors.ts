import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('tutors', 'email');
    await queryInterface.removeColumn('tutors', 'password');
    await queryInterface.removeColumn('tutors', 'name');
    await queryInterface.removeColumn('tutors', 'surname');
    await queryInterface.removeColumn('tutors', 'username');
    await queryInterface.removeColumn('tutors', 'isActivated');
    await queryInterface.removeColumn('tutors', 'activationLink');
  },

  async down(queryInterface: QueryInterface) {
    throw new Error('Cannot rollback: data would be lost');
  }
};