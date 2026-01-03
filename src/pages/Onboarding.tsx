import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (profile) {
        navigate('/dashboard');
      }
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
          <span className="text-3xl font-bold text-primary-foreground">D</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Complete Your Profile
        </h1>
        <p className="text-muted-foreground">
          Please complete the signup process with your details.
        </p>
      </div>
    </div>
  );
}
