import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, profile } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        navigate('/dashboard');
      } else if (user && !profile) {
        navigate('/onboarding');
      } else {
        navigate('/auth');
      }
    }
  }, [user, loading, profile, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
          <span className="text-3xl font-bold text-primary-foreground">D</span>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Dayflow...</p>
      </div>
    </div>
  );
};

export default Index;
