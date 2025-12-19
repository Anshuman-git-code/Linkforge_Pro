# Contributing to LinkForge Pro

Thank you for your interest in contributing to LinkForge Pro! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

1. **Search existing issues** first to avoid duplicates
2. **Use issue templates** when available
3. **Provide detailed information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (browser, OS, etc.)
   - Screenshots if applicable

### Suggesting Features

1. **Check the roadmap** in README.md first
2. **Open a feature request** with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach
   - Any relevant mockups or examples

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
6. **Push to your fork**
7. **Create a Pull Request**

## 📋 Development Guidelines

### Code Style

#### Python (Backend)
- Follow **PEP 8** style guide
- Use **type hints** where appropriate
- Write **docstrings** for all functions
- Keep functions **under 50 lines**
- Use **meaningful variable names**

```python
def create_short_code(length: int = 6) -> str:
    """
    Generate a random short code using Base62 encoding.
    
    Args:
        length: Length of the short code (default: 6)
        
    Returns:
        Random alphanumeric string
    """
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))
```

#### JavaScript (Frontend)
- Use **ES6+** features
- Follow **consistent naming** conventions
- Write **comments** for complex logic
- Use **async/await** for promises
- Prefer **const/let** over var

```javascript
/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
}
```

#### CSS
- Use **BEM methodology** for class names
- Write **mobile-first** responsive styles
- Use **CSS custom properties** for theming
- Keep **specificity low**

### Testing Requirements

#### Backend Tests
- Write **unit tests** for all functions
- Test **error conditions**
- Mock **external dependencies**
- Achieve **80%+ code coverage**

#### Frontend Tests
- Test **user interactions**
- Test **API integration**
- Test **error handling**
- Test **responsive behavior**

### Documentation

- Update **README.md** for new features
- Add **API documentation** for new endpoints
- Include **code comments** for complex logic
- Update **deployment guides** if needed

## 🔄 Pull Request Process

### Before Submitting

1. **Test locally**:
   ```bash
   # Run tests
   npm test
   
   # Deploy to development
   ./scripts/deploy/deploy-all.sh development
   ```

2. **Check code quality**:
   ```bash
   # Validate CloudFormation
   aws cloudformation validate-template \
     --template-body file://infrastructure/cloudformation/infrastructure.yaml
   ```

3. **Update documentation** if needed

### Pull Request Template

```markdown
## 📝 Description
Brief description of changes and motivation.

## 🔧 Type of Change
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Maintenance (refactoring, dependencies, etc.)

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Tested in development environment

## 📋 Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## 📸 Screenshots (if applicable)
Add screenshots to help explain your changes.

## 🔗 Related Issues
Closes #(issue number)
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** from at least one maintainer
5. **Merge** to main branch

## 🏗️ Development Setup

### Prerequisites
- Node.js 16+
- Python 3.9+
- AWS CLI configured
- Git

### Local Setup
```bash
# Clone your fork
git clone https://github.com/yourusername/linkforge-pro.git
cd linkforge-pro

# Install dependencies
npm install

# Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install boto3

# Start local development
cd src/frontend
python3 -m http.server 8000
```

## 🎯 Areas for Contribution

### High Priority
- [ ] Unit and integration tests
- [ ] Performance optimizations
- [ ] Security enhancements
- [ ] Documentation improvements

### Medium Priority
- [ ] Custom domain support
- [ ] Bulk operations
- [ ] Advanced analytics
- [ ] API authentication

### Low Priority
- [ ] UI/UX improvements
- [ ] Additional deployment options
- [ ] Monitoring dashboards
- [ ] Mobile app

## 🐛 Bug Reports

### Security Issues
**Do not** open public issues for security vulnerabilities. Instead:
1. Email security@linkforge-pro.com
2. Include detailed description
3. Wait for acknowledgment before disclosure

### Bug Report Template
```markdown
## 🐛 Bug Description
A clear and concise description of what the bug is.

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## ✅ Expected Behavior
A clear description of what you expected to happen.

## 📸 Screenshots
If applicable, add screenshots to help explain your problem.

## 🖥️ Environment
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 22]
- Device: [e.g. Desktop, Mobile]

## 📋 Additional Context
Add any other context about the problem here.
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## 🚀 Feature Description
A clear and concise description of what you want to happen.

## 🎯 Problem Statement
What problem does this feature solve?

## 💭 Proposed Solution
Describe the solution you'd like.

## 🔄 Alternatives Considered
Describe any alternative solutions you've considered.

## 📋 Additional Context
Add any other context or screenshots about the feature request here.
```

## 📞 Getting Help

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: Check the `docs/` directory first
- **Email**: contact@linkforge-pro.com for other inquiries

## 🏆 Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page

## 📄 License

By contributing to LinkForge Pro, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to LinkForge Pro!** 🎉