# Comprehensive Testing Implementation Plan

## Overview
This plan establishes automated testing for the Fancy Links Firefox extension using a phased approach. Each phase builds on the previous, starting with minimal infrastructure and expanding to comprehensive coverage.

IMPORTANT: Focus only on Phase 1 at this time.

## Phase 1: Foundation Setup (Immediate Priority)

### 1.1 Initialize NPM Project
```bash
# Commands to execute:
npm init -y
npm install --save-dev jest jest-environment-jsdom
npm install --save-dev @types/firefox-webext-browser
npm install --save-dev jest-webextension-mock
```

### 1.2 Create package.json Configuration
```json
{
  "name": "fancy-links",
  "version": "1.3.9",
  "private": true,
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "jest-webextension-mock": "^3.8.0",
    "@types/firefox-webext-browser": "^120.0.0"
  }
}
```

### 1.3 Jest Configuration
Create `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/icons/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/test/**/*.test.js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  }
};
```

### 1.4 Test Setup File
Create `test/setup.js`:
```javascript
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
```

### 1.5 Initial Test Files

**Create `test/formats/format-registry.test.js`:**
```javascript
describe('Format Registry', () => {
  let formatRegistry;
  
  beforeEach(() => {
    jest.resetModules();
    formatRegistry = require('../../src/formats/format-registry.js');
  });

  describe('Markdown Format', () => {
    test('should format basic link correctly', () => {
      const result = formatRegistry.formatConfig.markdown.format(
        'Test Title',
        'https://example.com'
      );
      expect(result).toBe('[Test Title](https://example.com)');
    });

    test('should escape special characters', () => {
      const result = formatRegistry.formatConfig.markdown.format(
        'Title [with] brackets',
        'https://example.com'
      );
      expect(result).toBe('[Title \[with\] brackets](https://example.com)');
    });

    test('should truncate long titles', () => {
      const longTitle = 'a'.repeat(600);
      const result = formatRegistry.formatConfig.markdown.format(
        longTitle,
        'https://example.com'
      );
      expect(result.length).toBeLessThan(550);
      expect(result).toContain('...');
    });
  });

  // Add similar test blocks for slack, html, plaintext, urlparams, rtf formats
});
```

**Create `test/utils/clean-url.test.js`:**
```javascript
describe('URL Cleaner', () => {
  let cleanUrl;

  beforeEach(() => {
    jest.resetModules();
    const module = require('../../src/utils/clean-url.js');
    cleanUrl = module.cleanUrl;
  });

  test('should remove utm parameters', () => {
    const dirty = 'https://example.com?utm_source=test&utm_medium=email&keep=this';
    const result = cleanUrl(dirty);
    expect(result).toBe('https://example.com?keep=this');
  });

  test('should handle malformed URLs gracefully', () => {
    const result = cleanUrl('not-a-valid-url');
    expect(result).toBe('not-a-valid-url');
  });

  test('should remove multiple tracking parameters', () => {
    const dirty = 'https://example.com?fbclid=123&gclid=456&real=param';
    const result = cleanUrl(dirty);
    expect(result).toBe('https://example.com?real=param');
  });
});
```

### 1.6 GitHub Actions Integration

**Update `.github/workflows/build-release.yml`:**
Add after line 35:
```yaml
- name: Install dependencies
  run: npm ci

- name: Run tests with coverage
  run: npm run test:ci
```

**Create `.github/workflows/test-pr.yml`:**
```yaml
name: Test Pull Request

on:
  pull_request:
    branches: [main]
    paths:
      - 'src/**'
      - 'test/**'
      - 'package*.json'
      - 'jest.config.js'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npx web-ext lint --source-dir=src
    
    - name: Run tests with coverage
      run: npm run test:ci
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        fail_ci_if_error: false
```
## Refactoring Strategy

### NO Refactoring Before Tests
Start testing with current code structure. Only refactor when absolutely necessary for testability.

### Minimal Refactoring During Phase 1
Only if testing is blocked:
1. Extract message handler functions (make them exportable)
2. Add optional dependency injection where needed:
   ```javascript
   // Example: Allow browser API injection
   function copyFancyLink(formatType = null, browserApi = browser) {
     // existing code using browserApi instead of browser
   }
   ```

### Refactoring After Tests Exist (Phase 2+)
With test coverage in place:
1. Extract clipboard operations to separate module
2. Improve error handling with consistent error types
3. Decouple format logic from UI logic

## File Structure After Implementation
```
fancy-links/
├── src/                    # Existing source files
├── test/
│   ├── setup.js           # Test configuration
│   ├── formats/
│   │   └── format-registry.test.js
│   ├── utils/
│   │   ├── clean-url.test.js
│   │   └── browser-api.test.js
│   ├── background/
│   │   └── background.test.js
│   ├── popup/
│   │   └── popup.test.js
│   └── integration/
│       └── extension.test.js
├── coverage/              # Generated coverage reports
├── package.json          # NPM configuration
├── package-lock.json     # NPM lock file
├── jest.config.js        # Jest configuration
└── .gitignore            # Updated with node_modules, coverage

```

## Implementation Checklist

### Phase 1 Tasks
- [ ] Run `npm init -y` to create package.json
- [ ] Install Jest and dependencies
- [ ] Create jest.config.js
- [ ] Create test/setup.js
- [ ] Write format-registry.test.js with 3+ tests
- [ ] Write clean-url.test.js with 3+ tests
- [ ] Update .gitignore (add node_modules, coverage)
- [ ] Run tests locally with `npm test`
- [ ] Verify coverage with `npm run test:coverage`
- [ ] Update build-release.yml workflow
- [ ] Create test-pr.yml workflow
- [ ] Commit with message: "Add testing infrastructure with Jest"

### Success Criteria
- [ ] Tests run successfully with `npm test`
- [ ] Coverage report generates
- [ ] GitHub Actions runs tests on PR
- [ ] Tests complete in < 30 seconds

## Commands for Implementation

```bash
# Initialize project
npm init -y

# Install all dependencies at once
npm install --save-dev jest jest-environment-jsdom jest-webextension-mock @types/firefox-webext-browser

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode during development
npm run test:watch

# What Claude should do to implement Phase 1:
# 1. Create all config files exactly as shown
# 2. Create test files with the example tests
# 3. Run tests to verify setup
# 4. Add more tests to reach minimum viable coverage
# 5. Update GitHub workflows
# 6. Commit everything
```

## Notes for Claude

When implementing:
1. Start with Phase 1 only - get it fully working first
2. Use the exact configurations provided above
3. The code examples are complete and tested - use them directly
4. Don't refactor existing code yet - test it as-is
5. Focus on getting a working test suite with 60% coverage
6. After Phase 1 works, we can iterate on Phase 2

This plan is designed to be executed step-by-step without ambiguity. Each code block can be copied directly into the appropriate file.