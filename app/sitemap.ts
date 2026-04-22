import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://futurewaymakers.co.za'
 
  // Primary Static Routes
  const routes = [
    '',
    '/login',
    '/signup',
    '/privacy',
    '/terms',
    '/support',
    '/safety',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))
 
  return routes
}
