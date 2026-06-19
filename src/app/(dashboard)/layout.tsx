import { ReactNode } from "react";
import ClientLayout from "./ClientLayout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}
