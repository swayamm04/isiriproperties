export interface Property {
  id: string;
  _id?: string;
  title: string;
  location: string;
  price: number;
  image: string;
  beds: number;
  baths: number;
  area: string;
  type: "Villa" | "Chalet" | "Penthouse" | "Site";
  description: string;
  customFields?: any;
  listingType?: string;
  rentFrequency?: string;
}

export const PROPERTIES: Property[] = [
  {
    id: "ocean-breeze-villa",
    title: "Ocean Breeze Villa",
    location: "32 Ocean Drive, Malibu",
    price: 45000000,
    image: "/prop-1.png",
    beds: 4,
    baths: 4.5,
    area: "5,400 sqft",
    type: "Villa",
    description: "An architectural masterpiece perched on Malibu's finest coastline. Featuring seamless indoor-outdoor transition, a 50ft infinity pool, and custom marble finishes throughout.",
  },
  {
    id: "misty-forest-chalet",
    title: "Misty Forest Chalet",
    location: "221 Baker Street, Aspen",
    price: 32000000,
    image: "/prop-2.png",
    beds: 3,
    baths: 3,
    area: "3,800 sqft",
    type: "Chalet",
    description: "A striking concrete and dark oak cabin structure built to withstand winters while offering warmth and luxury. Boasts panoramic mountain views and floor-to-ceiling glass walls.",
  },
  {
    id: "skyline-penthouse",
    title: "Skyline Penthouse",
    location: "145 Pinecrest Lane, New York",
    price: 57000000,
    image: "/prop-3.png",
    beds: 3,
    baths: 3.5,
    area: "4,200 sqft",
    type: "Penthouse",
    description: "Occupying the top two floors of a premier Manhattan tower, this residence features wrap-around glass balconies, private elevator access, and a custom designer kitchen.",
  },
  {
    id: "desert-brutalist-retreat",
    title: "Desert Brutalist Retreat",
    location: "88 Palms Boulevard, Palm Springs",
    price: 61000000,
    image: "/prop-4.png",
    beds: 5,
    baths: 5.5,
    area: "6,800 sqft",
    type: "Villa",
    description: "A sculptural concrete retreat that merges brutalist geometry with desert minimalism. Includes private courtyards, a sunken fireplace lounge, and an Olympic-size pool.",
  },
];
