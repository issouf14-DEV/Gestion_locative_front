export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount)) + ' FCFA';
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatDateLong = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatMonthYear = (mois, annee) => {
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${monthNames[mois - 1]} ${annee}`;
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return formatDate(date);
};

export const getInitials = (nom, prenoms) => {
  const n = nom ? nom.charAt(0).toUpperCase() : '';
  const p = prenoms ? prenoms.charAt(0).toUpperCase() : '';
  return `${n}${p}` || '?';
};

export const MOIS = [
  { value: '1', label: 'Janvier' },
  { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' },
  { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' },
  { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];

export const getCurrentMoisAnnee = () => {
  const now = new Date();
  return { mois: now.getMonth() + 1, annee: now.getFullYear() };
};

export const formatPhone = (phone) => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('225')) {
    const match = cleaned.match(/^(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (match) return `+${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]} ${match[6]}`;
  } else if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (match) return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
  }

  return phone;
};

export const getStatusColor = (status, type = 'default') => {
  const statusMap = {
    facture: {
      IMPAYEE: 'destructive',
      PAYEE_PARTIELLE: 'warning',
      PAYEE: 'success',
    },
    paiement: {
      EN_ATTENTE: 'warning',
      VALIDE: 'success',
      REJETE: 'destructive',
    },
    location: {
      ACTIVE: 'success',
      EXPIREE: 'secondary',
      RESILLIEE: 'destructive',
    },
    maison: {
      DISPONIBLE: 'success',
      LOUEE: 'secondary',
      EN_MAINTENANCE: 'warning',
      INDISPONIBLE: 'destructive',
    },
    user: {
      ACTIF: 'success',
      INACTIF: 'secondary',
      SUSPENDU: 'destructive',
    },
  };

  return statusMap[type]?.[status] || 'default';
};

export const getStatusLabel = (status, type = 'default') => {
  const labelMap = {
    facture: {
      IMPAYEE: 'Impayée',
      PAYEE_PARTIELLE: 'Payée partiellement',
      PAYEE: 'Payée',
    },
    paiement: {
      EN_ATTENTE: 'En attente',
      VALIDE: 'Validé',
      REJETE: 'Rejeté',
    },
    location: {
      ACTIVE: 'Active',
      EXPIREE: 'Expirée',
      RESILLIEE: 'Résiliée',
    },
    maison: {
      DISPONIBLE: 'Disponible',
      LOUEE: 'Louée',
      EN_MAINTENANCE: 'En maintenance',
      INDISPONIBLE: 'Indisponible',
    },
    user: {
      ACTIF: 'Actif',
      INACTIF: 'Inactif',
      SUSPENDU: 'Suspendu',
    },
  };

  return labelMap[type]?.[status] || status;
};

export const daysBetween = (date1, date2 = new Date()) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const truncate = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
