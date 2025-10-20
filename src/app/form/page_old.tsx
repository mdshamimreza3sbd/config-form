'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, RefreshCw } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

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

    // Form is valid, proceed with submission
    console.log('Form Data:', result.data);
    // Add your form submission logic here
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-lg border p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold">Restaurant Configuration</h1>
            <div className="px-4 py-2 bg-primary/10 rounded-md border border-primary/20">
              <span className="text-sm font-medium">Welcome, {userName}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* SA Credentials Section */}
            <div className="space-y-4">
              <div>
                <label htmlFor="restaurantName" className="block text-sm font-medium mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${errors.restaurantName ? 'border-red-500' : ''}`}
                  required
                />
                {errors.restaurantName && (
                  <p className="text-red-500 text-sm mt-1">{errors.restaurantName}</p>
                )}
              </div>

              <div>
                <label htmlFor="outletName" className="block text-sm font-medium mb-2">
                  Outlet Name
                </label>
                <input
                  type="text"
                  id="outletName"
                  name="outletName"
                  value={formData.outletName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${errors.outletName ? 'border-red-500' : ''}`}
                  required
                />
                {errors.outletName && (
                  <p className="text-red-500 text-sm mt-1">{errors.outletName}</p>
                )}
              </div>

              <div>
                <label htmlFor="saPassword" className="block text-sm font-medium mb-2">
                  SA Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="saPassword"
                    name="saPassword"
                    value={formData.saPassword}
                    onChange={handleInputChange}
                    className={`flex-1 px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary opacity-60 cursor-not-allowed ${errors.saPassword ? 'border-red-500' : ''}`}
                    required
                    disabled
                  />
                  <button
                    type="button"
                    onClick={() => handleGeneratePassword('saPassword')}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    title="Regenerate password"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyPassword('saPassword')}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    title={copiedField === 'saPassword' ? 'Copied!' : 'Copy password'}
                  >
                    <Copy className={`w-4 h-4 ${copiedField === 'saPassword' ? 'text-green-600' : ''}`} />
                  </button>
                </div>
                {errors.saPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.saPassword}</p>
                )}
              </div>
            </div>

            {/* Non-SA Section */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Non SA</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="nonSaUsername" className="block text-sm font-medium mb-2">
                    Non-SA Username
                  </label>
                  <input
                    type="text"
                    id="nonSaUsername"
                    name="nonSaUsername"
                    value={formData.nonSaUsername}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary ${errors.nonSaUsername ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.nonSaUsername && (
                    <p className="text-red-500 text-sm mt-1">{errors.nonSaUsername}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="nonSaPassword" className="block text-sm font-medium mb-2">
                    Non-SA Password
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="nonSaPassword"
                      name="nonSaPassword"
                      value={formData.nonSaPassword}
                      onChange={handleInputChange}
                      className={`flex-1 px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary opacity-60 cursor-not-allowed ${errors.nonSaPassword ? 'border-red-500' : ''}`}
                      disabled
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleGeneratePassword('nonSaPassword')}
                      className="px-4 py-2 bg-secondary hover:bg-secondary/80 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      title="Regenerate password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword('nonSaPassword')}
                      className="px-4 py-2 bg-secondary hover:bg-secondary/80 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      title={copiedField === 'nonSaPassword' ? 'Copied!' : 'Copy password'}
                    >
                      <Copy className={`w-4 h-4 ${copiedField === 'nonSaPassword' ? 'text-green-600' : ''}`} />
                    </button>
                  </div>
                  {errors.nonSaPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.nonSaPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* AnyDesk Section */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">AnyDesk</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="anydeskUsername" className="block text-sm font-medium mb-2">
                    AnyDesk Username
                  </label>
                  <input
                    type="text"
                    id="anydeskUsername"
                    name="anydeskUsername"
                    value={formData.anydeskUsername}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="anydeskPassword" className="block text-sm font-medium mb-2">
                    AnyDesk Password
                  </label>
                  <input
                    type="password"
                    id="anydeskPassword"
                    name="anydeskPassword"
                    value={formData.anydeskPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* UltraViewer Section */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">UltraViewer</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="ultraviewerUsername" className="block text-sm font-medium mb-2">
                    UltraViewer Username
                  </label>
                  <input
                    type="text"
                    id="ultraviewerUsername"
                    name="ultraviewerUsername"
                    value={formData.ultraviewerUsername}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="ultraviewerPassword" className="block text-sm font-medium mb-2">
                    UltraViewer Password
                  </label>
                  <input
                    type="password"
                    id="ultraviewerPassword"
                    name="ultraviewerPassword"
                    value={formData.ultraviewerPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Checkboxes Section */}
            <div className="border-t pt-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="deletePreviousUser"
                    name="deletePreviousUser"
                    checked={formData.deletePreviousUser}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="deletePreviousUser" className="ml-3 text-sm font-medium">
                    Delete Previous Sync/Non Sync User
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableFirewall"
                    name="enableFirewall"
                    checked={formData.enableFirewall}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="enableFirewall" className="ml-3 text-sm font-medium">
                    Enable Firewall
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anydeskUninstall"
                    name="anydeskUninstall"
                    checked={formData.anydeskUninstall}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="anydeskUninstall" className="ml-3 text-sm font-medium">
                    AnyDesk Uninstall/Change Pass
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ultraviewerChangePass"
                    name="ultraviewerChangePass"
                    checked={formData.ultraviewerChangePass}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="ultraviewerChangePass" className="ml-3 text-sm font-medium">
                    UltraViewer Change Pass
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="posChangePass"
                    name="posChangePass"
                    checked={formData.posChangePass}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="posChangePass" className="ml-3 text-sm font-medium">
                    POS Change Pass
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-md font-semibold hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
