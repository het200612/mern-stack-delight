import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Payroll() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Admin form state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [basicSalary, setBasicSalary] = useState('');
  const [allowances, setAllowances] = useState('');
  const [deductions, setDeductions] = useState('');

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

  // Fetch payroll records
  const { data: payrollRecords } = useQuery({
    queryKey: ['payroll', user?.id, isAdmin, selectedYear],
    queryFn: async () => {
      let query = supabase
        .from('payroll')
        .select(`
          *,
          profiles:user_id (first_name, last_name, employee_id)
        `)
        .eq('year', selectedYear)
        .order('month', { ascending: false });
      
      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }
      
      const { data } = await query;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Add payroll record (admin)
  const addPayroll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('payroll').insert({
        user_id: selectedEmployee,
        month: parseInt(selectedMonth),
        year: selectedYear,
        basic_salary: parseFloat(basicSalary),
        allowances: parseFloat(allowances) || 0,
        deductions: parseFloat(deductions) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Payroll record added');
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Mark as paid (admin)
  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payroll')
        .update({ status: 'paid' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Marked as paid');
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSelectedEmployee('');
    setSelectedMonth((new Date().getMonth() + 1).toString());
    setBasicSalary('');
    setAllowances('');
    setDeductions('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate totals
  const totals = {
    gross: payrollRecords?.reduce((sum, p) => sum + Number(p.basic_salary) + Number(p.allowances || 0), 0) || 0,
    deductions: payrollRecords?.reduce((sum, p) => sum + Number(p.deductions || 0), 0) || 0,
    net: payrollRecords?.reduce((sum, p) => sum + Number(p.net_salary), 0) || 0,
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Payroll</h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'Manage employee salaries and payments' : 'View your salary and payment history'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payroll
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Payroll Record</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Employee</Label>
                      <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees?.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.first_name} {emp.last_name} ({emp.employee_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Month</Label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((month, i) => (
                              <SelectItem key={i} value={(i + 1).toString()}>{month}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input value={selectedYear} disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Basic Salary</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={basicSalary}
                          onChange={(e) => setBasicSalary(e.target.value)}
                          className="pl-10"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Allowances</Label>
                        <div className="relative">
                          <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                          <Input
                            type="number"
                            value={allowances}
                            onChange={(e) => setAllowances(e.target.value)}
                            className="pl-10"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Deductions</Label>
                        <div className="relative">
                          <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                          <Input
                            type="number"
                            value={deductions}
                            onChange={(e) => setDeductions(e.target.value)}
                            className="pl-10"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => addPayroll.mutate()}
                      disabled={!selectedEmployee || !basicSalary || addPayroll.isPending}
                    >
                      Add Record
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {!isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gross ({selectedYear})</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totals.gross)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Deductions</p>
                    <p className="text-2xl font-bold text-destructive mt-1">{formatCurrency(totals.deductions)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Net Pay</p>
                    <p className="text-2xl font-bold text-success mt-1">{formatCurrency(totals.net)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payroll Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Records - {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && <TableHead>Employee</TableHead>}
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Basic Salary</TableHead>
                  <TableHead className="text-right">Allowances</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRecords?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 6} className="text-center py-8 text-muted-foreground">
                      No payroll records found for {selectedYear}
                    </TableCell>
                  </TableRow>
                ) : (
                  payrollRecords?.map((record: any) => (
                    <TableRow key={record.id}>
                      {isAdmin && (
                        <TableCell className="font-medium">
                          {record.profiles?.first_name} {record.profiles?.last_name}
                        </TableCell>
                      )}
                      <TableCell>{MONTHS[record.month - 1]}</TableCell>
                      <TableCell className="text-right">{formatCurrency(record.basic_salary)}</TableCell>
                      <TableCell className="text-right text-success">
                        +{formatCurrency(record.allowances || 0)}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        -{formatCurrency(record.deductions || 0)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(record.net_salary)}
                      </TableCell>
                      <TableCell>
                        {record.status === 'paid' ? (
                          <Badge className="badge-success">
                            <CheckCircle className="w-3 h-3 mr-1" /> Paid
                          </Badge>
                        ) : (
                          <Badge className="badge-warning">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {record.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markAsPaid.mutate(record.id)}
                            >
                              Mark Paid
                            </Button>
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
