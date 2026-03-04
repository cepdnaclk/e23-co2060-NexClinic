
import Link from "next/link";
import GreenButton from "../buttons/GreenButton";
import BlackButton from "../buttons/BlackButton";

function MainNavbar() {
    return (
        <div className="flex flex-row items-center justify-between w-full py-4 px-4 shadow-md bg-white dark:bg-gray-800">
            <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-between">
                <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 mr-4" />
                NexClinic
            </Link>

            <div title="links-buttons" className="flex justify-end gap-6 w-full md:w-auto mt-4 md:mt-0">
                <div title="navigation-links" className="flex text-[16px] gap-3">
                    {/* <Link href="/doctors" className="hover:underline underline-offset-2">Find Doctor</Link> */}
                    <Link href="/news-articles" className="hover:underline underline-offset-2">News & Articles</Link>
                    <Link href="/help" className="hover:underline underline-offset-2">Help</Link>
                </div>
            </div>
        </div>
    )
}

export default MainNavbar;