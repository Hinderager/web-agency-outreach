export default function HomePage() {
  return (
    <div className="container">
      <div className="hero" style={{
        background: 'linear-gradient(135deg, #0ea5e9, #111827)'
      }}>
        <h1>Web Agency Preview System</h1>
        <p>Custom website previews for potential clients</p>
      </div>
      
      <div className="preview-info">
        <h2>Available Previews</h2>
        <p>Navigate to /prospects/[company-name] to view specific previews</p>
        <p>Example: /prospects/top-shelf-moving</p>
      </div>
    </div>
  )
}
