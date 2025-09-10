"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";

import type {
  DeviceData,
  FileInfo,
} from "@/components/enhanced-device-verification-flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  Image,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api-service";
import ResponseCache from "next/dist/server/response-cache";

interface DeviceDocumentationProps {
  deviceData: DeviceData;
  updateDeviceData: (data: Partial<DeviceData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft?: () => Promise<void>;
  onAutoSave?: () => void;
}

export function DeviceDocumentation({
  deviceData,
  updateDeviceData,
  onNext,
  onBack,
  onSaveDraft,
  onAutoSave,
}: DeviceDocumentationProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Use local state for form inputs to prevent re-renders
  const [localData, setLocalData] = useState<{
    technicalCertification: File | FileInfo | null;
    purchaseProof: File | FileInfo | null;
    maintenanceRecords: File | FileInfo | null;
    deviceImages: (File | FileInfo)[];
  }>({
    technicalCertification: deviceData.technicalCertification || null,
    purchaseProof: deviceData.purchaseProof || null,
    maintenanceRecords: deviceData.maintenanceRecords || null,
    deviceImages: deviceData.deviceImages || [],
  });

  // Only sync on draftId change, not on parent state changes
  useEffect(() => {
    setLocalData({
      technicalCertification: deviceData.technicalCertification || null,
      purchaseProof: deviceData.purchaseProof || null,
      maintenanceRecords: deviceData.maintenanceRecords || null,
      deviceImages: deviceData.deviceImages || [],
    });
  }, [deviceData.draftId]); // Only reset if draftId changes

  const handleInputChange = (field: string, value: any) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (
    field: keyof Pick<
      DeviceData,
      "technicalCertification" | "purchaseProof" | "maintenanceRecords"
    >,
    file: File | null,
  ) => {
    console.log("🔍 File change:", field, file);

    if (file) {
      // Upload file to backend using BACKEND_URL
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`http://localhost:3001/api/files/upload`, {
          method: "POST",
          body: formData,
        });
        const response = await res.json();

        if (response.status === "ok" && response.fileId) {
          const fileInfo: FileInfo = {
            id: response.fileId,
            name: response.filename,
            type: response.type,
            mimetype: response.mimetype,
            size: response.size,
            hash: response.hash,
            path: response.path,
          };
          setLocalData((prev) => ({ ...prev, [field]: fileInfo }));
          updateDeviceData({ [field]: fileInfo });

          const backup = JSON.parse(
            localStorage.getItem("dobFormBackup") || "{}",
          );
          localStorage.setItem(
            "dobFormBackup",
            JSON.stringify({
              ...backup,
              [field]: fileInfo,
            }),
          );

          toast({
            title: "File Uploaded",
            description: `${file.name} uploaded successfully`,
          });
        } else {
          toast({
            title: "Upload Failed",
            description: "Could not upload file. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Error uploading file. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // File removed
      setLocalData((prev) => ({ ...prev, [field]: null }));
      updateDeviceData({ [field]: null });

      const backup = JSON.parse(localStorage.getItem("dobFormBackup") || "{}");
      localStorage.setItem(
        "dobFormBackup",
        JSON.stringify({
          ...backup,
          [field]: null,
        }),
      );
    }
  };

  const handleImagesChange = async (files: File[]) => {
    console.log("🔍 Images change:", files);

    if (files.length > 0) {
      const uploadedImages: FileInfo[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch(`http://localhost:3001/api/files/upload`, {
            method: "POST",
            body: formData,
          });
          const response = await res.json();

          if (response.status === "ok" && response.fileId) {
            const fileInfo: FileInfo = {
              id: response.fileId,
              name: response.filename,
              type: response.type,
              mimetype: response.mimetype,
              size: response.size,
              hash: response.hash,
              path: response.path,
            };
            uploadedImages.push(fileInfo);
          } else {
            toast({
              title: "Upload Failed",
              description: `Could not upload image ${file.name}. Please try again.`,
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Upload Error",
            description: `Error uploading image ${file.name}. Please try again.`,
            variant: "destructive",
          });
        }
      }

      const updatedData = {
        ...localData,
        deviceImages: uploadedImages,
      };
      setLocalData(updatedData);
      updateDeviceData({ deviceImages: uploadedImages });

      const backup = JSON.parse(localStorage.getItem("dobFormBackup") || "{}");
      localStorage.setItem(
        "dobFormBackup",
        JSON.stringify({
          ...backup,
          deviceImages: uploadedImages,
        }),
      );

      toast({
        title: "Images Uploaded",
        description: `${uploadedImages.length} image(s) uploaded successfully`,
      });
    } else {
      // Images removed
      const updatedData = {
        ...localData,
        deviceImages: [],
      };
      setLocalData(updatedData);
      updateDeviceData({ deviceImages: [] });

      const backup = JSON.parse(localStorage.getItem("dobFormBackup") || "{}");
      localStorage.setItem(
        "dobFormBackup",
        JSON.stringify({
          ...backup,
          deviceImages: [],
        }),
      );
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!localData.technicalCertification)
      newErrors.technicalCertification = "Technical certification is required";
    if (!localData.purchaseProof)
      newErrors.purchaseProof = "Purchase proof is required";
    if (!localData.maintenanceRecords)
      newErrors.maintenanceRecords = "Maintenance records are required";
    if (!localData.deviceImages || localData.deviceImages.length === 0)
      newErrors.deviceImages = "At least one device image is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;

    setIsSaving(true);
    try {
      // Update parent state first with current local data
      updateDeviceData(localData);

      // Then save the draft
      await onSaveDraft();

      toast({
        title: "Draft Saved",
        description: "Your progress has been saved.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Only now update parent state
    updateDeviceData(localData);
    onNext();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white mb-2">
          Documentation
        </CardTitle>
        <CardDescription className="text-gray-300">
          Please upload the required documentation for your device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="technicalCertification"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Technical Certification (PDF)
              </Label>
              <Input
                id="technicalCertification"
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  handleFileChange(
                    "technicalCertification",
                    e.target.files?.[0] || null,
                  )
                }
                className="form-input"
              />
              {localData.technicalCertification && (
                <div className="text-sm text-green-400 mt-1 flex items-center gap-2">
                  <span>✓</span>
                  <span>{localData.technicalCertification.name}</span>
                  <span className="text-xs text-gray-300 ml-2">
                    {localData.technicalCertification.size
                      ? localData.technicalCertification.size < 1024 * 1024
                        ? `${(localData.technicalCertification.size / 1024).toFixed(2)} KB`
                        : `${(localData.technicalCertification.size / 1024 / 1024).toFixed(2)} MB`
                      : "Unknown"}
                  </span>
                </div>
              )}
              {errors.technicalCertification && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.technicalCertification}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="purchaseProof"
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Purchase Proof (PDF)
              </Label>
              <Input
                id="purchaseProof"
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  handleFileChange("purchaseProof", e.target.files?.[0] || null)
                }
                className="form-input"
              />
              {localData.purchaseProof && (
                <div className="text-sm text-green-400 mt-1 flex items-center gap-2">
                  <span>✓</span>
                  <span>{localData.purchaseProof.name}</span>
                  <span className="text-xs text-gray-300 ml-2">
                    {localData.purchaseProof.size
                      ? localData.purchaseProof.size < 1024 * 1024
                        ? `${(localData.purchaseProof.size / 1024).toFixed(2)} KB`
                        : `${(localData.purchaseProof.size / 1024 / 1024).toFixed(2)} MB`
                      : "Unknown"}
                  </span>
                </div>
              )}
              {errors.purchaseProof && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.purchaseProof}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="maintenanceRecords"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Maintenance Records (PDF)
              </Label>
              <Input
                id="maintenanceRecords"
                type="file"
                accept=".pdf"
                onChange={(e) =>
                  handleFileChange(
                    "maintenanceRecords",
                    e.target.files?.[0] || null,
                  )
                }
                className="form-input"
              />
              {localData.maintenanceRecords && (
                <div className="text-sm text-green-400 mt-1 flex items-center gap-2">
                  <span>✓</span>
                  <span>{localData.maintenanceRecords.name}</span>
                  <span className="text-xs text-gray-300 ml-2">
                    {localData.maintenanceRecords.size
                      ? localData.maintenanceRecords.size < 1024 * 1024
                        ? `${(localData.maintenanceRecords.size / 1024).toFixed(2)} KB`
                        : `${(localData.maintenanceRecords.size / 1024 / 1024).toFixed(2)} MB`
                      : "Unknown"}
                  </span>
                </div>
              )}
              {errors.maintenanceRecords && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.maintenanceRecords}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="deviceImages" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Device Images (JPG, PNG)
              </Label>
              <Input
                id="deviceImages"
                type="file"
                accept=".jpg,.jpeg,.png"
                multiple
                onChange={(e) =>
                  handleImagesChange(Array.from(e.target.files || []))
                }
                className="form-input"
              />
              {localData.deviceImages.length > 0 && (
                <div className="mt-1">
                  <p className="text-sm text-green-400">
                    ✓ {localData.deviceImages.length} image(s) uploaded:
                  </p>
                  <ul className="text-xs text-gray-400 ml-2">
                    {localData.deviceImages.map((file, index) => (
                      <li key={index}>
                        <span className="text-green-400">✓</span> {file.name}
                        <span className="ml-2 text-gray-300">
                          {file.size
                            ? file.size < 1024 * 1024
                              ? `${(file.size / 1024).toFixed(2)} KB`
                              : `${(file.size / 1024 / 1024).toFixed(2)} MB`
                            : "Unknown"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {errors.deviceImages && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.deviceImages}
                </p>
              )}
            </div>
          </div>

          {/* Navigation buttons removed - using single button at bottom */}
        </form>
      </CardContent>
    </Card>
  );
}
