import { Link } from 'react-router-dom'

function NavBar() {
    return (
        <nav className="bg-[#191E29] p-4 rounded shadow flex justify-around gap-6">
            <div>
                <img src="" alt="logo" />
            </div>
            <div className='flex justify-center gap-6'>
                <div className='flex justify-center gap-6'>

                <Link to="/" className="text-[#FFF] ">Dashboard</Link>
                <Link to="/transactions" className="text-[#FFF] ">Transactions</Link>
                </div>
            </div>
            <div>
                <Link to="/">
                    <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeWidth="2" d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                </Link>
            </div>
        </nav>
    )
}

export default NavBar