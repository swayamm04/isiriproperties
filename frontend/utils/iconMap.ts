import { 
  BedDouble, 
  Bath, 
  Square, 
  Maximize, 
  Home, 
  MapPin, 
  Car, 
  Info, 
  List, 
  Hash, 
  Shield, 
  Key,
  Calendar,
  Building,
  CheckCircle,
  Wind,
  Droplet,
  Flame,
  Wifi,
  Tv,
  Compass,
  Sun,
  Trees
} from 'lucide-react';
import React from 'react';

export const getIconForField = (fieldName: string): React.ElementType => {
  if (!fieldName) return Square;
  
  const lower = fieldName.toLowerCase();
  
  if (lower.includes('bed') || lower.includes('bhk') || lower.includes('room')) return BedDouble;
  if (lower.includes('bath')) return Bath;
  if (lower.includes('area') || lower.includes('size') || lower.includes('sq ft') || lower.includes('square') || lower.includes('acre')) return Maximize;
  if (lower.includes('park') || lower.includes('car') || lower.includes('garage')) return Car;
  if (lower.includes('count') || lower.includes('num')) return Hash;
  if (lower.includes('type') || lower.includes('category')) return List;
  if (lower.includes('security') || lower.includes('guard') || lower.includes('safe')) return Shield;
  if (lower.includes('year') || lower.includes('date') || lower.includes('age')) return Calendar;
  if (lower.includes('floor') || lower.includes('level') || lower.includes('story')) return Building;
  if (lower.includes('air') || lower.includes('ac') || lower.includes('cool')) return Wind;
  if (lower.includes('water') || lower.includes('pool')) return Droplet;
  if (lower.includes('heat') || lower.includes('fire')) return Flame;
  if (lower.includes('internet') || lower.includes('wifi') || lower.includes('broadband')) return Wifi;
  if (lower.includes('tv') || lower.includes('cable') || lower.includes('media')) return Tv;
  if (lower.includes('direction') || lower.includes('facing') || lower.includes('vastu') || lower.includes('east') || lower.includes('west') || lower.includes('north') || lower.includes('south')) return Compass;
  if (lower.includes('balcony') || lower.includes('balkeny')) return Sun;
  if (lower.includes('garden') || lower.includes('land') || lower.includes('farm') || lower.includes('plot')) return Trees;
  
  return Square; // Default icon
};
