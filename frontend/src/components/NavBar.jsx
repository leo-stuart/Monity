import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next';

function NavBar() {
    const { t } = useTranslation();

    return (
        <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <div className="text-xl font-bold">
                <a href="/">{t('navbar.dashboard')}</a>
            </div>
            <div>
                <a href="/settings" className="mr-4">{t('navbar.settings')}</a>
                <a href="/logout">{t('navbar.logout')}</a>
            </div>
        </nav>
    );
}

export default NavBar;