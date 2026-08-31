import { Metadata } from "next";
import { getImageUrl } from "@/utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const res = await fetch(`${API_URL}/properties/${id}`, { cache: 'no-store' });
    const property = await res.json();

    if (!property || property.error) {
      return {
        title: "Property Not Found",
      };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      process.env.RENDER_EXTERNAL_URL || 
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    let imgUrl = property.images && property.images.length > 0 ? getImageUrl(property.images[0]) : "";

    // Ensure imgUrl is absolute if it's a local static image
    if (imgUrl && imgUrl.startsWith('/')) {
      imgUrl = `${siteUrl}${imgUrl}`;
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
