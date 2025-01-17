# Sisu Build

## Design System

### Color Palette

The application uses a carefully selected color palette that reflects the Sisu brand identity:

#### Primary Colors

- **Sisu Blue** (`#4AABE1`)
  - Primary brand color
  - Used for main CTAs, interactive elements, and brand accents
  - Variants:
    - Light: `#7BC4EA` - Used for gradients and hover states
    - Dark: `#3588B3` - Used for hover states and text contrast

- **Sisu Yellow** (`#F7B32B`)
  - Secondary brand color
  - Used for accents and highlighting important elements
  - Provides contrast against the blue palette

#### Status Colors

- **Sisu Green** (`#4CAF50`)
  - Success states
  - Active status indicators
  - Positive feedback

- **Sisu Red** (`#FF6B6B`)
  - Error states
  - Warning messages
  - Critical information

### Color Usage Guidelines

1. **Buttons & Interactive Elements**
   - Primary actions: `sisu-blue`
   - Hover states: `sisu-blue-dark`
   - Disabled states: Use opacity reduction

2. **Text**
   - Primary text: `text-gray-900`
   - Secondary text: `text-gray-700`
   - Tertiary text: `text-gray-500`
   - On dark backgrounds: `text-white` or `text-gray-100`

3. **Backgrounds**
   - Main background: `bg-white` or `bg-gray-50`
   - Gradient sections: `from-sisu-blue-light to-sisu-blue-dark`
   - Accent sections: Use brand colors with appropriate opacity

4. **Status Indicators**
   - Success/Active: `sisu-green`
   - Error/Warning: `sisu-red`
   - Info: `sisu-blue`

## Deployment Instructions

### Prerequisites
- Node.js and npm installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project configured
- Proper access rights to the repository and Firebase project

### Version Management
The application uses semantic versioning (MAJOR.MINOR.PATCH). To update the version:

```bash
# For patch updates (bug fixes, minor changes)
npm run version:patch

# For minor updates (new features, backwards-compatible)
npm run version:minor

# For major updates (breaking changes)
npm run version:major

# For specific version
npm run version:specific <version>
```

### Deployment Steps

1. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "your commit message"
   ```
   This will:
   - Stage all changes
   - Create a commit with your changes

2. **Update Version**
   ```bash
   npm run version:patch  # or version:minor, version:major as needed
   ```
   This will:
   - Update the version in package.json
   - Create a git commit for the version change
   - Create a git tag for the version

3. **Push Changes to GitHub**
   ```bash
   git push && git push --tags
   ```
   This will:
   - Push the code changes to the main branch
   - Push the version tags

4. **Deploy to Firebase**
   ```bash
   npm run deploy
   ```
   This will:
   - Build the application with the new version
   - Deploy to Firebase hosting, Firestore rules, and Storage rules

### Verifying Deployment
- Check the deployed application at [https://hack-a-lot.web.app](https://hack-a-lot.web.app)
- Verify the version number in the profile dropdown menu
- Test the new features or fixes that were deployed

### Troubleshooting
- If the version number isn't updating, ensure you ran `npm run deploy` instead of just `firebase deploy`
- If deployment fails, check the Firebase Console for more detailed error messages
- For permission issues, ensure you're logged into the correct Firebase account


### All Command

```bash
npm run all -m="your commit message here"
```
