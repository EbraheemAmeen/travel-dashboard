
import SideBar from "../components/Side-bar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main  className="flex">
      
        <SideBar />
        <div className=" w-4/5">

        {children}
        </div>
    </main>
  );
}
