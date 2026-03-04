
import Link from "next/link";
import GreenButton from "../buttons/GreenButton";


function UserLoginNavBar() {
    return (
        <div className="flex flex-wrap items-center justify-between w-full py-4 px-6 shadow-md bg-white dark:bg-gray-800">
            <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-between">
                <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 mr-4" />
                NexClinic
            </Link>
            <div
                title="links-buttons"
                className="flex flex-wrap items-center gap-6 justify-between w-full md:w-auto mt-4 md:mt-0"
            >
                <div
                    title="navigation-links"
                    className="flex flex-1 justify-center md:flex-none md:justify-start text-[16px] gap-5"
                >
                    <Link href="/doctors" className="hover:underline underline-offset-2">
                        Find Doctor
                    </Link>
                    <Link href="/news-articles" className="hover:underline underline-offset-2">
                        News & Articles
                    </Link>
                    <Link href="/help" className="hover:underline underline-offset-2">
                        Help
                    </Link>
                </div>
                <div
                    title="log-sign-buttons"
                    className="flex flex-1 justify-end md:flex-none gap-3"
                >
                    <GreenButton>
                        <Link href="/doctor/login">I'm a Doctor</Link>
                    </GreenButton>
                </div>
            </div>
        </div>
    );
}

export default UserLoginNavBar;