import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ChainedBackend from "i18next-chained-backend";
import HttpBackend from "i18next-http-backend";
import resourcesToBackend from "i18next-resources-to-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import en from './en.json';
import { isDevelopment } from "~/helpers/environment";

const REMOTE_TRANSLATIONS_URL = "https://jubilee-production-frontend-app.s3.us-east-1.amazonaws.com";
const MAIN_LANGUAGE = "en";

const localResources = {
  en: {
    translation: {
      ...en
    }
  }
};

i18n
  .use(ChainedBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: isDevelopment,
    lng: MAIN_LANGUAGE,
    fallbackLng: MAIN_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    returnEmptyString: false,
    backend: {
      backends: [
        resourcesToBackend(localResources),
        HttpBackend
      ],
      backendOptions: [
        {},
        {
          loadPath: (lngs: string[]) => {
            const lng = Array.isArray(lngs) ? lngs[0] : lngs;
            if (lng === MAIN_LANGUAGE) return undefined;
            return `${REMOTE_TRANSLATIONS_URL}/src/translations/en (${lng}).json`;
          },
          allowMultiLoading: false,
          crossDomain: true
        }
      ]
    }
  });

export default i18n;
