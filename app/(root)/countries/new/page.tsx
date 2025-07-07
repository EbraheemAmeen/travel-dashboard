import NewCountryForm from "@/app/components/forms/NewCountryForm";

export default function NewCountryPage() {
  return (
    <NewCountryForm apiBaseUrl={process.env.API_URL!} />
  );
}