import './globals.css'

export const metadata = {
  title: 'Web Agency Preview',
  description: 'Custom website previews for prospects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
