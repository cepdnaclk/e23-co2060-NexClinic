"use client";

function HospitalContactPage() {
    return (
        <div className="relative flex flex-col w-screen h-screen items-center">
            <div title="row-1" className="relative gap-6 mt-8 h-full w-screen">
                <img
                    className="absolute opacity-80 object-cover h-full w-full"
                    src="/images/main-bg.jpg"
                    alt="background"
                />
                <div className="absolute w-full mt-[200px] flex flex-col items-center justify-center gap-6">
                    <h1 className="mb-[10px] text-3xl font-extrabold text-white dark:text-gray-700 text-shadow-2 text-center sm:text-center sm:text-5xl ">
                        Contact Us to Register Your Hospital
                    </h1>
                    <div className="flex flex-col items-center gap-4 bg-white bg-opacity-90 rounded-xl shadow-md p-8">
                        <p className="text-lg text-gray-700 text-center max-w-md">
                            Hospital registrations are handled manually by our team. Please contact us using the details below to get your hospital registered on NexClinic.
                        </p>
                        <div className="text-md text-gray-800 text-center">
                            <p><span className="font-semibold">Email:</span> support@nexclinic.com</p>
                            <p><span className="font-semibold">Phone:</span> +94 11 123 4567</p>
                            <p><span className="font-semibold">Address:</span> 123 Main Street, Colombo, Sri Lanka</p>
                        </div>
                        <a href="mailto:support@nexclinic.com" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                            Email Us
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HospitalContactPage;