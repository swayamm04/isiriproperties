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

    const imgUrl = property.images && property.images.length > 0 ? getImageUrl(property.images[0]) : "";

    return {
      title: `${property.title} | I Siri Properties`,
      description: property.description?.substring(0, 160) || "Property Details",
      openGraph: {
        title: property.title,
        description: property.description?.substring(0, 160) || "Property Details",
        images: imgUrl ? [imgUrl] : [],
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
