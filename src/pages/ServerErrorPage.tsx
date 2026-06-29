import { AlertTriangle, RefreshCw, Home, MailOpen } from 'lucide-react';

export default function ServerErrorPage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleContactSupport = () => {
    window.open('mailto:support@agunnaya.labs?subject=Server Error Report', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full"></div>
            <div className="relative flex items-center justify-center w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full">
              <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 mb-2">
          500
        </h1>
        <p className="text-gray-400 text-sm tracking-widest uppercase mb-6">
          Server Error
        </p>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-3">
            Something went wrong on our end
          </h2>
          <p className="text-gray-400">
            We're experiencing technical difficulties. Our team has been notified and is working to fix it.
          </p>
        </div>

        {/* Status Info */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4 mb-6">
          <p className="text-xs text-yellow-400/70 mb-2">
            <span className="font-semibold">What happened?</span> Our servers encountered an unexpected error while processing your request.
          </p>
          <p className="text-xs text-gray-400">
            Error Reference: <span className="font-mono text-purple-400">{Math.random().toString(36).slice(2, 11).toUpperCase()}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-lg transition-all duration-300 font-semibold"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>

          <button
            onClick={handleContactSupport}
            className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-lg transition-colors font-semibold"
          >
            <MailOpen className="w-5 h-5" />
            Contact Support
          </button>
        </div>

        {/* Additional Help */}
        <div className="text-xs text-gray-500">
          <p>If this problem persists, please reach out to our support team.</p>
        </div>
      </div>
    </div>
  );
}
