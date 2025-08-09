'use client'

import { useState, useEffect, useMemo } from 'react';
import { useLeaderboard } from './useLeaderboard';

interface OrganizationCount {
  name: string;
  count: number;
}

export const useOrganizations = () => {
  const { leaderboardData, isLoading: leaderboardLoading } = useLeaderboard();
  const [isLoading, setIsLoading] = useState(true);

  // Process leaderboard data to get organizations with counts
  const organizationsWithCounts = useMemo(() => {
    if (!leaderboardData.length) return [];

    // Count occurrences of each organization
    const orgCounts = new Map<string, number>();
    
    leaderboardData.forEach(submission => {
      // Handle None values - convert to null/undefined so they don't appear as options
      let org = submission.organization;
      if (!org || org === 'None' || org === 'No Organization') {
        org = 'No Organization';
      }
      const currentCount = orgCounts.get(org) || 0;
      orgCounts.set(org, currentCount + 1);
    });

    // Convert to array and sort by count (descending), then by name (ascending)
    const organizations: OrganizationCount[] = Array.from(orgCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        // First sort by count (highest first)
        if (a.count !== b.count) {
          return b.count - a.count;
        }
        // Then sort alphabetically for organizations with same count
        return a.name.localeCompare(b.name);
      });

    return organizations;
  }, [leaderboardData]);

  // Just get the organization names for the filter dropdown
  const organizationNames = useMemo(() => {
    return organizationsWithCounts.map(org => org.name);
  }, [organizationsWithCounts]);

  useEffect(() => {
    setIsLoading(leaderboardLoading);
  }, [leaderboardLoading]);

  return {
    organizations: organizationNames,
    organizationsWithCounts,
    isLoading
  };
};
