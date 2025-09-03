import fs from 'fs'
import path from 'path'

interface ProspectData {
  companyName: string
  title: string
  brand: {
    primary: string
    secondary: string
  }
  assets: {
    logoUrl: string | null
  }
  screenshot: string
  hasGeneratedWebsite?: boolean
  generatedWebsitePath?: string | null
}

async function getProspectData(slug: string): Promise<ProspectData | null> {
  try {
    const filePath = path.join(process.cwd(), 'prospects', slug, 'content.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    return null
  }
}

async function getGeneratedWebsite(slug: string): Promise<string | null> {
  try {
    const generatedPath = path.join(process.cwd(), 'prospects', slug, 'generated', 'index.html')
    if (fs.existsSync(generatedPath)) {
      return fs.readFileSync(generatedPath, 'utf8')
    }
    return null
  } catch (error) {
    return null
  }
}

export default async function ProspectPage({ params }: { params: { slug: string } }) {
  const prospectData = await getProspectData(params.slug)

  if (!prospectData) {
    return (
      <div className="container">
        <div className="preview-info">
          <h1>Preview Not Found</h1>
          <p>The preview for "{params.slug}" could not be found.</p>
        </div>
      </div>
    )
  }

  const { companyName, brand, screenshot, hasGeneratedWebsite } = prospectData
  const generatedWebsite = hasGeneratedWebsite ? await getGeneratedWebsite(params.slug) : null

  // If we have a Replit-generated website, display it
  if (generatedWebsite) {
    return (
      <div style={{ width: '100%', height: '100vh' }}>
        <div style={{
          background: 'linear-gradient(90deg, #10b981, #059669)',
          color: 'white',
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}>
          🤖 AI-Generated Website Preview for {companyName} | Enhanced by Replit
        </div>
        <div 
          style={{ height: 'calc(100vh - 50px)' }}
          dangerouslySetInnerHTML={{ __html: generatedWebsite }}
        />
      </div>
    )
  }

  // Fallback to regular preview
  return (
    <div className="container">
      <div 
        className="hero" 
        style={{
          background: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})`,
          '--primary-color': brand.primary,
          '--secondary-color': brand.secondary
        } as React.CSSProperties}
      >
        <h1>{companyName}</h1>
        <p>Modern, Professional Website Design</p>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '10px 20px',
          borderRadius: '25px',
          fontSize: '14px',
          marginTop: '20px',
          display: 'inline-block'
        }}>
          📋 Standard Preview (Replit generation not available)
        </div>
      </div>
      
      <div className="preview-info">
        <h2>Custom Brand Preview for {companyName}</h2>
        <p>This is a preview of how your website could look with modern design principles and your brand colors.</p>
        
        <div className="brand-colors">
          <div>
            <p><strong>Primary Color:</strong></p>
            <div 
              className="color-swatch" 
              style={{ backgroundColor: brand.primary }}
              title={brand.primary}
            ></div>
            <p>{brand.primary}</p>
          </div>
          <div>
            <p><strong>Secondary Color:</strong></p>
            <div 
              className="color-swatch" 
              style={{ backgroundColor: brand.secondary }}
              title={brand.secondary}
            ></div>
            <p>{brand.secondary}</p>
          </div>
        </div>

        {screenshot && (
          <div>
            <h3>Website Screenshot</h3>
            <img 
              src={screenshot} 
              alt={`${companyName} website screenshot`}
              className="screenshot"
            />
          </div>
        )}
        
        <div style={{
          background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
          padding: '20px',
          borderRadius: '12px',
          margin: '20px 0',
          border: '2px dashed #9ca3af'
        }}>
          <h3 style={{ color: '#374151', marginTop: 0 }}>🚀 Coming Soon: AI-Generated Websites</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>
            This preview will be enhanced with a fully custom AI-generated website using Replit's technology.
            Each prospect will get a unique, professionally designed website tailored to their business.
          </p>
        </div>
      </div>
      
      <div className="preview-info">
        <h3>What's Included:</h3>
        <ul>
          <li>✅ Modern, responsive design</li>
          <li>✅ Custom brand color integration</li>
          <li>✅ Professional typography</li>
          <li>✅ Mobile-optimized layout</li>
          <li>✅ SEO-friendly structure</li>
          <li>✅ Fast loading performance</li>
          <li>🤖 <strong>AI-Generated Custom Website (Replit Integration)</strong></li>
        </ul>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  const prospectsDir = path.join(process.cwd(), 'prospects')
  
  try {
    const prospects = fs.readdirSync(prospectsDir)
    return prospects.map((slug) => ({
      slug,
    }))
  } catch (error) {
    return []
  }
}