import "dotenv/config";
import fs from "fs";
import path from "path";
import simpleGit from "simple-git";
import { Octokit } from "@octokit/rest";
import slugify from "slugify";
import chalk from "chalk";
import AIWebsiteGenerator from './ai_website_generator.js';

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
    screenshot: `/prospects/${item.slug}/hero.png`,
    hasGeneratedWebsite: !!item.generatedWebsite,
    generatedWebsitePath: item.generatedWebsite || null
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
    await git.commit(`Add Replit-generated website for ${companyName}`);
    
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
    console.log(chalk.blue(`🔍 Generating Vercel deployment URL for branch: ${branchName}`));
    
    // Wait a moment for Vercel to start deployment
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Generate Vercel URL based on branch name
    const deploymentUrl = `https://web-agency-outreach-git-${branchName.replace(/\//g, '-')}-eric-1619s-projects.vercel.app`;
    console.log(chalk.cyan(`📎 Generated Vercel URL: ${deploymentUrl}`));
    return deploymentUrl;
    
  } catch (error) {
    console.error(chalk.red(`❌ Error getting Vercel URL:`, error.message));
    return `https://web-agency-outreach-git-${branchName.replace(/\//g, '-')}-eric-1619s-projects.vercel.app`;
  }
}

async function waitForDeployment(url, maxWaitTime = 60000) {
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
    console.log("Please run: node scripts/score_and_assets_simple.js first");
    return;
  }

  const scored = JSON.parse(fs.readFileSync(IN, "utf-8"));
  const results = [];
  
  console.log(chalk.cyan(`🚀 Processing ${scored.length} prospects with AI Website Generation + Vercel deployment...`));
  
  // Initialize AI website generator
  const aiGenerator = new AIWebsiteGenerator();
  
  for (const item of scored) {
    const slug = toSlug(item.company);
    const branchName = `feature/${slug}`;
    
    console.log(chalk.cyan(`\n📋 Processing: ${item.company}`));
    
    // Step 1: Generate website with AI
    let generatedWebsite = null;
    try {
      console.log(chalk.blue(`🤖 Generating AI-powered custom website...`));
      
      const leadData = {
        businessName: item.company,
        city: item.city,
        email: item.email,
        website: item.domain
      };
      
      const analysisResults = {
        primaryColor: item.primaryColor || item.primary || "#0ea5e9",
        secondaryColor: item.secondaryColor || item.secondary || "#111827",
        score: item.score || 85
      };
      
      generatedWebsite = await aiGenerator.generateCompleteWebsite(leadData, analysisResults);
      
      if (generatedWebsite) {
        console.log(chalk.green(`✅ AI website generated successfully!`));
        console.log(chalk.cyan(`🎨 Industry: ${generatedWebsite.industry}`));
        console.log(chalk.cyan(`📁 Template: ${generatedWebsite.template}`));
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️  AI generation failed, using fallback preview`));
    }
    
    // Step 2: Write content files (with or without Replit generation)
    writeContentJSON({ 
      ...item, 
      slug,
      generatedWebsite: generatedWebsite?.previewPath || null
    });
    console.log(chalk.green(`✅ Created preview content for ${item.company}`));
    
    // Step 3: Create Git branch
    const branchCreated = await createGitBranch(branchName);
    if (!branchCreated) {
      console.log(chalk.red(`❌ Skipping ${item.company} due to branch creation failure`));
      continue;
    }
    
    // Step 4: Commit and push changes
    const pushed = await commitAndPush(branchName, item.company);
    if (!pushed) {
      console.log(chalk.red(`❌ Skipping ${item.company} due to push failure`));
      continue;
    }
    
    // Step 5: Get Vercel deployment URL
    const previewUrl = await getVercelDeploymentUrl(branchName);
    
    // Step 6: Wait for deployment to be ready
    await waitForDeployment(previewUrl, 30000);
    
    results.push({ 
      ...item, 
      slug,
      branch: branchName, 
      preview_url: previewUrl,
      ai_industry: generatedWebsite?.industry || null,
      ai_template: generatedWebsite?.template || null,
      has_generated_website: !!generatedWebsite
    });
    
    console.log(chalk.green(`✅ Completed ${item.company}: ${previewUrl}`));
    
    if (generatedWebsite) {
      console.log(chalk.cyan(`🎨 Enhanced with AI-generated custom website!`));
    }
  }
  
  // Return to main branch
  try {
    await git.checkout('main').catch(() => git.checkout('master'));
    console.log(chalk.blue(`🔄 Returned to main branch`));
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Could not return to main branch: ${error.message}`));
  }
  
  // Ensure output directory exists
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log(chalk.cyan(`\n🎉 Wrote ${OUT}`));
  console.log(chalk.green(`✅ Created ${results.length} deployments with AI-generated websites!`));
  
  // Show summary
  console.log(chalk.cyan(`\n📋 Deployment Summary:`));
  results.forEach(result => {
    console.log(chalk.white(`  • ${result.company}: ${result.preview_url}`));
    if (result.has_generated_website) {
      console.log(chalk.green(`    🤖 Enhanced with AI-generated website`));
      if (result.ai_industry) {
        console.log(chalk.cyan(`    🏢 Industry: ${result.ai_industry}`));
      }
    }
  });
}

run().catch(console.error);
