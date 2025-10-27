import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle2, Zap, Wifi, Bell } from "lucide-react";
import SEO from "@/components/seo/SEO";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isInStandaloneMode);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        toast.info("To install on iOS: Tap Share button → Add to Home Screen", {
          duration: 6000,
        });
      } else {
        toast.info("Installation not available. Try using Chrome or Edge browser.", {
          duration: 4000,
        });
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success("Thanks for installing Tuleeto! You can now access the app from your home screen.");
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <MainLayout>
      <SEO
        title="Install Tuleeto App - Available for Android, iOS, Windows & Mac"
        description="Install the Tuleeto app on your device for faster access, offline support, and a native app experience. Available for Android, iOS, Windows, and Mac."
        keywords="install Tuleeto app, Tuleeto PWA, download Tuleeto, Tuleeto mobile app, Tuleeto desktop app"
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
              <Download className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Install Tuleeto App</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Get the app for faster access, offline support, and a native experience
            </p>
            
            {isInstalled ? (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-full">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">App is already installed!</span>
              </div>
            ) : (
              <Button size="lg" onClick={handleInstall} className="text-lg px-8 py-6">
                <Download className="h-5 w-5 mr-2" />
                Install Now
              </Button>
            )}
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Instant loading and smooth navigation for better property browsing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Wifi className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Offline Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Browse saved properties even without internet connection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Push Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get instant alerts for new properties matching your preferences
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Installation Instructions */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mobile Instructions */}
            <Card>
              <CardHeader>
                <Smartphone className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Install on Mobile</CardTitle>
                <CardDescription>For Android and iOS devices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm">1</span>
                    Android (Chrome)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                    <li>• Visit tuleeto.com in Chrome</li>
                    <li>• Tap the "Install" banner or menu (⋮)</li>
                    <li>• Select "Install app" or "Add to Home screen"</li>
                    <li>• Tap "Install" in the popup</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm">2</span>
                    iOS (Safari)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                    <li>• Visit tuleeto.com in Safari</li>
                    <li>• Tap the Share button (square with arrow)</li>
                    <li>• Scroll and tap "Add to Home Screen"</li>
                    <li>• Tap "Add" in the top right</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Desktop Instructions */}
            <Card>
              <CardHeader>
                <Monitor className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Install on Desktop</CardTitle>
                <CardDescription>For Windows, Mac, Linux, and ChromeOS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm">1</span>
                    Chrome / Edge
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                    <li>• Visit tuleeto.com</li>
                    <li>• Click the install icon (+) in the address bar</li>
                    <li>• Click "Install" in the dialog</li>
                    <li>• App opens in its own window</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm">2</span>
                    Safari (macOS Sonoma+)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                    <li>• Visit tuleeto.com in Safari</li>
                    <li>• Click File → Add to Dock</li>
                    <li>• App appears in your Dock</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Is it free to install?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! The Tuleeto app is completely free to install and use. No app store downloads required.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">How much space does it take?</h4>
                <p className="text-sm text-muted-foreground">
                  Very minimal - usually less than 5MB. The app caches data intelligently to save space.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Can I uninstall it later?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, you can uninstall it anytime like any other app. On mobile, long-press the icon and select uninstall. On desktop, right-click and remove.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Does it work offline?</h4>
                <p className="text-sm text-muted-foreground">
                  Partially. You can browse previously viewed properties offline, but searching for new properties requires an internet connection.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default InstallPage;
