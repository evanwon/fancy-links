// Mock browser APIs
require('jest-webextension-mock');

// Mock clipboard API
global.navigator.clipboard = {
  writeText: jest.fn(() => Promise.resolve()),
  write: jest.fn(() => Promise.resolve())
};

// Mock ClipboardItem
global.ClipboardItem = jest.fn((items) => items);

// Setup common test utilities
global.mockTab = (overrides = {}) => ({
  id: 1,
  url: 'https://example.com',
  title: 'Example Page',
  active: true,
  ...overrides
});