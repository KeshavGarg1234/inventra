
export type AvailabilityStatus = "Available" | "In Use" | "Discarded";
export type NotificationType = "allot" | "unallot" | "discard" | "restore" | "register";
export type NotificationStatus = "pending" | "approved" | "rejected";
export type UserRole = "A" | "B" | "C" | "D";

export interface User {
  personId: string; // Will store Firebase UID
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department?: string;
  section?: string;
  joiningDate: string; // ISO string date
}

export interface Bill {
    billNumber: string;
    billDate: string; // ISO string date
    company: string;
    amount?: number;
}

export interface AssignmentDetails {
    personId: string;
    name: string;
    email: string;
    phone: string;
    department?: string;
    section?: string;
    assignmentDate: string; // ISO string date
    project?: string;
}

export interface SubItem {
  id: string;
  availabilityStatus: AvailabilityStatus;
  billNumber?: string;
  lotName?: string;
  discardedDate?: string; // ISO string date
  assignedTo?: AssignmentDetails;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  totalQuantity: number;
  subItems: SubItem[];
}

export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: string; // ISO string date
  itemId?: string;
  subItemId?: string;
  itemName?: string;
  requestedData?: {
    assignmentDetails?: AssignmentDetails;
    newUser?: NewUserData;
    requester?: Pick<User, 'personId' | 'name'>;
  };
  handledAt?: string; // ISO string date
  rejectionReason?: string;
}

// Represents a single inventory's data
export interface InventoryData {
  items: Item[];
  bills: Bill[];
  users: User[];
  notifications: Notification[];
  secure?: {
    deletePasskey?: string;
    authPasskey?: string;
    contactEmail?: string;
  };
}

// Represents the metadata for an inventory
export interface Inventory {
  id: string; // The unique 8-digit code
  name: string;
  creatorUid: string;
  creatorEmail: string;
  createdAt: string; // ISO string
}

export interface NewItemData {
  name: string;
  description: string;
}

export interface NewUserData {
  personId: string; // Firebase UID
  name: string;
  email: string;
  phone: string;
  department?: string;
  section?: string;
}

export interface AddUnitsData {
  itemId: string;
  quantity: number;
  billNumber: string;
  billDate: string; // ISO string date
  company: string;
  amount?: number;
  lotName: string;
}

export interface NewBillData {
  billNumber: string;
  company: string;
  billDate: string; // ISO string
  amount?: number;
  items: {
    id: string; // Can be a temporary ID for new items
    name: string;
    quantity: number;
    isNew: boolean;
  }[];
}


export interface ActionResponse {
  success: boolean;
  message?: string;
  data?: any;
}
