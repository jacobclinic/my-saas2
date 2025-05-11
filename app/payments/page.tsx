"use client";

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Download, Eye, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { InvoiceView } from '@/components/payments/invoice-view';

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const payments = [
    {
      id: '1',
      classTitle: 'Physics 2026 A/L Group 2',
      date: 'May 10, 2025',
      amount: 15000,
      students: 3,
      status: 'pending'
    },
    {
      id: '2',
      classTitle: 'Physics 2027 A/L Group 1',
      date: 'May 09, 2025',
      amount: 0,
      students: 0,
      status: 'pending'
    },
    {
      id: '3',
      classTitle: 'Physics 2026 A/L Group 1',
      date: 'May 08, 2025',
      amount: 0,
      students: 0,
      status: 'pending'
    }
  ];

  const filteredPayments = payments.filter(p => {
    if (searchTerm && !p.classTitle.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (monthFilter !== 'All' && !p.date.includes(monthFilter)) {
      return false;
    }
    if (statusFilter !== 'All' && p.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const totalEarnings = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Mock statistics data
  const stats = {
    monthlyEarnings: 15000,
    previousMonth: 12000,
    monthlyGrowth: 25,
    activeStudents: 3,
    averagePerStudent: 5000,
    pendingPayments: 2
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Payments">
        <Button className="bg-primary-blue-600 hover:bg-primary-blue-700 text-white">
          <Download size={16} className="mr-2" />
          Download Report
        </Button>
      </Header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Monthly Earnings</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                Rs. {stats.monthlyEarnings.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-blue-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats.monthlyGrowth > 0 ? (
              <Badge className="bg-success-light text-success-dark">
                <ArrowUpRight size={14} className="mr-1" />
                {stats.monthlyGrowth}% up
              </Badge>
            ) : (
              <Badge className="bg-error-light text-error-dark">
                <ArrowDownRight size={14} className="mr-1" />
                {Math.abs(stats.monthlyGrowth)}% down
              </Badge>
            )}
            <span className="text-sm text-neutral-500 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Active Students</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.activeStudents}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-orange-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-neutral-600">
              Avg. Rs. {stats.averagePerStudent.toLocaleString()} per student
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Pending Payments</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {stats.pendingPayments}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-warning-light flex items-center justify-center">
              <Calendar className="h-6 w-6 text-warning-dark" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-neutral-600">
              Due this month
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <Input
            placeholder="Search by class name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
          <div className="flex items-center gap-2 min-w-[150px]">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Months</SelectItem>
                <SelectItem value="May">May 2025</SelectItem>
                <SelectItem value="June">June 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 min-w-[100px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.classTitle}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{payment.students}</TableCell>
                  <TableCell>Rs. {payment.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={payment.status === 'paid' 
                        ? 'bg-success-light text-success-dark' 
                        : 'bg-warning-light text-warning-dark'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary-blue-200 text-primary-blue-700 hover:bg-primary-blue-50"
                      onClick={() => setSelectedInvoice(payment)}
                    >
                      <Eye size={16} className="mr-2" />
                      View Invoice
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-neutral-600">
                    <p>No payments found matching your filters.</p>
                    <Button 
                      variant="link" 
                      className="mt-2 text-primary-blue-600"
                      onClick={() => {
                        setSearchTerm('');
                        setMonthFilter('All');
                        setStatusFilter('All');
                      }}
                    >
                      Clear all filters
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceView
          open={!!selectedInvoice}
          onOpenChange={(open) => !open && setSelectedInvoice(null)}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
}