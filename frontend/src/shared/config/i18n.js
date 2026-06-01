import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import LOCALES from '@shared/locales/Locales';
// ─── DE ───────────────────────────────────────────────────────
import deCommon from '@shared/locales/de/common.json';
import deNav from '@shared/locales/de/nav.json';
import deAuth from '@shared/locales/de/auth.json';
import deLesson from '@shared/locales/de/lesson.json';
import deAbout from '@shared/locales/de/about.json';
import deDashboard from '@shared/locales/de/dashboard.json';
import deSettings from '@shared/locales/de/settings.json';
import deSupportChat from '@shared/locales/de/support-chat.json';
import deHome from '@shared/locales/de/home.json';
import deFaq from '@shared/locales/de/faq.json';
import deLessons from '@shared/locales/de/lessons.json';
import deLikedTutors from '@shared/locales/de/likedtutors.json';
import dePrivacy from '@shared/locales/de/privacy.json';
import deProgressChart from '@shared/locales/de/progresschart.json';
import deTutorPage from '@shared/locales/de/tutorpage.json';
// ─── RU ───────────────────────────────────────────────────────
import ruCommon from '@shared/locales/ru/common.json';
import ruNav from '@shared/locales/ru/nav.json';
import ruAuth from '@shared/locales/ru/auth.json';
import ruLesson from '@shared/locales/ru/lesson.json';
import ruAbout from '@shared/locales/ru/about.json';
import ruDashboard from '@shared/locales/ru/dashboard.json';
import ruSettings from '@shared/locales/ru/settings.json';
import ruSupportChat from '@shared/locales/ru/support-chat.json';
import ruHome from '@shared/locales/ru/home.json';
import ruFaq from '@shared/locales/ru/faq.json';
import ruLessons from '@shared/locales/ru/lessons.json';
import ruLikedTutors from '@shared/locales/ru/likedtutors.json';
import ruPrivacy from '@shared/locales/ru/privacy.json';
import ruProgressChart from '@shared/locales/ru/progresschart.json';
import ruTutorPage from '@shared/locales/ru/tutorpage.json';
// ─── EN ───────────────────────────────────────────────────────
import enCommon from '@shared/locales/en/common.json';
import enNav from '@shared/locales/en/nav.json';
import enAuth from '@shared/locales/en/auth.json';
import enLesson from '@shared/locales/en/lesson.json';
import enAbout from '@shared/locales/en/about.json';
import enDashboard from '@shared/locales/en/dashboard.json';
import enSettings from '@shared/locales/en/settings.json';
import enSupportChat from '@shared/locales/en/support-chat.json';
import enHome from '@shared/locales/en/home.json';
import enFaq from '@shared/locales/en/faq.json';
import enLessons from '@shared/locales/en/lessons.json';
import enLikedTutors from '@shared/locales/en/likedtutors.json';
import enPrivacy from '@shared/locales/en/privacy.json';
import enProgressChart from '@shared/locales/en/progresschart.json';
import enTutorPage from '@shared/locales/en/tutorpage.json';
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
    resources: {
        [LOCALES.GERMAN]: {
            common: deCommon,
            nav: deNav,
            auth: deAuth,
            lesson: deLesson,
            about: deAbout,
            dashboard: deDashboard,
            settings: deSettings,
            'support-chat': deSupportChat,
            home: deHome,
            faq: deFaq,
            lessons: deLessons,
            likedtutors: deLikedTutors,
            privacy: dePrivacy,
            progresschart: deProgressChart,
            tutorpage: deTutorPage,
        },
        [LOCALES.RUSSIAN]: {
            common: ruCommon,
            nav: ruNav,
            auth: ruAuth,
            lesson: ruLesson,
            about: ruAbout,
            dashboard: ruDashboard,
            settings: ruSettings,
            'support-chat': ruSupportChat,
            home: ruHome,
            faq: ruFaq,
            lessons: ruLessons,
            likedtutors: ruLikedTutors,
            privacy: ruPrivacy,
            progresschart: ruProgressChart,
            tutorpage: ruTutorPage,
        },
        [LOCALES.ENGLISH]: {
            common: enCommon,
            nav: enNav,
            auth: enAuth,
            lesson: enLesson,
            about: enAbout,
            dashboard: enDashboard,
            settings: enSettings,
            'support-chat': enSupportChat,
            home: enHome,
            faq: enFaq,
            lessons: enLessons,
            likedtutors: enLikedTutors,
            privacy: enPrivacy,
            progresschart: enProgressChart,
            tutorpage: enTutorPage,
        },
    },
    detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'language',
    },
    lng: undefined,
    fallbackLng: LOCALES.GERMAN,
    defaultNS: 'common',
    load: 'languageOnly',
    interpolation: {
        escapeValue: false,
    },
});
i18n.on('languageChanged', (lng) => {
    localStorage.setItem('language', lng);
});
export default i18n;
