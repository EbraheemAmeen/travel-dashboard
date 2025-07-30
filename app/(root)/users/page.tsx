
import UsersList from '@/app/components/users/UsersList';
export default function UsersPage() {
  return <UsersList imagesUrl={process.env.NEXT_PUBLIC_IMAGES_URL || ''} />;
}
