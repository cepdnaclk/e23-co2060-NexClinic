import GreenButton from "@/components/buttons/GreenButton";
import RoleBasedNavbar from "@/components/common/RoleBasedNavbar";
import Link from "next/link";
import NewsCard from "@/components/HomePage/NewsCard";

export default function Home() {
  return (
      <main className="flex flex-col mb-10 min-h-screen w-full  items-center justify-between sm:items-start dark:bg-gray-900">
        <div title="home-nav-bar" className="fixed w-full top-0 left-0 z-10">
                        <RoleBasedNavbar/>
        </div>
        <div title="home-row-1" className="relative flex flex-col bg-gray-200 h-[700px] gap-6 mt-[70px]">
            <img
                className="relative opacity-40 h-[700px] w-screen object-cover" 
                src="/images/main-bg.jpg" 
                alt="background" 
            />
            <h1 className="absolute w-2/3 text-5xl font-extrabold text-gray-800 text-shadow-2 text-center items-center justify-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-lg"> 
                Your Health, Connected. Find care & Book Online with NexClinic
            </h1>
            <GreenButton className="absolute top-[75%] left-1/2 transform -translate-x-1/2">
                <Link href = "/doctors">Find Doctors Now</Link>
            </GreenButton>
        </div>
        <div title="home-row-2" className="mt-[40px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 justify-center gap-6 px-4 md:px-16 lg:px-16">
            <div className="h-full bg-white flex flex-col shadow-md p-4 rounded-lg dark:bg-gray-400">
                <div className="flex justify-center items-center h-[200px]">
                    <img
                        className="w-1/2 md:w-2/5 lg:w-2/5"
                        src="/images/calendar.png" 
                        alt="image-1"
                    />
                </div>
                <h2 className="text-lg font-semibold text-black dark:text-white">Easy Online Booking</h2>
                <h3 className="text-gray-500 dark:text-gray-300">Schedule Your Appointments with preferred specialists instantly, 24x7</h3>
            </div>
            <div className="h-full bg-white flex flex-col shadow-md p-4 rounded-lg dark:bg-gray-400">
                <div className="flex justify-center items-center h-[200px]">
                    <img
                        className="w-1/2 md:w-2/5 lg:w-2/5"
                        src="/images/stethoscope.png" 
                        alt="image-2"
                    />
                </div>
                <h2 className="text-lg font-semibold text-black dark:text-white">Easy Online Booking</h2>
                <h3 className="text-gray-500 dark:text-gray-300">Schedule Your Appointments with preferred specialists instantly, 24x7</h3>
            </div>
            <div className="h-full bg-white flex flex-col shadow-md p-4 rounded-lg dark:bg-gray-400">
                <div className="flex justify-center items-center h-[200px]">
                    <img
                        className="w-1/2 md:w-2/5 lg:w-2/5"
                        src="/images/shield.png" 
                        alt="image-3"
                    />
                </div>
                <h2 className="text-lg font-semibold text-black dark:text-white">Easy Online Booking</h2>
                <h3 className="text-gray-500 dark:text-gray-300">Schedule Your Appointments with preferred specialists instantly, 24x7</h3>
            </div>
            <div className="h-full bg-white flex flex-col shadow-md p-4 rounded-lg dark:bg-gray-400">
                <div className="flex justify-center items-center h-[200px]">
                    <img
                        className="w-1/2 md:w-2/5 lg:w-2/5"
                        src="/images/calendar.png" 
                        alt="image-4"
                    />
                </div>
                <h2 className="text-lg font-semibold text-black dark:text-white">Easy Online Booking</h2>
                <h3 className="text-gray-500 dark:text-gray-300">Schedule Your Appointments with preferred specialists instantly, 24x7</h3>
            </div>

        </div>
        <div title="home-row-3" className="relative mt-[40px] min-w-full flex flex-col justify-center items-center gap-6 px-4 md:px-16 lg:px-16 ">
            
            <div title="title-news-articles" className="relative h-[50px] ">
                <h2 className="text-3xl font-bold text-black dark:text-white text-center">Latest Health News & Articles</h2>
            </div>
            
            <div title="body-news-articles" className="relative flex flex-col md:flex-row h-auto md:h-[350px] w-full justify-center items-center">
                <button title="main-news" className="relative w-full md:w-1/2 md:h-full rounded-3xl overflow-hidden mb-4 md:mb-0 shadow-lg">
                    <img 
                        className="w-full h-full object-cover "
                        src="/images/doc2.jpg" 
                        alt="main-news" 
                    />
                    <div className="absolute bottom-10  ml-[20px]">
                        <h1 title="top-news" className="text-left text-3xl font-bold text-white">New Treatment for Brain Tumor Discovered</h1>
                        <h3 title="top-news" className="text-left text-sm font-medium text-white">California USA</h3>
                    </div>
                </button>
                <div title="other-news" className="relative flex flex-col h-full w-full md:w-1/2">
                    <div title="news-grid" className="flex flex-col relative justify-between overflow-y-scroll max-h-[400px] md:max-h-none mb-4">
                        <NewsCard/>
                        <NewsCard/>
                        <NewsCard/>
                        <NewsCard/>
                    </div>
                    <GreenButton className="mx-20 text-center">
                        <Link href = "/news-articles">Read More...</Link>
                    </GreenButton>              
                </div>
            </div>

        </div>

        {/* <div title="home-footer" className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="/login"
          >
            Login
          </Link>
        </div> */}
      </main>
    
  );
}