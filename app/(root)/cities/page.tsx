import CitiesList from '@/app/components/cities/CitiesList';
export default function CitiesPage() {
  return <CitiesList imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''} />;
}
