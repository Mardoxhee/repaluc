import React from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { ContractsSyncProvider } from "../components/ContractsSyncProvider";
import { VictimPhotosSyncProvider } from "../components/VictimPhotosSyncProvider";
import { VictimDocsSyncProvider } from "../components/VictimDocsSyncProvider";
import { VictimUpdatesSyncProvider } from "../components/VictimUpdatesSyncProvider";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <ContractsSyncProvider>
        <VictimPhotosSyncProvider>
          <VictimDocsSyncProvider>
            <VictimUpdatesSyncProvider>
              {children}
            </VictimUpdatesSyncProvider>
          </VictimDocsSyncProvider>
        </VictimPhotosSyncProvider>
      </ContractsSyncProvider>
    </MainLayout>
  );
}
