import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, subMonths, startOfYear, format, eachDayOfInterval, eachWeekOfInterval, subDays } from "date-fns";

export type TimePeriod = "today" | "week" | "month" | "6months" | "year" | "all";

interface PeriodStats {
  newUsers: number;
  newProperties: number;
  reportedProperties: number;
  totalProperties: number;
  activeProperties: number;
  totalUsers: number;
  totalTenants: number;
  activeTenants: number;
  totalReviews: number;
}

interface PropertyTypeData {
  name: string;
  value: number;
}

interface GrowthData {
  date: string;
  users: number;
  properties: number;
}

export function useAdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>("month");
  const [stats, setStats] = useState<PeriodStats>({
    newUsers: 0,
    newProperties: 0,
    reportedProperties: 0,
    totalProperties: 0,
    activeProperties: 0,
    totalUsers: 0,
    totalTenants: 0,
    activeTenants: 0,
    totalReviews: 0,
  });
  const [propertyTypeData, setPropertyTypeData] = useState<PropertyTypeData[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);

  const getStartDate = useCallback((p: TimePeriod): Date | null => {
    const now = new Date();
    switch (p) {
      case "today":
        return startOfDay(now);
      case "week":
        return startOfWeek(now, { weekStartsOn: 1 });
      case "month":
        return startOfMonth(now);
      case "6months":
        return subMonths(now, 6);
      case "year":
        return startOfYear(now);
      case "all":
        return null;
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = getStartDate(period);
      const startDateStr = startDate ? startDate.toISOString() : null;

      // Fetch all data in parallel
      const [
        usersRes,
        propertiesRes,
        tenantsRes,
        reviewsRes,
        reportedRes,
        allPropertiesRes,
        allUsersRes
      ] = await Promise.all([
        // New users in period
        startDateStr
          ? supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startDateStr)
          : supabase.from("profiles").select("id", { count: "exact", head: true }),
        // New properties in period
        startDateStr
          ? supabase.from("properties").select("id", { count: "exact", head: true }).gte("created_at", startDateStr)
          : supabase.from("properties").select("id", { count: "exact", head: true }),
        // Tenants
        supabase.from("tenants").select("id, is_active", { count: "exact" }),
        // Reviews
        supabase.from("property_reviews").select("id", { count: "exact", head: true }),
        // Reported properties
        supabase.from("properties").select("id", { count: "exact", head: true }).gt("report_count", 0),
        // All properties for type distribution
        supabase.from("properties").select("type, is_public"),
        // All users count
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      // Calculate property type distribution
      const typeCount: Record<string, number> = {};
      allPropertiesRes.data?.forEach((p: { type: string }) => {
        typeCount[p.type] = (typeCount[p.type] || 0) + 1;
      });
      const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

      // Active properties count
      const activeProperties = allPropertiesRes.data?.filter((p: { is_public: boolean }) => p.is_public).length || 0;
      const activeTenants = tenantsRes.data?.filter((t: { is_active: boolean }) => t.is_active).length || 0;

      setStats({
        newUsers: usersRes.count || 0,
        newProperties: propertiesRes.count || 0,
        reportedProperties: reportedRes.count || 0,
        totalProperties: allPropertiesRes.data?.length || 0,
        activeProperties,
        totalUsers: allUsersRes.count || 0,
        totalTenants: tenantsRes.count || 0,
        activeTenants,
        totalReviews: reviewsRes.count || 0,
      });
      setPropertyTypeData(typeData);

      // Fetch growth data for chart
      await fetchGrowthData();
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [period, getStartDate]);

  const fetchGrowthData = async () => {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 30);
      
      // Get users and properties created in last 30 days
      const [usersRes, propertiesRes] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", startDate.toISOString()),
        supabase.from("properties").select("created_at").gte("created_at", startDate.toISOString()),
      ]);

      // Create daily buckets
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const data: GrowthData[] = days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const usersOnDay = usersRes.data?.filter(u => 
          format(new Date(u.created_at), "yyyy-MM-dd") === dayStr
        ).length || 0;
        const propertiesOnDay = propertiesRes.data?.filter(p => 
          format(new Date(p.created_at), "yyyy-MM-dd") === dayStr
        ).length || 0;

        return {
          date: format(day, "MMM dd"),
          users: usersOnDay,
          properties: propertiesOnDay,
        };
      });

      setGrowthData(data);
    } catch (error) {
      console.error("Failed to fetch growth data:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { 
    stats, 
    loading, 
    period, 
    setPeriod, 
    propertyTypeData, 
    growthData,
    refetch: fetchStats 
  };
}
