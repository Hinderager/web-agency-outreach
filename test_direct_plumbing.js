import AIWebsiteGenerator from './scripts/ai_website_generator.js';
import fs from 'fs';
import chalk from 'chalk';

async function generateDirectPlumbingWebsite() {
  console.log(chalk.cyan('🚀 Generating modern website for Direct Plumbing Solutions...'));
  
  const generator = new AIWebsiteGenerator();
  
  const leadData = {
    businessName: 'Direct Plumbing Solutions',
    city: 'Moscow',
    email: 'office@directplumbingsolutions.com',
    website: 'https://www.direct-plumbing-solutions.com/'
  };
  
  const analysisResults = {
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    score: 93
  };
  
  try {
    const result = await generator.generateCompleteWebsite(leadData, analysisResults);
    
    if (result) {
      console.log(chalk.green('✅ Website generated successfully!'));
      console.log(chalk.cyan(`📁 Files saved to: ${result.websitePath}`));
      console.log(chalk.cyan(`🚀 Preview ready at: ${result.previewPath}`));
      
      // Also create a direct HTML file for easy viewing
      const htmlPath = 'direct-plumbing-modern.html';
      const htmlContent = fs.readFileSync(`${result.websitePath}/index.html`, 'utf-8');
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(chalk.green(`✅ Standalone HTML created: ${htmlPath}`));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error generating website:'), error);
  }
}

generateDirectPlumbingWebsite();
