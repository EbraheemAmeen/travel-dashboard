import CityForm from '@/app/components/cities/CityForm';
export default function NewCityPage() {
  return <CityForm 
  mode="add" 
  imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''} 
  apiBaseUrl={process.env.API_URL!} />;
} 