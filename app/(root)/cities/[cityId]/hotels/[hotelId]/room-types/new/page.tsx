import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import RoomTypeForm from '@/app/components/hotels/room-types/RoomTypeForm';

interface PageProps {
  params: {
    cityId: string;
    hotelId: string;
  };
}

export default async function AddRoomTypePage({ params }: PageProps) {
  const queryClient = new QueryClient();
  const param = await params;
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Room Type</h1>
          <p className="text-gray-600">Create a new room type for this hotel</p>
        </div>
        <RoomTypeForm 
          mode="add" 
          hotelId={Number(param.hotelId)}
          imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL!}
          apiBaseUrl={process.env.NEXT_PUBLIC_API_URL!}
        />
      </div>
    </HydrationBoundary>
  );
} 