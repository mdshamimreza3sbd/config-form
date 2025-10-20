'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { z } from 'zod';

// Zod schema for form validation
const formSchema = z.object({
  restaurantName: z.string().min(1, 'Restaurant name is required'),
  outletName: z.string().min(1, 'Outlet name is required'),
  saPassword: z.string().min(1, 'SA password is required'),
  nonSaUsername: z.string().min(1, 'Non-SA username is required'),
  nonSaPassword: z.string().min(1, 'Non-SA password is required'),
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
});

type FormData = z.infer<typeof formSchema>;

export default function FormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [formData, setFormData] = useState<FormData>({
    restaurantName: '',
    outletName: '',
    saPassword: '',
    nonSaUsername: '',
    nonSaPassword: '',
    anydeskUsername: '',
    anydeskPassword: '',
    ultraviewerUsername: '',
    ultraviewerPassword: '',
    saPassChange: false,
    syncedUserPassChange: false,
    nonSaPassChange: false,
    windowsAuthDisable: false,
    sqlCustomPort: false,
    firewallOnAllPcs: false,
    anydeskUninstall: false,
    ultraviewerPassAndId: false,
    posAdminPassChange: false,
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Check authentication with JWT
  useEffect(() => {
    const verifyAuth = async () => {
      const storedUserName = localStorage.getItem('userName');
      const token = localStorage.getItem('token');

      if (!storedUserName || !token) {
        router.push('/');
        return;
      }

      try {
        // Verify token with the backend
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Token is invalid, redirect to login
          localStorage.removeItem('userName');
          localStorage.removeItem('token');
          router.push('/');
          return;
        }

        const data = await response.json();
        setUserName(data.user.username);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth verification error:', error);
        localStorage.removeItem('userName');
        localStorage.removeItem('token');
        router.push('/');
      }
    };

    verifyAuth();
  }, [router]);

  // Password generator function
  const generatePassword = (length: number = 16): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
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
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGeneratePassword = (fieldName: string) => {
    const newPassword = generatePassword(16);
    setFormData(prev => ({
      ...prev,
      [fieldName]: newPassword,
    }));
  };

  const handleCopyPassword = async (fieldName: string) => {
    const password = formData[fieldName as keyof typeof formData];
    if (typeof password === 'string' && password) {
      await navigator.clipboard.writeText(password);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors and messages
    setErrors({});
    setSubmitError('');
    setSubmitSuccess(false);

    // Validate form data with Zod
    const result = formSchema.safeParse(formData);

    if (!result.success) {
      // Extract errors and set them in state
      const formattedErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          formattedErrors[error.path[0].toString()] = error.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    // Form is valid, proceed with API submission
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/configuration/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(result.data),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || 'Failed to submit configuration');
        setIsSubmitting(false);
        return;
      }

      // Success
      setSubmitSuccess(true);
      setIsSubmitting(false);

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          restaurantName: '',
          outletName: '',
          saPassword: '',
          nonSaUsername: '',
          nonSaPassword: '',
          anydeskUsername: '',
          anydeskPassword: '',
          ultraviewerUsername: '',
          ultraviewerPassword: '',
          saPassChange: false,
          syncedUserPassChange: false,
          nonSaPassChange: false,
          windowsAuthDisable: false,
          sqlCustomPort: false,
          firewallOnAllPcs: false,
          anydeskUninstall: false,
          ultraviewerPassAndId: false,
          posAdminPassChange: false,
        });
        setSubmitSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Submit error:', error);
      setSubmitError('An error occurred. Please try again.');
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
            <h1 className="text-xl md:text-2xl font-bold">Restaurant Configuration</h1>
            <div className="px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20 self-start">
              <span className="text-xs font-medium">Welcome, {userName}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Basic Information */}
          <div className="bg-card rounded-lg shadow border p-4">
            <h2 className="text-lg font-bold mb-3 pb-2 border-b">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="restaurantName" className="block text-xs font-medium mb-1">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${errors.restaurantName ? 'border-red-500' : ''}`}
                  required
                />
                {errors.restaurantName && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.restaurantName}</p>
                )}
              </div>

              <div>
                <label htmlFor="outletName" className="block text-xs font-medium mb-1">
                  Outlet Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="outletName"
                  name="outletName"
                  value={formData.outletName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${errors.outletName ? 'border-red-500' : ''}`}
                  required
                />
                {errors.outletName && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.outletName}</p>
                )}
              </div>
            </div>
          </div>

          {/* SA & Non-SA Credentials */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* SA Section */}
            <div className="bg-card rounded-lg shadow border p-4">
              <h2 className="text-lg font-bold mb-2 pb-1.5 border-b">SA Credentials</h2>
              <div className="space-y-3">
                <div>
                  <label htmlFor="saPassword" className="block text-xs font-medium mb-1">
                    SA Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      id="saPassword"
                      name="saPassword"
                      value={formData.saPassword}
                      onChange={handleInputChange}
                      className={`flex-1 px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary opacity-60 cursor-not-allowed ${errors.saPassword ? 'border-red-500' : ''}`}
                      required
                      disabled
                    />
                    <button
                      type="button"
                      onClick={() => handleGeneratePassword('saPassword')}
                      className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      title="Regenerate password"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword('saPassword')}
                      className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      title={copiedField === 'saPassword' ? 'Copied!' : 'Copy password'}
                    >
                      {copiedField === 'saPassword' ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {errors.saPassword && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.saPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Non-SA Section */}
            <div className="bg-card rounded-lg shadow border p-4">
              <h2 className="text-lg font-bold mb-2 pb-1.5 border-b">Non-SA Credentials</h2>
              <div className="space-y-3">
                <div>
                  <label htmlFor="nonSaUsername" className="block text-xs font-medium mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nonSaUsername"
                    name="nonSaUsername"
                    value={formData.nonSaUsername}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${errors.nonSaUsername ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.nonSaUsername && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.nonSaUsername}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="nonSaPassword" className="block text-xs font-medium mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      id="nonSaPassword"
                      name="nonSaPassword"
                      value={formData.nonSaPassword}
                      onChange={handleInputChange}
                      className={`flex-1 px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary opacity-60 cursor-not-allowed ${errors.nonSaPassword ? 'border-red-500' : ''}`}
                      disabled
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleGeneratePassword('nonSaPassword')}
                      className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      title="Regenerate password"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword('nonSaPassword')}
                      className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      title={copiedField === 'nonSaPassword' ? 'Copied!' : 'Copy password'}
                    >
                      {copiedField === 'nonSaPassword' ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {errors.nonSaPassword && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.nonSaPassword}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Remote Access Credentials */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* AnyDesk Section */}
            <div className="bg-card rounded-lg shadow border p-4">
              <h2 className="text-lg font-bold mb-2 pb-1.5 border-b">AnyDesk</h2>
              <div className="space-y-3">
                <div>
                  <label htmlFor="anydeskUsername" className="block text-xs font-medium mb-1">
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
                  <label htmlFor="anydeskPassword" className="block text-xs font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="password"
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
              <h2 className="text-lg font-bold mb-2 pb-1.5 border-b">UltraViewer</h2>
              <div className="space-y-3">
                <div>
                  <label htmlFor="ultraviewerUsername" className="block text-xs font-medium mb-1">
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
                  <label htmlFor="ultraviewerPassword" className="block text-xs font-medium mb-1">
                    Password
                  </label>
                  <input
                    type="password"
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

          {/* Configuration Tasks */}
          <div className="bg-card rounded-lg shadow border p-4">
            <h2 className="text-lg font-bold mb-2 pb-1.5 border-b">Configuration Tasks</h2>
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
                <label htmlFor="saPassChange" className="text-xs font-medium cursor-pointer flex-1">
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
                <label htmlFor="syncedUserPassChange" className="text-xs font-medium cursor-pointer flex-1">
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
                <label htmlFor="nonSaPassChange" className="text-xs font-medium cursor-pointer flex-1">
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
                <label htmlFor="windowsAuthDisable" className="text-xs font-medium cursor-pointer flex-1">
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
                <label htmlFor="sqlCustomPort" className="text-xs font-medium cursor-pointer flex-1">
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
                <label htmlFor="firewallOnAllPcs" className="text-xs font-medium cursor-pointer flex-1">
                  Firewall ON (All PCs)
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
                <label htmlFor="anydeskUninstall" className="text-xs font-medium cursor-pointer flex-1">
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
                <label htmlFor="ultraviewerPassAndId" className="text-xs font-medium cursor-pointer flex-1">
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
                <label htmlFor="posAdminPassChange" className="text-xs font-medium cursor-pointer flex-1">
                  POS Admin Password Change
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-card rounded-lg shadow border p-4">
            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
                Configuration submitted successfully! Form will reset in a moment.
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="mb-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || submitSuccess}
              className="w-full bg-primary text-primary-foreground py-2 px-4 text-sm rounded-md font-semibold hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : submitSuccess ? 'Submitted!' : 'Submit Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
