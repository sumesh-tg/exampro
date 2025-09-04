
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type AppConfig = {
  isGoogleLoginEnabled: boolean;
  isPhoneLoginEnabled: boolean;
  isExamCreationEnabled: boolean;
  isCampaignCreationEnabled: boolean;
  isTopicSuggesterEnabled: boolean;
  isAiQuestionGenerationEnabled: boolean;
  initialFreeAttempts: number;
  rechargeAmount: number;
  attemptsPerRecharge: number;
  isOrgRequestPaymentEnabled: boolean;
  orgRequestFee: number;
};

const CONFIG_COLLECTION = 'app_config';
const LOGIN_SETTINGS_DOC = 'login_settings';

// Firestore document reference
const configDocRef = doc(db, CONFIG_COLLECTION, LOGIN_SETTINGS_DOC);

/**
 * Fetches the application configuration from Firestore.
 * If the config doc doesn't exist, it creates it with default values.
 * @returns {Promise<AppConfig>} The current application configuration.
 */
export const getAppConfig = async (): Promise<AppConfig> => {
  try {
    const docSnap = await getDoc(configDocRef);
    if (docSnap.exists()) {
      // Ensure all fields are present, providing defaults for missing ones
      const data = docSnap.data();
      return {
        isGoogleLoginEnabled: data.isGoogleLoginEnabled ?? true,
        isPhoneLoginEnabled: data.isPhoneLoginEnabled ?? true,
        isExamCreationEnabled: data.isExamCreationEnabled ?? true,
        isCampaignCreationEnabled: data.isCampaignCreationEnabled ?? true,
        isTopicSuggesterEnabled: data.isTopicSuggesterEnabled ?? true,
        isAiQuestionGenerationEnabled: data.isAiQuestionGenerationEnabled ?? true,
        initialFreeAttempts: data.initialFreeAttempts ?? 5,
        rechargeAmount: data.rechargeAmount ?? 10,
        attemptsPerRecharge: data.attemptsPerRecharge ?? 5,
        isOrgRequestPaymentEnabled: data.isOrgRequestPaymentEnabled ?? false,
        orgRequestFee: data.orgRequestFee ?? 100,
      };
    } else {
      // If the document doesn't exist, create it with default values
      const defaultConfig: AppConfig = {
        isGoogleLoginEnabled: true,
        isPhoneLoginEnabled: true,
        isExamCreationEnabled: true,
        isCampaignCreationEnabled: true,
        isTopicSuggesterEnabled: true,
        isAiQuestionGenerationEnabled: true,
        initialFreeAttempts: 5,
        rechargeAmount: 10,
        attemptsPerRecharge: 5,
        isOrgRequestPaymentEnabled: false,
        orgRequestFee: 100,
      };
      await setDoc(configDocRef, defaultConfig);
      return defaultConfig;
    }
  } catch (error) {
    console.error("Error fetching app config, returning default:", error);
    // Return default values in case of an error
    return {
      isGoogleLoginEnabled: true,
      isPhoneLoginEnabled: true,
      isExamCreationEnabled: true,
      isCampaignCreationEnabled: true,
      isTopicSuggesterEnabled: true,
      isAiQuestionGenerationEnabled: true,
      initialFreeAttempts: 5,
      rechargeAmount: 10,
      attemptsPerRecharge: 5,
      isOrgRequestPaymentEnabled: false,
      orgRequestFee: 100,
    };
  }
};

/**
 * Updates the application configuration in Firestore.
 * @param {Partial<AppConfig>} configUpdate An object with the settings to update.
 * @returns {Promise<void>}
 */
export const updateAppConfig = async (configUpdate: Partial<AppConfig>): Promise<void> => {
  await setDoc(configDocRef, configUpdate, { merge: true });
};
