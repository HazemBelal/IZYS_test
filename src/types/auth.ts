export interface User {
    uid: string;
    email?: string;
    username?: string;
    // Add other user properties as needed
  }
  
  export interface AuthContextType {
    currentUser: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register?: (email: string, password: string) => Promise<void>; // Optional
  }