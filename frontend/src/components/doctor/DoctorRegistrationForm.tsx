import BlackButton from "../buttons/BlackButton";

function DoctorRegistrationForm() {

    return (
        <div className="flex flex-col w-[300px] gap-4 p-6 bg-white items-center justify-center rounded-xl shadow-md">
            <div title="registration-card-header" className="mb-4 items-center dark:text-gray-900 text-2xl font-bold">
                <p>Welcome!</p>
            </div>
            <form title="registration-card-form" className="flex flex-col gap-4 mb-4 rounded-lg w-full">

                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="Fullname"
                    type="text"
                    placeholder="Full Name"
                />

                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="NIC"
                    type="text"
                    placeholder="National Identity Card Number"
                />

                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="SLMC ID"
                    type="text"
                    placeholder="Sri Lanka Medical Council ID"
                />
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="Email"
                    type="text"
                    placeholder="E-mail"
                />
                <input
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="create password"
                    type="password"
                    placeholder="Password"
                />
                <input
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="confirm password"
                    type="password"
                    placeholder="Confirm Password"
                />
            </form>
            <BlackButton className="w-full py-2 px-4 rounded-lg hover:bg-gray-800 focus:outline-none focus:shadow-outline">
                <span className="text-white font-bold">Create Account</span>
            </BlackButton>
            <div title="registration-card-footer" className="mt-4 text-sm  dark:text-gray-900">
                <p>Already have an account? <a href="/doctor/login" className="text-green-500 hover:underline">Login here</a></p>
            </div>
        </div>
    );
}


export default DoctorRegistrationForm;