"use client";

import { ReportIssueForm } from "@/components/dashboard/ReportIssueForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReportIssueDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReportIssueDialog({ open, onOpenChange }: ReportIssueDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sorun Bildir</DialogTitle>
          <DialogDescription>
            Başlık, konu ve açıklama ile geri bildiriminizi iletebilir; isterseniz ekran
            görüntüsü ekleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <ReportIssueForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
