import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, User } from "lucide-react";

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("admin_logs")
        .select(`
          *,
          profiles (
            email,
            full_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (actionType: string) => {
    if (actionType.includes("delete")) return <Badge variant="destructive" className="text-xs">{actionType}</Badge>;
    if (actionType.includes("ban")) return <Badge variant="destructive" className="text-xs">{actionType}</Badge>;
    if (actionType.includes("flag")) return <Badge className="text-xs">{actionType}</Badge>;
    if (actionType.includes("verify") || actionType.includes("approve")) return <Badge variant="default" className="text-xs bg-green-600">{actionType}</Badge>;
    return <Badge variant="secondary" className="text-xs">{actionType}</Badge>;
  };

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-xs md:text-base text-muted-foreground">Track all administrative actions</p>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No audit logs found
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium text-sm truncate">{log.profiles?.full_name || "Unknown"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{log.profiles?.email}</p>
                  </div>
                  {getActionBadge(log.action_type)}
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="font-medium">Target:</span>
                    <span>{log.target_type || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
                
                {log.target_id && (
                  <p className="text-xs text-muted-foreground mt-1.5 font-mono bg-muted px-2 py-1 rounded inline-block">
                    ID: {log.target_id.slice(0, 8)}...
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target Type</TableHead>
              <TableHead>Target ID</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No audit logs found</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{log.profiles?.full_name || "Unknown"}</span>
                      <span className="text-sm text-muted-foreground">{log.profiles?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getActionBadge(log.action_type)}</TableCell>
                  <TableCell>{log.target_type || "N/A"}</TableCell>
                  <TableCell className="font-mono text-xs">{log.target_id?.slice(0, 8) || "N/A"}...</TableCell>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
