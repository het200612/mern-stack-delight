import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths } from 'date-fns';
import { Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Attendance() {
  const { user, isAdmin } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  // Fetch employees for admin
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, employee_id');
      return data || [];
    },
    enabled: isAdmin,
  });

  // Fetch attendance records
  const { data: attendanceRecords } = useQuery({
    queryKey: ['attendance', selectedMonth, selectedEmployee, user?.id, isAdmin],
    queryFn: async () => {
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      
      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles:user_id (first_name, last_name, employee_id)
        `)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });
      
      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      } else if (selectedEmployee) {
        query = query.eq('user_id', selectedEmployee);
      }
      
      const { data } = await query;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="badge-success"><CheckCircle className="w-3 h-3 mr-1" /> Present</Badge>;
      case 'late':
        return <Badge className="badge-warning"><AlertCircle className="w-3 h-3 mr-1" /> Late</Badge>;
      case 'half-day':
        return <Badge className="badge-primary"><Clock className="w-3 h-3 mr-1" /> Half Day</Badge>;
      default:
        return <Badge className="badge-destructive"><XCircle className="w-3 h-3 mr-1" /> Absent</Badge>;
    }
  };

  const previousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const nextMonth = () => {
    const next = new Date(selectedMonth);
    next.setMonth(next.getMonth() + 1);
    if (next <= new Date()) {
      setSelectedMonth(next);
    }
  };

  // Calculate stats
  const stats = {
    present: attendanceRecords?.filter(a => a.status === 'present').length || 0,
    late: attendanceRecords?.filter(a => a.status === 'late').length || 0,
    absent: attendanceRecords?.filter(a => a.status === 'absent').length || 0,
    halfDay: attendanceRecords?.filter(a => a.status === 'half-day').length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'Track and manage employee attendance' : 'View your attendance records'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Select 
                value={selectedEmployee || 'all'} 
                onValueChange={(v) => setSelectedEmployee(v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
              <Button variant="ghost" size="icon" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 font-medium text-foreground min-w-[140px] text-center">
                {format(selectedMonth, 'MMMM yyyy')}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={nextMonth}
                disabled={selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear()}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="stat-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.late}</p>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.halfDay}</p>
                <p className="text-sm text-muted-foreground">Half Day</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {isAdmin && !selectedEmployee && <TableHead>Employee</TableHead>}
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin && !selectedEmployee ? 5 : 4} className="text-center py-8 text-muted-foreground">
                      No attendance records found for this month
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords?.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date), 'EEE, MMM d, yyyy')}
                      </TableCell>
                      {isAdmin && !selectedEmployee && (
                        <TableCell>
                          {record.profiles?.first_name} {record.profiles?.last_name}
                        </TableCell>
                      )}
                      <TableCell>
                        {record.check_in 
                          ? format(new Date(record.check_in), 'hh:mm a')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {record.check_out 
                          ? format(new Date(record.check_out), 'hh:mm a')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
