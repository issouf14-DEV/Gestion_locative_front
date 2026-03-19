export const AUTH = {
  LOGIN: '/auth/login/',
  REGISTER: '/auth/register/',
  LOGOUT: '/auth/logout/',
  REFRESH: '/auth/token/refresh/',
  PASSWORD_RESET: '/auth/password-reset/',
  PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm/',
  PASSWORD_CHANGE: '/auth/password-change/',
  GOOGLE: '/auth/google/',
};

export const USERS = {
  ME: '/users/me/',
  LIST: '/users/',
  LOCATAIRES: '/users/locataires/',
  BY_ID: (id) => `/users/${id}/`,
  STATUS: (id) => `/users/${id}/update_status/`,
  PROFILE: (id) => `/users/${id}/profile/`,
};

export const PROPERTIES = {
  LIST: '/properties/maisons/',
  DISPONIBLES: '/properties/maisons/disponibles/',
  BY_ID: (id) => `/properties/maisons/${id}/`,
  IMAGES: (id) => `/properties/maisons/${id}/ajouter_images/`,
  STATUT: (id) => `/properties/maisons/${id}/changer_statut/`,
};

export const RENTALS = {
  LIST: '/rentals/',
  MA_LOCATION: '/rentals/ma_location/',
  BY_ID: (id) => `/rentals/${id}/`,
  RENOUVELER: (id) => `/rentals/${id}/renouveler/`,
  RESILIER: (id) => `/rentals/${id}/resilier/`,
  ACTIVES: '/rentals/actives/',
  EXPIRANT: '/rentals/expirant/',
  STATS: '/rentals/statistiques/',
};

export const BILLING = {
  COMPTEURS: '/billing/compteurs/',
  COMPTEUR_BY_ID: (id) => `/billing/compteurs/${id}/`,
  COMPTEUR_ASSIGNER: '/billing/compteurs/assigner/',
  COMPTEUR_LIBERER: (id) => `/billing/compteurs/${id}/liberer/`,
  COMPTEURS_PAR_LOCATAIRE: '/billing/compteurs/par_locataire/',
  FACTURES: '/billing/factures/',
  FACTURE_BY_ID: (id) => `/billing/factures/${id}/`,
  REPARTIR: '/billing/factures/repartir/',
  FACTURE_NOTIF: (id) => `/billing/factures/${id}/envoyer_notification/`,
  FACTURE_WHATSAPP: (id) => `/billing/factures/${id}/lien_whatsapp/`,
  FACTURES_WHATSAPP_MOIS: '/billing/factures/liens_whatsapp_mois/',
  FACTURE_PDF: (id) => `/billing/factures/${id}/telecharger_pdf/`,
  RAPPORT_MENSUEL: '/billing/factures/rapport_mensuel/',
  FACTURES_COLLECTIVES: '/billing/factures-collectives/',
  RAPPELS_WHATSAPP: '/billing/rappels-loyer/envoyer_whatsapp/',
  RAPPELS_EMAIL: '/billing/rappels-loyer/envoyer_email/',
  RAPPELS_TOUS_CANAUX: '/billing/rappels-loyer/envoyer_tous_canaux/',
  RAPPELS_LIENS_MOIS: '/billing/rappels-loyer/liens_whatsapp_mois/',
  RAPPELS_TOUS: '/billing/rappels-loyer/envoyer_rappels_tous/',
  INDEX_COMPTEURS: '/billing/index-compteurs/',
  GENERER_LOYERS: '/billing/factures/generer_loyers/',
};

export const PAYMENTS = {
  LIST: '/payments/paiements/',
  BY_ID: (id) => `/payments/paiements/${id}/`,
  MES_PAIEMENTS: '/payments/paiements/mes_paiements/',
  EN_ATTENTE: '/payments/paiements/en_attente/',
  VALIDER: (id) => `/payments/paiements/${id}/valider/`,
  REJETER: (id) => `/payments/paiements/${id}/rejeter/`,
  STATS: '/payments/paiements/statistiques/',
  ENCAISSER_LOYER: '/payments/encaissements/encaisser_loyer/',
  ENCAISSER_FACTURE: '/payments/encaissements/encaisser_facture/',
  ENCAISSER_MULTIPLE: '/payments/encaissements/encaisser_multiple/',
  FACTURES_IMPAYEES: '/payments/encaissements/factures_impayees/',
  RESUME_MOIS: '/payments/encaissements/resume_mois/',
};

export const EXPENSES = {
  LIST: '/expenses/',
  BY_ID: (id) => `/expenses/${id}/`,
};

export const NOTIFICATIONS = {
  LIST: '/notifications/',
  RECENTES: '/notifications/recentes/',
  NON_LUES: '/notifications/non_lues/',
  MARQUER_LUE: (id) => `/notifications/${id}/marquer_lue/`,
  MARQUER_TOUTES: '/notifications/marquer_toutes_lues/',
  ENVOYER: '/notifications/envoyer/',
  ENVOYER_TOUS: '/notifications/envoyer_a_tous_locataires/',
  SUPPRIMER_LUES: '/notifications/supprimer_lues/',
  BY_ID: (id) => `/notifications/${id}/`,
};

export const RESERVATIONS = {
  LIST: '/reservations/',
  BY_ID: (id) => `/reservations/${id}/`,
};

export const DASHBOARD = {
  ADMIN: '/dashboard/admin/',
  LOCATAIRE: '/dashboard/locataire/',
};
