import { NextResponse } from 'next/server';
import { db } from '@/app/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    // Fetch all properties from Firestore
    const propertiesRef = collection(db, 'properties');
    const propertiesSnapshot = await getDocs(propertiesRef);
    const properties = propertiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static pages -->
  <url>
    <loc>https://trucknest-4q7hwykws-kenneths-projects-b5a1aa89.vercel.app</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://trucknest-4q7hwykws-kenneths-projects-b5a1aa89.vercel.app/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://trucknest-4q7hwykws-kenneths-projects-b5a1aa89.vercel.app/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Dynamic property pages -->
  ${properties.map(property => `
  <url>
    <loc>https://trucknest-4q7hwykws-kenneths-projects-b5a1aa89.vercel.app/properties/${property.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

    // Return the sitemap with proper headers
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
} 