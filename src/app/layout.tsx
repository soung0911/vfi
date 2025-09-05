import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/Theme/theme-provider";
import { Provider } from "jotai";

export const metadata: Metadata = {
  title: "Inshorts AI Motion Traveler",
  description: "Inshorts AI Motion Traveler v. 0.5 WebUI (Permitted User Only)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Provider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster expand={true} richColors />
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}
