
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type LoginConfig = {
  isGoogleLoginEnabled: boolean;
  isPhoneLoginEnabled: boolean;
};

const CONFIG_COLLECTION = 'app_config';
const LOGIN_SETTINGS_DOC = 'login_settings';

// Firestore document reference
const loginConfigDocRef = doc(db, CONFIG_COLLECTION, LOGIN_SETTINGS_DOC);

/**
 * Fetches the login configuration from Firestore.
 * If the config doc doesn't exist, it creates it with default values (both enabled).
 * @returns {Promise<LoginConfig>} The current login configuration.
 */
export const getLoginConfig = async (): Promise<LoginConfig> => {
  try {
    const docSnap = await getDoc(loginConfigDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as LoginConfig;
    } else {
      // If the document doesn't exist, create it with default values
      const defaultConfig: LoginConfig = {
        isGoogleLoginEnabled: true,
        isPhoneLoginEnabled: true,
      };
      await setDoc(loginConfigDocRef, defaultConfig);
      return defaultConfig;
    }
  } catch (error) {
    console.error("Error fetching login config, returning default:", error);
    // Return default values in case of an error
    return {
      isGoogleLoginEnabled: true,
      isPhoneLoginEnabled: true,
    };
  }
};

/**
 * Updates the login configuration in Firestore.
 * @param {Partial<LoginConfig>} configUpdate An object with the settings to update.
 * @returns {Promise<void>}
 */
export const updateLoginConfig = async (configUpdate: Partial<LoginConfig>): Promise<void> => {
  await setDoc(loginConfigDocRef, configUpdate, { merge: true });
};
