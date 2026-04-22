import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/(authenticated)/'],
    },
    sitemap: 'https://futurewaymakers.co.za/sitemap.xml',
  }
}
