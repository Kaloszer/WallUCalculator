"use client";

import { useState, useEffect } from 'react';
import { Share2, Link as LinkIcon, Copy, Check, Mail } from 'lucide-react';
import { TwitterIcon, FacebookIcon, LinkedinIcon } from '@/app/components/icons/BrandIcons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  generateShareURL,
  parseShareURL,
  copyShareURL,
  isWebShareAPISupported,
  shareViaWebShareAPI,
  generateSocialShareLink,
  validateShareURLForQR
} from '@/lib/utils/sharing';
import { WallComponent } from '@/lib/types/domain';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: WallComponent[];
  studWallType: string;
  iJoistDepth?: number;
}

export function ShareDialog({
  open,
  onOpenChange,
  components,
  studWallType,
  iJoistDepth
}: ShareDialogProps) {
  const [shareURL, setShareURL] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [qrValidation, setQRValidation] = useState<any>(null);

  useEffect(() => {
    if (open) {
      const url = generateShareURL(components, studWallType, iJoistDepth);
      setShareURL(url);
      setQRValidation(validateShareURLForQR(url));
    }
  }, [open, components, studWallType, iJoistDepth]);

  const handleCopy = async () => {
    try {
      await copyShareURL(shareURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleWebShare = async () => {
    setIsSharing(true);
    try {
      await shareViaWebShareAPI(
        shareURL,
        'Wall Assembly Configuration',
        `Check out this wall assembly with ${components.length} components`
      );
      onOpenChange(false);
    } catch (error) {
      console.error('Web share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'email') => {
    const link = generateSocialShareLink(
      shareURL,
      platform,
      `Check out this wall assembly with R-value of ${components.length} components`
    );
    window.open(link, '_blank');
  };

  const canShare = isWebShareAPISupported();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Wall Assembly</DialogTitle>
          <DialogDescription>
            Share your wall assembly configuration with others via link or QR code
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="shareUrl">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  id="shareUrl"
                  value={shareURL}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={handleCopy} variant="outline" size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {qrValidation && !qrValidation.valid && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-sm">
                <p className="font-medium">URL too long for QR code</p>
                <p className="mt-1">{qrValidation.recommendation}</p>
              </div>
            )}

            {canShare && (
              <Button onClick={handleWebShare} disabled={isSharing} className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                {isSharing ? 'Sharing...' : 'Share via Native Share'}
              </Button>
            )}

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Assembly Summary</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Components:</strong> {components.length}</p>
                <p><strong>Stud Type:</strong> {studWallType}</p>
                <p><strong>Total Thickness:</strong> {components.reduce((sum, c) => sum + c.thickness, 0).toFixed(0)} mm</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="bg-muted p-6 rounded-lg flex items-center justify-center min-h-[300px]">
                {qrValidation?.valid ? (
                  <div className="text-center space-y-4">
                    <div className="text-6xl">📱</div>
                    <p className="text-sm text-muted-foreground">
                      Scan to open wall assembly
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-6xl">⚠️</div>
                    <div className="text-sm space-y-2">
                      <p className="text-yellow-600 font-medium">Assembly too complex for QR code</p>
                      <p className="text-muted-foreground">
                        {qrValidation?.recommendation}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {qrValidation && (
                <div className="space-y-2 text-sm">
                  <p><strong>URL Length:</strong> {qrValidation.length} bytes</p>
                  <p><strong>QR Limit:</strong> {qrValidation.limit} bytes</p>
                  <p><strong>Usage:</strong> {qrValidation.percentage.toFixed(1)}%</p>
                </div>
              )}

              {qrValidation?.valid && (
                <Button onClick={handleCopy} className="w-full">
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleSocialShare('twitter')}
                variant="outline"
                className="h-auto py-6"
              >
                <TwitterIcon className="h-6 w-6 text-blue-400" />
                <div className="ml-3 text-left">
                  <div className="font-semibold">Twitter</div>
                  <div className="text-xs text-muted-foreground">Share via tweet</div>
                </div>
              </Button>

              <Button
                onClick={() => handleSocialShare('facebook')}
                variant="outline"
                className="h-auto py-6"
              >
                <FacebookIcon className="h-6 w-6 text-blue-600" />
                <div className="ml-3 text-left">
                  <div className="font-semibold">Facebook</div>
                  <div className="text-xs text-muted-foreground">Share on timeline</div>
                </div>
              </Button>

              <Button
                onClick={() => handleSocialShare('linkedin')}
                variant="outline"
                className="h-auto py-6"
              >
                <LinkedinIcon className="h-6 w-6 text-blue-700" />
                <div className="ml-3 text-left">
                  <div className="font-semibold">LinkedIn</div>
                  <div className="text-xs text-muted-foreground">Share professionally</div>
                </div>
              </Button>

              <Button
                onClick={() => handleSocialShare('email')}
                variant="outline"
                className="h-auto py-6"
              >
                <Mail className="h-6 w-6 text-gray-600" />
                <div className="ml-3 text-left">
                  <div className="font-semibold">Email</div>
                  <div className="text-xs text-muted-foreground">Send via email</div>
                </div>
              </Button>
            </div>

            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="text-muted-foreground">
                Share your wall assembly with colleagues or save it for later. The link contains all component data and can be imported to recreate the assembly.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
