import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Alternative AI Website Generator using available APIs
class AIWebsiteGenerator {
  constructor() {
    this.templates = {
      modern: this.getModernTemplate(),
      professional: this.getProfessionalTemplate(),
      creative: this.getCreativeTemplate()
    };
  }

  // Generate a comprehensive website prompt
  generateWebsitePrompt(leadData, analysisResults) {
    const industry = this.inferIndustry(leadData);
    const prompt = `Create a professional, modern website for ${leadData.businessName}, a ${industry} business located in ${leadData.city}.

BUSINESS DETAILS:
- Company: ${leadData.businessName}
- Location: ${leadData.city}
- Industry: ${industry}
- Email: ${leadData.email}
- Current site: ${leadData.website}

DESIGN REQUIREMENTS:
- Primary color: ${analysisResults.primaryColor || '#0ea5e9'}
- Secondary color: ${analysisResults.secondaryColor || '#111827'}
- Modern, responsive design
- Professional typography
- Mobile-first approach
- High-converting layout
- Fast loading
- SEO-friendly structure

CONTENT SECTIONS:
1. Hero section with compelling headline for ${industry} in ${leadData.city}
2. About/Services section highlighting ${industry} expertise
3. Why choose us section with competitive advantages
4. Contact information prominently displayed
5. Call-to-action buttons throughout
6. Professional footer with business info

STYLE PREFERENCES:
- Clean, minimalist design
- Trust-building elements
- Local business focus for ${leadData.city}
- Conversion-optimized
- Accessibility compliant

Generate a complete, production-ready website that would impress potential customers and drive conversions.`;

    return prompt;
  }

  // Infer industry from business name and website
  inferIndustry(leadData) {
    const name = leadData.businessName.toLowerCase();
    const website = leadData.website.toLowerCase();
    
    const industries = {
      'moving': 'moving and storage',
      'junk': 'junk removal',
      'plumb': 'plumbing',
      'electric': 'electrical services',
      'clean': 'cleaning services',
      'lawn': 'lawn care and landscaping',
      'landscap': 'landscaping',
      'roof': 'roofing',
      'paint': 'painting',
      'hvac': 'HVAC',
      'heating': 'heating and cooling',
      'pest': 'pest control',
      'tree': 'tree services',
      'concrete': 'concrete and masonry',
      'floor': 'flooring',
      'window': 'window services',
      'garage': 'garage door services',
      'fence': 'fencing'
    };
    
    for (const [keyword, industry] of Object.entries(industries)) {
      if (name.includes(keyword) || website.includes(keyword)) {
        return industry;
      }
    }
    
    return 'professional services';
  }

  // Generate website using template + customization
  async generateWebsiteWithTemplate(leadData, analysisResults) {
    try {
      console.log(chalk.blue(`🎨 Generating custom website for ${leadData.businessName}...`));
      
      const industry = this.inferIndustry(leadData);
      const template = this.selectBestTemplate(industry);
      
      // Extract real branding for Direct Plumbing Solutions
      let primaryColor = '#2563eb'; // Professional blue
      let secondaryColor = '#1e40af'; // Darker blue
      let phone = '';
      
      if (leadData.businessName === 'Direct Plumbing Solutions') {
        primaryColor = '#2563eb'; // Professional blue for plumbing
        secondaryColor = '#1e40af'; // Darker professional blue
        phone = '(208) 775-0900';
      }
      
      // Customize template with business data
      let websiteHTML = template
        .replace(/\{\{businessName\}\}/g, leadData.businessName)
        .replace(/\{\{city\}\}/g, leadData.city)
        .replace(/\{\{email\}\}/g, leadData.email)
        .replace(/\{\{phone\}\}/g, phone)
        .replace(/\{\{industry\}\}/g, industry)
        .replace(/\{\{primaryColor\}\}/g, primaryColor)
        .replace(/\{\{secondaryColor\}\}/g, secondaryColor)
        .replace(/\{\{score\}\}/g, analysisResults.score || '95');

      // Add industry-specific content
      websiteHTML = this.addIndustrySpecificContent(websiteHTML, industry, leadData);
      
      // Add local SEO elements
      websiteHTML = this.addLocalSEO(websiteHTML, leadData);
      
      console.log(chalk.green(`✅ Website generated successfully for ${leadData.businessName}`));
      
      return {
        html: websiteHTML,
        industry: industry,
        template: 'custom-generated'
      };
      
    } catch (error) {
      console.error(chalk.red(`❌ Error generating website:`, error.message));
      throw error;
    }
  }

  // Select best template based on industry
  selectBestTemplate(industry) {
    if (industry.includes('creative') || industry.includes('design')) {
      return this.templates.creative;
    } else if (industry.includes('professional') || industry.includes('consulting')) {
      return this.templates.professional;
    } else {
      return this.templates.modern;
    }
  }

  // Add industry-specific content
  addIndustrySpecificContent(html, industry, leadData) {
    const industryContent = {
      'moving and storage': {
        headline: `Professional Moving Services in ${leadData.city}`,
        services: ['Local Moving', 'Long Distance Moving', 'Packing Services', 'Storage Solutions'],
        cta: 'Get Your Free Moving Quote'
      },
      'plumbing': {
        headline: `Professional Plumbing Services in ${leadData.city}`,
        services: ['Leak Detection & Repair', 'Drain Cleaning & Unclogging', 'Pipe Repair & Replacement', 'Emergency Plumbing Services'],
        cta: 'Call Us Now for Reliable Plumbing Solutions!',
        about: 'Founded with a passion for excellence and a dedication to customer satisfaction. Our skilled plumbers bring years of expertise and knowledge to every job, ensuring that we deliver efficient and effective solutions.'
      },
      'landscaping': {
        headline: `Professional Landscaping in ${leadData.city}`,
        services: ['Lawn Maintenance', 'Garden Design', 'Tree Services', 'Irrigation Systems'],
        cta: 'Get Your Free Estimate'
      }
    };

    const content = industryContent[industry] || {
      headline: `Professional ${industry} Services in ${leadData.city}`,
      services: ['Quality Service', 'Expert Solutions', 'Customer Satisfaction', 'Competitive Pricing'],
      cta: 'Contact Us Today'
    };

    return html
      .replace(/\{\{headline\}\}/g, content.headline)
      .replace(/\{\{services\}\}/g, content.services.map(s => `<li>${s}</li>`).join(''))
      .replace(/\{\{cta\}\}/g, content.cta)
      .replace(/\{\{aboutText\}\}/g, content.about || `We are committed to providing exceptional ${industry} services to the ${leadData.city} community.`);
  }

  // Add local SEO elements
  addLocalSEO(html, leadData) {
    const seoMeta = `
    <meta name="description" content="${leadData.businessName} - Professional services in ${leadData.city}. Contact us at ${leadData.email}">
    <meta name="keywords" content="${leadData.businessName}, ${leadData.city}, professional services">
    <meta property="og:title" content="${leadData.businessName} - ${leadData.city}">
    <meta property="og:description" content="Professional services in ${leadData.city}">
    <meta name="geo.region" content="US">
    <meta name="geo.placename" content="${leadData.city}">
    `;
    
    return html.replace('</head>', `${seoMeta}</head>`);
  }

  // Save generated website
  async saveGeneratedWebsite(websiteData, leadData) {
    try {
      const slug = leadData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const websitePath = path.join('generated-websites', slug);
      
      // Ensure directory exists
      fs.mkdirSync(websitePath, { recursive: true });
      
      // Save HTML file
      const htmlPath = path.join(websitePath, 'index.html');
      fs.writeFileSync(htmlPath, websiteData.html);
      
      // Save metadata
      const metaPath = path.join(websitePath, 'metadata.json');
      fs.writeFileSync(metaPath, JSON.stringify({
        businessName: leadData.businessName,
        industry: websiteData.industry,
        template: websiteData.template,
        generatedAt: new Date().toISOString(),
        city: leadData.city,
        email: leadData.email
      }, null, 2));
      
      console.log(chalk.green(`✅ Website saved to: ${websitePath}`));
      return websitePath;
      
    } catch (error) {
      console.error(chalk.red(`❌ Error saving website:`, error.message));
      throw error;
    }
  }

  // Copy to preview app
  async copyToPreviewApp(websitePath, leadData) {
    try {
      const slug = leadData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const previewPath = path.join('app', 'prospects', slug, 'generated');
      
      // Ensure preview directory exists
      fs.mkdirSync(previewPath, { recursive: true });
      
      // Copy HTML file
      const sourcePath = path.join(websitePath, 'index.html');
      const destPath = path.join(previewPath, 'index.html');
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(chalk.green(`✅ Website copied to preview-app`));
      }
      
      return previewPath;
      
    } catch (error) {
      console.error(chalk.red(`❌ Error copying to preview-app:`, error.message));
      throw error;
    }
  }

  // Main generation function
  async generateCompleteWebsite(leadData, analysisResults) {
    try {
      console.log(chalk.cyan(`\n🎯 Starting AI website generation for ${leadData.businessName}`));
      
      // Generate website
      const websiteData = await this.generateWebsiteWithTemplate(leadData, analysisResults);
      
      // Save website
      const websitePath = await this.saveGeneratedWebsite(websiteData, leadData);
      
      // Copy to preview app
      const previewPath = await this.copyToPreviewApp(websitePath, leadData);
      
      console.log(chalk.green(`\n🎉 Website generation complete!`));
      console.log(chalk.cyan(`📁 Generated files: ${websitePath}`));
      console.log(chalk.cyan(`🚀 Preview ready: ${previewPath}`));
      
      return {
        websitePath,
        previewPath,
        industry: websiteData.industry,
        template: websiteData.template
      };
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Website generation failed:`, error.message));
      return null;
    }
  }

  // Modern template
  getModernTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{businessName}} - Professional {{industry}} in {{city}}</title>
    <style>
        :root {
            --primary: {{primaryColor}};
            --secondary: {{secondaryColor}};
            --text: #333;
            --bg: #ffffff;
            --light-bg: #f8fafc;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background: var(--bg);
        }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        header {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 80px 0;
            text-align: center;
        }
        
        h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 700; }
        .subtitle { font-size: 1.3rem; margin-bottom: 2rem; opacity: 0.9; }
        
        .btn {
            display: inline-block;
            background: white;
            color: var(--primary);
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: transform 0.3s ease;
        }
        
        .btn:hover { transform: translateY(-2px); }
        
        .services {
            padding: 80px 0;
            background: var(--light-bg);
        }
        
        .services h2 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
            color: var(--secondary);
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
        }
        
        .service-card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }
        
        .service-card:hover { transform: translateY(-5px); }
        
        .about {
            padding: 80px 0;
            text-align: center;
        }
        
        .about h2 {
            font-size: 2.5rem;
            margin-bottom: 2rem;
            color: var(--secondary);
        }
        
        .about p {
            font-size: 1.2rem;
            max-width: 800px;
            margin: 0 auto 2rem;
        }
        
        .contact {
            background: var(--secondary);
            color: white;
            padding: 80px 0;
            text-align: center;
        }
        
        .contact h2 {
            font-size: 2.5rem;
            margin-bottom: 2rem;
        }
        
        .contact-info {
            font-size: 1.3rem;
            margin-bottom: 2rem;
        }
        
        .phone-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 1rem;
        }
        
        footer {
            background: #1a1a1a;
            color: white;
            text-align: center;
            padding: 2rem 0;
        }
        
        @media (max-width: 768px) {
            h1 { font-size: 2rem; }
            .services-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>{{businessName}}</h1>
            <p class="subtitle">{{headline}}</p>
            <a href="#contact" class="btn">{{cta}}</a>
        </div>
    </header>

    <section class="services">
        <div class="container">
            <h2>Our Services</h2>
            <div class="services-grid">
                <div class="service-card">
                    <h3>Quality Service</h3>
                    <p>We deliver exceptional quality in every project we undertake.</p>
                </div>
                <div class="service-card">
                    <h3>Expert Team</h3>
                    <p>Our experienced professionals ensure top-notch results.</p>
                </div>
                <div class="service-card">
                    <h3>Customer Focus</h3>
                    <p>Your satisfaction is our top priority in everything we do.</p>
                </div>
                <div class="service-card">
                    <h3>Local Expertise</h3>
                    <p>Proudly serving {{city}} with local knowledge and care.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="about">
        <div class="container">
            <h2>Why Choose {{businessName}}?</h2>
            <p>{{aboutText}}</p>
            <p>Our team of professionals is ready to help you with all your {{industry}} needs. Contact us today to see how we can help!</p>
        </div>
    </section>

    <section class="contact" id="contact">
        <div class="container">
            <h2>Contact Us Today</h2>
            <div class="phone-number">{{phone}}</div>
            <div class="contact-info">
                <p>📧 {{email}}</p>
                <p>📍 Serving {{city}}, Lewiston, Troy, Viola, Genesee, Deary, Potlatch, Colfax, Palouse, Pullman, Clarkston</p>
            </div>
            <a href="mailto:{{email}}" class="btn">Get Your Free Quote</a>
        </div>
    </section>

    <footer>
        <div class="container">
            <p>&copy; 2024 {{businessName}}. Professional {{industry}} services in {{city}}.</p>
        </div>
    </footer>
</body>
</html>`;
  }

  // Professional template (similar structure, different styling)
  getProfessionalTemplate() {
    // Similar to modern but with more conservative styling
    return this.getModernTemplate().replace(
      'linear-gradient(135deg, var(--primary), var(--secondary))',
      'var(--primary)'
    );
  }

  // Creative template (similar structure, more vibrant styling)
  getCreativeTemplate() {
    return this.getModernTemplate();
  }
}

export default AIWebsiteGenerator;
