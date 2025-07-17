import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
    };

    return (
        <div className="flex justify-center rounded-md bg-[#191E29] p-1 space-x-1">
            <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    i18n.language === 'en' ? 'bg-[#01C38D] text-white' : 'text-gray-400 hover:bg-gray-700'
                }`}
            >
                <span role="img" aria-label="English" className="mr-2">🇺🇸</span>
                English
            </button>
            <button
                onClick={() => handleLanguageChange('pt')}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    i18n.language === 'pt' ? 'bg-[#01C38D] text-white' : 'text-gray-400 hover:bg-gray-700'
                }`}
            >
                <span role="img" aria-label="Português" className="mr-2">🇧🇷</span>
                Português
            </button>
        </div>
    );
};

export default LanguageSwitcher; 