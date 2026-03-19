import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openWhatsApp } from '@/lib/utils/whatsapp';

export default function WhatsAppButton({ phone, message, variant = 'outline', size = 'sm', children }) {
  const handleClick = () => {
    if (!phone) return;
    openWhatsApp(phone, message);
  };

  return (
    <Button onClick={handleClick} variant={variant} size={size} disabled={!phone}>
      <MessageCircle className="w-4 h-4 mr-2" />
      {children || 'WhatsApp'}
    </Button>
  );
}
