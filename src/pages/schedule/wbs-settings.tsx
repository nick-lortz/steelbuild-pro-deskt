import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash, ArrowsClockwise, Check, X, Code, ListNumbers } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useKV } from '@github/spark/hooks';
import { toast } from 'sonner';
import type { WBSCodeStructure, WBSLevel, WBSTemplate } from '@/types/wbs';
import { DEFAULT_WBS_TEMPLATES } from '@/types/wbs';
import { createWBSGenerator } from '@/lib/wbs-utils';

export function WBSSettingsPage() {
  const { projectId } = useParams();
  const [wbsStructure, setWbsStructure] = useKV<WBSCodeStructure | null>(
    `wbs-structure-${projectId}`,
    null
  );
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<number | null>(null);

  const handleApplyTemplate = (template: WBSTemplate) => {
    const newStructure: WBSCodeStructure = {
      ...template.structure,
      id: crypto.randomUUID(),
      projectId: projectId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWbsStructure(newStructure);
    setIsTemplateDialogOpen(false);
    toast.success(`Applied template: ${template.name}`);
  };

  const handleCreateCustom = () => {
    const newStructure: WBSCodeStructure = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      name: 'Custom WBS Structure',
      description: 'Custom work breakdown structure',
      levels: [
        {
          level: 1,
          name: 'Phase',
          type: 'numeric',
          maxLength: 2,
        },
      ],
      separator: '.',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWbsStructure(newStructure);
    toast.success('Created custom WBS structure');
  };

  const handleAddLevel = () => {
    if (!wbsStructure) return;

    const newLevel: WBSLevel = {
      level: wbsStructure.levels.length + 1,
      name: `Level ${wbsStructure.levels.length + 1}`,
      type: 'numeric',
      maxLength: 2,
    };

    setWbsStructure({
      ...wbsStructure,
      levels: [...wbsStructure.levels, newLevel],
      updatedAt: new Date().toISOString(),
    });

    toast.success('Added new level');
  };

  const handleRemoveLevel = (level: number) => {
    if (!wbsStructure || wbsStructure.levels.length <= 1) {
      toast.error('Must have at least one level');
      return;
    }

    setWbsStructure({
      ...wbsStructure,
      levels: wbsStructure.levels
        .filter(l => l.level !== level)
        .map((l, index) => ({ ...l, level: index + 1 })),
      updatedAt: new Date().toISOString(),
    });

    toast.success('Removed level');
  };

  const handleUpdateLevel = (level: number, updates: Partial<WBSLevel>) => {
    if (!wbsStructure) return;

    setWbsStructure({
      ...wbsStructure,
      levels: wbsStructure.levels.map(l =>
        l.level === level ? { ...l, ...updates } : l
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateStructure = (updates: Partial<WBSCodeStructure>) => {
    if (!wbsStructure) return;

    setWbsStructure({
      ...wbsStructure,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleTestCode = () => {
    if (!wbsStructure) return;

    try {
      const generator = createWBSGenerator(wbsStructure);
      const testSegments = wbsStructure.levels.map((_, index) => index + 1);
      const testCode = generator.generateCode(testSegments);
      
      toast.success(`Test code generated: ${testCode}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate test code');
    }
  };

  if (!wbsStructure) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">WBS Code Structure</h1>
          <p className="text-muted-foreground">
            Configure a Work Breakdown Structure (WBS) coding system for hierarchical task organization
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Code className="w-8 h-8 text-accent" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No WBS Structure Configured</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Choose from industry-standard templates or create a custom structure to organize your project tasks
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <ListNumbers className="mr-2" />
                    Choose Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Choose WBS Template</DialogTitle>
                    <DialogDescription>
                      Select an industry-standard template to get started quickly
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {DEFAULT_WBS_TEMPLATES.map(template => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-accent transition-colors"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <CardDescription>{template.description}</CardDescription>
                            </div>
                            <Badge variant="outline">{template.industry}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Structure:</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                              {template.structure.levels.map((level, index) => (
                                <span key={level.level}>
                                  {index > 0 && <span className="mx-1">{template.structure.separator}</span>}
                                  <span className="text-foreground">{level.name}</span>
                                  <span className="text-muted-foreground">
                                    ({level.type === 'numeric' ? '##' : level.type === 'alpha-upper' ? 'AA' : 'aa'})
                                  </span>
                                </span>
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Example: {template.structure.levels.map((level, index) => {
                                const example = level.type === 'numeric' ? '01' 
                                  : level.type === 'alpha-upper' ? 'A'
                                  : 'a';
                                return (index > 0 ? template.structure.separator : '') + (level.prefix || '') + example + (level.suffix || '');
                              }).join('')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="lg" variant="outline" onClick={handleCreateCustom}>
                <Plus className="mr-2" />
                Create Custom
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">WBS Code Structure</h1>
          <p className="text-muted-foreground">
            Configure hierarchical task coding for {wbsStructure.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTestCode}>
            <Code className="mr-2" />
            Test Code
          </Button>
          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
            <ArrowsClockwise className="mr-2" />
            Load Template
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Structure Configuration</CardTitle>
            <CardDescription>
              Define the levels and format of your WBS codes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="structure-name">Structure Name</Label>
                <Input
                  id="structure-name"
                  value={wbsStructure.name}
                  onChange={e => handleUpdateStructure({ name: e.target.value })}
                  placeholder="e.g., Steel Fabrication WBS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="separator">Separator</Label>
                <Input
                  id="separator"
                  value={wbsStructure.separator}
                  onChange={e => handleUpdateStructure({ separator: e.target.value })}
                  placeholder="e.g., . or -"
                  maxLength={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={wbsStructure.description || ''}
                onChange={e => handleUpdateStructure({ description: e.target.value })}
                placeholder="Brief description of this WBS structure"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Levels ({wbsStructure.levels.length})</Label>
                <Button size="sm" variant="outline" onClick={handleAddLevel}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Level
                </Button>
              </div>

              <div className="space-y-3">
                {wbsStructure.levels.map((level, index) => (
                  <Card key={level.level} className="border-muted">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Level {level.level}</Badge>
                            <span className="text-sm font-medium">{level.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingLevel === level.level ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingLevel(null)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingLevel(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingLevel(level.level)}
                              >
                                Edit
                              </Button>
                            )}
                            {wbsStructure.levels.length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveLevel(level.level)}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {editingLevel === level.level && (
                          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                            <div className="space-y-2">
                              <Label>Level Name</Label>
                              <Input
                                value={level.name}
                                onChange={e =>
                                  handleUpdateLevel(level.level, { name: e.target.value })
                                }
                                placeholder="e.g., Phase, Area, Sequence"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Format Type</Label>
                              <Select
                                value={level.type}
                                onValueChange={value =>
                                  handleUpdateLevel(level.level, { type: value as WBSLevel['type'] })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="numeric">Numeric (1, 2, 3...)</SelectItem>
                                  <SelectItem value="alpha-upper">Alpha Upper (A, B, C...)</SelectItem>
                                  <SelectItem value="alpha-lower">Alpha Lower (a, b, c...)</SelectItem>
                                  <SelectItem value="custom">Custom Values</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Max Length</Label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={level.maxLength}
                                onChange={e =>
                                  handleUpdateLevel(level.level, {
                                    maxLength: parseInt(e.target.value, 10),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Prefix (Optional)</Label>
                              <Input
                                value={level.prefix || ''}
                                onChange={e =>
                                  handleUpdateLevel(level.level, { prefix: e.target.value || undefined })
                                }
                                placeholder="e.g., L, S"
                                maxLength={3}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <span>Format:</span>
                          <Badge variant="secondary">
                            {level.prefix || ''}
                            {level.type === 'numeric' ? '##' : level.type === 'alpha-upper' ? 'AA' : 'aa'}
                            {level.suffix || ''}
                          </Badge>
                          <span>Example:</span>
                          <Badge variant="outline">
                            {level.prefix || ''}
                            {level.type === 'numeric' ? '01' : level.type === 'alpha-upper' ? 'A' : 'a'}
                            {level.suffix || ''}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Example WBS codes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Sample Hierarchy</div>
                  {[1, 2, 3].map(first => (
                    <div key={first} className="space-y-1">
                      <div className="font-mono text-sm text-foreground">
                        {(() => {
                          try {
                            const generator = createWBSGenerator(wbsStructure);
                            return generator.generateCode([first]);
                          } catch {
                            return `${first}`;
                          }
                        })()}
                      </div>
                      {wbsStructure.levels.length > 1 && [1, 2].map(second => (
                        <div key={`${first}-${second}`} className="ml-4 font-mono text-sm text-muted-foreground">
                          {(() => {
                            try {
                              const generator = createWBSGenerator(wbsStructure);
                              return generator.generateCode([first, second]);
                            } catch {
                              return `${first}${wbsStructure.separator}${second}`;
                            }
                          })()}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default Structure</Label>
                  <div className="text-xs text-muted-foreground">
                    Use as project default
                  </div>
                </div>
                <Switch
                  checked={wbsStructure.isDefault}
                  onCheckedChange={checked =>
                    handleUpdateStructure({ isDefault: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-sm">About WBS Codes</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                Work Breakdown Structure (WBS) codes provide hierarchical organization for project tasks.
              </p>
              <p>
                Each level represents a different organizational dimension (e.g., Phase, Area, Sequence).
              </p>
              <p>
                WBS codes enable better scheduling, resource allocation, and progress tracking.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
