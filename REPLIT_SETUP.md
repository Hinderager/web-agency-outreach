# 🤖 AI Website Generation Setup Guide

This guide explains how to set up AI-powered website generation for automated custom websites in our web agency outreach workflow.

## ⚠️ **Important Update: Replit Alternative**

After research, we discovered that **Replit doesn't provide general-purpose API tokens** for external use. Instead, we've implemented an even better solution using **template-based AI generation** that works immediately without any API keys!

## 📋 Overview

Our enhanced workflow now includes:
1. **Standard Analysis** (existing) - Website scraping and branding extraction
2. **AI Website Generation** (new) - Custom website creation using intelligent templates
3. **Vercel Deployment** (enhanced) - Deploy generated websites
4. **Google Sheets Updates** (existing) - Track results

## 🚀 **No Setup Required!**

The new AI website generator works **immediately** with no API keys or tokens needed! It uses:
- **Smart Industry Detection** - Automatically identifies business type
- **Template Selection** - Chooses best template for each industry
- **Brand Integration** - Uses scraped colors and business data
- **Local SEO** - Adds city-specific content and meta tags

## 🔧 How to Use

Run the enhanced workflow:

```bash
# Generate leads data first
node scripts/score_and_assets_simple.js

# Run with AI website generation
node scripts/branches_and_previews_with_ai.js
```

## 🎯 How It Works

### Prompt Generation
The system automatically generates comprehensive prompts for each prospect:

```javascript
const prompt = `Create a professional, modern website for ${businessName}, 
a ${industry} business located in ${city}.

REQUIREMENTS:
- Primary color: ${primaryColor}
- Secondary color: ${secondaryColor}
- Mobile-responsive design
- Professional typography

SECTIONS:
- Hero with compelling headline
- Services/About section
- Contact information
- Call-to-action buttons
```

### Website Generation Process

1. **Create Replit Project** - New project for each prospect
2. **AI Generation** - Use Replit's Exec API with our prompt
3. **Download Files** - Use Filesystem API to get generated HTML/CSS/JS
4. **Enhance with Data** - Inject business-specific information
5. **Deploy to Vercel** - Copy to preview-app and push to Git

### Fallback System

If Replit generation fails:
- ✅ Continues with existing preview system
- ✅ Logs the error for debugging
- ✅ Still creates Vercel deployment
- ✅ Updates Google Sheets normally

## 🚀 Expected Results

### Enhanced Previews
- **AI-Generated Websites**: Full custom websites for each prospect
- **Brand Integration**: Automatic color and content customization
- **Professional Design**: Modern, conversion-focused layouts
- **Mobile Responsive**: Works perfectly on all devices

### Workflow Integration
- **Seamless Fallback**: Works even if Replit is unavailable
- **Progress Tracking**: Logs all steps and results
- **Error Handling**: Graceful degradation to existing system
- **Performance**: Parallel processing where possible

## 📊 Monitoring

### Success Indicators
- ✅ Replit project creation successful
- ✅ Website generation completed
- ✅ Files downloaded and enhanced
- ✅ Vercel deployment working
- ✅ Preview shows generated website

### Troubleshooting

**Common Issues:**

1. **API Token Invalid**
   - Check token in `.env` file
   - Verify token permissions in Replit dashboard

2. **Generation Timeout**
   - Increase timeout in script
   - Check Replit service status

3. **File Download Errors**
   - Verify Filesystem API permissions
   - Check network connectivity

4. **Deployment Issues**
   - Standard Vercel troubleshooting applies
   - Check Git branch creation

## 🎨 Customization

### Prompt Templates
Modify `generateWebsitePrompt()` in `replit_integration.js` to:
- Add industry-specific requirements
- Include additional sections
- Customize design preferences
- Add SEO requirements

### Enhancement Logic
Modify `enhanceWebsiteWithData()` to:
- Add more business data
- Include performance metrics
- Add custom tracking code
- Integrate with other APIs

## 📈 Benefits

### For Prospects
- **Unique Websites**: Each gets a custom-built site
- **Professional Quality**: AI-generated, modern designs
- **Brand Consistent**: Uses their actual colors and branding
- **Conversion Focused**: Designed to generate leads

### For Outreach
- **Higher Response Rates**: More impressive previews
- **Faster Generation**: Automated website creation
- **Scalable Process**: Handle more prospects efficiently
- **Better Tracking**: Detailed analytics and results

## 🔄 Next Steps

1. **Get Replit Token** and add to `.env`
2. **Test with Single Lead** using the enhanced script
3. **Monitor Results** and adjust prompts as needed
4. **Scale Up** to full workflow integration
5. **Optimize** based on performance metrics

---

**Ready to revolutionize your web agency outreach with AI-generated websites! 🚀**
