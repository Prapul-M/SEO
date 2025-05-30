import { useState, useEffect, useCallback } from 'react';
import { Check, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { SeoChange } from '@/types/database';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

interface SeoControlPanelProps {
  changes: SeoChange[];
  onApprove: (changeId: string) => Promise<void>;
  onReject: (changeId: string) => Promise<void>;
  onApproveAll: () => Promise<void>;
}

export default function SeoControlPanel({
  changes,
  onApprove,
  onReject,
  onApproveAll,
}: SeoControlPanelProps) {
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const loadAutomationStatus = useCallback(async () => {
    try {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('automation_enabled')
        .single();

      if (error) throw error;
      setIsEnabled(preferences?.automation_enabled || false);
    } catch (error) {
      console.error('Error loading automation status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load automation status'
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    loadAutomationStatus();
  }, [loadAutomationStatus]);

  const toggleAutomation = async () => {
    try {
      setIsLoading(true);
      const newStatus = !isEnabled;

      const { error } = await supabase
        .from('user_preferences')
        .update({ automation_enabled: newStatus })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      setIsEnabled(newStatus);
      toast({
        title: 'Success',
        description: 'Automation settings updated successfully'
      });
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update automation status'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (changeId: string) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedChanges(newExpanded);
  };

  const handleApprove = async (changeId: string) => {
    setLoading(new Set([...loading, changeId]));
    try {
      await onApprove(changeId);
    } finally {
      setLoading(new Set([...loading].filter(id => id !== changeId)));
    }
  };

  const handleReject = async (changeId: string) => {
    setLoading(new Set([...loading, changeId]));
    try {
      await onReject(changeId);
    } finally {
      setLoading(new Set([...loading].filter(id => id !== changeId)));
    }
  };

  const handleApproveAll = async () => {
    setLoading(new Set(changes.map(c => c.id)));
    try {
      await onApproveAll();
    } finally {
      setLoading(new Set());
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Pending SEO Changes</h3>
        <button
          onClick={handleApproveAll}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Approve All Changes
        </button>
      </div>

      <div className="space-y-4">
        {changes.map((change) => (
          <div
            key={change.id}
            className="border rounded-lg overflow-hidden bg-white"
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{change.file_path}</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                    {change.element_type}
                  </span>
                  <span className={`text-xs ${getConfidenceColor(change.confidence_score)}`}>
                    {Math.round(change.confidence_score * 100)}% confidence
                  </span>
                </div>
                <button
                  onClick={() => toggleExpand(change.id)}
                  className="mt-1 text-sm text-gray-500 flex items-center"
                >
                  {expandedChanges.has(change.id) ? (
                    <ChevronUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  )}
                  {expandedChanges.has(change.id) ? 'Hide details' : 'Show details'}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleApprove(change.id)}
                  disabled={loading.has(change.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleReject(change.id)}
                  disabled={loading.has(change.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {expandedChanges.has(change.id) && (
              <div className="px-4 pb-4 space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-500">Current Value:</div>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                    {change.old_value || '(empty)'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Suggested Change:</div>
                  <div className="mt-1 p-2 bg-green-50 rounded text-sm">
                    {change.new_value}
                  </div>
                </div>
                {change.confidence_score < 0.8 && (
                  <div className="flex items-center space-x-2 text-yellow-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Low confidence suggestion - review carefully</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {changes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No pending SEO changes to review
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automation Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Enable SEO Automation</h3>
              <p className="text-sm text-gray-500">
                Toggle to enable or disable automated SEO improvements
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={toggleAutomation}
              disabled={isLoading}
              aria-label="Toggle automation"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={loadAutomationStatus}
              disabled={isLoading}
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 