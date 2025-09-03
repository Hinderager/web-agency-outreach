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

  const { companyName, brand, screenshot } = prospectData

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
        </ul>
      </div>
    </div>
  )
}

export async function generateStaticParams() {
  // This will generate static pages for all prospects
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
