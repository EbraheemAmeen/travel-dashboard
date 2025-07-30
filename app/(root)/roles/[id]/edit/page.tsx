import RoleForm from '@/app/components/roles/RoleForm';
export default function EditRolePage({ params }: { params: { id: string } }) {
  return <RoleForm mode="edit" roleId={Number(params.id)} />;
} 