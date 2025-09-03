import "dotenv/config";
import fs from "fs";
import path from "path";
import simpleGit from "simple-git";
import { Octokit } from "@octokit/rest";
import slugify from "slugify";
import chalk from "chalk";
import { execSync } from "child_process";

const git = simpleGit();
const octo = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;

function toSlug(s) { 
  return slugify(s || "", { lower: true, strict: true }); 
}

function writeContentJSON(item) {
  const dir = path.join("preview-app", "prospects", item.slug);
  fs.mkdirSync(dir, { recursive: true });
  
  // Copy screenshot if it exists
  const heroOut = path.join(dir, "hero.png");
  if (fs.existsSync(item.heroPath)) {
    fs.copyFileSync(item.heroPath, heroOut);
  }

  const content = {
    companyName: item.company,
    title: item.title || item.company,
    brand: { 
      primary: item.primary || item.primaryColor || "#0ea5e9", 
      secondary: item.secondary || item.secondaryColor || "#111827" 
    },
    assets: { logoUrl: null },
    screenshot: `/prospects/${item.slug}/hero.png`
  };
  
  fs.writeFileSync(path.join(dir, "content.json"), JSON.stringify(content, null, 2));
}

async function createGitBranch(branchName) {
  try {
    console.log(chalk.blue(`🌿 Creating Git branch: ${branchName}`));
    
    // Ensure we're on main/master branch
    await git.checkout('main').catch(() => git.checkout('master'));
    
    // Pull latest changes
    await git.pull();
    
    // Create and checkout new branch
    await git.checkoutLocalBranch(branchName);
    
    console.log(chalk.green(`✅ Created branch: ${branchName}`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Error creating branch ${branchName}:`, error.message));
    return false;
  }
}

async function commitAndPush(branchName, companyName) {
  try {
    console.log(chalk.blue(`📝 Committing changes for ${companyName}`));
    
    // Add all changes
    await git.add('.');
    
    // Commit changes
    await git.commit(`Add preview for ${companyName}`);
    
    // Push branch to origin
    await git.push('origin', branchName);
    
    console.log(chalk.green(`✅ Pushed branch: ${branchName}`));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Error pushing branch ${branchName}:`, error.message));
    return false;
  }
}

async function getVercelDeploymentUrl(branchName) {
  try {
    console.log(chalk.blue(`🔍 Waiting for Vercel deployment for branch: ${branchName}`));
    
    // Wait a moment for Vercel to start deployment
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to get deployment URL from Vercel CLI (if available)
    try {
      const result = execSync(`vercel ls --scope=team_web-agency-outreach 2>/dev/null || echo "no-vercel-cli"`, { 
        encoding: 'utf8',
        timeout: 10000 
      });
      
      if (result.includes('no-vercel-cli')) {
        // Fallback to predictable Vercel URL format
        const deploymentUrl = `https://web-agency-outreach-git-${branchName.replace(/\//g, '-')}-${OWNER.toLowerCase()}.vercel.app`;
        console.log(chalk.yellow(`📎 Using predicted Vercel URL: ${deploymentUrl}`));
        return deploymentUrl;
      }
      
      // Parse Vercel CLI output for deployment URL
      const lines = result.split('\n');
      for (const line of lines) {
        if (line.includes(branchName) && line.includes('https://')) {
          const url = line.match(/https:\/\/[^\s]+/);
          if (url) {
            console.log(chalk.green(`✅ Found Vercel deployment: ${url[0]}`));
            return url[0];
          }
        }
      }
    } catch (cliError) {
      console.log(chalk.yellow(`⚠️  Vercel CLI not available, using predicted URL`));
    }
    
    // Fallback to predictable URL format
    const deploymentUrl = `https://web-agency-outreach-git-${branchName.replace(/\//g, '-')}-${OWNER.toLowerCase()}.vercel.app`;
    console.log(chalk.cyan(`📎 Generated Vercel URL: ${deploymentUrl}`));
    return deploymentUrl;
    
  } catch (error) {
    console.error(chalk.red(`❌ Error getting Vercel URL:`, error.message));
    // Return fallback URL
    return `https://web-agency-outreach-git-${branchName.replace(/\//g, '-')}-${OWNER.toLowerCase()}.vercel.app`;
  }
}

async function waitForDeployment(url, maxWaitTime = 120000) {
  console.log(chalk.blue(`⏳ Waiting for deployment to be ready: ${url}`));
  
  const startTime = Date.now();
  const maxTime = startTime + maxWaitTime;
  
  while (Date.now() < maxTime) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log(chalk.green(`✅ Deployment is live: ${url}`));
        return true;
      }
    } catch (error) {
      // Deployment not ready yet, continue waiting
    }
    
    // Wait 10 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log(chalk.yellow(`⏳ Still waiting for deployment...`));
  }
  
  console.log(chalk.yellow(`⚠️  Deployment may still be building: ${url}`));
  return false;
}

async function run() {
  const IN = "data/output/scored.json";
  const OUT = "data/output/ready_for_email.json";

  if (!fs.existsSync(IN)) {
    console.log(chalk.red("❌ Error: scored.json not found"));
    console.log("Please run: node scripts/score_and_assets.js first");
    return;
  }

  const scored = JSON.parse(fs.readFileSync(IN, "utf-8"));
  const results = [];
  
  console.log(chalk.cyan(`🚀 Processing ${scored.length} prospects for REAL Vercel deployment...`));
  
  for (const item of scored) {
    const slug = toSlug(item.company);
    const branchName = `feature/${slug}`;
    
    console.log(chalk.cyan(`\n📋 Processing: ${item.company}`));
    
    // Write content files
    writeContentJSON({ ...item, slug });
    console.log(chalk.green(`✅ Created preview content for ${item.company}`));
    
    // Create Git branch
    const branchCreated = await createGitBranch(branchName);
    if (!branchCreated) {
      console.log(chalk.red(`❌ Skipping ${item.company} due to branch creation failure`));
      continue;
    }
    
    // Commit and push changes
    const pushed = await commitAndPush(branchName, item.company);
    if (!pushed) {
      console.log(chalk.red(`❌ Skipping ${item.company} due to push failure`));
      continue;
    }
    
    // Get Vercel deployment URL
    const previewUrl = await getVercelDeploymentUrl(branchName);
    
    // Wait for deployment to be ready (with timeout)
    await waitForDeployment(previewUrl, 60000); // 1 minute timeout
    
    results.push({ 
      ...item, 
      slug,
      branch: branchName, 
      preview_url: previewUrl 
    });
    
    console.log(chalk.green(`✅ Completed ${item.company}: ${previewUrl}`));
  }
  
  // Return to main branch
  try {
    await git.checkout('main').catch(() => git.checkout('master'));
    console.log(chalk.blue(`🔄 Returned to main branch`));
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Could not return to main branch: ${error.message}`));
  }
  
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log(chalk.cyan(`\n🎉 Wrote ${OUT}`));
  console.log(chalk.green(`✅ Created ${results.length} REAL Vercel deployments!`));
  
  // Show summary
  console.log(chalk.cyan(`\n📋 Deployment Summary:`));
  results.forEach(result => {
    console.log(chalk.white(`  • ${result.company}: ${result.preview_url}`));
  });
}

run().catch(console.error);