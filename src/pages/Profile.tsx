import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building2, 
  Calendar,
  Pencil,
  Save,
  X
} from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { profile, isAdmin, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    phone: profile?.phone || '',
    address: profile?.address || '',
    department: profile?.department || '',
    position: profile?.position || '',
  });

  const handleSave = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', profile?.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
      await refreshProfile();
      setEditing(false);
    }
    
    setLoading(false);
  };

  const getInitials = () => {
    if (!profile) return 'U';
    return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-1">View and manage your profile information</p>
          </div>
          {!editing ? (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6 text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-foreground">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-muted-foreground">{profile?.position || 'Employee'}</p>
              <Badge className="mt-3 badge-primary">
                {isAdmin ? 'Admin / HR' : 'Employee'}
              </Badge>
              
              <div className="mt-6 pt-6 border-t border-border space-y-3 text-left">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{profile?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm">{profile?.employee_id}</span>
                </div>
                {profile?.hire_date && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Joined {format(new Date(profile.hire_date), 'MMM yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{profile?.first_name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{profile?.last_name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{profile?.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  {editing ? (
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10 input-focus"
                        placeholder="Enter phone number"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{profile?.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  {editing && isAdmin ? (
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="pl-10 input-focus"
                        placeholder="Enter department"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{profile?.department || 'Not assigned'}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  {editing && isAdmin ? (
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="pl-10 input-focus"
                        placeholder="Enter position"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span>{profile?.position || 'Not assigned'}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Address</Label>
                {editing ? (
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-focus"
                    placeholder="Enter your address"
                    rows={3}
                  />
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{profile?.address || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
