# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Herald, please report it responsibly:

1. **Do NOT** open a public issue
2. Email the maintainer privately (see GitHub profile)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge your report within 48 hours and provide a detailed response within 7 days.

## Security Best Practices

Herald follows these security practices:

### Input Validation

- All user inputs are validated and sanitized
- Command injection prevention through proper escaping
- AppleScript and PowerShell inputs are escaped to prevent injection attacks

### Sensitive Data

- API keys and credentials are stored in user configuration files (`~/.config/herald/config.json`)
- Credentials are never logged or exposed in error messages
- Configuration files should have appropriate permissions (user-only read/write)

### Dependencies

- Regular dependency audits using `npm audit`
- Minimal dependency footprint
- Only trusted, well-maintained packages

### Code Quality

- TypeScript for type safety
- Comprehensive test coverage
- ESLint for security-aware linting
- Regular security reviews

## Known Security Considerations

### Command Execution

Herald executes system commands for:
- Playing audio (afplay, paplay, powershell)
- Text-to-speech (say, powershell)
- Window activation (osascript, wmctrl, powershell)

All command parameters are properly escaped or passed as arguments arrays to prevent injection.

### API Communication

- ElevenLabs API calls use HTTPS
- API keys are transmitted securely
- Network errors are handled gracefully

### File System Access

- Configuration files stored in user home directory
- Lock files for synchronization
- Temporary audio files cleaned up after use

## Recommendations for Users

1. **Protect your API keys**
   - Never share your ElevenLabs API key
   - Keep `~/.config/herald/config.json` permissions restricted

2. **Keep Herald updated**
   - Regularly update to the latest version
   - Review CHANGELOG.md for security fixes

3. **Review permissions**
   - Understand what system commands Herald executes
   - Review the source code if you have concerns

## Security Updates

Security updates will be released as patch versions (e.g., 1.8.3) and documented in CHANGELOG.md.

## Contact

For security concerns, contact the maintainers through:
- GitHub: [@al3xjohnson](https://github.com/al3xjohnson)
- Issues: For non-sensitive security discussions only

Thank you for helping keep Herald and its users safe!
