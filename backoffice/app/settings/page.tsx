"use client";
import { useState, useRef } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { X } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.company.trim())
      newErrors.company = "Company/Project name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          image: "Please select an image file",
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: "Image size should be less than 5MB",
        }));
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Settings updated successfully!");
      router.push("/dashboard");
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
        <Toaster />
        <div className="max-w-md mx-auto mt-8 rounded-xl shadow-lg p-8 border border-card bg-card relative">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div
                onClick={handleImageClick}
                className="relative w-24 h-24 rounded-full overflow-hidden bg-muted border-4 border-border cursor-pointer group hover:border-primary transition-colors duration-200"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-200 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload profile image"
                  title="Upload profile image"
                />
              </div>
              {errors.image && (
                <p className="text-sm text-destructive mt-2">{errors.image}</p>
              )}
              <h2 className="text-3xl font-bold text-foreground">Settings</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Update your account and preferences below.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground mb-3"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-card border border-border px-4 py-3 ${
                    errors.name ? "border-destructive" : ""
                  } text-foreground`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-foreground mb-3"
                >
                  Company/Project Name
                </label>
                <input
                  type="text"
                  name="company"
                  id="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  className={`block w-full rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-card border border-border px-4 py-3 ${
                    errors.company ? "border-destructive" : ""
                  } text-foreground`}
                  placeholder="Acme Inc."
                />
                {errors.company && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.company}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-3"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm bg-card border border-border px-4 py-3 ${
                    errors.email ? "border-destructive" : ""
                  } text-foreground`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="bg-muted p-6 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  Your information is stored securely. We take your privacy
                  seriously and will never share your data with third parties.
                </p>
              </div>
              {errors.submit && (
                <div className="bg-destructive/10 p-4 rounded-lg border border-destructive">
                  <p className="text-sm text-destructive">{errors.submit}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium transition-all duration-300 ${
                  isSubmitting
                    ? "text-muted-foreground bg-muted cursor-not-allowed"
                    : "text-card bg-primary hover:bg-primary/90 focus:ring-primary"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating Settings...
                  </span>
                ) : (
                  "Update Settings"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
