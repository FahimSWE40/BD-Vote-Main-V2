import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, MapPin, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useConstituencies, useAddConstituency, useDeleteConstituency } from '@/hooks/use-constituencies';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminConstituencies() {
  const { data: constituencies = [], isLoading, refetch, isRefetching } = useConstituencies();
  const addMutation = useAddConstituency();
  const deleteMutation = useDeleteConstituency();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ constituency_name: '', constituency_code: '', district: '', division: '' });

  const handleAdd = async () => {
    if (!form.constituency_name || !form.constituency_code || !form.district || !form.division) {
      toast.error('সকল ফিল্ড পূরণ করুন');
      return;
    }
    try {
      await addMutation.mutateAsync(form);
      toast.success('নির্বাচনী এলাকা যোগ করা হয়েছে');
      setForm({ constituency_name: '', constituency_code: '', district: '', division: '' });
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'সমস্যা হয়েছে');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" মুছে ফেলতে চান?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('মুছে ফেলা হয়েছে');
    } catch (e: any) {
      toast.error(e.message || 'মুছতে সমস্যা হয়েছে');
    }
  };

  const divisions = [...new Set(constituencies.map(c => c.division))];

  return (
    <AdminLayout
      title="নির্বাচনী এলাকা"
      subtitle="সকল নির্বাচনী এলাকা পরিচালনা করুন"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`size-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="size-4 mr-1" /> <span className="hidden sm:inline">এলাকা যোগ</span></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>নতুন নির্বাচনী এলাকা</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>এলাকার নাম</Label>
                  <Input placeholder="ঢাকা-৮" value={form.constituency_name} onChange={e => setForm(f => ({ ...f, constituency_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>কোড</Label>
                  <Input placeholder="DHK-8" value={form.constituency_code} onChange={e => setForm(f => ({ ...f, constituency_code: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>জেলা</Label>
                    <Input placeholder="ঢাকা" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>বিভাগ</Label>
                    <Input placeholder="ঢাকা" value={form.division} onChange={e => setForm(f => ({ ...f, division: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleAdd} disabled={addMutation.isPending} className="w-full">
                  {addMutation.isPending ? 'যোগ হচ্ছে...' : 'যোগ করুন'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="size-4" /> মোট: {constituencies.length}</span>
        <span>বিভাগ: {divisions.length}</span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : constituencies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="size-10 mx-auto mb-3 opacity-50" />
              <p>কোনো নির্বাচনী এলাকা যোগ করা হয়নি</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>কোড</TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead className="hidden sm:table-cell">জেলা</TableHead>
                  <TableHead className="hidden sm:table-cell">বিভাগ</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {constituencies.map(c => (
                  <TableRow key={c.id}>
                    <TableCell><Badge variant="outline">{c.constituency_code}</Badge></TableCell>
                    <TableCell className="font-medium">{c.constituency_name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{c.district}</TableCell>
                    <TableCell className="hidden sm:table-cell">{c.division}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(c.id, c.constituency_name)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
