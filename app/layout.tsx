import { UserProvider } from "@/components/contextProviders/UserProvider";
import { GardenProvider } from "@/components/contextProviders/GardenProvider";
import { StoreProvider } from "@/components/contextProviders/StoreProvider";
import { InventoryProvider } from "@/components/contextProviders/InventoryProvider";
import { SelectedItemProvider } from "@/components/contextProviders/SelectedItemProvider";
import Layout from "@/components/layout";
import { Analytics } from '@vercel/analytics/react';
// import type { Metadata } from "next";
import "./globals.css";
import { AccountProvider } from "@/components/contextProviders/AccountProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <AccountProvider>
            <UserProvider>
                <GardenProvider>
                    <StoreProvider>
                        <InventoryProvider>
                            <SelectedItemProvider>
                                {children}
                            </SelectedItemProvider>
                        </InventoryProvider>
                    </StoreProvider>
                </GardenProvider>
            </UserProvider>
        </AccountProvider>
    );
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    <Layout>
                        {children}
                        <Analytics />
                    </Layout>
                </Providers>
            </body>
        </html>
    );
}
