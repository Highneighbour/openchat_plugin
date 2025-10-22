# Changelog

All notable changes to the OpenChat plugin will be documented in this file.

## [0.2.0] - 2025-10-22 - Major Feature Enhancement

### Added
- **11 New Actions:**
  - `sendMediaMessageAction` - Send images, videos, audio, and files
  - `createPollAction` - Create interactive polls with multiple options
  - `reactToMessageAction` - Add emoji reactions to messages
  - `removeReactionAction` - Remove emoji reactions from messages
  - `deleteMessageAction` - Delete messages (moderation)
  - `pinMessageAction` - Pin important messages
  - `unpinMessageAction` - Unpin messages
  - `createChannelAction` - Create channels in communities
  - `deleteChannelAction` - Delete channels
  - `inviteMembersAction` - Invite users to groups/communities
  - `removeMembersAction` - Remove users from groups/communities

- **2 New Providers:**
  - `chatDetailsProvider` - Comprehensive chat/group/channel information
  - `messageHistoryProvider` - Recent message history for context

- **1 New Evaluator:**
  - `moderationEvaluator` - Automatic content moderation with spam detection, inappropriate content filtering, and excessive caps detection

- **2 New Bot Commands:**
  - `/moderate <action>` - Configure moderation (enable/disable/status)
  - `/poll <question> <options>` - Create polls with ease

- **7 New Configuration Options:**
  - `OPENCHAT_WELCOME_NEW_MEMBERS` - Welcome new members
  - `OPENCHAT_SAY_GOODBYE` - Say goodbye to leaving members
  - `OPENCHAT_AUTO_RESPOND_ALL` - Respond to all messages
  - `OPENCHAT_MODERATION_ENABLED` - Enable automatic moderation
  - `OPENCHAT_MODERATION_ACTION` - Action on flagged content (warn/delete)
  - `OPENCHAT_MODERATION_KEYWORDS` - Custom keyword filters
  - `@msgpack/msgpack` dependency for proper MessagePack parsing

- **3 Example Characters:**
  - `moderator-character.ts` - Community moderator bot
  - `engagement-character.ts` - Engagement and activity bot
  - `integration-character.ts` - Integration and automation bot

- **Comprehensive Documentation:**
  - `FEATURES.md` - Complete feature list and capabilities
  - `ENHANCEMENTS.md` - Detailed enhancement documentation
  - `SUMMARY.md` - Enhancement summary
  - Updated README with all new features

### Improved
- **Event Handling:** Proper MessagePack parsing using official library
- **Event Types:** Support for reactions, member left, and more event types
- **Error Handling:** Better error recovery and fallback mechanisms
- **Logging:** More detailed and structured logging throughout
- **Type Safety:** Improved TypeScript types and validation
- **API Flexibility:** Type casting for evolving OpenChat APIs
- **Permission Validation:** Better permission checking before actions

### Changed
- Updated `/help` command to include new capabilities
- Updated `/info` command to list moderation and poll features
- Enhanced bot schema with moderation command
- Improved autonomous message handling with better context

### Fixed
- TypeScript compilation errors with action exports
- BotClient API compatibility issues
- MessagePack parsing fallbacks
- Type safety in all action handlers

## [0.1.0] - 2025-10-19 - Initial Release

### Added
- Initial plugin structure
- Basic text message sending (`sendMessageAction`)
- Command execution framework
  - `/chat <message>` - Chat with the AI agent
  - `/help` - Show available commands
  - `/info` - Get agent information
- Event notification handling
  - Bot installation/uninstallation events
  - Message events (with mention detection)
  - Member joined events
- Bot installation tracking
- JWT authentication and verification
- Express server for bot endpoints
- OpenChat client service
- Chat context provider
- Dynamic bot definition generation
- Welcome message functionality
- Multiple installation support (groups, channels, DMs)
- ElizaOS integration
  - Action system
  - Provider system
  - Service registration
  - Memory and state handling
- Comprehensive README documentation
- QUICKSTART guide
- Example character configuration
- MIT License

### Security
- JWT token verification for all commands
- Permission-based action validation
- Secure private key management
- Environment variable configuration
