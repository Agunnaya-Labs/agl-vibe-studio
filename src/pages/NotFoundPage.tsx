import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  const goHome = () => window.location.href = '/';
  const goBack = () => window.history.back();
  const goExplore = () => window.location.href = '/explore';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated 404 Text */}
        <div className="mb-8">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
            404
          </h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase">
            Page Not Found
          </p>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-3">
            Oops! We can't find this page
          </h2>
          <p className="text-gray-400">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <button
            onClick={goHome}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-lg transition-all duration-300 font-semibold"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>
          
          <button
            onClick={goBack}
            className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          <button
            onClick={goExplore}
            className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
          >
            <Search className="w-5 h-5" />
            Explore More
          </button>
        </div>

        {/* Support Message */}
        <div className="bg-slate-800/30 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4">
          <p className="text-xs text-gray-400">
            Having trouble? Contact our support team or try searching for what you need.
          </p>
        </div>
      </div>
    </div>
  );
}
