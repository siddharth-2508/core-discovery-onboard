# 🚀 Nykaa Core Discovery Frontend Onboarding Tool

An interactive CLI tool to guide new team members through the onboarding process for Nykaa Core Discovery Frontend.

## 📦 Installation

This tool is run directly via npx from GitHub, no installation needed!

```bash
npx github:siddharth-2508/core-discovery-onboard
```

> **Note:** If published to npm in the future, you can also use `npx nykaa-onboard`

## 🎯 Features

- ✅ **Progress Tracking** - Your progress is automatically saved and restored
- ⏱️ **Time Tracking** - Records when each step was completed
- 📅 **Completion Dates** - See exactly when you finished each step
- 👥 **Buddy System** - Add your onboarding buddy's contact for easy access
- ↩️ **Undo Steps** - Mark completed steps as incomplete to redo them
- ⚠️ **Smart Warnings** - Alerts if you've been waiting too long on required steps
- 🔄 **Auto-Skip Completed Steps** - No need to answer the same questions twice
- 📊 **Visual Progress Bar** - See your onboarding completion at a glance
- 🎨 **Interactive Menu** - Navigate between different sections easily
- 💾 **Persistent Storage** - Progress saved to `~/.nykaa-onboard-progress.json`
- ⏭️ **Optional Steps** - Skip non-critical steps and complete them later

## 📋 Available Commands

### Basic Usage

```bash
# Start or continue onboarding (default)
npx github:siddharth-2508/core-discovery-onboard
```

### Additional Commands

```bash
# View your current progress
npx github:siddharth-2508/core-discovery-onboard progress

# View architecture walkthrough only
npx github:siddharth-2508/core-discovery-onboard arch-walkthrough

# View frequently asked questions
npx github:siddharth-2508/core-discovery-onboard faqs

# View Jenkins pipelines list
npx github:siddharth-2508/core-discovery-onboard getJenkinsPipelines

# Reset all progress and start over
npx github:siddharth-2508/core-discovery-onboard reset

# Show help and available commands
npx github:siddharth-2508/core-discovery-onboard help
```

## 🎮 Interactive Menu Options

When you have partial progress, you'll see an interactive menu:

1. **▶️  Continue onboarding** - Resume where you left off
2. **📊 View progress checklist** - See completed and pending steps with dates
3. **🏗️  Architecture walkthrough** - Learn about team repositories
4. **👥 Setup/Update buddy info** - Add or update your onboarding buddy's contact
5. **↩️  Mark step as incomplete** - Undo a completed step to redo it
6. **🔄 Reset all progress** - Start the onboarding from scratch
7. **❓ FAQs** - View frequently asked questions
8. **🆘 Help & Commands** - View all available commands
9. **🚪 Exit** - Exit the tool (progress is saved)

## 📝 Onboarding Steps

The tool guides you through 10 steps:

1. ✅ **JIRA Access** (required)
2. ⏭️ **GitHub Copilot** (optional)
3. ✅ **VPN Access** (required)
4. ✅ **GitHub Repositories** (required)
5. ✅ **Google Tag Manager** (required)
6. ✅ **Monitoring Tools** (required) - Kibana, Grafana, New Relic
7. ✅ **Figma Access** (required)
8. ✅ **Run App Locally** (required)
9. ✅ **Architecture Walkthrough** (required)
10. ⏭️ **Jenkins Access** (optional)

## 🎨 Progress Visualization

The tool shows your progress with a visual bar and completion dates:

```
📊 Your Onboarding Progress

Progress: [████████████░░░░░░░░] 60% (6/10 steps)

Started: Jan 20, 2026 (3 days ago)

   ✅ JIRA Access                Completed on Jan 20, 2026 (3 days ago)
   ✅ GitHub Copilot             Completed on Jan 20, 2026 (3 days ago) (optional)
   ✅ VPN Access                 Completed on Jan 21, 2026 (2 days ago)
   ⏳ GitHub Repositories         Pending ⚠️  waiting 2 days
   ...
```

## 🗂️ Progress File Location

Your progress is stored in:
```
~/.nykaa-onboard-progress.json
```

This file contains:
- List of completed steps
- Completion timestamp for each step
- Onboarding start date
- Last update timestamp
- Buddy information (name and contact)

Example format:
```json
{
  "completed": ["jira", "vpn", "repos"],
  "completedSteps": {
    "jira": "2026-01-20T10:30:00.000Z",
    "vpn": "2026-01-21T14:15:00.000Z",
    "repos": "2026-01-22T09:45:00.000Z"
  },
  "startedAt": "2026-01-20T10:30:00.000Z",
  "lastUpdated": "2026-01-22T09:45:00.000Z",
  "buddy": {
    "name": "John Doe",
    "contact": "@johndoe"
  }
}
```

## 💡 Tips & Best Practices

### For New Users
- Run `npx github:siddharth-2508/core-discovery-onboard` to start your onboarding journey
- Your progress is automatically saved after each step
- If you get blocked (waiting for access), just exit - your progress is saved!
- Re-run the tool when you're ready to continue

### Onboarding Buddy
- Add your buddy's information when you first start (or anytime from the menu)
- Your buddy is an experienced team member who can help you
- Their contact info will appear in your progress view
- Reach out to them whenever you need help or have questions

### Optional Steps
- You can type `skip` for optional steps (GitHub Copilot, Jenkins)
- These can be completed later when needed

### Checking Progress
- Run `npx github:siddharth-2508/core-discovery-onboard progress` anytime to see your completion status
- No need to go through the flow to check where you are

### Undo a Step
- If you need to redo a step, use the interactive menu
- Select "Mark step as incomplete" from the menu
- Choose which step you want to redo
- The step will be marked as pending and you can complete it again

### Starting Over
- If you want to reset and start fresh, run `npx github:siddharth-2508/core-discovery-onboard reset`
- You'll be asked to confirm before resetting

## 🗂️ Progress File Location

Your progress is stored in:
```
~/.nykaa-onboard-progress.json
```

This file contains:
- List of completed steps
- Completion timestamp for each step
- Onboarding start date
- Last update timestamp

You can manually delete this file to reset progress, or use `npx github:siddharth-2508/core-discovery-onboard reset`.

## 🏗️ Architecture Overview

The tool covers these key repositories:

- **nykaa-web-reloaded** - Mobile web application
- **nykaa-dweb-reloaded** - Desktop web application
- **fe-core** - Shared frontend components
- **remote-config** - Feature flags & configurations
- **feature-forge** - Next.js pages
- **stride** - CHANEL brand code
- **rapid-aura** - Nykaa Quick Commerce
- **Mosaic** - LUMI Design System tokens
- **Essence** - LUMI-based UI components

## 🐛 Troubleshooting

### Progress Not Saving
- Check if you have write permissions to your home directory
- The file is created at `~/.nykaa-onboard-progress.json`

### Want to Start Fresh
```bash
npx github:siddharth-2508/core-discovery-onboard reset
```

### Tool Not Responding
- Press `Ctrl + C` to exit
- Your progress is saved after each completed step

### Project Structure
```
nykaa-onboard/
├── index.js           # Main CLI tool
├── package.json       # NPM package config
└── README.md         # This file
```

### Development
```bash
# Run locally during development
node index.js

# Test specific commands
node index.js progress
node index.js reset
```

## �‍💻 Author

**Siddharth Khurana**

Built with ❤️ for the Nykaa Core Discovery Frontend team.

## �📄 License

Internal tool for Nykaa Core Discovery Frontend team.

---

**Happy Onboarding! 🚀**

Need help? Run `npx github:siddharth-2508/core-discovery-onboard help`
