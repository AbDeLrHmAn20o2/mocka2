"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';

/**
 * Template Refresh Button - allows manual refresh of templates
 * Useful during development when templates are added/modified
 */
export function TemplateRefreshButton({ className = "" }) {
  const { refreshTemplates, loading, lastUpdated, count } = useTemplates();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTemplates();
    setTimeout(() => setIsRefreshing(false), 1000); // Visual feedback
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={handleRefresh}
        disabled={loading || isRefreshing}
        variant="outline"
        size="sm"
        className="text-slate-600 hover:text-purple-600"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
        Refresh Templates
      </Button>
      
      {count > 0 && (
        <span className="text-xs text-slate-500">
          {count} template{count !== 1 ? 's' : ''} loaded
        </span>
      )}
      
      {lastUpdated && (
        <span className="text-xs text-slate-400">
          Updated: {new Date(lastUpdated).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

/**
 * Development helper component to show template stats
 */
export function TemplateDevInfo() {
  const { templates, loading, error, count, getCategories } = useTemplates();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (loading) return <div className="text-xs text-slate-400">Loading templates...</div>;
  if (error) return <div className="text-xs text-red-400">Error: {error}</div>;

  const categories = getCategories();
  const premiumCount = templates.filter(t => t.isPremium).length;
  const freeCount = count - premiumCount;

  return (
    <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 border border-slate-200">
      <div className="font-medium mb-1">Template Stats (Dev Mode)</div>
      <div className="grid grid-cols-2 gap-2">
        <div>Total: {count}</div>
        <div>Categories: {categories.length}</div>
        <div>Premium: {premiumCount}</div>
        <div>Free: {freeCount}</div>
      </div>
      <div className="mt-2">
        <strong>Categories:</strong> {categories.join(', ') || 'None'}
      </div>
    </div>
  );
}
