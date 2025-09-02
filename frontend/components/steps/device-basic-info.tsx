"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { DeviceData } from "@/components/enhanced-device-verification-flow";
import { Modal } from "@/components/ui/modal";
import { PixelExplosion } from "@/components/ui/pixel-explosion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModalUtils, MODAL_KEYS } from "@/lib/modal-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { set } from "date-fns"
import { Loader2 } from "lucide-react"
import { boolean } from "zod";

interface DeviceBasicInfoProps {
  deviceData: DeviceData;
  updateDeviceData: (data: Partial<DeviceData>) => void;
  onNext: () => void;
  onBack?: () => void;
  onSaveDraft?: (data: Partial<DeviceData>) => Promise<void>;
  onAutoSave?: () => void;
}

export function DeviceBasicInfo({
  deviceData,
  updateDeviceData,
  onNext,
  onBack,
  onSaveDraft,
  onAutoSave,
}: DeviceBasicInfoProps) {
  const [personaVerification, setPersonaVerification] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPosition, setExplosionPosition] = useState({ x: 0, y: 0 });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number | null>(null);
  const verificationWindowRef = useRef<Window | null>(null);
  const [localWalletAddress, setWalletAddress] = useState<any | null>(null);
  const { toast } = useToast();

  // Block Scroll while popup is open
  useEffect(() => {
    if (showWelcomeModal) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showWelcomeModal]);


  // WEBHOOK HANDLER --
  // GET WEBHOOK PERSONA RESPONSE
  async function handlePersonaWebhook(localWalletAddress: string) {
    try {
      const res = await fetch(`${backendSafeUrl}/webhook/persona/${encodeURIComponent(localWalletAddress)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        if (res.status === 404) {
          console.warn('No inquiry found for referenceId:', localWalletAddress);
          return null;
        }
        throw new Error(`Request failed: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error('Error handling Persona webhook:', err);
    }
  }


  // REPLACE WITH REAL BACKEND SAFE URL FUNCTION !!
  const backendSafeUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
  // CREATE INQUIRY --
  // get wallet address from localStorage
  useEffect(() => {
    try {
      const localDataInquiry = localStorage.getItem('walletAddress') || localStorage.getItem('stellarPublicKey');
      if (localDataInquiry) {
        let addr = localDataInquiry;
        try { addr = JSON.parse(localDataInquiry); } catch { }
        setWalletAddress(addr as string);
        console.log('WALLET ADDRESS:', addr);
      }
    } catch (e) {
      console.error('Error reading walletAddress from storage', e);
    }
  }, []);
  // search inquiry by referenceId (wallet address) --
  async function searchPersonaInquiry(localWalletAddress: string) {
    try {
      const res = await fetch(`${backendSafeUrl}/persona/inquiry/${encodeURIComponent(localWalletAddress)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        if (res.status === 404) {
          console.warn('No inquiry found for referenceId:', localWalletAddress);
          return null;
        }
        throw new Error(`Request failed: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error('Error searching Persona inquiry:', error);
      return null;
    }
  }

  async function createPersonaInquiry() {
    try {
      const payload = { localWalletAddress };

      const res = await fetch(`${backendSafeUrl}/persona/inquiry`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data = await res.json();
      console.log('LOCAL PROFILE: ', localWalletAddress);
      console.log('INQUIRY CREATED:', data);

      const inquiryId = data?.result?.data?.id;
      console.log('INQUIRY ID:', inquiryId);
      if (!inquiryId) {
        throw new Error('Inquiry ID missing in response');
      }

      // CREATE ONE-TIME-LINK --
      const linkRes = await fetch(
        `${backendSafeUrl}/persona/inquiry/${encodeURIComponent(inquiryId)}/generate-one-time-link`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!linkRes.ok) {
        throw new Error(`Failed to generate one-time link: ${linkRes.status}`);
      }

      const linkData = await linkRes.json();
      console.log('ONE-TIME LINK:', linkData);
      return linkData.link || linkData.data?.attributes?.href || null;

    } catch (error) {
      console.error('ERROR CREATING INQUIRY OR LINK', error);
      return null;
    }
  }

  useEffect(() => {
    (async () => {
      if (!localWalletAddress) return
      const existing = await searchPersonaInquiry(localWalletAddress)
      if (existing?.status === 'completed') {
        console.log('Persona verification already completed for this user.')
        setPersonaVerification(true)
      }
    })()
  }, [localWalletAddress])

  const handlePersonaVerification = useCallback(async () => {
    if (personaVerification) {
      return
    }

    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }

    if (!localWalletAddress) {
      return console.error('Wallet address is required to create Persona inquiry', localStorage)
    }

    const oneTimeLink = await createPersonaInquiry()
    if (!oneTimeLink) {
      return console.error('Failed to create Persona inquiry or one-time link')
    }

    const personaWindow = window.open(oneTimeLink, "_blank");
    verificationWindowRef.current = personaWindow;
    setPersonaVerification(true)

    console.log('STARTING PERSONA VERIFICATION FLOW ON:', oneTimeLink)
    console.log('WAITING FOR PERSONA VERIFICATION TO COMPLETE...')

    pollRef.current = window.setInterval(async () => {
      try {
        const webhookResponse = await handlePersonaWebhook(localWalletAddress);
        if (webhookResponse?.success) {
          verificationWindowRef.current?.close();
          verificationWindowRef.current = null;
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setPersonaVerification(true);
        } else {
          console.log('Persona verification not completed yet.');
        }
      } catch (error) {
        console.error('Error polling Persona webhook:', error);
      }
    }, 5000);
  }, [localWalletAddress, personaVerification])

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [])

  // Memoize device types to prevent re-creation on every render
  const DEVICE_TYPES = useMemo(() => [
    { value: "renewable-energy", label: "Renewable Energy" },
    { value: "wind-energy", label: "Wind Energy" },
    { value: "energy-storage", label: "Energy Storage" },
    { value: "solar-panel", label: "Solar Panel" },
    { value: "wind-turbine", label: "Wind Turbine" },
    { value: "battery-storage", label: "Battery Storage" },
    { value: "hydro-generator", label: "Hydro Generator" },
    { value: "geothermal", label: "Geothermal" },
    { value: "biomass", label: "Biomass" }
  ], [])

  // Use local state for form inputs to prevent re-renders
  const [localData, setLocalData] = useState({
    deviceName: deviceData.deviceName || "",
    deviceType: deviceData.deviceType || "",
    customDeviceType: deviceData.customDeviceType || "",
    location: deviceData.location || ""
  })

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('dobFormStep1Backup')
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setLocalData(prev => ({
          ...prev,
          ...parsedData
        }))
        // Also update parent state
        updateDeviceData(parsedData)
      } catch (error) {
        console.error('Error parsing localStorage data:', error)
      }
    }
  }, []) // Remove updateDeviceData from dependencies

  // Save to localStorage whenever localData changes
  useEffect(() => {
    // Use setTimeout to avoid blocking the render cycle
    const timeoutId = setTimeout(() => {
      localStorage.setItem('dobFormStep1Backup', JSON.stringify(localData))
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [localData])

  // Only sync on draftId change, not on parent state changes
  useEffect(() => {
    setLocalData({
      deviceName: deviceData.deviceName || "",
      deviceType: deviceData.deviceType || "",
      customDeviceType: deviceData.customDeviceType || "",
      location: deviceData.location || ""
    })
  }, [deviceData.draftId]) // Only reset if draftId changes

  // Check if user has seen the welcome modal in this session
  useEffect(() => {
    if (!ModalUtils.hasSeenModal(MODAL_KEYS.WELCOME)) {
      setShowWelcomeModal(true)
    }
  }, [])

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      console.log("🔍 Input change:", field, value);
      const newLocalData = { ...localData, [field]: value };
      setLocalData(newLocalData);

      // Also update parent state immediately to persist the data
      updateDeviceData({ [field]: value });

      // Trigger auto-save if available (debounced)
      if (onAutoSave) {
        setTimeout(() => {
          onAutoSave();
        }, 500);
      }
    },
    [localData, updateDeviceData, onAutoSave],
  );

  // Memoize the device type change handler specifically
  const handleDeviceTypeChange = useCallback((value: string) => {
    handleInputChange('deviceType', value)
  }, [handleInputChange])

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (!localData.deviceName || localData.deviceName.length < 2) newErrors.deviceName = "Device name is required (min 2 chars)"
    if (!localData.deviceType || localData.deviceType.length < 2) newErrors.deviceType = "Device type is required (min 2 chars)"
    if (!localData.location || localData.location.length < 2) newErrors.location = "Location is required (min 2 chars)"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;

    setIsSaving(true);
    try {
      // Update parent state first with current local data
      updateDeviceData(localData);

      // Then save the draft
      await onSaveDraft(localData);

      toast({
        title: "Draft Saved",
        description: "Your progress has been saved.",
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      // Only now update parent state
      updateDeviceData(localData)
      onNext()
    }
  }

  const handleCloseModal = () => {
    // Mark that user has seen the welcome modal
    ModalUtils.markModalAsSeen(MODAL_KEYS.WELCOME);

    // Get modal position for explosion animation
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect()
      setExplosionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      })
    }

    setShowWelcomeModal(false);
    setShowExplosion(true);
  };

  const handleExplosionComplete = () => {
    setShowExplosion(false)
  }

  return (
    <>
      {showWelcomeModal && !personaVerification && (
        <div ref={modalRef}>
          <Modal
            title="Device Verification"
            description="Let's verify your device to create an investment pool and tokenize its future revenue."
            onClose={handleCloseModal}
          >
            <div className="mb-6 space-y-4">
              <p>
                We'll guide you through the process of verifying your device's technical and financial information. This
                helps investors trust your pool and ensures transparency.
              </p>

              {personaVerification && (
                <div className="mt-4 flex items-center text-white">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <p>Waiting for Persona verification to complete...</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                className="bg-[#6366F1] text-white hover:bg-[#5355d1]"
                onClick={handlePersonaVerification}
                disabled={personaVerification}
              >
                Get Started
              </Button>
            </div>
          </Modal>
        </div>
      )}

      <PixelExplosion
        isActive={showExplosion}
        onComplete={handleExplosionComplete}
        x={explosionPosition.x}
        y={explosionPosition.y}
      />

      <Card className="w-full max-w-2xl mx-auto bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white mb-2">Device Basic Information</CardTitle>
          <CardDescription className="text-gray-300">
            Please provide the basic details about your device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  value={localData.deviceName}
                  onChange={(e) => handleInputChange('deviceName', e.target.value)}
                  placeholder="Enter device name"
                  className="form-input"
                />
                {errors.deviceName && <p className="text-red-500 text-sm mt-1">{errors.deviceName}</p>}
              </div>

              <div>
                <Label htmlFor="deviceType">Device Type</Label>
                <Select
                  value={localData.deviceType || ""}
                  onValueChange={handleDeviceTypeChange}
                >
                  <SelectTrigger id="deviceType" className="form-select">
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((deviceType) => (
                      <SelectItem key={deviceType.value} value={deviceType.value}>
                        {deviceType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.deviceType && <p className="text-red-500 text-sm mt-1">{errors.deviceType}</p>}
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={localData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter device location"
                  className="form-input"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
            </div>

            {/* Navigation buttons removed - using single button at bottom */}
          </form>
        </CardContent>
      </Card>
    </>
  )
}
