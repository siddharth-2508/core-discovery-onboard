#!/usr/bin/env node


// toDo:  Tooling Access Checklist (non-blocking). Instead of just links, make it trackable: 

import readline from "readline";
import fs from "fs";
import path from "path";
import os from "os";

const rl= readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Progress tracking setup
const PROGRESS_FILE = path.join(os.homedir(), '.nykaa-onboard-progress.json');
const STEPS = [
  { id: 'jira', name: 'JIRA Access', required: true },
  { id: 'copilot', name: 'GitHub Copilot', required: true },
  { id: 'vpn', name: 'VPN Access', required: true },
  { id: 'repos', name: 'GitHub Repositories', required: true },
  { id: 'gtm', name: 'Google Tag Manager', required: true },
  { id: 'monitoring', name: 'Monitoring Tools', required: true },
  { id: 'figma', name: 'Figma Access', required: true },
  { id: 'local', name: 'Run App Locally', required: true },
  { id: 'architecture', name: 'Architecture Walkthrough', required: true },
  { id: 'jenkins', name: 'Jenkins Access', required: false }
];

// Progress management functions
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('\x1b[33m⚠️  Could not load progress file. Starting fresh.\x1b[0m');
  }
  return { 
    completed: [],
    completedSteps: {}, // { stepId: timestamp }
    startedAt: new Date().toISOString(),
    lastUpdated: null,
    buddy: null // { name, contact }
  };
}

function saveProgress(progress) {
  try {
    const data = {
      ...progress,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('\x1b[33m⚠️  Could not save progress.\x1b[0m');
  }
}

function resetProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
      console.log('\n✅ \x1b[32mProgress reset successfully!\x1b[0m');
      console.log('\x1b[90mAll completion dates, timestamps, and buddy info have been cleared.\x1b[0m\n');
    } else {
      console.log('\n✅ No progress file found. Starting fresh!\n');
    }
  } catch (error) {
    console.log('\x1b[33m⚠️  Could not reset progress.\x1b[0m');
  }
}

function displayProgress(progress) {
  const completed = progress.completed || [];
  const completedSteps = progress.completedSteps || {};
  const totalSteps = STEPS.length;
  const completedCount = completed.length;
  const percentage = Math.round((completedCount / totalSteps) * 100);
  
  // Progress bar
  const barLength = 30;
  const filledLength = Math.round((completedCount / totalSteps) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  console.log('\n═════════════════════════════════════════════════════════════');
  console.log('\n📊 \x1b[1m\x1b[36mYour Onboarding Progress\x1b[0m\n');
  console.log(`Progress: [${bar}] ${percentage}% (${completedCount}/${totalSteps} steps)\n`);
  
  // Calculate total time
  if (progress.startedAt) {
    const daysSinceStart = getDaysSince(progress.startedAt);
    const startDate = formatDate(progress.startedAt);
    console.log(`\x1b[90mStarted: ${startDate} (${formatDuration(daysSinceStart)})\x1b[0m\n`);
  }
  
  STEPS.forEach(step => {
    const isCompleted = completed.includes(step.id);
    const icon = isCompleted ? '✅' : '⏳';
    const requiredTag = step.required ? '' : '\x1b[90m(optional)\x1b[0m';
    
    if (isCompleted) {
      const completedDate = completedSteps[step.id];
      const dateStr = formatDate(completedDate);
      const daysAgo = getDaysSince(completedDate);
      const durationStr = daysAgo === 0 ? '\x1b[32mtoday\x1b[0m' : `\x1b[90m${formatDuration(daysAgo)}\x1b[0m`;
      console.log(`   ${icon} ${step.name.padEnd(25)} \x1b[32mCompleted\x1b[0m on ${dateStr} (${durationStr}) ${requiredTag}`);
    } else {
      // Calculate wait time for pending steps
      const waitingSince = progress.lastUpdated || progress.startedAt;
      const daysWaiting = getDaysSince(waitingSince);
      let waitMsg = '';
      if (daysWaiting >= 3 && step.required) {
        waitMsg = ` \x1b[31m⚠️  waiting ${daysWaiting} days\x1b[0m`;
      } else if (daysWaiting >= 1) {
        waitMsg = ` \x1b[90m(${daysWaiting}d)\x1b[0m`;
      }
      console.log(`   ${icon} ${step.name.padEnd(25)} \x1b[33mPending\x1b[0m${waitMsg} ${requiredTag}`);
    }
  });
  
  // Show warnings for long-pending required steps
  const longPendingSteps = STEPS.filter(step => {
    const isPending = !completed.includes(step.id);
    const isRequired = step.required;
    const waitTime = getDaysSince(progress.lastUpdated || progress.startedAt);
    return isPending && isRequired && waitTime >= 3;
  });
  
  if (longPendingSteps.length > 0 && completedCount > 0) {
    console.log('\n\x1b[33m⚠️  Action Required:\x1b[0m');
    longPendingSteps.forEach(step => {
      console.log(`   • ${step.name} - Consider reaching out to your manager or IT`);
    });
  }
  
  if (progress.lastUpdated) {
    const lastUpdate = new Date(progress.lastUpdated).toLocaleString();
    console.log(`\n\x1b[90mLast updated: ${lastUpdate}\x1b[0m`);
  }
  
  // Show buddy info if available
  if (progress.buddy) {
    console.log(`\n👥 \x1b[1mYour Buddy:\x1b[0m ${progress.buddy.name} (${progress.buddy.contact})`);
  }
  
  console.log('\n═════════════════════════════════════════════════════════════\n');
}

function markStepCompleted(stepId) {
  const progress = loadProgress();
  if (!progress.completed.includes(stepId)) {
    progress.completed.push(stepId);
    if (!progress.completedSteps) {
      progress.completedSteps = {};
    }
    progress.completedSteps[stepId] = new Date().toISOString();
    saveProgress(progress);
  }
}

function isStepCompleted(stepId) {
  const progress = loadProgress();
  return progress.completed.includes(stepId);
}

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function getDaysSince(isoString) {
  if (!isoString) return 0;
  const then = new Date(isoString);
  const now = new Date();
  const diffTime = Math.abs(now - then);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatDuration(days) {
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

async function setupBuddy() {
  const progress = loadProgress();
  
  console.log('\n═════════════════════════════════════════════════════════════');
  console.log('\n👥 \x1b[1m\x1b[36mOnboarding Buddy Setup\x1b[0m\n');
  console.log('Your buddy is an experienced team member who can help you');
  console.log('throughout your onboarding journey.\n');
  
  if (progress.buddy) {
    console.log('\x1b[1mCurrent Buddy:\x1b[0m');
    console.log(`   Name:    ${progress.buddy.name}`);
    console.log(`   Contact: ${progress.buddy.contact}\n`);
    
    const update = await ask('Do you want to update buddy information? (y/n): ');
    if (update.toLowerCase() !== 'y') {
      console.log('\n✅ Buddy information unchanged.\n');
      return;
    }
    console.log('');
  }
  
  const name = await ask('Enter your buddy\'s name: ');
  if (!name) {
    console.log('\n⚠️  Buddy name is required.\n');
    return;
  }
  
  const contact = await ask('Enter their email: ');
  if (!contact) {
    console.log('\n⚠️  Contact information is required.\n');
    return;
  }
  
  progress.buddy = { name: name.trim(), contact: contact.trim() };
  saveProgress(progress);
  
  console.log('\n✅ \x1b[32mBuddy information saved!\x1b[0m');
  console.log(`\nYou can reach out to \x1b[1m${progress.buddy.name}\x1b[0m at \x1b[36m${progress.buddy.contact}\x1b[0m`);
  console.log('whenever you need help or have questions.\n');
}

async function undoStep() {
  const progress = loadProgress();
  const completed = progress.completed || [];
  
  if (completed.length === 0) {
    console.log('\n\x1b[33m⚠️  No completed steps to undo.\x1b[0m\n');
    return;
  }
  
  console.log('\n═════════════════════════════════════════════════════════════');
  console.log('\n🔄 \x1b[1m\x1b[36mMark Step as Incomplete\x1b[0m\n');
  console.log('Select a step to mark as incomplete:\n');
  
  // Show completed steps
  completed.forEach((stepId, index) => {
    const step = STEPS.find(s => s.id === stepId);
    if (step) {
      console.log(`   ${index + 1}. ${step.name}`);
    }
  });
  
  console.log(`   ${completed.length + 1}. Cancel\n`);
  
  const choice = await ask(`Enter your choice (1-${completed.length + 1}): `);
  const choiceNum = parseInt(choice);
  
  if (choiceNum === completed.length + 1 || isNaN(choiceNum)) {
    console.log('\n✅ Cancelled.\n');
    return;
  }
  
  if (choiceNum < 1 || choiceNum > completed.length) {
    console.log('\n⚠️  Invalid choice.\n');
    return;
  }
  
  const stepId = completed[choiceNum - 1];
  const step = STEPS.find(s => s.id === stepId);
  
  const confirm = await ask(`\n⚠️  Mark "${step.name}" as incomplete? (yes/no): `);
  
  if (confirm.toLowerCase() === 'yes') {
    // Remove from completed array
    progress.completed = progress.completed.filter(id => id !== stepId);
    
    // Remove timestamp
    if (progress.completedSteps && progress.completedSteps[stepId]) {
      delete progress.completedSteps[stepId];
    }
    
    saveProgress(progress);
    console.log(`\n✅ \x1b[32m"${step.name}" marked as incomplete.\x1b[0m`);
    console.log('\x1b[90mYou can complete it again by continuing onboarding.\x1b[0m\n');
  } else {
    console.log('\n✅ Cancelled.\n');
  }
}

//helpers
const shouldProceed = async (question) => {
  const shouldProceedNow = await ask(question);
  if (shouldProceedNow.toLowerCase() === "y") {
    return true;
  }
  return false;
}

const getJenkinsPipelines = () => {
  console.log("\n\x1b[1mKey Jenkins Pipelines:\x1b[0m\n");
  console.log("   1. PDP Mobile Web (preprod beauty)");
  console.log("   2. Desktop Web Reloaded (preprod beauty)");
  console.log("   3. Feature Forge (preprod beauty)");
  console.log("   4. Feature Forge (preprod man)");
  console.log("   5. Stride (SNS)");
  console.log("   6. Rapid Aura (QC)");
  console.log("\n\x1b[33m📞 Contact your buddy or check internal documentation for Jenkins URLs\x1b[0m\n");
}

const showHelp = () => {
  console.log("\n═════════════════════════════════════════════════════════════");
  console.log("\n🆘 \x1b[1m\x1b[36mNykaa Onboarding Tool - Help\x1b[0m\n");
  console.log("\x1b[1mAvailable Commands:\x1b[0m\n");
  console.log("  \x1b[36mnpx github:siddharth-2508/core-discovery-onboard\x1b[0m");
  console.log("    Start or continue your onboarding journey\n");
  console.log("  \x1b[36mnpx github:siddharth-2508/core-discovery-onboard progress\x1b[0m");
  console.log("    View your current onboarding progress\n");
  console.log("  \x1b[36mnpx github:siddharth-2508/core-discovery-onboard arch-walkthrough\x1b[0m");
  console.log("    View architecture walkthrough only\n");
  console.log("  \x1b[36mnpx github:siddharth-2508/core-discovery-onboard faqs\x1b[0m");
  console.log("    View frequently asked questions\n");
  console.log("  \x1b[36mnpx github:siddharth-2508/core-discovery-onboard getJenkinsPipelines\x1b[0m");
  console.log("    View list of Jenkins pipelines\n");
  console.log("  \x1b[36mnpx github:siddharth-2508/core-discovery-onboard reset\x1b[0m");
  console.log("    Reset all progress and start over\n");
  console.log("  \x1b[36mnpx github:siddharth-2508/core-discovery-onboard help\x1b[0m");
  console.log("    Show this help message\n");
  console.log("\x1b[1m💡 Tips:\x1b[0m\n");
  console.log("  • Your progress is automatically saved after each step");
  console.log("  • You can exit anytime and resume later");
  console.log("  • Optional steps can be skipped by typing 'skip'\n");
  console.log("\x1b[1m📝 Progress File Location:\x1b[0m\n");
  console.log("  ~/.nykaa-onboard-progress.json\n");
  console.log("═════════════════════════════════════════════════════════════\n");
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
console.log("\n   👋 Welcome to Nykaa Core Discovery Frontend Onboarding!")
console.log("   This tool will guide you step by step.")
console.log("\n   💡 Type \x1b[36mnpx github:siddharth-2508/core-discovery-onboard help\x1b[0m to see all available commands")
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")


/**
 * Utility to ask a question and wait for input
 */
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

/**
 * STEP 1: Welcome
 */
async function stepWelcome() {
  console.log("\n✨ \x1b[1m\x1b[36mHey there, Welcome aboard!\x1b[0m\n");
  console.log("Ready to level up with Nykaa Core Discovery Frontend?\n");
  console.log("We've got you covered with this smooth, step-by-step onboarding.");
  console.log("Let's make magic happen! 🚀\n");
  
  const progress = loadProgress();
  
  // Ask about buddy if not already set
  if (!progress.buddy) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("👥 \x1b[1mBefore we begin...\x1b[0m\n");
    console.log("Do you have an onboarding buddy assigned to help you?");
    console.log("(A buddy is an experienced team member who can guide you)\n");
    
    const hasBuddy = await ask("Would you like to add your buddy's information? (y/n): ");
    
    if (hasBuddy.toLowerCase() === 'y') {
      console.log('');
      await setupBuddy();
    } else {
      console.log("\n💡 \x1b[90mNo worries! You can add buddy info anytime from the menu.\x1b[0m\n");
    }
  } else {
    console.log(`\n👥 Your buddy: \x1b[1m${progress.buddy.name}\x1b[0m (${progress.buddy.contact})\n`);
  }
}


/**
 * STEP 2: JIRA Access
 */
async function stepJiraAccess() {
  const stepId = 'jira';
  
  if (isStepCompleted(stepId)) {
    console.log("\n✅ \x1b[32m[JIRA Access] Already completed - Skipping\x1b[0m");
    return true;
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 \x1b[1mStep 1: JIRA Access Check\x1b[0m\n");

  const answer = await ask("💬 Do you have JIRA access? (y/n): ");

  if (answer.toLowerCase() === "y") {
    console.log("\n✅ \x1b[32mAwesome! JIRA access confirmed.\x1b[0m\n");
    markStepCompleted(stepId);
    return true;
  }

  console.log("\n⏳ \x1b[33mNo worries! Let's get you set up.\x1b[0m");
  console.log("\n📝 \x1b[1mHere's what you need to do:\x1b[0m\n");
  console.log(
    "1. Contact your buddy or manager for the Service Desk portal URL\n" +
    "2. Raise an IT Service Request for 'JIRA Access'\n\n" +
    "\x1b[1mRequest details:\x1b[0m\n" +
    "  • \x1b[1mAccess Requested For:\x1b[0m New Access\n" +
    "  • \x1b[1mCategory:\x1b[0m Application Access\n" +
    "  • \x1b[1mSub Category:\x1b[0m jira\n"
  );
  console.log("\n💡 \x1b[33mOnce you have access, just re-run this tool!\x1b[0m\n");

  return false;
}

/**
 * STEP 3: Github Co-pilot Access
 */
async function stepGithubCopilotAccess() {
  const stepId = 'copilot';
  
  if (isStepCompleted(stepId)) {
    console.log("\n✅ \x1b[32m[GitHub Copilot] Already completed - Skipping\x1b[0m");
    return true;
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 \x1b[1mStep 2: GitHub Copilot Access Check\x1b[0m \x1b[90m(optional)\x1b[0m\n");

  const answer = await ask("💬 Do you have GitHub Copilot access? (y/n/skip): ");

  if (answer.toLowerCase() === "skip") {
    console.log("\n⏭️  \x1b[33mSkipping GitHub Copilot for now.\x1b[0m\n");
    markStepCompleted(stepId);
    return true;
  }
  
  if (answer.toLowerCase() === "y") {
    console.log("\n✅ \x1b[32mPerfect! GitHub Copilot is ready to assist you.\x1b[0m\n");
    markStepCompleted(stepId);
    return true;
  }

  console.log("\n⏳ \x1b[33mLet's get you AI-powered coding assistance!\x1b[0m");
  console.log("\n📝 \x1b[1mHere's what you need to do:\x1b[0m\n");
  console.log(
    "1. Contact your buddy or manager for the Service Desk portal URL\n" +
    "2. Raise an IT Service Request for 'GitHub Copilot Access'\n\n" +
    "\x1b[1mRequest details:\x1b[0m\n" +
    "  • \x1b[1mCo-pilot Request Type:\x1b[0m Owner\n"
  );
  console.log("\n💡 \x1b[33mOnce approved, re-run this tool to continue!\x1b[0m\n");

  return false;
}

/**
 * STEP 4: VPN Access
 */
async function stepVpnAccess() {
  const stepId = 'vpn';
  
  if (isStepCompleted(stepId)) {
    console.log("\n✅ \x1b[32m[VPN Access] Already completed - Skipping\x1b[0m");
    return true;
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 \x1b[1mStep 3: VPN Access Check\x1b[0m\n");

  const answer = await ask("💬 Do you have access to the VPN? (y/n): ");

  if (answer.toLowerCase() === "y") {
    console.log("\n✅ \x1b[32mGreat! You're connected to our secure network.\x1b[0m\n");
    markStepCompleted(stepId);
    return true;
  }

  console.log("\n🔒 \x1b[33mVPN access is essential for accessing internal resources.\x1b[0m");
  console.log("\n📝 \x1b[1mHere's what you need to do:\x1b[0m\n");
  console.log(
    "1. Contact your buddy or manager for the Service Desk portal URL\n" +
    "2. Raise an IT Service Request for 'VPN Creation and Access'\n\n" +
    "\x1b[1mRequest details:\x1b[0m\n" +
    "  • \x1b[1mVPN Request Category:\x1b[0m VPN\n" +
    "  • \x1b[1mVPN Sub Category:\x1b[0m Prod & Pre-Prod\n"
  );
  console.log("\n💡 \x1b[33mOnce you have VPN access, re-run this tool!\x1b[0m\n");

  return false;
}

/**
 * STEP 5: Github Repo Access
 */
async function stepGithubRepoAccess() {
  const stepId = 'repos';
  
  if (isStepCompleted(stepId)) {
    console.log("\n✅ \x1b[32m[GitHub Repositories] Already completed - Skipping\x1b[0m");
    return true;
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 \x1b[1mStep 4: GitHub Repositories Access Check\x1b[0m\n");

  const answer = await ask("💬 Do you have access to all the repos you'll be working on?\n\n   1️⃣  I have access to all the repos\n   2️⃣  I don't have access to all/some repos\n\n   Enter your choice (1 or 2): ");

  if (answer === "1") {
    console.log("\n✅ \x1b[32mExcellent! You're all set with repository access.\x1b[0m\n");
    markStepCompleted(stepId);
    return true;
  }

  console.log("\n🔑 \x1b[33mLet's get you access to our core repositories!\x1b[0m\n");
  console.log("\x1b[1m📚 Here are the repositories you need access to:\x1b[0m\n");
  console.log("   1. \x1b[1m\x1b[36mnykaa-web-reloaded\x1b[0m     → Mobile web application\n   2. \x1b[1m\x1b[36mnykaa-dweb-reloaded\x1b[0m    → Desktop web application\n   3. \x1b[1m\x1b[36mfe-core\x1b[0m                → Shared frontend components\n   4. \x1b[1m\x1b[36mremote-config\x1b[0m          → Feature flags & configurations\n   5. \x1b[1m\x1b[36mfeature-forge\x1b[0m          → Next.js pages\n   6. \x1b[1m\x1b[36mstride\x1b[0m                 → CHANEL brand\n   7. \x1b[1m\x1b[36mrapid-aura\x1b[0m             → Nykaa Quick Commerce (Nykaa Now)\n");
  console.log("\n💡 \x1b[33mRequest access from your manager, then re-run this tool!\x1b[0m\n");

  return false;
}

/**
 * STEP 6: GTM Access
 */
async function stepGtmAccess() {
  const stepId = 'gtm';
  
  if (isStepCompleted(stepId)) {
    console.log("\n✅ \x1b[32m[Google Tag Manager] Already completed - Skipping\x1b[0m");
    return true;
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 \x1b[1mStep 5: Google Tag Manager Access Check\x1b[0m\n");

  const answer = await ask("💬 Do you have access to GTM containers? (y/n): ");

  if (answer.toLowerCase() === "y") {
    console.log("\n✅ \x1b[32mPerfect! You can now manage tracking tags.\x1b[0m\n");
    markStepCompleted(stepId);
    return true;
  }

  console.log("\n📊 \x1b[33mGTM helps us manage tracking & analytics scripts efficiently.\x1b[0m");
  console.log("\n📝 \x1b[1mHere's what you need to do:\x1b[0m\n");
  console.log(
    "1. Contact your buddy or manager for the Service Desk portal URL\n" +
    "2. Raise an IT Service Request for 'Google Tag Manager - Nykaa'\n\n" +
    "\x1b[1mRequest details:\x1b[0m\n" +
    "  • \x1b[1mGTM Access Requested For:\x1b[0m New Access\n" +
    "  • \x1b[1mContainer Field [Nykaa]:\x1b[0m Need access to all\n" +
    "  • \x1b[1mUser Access Type:\x1b[0m User\n" +
    "  • \x1b[1mRole Type:\x1b[0m Edit\n"
  );
  console.log("\n💡 \x1b[33mOnce you have access to all GTM containers, re-run this tool!\x1b[0m\n");

  return false;
}


/**
 * STEP 7: New Relic, Kibana, Grafana Access, setup and understanding
 */
  async function stepMonitoringAccess() {
  const stepId = 'monitoring';
  
  if (isStepCompleted(stepId)) {
    console.log("\n✅ \x1b[32m[Monitoring Tools] Already completed - Skipping\x1b[0m");
    return true;
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 \x1b[1mStep 6: Monitoring Tools Access Check\x1b[0m\n");
  
  const answer = await ask("💬 Do you have access to New Relic, Kibana, and Grafana? (y/n): ");
  if (answer.toLowerCase() === "y") {
    console.log("\n✅ \x1b[32mAwesome! You're all set with monitoring tools.\x1b[0m\n");
    markStepCompleted(stepId);
    return true;
  }

  console.log("\n📊 \x1b[33mThese tools help you monitor logs, metrics, and visualize data.\x1b[0m\n");
  console.log("\x1b[1m🔍 Here are your access credentials:\x1b[0m\n");
  
  console.log("\x1b[36m\x1b[1m1️⃣  Kibana\x1b[0m");
  console.log("   \x1b[33m📞 Contact your buddy to get the URL and credentials\x1b[0m");
  console.log("   ⚠️  \x1b[33mRequires VPN connection\x1b[0m\n");
  
  console.log("\x1b[36m\x1b[1m2️⃣  Grafana\x1b[0m");
  console.log("   \x1b[33m📞 Contact your buddy to get the Grafana URL\x1b[0m");
  console.log("   Auth:     Sign in with your company Google Account\n");
  
  console.log("\x1b[36m\x1b[1m3️⃣  New Relic\x1b[0m");
  console.log("   \x1b[33m📞 Contact your buddy to get the account details and credentials\x1b[0m\n");
  
  const shouldProceedNow = await shouldProceed("\n💡 Once you've accessed all monitoring tools, type 'y' to proceed: ");
  if(shouldProceedNow) {
    markStepCompleted('monitoring');
    return true;
  }
  return false;
}



/**
 * STEP 8: Figma Access
 */
 async function stepFigmaAccess() {
  const stepId = 'figma';
  
  if (isStepCompleted(stepId)) {
    console.log("\n✅ \x1b[32m[Figma Access] Already completed - Skipping\x1b[0m");
    return true;
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 \x1b[1mStep 7: Figma Access\x1b[0m\n");
  console.log("🎨 \x1b[33mFigma is where all our designs live.\x1b[0m\n");
  console.log("\x1b[1m🔑 Access:\x1b[0m");
  console.log("   URL:      \x1b[4mhttps://www.figma.com\x1b[0m");
  console.log("   \x1b[33m📞 Contact your buddy to get the shared account credentials\x1b[0m\n");

  const shouldProceedNow = await shouldProceed("💡 Once you've accessed Figma, type 'y' to proceed: ");
  if(shouldProceedNow) {
    markStepCompleted(stepId);
    return true;
  }
  return false;
}

/**
 * STEP 9: Running application on local
 */
  async function stepRunLocal() {
  const stepId = 'local';
  
  if (isStepCompleted(stepId)) {
    console.log("\n✅ \x1b[32m[Run App Locally] Already completed - Skipping\x1b[0m");
    return true;
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 \x1b[1mStep 8: Running the Application Locally\x1b[0m\n");
  console.log("🚀 \x1b[33mTime to get the app running on your machine!\x1b[0m\n");
  console.log("\x1b[1m📋 Quick Start Steps:\x1b[0m\n");
  console.log("   1️⃣  Clone the repository from GitHub");
  console.log("   2️⃣  Navigate to the project directory");
  console.log("   3️⃣  Install dependencies (npm or yarn)");
  console.log("   4️⃣  Start the development server\n");
  console.log("💡 \x1b[36mTip: Check the README.md file in the repo for detailed instructions!\x1b[0m\n");

  const shouldProceedNow = await shouldProceed("✅ Once you have the app running locally, type 'y' to proceed: ");
  if(shouldProceedNow) {
    markStepCompleted(stepId);
    return true;
  }
  return false;
}



/**
 * STEP 10: Architecture Walkthrough
 */
 async function stepArchitectureWalkthrough(isDirectRun = false) {
  const stepId = 'architecture';
  
  if (!isDirectRun && isStepCompleted(stepId)) {
    console.log("\n✅ \x1b[32m[Architecture Walkthrough] Already completed - Skipping\x1b[0m");
    return true;
  }
  
  if(!isDirectRun) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📌 \x1b[1mStep 9: Architecture Walkthrough\x1b[0m\n");
    console.log("🏗️  \x1b[33mReady to explore how everything fits together?\x1b[0m\n");
    const answer = await ask("💬 Enter 'y' to proceed with the architecture walkthrough: ");
    if (answer.toLowerCase() !== "y") {
      return false;
    }
    console.log("");
  }
 
  console.log(`
\x1b[36m\x1b[1m📘 ARCHITECTURE WALKTHROUGH — CORE DISCOVERY FRONTEND\x1b[0m

This walkthrough helps you understand what we own and where things live

────────────────────────────────────────────────────────────

\x1b[33m\x1b[1m🌐 HIGH LEVEL USER FLOW\x1b[0m

User opens Nykaa
  ↓
Home / Search / Category / PLP
  ↓
Product Detail Page (PDP / Hybrid PDP)
  ↓
Cart
  ↓
Order Creation (handoff to checkout)

📌 Core Discovery Frontend owns everything up to Cart including Auth flows, Account page.

────────────────────────────────────────────────────────────

\x1b[33m\x1b[1m📦 REPOSITORIES OWNED BY THE TEAM\x1b[0m

1. \x1b[1mnykaa-web-reloaded\x1b[0m
   • Main frontend repository for Mobile Web
   • Primary discovery surface for users
   • Pages owned:
     - Home Page
     - Search Listing Page
     - Category Listing Page
     - Product Listing Page (PLP)
     - Product Detail Page (PDP / Hybrid PDP)
     - Cart
     - Account & Auth flows
   • You will work in this repo most frequently

2. \x1b[1mnykaa-dweb-reloaded\x1b[0m
   • Frontend repository for Desktop Web
   • Similar business logic as mobile but different UX patterns
   • Desktop-specific layouts and interactions
   • Used for parity fixes and desktop-only features

3. \x1b[1mfe-core\x1b[0m
   • Monorepo for shared frontend foundations
   • Contains:
     - Shared UI components
     - Design system primitives
     - Common hooks and utilities
   • Used by multiple applications
   ⚠️ Changes here impact multiple products

4. \x1b[1mremote-config\x1b[0m
   • Configuration-driven feature control system
   • Used for:
     - Feature flags
     - Feature configurations
     - A/B experiments
     - Kill switches
     - Environment based toggles
   • Directly affects production behaviour
   ⚠️ Handle with care

5. \x1b[1mfeature-forge\x1b[0m
   • Next.js based frontend repository
   • Used for:
     - Pages that now are being migrated to Next.js
   • Keeps Next.js isolated from core React apps

6. \x1b[1mstride\x1b[0m
   • Brand specific frontend application
   • Dedicated codebase for CHANEL brand
   • Custom UX, branding and controlled releases
   • You will touch this only for brand specific work

7. \x1b[1mrapid-aura\x1b[0m
   • Frontend for Nykaa Quick Commerce (Nykaa Now)

8. \x1b[1mMosaic\x1b[0m
   • Source of truth for the \x1b[1mLUMI Design System\x1b[0m
   • Contains:
     - Design tokens (colors, spacing, typography, borders)
     - Themes variations
     - Foundational styling primitives
   • Consumed by:
     - Essence
     - Future frontend applications
   • No business logic lives here

   ⚠️ Changes here have a global impact on UI consistency.

9. \x1b[1mEssence\x1b[0m
   • Monorepo for UI components built on LUMI Design System
   • Similar role to fe-core, but:
     - Modernized
     - LUMI Design-token driven
     - Future-facing
   • Contains:
     - LUMI-based UI components
     - Layout primitives
     - Shared interaction patterns

   • Used by:
     - New frontend initiatives
     - Gradually adopted by existing applications

   📌 Think of Essence as:
      "Reusable components powered by Mosaic tokens"

────────────────────────────────────────────────────────────

\x1b[33m\x1b[1m🧪 ENVIRONMENT CONFIGURATION\x1b[0m

• Environment configs are sourced from:
  nykaa_fe_configs
• Typically copied once during setup
• Used to configure:
  - API endpoints
  - Environment specific behaviour

────────────────────────────────────────────────────────────`);

!isDirectRun ? console.log(`\n\n\x1b[32m\x1b[1m✅ WHAT TO DO NEXT\x1b[0m

1. Identify your primary repository
2. Explore routing and API integration
3. Pick one page (HLP / PLP / PDP) and trace:
   API → UI flow

💡 Tip: Understanding the discovery funnel early
will make debugging and feature development easier.
`) : null;

  if (!isDirectRun) {
    markStepCompleted('architecture');
  }
  return true;
}


/**
 * STEP 10: Jenkins access
 */
async function stepJenkinsAccess() {
  const stepId = 'jenkins';
  
  if (isStepCompleted(stepId)) {
    console.log("\n✅ \x1b[32m[Jenkins Access] Already completed - Skipping\x1b[0m");
    return true;
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 \x1b[1mStep 10: Jenkins Access Check\x1b[0m \x1b[90m(optional)\x1b[0m\n");
  
  const answer = await ask("💬 Do you have access to Jenkins pipelines? (y/n/skip): ");
  
  if (answer.toLowerCase() === "skip") {
    console.log("\n⏭️  \x1b[33mSkipping Jenkins access for now. You can set this up later.\x1b[0m\n");
    markStepCompleted(stepId);
    return true;
  }
  
  if (answer.toLowerCase() === "y") {
    console.log("\n✅ \x1b[32mPerfect! You can now deploy and monitor builds.\x1b[0m\n");
    markStepCompleted(stepId);
    return true;
  }

  console.log("\n🔧 \x1b[33mJenkins access is needed for deployments and CI/CD.\x1b[0m\n");
  console.log("\x1b[1m📝 Here's what you need to do:\x1b[0m\n");
  console.log("   1. Contact your buddy or manager for Jenkins access request process");
  console.log("   2. Typically requires raising a JIRA ticket in the DevOps/DA board\n");
  console.log("\x1b[1m🔗 Pipelines you'll need access to:\x1b[0m\n");
  getJenkinsPipelines();
  console.log("\n💡 \x1b[33mOnce you have Jenkins access, re-run this tool!\x1b[0m\n");

  return false;
}



/**
 * FAQs
 */
async function showFaqs() {
  console.log("\n═════════════════════════════════════════════════════════════");
  console.log("\n❓ \x1b[1m\x1b[36mFrequently Asked Questions\x1b[0m\n");
  console.log("🚧 Coming soon! FAQs will be added here.\n");
  console.log("   • How to request access to tools?");
  console.log("   • What if I encounter issues during setup?");
  console.log("   • Who should I contact for help?\n");
  console.log("═════════════════════════════════════════════════════════════\n");
}

/**
 * Show interactive menu
 */
async function showMenu() {
  const progress = loadProgress();
  const completedCount = progress.completed.length;
  const totalSteps = STEPS.length;
  
  console.log("\n\x1b[1m\x1b[36m🎯 What would you like to do?\x1b[0m\n");
  console.log(`   1️⃣  ▶️  Continue onboarding (${completedCount}/${totalSteps} steps completed)`);
  console.log("   2️⃣  📊 View progress checklist");
  console.log("   3️⃣  🏗️  Architecture walkthrough");
  console.log("   4️⃣  👥 Setup/Update buddy info");
  console.log("   5️⃣  ↩️  Mark step as incomplete");
  console.log("   6️⃣  🔄 Reset all progress");
  console.log("   7️⃣  ❓ FAQs");
  console.log("   8️⃣  🆘 Help & Commands");
  console.log("   9️⃣  🚪 Exit\n");
  
  const choice = await ask("Enter your choice (1-9): ");
  
  switch(choice) {
    case "1":
      await runOnboarding();
      break;
    case "2":
      displayProgress(progress);
      await showMenu();
      break;
    case "3":
      await stepArchitectureWalkthrough(true);
      await showMenu();
      break;
    case "4":
      await setupBuddy();
      await showMenu();
      break;
    case "5":
      await undoStep();
      await showMenu();
      break;
    case "6":
      const confirm = await ask("\n⚠️  Are you sure you want to reset all progress? (yes/no): ");
      if (confirm.toLowerCase() === "yes") {
        resetProgress();
      } else {
        console.log("\n✅ Progress preserved.\n");
      }
      await showMenu();
      break;
    case "7":
      await showFaqs();
      await showMenu();
      break;
    case "8":
      showHelp();
      await showMenu();
      break;
    case "9":
      console.log("\n👋 See you later! Run \x1b[36mnpx github:siddharth-2508/core-discovery-onboard\x1b[0m anytime to continue.\n");
      rl.close();
      break;
    default:
      console.log("\n⚠️  Invalid choice. Please try again.\n");
      await showMenu();
  }
}

/**
 * Run the onboarding flow
 */
async function runOnboarding() {
  const progress = loadProgress();
  
  // Show welcome only if starting fresh
  if (progress.completed.length === 0) {
    await stepWelcome();
  } else {
    console.log("\n✨ \x1b[1m\x1b[36mWelcome back!\x1b[0m Let's continue where you left off.\n");
    displayProgress(progress);
  }

  const hasJira = await stepJiraAccess();
  if (!hasJira) {
    console.log("\n💾 \x1b[33mProgress saved. Run this tool again once you have JIRA access!\x1b[0m");
    console.log("\n💡 \x1b[90mTip: Run \x1b[36mnpx github:siddharth-2508/core-discovery-onboard progress\x1b[0m\x1b[90m anytime to check your status\x1b[0m");
    
    // Show buddy info if available
    const currentProgress = loadProgress();
    if (currentProgress.buddy) {
      console.log(`\n👥 Need help? Reach out to your buddy \x1b[1m${currentProgress.buddy.name}\x1b[0m at \x1b[36m${currentProgress.buddy.contact}\x1b[0m`);
    }
    console.log('');
    rl.close();
    return;
  }

  console.log("\n➡️  \x1b[32mMoving to next step...\x1b[0m\n");

  const hasCopilot = await stepGithubCopilotAccess();
  if (!hasCopilot) {
    console.log("\n💾 \x1b[33mProgress saved. Run this tool again to continue!\x1b[0m\n");
    rl.close();
    return;
  }

  console.log("\n➡️  \x1b[32mMoving to next step...\x1b[0m\n");

  const hasVpn = await stepVpnAccess();
  if (!hasVpn) {
    console.log("\n💾 \x1b[33mProgress saved. Run this tool again once you have VPN access!\x1b[0m\n");
    rl.close();
    return;
  }

  console.log("\n➡️  \x1b[32mMoving to next step...\x1b[0m\n");

  const hasRepoAccess = await stepGithubRepoAccess();
  if (!hasRepoAccess) {
    console.log("\n💾 \x1b[33mProgress saved. Run this tool again once you have repository access!\x1b[0m\n");
    rl.close();
    return;
  }

  console.log("\n➡️  \x1b[32mMoving to next step...\x1b[0m\n");

  const hasGtmAccess = await stepGtmAccess();
  if (!hasGtmAccess) {
    console.log("\n💾 \x1b[33mProgress saved. Run this tool again once you have GTM access!\x1b[0m\n");
    rl.close();
    return;
  }

  console.log("\n➡️  \x1b[32mMoving to next step...\x1b[0m\n");

  const isMonitoringStepDone = await stepMonitoringAccess();
  if (!isMonitoringStepDone) {
    console.log("\n💾 \x1b[33mProgress saved. Run this tool again to continue!\x1b[0m\n");
    rl.close();
    return;
  }

  console.log("\n➡️  \x1b[32mMoving to next step...\x1b[0m\n");

  const isFigmaStepDone = await stepFigmaAccess();
  if (!isFigmaStepDone) {
    console.log("\n💾 \x1b[33mProgress saved. Run this tool again to continue!\x1b[0m\n");
    rl.close();
    return;
  }

  console.log("\n➡️  \x1b[32mMoving to next step...\x1b[0m\n");

  const isRunLocalStepDone = await stepRunLocal();
  if (!isRunLocalStepDone) {
    console.log("\n💾 \x1b[33mProgress saved. Run this tool again to continue!\x1b[0m\n");
    rl.close();
    return;
  }

  console.log("\n➡️  \x1b[32mMoving to next step...\x1b[0m\n");

  const isArchitectureWalkthroughDone = await stepArchitectureWalkthrough();
  if (!isArchitectureWalkthroughDone) {
    console.log("\n💾 \x1b[33mProgress saved. Run this tool again to continue!\x1b[0m\n");
    rl.close();
    return;
  }

  console.log("\n➡️  \x1b[32mMoving to next step...\x1b[0m\n");

  const isJenkinsAccessDone = await stepJenkinsAccess();
  if (!isJenkinsAccessDone) {
    console.log("\n💾 \x1b[33mProgress saved. Run this tool again once you have Jenkins access!\x1b[0m\n");
    rl.close();
    return;
  }

  // Calculate completion stats
  const finalProgress = loadProgress();
  const totalDays = getDaysSince(finalProgress.startedAt);
  const startDate = formatDate(finalProgress.startedAt);
  const completionDate = formatDate(new Date().toISOString());
  
  console.log("\n\n");
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                   ║");
  console.log("║               \x1b[1m\x1b[33m✨ ONBOARDING COMPLETE! ✨\x1b[0m                       ║");
  console.log("║                                                                   ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("                    \x1b[36m🎯 MISSION ACCOMPLISHED 🎯\x1b[0m");
  console.log("");
  console.log("         ⭐️ ⭐️ ⭐️ ⭐️ ⭐️ ⭐️ ⭐️ ⭐️ ⭐️ ⭐️");
  console.log("");
  console.log("   \x1b[1mCongratulations on completing your onboarding journey!\x1b[0m");
  console.log("");
  console.log("   You've successfully completed \x1b[1m\x1b[32mall 10 steps\x1b[0m for the");
  console.log("   \x1b[1m\x1b[36mNykaa Core Discovery Frontend Team\x1b[0m");
  console.log("");
  
  console.log("");
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                   ║");
  console.log("║              \x1b[1m\x1b[36m🚀 WELCOME TO THE TEAM! 🚀\x1b[0m                      ║");
  console.log("║                                                                   ║");
  console.log("║   You're now fully equipped to contribute to our mission of       ║");
  console.log("║   building world-class discovery experiences for millions         ║");
  console.log("║   of Nykaa users!                                                 ║");
  console.log("║                                                                   ║");
  console.log("║                                                                   ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("");
  console.log("   \x1b[90mBuilt with ❤️  by Siddharth Khurana\x1b[0m");
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("");
  
  const viewMenu = await ask("\nWould you like to return to the main menu? (y/n): ");
  if (viewMenu.toLowerCase() === "y") {
    await showMenu();
  } else {
    rl.close();
  }
}

/**
 * Main entry point
 */
async function main() {
  const progress = loadProgress();
  
  // If user has some progress, show menu
  if (progress.completed.length > 0 && progress.completed.length < STEPS.length) {
    await showMenu();
  } else if (progress.completed.length === STEPS.length) {
    // All steps completed
    console.log("\n✅ \x1b[32mYou've already completed all onboarding steps!\x1b[0m\n");
    await showMenu();
  } else {
    // Fresh start
    await runOnboarding();
  }
}

// Check for command-line arguments
const command = process.argv[2];

if (command === "help" || command === "--help" || command === "-h") {
  showHelp();
  rl.close();
} else if (command === "faqs") {
  showFaqs();
  rl.close();
} else if (command === "arch-walkthrough") {
  stepArchitectureWalkthrough(true).then(() => rl.close());
} else if (command === "getJenkinsPipelines") {
  getJenkinsPipelines();
  rl.close();
} else if (command === "progress") {
  displayProgress(loadProgress());
  rl.close();
} else if (command === "reset") {
  resetProgress();
  rl.close();
} else if (command) {
  console.log(`\n⚠️  Unknown command: '${command}'\n`);
  showHelp();
  rl.close();
} else {
  main();
}


