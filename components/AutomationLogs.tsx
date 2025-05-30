import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { SeoAutomationLog } from '@/types/database';

export default function AutomationLogs() {
  const [logs, setLogs] = useState<SeoAutomationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userTimezone, setUserTimezone] = useState('UTC');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const loadUserTimezone = useCallback(async () => {
    try {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('timezone')
        .single();

      if (error) throw error;
      if (preferences) {
        setUserTimezone(preferences.timezone);
      }
    } catch (error) {
      console.error('Error loading user timezone:', error);
    }
  }, [supabase]);

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('seo_automation_logs')
        .select('*')
        .order('started_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateFilter) {
        query = query.gte('started_at', `${dateFilter}T00:00:00Z`)
          .lt('started_at', `${dateFilter}T23:59:59Z`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading automation logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load automation logs'
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, statusFilter, dateFilter, toast]);

  useEffect(() => {
    loadLogs();
    loadUserTimezone();
  }, [loadLogs, loadUserTimezone]);

  const formatDate = (date: string) => {
    const zonedDate = utcToZonedTime(new Date(date), userTimezone);
    return format(zonedDate, 'MMM d, yyyy HH:mm:ss');
  };

  const calculateDuration = (startDate: string, endDate?: string | null) => {
    if (!endDate) return 'In progress';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end.getTime() - start.getTime();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automation Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-48">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
                placeholder="Filter by date"
              />
            </div>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <p>Loading logs...</p>
            ) : logs.length === 0 ? (
              <p>No automation logs found</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-block px-2 py-1 text-sm rounded ${
                        log.status === 'completed' ? 'bg-green-100 text-green-800' :
                        log.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.status}
                      </span>
                      <p className="mt-1 text-sm text-gray-600">
                        Started: {formatDate(log.started_at)}
                      </p>
                      {log.completed_at && (
                        <p className="text-sm text-gray-600">
                          Completed: {formatDate(log.completed_at)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Duration: {calculateDuration(log.started_at, log.completed_at)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Changes: {log.changes_count}
                      </p>
                    </div>
                  </div>
                  {log.error_message && (
                    <p className="text-sm text-red-600 mt-2">
                      Error: {log.error_message}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 