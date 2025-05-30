import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { format } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { motion } from 'framer-motion';

// Get all available timezones grouped by region
const TIMEZONE_GROUPS = {
  'Africa': Intl.supportedValuesOf('timeZone').filter(tz => tz.startsWith('Africa/')),
  'America': Intl.supportedValuesOf('timeZone').filter(tz => tz.startsWith('America/')),
  'Antarctica': Intl.supportedValuesOf('timeZone').filter(tz => tz.startsWith('Antarctica/')),
  'Asia': Intl.supportedValuesOf('timeZone').filter(tz => tz.startsWith('Asia/')),
  'Atlantic': Intl.supportedValuesOf('timeZone').filter(tz => tz.startsWith('Atlantic/')),
  'Australia': Intl.supportedValuesOf('timeZone').filter(tz => tz.startsWith('Australia/')),
  'Europe': Intl.supportedValuesOf('timeZone').filter(tz => tz.startsWith('Europe/')),
  'Indian': Intl.supportedValuesOf('timeZone').filter(tz => tz.startsWith('Indian/')),
  'Pacific': Intl.supportedValuesOf('timeZone').filter(tz => tz.startsWith('Pacific/')),
};

export default function AutomationScheduler() {
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [scheduleTime, setScheduleTime] = useState('02:00');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const loadScheduleSettings = useCallback(async () => {
    try {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('timezone, automation_schedule')
        .single();

      if (error) throw error;

      if (preferences) {
        setSelectedTimezone(preferences.timezone);
        setScheduleTime(format(utcToZonedTime(preferences.automation_schedule, preferences.timezone), 'HH:mm'));
      }
    } catch (error) {
      console.error('Error loading schedule settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedule settings'
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    loadScheduleSettings();
  }, [loadScheduleSettings]);

  const saveScheduleSettings = async () => {
    try {
      setIsLoading(true);
      const utcTime = zonedTimeToUtc(`2000-01-01T${scheduleTime}`, selectedTimezone);
      
      const { error } = await supabase
        .from('user_preferences')
        .update({
          timezone: selectedTimezone,
          automation_schedule: format(utcTime, 'HH:mm:ss'),
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Schedule settings updated successfully'
      });
    } catch (error) {
      console.error('Error saving schedule settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule settings'
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Automation Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <Select
                value={selectedTimezone}
                onValueChange={setSelectedTimezone}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(TIMEZONE_GROUPS).map(([region, timezones]) => (
                    <div key={region}>
                      <div className="px-2 py-1.5 text-sm font-semibold bg-muted">
                        {region}
                      </div>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz.replace(`${region}/`, '')} ({format(utcToZonedTime(new Date(), tz), 'HH:mm')})
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Schedule Time</label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <Button
              onClick={saveScheduleSettings}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 