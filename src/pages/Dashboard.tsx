import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function Dashboard() {
  const { isAdmin, profile, user } = useAuth();

  // Fetch today's attendance
  const { data: todayAttendance } = useQuery({
    queryKey: ['todayAttendance', user?.id],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', today)
        .single();
      return data;
    },
    enabled: !!user?.id && !isAdmin,
  });

  // Fetch pending leave requests count
  const { data: pendingLeaves } = useQuery({
    queryKey: ['pendingLeaves', isAdmin, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('leave_requests')
        .select('*', { count: 'exact' })
        .eq('status', 'pending');
      
      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }
      
      const { count } = await query;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Admin: Fetch employee count
  const { data: employeeCount } = useQuery({
    queryKey: ['employeeCount'],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });
      return count || 0;
    },
    enabled: isAdmin,
  });

  // Admin: Fetch today's attendance stats
  const { data: attendanceStats } = useQuery({
    queryKey: ['attendanceStats'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today);
      
      const present = data?.filter(a => a.status === 'present').length || 0;
      const absent = data?.filter(a => a.status === 'absent').length || 0;
      const late = data?.filter(a => a.status === 'late').length || 0;
      
      return { present, absent, late, total: data?.length || 0 };
    },
    enabled: isAdmin,
  });

  const checkIn = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = new Date().toISOString();
    
    await supabase.from('attendance').upsert({
      user_id: user?.id,
      date: today,
      check_in: now,
      status: 'present',
    });
    
    window.location.reload();
  };

  const checkOut = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = new Date().toISOString();
    
    await supabase.from('attendance').update({
      check_out: now,
    }).eq('user_id', user?.id).eq('date', today);
    
    window.location.reload();
  };

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {profile?.first_name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening in your organization today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Employees</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{employeeCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Present Today</p>
                    <p className="text-3xl font-bold text-success mt-1">{attendanceStats?.present || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Leaves</p>
                    <p className="text-3xl font-bold text-warning mt-1">{pendingLeaves}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Late Arrivals</p>
                    <p className="text-3xl font-bold text-destructive mt-1">{attendanceStats?.late || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Pending Leave Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/leave">
                  <Button variant="outline" className="w-full group">
                    View & Manage Requests
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Employee Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link to="/employees">
                  <Button variant="outline" className="w-full group">
                    View All Employees
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Employee Dashboard
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {profile?.first_name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Check In/Out Card */}
          <Card className="stat-card col-span-1 md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Attendance</p>
                  <p className="text-xl font-semibold text-foreground mt-1">
                    {todayAttendance?.check_in 
                      ? `Checked in at ${format(new Date(todayAttendance.check_in), 'hh:mm a')}`
                      : 'Not checked in yet'
                    }
                  </p>
                  {todayAttendance?.check_out && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Checked out at {format(new Date(todayAttendance.check_out), 'hh:mm a')}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  {!todayAttendance?.check_in ? (
                    <Button onClick={checkIn} className="bg-success hover:bg-success/90">
                      <Clock className="w-4 h-4 mr-2" />
                      Check In
                    </Button>
                  ) : !todayAttendance?.check_out ? (
                    <Button onClick={checkOut} variant="outline">
                      <Clock className="w-4 h-4 mr-2" />
                      Check Out
                    </Button>
                  ) : (
                    <Badge className="badge-success">Completed</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Balance */}
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Leaves</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{pendingLeaves}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Status */}
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-xl font-semibold text-foreground mt-1 capitalize">
                    {todayAttendance?.status || 'Absent'}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  todayAttendance?.status === 'present' 
                    ? 'bg-success/10' 
                    : todayAttendance?.status === 'late'
                    ? 'bg-warning/10'
                    : 'bg-destructive/10'
                }`}>
                  {todayAttendance?.status === 'present' ? (
                    <CheckCircle className="w-6 h-6 text-success" />
                  ) : todayAttendance?.status === 'late' ? (
                    <AlertCircle className="w-6 h-6 text-warning" />
                  ) : (
                    <XCircle className="w-6 h-6 text-destructive" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/profile">
            <Card className="stat-card h-full hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">My Profile</p>
                  <p className="text-sm text-muted-foreground">View & edit your details</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/leave">
            <Card className="stat-card h-full hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Leave Requests</p>
                  <p className="text-sm text-muted-foreground">Apply for time off</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/payroll">
            <Card className="stat-card h-full hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Payroll</p>
                  <p className="text-sm text-muted-foreground">View salary details</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
