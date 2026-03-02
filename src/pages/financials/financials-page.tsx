import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, CurrencyDollar, TrendUp, TrendDown, Receipt } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import { InDepthFinancialAnalysis } from '@/components/financials/in-depth-financial-analysis'
import type { Budget, Expense, Invoice } from '@/lib/types'

export function FinancialsPage() {
  const { projectId } = useParams()
  const [budgets, setBudgets] = useKV<Budget[]>(`budgets-${projectId}`, [])
  const [expenses, setExpenses] = useKV<Expense[]>(`expenses-${projectId}`, [])
  const [invoices, setInvoices] = useKV<Invoice[]>(`invoices-${projectId}`, [])
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: '',
    vendor: '',
    description: '',
    status: 'pending' as Expense['status'],
  })

  const totalBudget = budgets?.reduce((sum, b) => sum + b.budgetedAmount, 0) || 0
  const totalActual = budgets?.reduce((sum, b) => sum + b.actualAmount, 0) || 0
  const totalCommitted = budgets?.reduce((sum, b) => sum + b.committedAmount, 0) || 0
  const variance = totalBudget - totalActual
  const variancePercent = totalBudget > 0 ? ((variance / totalBudget) * 100).toFixed(1) : '0'

  const pendingExpenses = expenses?.filter(e => e.status === 'pending').length || 0
  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0

  const handleCreateExpense = () => {
    if (!expenseForm.amount || !expenseForm.category || !expenseForm.description) {
      toast.error('Please fill in required fields')
      return
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
      submittedBy: 'Current User',
      createdAt: new Date().toISOString(),
    }

    setExpenses(current => [...(current || []), newExpense])
    setIsExpenseDialogOpen(false)
    setExpenseForm({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      category: '',
      vendor: '',
      description: '',
      status: 'pending',
    })
    toast.success('Expense created successfully')
  }

  const getStatusBadge = (status: Expense['status']) => {
    const variants: Record<Expense['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive',
      paid: 'secondary',
    }
    return variants[status]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-blue-50">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Financials</h2>
            <p className="text-muted-foreground">Budget tracking and expense management</p>
          </div>
        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Expense</DialogTitle>
              <DialogDescription>Record a new project expense</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expense-date">Date *</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense-amount">Amount *</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expense-category">Category *</Label>
                  <Input
                    id="expense-category"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    placeholder="e.g., Materials, Labor"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expense-vendor">Vendor</Label>
                  <Input
                    id="expense-vendor"
                    value={expenseForm.vendor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                    placeholder="Vendor name"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expense-description">Description *</Label>
                <Textarea
                  id="expense-description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Expense details"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expense-status">Status</Label>
                <Select value={expenseForm.status} onValueChange={(value: Expense['status']) => setExpenseForm({ ...expenseForm, status: value })}>
                  <SelectTrigger id="expense-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateExpense}>Create Expense</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <CurrencyDollar size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Committed: ${totalCommitted.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Costs</CardTitle>
            <Receipt size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalActual.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((totalActual / (totalBudget || 1)) * 100).toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
            {variance >= 0 ? <TrendUp size={20} className="text-accent" /> : <TrendDown size={20} className="text-destructive" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${variance >= 0 ? 'text-accent' : 'text-destructive'}`}>
              ${Math.abs(variance).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {variance >= 0 ? 'Under' : 'Over'} budget by {variancePercent}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <Receipt size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="analysis">Financial Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InDepthFinancialAnalysis />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Log</CardTitle>
              <CardDescription>Track all project expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {!expenses || expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No expenses recorded</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start tracking project expenses
                  </p>
                  <Button onClick={() => setIsExpenseDialogOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Add Expense
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category}</Badge>
                        </TableCell>
                        <TableCell>{expense.vendor || '-'}</TableCell>
                        <TableCell className="font-mono">${expense.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(expense.status)}>{expense.status}</Badge>
                        </TableCell>
                        <TableCell>{expense.submittedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>Budget vs actual by cost code</CardDescription>
            </CardHeader>
            <CardContent>
              {!budgets || budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CurrencyDollar size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No budget defined</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up cost code budgets for this project
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cost Code</TableHead>
                      <TableHead>Budgeted</TableHead>
                      <TableHead>Committed</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>% Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map((budget) => {
                      const variance = budget.budgetedAmount - budget.actualAmount
                      const percentUsed = ((budget.actualAmount / budget.budgetedAmount) * 100).toFixed(1)
                      return (
                        <TableRow key={budget.id}>
                          <TableCell className="font-medium">{budget.costCodeId}</TableCell>
                          <TableCell className="font-mono">${budget.budgetedAmount.toLocaleString()}</TableCell>
                          <TableCell className="font-mono">${budget.committedAmount.toLocaleString()}</TableCell>
                          <TableCell className="font-mono">${budget.actualAmount.toLocaleString()}</TableCell>
                          <TableCell className={`font-mono ${variance >= 0 ? 'text-accent' : 'text-destructive'}`}>
                            ${Math.abs(variance).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    parseFloat(percentUsed) > 100 ? 'bg-destructive' : 'bg-primary'
                                  }`}
                                  style={{ width: `${Math.min(parseFloat(percentUsed), 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-mono whitespace-nowrap">{percentUsed}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Client billing and payment tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {!invoices || invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No invoices</h3>
                  <p className="text-sm text-muted-foreground">
                    Client invoices will appear here
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono">${invoice.amount.toLocaleString()}</TableCell>
                        <TableCell className="font-mono">${invoice.paidAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'paid' ? 'secondary' : 'outline'}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
