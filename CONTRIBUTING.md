# Contributing to Herald

Thank you for your interest in contributing to Herald! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Prerequisites**
   - Node.js >= 18.0.0
   - npm

2. **Clone the repository**
   ```bash
   git clone https://github.com/al3xjohnson/herald.git
   cd herald
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## Development Workflow

### Code Quality

We use several tools to maintain code quality:

- **TypeScript** - For type safety
- **ESLint** - For code linting
- **Prettier** - For code formatting
- **Vitest** - For testing

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run clean` - Remove build artifacts
- `npm run rebuild` - Clean and rebuild
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint source code
- `npm run lint:fix` - Lint and auto-fix issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run typecheck` - Run TypeScript type checking
- `npm run check` - Run all checks (typecheck, lint, format, test)

### Before Submitting a Pull Request

1. **Run all checks**
   ```bash
   npm run check
   ```

2. **Ensure all tests pass**
   ```bash
   npm test
   ```

3. **Format your code**
   ```bash
   npm run format
   ```

## Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint and Prettier)
- Write descriptive variable and function names
- Add comments for complex logic
- Keep functions focused and small
- Use `const` by default, `let` only when necessary
- Avoid `any` types - use proper TypeScript types

## Testing Guidelines

- Write tests for new features
- Ensure existing tests pass
- Aim for high test coverage
- Use descriptive test names
- Follow the existing test structure in `*.test.ts` files

## Commit Message Guidelines

- Use clear, descriptive commit messages
- Start with a verb in the present tense (e.g., "Add", "Fix", "Update")
- Keep the first line under 72 characters
- Add more detailed description if needed in subsequent lines

Examples:
```
Add support for Linux sound playback
Fix duplicate notification issue
Update ElevenLabs API integration
```

## Security

- Never commit sensitive data (API keys, passwords, etc.)
- Report security vulnerabilities privately
- Follow secure coding practices
- Validate and sanitize all user inputs

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run all checks (`npm run check`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure CI checks pass
- Be responsive to feedback

## Questions?

Feel free to open an issue if you have any questions or need help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
