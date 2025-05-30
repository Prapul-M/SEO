import { useState } from 'react';
import { format } from 'date-fns';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Download, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface SeoChange {
  file_path: string;
  element_type: string;
  old_value: string;
  new_value: string;
  confidence_score: number;
}

interface AutomationLog {
  started_at: string;
  status: string;
  seo_changes?: SeoChange[];
}

export default function ReportDownloader() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const downloadReport = async () => {
    try {
      setIsLoading(true);

      // Fetch automation logs and changes
      const { data: logs, error: logsError } = await supabase
        .from('seo_automation_logs')
        .select(`
          *,
          seo_changes (*)
        `)
        .gte('started_at', `${startDate}T00:00:00Z`)
        .lte('started_at', `${endDate}T23:59:59Z`)
        .order('started_at', { ascending: false });

      if (logsError) throw logsError;

      // Format data for CSV
      const rows = [
        ['Date', 'Status', 'File Path', 'Change Type', 'Old Value', 'New Value', 'Confidence Score'],
      ];

      logs?.forEach((log: AutomationLog) => {
        log.seo_changes?.forEach((change: SeoChange) => {
          rows.push([
            format(new Date(log.started_at), 'yyyy-MM-dd HH:mm:ss'),
            log.status,
            change.file_path,
            change.element_type,
            change.old_value,
            change.new_value,
            change.confidence_score.toString(),
          ]);
        });
      });

      // Create CSV content
      const csvContent = rows
        .map(row => row.map(cell => `"${cell?.replace(/"/g, '""') || ''}"`).join(','))
        .join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `seo-changes-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: 'Report downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Error',
        description: 'Failed to download report'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download SEO Changes Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <Button
            onClick={downloadReport}
            disabled={isLoading || !startDate || !endDate}
            className="w-full"
          >
            {isLoading ? 'Generating Report...' : 'Download Report'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
} 