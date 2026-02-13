import React from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { ContractsSyncProvider } from "../components/ContractsSyncProvider";
import { VictimPhotosSyncProvider } from "../components/VictimPhotosSyncProvider";
import { VictimDocsSyncProvider } from "../components/VictimDocsSyncProvider";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <ContractsSyncProvider>
        <VictimPhotosSyncProvider>
          <VictimDocsSyncProvider>
            {children}
          </VictimDocsSyncProvider>
        </VictimPhotosSyncProvider>
      </ContractsSyncProvider>
    </MainLayout>
  );
}
