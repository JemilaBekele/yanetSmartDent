'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface ModalProps {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  description,
  isOpen,
  onClose,
  children,
  size = 'md'
}) => {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };
  const sizeClasses = {
    sm: 'max-w-xl',
    md: 'max-w-2xl',
    lg: 'max-w-3xl',
    xl: 'max-w-4xl',
    xxl: 'max-w-6xl'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent className={sizeClasses[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
};
