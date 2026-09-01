import { Metadata } from "next";
import { getImageUrl } from "@/utils/api";
import { headers } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    
    const headersList = await headers();
    let host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
    if (host.includes('localhost') && process.env.NODE_ENV === 'production') {
      host = 'plotandacre.com';
    }
    const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const dynamicSiteUrl = `${protocol}://${host}`;

    let fetchUrl = `${API_URL}/properties/${id}`;
    if (fetchUrl.startsWith('/')) {
      fetchUrl = `${dynamicSiteUrl}${fetchUrl}`;
    }

    let property = null;
    try {
      const res = await fetch(fetchUrl, { cache: 'no-store' });
      if (res.ok) {
        property = await res.json();
      } else {
        throw new Error(`Failed to fetch from ${fetchUrl}: ${res.statusText}`);
      }
    } catch (err) {
      console.error("Primary fetch failed for metadata:", err);
      // Fallback for NAT hairpinning issues on VPS
      if (!fetchUrl.includes('127.0.0.1') && !fetchUrl.includes('localhost')) {
        try {
          const fallbackUrl = `http://127.0.0.1:5000/api/properties/${id}`;
          console.log("Trying fallback URL:", fallbackUrl);
          const fallbackRes = await fetch(fallbackUrl, { cache: 'no-store' });
          if (fallbackRes.ok) {
            property = await fallbackRes.json();
          }
        } catch (fallbackErr) {
          console.error("Fallback fetch failed:", fallbackErr);
        }
      }
    }

    if (!property || property.error) {
      return {
        title: "Property Not Found",
      };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      process.env.RENDER_EXTERNAL_URL || 
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      dynamicSiteUrl;

    let imgUrl = property.images && property.images.length > 0 ? getImageUrl(property.images[0]) : "";

    // Ensure imgUrl is absolute if it's a local static image or localhost
    if (imgUrl && imgUrl.startsWith('/')) {
      imgUrl = `${siteUrl}${imgUrl}`;
    } else if (imgUrl && imgUrl.startsWith('http://localhost')) {
      imgUrl = imgUrl.replace(/^http:\/\/localhost(:\d+)?/, siteUrl);
    } else if (imgUrl && imgUrl.startsWith('http://127.0.0.1')) {
      imgUrl = imgUrl.replace(/^http:\/\/127\.0\.0\.1(:\d+)?/, siteUrl);
    }

    // Optimize Cloudinary image specifically for WhatsApp link preview limits (<300KB)
    if (imgUrl.includes("res.cloudinary.com") && imgUrl.includes("/image/upload/")) {
      imgUrl = imgUrl.replace("/image/upload/", "/image/upload/w_800,h_600,c_fill,q_auto,f_auto/");
    }

    return {
      title: `${property.title} | Plot&Acre`,
      description: property.description?.substring(0, 160) || "Property Details",
      openGraph: {
        title: property.title,
        description: property.description?.substring(0, 160) || "Property Details",
        url: `${siteUrl}/properties/${id}`,
        siteName: "Plot&Acre",
        ...(imgUrl ? {
          images: [
            {
              url: imgUrl,
              width: 800,
              height: 600,
              alt: property.title,
            }
          ]
        } : {}),
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: property.title,
        description: property.description?.substring(0, 160) || "Property Details",
        ...(imgUrl ? {
          images: [imgUrl]
        } : {}),
      }
    };
  } catch (error) {
    return {
      title: "Property Details",
    };
  }
}

export default function PropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
