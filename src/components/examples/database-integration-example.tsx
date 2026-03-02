import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Pencil } from '@phosphor-icons/react';
import { useRFIs, useEquipment, useCostCodes, useDashboardCounts } from '@/hooks/use-database';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function DatabaseIntegrationExample() {
  const { projectId } = useParams();
  const [rfiDialogOpen, setRfiDialogOpen] = useState(false);
  const [newRfiSubject, setNewRfiSubject] = useState('');
  const [newRfiQuestion, setNewRfiQuestion] = useState('');

  const { counts, loading: countsLoading } = useDashboardCounts(projectId);
  const { rfis, loading: rfisLoading, createRFI, deleteRFI } = useRFIs(projectId);
  const { equipment, loading: equipmentLoading } = useEquipment(projectId);
  const { costCodes, loading: costCodesLoading } = useCostCodes(projectId);

  const handleCreateRFI = async () => {
    if (!newRfiSubject.trim() || !newRfiQuestion.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const result = await createRFI({
      subject: newRfiSubject,
      question: newRfiQuestion,
      status: 'open',
      priority: 'medium',
    });

    if (result.success) {
      toast.success('RFI created successfully');
      setNewRfiSubject('');
      setNewRfiQuestion('');
      setRfiDialogOpen(false);
    } else {
      toast.error(result.error || 'Failed to create RFI');
    }
  };

  const handleDeleteRFI = async (id: string) => {
    if (!confirm('Are you sure you want to delete this RFI?')) return;

    const result = await deleteRFI(id);
    if (result.success) {
      toast.success('RFI deleted successfully');
    } else {
      toast.error(result.error || 'Failed to delete RFI');
    }
  };

  if (!projectId) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No project selected</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Database Integration Example</h2>
        <p className="text-muted-foreground">
          Demonstrating real SQLite CRUD operations via IPC
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total RFIs</CardTitle>
          </CardHeader>
          <CardContent>
            {countsLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">--</div>
            ) : (
              <div className="text-2xl font-bold">{counts.rfi_count}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            {countsLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">--</div>
            ) : (
              <div className="text-2xl font-bold">{counts.equipment_count}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cost Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {countsLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">--</div>
            ) : (
              <div className="text-2xl font-bold">{counts.cost_code_count}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Budget vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            {countsLoading ? (
              <div className="text-sm text-muted-foreground">--</div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm">
                  Budget: <span className="font-semibold">${counts.total_budget.toFixed(2)}</span>
                </div>
                <div className="text-sm">
                  Actual: <span className="font-semibold">${counts.total_actual.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>RFIs</CardTitle>
            <CardDescription>Request for Information tracking</CardDescription>
          </div>
          <Dialog open={rfiDialogOpen} onOpenChange={setRfiDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" />
                New RFI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New RFI</DialogTitle>
                <DialogDescription>
                  RFI number will be auto-assigned based on project sequence
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newRfiSubject}
                    onChange={(e) => setNewRfiSubject(e.target.value)}
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={newRfiQuestion}
                    onChange={(e) => setNewRfiQuestion(e.target.value)}
                    placeholder="Detailed question or clarification needed"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRfiDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRFI}>Create RFI</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {rfisLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading RFIs...</div>
          ) : rfis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No RFIs yet. Click "New RFI" to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {rfis.map((rfi) => (
                <div
                  key={rfi.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        RFI-{String(rfi.rfi_number).padStart(3, '0')}
                      </span>
                      <span className="font-semibold">{rfi.subject}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {rfi.question}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRFI(rfi.id)}
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equipment</CardTitle>
            <CardDescription>Equipment registry</CardDescription>
          </CardHeader>
          <CardContent>
            {equipmentLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading equipment...</div>
            ) : equipment.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No equipment registered yet.
              </div>
            ) : (
              <div className="space-y-2">
                {equipment.map((item) => (
                  <div key={item.id} className="p-3 border rounded">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Type: {item.type} • Status: {item.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Codes</CardTitle>
            <CardDescription>Budget tracking codes</CardDescription>
          </CardHeader>
          <CardContent>
            {costCodesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading cost codes...</div>
            ) : costCodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No cost codes defined yet.
              </div>
            ) : (
              <div className="space-y-2">
                {costCodes.map((code) => (
                  <div key={code.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold">{code.code}</span>
                      <span className="text-sm">
                        ${code.actual_amount.toFixed(2)} / ${code.budget_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">{code.description}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
