import React from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { ContractsSyncProvider } from "../components/ContractsSyncProvider";
import { VictimPhotosSyncProvider } from "../components/VictimPhotosSyncProvider";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <ContractsSyncProvider>
        <VictimPhotosSyncProvider>
          {children}
        </VictimPhotosSyncProvider>
      </ContractsSyncProvider>
    </MainLayout>
  );
}
