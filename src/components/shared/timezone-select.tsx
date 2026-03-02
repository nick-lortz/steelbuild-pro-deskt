import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TimezoneSelectProps {
  value: string
  onValueChange: (value: string) => void
  id?: string
}

export function TimezoneSelect({ value, onValueChange, id }: TimezoneSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Select timezone" />
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">North America</div>
        <SelectItem value="America/New_York">Eastern Time (New York) - ET</SelectItem>
        <SelectItem value="America/Chicago">Central Time (Chicago) - CT</SelectItem>
        <SelectItem value="America/Denver">Mountain Time (Denver) - MT</SelectItem>
        <SelectItem value="America/Phoenix">Arizona (Phoenix) - MST</SelectItem>
        <SelectItem value="America/Los_Angeles">Pacific Time (Los Angeles) - PT</SelectItem>
        <SelectItem value="America/Anchorage">Alaska (Anchorage) - AKT</SelectItem>
        <SelectItem value="Pacific/Honolulu">Hawaii (Honolulu) - HST</SelectItem>
        <SelectItem value="America/Toronto">Toronto - ET</SelectItem>
        <SelectItem value="America/Vancouver">Vancouver - PT</SelectItem>
        <SelectItem value="America/Halifax">Halifax - AT</SelectItem>
        <SelectItem value="America/Mexico_City">Mexico City - CST</SelectItem>
        
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Europe</div>
        <SelectItem value="Europe/London">London - GMT/BST</SelectItem>
        <SelectItem value="Europe/Dublin">Dublin - GMT/IST</SelectItem>
        <SelectItem value="Europe/Paris">Paris - CET</SelectItem>
        <SelectItem value="Europe/Berlin">Berlin - CET</SelectItem>
        <SelectItem value="Europe/Rome">Rome - CET</SelectItem>
        <SelectItem value="Europe/Madrid">Madrid - CET</SelectItem>
        <SelectItem value="Europe/Amsterdam">Amsterdam - CET</SelectItem>
        <SelectItem value="Europe/Brussels">Brussels - CET</SelectItem>
        <SelectItem value="Europe/Zurich">Zurich - CET</SelectItem>
        <SelectItem value="Europe/Vienna">Vienna - CET</SelectItem>
        <SelectItem value="Europe/Stockholm">Stockholm - CET</SelectItem>
        <SelectItem value="Europe/Oslo">Oslo - CET</SelectItem>
        <SelectItem value="Europe/Copenhagen">Copenhagen - CET</SelectItem>
        <SelectItem value="Europe/Warsaw">Warsaw - CET</SelectItem>
        <SelectItem value="Europe/Prague">Prague - CET</SelectItem>
        <SelectItem value="Europe/Athens">Athens - EET</SelectItem>
        <SelectItem value="Europe/Helsinki">Helsinki - EET</SelectItem>
        <SelectItem value="Europe/Istanbul">Istanbul - TRT</SelectItem>
        <SelectItem value="Europe/Moscow">Moscow - MSK</SelectItem>
        
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Asia & Middle East</div>
        <SelectItem value="Asia/Dubai">Dubai - GST</SelectItem>
        <SelectItem value="Asia/Riyadh">Riyadh - AST</SelectItem>
        <SelectItem value="Asia/Qatar">Doha - AST</SelectItem>
        <SelectItem value="Asia/Kuwait">Kuwait - AST</SelectItem>
        <SelectItem value="Asia/Bahrain">Manama - AST</SelectItem>
        <SelectItem value="Asia/Jerusalem">Jerusalem - IST</SelectItem>
        <SelectItem value="Asia/Karachi">Karachi - PKT</SelectItem>
        <SelectItem value="Asia/Kolkata">Mumbai/Delhi - IST</SelectItem>
        <SelectItem value="Asia/Dhaka">Dhaka - BST</SelectItem>
        <SelectItem value="Asia/Bangkok">Bangkok - ICT</SelectItem>
        <SelectItem value="Asia/Jakarta">Jakarta - WIB</SelectItem>
        <SelectItem value="Asia/Singapore">Singapore - SGT</SelectItem>
        <SelectItem value="Asia/Kuala_Lumpur">Kuala Lumpur - MYT</SelectItem>
        <SelectItem value="Asia/Manila">Manila - PHT</SelectItem>
        <SelectItem value="Asia/Hong_Kong">Hong Kong - HKT</SelectItem>
        <SelectItem value="Asia/Shanghai">Beijing/Shanghai - CST</SelectItem>
        <SelectItem value="Asia/Taipei">Taipei - CST</SelectItem>
        <SelectItem value="Asia/Tokyo">Tokyo - JST</SelectItem>
        <SelectItem value="Asia/Seoul">Seoul - KST</SelectItem>
        
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Australia & Pacific</div>
        <SelectItem value="Australia/Perth">Perth - AWST</SelectItem>
        <SelectItem value="Australia/Adelaide">Adelaide - ACST</SelectItem>
        <SelectItem value="Australia/Darwin">Darwin - ACST</SelectItem>
        <SelectItem value="Australia/Brisbane">Brisbane - AEST</SelectItem>
        <SelectItem value="Australia/Sydney">Sydney - AEST</SelectItem>
        <SelectItem value="Australia/Melbourne">Melbourne - AEST</SelectItem>
        <SelectItem value="Pacific/Auckland">Auckland - NZST</SelectItem>
        <SelectItem value="Pacific/Fiji">Fiji - FJT</SelectItem>
        
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">South America</div>
        <SelectItem value="America/Sao_Paulo">São Paulo - BRT</SelectItem>
        <SelectItem value="America/Buenos_Aires">Buenos Aires - ART</SelectItem>
        <SelectItem value="America/Santiago">Santiago - CLT</SelectItem>
        <SelectItem value="America/Lima">Lima - PET</SelectItem>
        <SelectItem value="America/Bogota">Bogotá - COT</SelectItem>
        <SelectItem value="America/Caracas">Caracas - VET</SelectItem>
        
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Africa</div>
        <SelectItem value="Africa/Cairo">Cairo - EET</SelectItem>
        <SelectItem value="Africa/Johannesburg">Johannesburg - SAST</SelectItem>
        <SelectItem value="Africa/Lagos">Lagos - WAT</SelectItem>
        <SelectItem value="Africa/Nairobi">Nairobi - EAT</SelectItem>
        <SelectItem value="Africa/Casablanca">Casablanca - WET</SelectItem>
      </SelectContent>
    </Select>
  )
}
