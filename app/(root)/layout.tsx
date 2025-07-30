
import { Suspense } from "react";
import SideBar from "../components/Side-bar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main  className="flex">
      
        <SideBar />
        <div className=" w-4/5">
<Suspense fallback={<div>loading...</div>}>
        {children}
        </Suspense>
        </div>
    </main>
  );
}
