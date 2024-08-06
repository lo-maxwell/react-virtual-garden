import { GardenProvider } from "@/components/contextProviders/GardenProvider";
import { InventoryProvider } from "@/components/contextProviders/InventoryProvider";
import { StoreProvider } from "@/components/contextProviders/StoreProvider";
import Layout from "@/components/layout";
import { Analytics } from '@vercel/analytics/react';
// import type { Metadata } from "next";
import "./globals.css";

// export const metadata: Metadata = {
//   title: "Create Next App",
//   description: "Generated by create next app",
// };


export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en">
      <body>
        <GardenProvider>
          <StoreProvider>
            <InventoryProvider>
              <Layout>
                {children}
                <Analytics />
              </Layout>
            </InventoryProvider>
          </StoreProvider>
        </GardenProvider>
        </body>
    </html>
  );
}
