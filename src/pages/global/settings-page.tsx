import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Gear, 
  Buildings, 
  CurrencyDollar, 
  Bell, 
  Shield, 
  Palette,
  Calendar,
  Clock,
  Database,
  Export,
  Users
} from '@phosphor-icons/react'
import { GradientSettingsCard } from '@/components/settings/gradient-settings-card'
import { TimezoneSelect } from '@/components/shared/timezone-select'

interface GlobalSettings {
  company: {
    name: string
    address: string
    phone: string
    email: string
    website: string
    taxId: string
  }
  defaults: {
    timeZone: string
    dateFormat: string
    currency: string
    fiscalYearStart: string
    workWeekStart: string
    workWeekEnd: string
    standardHoursPerDay: number
    overtimeThreshold: number
  }
  financial: {
    defaultRetainagePercent: number
    enableMultiCurrency: boolean
    requireApprovalThreshold: number
    costCodePrefix: string
    autoGenerateInvoiceNumbers: boolean
    invoicePrefix: string
  }
  notifications: {
    emailNotifications: boolean
    rfiAgingThreshold: number
    submittalAgingThreshold: number
    budgetVarianceThreshold: number
    scheduleDelayThreshold: number
    deliveryReminderDays: number
  }
  security: {
    requireStrongPasswords: boolean
    sessionTimeoutMinutes: number
    allowMultipleSessions: boolean
    requireTwoFactor: boolean
    auditLogRetentionDays: number
  }
  advanced: {
    enableAutoBackup: boolean
    backupFrequency: string
    dataRetentionDays: number
    enableBetaFeatures: boolean
    apiAccessEnabled: boolean
  }
}

const defaultSettings: GlobalSettings = {
  company: {
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
  },
  defaults: {
    timeZone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    fiscalYearStart: '01-01',
    workWeekStart: 'Monday',
    workWeekEnd: 'Friday',
    standardHoursPerDay: 8,
    overtimeThreshold: 40,
  },
  financial: {
    defaultRetainagePercent: 10,
    enableMultiCurrency: false,
    requireApprovalThreshold: 5000,
    costCodePrefix: 'CC-',
    autoGenerateInvoiceNumbers: true,
    invoicePrefix: 'INV-',
  },
  notifications: {
    emailNotifications: true,
    rfiAgingThreshold: 7,
    submittalAgingThreshold: 14,
    budgetVarianceThreshold: 10,
    scheduleDelayThreshold: 3,
    deliveryReminderDays: 2,
  },
  security: {
    requireStrongPasswords: true,
    sessionTimeoutMinutes: 60,
    allowMultipleSessions: false,
    requireTwoFactor: false,
    auditLogRetentionDays: 365,
  },
  advanced: {
    enableAutoBackup: true,
    backupFrequency: 'daily',
    dataRetentionDays: 2555,
    enableBetaFeatures: false,
    apiAccessEnabled: false,
  },
}

export function SettingsPage() {
  const [settings, setSettings] = useKV<GlobalSettings>('global-settings', defaultSettings)
  const [activeTab, setActiveTab] = useState('company')
  const [hasChanges, setHasChanges] = useState(false)

  const updateSettings = (section: keyof GlobalSettings, field: string, value: any) => {
    setSettings(current => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    toast.success('Settings saved successfully')
    setHasChanges(false)
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setHasChanges(false)
    toast.info('Settings reset to defaults')
  }

  return (
    <div className="container max-w-7xl py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gear size={32} weight="duotone" className="text-primary" />
            Global Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure system-wide defaults and preferences
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="px-3 py-1">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto gap-2">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Buildings size={18} />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="defaults" className="flex items-center gap-2">
            <Clock size={18} />
            <span className="hidden sm:inline">Defaults</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <CurrencyDollar size={18} />
            <span className="hidden sm:inline">Financial</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette size={18} />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell size={18} />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield size={18} />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Database size={18} />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic company details displayed on reports and documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name *</Label>
                  <Input
                    id="company-name"
                    value={settings.company.name}
                    onChange={e => updateSettings('company', 'name', e.target.value)}
                    placeholder="Steel Erectors Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={settings.company.email}
                    onChange={e => updateSettings('company', 'email', e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-address">Address</Label>
                <Input
                  id="company-address"
                  value={settings.company.address}
                  onChange={e => updateSettings('company', 'address', e.target.value)}
                  placeholder="123 Steel St, Industrial City, ST 12345"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Phone</Label>
                  <Input
                    id="company-phone"
                    value={settings.company.phone}
                    onChange={e => updateSettings('company', 'phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-website">Website</Label>
                  <Input
                    id="company-website"
                    value={settings.company.website}
                    onChange={e => updateSettings('company', 'website', e.target.value)}
                    placeholder="www.company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-taxid">Tax ID</Label>
                  <Input
                    id="company-taxid"
                    value={settings.company.taxId}
                    onChange={e => updateSettings('company', 'taxId', e.target.value)}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Defaults</CardTitle>
              <CardDescription>
                Default values and formats applied throughout the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Time Zone</Label>
                  <TimezoneSelect
                    id="timezone"
                    value={settings.defaults.timeZone}
                    onValueChange={value => updateSettings('defaults', 'timeZone', value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for scheduling, reports, and timestamping across international teams
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={settings.defaults.dateFormat}
                    onValueChange={value => updateSettings('defaults', 'dateFormat', value)}
                  >
                    <SelectTrigger id="date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.defaults.currency}
                    onValueChange={value => updateSettings('defaults', 'currency', value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fiscal-year">Fiscal Year Start</Label>
                  <Input
                    id="fiscal-year"
                    value={settings.defaults.fiscalYearStart}
                    onChange={e => updateSettings('defaults', 'fiscalYearStart', e.target.value)}
                    placeholder="MM-DD"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Work Week</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="week-start">Week Start Day</Label>
                    <Select
                      value={settings.defaults.workWeekStart}
                      onValueChange={value => updateSettings('defaults', 'workWeekStart', value)}
                    >
                      <SelectTrigger id="week-start">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="week-end">Week End Day</Label>
                    <Select
                      value={settings.defaults.workWeekEnd}
                      onValueChange={value => updateSettings('defaults', 'workWeekEnd', value)}
                    >
                      <SelectTrigger id="week-end">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Friday">Friday</SelectItem>
                        <SelectItem value="Saturday">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours-per-day">Standard Hours/Day</Label>
                    <Input
                      id="hours-per-day"
                      type="number"
                      min="1"
                      max="24"
                      value={settings.defaults.standardHoursPerDay}
                      onChange={e => updateSettings('defaults', 'standardHoursPerDay', parseInt(e.target.value) || 8)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overtime-threshold">Overtime Threshold (hrs/week)</Label>
                    <Input
                      id="overtime-threshold"
                      type="number"
                      min="0"
                      value={settings.defaults.overtimeThreshold}
                      onChange={e => updateSettings('defaults', 'overtimeThreshold', parseInt(e.target.value) || 40)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <GradientSettingsCard />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Settings</CardTitle>
              <CardDescription>
                Configure financial defaults and approval thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retainage">Default Retainage %</Label>
                  <Input
                    id="retainage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.financial.defaultRetainagePercent}
                    onChange={e => updateSettings('financial', 'defaultRetainagePercent', parseFloat(e.target.value) || 10)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approval-threshold">Approval Threshold ($)</Label>
                  <Input
                    id="approval-threshold"
                    type="number"
                    min="0"
                    step="100"
                    value={settings.financial.requireApprovalThreshold}
                    onChange={e => updateSettings('financial', 'requireApprovalThreshold', parseFloat(e.target.value) || 5000)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost-code-prefix">Cost Code Prefix</Label>
                  <Input
                    id="cost-code-prefix"
                    value={settings.financial.costCodePrefix}
                    onChange={e => updateSettings('financial', 'costCodePrefix', e.target.value)}
                    placeholder="CC-"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-prefix">Invoice Prefix</Label>
                  <Input
                    id="invoice-prefix"
                    value={settings.financial.invoicePrefix}
                    onChange={e => updateSettings('financial', 'invoicePrefix', e.target.value)}
                    placeholder="INV-"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="multi-currency">Enable Multi-Currency</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow tracking costs in multiple currencies
                    </p>
                  </div>
                  <Switch
                    id="multi-currency"
                    checked={settings.financial.enableMultiCurrency}
                    onCheckedChange={checked => updateSettings('financial', 'enableMultiCurrency', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-invoice">Auto-Generate Invoice Numbers</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically assign sequential invoice numbers
                    </p>
                  </div>
                  <Switch
                    id="auto-invoice"
                    checked={settings.financial.autoGenerateInvoiceNumbers}
                    onCheckedChange={checked => updateSettings('financial', 'autoGenerateInvoiceNumbers', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure alert thresholds and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email alerts for critical events
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={checked => updateSettings('notifications', 'emailNotifications', checked)}
                />
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Alert Thresholds</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rfi-aging">RFI Aging Alert (days)</Label>
                    <Input
                      id="rfi-aging"
                      type="number"
                      min="1"
                      value={settings.notifications.rfiAgingThreshold}
                      onChange={e => updateSettings('notifications', 'rfiAgingThreshold', parseInt(e.target.value) || 7)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="submittal-aging">Submittal Aging Alert (days)</Label>
                    <Input
                      id="submittal-aging"
                      type="number"
                      min="1"
                      value={settings.notifications.submittalAgingThreshold}
                      onChange={e => updateSettings('notifications', 'submittalAgingThreshold', parseInt(e.target.value) || 14)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget-variance">Budget Variance Alert (%)</Label>
                    <Input
                      id="budget-variance"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.notifications.budgetVarianceThreshold}
                      onChange={e => updateSettings('notifications', 'budgetVarianceThreshold', parseInt(e.target.value) || 10)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-delay">Schedule Delay Alert (days)</Label>
                    <Input
                      id="schedule-delay"
                      type="number"
                      min="1"
                      value={settings.notifications.scheduleDelayThreshold}
                      onChange={e => updateSettings('notifications', 'scheduleDelayThreshold', parseInt(e.target.value) || 3)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery-reminder">Delivery Reminder (days before)</Label>
                    <Input
                      id="delivery-reminder"
                      type="number"
                      min="0"
                      value={settings.notifications.deliveryReminderDays}
                      onChange={e => updateSettings('notifications', 'deliveryReminderDays', parseInt(e.target.value) || 2)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure authentication and access control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="strong-passwords">Require Strong Passwords</Label>
                    <p className="text-sm text-muted-foreground">
                      Enforce minimum length and complexity requirements
                    </p>
                  </div>
                  <Switch
                    id="strong-passwords"
                    checked={settings.security.requireStrongPasswords}
                    onCheckedChange={checked => updateSettings('security', 'requireStrongPasswords', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="multiple-sessions">Allow Multiple Sessions</Label>
                    <p className="text-sm text-muted-foreground">
                      Users can be logged in from multiple devices
                    </p>
                  </div>
                  <Switch
                    id="multiple-sessions"
                    checked={settings.security.allowMultipleSessions}
                    onCheckedChange={checked => updateSettings('security', 'allowMultipleSessions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor">Require Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Mandate 2FA for all user accounts
                    </p>
                  </div>
                  <Switch
                    id="two-factor"
                    checked={settings.security.requireTwoFactor}
                    onCheckedChange={checked => updateSettings('security', 'requireTwoFactor', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min="5"
                    max="480"
                    value={settings.security.sessionTimeoutMinutes}
                    onChange={e => updateSettings('security', 'sessionTimeoutMinutes', parseInt(e.target.value) || 60)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audit-retention">Audit Log Retention (days)</Label>
                  <Input
                    id="audit-retention"
                    type="number"
                    min="30"
                    value={settings.security.auditLogRetentionDays}
                    onChange={e => updateSettings('security', 'auditLogRetentionDays', parseInt(e.target.value) || 365)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure data retention, backups, and experimental features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-backup">Enable Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically backup all data on schedule
                    </p>
                  </div>
                  <Switch
                    id="auto-backup"
                    checked={settings.advanced.enableAutoBackup}
                    onCheckedChange={checked => updateSettings('advanced', 'enableAutoBackup', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="beta-features">Enable Beta Features</Label>
                    <p className="text-sm text-muted-foreground">
                      Access experimental features (may be unstable)
                    </p>
                  </div>
                  <Switch
                    id="beta-features"
                    checked={settings.advanced.enableBetaFeatures}
                    onCheckedChange={checked => updateSettings('advanced', 'enableBetaFeatures', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="api-access">Enable API Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow third-party integrations via REST API
                    </p>
                  </div>
                  <Switch
                    id="api-access"
                    checked={settings.advanced.apiAccessEnabled}
                    onCheckedChange={checked => updateSettings('advanced', 'apiAccessEnabled', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Select
                    value={settings.advanced.backupFrequency}
                    onValueChange={value => updateSettings('advanced', 'backupFrequency', value)}
                  >
                    <SelectTrigger id="backup-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-retention">Data Retention (days)</Label>
                  <Input
                    id="data-retention"
                    type="number"
                    min="30"
                    value={settings.advanced.dataRetentionDays}
                    onChange={e => updateSettings('advanced', 'dataRetentionDays', parseInt(e.target.value) || 2555)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
