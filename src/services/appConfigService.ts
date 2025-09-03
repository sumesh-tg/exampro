
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type AppConfig = {
  isGoogleLoginEnabled: boolean;
  isPhoneLoginEnabled: boolean;
  isExamCreationEnabled: boolean;
  isCampaignCreationEnabled: boolean;
  isTopicSuggesterEnabled: boolean;
  isAiQuestionGenerationEnabled: boolean;
  topicSuggesterDailyLimitUser: number;
  topicSuggesterDailyLimitAdmin: number;
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
        topicSuggesterDailyLimitUser: data.topicSuggesterDailyLimitUser ?? 3,
        topicSuggesterDailyLimitAdmin: data.topicSuggesterDailyLimitAdmin ?? 10,
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
        topicSuggesterDailyLimitUser: 3,
        topicSuggesterDailyLimitAdmin: 10,
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
      topicSuggesterDailyLimitUser: 3,
      topicSuggesterDailyLimitAdmin: 10,
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
