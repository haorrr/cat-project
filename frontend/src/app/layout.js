import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../components/provider/QueryProvider";
import MainLayout from "../components/layout/MainLayout";
import { ToastProvider } from '@/components/ui/toast';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PetCare Hotel - Premium Cat Boarding",
  description: "Premium cat boarding with love, care, and luxury. Your feline friends deserve the best vacation experience!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ToastProvider>
            <QueryProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </QueryProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}