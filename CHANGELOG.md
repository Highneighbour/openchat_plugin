# Changelog

All notable changes to the OpenChat plugin for ElizaOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-19

### Added
- Initial release of OpenChat plugin for ElizaOS
- Command execution support (`/chat`, `/help`, `/info`)
- Autonomous message handling and responses
- Event subscription system (messages, member joins, bot install/uninstall)
- Express server for OpenChat bot endpoints
- JWT authentication and verification
- Bot definition schema generation from agent character
- OpenChat client service with multi-installation support
- Send message action for ElizaOS runtime
- Chat context provider
- Comprehensive documentation and examples
- Quick start guide
- Example character configuration
- Environment configuration templates

### Features
- **Bot Commands**: Users can execute commands directly in OpenChat
- **Autonomous Mode**: Bot responds to mentions and direct messages
- **Event Handling**: Subscribes to chat events like new messages and member joins
- **Multi-Installation**: Support for multiple groups, channels, and direct messages
- **ElizaOS Integration**: Full integration with ElizaOS actions, providers, and memory
- **Permission System**: Granular permission control for bot capabilities
- **Context Awareness**: Bot maintains conversation context across messages

### Technical Details
- Built with TypeScript
- Uses OpenChat Bot Client SDK v1.0.61
- Express.js server for bot endpoints
- Full type safety with TypeScript definitions
- Modular architecture (actions, providers, services, handlers)

### Documentation
- Comprehensive README with setup instructions
- Quick start guide for fast deployment
- Example character configuration
- Architecture documentation
- Troubleshooting guide
- API reference

## [Unreleased]

### Planned Features
- Rich message types (images, videos, files, polls)
- Message reaction handling
- Message deletion action
- Channel management actions
- Community-level operations
- Enhanced message threading
- User profile access
- Chat history retrieval provider
- Message search functionality
- Analytics and metrics tracking

### Known Issues
- MessagePack notification parsing is simplified (needs proper library)
- Principal calculation in get-principal.js is placeholder
- Limited error recovery in some edge cases
- No retry logic for failed API calls

### Future Improvements
- Add unit tests
- Add integration tests
- Implement connection pooling
- Add rate limiting
- Improve error messages
- Add metrics and monitoring
- Support for multiple bot instances
- Database persistence for installations
- Webhook support for external triggers
- Admin dashboard
- Message scheduling
- Command autocomplete

---

For more details, see the [README](README.md) and [documentation](https://github.com/yourusername/plugin-openchat).
