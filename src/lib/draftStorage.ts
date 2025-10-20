// Draft storage utilities for localStorage management

export interface DraftData {
  id: string;
  restaurantName: string;
  outletName: string;
  formData: any;
  createdAt: string;
  updatedAt: string;
}

const DRAFT_STORAGE_KEY = "configuration_drafts";

// Get all drafts from localStorage
export const getDrafts = (): DraftData[] => {
  if (typeof window === "undefined") return [];

  try {
    const draftsJson = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!draftsJson) return [];
    return JSON.parse(draftsJson);
  } catch (error) {
    console.error("Error reading drafts from localStorage:", error);
    return [];
  }
};

// Save a draft to localStorage
export const saveDraft = (formData: any): DraftData => {
  const drafts = getDrafts();

  // Check if draft with same restaurant and outlet already exists
  const existingIndex = drafts.findIndex(
    (d) =>
      d.restaurantName === formData.restaurantName &&
      d.outletName === formData.outletName
  );

  const now = new Date().toISOString();

  if (existingIndex !== -1) {
    // Update existing draft
    drafts[existingIndex] = {
      ...drafts[existingIndex],
      formData,
      updatedAt: now,
    };
  } else {
    // Create new draft
    const newDraft: DraftData = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      restaurantName: formData.restaurantName,
      outletName: formData.outletName,
      formData,
      createdAt: now,
      updatedAt: now,
    };
    drafts.push(newDraft);
  }

  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));

  return existingIndex !== -1
    ? drafts[existingIndex]
    : drafts[drafts.length - 1];
};

// Delete a draft by ID
export const deleteDraft = (draftId: string): void => {
  const drafts = getDrafts();
  const updatedDrafts = drafts.filter((d) => d.id !== draftId);
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedDrafts));
};

// Load a draft by ID
export const loadDraft = (draftId: string): DraftData | null => {
  const drafts = getDrafts();
  return drafts.find((d) => d.id === draftId) || null;
};

// Clear all drafts
export const clearAllDrafts = (): void => {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
};
