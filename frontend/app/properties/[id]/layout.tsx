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

    let imgUrl = property.images && property.images.length > 0 ? getImageUrl(property.images[0]) : "";

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
        images: imgUrl ? [
          {
            url: imgUrl,
            width: 800,
            height: 600,
            alt: property.title,
          }
        ] : [],
      },
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
