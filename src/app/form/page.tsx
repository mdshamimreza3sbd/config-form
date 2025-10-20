"use client";

import { Check, Copy, Plus, Trash2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import DraftPanel from "@/components/DraftPanel";
import { saveDraft, DraftData } from "@/lib/draftStorage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Non-SA credential schema
const nonSaCredentialSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Zod schema for form validation
const formSchema = z.object({
  restaurantName: z.string().min(1, "Restaurant name is required"),
  outletName: z.string().min(1, "Outlet name is required"),
  saPassword: z.string().min(1, "SA password is required"),
  nonSaCredentials: z.array(nonSaCredentialSchema).min(1, "At least one Non-SA credential is required"),
  anydeskUsername: z.string().optional(),
  anydeskPassword: z.string().optional(),
  ultraviewerUsername: z.string().optional(),
  ultraviewerPassword: z.string().optional(),
  // Checkboxes
  saPassChange: z.boolean(),
  syncedUserPassChange: z.boolean(),
  nonSaPassChange: z.boolean(),
  windowsAuthDisable: z.boolean(),
  sqlCustomPort: z.boolean(),
  firewallOnAllPcs: z.boolean(),
  anydeskUninstall: z.boolean(),
  ultraviewerPassAndId: z.boolean(),
  posAdminPassChange: z.boolean(),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
type NonSaCredential = z.infer<typeof nonSaCredentialSchema>;

export default function FormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [formData, setFormData] = useState<FormData>({
    restaurantName: "",
    outletName: "",
    saPassword: "",
    nonSaCredentials: [{ username: "", password: "" }],
    anydeskUsername: "",
    anydeskPassword: "",
    ultraviewerUsername: "",
    ultraviewerPassword: "",
    saPassChange: false,
    syncedUserPassChange: false,
    nonSaPassChange: false,
    windowsAuthDisable: false,
    sqlCustomPort: false,
    firewallOnAllPcs: false,
    anydeskUninstall: false,
    ultraviewerPassAndId: false,
    posAdminPassChange: false,
    remarks: "",
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Check authentication with JWT
  useEffect(() => {
    const verifyAuth = async () => {
      const storedUserName = localStorage.getItem("userName");
      const token = localStorage.getItem("token");

      if (!storedUserName || !token) {
        router.push("/");
        return;
      }

      try {
        // Verify token with the backend
        const response = await fetch("/api/auth/verify", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Token is invalid, redirect to login
          localStorage.removeItem("userName");
          localStorage.removeItem("token");
          router.push("/");
          return;
        }

        const data = await response.json();
        setUserName(data.user.username);
        setIsLoading(false);
      } catch (error) {
        console.error("Auth verification error:", error);
        localStorage.removeItem("userName");
        localStorage.removeItem("token");
        router.push("/");
      }
    };

    verifyAuth();
  }, [router]);

  // Generate passwords on page load
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      saPassword: generatePassword(16),
      nonSaCredentials: prev.nonSaCredentials.map((cred) => ({
        ...cred,
        password: generatePassword(16),
      })),
    }));
  }, []);

  // Password generator function
  const generatePassword = (length: number = 16): string => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%*_+-[],:.<>"; // Excluded: =, &, ', ", ;, ^, (, ), {, }, |, ?
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = "";
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle Non-SA credential input changes
  const handleNonSaChange = (index: number, field: 'username' | 'password', value: string) => {
    setFormData((prev) => {
      const updated = [...prev.nonSaCredentials];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, nonSaCredentials: updated };
    });
  };

  // Add new Non-SA credential
  const addNonSaCredential = () => {
    setFormData((prev) => ({
      ...prev,
      nonSaCredentials: [...prev.nonSaCredentials, { username: "", password: generatePassword(16) }],
    }));
  };

  // Remove Non-SA credential
  const removeNonSaCredential = (index: number) => {
    if (formData.nonSaCredentials.length > 1) {
      setFormData((prev) => ({
        ...prev,
        nonSaCredentials: prev.nonSaCredentials.filter((_, i) => i !== index),
      }));
    }
  };


  const handleCopyPassword = async (fieldName: string) => {
    const password = formData[fieldName as keyof typeof formData];
    if (typeof password === "string" && password) {
      await navigator.clipboard.writeText(password);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Copy Non-SA password
  const handleCopyNonSaPassword = async (index: number) => {
    const password = formData.nonSaCredentials[index]?.password;
    if (password) {
      await navigator.clipboard.writeText(password);
      setCopiedField(`nonSa-${index}`);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleSaveDraft = () => {
    // Check if required fields are filled
    if (!formData.restaurantName || !formData.outletName) {
      toast.error("Please fill in Restaurant Name and Outlet Name to save draft");
      return;
    }

    // Show confirmation dialog
    setShowDraftConfirm(true);
  };

  const handleConfirmSaveDraft = () => {
    // Save draft
    saveDraft(formData);
    toast.success("Draft saved successfully!");
    setShowDraftConfirm(false);
  };

  const handleLoadDraft = (draft: DraftData) => {
    setFormData(draft.formData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors and messages
    setErrors({});
    setSubmitError("");
    setSubmitSuccess(false);

    // Validate form data with Zod
    const result = formSchema.safeParse(formData);

    if (!result.success) {
      // Extract errors and set them in state
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((error: any) => {
        if (error.path[0]) {
          formattedErrors[error.path[0].toString()] = error.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    // Form is valid, show confirmation dialog
    setShowSubmitDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitDialog(false);

    // Form is valid, proceed with API submission
    setIsSubmitting(true);

    // Validate form data with Zod
    const result = formSchema.safeParse(formData);

    if (!result.success) {
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Capture user agent
      const userAgent = navigator.userAgent;

      const response = await fetch("/api/form/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...result.data,
          userAgent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to submit form";
        setSubmitError(errorMessage);
        toast.error(errorMessage);
        setIsSubmitting(false);
        return;
      }

      // Success
      setSubmitSuccess(true);
      setIsSubmitting(false);
      toast.success("Form submitted successfully!");

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          restaurantName: "",
          outletName: "",
          saPassword: "",
          nonSaCredentials: [{ username: "", password: "" }],
          anydeskUsername: "",
          anydeskPassword: "",
          ultraviewerUsername: "",
          ultraviewerPassword: "",
          saPassChange: false,
          syncedUserPassChange: false,
          nonSaPassChange: false,
          windowsAuthDisable: false,
          sqlCustomPort: false,
          firewallOnAllPcs: false,
          anydeskUninstall: false,
          ultraviewerPassAndId: false,
          posAdminPassChange: false,
          remarks: "",
        });
        setSubmitSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error("Submit error:", error);
      const errorMessage = "An error occurred. Please try again.";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg shadow border p-3 mb-3">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold">
              Restaurant Form
            </h1>
            <div className="px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20 self-start">
              <span className="text-xs font-medium">Welcome, {userName}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Basic Information */}
          <div className="bg-card rounded-lg shadow border p-4">
            <h2 className="text-lg font-bold mb-3 pb-2 border-b">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="restaurantName"
                  className="block text-xs font-medium mb-1"
                >
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.restaurantName ? "border-red-500" : ""
                  }`}
                  required
                />
                {errors.restaurantName && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.restaurantName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="outletName"
                  className="block text-xs font-medium mb-1"
                >
                  Outlet Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="outletName"
                  name="outletName"
                  value={formData.outletName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.outletName ? "border-red-500" : ""
                  }`}
                  required
                />
                {errors.outletName && (
                  <p className="text-red-500 text-xs mt-0.5">
                    {errors.outletName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SA & Non-SA Credentials */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* SA Section */}
            <div className="bg-card rounded-lg shadow border p-4">
              <h2 className="text-lg font-bold mb-2 pb-1.5 border-b">
                SA Credentials
              </h2>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="saPassword"
                    className="block text-xs font-medium mb-1"
                  >
                    SA Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      id="saPassword"
                      name="saPassword"
                      value={formData.saPassword}
                      onChange={handleInputChange}
                      className={`flex-1 px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary opacity-60 cursor-not-allowed ${
                        errors.saPassword ? "border-red-500" : ""
                      }`}
                      required
                      disabled
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyPassword("saPassword")}
                      className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      title={
                        copiedField === "saPassword"
                          ? "Copied!"
                          : "Copy password"
                      }
                    >
                      {copiedField === "saPassword" ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {errors.saPassword && (
                    <p className="text-red-500 text-xs mt-0.5">
                      {errors.saPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Non-SA Section - Dynamic */}
            <div className="bg-card rounded-lg shadow border p-4">
              <div className="flex justify-between items-center mb-2 pb-1.5 border-b">
                <h2 className="text-lg font-bold">Non-SA Credentials</h2>
                <button
                  type="button"
                  onClick={addNonSaCredential}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground text-xs rounded-md hover:bg-primary/90 transition-colors"
                  title="Add Non-SA credential"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
              <div className="space-y-4">
                {formData.nonSaCredentials.map((credential, index) => (
                  <div key={index} className="p-3 border rounded-md bg-muted/30 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold">Non-SA #{index + 1}</span>
                      {formData.nonSaCredentials.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeNonSaCredential(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Remove this credential"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`nonSaUsername-${index}`}
                        className="block text-xs font-medium mb-1"
                      >
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id={`nonSaUsername-${index}`}
                        value={credential.username}
                        onChange={(e) => handleNonSaChange(index, 'username', e.target.value)}
                        className={`w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
                          errors[`nonSaCredentials.${index}.username`] ? "border-red-500" : ""
                        }`}
                        required
                      />
                      {errors[`nonSaCredentials.${index}.username`] && (
                        <p className="text-red-500 text-xs mt-0.5">
                          {errors[`nonSaCredentials.${index}.username`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`nonSaPassword-${index}`}
                        className="block text-xs font-medium mb-1"
                      >
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          id={`nonSaPassword-${index}`}
                          value={credential.password}
                          onChange={(e) => handleNonSaChange(index, 'password', e.target.value)}
                          className={`flex-1 px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary opacity-60 cursor-not-allowed ${
                            errors[`nonSaCredentials.${index}.password`] ? "border-red-500" : ""
                          }`}
                          disabled
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyNonSaPassword(index)}
                          className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                          title={
                            copiedField === `nonSa-${index}`
                              ? "Copied!"
                              : "Copy password"
                          }
                        >
                          {copiedField === `nonSa-${index}` ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {errors[`nonSaCredentials.${index}.password`] && (
                        <p className="text-red-500 text-xs mt-0.5">
                          {errors[`nonSaCredentials.${index}.password`]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Remote Access Credentials */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* AnyDesk Section */}
            <div className="bg-card rounded-lg shadow border p-4">
              <h2 className="text-lg font-bold mb-2 pb-1.5 border-b">
                AnyDesk
              </h2>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="anydeskUsername"
                    className="block text-xs font-medium mb-1"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="anydeskUsername"
                    name="anydeskUsername"
                    value={formData.anydeskUsername}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="anydeskPassword"
                    className="block text-xs font-medium mb-1"
                  >
                    Password
                  </label>
                  <input
                    type="text"
                    id="anydeskPassword"
                    name="anydeskPassword"
                    value={formData.anydeskPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* UltraViewer Section */}
            <div className="bg-card rounded-lg shadow border p-4">
              <h2 className="text-lg font-bold mb-2 pb-1.5 border-b">
                UltraViewer
              </h2>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="ultraviewerUsername"
                    className="block text-xs font-medium mb-1"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="ultraviewerUsername"
                    name="ultraviewerUsername"
                    value={formData.ultraviewerUsername}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ultraviewerPassword"
                    className="block text-xs font-medium mb-1"
                  >
                    Password
                  </label>
                  <input
                    type="text"
                    id="ultraviewerPassword"
                    name="ultraviewerPassword"
                    value={formData.ultraviewerPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Tasks */}
          <div className="bg-card rounded-lg shadow border p-4">
            <h2 className="text-lg font-bold mb-2 pb-1.5 border-b">
              Form Tasks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div className="flex items-start space-x-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="saPassChange"
                  name="saPassChange"
                  checked={formData.saPassChange}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="saPassChange"
                  className="text-xs font-medium cursor-pointer flex-1"
                >
                  SA Password Change
                </label>
              </div>

              <div className="flex items-start space-x-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="syncedUserPassChange"
                  name="syncedUserPassChange"
                  checked={formData.syncedUserPassChange}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="syncedUserPassChange"
                  className="text-xs font-medium cursor-pointer flex-1"
                >
                  Synced User Password Change
                </label>
              </div>

              <div className="flex items-start space-x-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="nonSaPassChange"
                  name="nonSaPassChange"
                  checked={formData.nonSaPassChange}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="nonSaPassChange"
                  className="text-xs font-medium cursor-pointer flex-1"
                >
                  Non-SA Pass Change (Read & Write Only)
                </label>
              </div>

              <div className="flex items-start space-x-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="windowsAuthDisable"
                  name="windowsAuthDisable"
                  checked={formData.windowsAuthDisable}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="windowsAuthDisable"
                  className="text-xs font-medium cursor-pointer flex-1"
                >
                  Windows Authentication Disable
                </label>
              </div>

              <div className="flex items-start space-x-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="sqlCustomPort"
                  name="sqlCustomPort"
                  checked={formData.sqlCustomPort}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="sqlCustomPort"
                  className="text-xs font-medium cursor-pointer flex-1"
                >
                  SQL Custom Port
                </label>
              </div>

              <div className="flex items-start space-x-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="firewallOnAllPcs"
                  name="firewallOnAllPcs"
                  checked={formData.firewallOnAllPcs}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="firewallOnAllPcs"
                  className="text-xs font-medium cursor-pointer flex-1"
                >
                  Firewall ON
                </label>
              </div>

              <div className="flex items-start space-x-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="anydeskUninstall"
                  name="anydeskUninstall"
                  checked={formData.anydeskUninstall}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="anydeskUninstall"
                  className="text-xs font-medium cursor-pointer flex-1"
                >
                  AnyDesk Uninstall
                </label>
              </div>

              <div className="flex items-start space-x-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="ultraviewerPassAndId"
                  name="ultraviewerPassAndId"
                  checked={formData.ultraviewerPassAndId}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="ultraviewerPassAndId"
                  className="text-xs font-medium cursor-pointer flex-1"
                >
                  UltraViewer Password & New ID
                </label>
              </div>

              <div className="flex items-start space-x-2 p-1.5 rounded hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  id="posAdminPassChange"
                  name="posAdminPassChange"
                  checked={formData.posAdminPassChange}
                  onChange={handleInputChange}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="posAdminPassChange"
                  className="text-xs font-medium cursor-pointer flex-1"
                >
                  POS Admin Password Change
                </label>
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="bg-card rounded-lg shadow border p-4">
            <h2 className="text-lg font-bold mb-2 pb-1.5 border-b">
              Remarks
            </h2>
            <div>
              <label
                htmlFor="remarks"
                className="block text-xs font-medium mb-1"
              >
                Additional Notes (Optional)
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Enter any additional notes or remarks here..."
              />
            </div>
          </div>

          {/* Submit and Draft Buttons */}
          <div className="bg-card rounded-lg shadow border p-4">
            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
                Form submitted successfully! Form will reset in a
                moment.
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="mb-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
                {submitError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center justify-center gap-2 flex-1 bg-secondary text-secondary-foreground py-2 px-4 text-sm rounded-md font-semibold hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 border"
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={isSubmitting || submitSuccess}
                className="flex-1 bg-primary text-primary-foreground py-2 px-4 text-sm rounded-md font-semibold hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Submitting..."
                  : submitSuccess
                  ? "Submitted!"
                  : "Submit Form"}
              </button>
            </div>
          </div>
        </form>

        {/* Submit Confirmation Dialog */}
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Submission</DialogTitle>
              <DialogDescription>
                Are you sure you want to submit this form for{" "}
                <span className="font-semibold text-foreground">
                  {formData.restaurantName} - {formData.outletName}
                </span>
                ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setShowSubmitDialog(false)}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Confirm Submit
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Draft Confirmation Dialog */}
        <Dialog open={showDraftConfirm} onOpenChange={setShowDraftConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save as Draft</DialogTitle>
              <DialogDescription>
                Do you want to save this form as a draft for{" "}
                <span className="font-semibold text-foreground">
                  {formData.restaurantName} - {formData.outletName}
                </span>
                ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setShowDraftConfirm(false)}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveDraft}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Save Draft
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Draft Panel */}
        <DraftPanel onLoadDraft={handleLoadDraft} />
      </div>
    </div>
  );
}
