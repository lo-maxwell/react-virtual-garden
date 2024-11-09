import { UserProvider } from "@/app/hooks/contextProviders/UserProvider";
import { GardenProvider } from "@/app/hooks/contextProviders/GardenProvider";
import { StoreProvider } from "@/app/hooks/contextProviders/StoreProvider";
import { InventoryProvider } from "@/app/hooks/contextProviders/InventoryProvider";
import { SelectedItemProvider } from "@/app/hooks/contextProviders/SelectedItemProvider";
import Layout from "@/components/layout";
import { Analytics } from '@vercel/analytics/react';
// import type { Metadata } from "next";
import "./globals.css";
import { AccountProvider } from "@/app/hooks/contextProviders/AccountProvider";
import { AuthProvider } from "./hooks/contextProviders/AuthProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <AuthProvider>
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
        </AuthProvider>
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
