import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Shield, Clock, Play, Square, AlertTriangle } from 'lucide-react';
import { AdminSettingsSkeleton } from '@/components/admin/AdminSkeletons';
import { useElectionConfig, useSaveElectionConfig } from '@/hooks/use-election-config';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { data: config, isLoading } = useElectionConfig();
  const saveMutation = useSaveElectionConfig();

  const [electionName, setElectionName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (config) {
      setElectionName(config.election_name || '');
      setStartTime(config.start_time ? new Date(config.start_time).toISOString().slice(0, 16) : '');
      setEndTime(config.end_time ? new Date(config.end_time).toISOString().slice(0, 16) : '');
      setIsActive(config.is_active || false);
    }
  }, [config]);

  const handleSave = async () => {
    if (!electionName || !startTime || !endTime) {
      toast.error('সকল ফিল্ড পূরণ করুন');
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      toast.error('শেষের সময় শুরুর সময়ের পরে হতে হবে');
      return;
    }
    try {
      await saveMutation.mutateAsync({
        id: config?.id,
        election_name: electionName,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        is_active: isActive,
      });
      toast.success('নির্বাচন কনফিগারেশন সংরক্ষিত হয়েছে');
    } catch (e: any) {
      toast.error(e.message || 'সংরক্ষণে সমস্যা হয়েছে');
    }
  };

  const handleToggleElection = async () => {
    const newActive = !isActive;
    setIsActive(newActive);
    if (config?.id) {
      try {
        await saveMutation.mutateAsync({
          id: config.id,
          election_name: electionName || config.election_name,
          start_time: startTime ? new Date(startTime).toISOString() : config.start_time,
          end_time: endTime ? new Date(endTime).toISOString() : config.end_time,
          is_active: newActive,
        });
        toast.success(newActive ? 'নির্বাচন শুরু হয়েছে!' : 'নির্বাচন বন্ধ করা হয়েছে');
      } catch {
        setIsActive(!newActive);
        toast.error('পরিবর্তন করতে সমস্যা');
      }
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="সেটিংস" subtitle="লোড হচ্ছে...">
        <AdminSettingsSkeleton />
      </AdminLayout>
    );
  }

  const now = new Date();
  const electionStarted = config?.start_time && new Date(config.start_time) <= now;
  const electionEnded = config?.end_time && new Date(config.end_time) <= now;

  return (
    <AdminLayout
      title="সেটিংস"
      subtitle="সিস্টেম কনফিগারেশন ও নির্বাচন পরিচালনা"
    >
      {/* Election Lifecycle Control - FR-21 */}
      <Card className={`border-2 ${isActive ? 'border-green-500/50 bg-green-50/30 dark:bg-green-950/10' : 'border-border'}`}>
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="size-4 sm:size-5 text-primary" />
              নির্বাচন লাইফসাইকেল কন্ট্রোল
            </CardTitle>
            {isActive ? (
              <Badge className="bg-green-500 text-white border-0 gap-1">
                <span className="size-1.5 bg-white rounded-full animate-pulse" />
                সক্রিয়
              </Badge>
            ) : (
              <Badge variant="secondary">নিষ্ক্রিয়</Badge>
            )}
          </div>
          <CardDescription className="text-xs sm:text-sm">
            নির্বাচনের নাম, সময়সূচি নির্ধারণ ও শুরু/বন্ধ করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="election-name" className="text-sm">নির্বাচনের নাম</Label>
            <Input
              id="election-name"
              placeholder="যেমন: ২০২৬ সাধারণ নির্বাচন"
              value={electionName}
              onChange={e => setElectionName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm">শুরুর তারিখ ও সময়</Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm">শেষের তারিখ ও সময়</Label>
              <Input
                id="end-date"
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 sm:flex-none">
              {saveMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সময়সূচি সংরক্ষণ করুন'}
            </Button>
            <Button
              variant={isActive ? "destructive" : "default"}
              onClick={handleToggleElection}
              disabled={!config?.id && !electionName}
              className="flex-1 sm:flex-none gap-2"
            >
              {isActive ? (
                <><Square className="size-4" /> নির্বাচন বন্ধ করুন</>
              ) : (
                <><Play className="size-4" /> নির্বাচন শুরু করুন</>
              )}
            </Button>
          </div>

          {electionEnded && isActive && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="size-4 shrink-0" />
              নির্বাচনের নির্ধারিত সময় শেষ হয়ে গেছে। অনুগ্রহ করে নির্বাচন বন্ধ করুন।
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-border">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bell className="size-4 sm:size-5 text-primary" />
            নোটিফিকেশন
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            ইমেইল ও পুশ নোটিফিকেশন সেটিংস
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {[
            { title: 'নতুন ভোটার রেজিস্ট্রেশন', desc: 'নতুন ভোটার যোগ হলে নোটিফিকেশন পান' },
            { title: 'ভোট কাউন্ট আপডেট', desc: 'প্রতি ১০০ ভোটে আপডেট পান' },
            { title: 'সিস্টেম অ্যালার্ট', desc: 'সিকিউরিটি বা এরর অ্যালার্ট পান' },
          ].map(item => (
            <div key={item.title} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-border">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Shield className="size-4 sm:size-5 text-primary" />
            সিকিউরিটি
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {[
            { title: 'ফেস ভেরিফিকেশন বাধ্যতামূলক', desc: 'ভোট দেওয়ার আগে ফেস ভেরিফিকেশন প্রয়োজন' },
            { title: 'ডুপ্লিকেট ভোট প্রতিরোধ', desc: 'একই ব্যক্তি দুইবার ভোট দিতে পারবে না' },
            { title: 'ব্লকচেইন রেকর্ড', desc: 'প্রতিটি ভোট ব্লকচেইনে রেকর্ড হবে' },
          ].map(item => (
            <div key={item.title} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
