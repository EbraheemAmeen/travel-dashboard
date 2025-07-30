import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { getRoomTypeById } from '@/app/actions/hotels/room-types/getRoomTypeById';
import RoomTypeForm from '@/app/components/hotels/room-types/RoomTypeForm';

interface PageProps {
  params: {
    cityId: string;
    hotelId: string;
    roomTypeId: string;
  };
}

export default async function EditRoomTypePage({ params }: PageProps) {
  const queryClient = new QueryClient();
  const param = await params;

  // Prefetch the room type data
  await queryClient.prefetchQuery({
    queryKey: ['roomType', Number(param.hotelId), Number(param.roomTypeId)],
    queryFn: () => getRoomTypeById(Number(param.hotelId), Number(param.roomTypeId)),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Room Type</h1>
          <p className="text-gray-600">Update the room type information</p>
        </div>
        <RoomTypeForm 
          mode="edit" 
          hotelId={Number(param.hotelId)}
          roomTypeId={Number(param.roomTypeId)}
          imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL!}
          apiBaseUrl={process.env.NEXT_PUBLIC_API_URL!}
        />
      </div>
    </HydrationBoundary>
  );
} 