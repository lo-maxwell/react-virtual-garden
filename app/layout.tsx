"use client";
import Layout from "@/components/layout";
import { Analytics } from '@vercel/analytics/react';
// import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./hooks/contextProviders/utility/AppProviders";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en">
            <body>
                <AppProviders>
                    <Layout>
                        {children}
                        <Analytics />
                    </Layout>
                </AppProviders>
            </body>
        </html>
    );
}
