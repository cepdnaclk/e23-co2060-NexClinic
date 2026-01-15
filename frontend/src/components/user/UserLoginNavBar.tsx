
import Link from "next/link";
import GreenButton from "../buttons/GreenButton";


function MainNavbar() {
    return (
        <div className="flex sm:flex-wrap items-center justify-between w-screen py-4 shadow-md bg-white dark:bg-gray-800">
            <div title="logo-brandname" className="flex items-center justify-between">
                <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 mr-4" />
                <Link href = "/" className="text-2xl font-bold text-gray-800 dark:text-white">
                    NexClinic
                </Link>
            </div>
            <div title="links-buttons" className="flex items-center gap-5">
                <div title="navigation-links" className="flex text-[15px] gap-3">
                    <Link href = "/doctors" className="hover:underline underline-offset-2">Find Doctor</Link>
                    <Link href = "/news-articles" className="hover:underline underline-offset-2">News & Articles</Link>
                    <Link href = "/help" className="hover:underline underline-offset-2">Help</Link>
                </div>
                <div title="log-sign-buttons" className="flex gap-3">
                    <GreenButton>
                        <Link href = "/doctor/login">I'm a Doctor</Link>
                    </GreenButton>
                </div>
            </div>
        </div>
    )
}

export default MainNavbar;