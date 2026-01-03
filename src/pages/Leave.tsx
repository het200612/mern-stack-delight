import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Plus, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

type LeaveType = 'paid' | 'sick' | 'unpaid';
type LeaveStatus = 'pending' | 'approved' | 'rejected';

export default function Leave() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminComment, setAdminComment] = useState('');
  
  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>('paid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Fetch leave requests
  const { data: leaveRequests } = useQuery({
    queryKey: ['leaveRequests', user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          profiles:user_id (first_name, last_name, employee_id)
        `)
        .order('created_at', { ascending: false });
      
      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }
      
      const { data } = await query;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Submit leave request
  const submitLeave = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('leave_requests').insert({
        user_id: user?.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Leave request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Update leave status (admin)
  const updateLeaveStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeaveStatus }) => {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status, 
          admin_comment: adminComment,
          reviewed_by: user?.id,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Leave request updated');
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      setSelectedRequest(null);
      setAdminComment('');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setLeaveType('paid');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="badge-success"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="badge-destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="badge-warning"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: LeaveType) => {
    switch (type) {
      case 'paid':
        return <Badge variant="outline" className="border-primary text-primary">Paid Leave</Badge>;
      case 'sick':
        return <Badge variant="outline" className="border-warning text-warning">Sick Leave</Badge>;
      default:
        return <Badge variant="outline" className="border-muted-foreground text-muted-foreground">Unpaid</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {isAdmin ? 'Leave Management' : 'Leave Requests'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'Review and manage leave requests' : 'Apply for and track your leave requests'}
            </p>
          </div>
          
          {!isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Apply for Leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Apply for Leave</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Leave Type</Label>
                    <Select value={leaveType} onValueChange={(v: LeaveType) => setLeaveType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please provide a reason for your leave request..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => submitLeave.mutate()}
                    disabled={!startDate || !endDate || submitLeave.isPending}
                  >
                    Submit Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Leave Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isAdmin ? 'All Leave Requests' : 'My Leave Requests'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && <TableHead>Employee</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 5} className="text-center py-8 text-muted-foreground">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  leaveRequests?.map((request: any) => (
                    <TableRow key={request.id}>
                      {isAdmin && (
                        <TableCell className="font-medium">
                          {request.profiles?.first_name} {request.profiles?.last_name}
                        </TableCell>
                      )}
                      <TableCell>{getLeaveTypeBadge(request.leave_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {differenceInDays(new Date(request.end_date), new Date(request.start_date)) + 1} days
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={request.reason}>
                        {request.reason || '-'}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {request.status === 'pending' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Review Leave Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="bg-muted p-4 rounded-lg space-y-2">
                                    <p><strong>Employee:</strong> {request.profiles?.first_name} {request.profiles?.last_name}</p>
                                    <p><strong>Type:</strong> {request.leave_type}</p>
                                    <p><strong>Duration:</strong> {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}</p>
                                    <p><strong>Days:</strong> {differenceInDays(new Date(request.end_date), new Date(request.start_date)) + 1}</p>
                                    <p><strong>Reason:</strong> {request.reason || 'Not provided'}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Comment (Optional)</Label>
                                    <Textarea
                                      value={adminComment}
                                      onChange={(e) => setAdminComment(e.target.value)}
                                      placeholder="Add a comment..."
                                      rows={2}
                                    />
                                  </div>
                                </div>
                                <DialogFooter className="gap-2">
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => updateLeaveStatus.mutate({ id: request.id, status: 'rejected' })}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button 
                                    className="bg-success hover:bg-success/90"
                                    onClick={() => updateLeaveStatus.mutate({ id: request.id, status: 'approved' })}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          {request.status !== 'pending' && request.admin_comment && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MessageSquare className="w-4 h-4" />
                              <span className="truncate max-w-[100px]" title={request.admin_comment}>
                                {request.admin_comment}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      )}
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
