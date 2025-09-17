import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/role-menu");
  }

  return <div>Public landing page here...</div>;
}
