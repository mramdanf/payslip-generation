'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');  
const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const employees = await generateEmployees();
    await queryInterface.bulkInsert('user', employees, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user', {
      role: 'employee'
    }, {});
  }
};

async function generateEmployees() {
  const employees = [];
  const hashedPassword = await bcrypt.hash('employee123', 10);
  const usedUsernames = new Set();

  for (let i = 0; i < 100; i++) {
    const employeeId = uuidv4();
    let username = generateUniqueUsername(usedUsernames);
    
    const employee = {
      id: employeeId,
      username: username,
      password_hash: hashedPassword,
      name: faker.person.fullName(),
      role: 'employee',
      monthly_salary: generateRandomSalary(),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: employeeId,
      updated_by: employeeId
    };

    employees.push(employee);
  }

  return employees;
}

function generateUniqueUsername(usedUsernames) {
  let username;
  let attempts = 0;
  
  do {
    if (attempts > 50) {
      username = `emp_${faker.string.alphanumeric(8)}`;
      break;
    }
    
    username = faker.internet.username().toLowerCase();
    attempts++;
  } while (usedUsernames.has(username));

  usedUsernames.add(username);
  return username;
}

function generateRandomSalary() {
  const salariers = [4000000, 5000000, 20000000, 30000000];
  const randomIndex = faker.number.int({ min: 0, max: salariers.length - 1 });
  return salariers[randomIndex];
}
