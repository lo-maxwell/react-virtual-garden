const { Pool } = require('pg');

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  connect: jest.fn(() => Promise.resolve(mockClient)),
};

module.exports = {
  Pool: jest.fn(() => mockPool),
};