<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Setup Status

This is a React Native project using TypeScript as the language. The project has been successfully scaffolded using Expo as the development platform.

### Project Structure

- `src/App.tsx` - Main application component
- `src/` - Source code directory for all TypeScript components
- `app.json` - Expo configuration file
- `babel.config.js` - Babel transpiler configuration
- `tsconfig.json` - TypeScript compiler configuration
- `index.js` - Application entry point
- `.github/copilot-instructions.md` - Copilot custom instructions

## Contributing Guidelines

- Maintain TypeScript type safety throughout the project
- Follow React Native best practices
- Keep components functional and modular
- Use TypeScript interfaces for props and state
- Run `npm start` to start the development server
- Use `npm run ios` or `npm run android` to test on specific platforms
- Use `npm run web` to test in the browser

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Start iOS development
- `npm run android` - Start Android development
- `npm run web` - Start web development

## Project Dependencies

### Core Dependencies
- react-native (^0.84.1)
- react (^19.2.7)
- expo (^57.0.0)
- typescript (^6.0.3)

### Navigation
- @react-navigation/native
- @react-navigation/stack

## Development Setup

All dependencies have been installed. To work on the project:

1. Run `npm start` to start the Expo development server
2. Use the terminal menu to select your platform (web, iOS, or Android)
3. Make changes to `.tsx` files in the `src/` directory
4. The app will hot reload with your changes

