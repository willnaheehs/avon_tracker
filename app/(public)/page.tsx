import Link from "next/link";

export default function HomePage() {
  return (
    <div className="h-screen w-screen bg-[#9DCFF5] flex flex-col overflow-hidden">
      <div className="flex justify-center pt-16 pb-8">
        <img
          src="/2way-logo.png"
          alt="2W Lacrosse Logo"
          className="w-80 h-80 rounded-full object-cover"
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-32">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10">
          <h1 className="text-4xl font-bold text-center mb-10 text-gray-900">Recruiting Portal</h1>

          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full rounded-lg bg-black px-6 py-4 text-white font-medium text-center hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="block w-full rounded-lg border-2 border-black px-6 py-4 text-black font-medium text-center hover:bg-gray-50 transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
