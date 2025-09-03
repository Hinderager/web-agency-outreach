import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import chalk from 'chalk';

// Replit API configuration
const REPLIT_API_BASE = 'https://replit.com/api/v1';
const REPLIT_TOKEN = process.env.REPLIT_TOKEN; // Add to .env file

class ReplitWebsiteGenerator {
  constructor() {
    this.headers = {
      'Authorization': `Bearer ${REPLIT_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'WebAgencyOutreach/1.0'
    };
  }

  // Generate a comprehensive prompt for website creation
  generateWebsitePrompt(leadData, analysisResults) {
    const prompt = `Create a professional, modern website for ${leadData.businessName}, a ${this.inferIndustry(leadData)} business located in ${leadData.city}.

REQUIREMENTS:
- Modern, responsive design
- Primary color: ${analysisResults.primaryColor || '#0ea5e9'}
- Secondary color: ${analysisResults.secondaryColor || '#111827'}
- Professional typography
- Mobile-first approach

SECTIONS TO INCLUDE:
1. Hero section with compelling headline
2. About/Services section
3. Contact information (${leadData.city} location)
4. Call-to-action buttons
5. Professional footer

STYLE PREFERENCES:
- Clean, minimalist design
- High-converting layout
- Fast loading
- SEO-friendly structure
- Accessibility compliant

BUSINESS CONTEXT:
- Location: ${leadData.city}
- Email: ${leadData.email}
- Current website: ${leadData.website}
- Industry focus: Local ${this.inferIndustry(leadData)} services

Please create a complete HTML/CSS/JS website with these specifications. Make it professional and conversion-focused.`;

    return prompt;
  }

  // Infer industry from business name and website
  inferIndustry(leadData) {
    const name = leadData.businessName.toLowerCase();
    const website = leadData.website.toLowerCase();
    
    if (name.includes('moving') || name.includes('junk')) return 'moving and junk removal';
    if (name.includes('plumb')) return 'plumbing';
    if (name.includes('electric')) return 'electrical';
    if (name.includes('clean')) return 'cleaning';
    if (name.includes('lawn') || name.includes('landscap')) return 'landscaping';
    if (name.includes('roof')) return 'roofing';
    if (name.includes('paint')) return 'painting';
    if (name.includes('hvac') || name.includes('heating')) return 'HVAC';
    
    return 'professional services';
  }

  // Create a new Replit project
  async createReplitProject(leadData) {
    try {
      console.log(chalk.blue(`🚀 Creating Replit project for ${leadData.businessName}...`));
      
      const projectName = `${leadData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-website`;
      
      const response = await fetch(`${REPLIT_API_BASE}/repls`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          title: projectName,
          description: `Custom website for ${leadData.businessName}`,
          language: 'html',
          isPrivate: false
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create Replit project: ${response.statusText}`);
      }

      const project = await response.json();
      console.log(chalk.green(`✅ Created Replit project: ${project.id}`));
      
      return project;
    } catch (error) {
      console.error(chalk.red(`❌ Error creating Replit project:`, error.message));
      throw error;
    }
  }

  // Generate website using Replit's AI capabilities
  async generateWebsiteWithAI(projectId, prompt) {
    try {
      console.log(chalk.blue(`🤖 Generating website with AI...`));
      
      // Use Replit's Exec API to run AI generation commands
      const response = await fetch(`${REPLIT_API_BASE}/repls/${projectId}/exec`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          command: 'generate-website',
          args: [prompt]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate website: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(chalk.green(`✅ Website generation completed`));
      
      return result;
    } catch (error) {
      console.error(chalk.red(`❌ Error generating website:`, error.message));
      throw error;
    }
  }

  // Download generated files from Replit
  async downloadWebsiteFiles(projectId, leadData) {
    try {
      console.log(chalk.blue(`📥 Downloading website files...`));
      
      // Use Filesystem API to get project files
      const filesResponse = await fetch(`${REPLIT_API_BASE}/repls/${projectId}/files`, {
        method: 'GET',
        headers: this.headers
      });

      if (!filesResponse.ok) {
        throw new Error(`Failed to get files: ${filesResponse.statusText}`);
      }

      const files = await filesResponse.json();
      const downloadPath = path.join('generated-websites', leadData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-'));
      
      // Ensure download directory exists
      fs.mkdirSync(downloadPath, { recursive: true });

      // Download each file
      for (const file of files) {
        const fileResponse = await fetch(`${REPLIT_API_BASE}/repls/${projectId}/files/${file.path}`, {
          method: 'GET',
          headers: this.headers
        });

        if (fileResponse.ok) {
          const content = await fileResponse.text();
          const filePath = path.join(downloadPath, file.name);
          fs.writeFileSync(filePath, content);
          console.log(chalk.green(`✅ Downloaded: ${file.name}`));
        }
      }

      console.log(chalk.green(`✅ All files downloaded to: ${downloadPath}`));
      return downloadPath;
    } catch (error) {
      console.error(chalk.red(`❌ Error downloading files:`, error.message));
      throw error;
    }
  }

  // Enhance generated website with scraped data
  async enhanceWebsiteWithData(websitePath, leadData, analysisResults) {
    try {
      console.log(chalk.blue(`🎨 Enhancing website with business data...`));
      
      const indexPath = path.join(websitePath, 'index.html');
      if (!fs.existsSync(indexPath)) {
        throw new Error('Generated website index.html not found');
      }

      let html = fs.readFileSync(indexPath, 'utf-8');
      
      // Replace placeholders with actual business data
      html = html.replace(/\{\{businessName\}\}/g, leadData.businessName);
      html = html.replace(/\{\{city\}\}/g, leadData.city);
      html = html.replace(/\{\{email\}\}/g, leadData.email);
      html = html.replace(/\{\{primaryColor\}\}/g, analysisResults.primaryColor);
      html = html.replace(/\{\{secondaryColor\}\}/g, analysisResults.secondaryColor);
      
      // Add performance score and other metrics
      html = html.replace(/\{\{performanceScore\}\}/g, analysisResults.score || '95');
      
      // Inject custom CSS for brand colors
      const customCSS = `
        <style>
          :root {
            --primary-color: ${analysisResults.primaryColor};
            --secondary-color: ${analysisResults.secondaryColor};
          }
        </style>
      `;
      html = html.replace('</head>', `${customCSS}</head>`);
      
      fs.writeFileSync(indexPath, html);
      console.log(chalk.green(`✅ Website enhanced with business data`));
      
      return websitePath;
    } catch (error) {
      console.error(chalk.red(`❌ Error enhancing website:`, error.message));
      throw error;
    }
  }

  // Copy generated website to preview-app for Vercel deployment
  async copyToPreviewApp(websitePath, leadData) {
    try {
      console.log(chalk.blue(`📁 Copying website to preview-app...`));
      
      const slug = leadData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const previewPath = path.join('preview-app', 'prospects', slug, 'generated');
      
      // Ensure preview directory exists
      fs.mkdirSync(previewPath, { recursive: true });
      
      // Copy all files
      const files = fs.readdirSync(websitePath);
      for (const file of files) {
        const sourcePath = path.join(websitePath, file);
        const destPath = path.join(previewPath, file);
        
        if (fs.statSync(sourcePath).isFile()) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(chalk.green(`✅ Copied: ${file}`));
        }
      }
      
      console.log(chalk.green(`✅ Website copied to preview-app`));
      return previewPath;
    } catch (error) {
      console.error(chalk.red(`❌ Error copying to preview-app:`, error.message));
      throw error;
    }
  }

  // Main function to generate complete website
  async generateCompleteWebsite(leadData, analysisResults) {
    try {
      console.log(chalk.cyan(`\n🎯 Starting Replit website generation for ${leadData.businessName}`));
      
      // Step 1: Generate prompt
      const prompt = this.generateWebsitePrompt(leadData, analysisResults);
      console.log(chalk.blue(`📝 Generated prompt (${prompt.length} chars)`));
      
      // Step 2: Create Replit project
      const project = await this.createReplitProject(leadData);
      
      // Step 3: Generate website with AI
      await this.generateWebsiteWithAI(project.id, prompt);
      
      // Step 4: Download generated files
      const websitePath = await this.downloadWebsiteFiles(project.id, leadData);
      
      // Step 5: Enhance with business data
      await this.enhanceWebsiteWithData(websitePath, leadData, analysisResults);
      
      // Step 6: Copy to preview-app
      const previewPath = await this.copyToPreviewApp(websitePath, leadData);
      
      console.log(chalk.green(`\n🎉 Website generation complete!`));
      console.log(chalk.cyan(`📁 Generated files: ${websitePath}`));
      console.log(chalk.cyan(`🚀 Preview ready: ${previewPath}`));
      
      return {
        websitePath,
        previewPath,
        projectId: project.id,
        projectUrl: project.url
      };
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Website generation failed:`, error.message));
      
      // Fallback to existing preview system
      console.log(chalk.yellow(`🔄 Falling back to existing preview system...`));
      return null;
    }
  }
}

export default ReplitWebsiteGenerator;
