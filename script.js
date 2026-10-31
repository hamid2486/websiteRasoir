/* =============================================================
   LANDING PAGE — RASOIR ÉLECTRIQUE DE HAUTE PRÉCISION
   Fichier 3/3 : script.js (interactivité de la page)
   -------------------------------------------------------------
   Ce fichier gère :
   1. L'année automatique du copyright
   2. L'ombre de la navbar au défilement
   3. Le menu hamburger (mobile)
   4. L'apparition douce des blocs au défilement (reveal)
   5. La fenêtre modale (ouverture / fermeture)
   6. La validation du formulaire + notification toast
============================================================ */


/* -------------------------------------------------------------
   0. CONFIGURATION
   Numéro WhatsApp qui reçoit les commandes.
   Format international, SANS "+", SANS espaces ni tirets.
   Exemple : Maroc 06 61 47 40 50  →  '212661474050'
------------------------------------------------------------- */
const ORDER_WHATSAPP = '212661474050';


/* -------------------------------------------------------------
   1. COPYRIGHT : année automatique
   Évite de devoir changer "2026" à la main chaque année.
------------------------------------------------------------- */
document.getElementById('year').textContent = new Date().getFullYear();


/* -------------------------------------------------------------
   2. NAVBAR : ombre au défilement
   On écoute le défilement de la page ; si l'utilisateur a
   scrollé de plus de 20px, on ajoute la classe "scrolled"
   (une ombre apparaît alors grâce à style.css).
------------------------------------------------------------- */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});


/* -------------------------------------------------------------
   3. MENU HAMBURGER (mobile)
   Un simple bouton qui affiche / masque la liste des liens.
------------------------------------------------------------- */
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');

hamburger.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');   // Ajoute/retire .open
  hamburger.setAttribute('aria-expanded', isOpen); // Accessibilité
});

// Quand on clique sur un lien du menu, on referme le menu
nav.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});


/* -------------------------------------------------------------
   4. REVEAL : apparition des blocs au défilement
   On utilise l'IntersectionObserver (API native du navigateur)
   pour détecter quand un élément .reveal entre à l'écran.
------------------------------------------------------------- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {           // L'élément est visible...
      entry.target.classList.add('visible'); // ...on l'anime
      observer.unobserve(entry.target);      // ...une seule fois
    }
  });
}, { threshold: 0.15 });   // Déclenche à 15% de visibilité

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));


/* -------------------------------------------------------------
   5. FENÊTRE MODALE (modal)
   Tous les éléments portant data-open-modal ouvrent la modale,
   tous ceux portant data-close-modal la ferment.
------------------------------------------------------------- */
const modal = document.getElementById('modal');

// Ouvrir la modale
function openModal(title, text, icon = '✅') {
  // Permet de personnaliser le contenu (commande, mentions légales…)
  if (title) document.getElementById('modalTitle').textContent = title;
  if (text)  document.getElementById('modalText').innerHTML = text;
  document.getElementById('modalIcon').textContent = icon;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';  // Bloque le défilement arrière
}

// Fermer la modale
function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';        // Réautorise le défilement
  document.getElementById('modalExtra').innerHTML = '';  // Nettoie le lien de secours
}

// Branchement : boutons "Commander maintenant" qui ouvrent la modale
document.querySelectorAll('[data-open-modal]').forEach(btn => {
  btn.addEventListener('click', () => openModal());
});

// Branchement : liens légaux (CGV, confidentialité, mentions légales).
// Le contenu vit dans des <template> de index.html : rien n'est inventé
// ici, et le texte reste modifiable sans toucher au JavaScript.
const LEGAL_TITLES = {
  mentions: 'Mentions légales',
  cgv:      'Conditions de vente',
  privacy:  'Confidentialité & cookies',
};

document.querySelectorAll('[data-legal]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tpl = document.getElementById('legal-' + link.dataset.legal);
    if (!tpl) return;
    openModal(LEGAL_TITLES[link.dataset.legal], tpl.innerHTML, 'ℹ️');
  });
});

// Branchement : fermeture (bouton ✕, voile derrière, bouton "Parfait")
modal.querySelectorAll('[data-close-modal]').forEach(el => {
  el.addEventListener('click', closeModal);
});

// Fermeture aussi avec la touche Échap (confort d'utilisation)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});


/* -------------------------------------------------------------
   6. FORMULAIRE DE COMMANDE : validation + toast + modale
   Validation "native-friendly" mais personnalisée visuellement :
   on vérifie chaque champ, on affiche un message d'erreur en
   français, puis on simule l'envoi de la commande.
------------------------------------------------------------- */

// Raccourci : afficher une notification toast
const toast = document.getElementById('toast');
let toastTimer;   // Pour pouvoir annuler un toast précédent

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = 'toast show ' + type;   // .show l'affiche (animation CSS)

  // Masquer automatiquement après 3,5 secondes
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = 'toast ' + type;      // Retire .show → animation retour
  }, 3500);
}

// Expression régulière simple pour vérifier un e-mail
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Expression régulière pour un numéro de téléphone français (≈) :
const telRegex = /^(?:\+?\d{1,3}[\s.-]?)?(?:0[1-9]|\d{2}[\s.-]?)?[\d\s.-]{8,12}$/;

// Afficher / masquer le message d'erreur sous un champ
function setError(input, message) {
  const field = input.closest('.field');
  const error = field.querySelector('.field__error');
  field.classList.toggle('invalid', !!message);   // Bordure rouge si message
  error.textContent = message || '';              // Vide si pas d'erreur
}

// Fonction de validation de l'ensemble du formulaire
function validateForm(form) {
  let isValid = true;

  const nom   = form.nom;
  const email = form.email;
  const tel   = form.tel;
  const cgv   = form.cgv;

  // --- Nom complet (au moins 2 mots, ex : "Jean Dupont") ---
  const nomOk = nom.value.trim().split(/\s+/).length >= 2 && nom.value.trim().length >= 3;
  setError(nom, nomOk ? '' : 'Merci d’indiquer votre nom et prénom.');
  isValid = isValid && nomOk;

  // --- E-mail ---
  const emailOk = emailRegex.test(email.value.trim());
  setError(email, emailOk ? '' : 'Adresse e-mail invalide (ex : vous@exemple.com).');
  isValid = isValid && emailOk;

  // --- Téléphone ---
  const telOk = telRegex.test(tel.value.trim());
  setError(tel, telOk ? '' : 'Numéro de téléphone invalide (ex : 06 12 34 56 78).');
  isValid = isValid && telOk;

  // --- Conditions (case à cocher) ---
  if (!cgv.checked) {
    showToast('Veuillez accepter les conditions de vente.', 'error');
    isValid = false;
  }

  return isValid;
}

// Soumission du formulaire → envoi réel de la commande via WhatsApp
const form = document.getElementById('orderForm');

// Construit le message pré-rempli envoyé sur WhatsApp
function buildWhatsAppUrl() {
  const nom   = form.nom.value.trim();
  const tel   = form.tel.value.trim();
  const email = form.email.value.trim();
  const qte   = form.qte.value;

  // Le prix est lu directement dans l'option choisie : il reste
  // toujours synchronisé avec les tarifs affichés dans le <select>.
  const option = form.qte.options[form.qte.selectedIndex];
  const prix   = (option.textContent.match(/(\d+,\d{2})\s*€/) || [])[1];

  const lignes = [
    'Nouvelle commande — PRECIVA X1',
    `Nom : ${nom}`,
    `Téléphone : ${tel}`,
    `E-mail : ${email}`,
    `Quantité : ${qte}${prix ? ` (${prix} €)` : ''}`,
  ];

  return 'https://wa.me/' + ORDER_WHATSAPP + '?text=' + encodeURIComponent(lignes.join('\n'));
}

form.addEventListener('submit', (e) => {
  e.preventDefault();   // Empêche le rechargement de la page

  if (!validateForm(form)) {
    showToast('Veuillez corriger les champs en rouge.', 'error');
    return;             // On s'arrête : formulaire invalide
  }

  // --- Formulaire valide : on prépare la commande WhatsApp ---
  const url  = buildWhatsAppUrl();
  const nom  = form.nom.value.trim().split(/\s+/)[0];   // Prénom
  const qte  = form.qte.value;

  // Ouvre WhatsApp (application ou WhatsApp Web) dans un nouvel onglet
  const win = window.open(url, '_blank', 'noopener');

  if (win) {
    // Ouverture réussie : on guide le client vers la dernière étape
    showToast('Dernière étape : envoyez le message WhatsApp ✅', 'success');
    form.reset();   // Vide le formulaire pour une prochaine utilisation
  } else {
    // Pop-up bloquée : on affiche un lien cliquable de secours
    openModal(
      'Dernière étape',
      `Merci ${nom} ! Votre fenêtre WhatsApp n'a pas pu s'ouvrir.<br>
       Cliquez sur le bouton ci-dessous pour envoyer votre commande
       de <strong>${qte} × PRECIVA X1</strong>.`
    );
    document.getElementById('modalExtra').innerHTML =
      `<a class="btn btn--primary btn--block" href="${url}" target="_blank" rel="noopener">
         Ouvrir WhatsApp et envoyer la commande
       </a>`;
  }
});

// Bonus : on retire l'erreur dès que l'utilisateur corrige un champ
form.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', () => setError(input, ''));
});
