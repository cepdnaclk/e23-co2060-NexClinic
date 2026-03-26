"use client";

import DoctorLoginForm from '@/components/doctor/DoctorLoginForm';

function DoctorLogin() {
    return (
        <div className="relative flex flex-col w-screen h-screen items-center">
            <div title="row-1" className="relative gap-6 mt-8 h-full w-screen">
                <img
                    className="absolute opacity-80 object-cover h-full w-full"
                    src="/images/doctor-login-bg.png"
                    alt="background"
                />
                <div className="absolute w-full mt-[200px] flex flex-col items-center justify-center gap-6">
                    <h1 className="mb-[10px] text-3xl font-extrabold text-white dark:text-gray-700 text-shadow-2 text-center sm:text-center sm:text-5xl ">
                        Login Here
                    </h1>
                    <div className="justify-center items-center">
                        <DoctorLoginForm />
                    </div>
                </div>
            </div>

        </div>
    );


}

export default DoctorLogin;
