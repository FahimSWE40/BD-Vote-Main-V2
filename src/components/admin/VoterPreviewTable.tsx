import { memo, useState, useCallback, useMemo } from 'react';
import { X, Edit2, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ProcessedVoter {
  id: string;
  voterId: string;
  fullName: string;
  photoUrl: string;
  confidence: number;
  isEditing?: boolean;
  hasError?: boolean;
}

interface VoterPreviewTableProps {
  voters: ProcessedVoter[];
  onUpdate: (id: string, data: Partial<ProcessedVoter>) => void;
  onRemove: (id: string) => void;
  onToggleEdit: (id: string) => void;
}

// Memoized confidence badge - wrapped in forwardRef to fix ref warning
const ConfidenceBadge = memo(function ConfidenceBadge({ confidence }: { confidence: number }) {
  const variant = confidence >= 80 ? 'default' : confidence >= 50 ? 'secondary' : 'destructive';
  const label = confidence >= 80 ? 'ভালো' : confidence >= 50 ? 'মধ্যম' : 'দুর্বল';
  
  return (
    <Badge variant={variant}>
      {label} ({confidence.toFixed(0)}%)
    </Badge>
  );
});


// Memoized table row
const VoterRow = memo(function VoterRow({
  voter,
  editingData,
  onEditingDataChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
}: {
  voter: ProcessedVoter;
  editingData: { voterId: string; fullName: string } | undefined;
  onEditingDataChange: (data: { voterId: string; fullName: string }) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <TableRow className={cn(voter.hasError && "bg-destructive/5")}>
      <TableCell className="p-1.5 sm:p-2 md:p-4">
        <div className="size-8 sm:size-10 md:size-12 rounded-md overflow-hidden border border-border">
          <img 
            src={voter.photoUrl} 
            alt="ID Card"
            className="size-full object-cover"
            loading="lazy"
          />
        </div>
      </TableCell>
      
      <TableCell className="p-1.5 sm:p-2 md:p-4">
        {voter.isEditing ? (
          <Input
            value={editingData?.fullName || ''}
            onChange={(e) => onEditingDataChange({ 
              ...editingData!, 
              fullName: e.target.value 
            })}
            className="max-w-[120px] sm:max-w-[180px] text-xs sm:text-sm h-7 sm:h-9"
            placeholder="নাম"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-1">
            {!voter.fullName && <AlertTriangle className="size-3 text-yellow-500 shrink-0" />}
            <span className={cn(
              "text-xs sm:text-sm line-clamp-1 sm:line-clamp-2",
              !voter.fullName && "text-muted-foreground italic"
            )}>
              {voter.fullName || 'নাম পাওয়া যায়নি'}
            </span>
          </div>
        )}
      </TableCell>
      
      <TableCell className="p-1.5 sm:p-2 md:p-4">
        {voter.isEditing ? (
          <Input
            value={editingData?.voterId || ''}
            onChange={(e) => onEditingDataChange({ 
              ...editingData!, 
              voterId: e.target.value 
            })}
            className="max-w-[80px] sm:max-w-[120px] text-xs sm:text-sm h-7 sm:h-9"
            placeholder="আইডি"
          />
        ) : (
          <div className="flex items-center gap-1">
            {!voter.voterId && <AlertTriangle className="size-3 text-yellow-500 shrink-0" />}
            <code className={cn(
              "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-muted truncate max-w-[60px] sm:max-w-[100px]",
              !voter.voterId && "text-muted-foreground italic"
            )}>
              {voter.voterId || 'N/A'}
            </code>
          </div>
        )}
      </TableCell>
      
      
      <TableCell className="hidden md:table-cell p-1.5 sm:p-2 md:p-4">
        <ConfidenceBadge confidence={voter.confidence} />
      </TableCell>
      
      <TableCell className="text-right p-1.5 sm:p-2 md:p-4">
        <div className="flex items-center justify-end gap-0.5">
          {voter.isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 sm:size-7 md:size-8"
                onClick={onSaveEdit}
              >
                <Save className="size-3 sm:size-3.5 md:size-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 sm:size-7 md:size-8"
                onClick={onCancelEdit}
              >
                <X className="size-3 sm:size-3.5 md:size-4 text-muted-foreground" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 sm:size-7 md:size-8"
                onClick={onStartEdit}
              >
                <Edit2 className="size-3 sm:size-3.5 md:size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 sm:size-7 md:size-8"
                onClick={onRemove}
              >
                <X className="size-3 sm:size-3.5 md:size-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

export const VoterPreviewTable = memo(function VoterPreviewTable({
  voters,
  onUpdate,
  onRemove,
  onToggleEdit,
}: VoterPreviewTableProps) {
  const [editingData, setEditingData] = useState<Record<string, { voterId: string; fullName: string }>>({});

  const handleStartEdit = useCallback((voter: ProcessedVoter) => {
    setEditingData(prev => ({
      ...prev,
      [voter.id]: { voterId: voter.voterId, fullName: voter.fullName },
    }));
    onToggleEdit(voter.id);
  }, [onToggleEdit]);

  const handleSaveEdit = useCallback((id: string) => {
    const data = editingData[id];
    if (data) {
      onUpdate(id, data);
    }
    onToggleEdit(id);
    setEditingData(prev => {
      const newData = { ...prev };
      delete newData[id];
      return newData;
    });
  }, [editingData, onUpdate, onToggleEdit]);

  const handleCancelEdit = useCallback((id: string) => {
    setEditingData(prev => {
      const newData = { ...prev };
      delete newData[id];
      return newData;
    });
    onToggleEdit(id);
  }, [onToggleEdit]);

  const tableRows = useMemo(() => (
    voters.map((voter) => (
      <VoterRow
        key={voter.id}
        voter={voter}
        editingData={editingData[voter.id]}
        onEditingDataChange={(data) => setEditingData(prev => ({ ...prev, [voter.id]: data }))}
        onStartEdit={() => handleStartEdit(voter)}
        onSaveEdit={() => handleSaveEdit(voter.id)}
        onCancelEdit={() => handleCancelEdit(voter.id)}
        onRemove={() => onRemove(voter.id)}
      />
    ))
  ), [voters, editingData, handleStartEdit, handleSaveEdit, handleCancelEdit, onRemove]);

  if (voters.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>কোনো ভোটার প্রসেস করা হয়নি</p>
        <p className="text-sm mt-1">প্রথমে আইডি কার্ডের ছবি আপলোড করুন</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md sm:rounded-lg overflow-x-auto -mx-3 sm:mx-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[50px] sm:w-[60px] md:w-[80px] text-xs">ছবি</TableHead>
            <TableHead className="min-w-[100px] sm:min-w-[120px] text-xs">নাম</TableHead>
            <TableHead className="min-w-[80px] sm:min-w-[100px] text-xs">আইডি</TableHead>
            <TableHead className="hidden md:table-cell w-[80px] sm:w-[100px] text-xs">OCR</TableHead>
            <TableHead className="w-[60px] sm:w-[80px] md:w-[100px] text-right text-xs">অ্যাকশন</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableRows}
        </TableBody>
      </Table>
    </div>
  );
});
