import BlackButton from "../buttons/BlackButton";

function UserLoginForm() {

    return (
        <div className="flex flex-col w-[300px] gap-4 p-6 bg-white items-center justify-center rounded-xl shadow-md">
            <div title="login-card-header" className="mb-4 items-center dark:text-gray-900 text-2xl font-bold">
                <p>Welcome Back!</p>
            </div>
            <form title="login-card-form" className="flex flex-col gap-4 mb-4 rounded-lg w-full">
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="username"
                    type="text"
                    placeholder="Username: Enter your email"
                />
                <input
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="password"
                    type="password"
                    placeholder="Password"
                />
            </form>
            <BlackButton className="w-full py-2 px-4 rounded-lg hover:bg-gray-800 focus:outline-none focus:shadow-outline">
                <span className="text-white font-bold">Login</span>
            </BlackButton>
            <div title="login-card-footer" className="mt-4 text-sm">
                <p>Don't have an account? <a href="/register" className="text-green-500 hover:underline">Sign up here</a></p>
            </div>
        </div>
    );
}


export default UserLoginForm;