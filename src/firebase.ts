export interface AppUser {
  uid: string;
  id?: string;
  email: string;
  displayName: string;
  name?: string;
  photoURL?: string;
  accessToken?: string;
  isMock?: boolean;
}

export const isFirebaseConfigured = false;

export const signInWithGoogle = async (email?: string, name?: string): Promise<AppUser> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        uid: 'mock-uid-123',
        id: 'mock-uid-123',
        email: email || 'test@example.com',
        displayName: name || 'Test User',
        isMock: true,
      });
    }, 1000);
  });
};

export const logOut = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 500);
  });
};
