import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#090a0f] text-zinc-100 p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-6">
        <FileQuestion className="w-8 h-8 text-zinc-500" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 font-mono">404</h1>
      <h2 className="text-lg font-semibold text-zinc-200 mb-2">Page Not Found</h2>
      <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
        The route you are looking for does not exist or may have been moved.
      </p>
      <Link to="/dashboard">
        <Button size="sm" leftIcon={<ArrowLeft className="w-4 h-4 mr-1" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}

